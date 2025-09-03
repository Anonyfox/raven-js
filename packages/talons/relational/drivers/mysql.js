/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file MySQL driver implementation using native protocol.
 *
 * Implements MySQL wire protocol 4.1+ with authentication, TLS support,
 * and both text/binary protocol handling. Provides the DriverConn
 * interface for the core client system.
 */

import { createHash } from "node:crypto";
import { connect as netConnect } from "node:net";
import { connect as tlsConnect } from "node:tls";
import { normalizeError } from "../core/errors.js";
import { generateId } from "../core/utils.js";

/**
 * @typedef {Object} MySQLConfig
 * @property {string} host - Database host
 * @property {number} port - Database port
 * @property {string} user - Username
 * @property {string} password - Password
 * @property {string} database - Database name
 * @property {string} tls - TLS mode ('require'|'verify'|'disable')
 * @property {number} connectTimeoutMs - Connection timeout
 */

/**
 * MySQL packet types
 */
const PACKET_TYPES = {
	OK: 0x00,
	EOF: 0xfe,
	ERR: 0xff,
	LOCAL_INFILE: 0xfb,
};

/**
 * MySQL command types
 */
const COMMANDS = {
	SLEEP: 0x00,
	QUIT: 0x01,
	INIT_DB: 0x02,
	QUERY: 0x03,
	FIELD_LIST: 0x04,
	CREATE_DB: 0x05,
	DROP_DB: 0x06,
	REFRESH: 0x07,
	SHUTDOWN: 0x08,
	STATISTICS: 0x09,
	PROCESS_INFO: 0x0a,
	CONNECT: 0x0b,
	PROCESS_KILL: 0x0c,
	DEBUG: 0x0d,
	PING: 0x0e,
	TIME: 0x0f,
	DELAYED_INSERT: 0x10,
	CHANGE_USER: 0x11,
	STMT_PREPARE: 0x16,
	STMT_EXECUTE: 0x17,
	STMT_CLOSE: 0x19,
	STMT_RESET: 0x1a,
};

/**
 * MySQL connection implementation
 */
class MySQLConnection {
	/**
	 * @param {Object} socket - Network socket
	 * @param {MySQLConfig} config - Connection configuration
	 */
	constructor(socket, config) {
		this.socket = socket;
		this.config = config;
		this.sequenceId = 0;
		this.serverCapabilities = 0;
		this.characterSet = 0;
		this.statements = new Map();
		this.nextStatementId = 1;

		// Message handling
		this.messageBuffer = Buffer.alloc(0);
		this.pendingPackets = [];
		this.waitingForResponse = null;

		// Setup socket handlers
		this.socket.on("data", (data) => this._handleData(data));
		this.socket.on("error", (error) => this._handleError(error));
		this.socket.on("close", () => this._handleClose());
	}

	/**
	 * Execute a simple query
	 * @param {string} sql - SQL query
	 * @param {Array} params - Query parameters
	 * @param {Object} options - Query options
	 * @returns {Promise<{rows: Array, rowCount: number, columns: Array}>} Query result
	 */
	async simpleQuery(sql, params = [], options = {}) {
		if (params.length === 0) {
			// Simple text query
			return await this._sendQuery(sql);
		} else {
			// Use prepared statement for parameters
			const stmt = await this.prepare(sql, options);
			try {
				return await stmt.execute(params);
			} finally {
				await stmt.close();
			}
		}
	}

	/**
	 * Stream query results
	 * @param {string} sql - SQL query
	 * @param {Array} params - Query parameters
	 * @param {Object} options - Query options
	 * @returns {AsyncIterable<Array>} Async iterable of rows
	 */
	async *streamQuery(sql, params = [], options = {}) {
		// MySQL doesn't have native cursor support, so we simulate streaming
		// by fetching in batches using LIMIT/OFFSET
		const batchSize = options.batchSize || 1000;
		let offset = 0;
		let hasMore = true;

		while (hasMore) {
			const batchSql = `${sql} LIMIT ${batchSize} OFFSET ${offset}`;
			const result = await this.simpleQuery(batchSql, params, options);

			if (result.rows.length === 0) {
				hasMore = false;
			} else {
				for (const row of result.rows) {
					yield row;
				}
				hasMore = result.rows.length === batchSize;
				offset += batchSize;
			}
		}
	}

	/**
	 * Prepare a statement
	 * @param {string} sql - SQL query
	 * @param {Object} options - Prepare options
	 * @returns {Promise<{id: string, columns: Array, close: Function}>} Prepared statement
	 */
	async prepare(sql, options = {}) {
		const statementId = this.nextStatementId++;

		// Send COM_STMT_PREPARE
		await this._sendCommand(COMMANDS.STMT_PREPARE, Buffer.from(sql, "utf8"));

		// Wait for prepare response
		const response = await this._waitForPacket();

		if (response[0] === PACKET_TYPES.ERR) {
			throw this._parseErrorPacket(response);
		}

		// Parse prepare response
		const prepareResponse = this._parsePrepareResponse(response);

		// Read parameter definitions if any
		if (prepareResponse.paramCount > 0) {
			for (let i = 0; i < prepareResponse.paramCount; i++) {
				await this._waitForPacket(); // Parameter definition
			}
			await this._waitForPacket(); // EOF packet
		}

		// Read column definitions if any
		const columns = [];
		if (prepareResponse.columnCount > 0) {
			for (let i = 0; i < prepareResponse.columnCount; i++) {
				const columnPacket = await this._waitForPacket();
				columns.push(this._parseColumnDefinition(columnPacket));
			}
			await this._waitForPacket(); // EOF packet
		}

		// Store statement info
		const statement = {
			id: statementId,
			serverId: prepareResponse.statementId,
			sql,
			columns,
			paramCount: prepareResponse.paramCount,
		};
		this.statements.set(statementId, statement);

		return {
			id: statementId,
			columns,
			execute: (params) => this._executeStatement(statementId, params),
			stream: (params) => this._streamStatement(statementId, params),
			close: () => this._closeStatement(statementId),
		};
	}

	/**
	 * Begin transaction
	 * @param {Object} options - Transaction options
	 */
	async begin(options = {}) {
		let sql = "START TRANSACTION";

		if (options.isolationLevel) {
			await this.simpleQuery(
				`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`,
			);
		}

		if (options.readOnly) {
			sql += " READ ONLY";
		}

		await this.simpleQuery(sql);
	}

	/**
	 * Commit transaction
	 */
	async commit() {
		await this.simpleQuery("COMMIT");
	}

	/**
	 * Rollback transaction
	 */
	async rollback() {
		await this.simpleQuery("ROLLBACK");
	}

	/**
	 * Close the connection
	 */
	async close() {
		if (this.socket && !this.socket.destroyed) {
			// Send COM_QUIT
			await this._sendCommand(COMMANDS.QUIT, Buffer.alloc(0));
			this.socket.end();
		}
	}

	/**
	 * Send a query command
	 * @param {string} sql - SQL query
	 * @returns {Promise<Object>} Query result
	 * @private
	 */
	async _sendQuery(sql) {
		// Send COM_QUERY
		await this._sendCommand(COMMANDS.QUERY, Buffer.from(sql, "utf8"));

		// Read response
		const firstPacket = await this._waitForPacket();

		if (firstPacket[0] === PACKET_TYPES.OK) {
			// Non-SELECT query
			const okPacket = this._parseOkPacket(firstPacket);
			return {
				rows: [],
				rowCount: okPacket.affectedRows,
				columns: [],
			};
		}

		if (firstPacket[0] === PACKET_TYPES.ERR) {
			throw this._parseErrorPacket(firstPacket);
		}

		// SELECT query - read column definitions
		const columnCount = this._readLengthEncodedInteger(firstPacket, 0).value;
		const columns = [];

		for (let i = 0; i < columnCount; i++) {
			const columnPacket = await this._waitForPacket();
			columns.push(this._parseColumnDefinition(columnPacket));
		}

		// Read EOF packet after column definitions
		await this._waitForPacket();

		// Read data rows
		const rows = [];
		while (true) {
			const packet = await this._waitForPacket();

			if (packet[0] === PACKET_TYPES.EOF) {
				break;
			}

			if (packet[0] === PACKET_TYPES.ERR) {
				throw this._parseErrorPacket(packet);
			}

			rows.push(this._parseTextRow(packet, columnCount));
		}

		return {
			rows,
			rowCount: rows.length,
			columns,
		};
	}

	/**
	 * Execute prepared statement
	 * @param {number} statementId - Statement ID
	 * @param {Array} params - Parameters
	 * @returns {Promise<Object>} Query result
	 * @private
	 */
	async _executeStatement(statementId, params) {
		const statement = this.statements.get(statementId);
		if (!statement) {
			throw new Error("Statement not found");
		}

		// Build execute packet
		const executePacket = this._buildExecutePacket(statement.serverId, params);

		// Send COM_STMT_EXECUTE
		await this._sendCommand(COMMANDS.STMT_EXECUTE, executePacket);

		// Read response
		const firstPacket = await this._waitForPacket();

		if (firstPacket[0] === PACKET_TYPES.OK) {
			// Non-SELECT statement
			const okPacket = this._parseOkPacket(firstPacket);
			return {
				rows: [],
				rowCount: okPacket.affectedRows,
				columns: statement.columns,
			};
		}

		if (firstPacket[0] === PACKET_TYPES.ERR) {
			throw this._parseErrorPacket(firstPacket);
		}

		// SELECT statement - read binary result set
		const columnCount = this._readLengthEncodedInteger(firstPacket, 0).value;

		// Skip column definitions (we already have them)
		for (let i = 0; i < columnCount; i++) {
			await this._waitForPacket();
		}
		await this._waitForPacket(); // EOF packet

		// Read binary data rows
		const rows = [];
		while (true) {
			const packet = await this._waitForPacket();

			if (packet[0] === PACKET_TYPES.EOF) {
				break;
			}

			if (packet[0] === PACKET_TYPES.ERR) {
				throw this._parseErrorPacket(packet);
			}

			rows.push(this._parseBinaryRow(packet, statement.columns));
		}

		return {
			rows,
			rowCount: rows.length,
			columns: statement.columns,
		};
	}

	/**
	 * Stream prepared statement results
	 * @param {number} statementId - Statement ID
	 * @param {Array} params - Parameters
	 * @returns {AsyncIterable<Array>} Row stream
	 * @private
	 */
	async *_streamStatement(statementId, params) {
		// For prepared statements, we execute once and stream the results
		const result = await this._executeStatement(statementId, params);
		for (const row of result.rows) {
			yield row;
		}
	}

	/**
	 * Close prepared statement
	 * @param {number} statementId - Statement ID
	 * @private
	 */
	async _closeStatement(statementId) {
		const statement = this.statements.get(statementId);
		if (!statement) {
			return;
		}

		this.statements.delete(statementId);

		// Send COM_STMT_CLOSE
		const closePacket = Buffer.alloc(4);
		closePacket.writeUInt32LE(statement.serverId, 0);
		await this._sendCommand(COMMANDS.STMT_CLOSE, closePacket);

		// COM_STMT_CLOSE doesn't send a response
	}

	/**
	 * Send a command packet
	 * @param {number} command - Command type
	 * @param {Buffer} data - Command data
	 * @private
	 */
	async _sendCommand(command, data) {
		const commandByte = Buffer.from([command]);
		const payload = Buffer.concat([commandByte, data]);
		await this._sendPacket(payload);
	}

	/**
	 * Send a packet
	 * @param {Buffer} payload - Packet payload
	 * @private
	 */
	async _sendPacket(payload) {
		const header = Buffer.alloc(4);
		header.writeUIntLE(payload.length, 0, 3);
		header[3] = this.sequenceId++;

		const packet = Buffer.concat([header, payload]);

		return new Promise((resolve, reject) => {
			this.socket.write(packet, (error) => {
				if (error) reject(error);
				else resolve();
			});
		});
	}

	/**
	 * Wait for a packet
	 * @returns {Promise<Buffer>} Packet payload
	 * @private
	 */
	async _waitForPacket() {
		return new Promise((resolve, reject) => {
			if (this.pendingPackets.length > 0) {
				resolve(this.pendingPackets.shift());
				return;
			}

			this.waitingForResponse = (packet) => {
				this.waitingForResponse = null;
				resolve(packet);
			};

			// Set timeout
			const timeout = setTimeout(() => {
				if (this.waitingForResponse) {
					this.waitingForResponse = null;
					reject(new Error("Packet timeout"));
				}
			}, 30000);

			const originalResolve = resolve;
			resolve = (packet) => {
				clearTimeout(timeout);
				originalResolve(packet);
			};
		});
	}

	/**
	 * Handle incoming data
	 * @param {Buffer} data - Raw data
	 * @private
	 */
	_handleData(data) {
		this.messageBuffer = Buffer.concat([this.messageBuffer, data]);

		while (this.messageBuffer.length >= 4) {
			// Read packet header
			const length = this.messageBuffer.readUIntLE(0, 3);
			const sequenceId = this.messageBuffer[3];

			if (this.messageBuffer.length < length + 4) {
				// Not enough data for complete packet
				break;
			}

			// Extract packet payload
			const payload = this.messageBuffer.subarray(4, length + 4);
			this.messageBuffer = this.messageBuffer.subarray(length + 4);

			// Handle packet
			if (this.waitingForResponse) {
				this.waitingForResponse(payload);
			} else {
				this.pendingPackets.push(payload);
			}
		}
	}

	/**
	 * Handle socket error
	 * @param {Error} error - Socket error
	 * @private
	 */
	_handleError(error) {
		if (this.waitingForResponse) {
			this.waitingForResponse = null;
		}
	}

	/**
	 * Handle socket close
	 * @private
	 */
	_handleClose() {
		if (this.waitingForResponse) {
			this.waitingForResponse = null;
		}
	}

	/**
	 * Parse prepare response
	 * @param {Buffer} packet - Response packet
	 * @returns {Object} Prepare response
	 * @private
	 */
	_parsePrepareResponse(packet) {
		let offset = 1; // Skip status byte

		const statementId = packet.readUInt32LE(offset);
		offset += 4;

		const columnCount = packet.readUInt16LE(offset);
		offset += 2;

		const paramCount = packet.readUInt16LE(offset);
		offset += 2;

		// Skip reserved byte
		offset += 1;

		const warningCount = packet.readUInt16LE(offset);

		return {
			statementId,
			columnCount,
			paramCount,
			warningCount,
		};
	}

	/**
	 * Parse column definition
	 * @param {Buffer} packet - Column packet
	 * @returns {Object} Column info
	 * @private
	 */
	_parseColumnDefinition(packet) {
		let offset = 0;

		// Skip catalog, schema, table, org_table
		const catalog = this._readLengthEncodedString(packet, offset);
		offset = catalog.offset;

		const schema = this._readLengthEncodedString(packet, offset);
		offset = schema.offset;

		const table = this._readLengthEncodedString(packet, offset);
		offset = table.offset;

		const orgTable = this._readLengthEncodedString(packet, offset);
		offset = orgTable.offset;

		// Column name
		const name = this._readLengthEncodedString(packet, offset);
		offset = name.offset;

		const orgName = this._readLengthEncodedString(packet, offset);
		offset = orgName.offset;

		// Skip length of fixed-length fields
		offset += 1;

		const characterSet = packet.readUInt16LE(offset);
		offset += 2;

		const columnLength = packet.readUInt32LE(offset);
		offset += 4;

		const type = packet[offset];
		offset += 1;

		const flags = packet.readUInt16LE(offset);
		offset += 2;

		const decimals = packet[offset];

		return {
			name: name.value,
			type,
			flags,
			characterSet,
			columnLength,
			decimals,
		};
	}

	/**
	 * Parse OK packet
	 * @param {Buffer} packet - OK packet
	 * @returns {Object} OK packet info
	 * @private
	 */
	_parseOkPacket(packet) {
		let offset = 1; // Skip OK byte

		const affectedRows = this._readLengthEncodedInteger(packet, offset);
		offset = affectedRows.offset;

		const insertId = this._readLengthEncodedInteger(packet, offset);
		offset = insertId.offset;

		const statusFlags = packet.readUInt16LE(offset);
		offset += 2;

		const warningCount = packet.readUInt16LE(offset);

		return {
			affectedRows: affectedRows.value,
			insertId: insertId.value,
			statusFlags,
			warningCount,
		};
	}

	/**
	 * Parse error packet
	 * @param {Buffer} packet - Error packet
	 * @returns {Error} Parsed error
	 * @private
	 */
	_parseErrorPacket(packet) {
		let offset = 1; // Skip error marker

		const errorCode = packet.readUInt16LE(offset);
		offset += 2;

		// Skip SQL state marker if present
		if (packet[offset] === 0x23) {
			offset += 6; // Skip '#' + 5-char SQL state
		}

		const message = packet.subarray(offset).toString("utf8");

		const error = new Error(message);
		error.code = errorCode;
		error.errno = errorCode;
		return error;
	}

	/**
	 * Parse text protocol row
	 * @param {Buffer} packet - Row packet
	 * @param {number} columnCount - Number of columns
	 * @returns {Array} Row values
	 * @private
	 */
	_parseTextRow(packet, columnCount) {
		const values = [];
		let offset = 0;

		for (let i = 0; i < columnCount; i++) {
			if (packet[offset] === 0xfb) {
				// NULL value
				values.push(null);
				offset += 1;
			} else {
				const str = this._readLengthEncodedString(packet, offset);
				values.push(str.value);
				offset = str.offset;
			}
		}

		return values;
	}

	/**
	 * Parse binary protocol row
	 * @param {Buffer} packet - Row packet
	 * @param {Array} columns - Column definitions
	 * @returns {Array} Row values
	 * @private
	 */
	_parseBinaryRow(packet, columns) {
		let offset = 1; // Skip packet header (0x00)

		// Read NULL bitmap
		const nullBitmapLength = Math.floor((columns.length + 7 + 2) / 8);
		const nullBitmap = packet.subarray(offset, offset + nullBitmapLength);
		offset += nullBitmapLength;

		const values = [];

		for (let i = 0; i < columns.length; i++) {
			const byteIndex = Math.floor((i + 2) / 8);
			const bitIndex = (i + 2) % 8;
			const isNull = (nullBitmap[byteIndex] & (1 << bitIndex)) !== 0;

			if (isNull) {
				values.push(null);
			} else {
				// Read value based on column type
				const result = this._readBinaryValue(packet, offset, columns[i]);
				values.push(result.value);
				offset = result.offset;
			}
		}

		return values;
	}

	/**
	 * Read binary value
	 * @param {Buffer} packet - Packet data
	 * @param {number} offset - Current offset
	 * @param {Object} column - Column definition
	 * @returns {Object} Value and new offset
	 * @private
	 */
	_readBinaryValue(packet, offset, column) {
		// Simplified binary value reading
		// In a full implementation, this would handle all MySQL types
		switch (column.type) {
			case 1: // TINYINT
				return { value: packet.readInt8(offset), offset: offset + 1 };
			case 2: // SMALLINT
				return { value: packet.readInt16LE(offset), offset: offset + 2 };
			case 3: // INT
				return { value: packet.readInt32LE(offset), offset: offset + 4 };
			case 8: // BIGINT
				return { value: packet.readBigInt64LE(offset), offset: offset + 8 };
			case 4: // FLOAT
				return { value: packet.readFloatLE(offset), offset: offset + 4 };
			case 5: // DOUBLE
				return { value: packet.readDoubleLE(offset), offset: offset + 8 };
			default:
				// Default to length-encoded string
				return this._readLengthEncodedString(packet, offset);
		}
	}

	/**
	 * Build execute packet
	 * @param {number} statementId - Server statement ID
	 * @param {Array} params - Parameters
	 * @returns {Buffer} Execute packet
	 * @private
	 */
	_buildExecutePacket(statementId, params) {
		const buffers = [];

		// Statement ID
		const stmtIdBuffer = Buffer.alloc(4);
		stmtIdBuffer.writeUInt32LE(statementId, 0);
		buffers.push(stmtIdBuffer);

		// Flags (0 = no cursor)
		buffers.push(Buffer.from([0]));

		// Iteration count (always 1)
		const iterationBuffer = Buffer.alloc(4);
		iterationBuffer.writeUInt32LE(1, 0);
		buffers.push(iterationBuffer);

		if (params.length > 0) {
			// NULL bitmap
			const nullBitmapLength = Math.floor((params.length + 7) / 8);
			const nullBitmap = Buffer.alloc(nullBitmapLength);

			for (let i = 0; i < params.length; i++) {
				if (params[i] === null || params[i] === undefined) {
					const byteIndex = Math.floor(i / 8);
					const bitIndex = i % 8;
					nullBitmap[byteIndex] |= 1 << bitIndex;
				}
			}
			buffers.push(nullBitmap);

			// New params bound flag
			buffers.push(Buffer.from([1]));

			// Parameter types
			const typeBuffer = Buffer.alloc(params.length * 2);
			for (let i = 0; i < params.length; i++) {
				// Use VARCHAR type for all parameters (simplified)
				typeBuffer.writeUInt16LE(0xfd, i * 2);
			}
			buffers.push(typeBuffer);

			// Parameter values
			for (let i = 0; i < params.length; i++) {
				if (params[i] !== null && params[i] !== undefined) {
					const valueStr = String(params[i]);
					const valueBuffer = Buffer.from(valueStr, "utf8");
					const lengthBuffer = this._writeLengthEncodedInteger(
						valueBuffer.length,
					);
					buffers.push(lengthBuffer);
					buffers.push(valueBuffer);
				}
			}
		}

		return Buffer.concat(buffers);
	}

	/**
	 * Read length-encoded integer
	 * @param {Buffer} buffer - Buffer to read from
	 * @param {number} offset - Start offset
	 * @returns {Object} Value and new offset
	 * @private
	 */
	_readLengthEncodedInteger(buffer, offset) {
		const first = buffer[offset];

		if (first < 0xfb) {
			return { value: first, offset: offset + 1 };
		}

		if (first === 0xfc) {
			return { value: buffer.readUInt16LE(offset + 1), offset: offset + 3 };
		}

		if (first === 0xfd) {
			return { value: buffer.readUIntLE(offset + 1, 3), offset: offset + 4 };
		}

		if (first === 0xfe) {
			return {
				value: buffer.readBigUInt64LE(offset + 1),
				offset: offset + 9,
			};
		}

		// 0xfb = NULL, 0xff = error
		return { value: null, offset: offset + 1 };
	}

	/**
	 * Read length-encoded string
	 * @param {Buffer} buffer - Buffer to read from
	 * @param {number} offset - Start offset
	 * @returns {Object} String value and new offset
	 * @private
	 */
	_readLengthEncodedString(buffer, offset) {
		const length = this._readLengthEncodedInteger(buffer, offset);
		if (length.value === null) {
			return { value: null, offset: length.offset };
		}

		const str = buffer
			.subarray(length.offset, length.offset + length.value)
			.toString("utf8");
		return { value: str, offset: length.offset + length.value };
	}

	/**
	 * Write length-encoded integer
	 * @param {number} value - Value to write
	 * @returns {Buffer} Encoded buffer
	 * @private
	 */
	_writeLengthEncodedInteger(value) {
		if (value < 0xfb) {
			return Buffer.from([value]);
		}

		if (value < 0x10000) {
			const buffer = Buffer.alloc(3);
			buffer[0] = 0xfc;
			buffer.writeUInt16LE(value, 1);
			return buffer;
		}

		if (value < 0x1000000) {
			const buffer = Buffer.alloc(4);
			buffer[0] = 0xfd;
			buffer.writeUIntLE(value, 1, 3);
			return buffer;
		}

		const buffer = Buffer.alloc(9);
		buffer[0] = 0xfe;
		buffer.writeBigUInt64LE(BigInt(value), 1);
		return buffer;
	}
}

/**
 * Connect to MySQL database
 * @param {MySQLConfig} config - Connection configuration
 * @returns {Promise<MySQLConnection>} Database connection
 */
export async function connect(config) {
	const { host, port, user, password, database, tls, connectTimeoutMs } =
		config;

	// Create socket connection
	let socket;
	if (tls === "disable") {
		socket = netConnect({ host, port, timeout: connectTimeoutMs });
	} else {
		const tlsOptions = {
			host,
			port,
			timeout: connectTimeoutMs,
			rejectUnauthorized: tls === "verify",
		};
		socket = tlsConnect(tlsOptions);
	}

	// Wait for connection
	await new Promise((resolve, reject) => {
		socket.once("connect", resolve);
		socket.once("error", reject);
		socket.once("timeout", () => reject(new Error("Connection timeout")));
	});

	const connection = new MySQLConnection(socket, config);

	try {
		// Handle initial handshake
		await connection._handleHandshake(user, password, database);

		return connection;
	} catch (error) {
		socket.destroy();
		throw normalizeError(error, "mysql");
	}
}

/**
 * Validate connection
 * @param {MySQLConnection} connection - Connection to validate
 * @returns {boolean} True if valid
 */
export function validate(connection) {
	return connection && connection.socket && !connection.socket.destroyed;
}
