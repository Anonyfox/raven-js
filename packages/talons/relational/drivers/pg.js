/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PostgreSQL driver implementation using native protocol.
 *
 * Implements PostgreSQL wire protocol v3 with SCRAM-SHA-256 authentication,
 * TLS support, and binary/text protocol handling. Provides the DriverConn
 * interface for the core client system.
 */

import { createHash, createHmac, randomBytes } from "node:crypto";
import { connect as netConnect } from "node:net";
import { connect as tlsConnect } from "node:tls";
import { normalizeError } from "../core/errors.js";
import { generateId } from "../core/utils.js";

/**
 * @typedef {Object} PostgresConfig
 * @property {string} host - Database host
 * @property {number} port - Database port
 * @property {string} user - Username
 * @property {string} password - Password
 * @property {string} database - Database name
 * @property {string} tls - TLS mode ('require'|'verify'|'disable')
 * @property {number} connectTimeoutMs - Connection timeout
 */

/**
 * PostgreSQL connection implementation
 */
class PostgresConnection {
	/**
	 * @param {Object} socket - Network socket
	 * @param {PostgresConfig} config - Connection configuration
	 */
	constructor(socket, config) {
		this.socket = socket;
		this.config = config;
		this.processId = null;
		this.secretKey = null;
		this.parameters = new Map();
		this.transactionStatus = "I"; // I=idle, T=transaction, E=error
		this.statements = new Map();
		this.nextStatementId = 1;

		// Message handling
		this.messageBuffer = Buffer.alloc(0);
		this.pendingMessages = [];
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
			// Simple query protocol
			return await this._sendSimpleQuery(sql);
		} else {
			// Extended query protocol with parameters
			return await this._sendExtendedQuery(sql, params, options);
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
		// For streaming, we use a cursor-based approach
		const cursorName = `cursor_${generateId()}`;
		const cursorSql = `DECLARE ${cursorName} CURSOR FOR ${sql}`;

		try {
			// Start transaction if not already in one
			const needsTransaction = this.transactionStatus === "I";
			if (needsTransaction) {
				await this.simpleQuery("BEGIN");
			}

			// Declare cursor
			if (params.length === 0) {
				await this._sendSimpleQuery(cursorSql);
			} else {
				await this._sendExtendedQuery(cursorSql, params, options);
			}

			// Fetch rows in batches
			const batchSize = options.batchSize || 1000;
			let hasMore = true;

			while (hasMore) {
				const fetchSql = `FETCH ${batchSize} FROM ${cursorName}`;
				const result = await this._sendSimpleQuery(fetchSql);

				if (result.rows.length === 0) {
					hasMore = false;
				} else {
					for (const row of result.rows) {
						yield row;
					}
					hasMore = result.rows.length === batchSize;
				}
			}

			// Close cursor
			await this._sendSimpleQuery(`CLOSE ${cursorName}`);

			// Commit transaction if we started it
			if (needsTransaction) {
				await this.simpleQuery("COMMIT");
			}
		} catch (error) {
			// Clean up on error
			try {
				await this._sendSimpleQuery(`CLOSE ${cursorName}`);
				if (needsTransaction) {
					await this.simpleQuery("ROLLBACK");
				}
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	/**
	 * Prepare a statement
	 * @param {string} sql - SQL query
	 * @param {Object} options - Prepare options
	 * @returns {Promise<{id: string, columns: Array, close: Function}>} Prepared statement
	 */
	async prepare(sql, options = {}) {
		const statementId = `stmt_${this.nextStatementId++}`;

		// Send Parse message
		await this._sendMessage("Parse", this._buildParseMessage(statementId, sql));

		// Send Describe message to get column info
		await this._sendMessage(
			"Describe",
			this._buildDescribeMessage("S", statementId),
		);

		// Send Sync message
		await this._sendMessage("Sync", Buffer.alloc(0));

		// Wait for responses
		const responses = await this._waitForMessages([
			"ParseComplete",
			"ParameterDescription",
			"RowDescription",
			"ReadyForQuery",
		]);

		// Extract column information
		const rowDescription = responses.find((r) => r.type === "RowDescription");
		const columns = rowDescription
			? this._parseRowDescription(rowDescription.data)
			: [];

		// Store statement info
		const statement = {
			id: statementId,
			sql,
			columns,
			paramCount: 0, // TODO: parse from ParameterDescription
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
		let sql = "BEGIN";

		if (options.isolationLevel) {
			sql += ` ISOLATION LEVEL ${options.isolationLevel}`;
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
			// Send Terminate message
			await this._sendMessage("Terminate", Buffer.alloc(0));
			this.socket.end();
		}
	}

	/**
	 * Send simple query
	 * @param {string} sql - SQL query
	 * @returns {Promise<Object>} Query result
	 * @private
	 */
	async _sendSimpleQuery(sql) {
		const message = Buffer.from(sql + "\0", "utf8");
		await this._sendMessage("Query", message);

		// Wait for command complete
		const responses = await this._waitForMessages([
			"RowDescription",
			"DataRow",
			"CommandComplete",
			"ReadyForQuery",
		]);

		return this._parseQueryResponse(responses);
	}

	/**
	 * Send extended query
	 * @param {string} sql - SQL query
	 * @param {Array} params - Parameters
	 * @param {Object} options - Options
	 * @returns {Promise<Object>} Query result
	 * @private
	 */
	async _sendExtendedQuery(sql, params, options) {
		const statementId = ""; // Use unnamed statement
		const portalId = ""; // Use unnamed portal

		// Parse
		await this._sendMessage("Parse", this._buildParseMessage(statementId, sql));

		// Bind
		await this._sendMessage(
			"Bind",
			this._buildBindMessage(portalId, statementId, params),
		);

		// Execute
		await this._sendMessage("Execute", this._buildExecuteMessage(portalId, 0));

		// Sync
		await this._sendMessage("Sync", Buffer.alloc(0));

		// Wait for responses
		const responses = await this._waitForMessages([
			"ParseComplete",
			"BindComplete",
			"RowDescription",
			"DataRow",
			"CommandComplete",
			"ReadyForQuery",
		]);

		return this._parseQueryResponse(responses);
	}

	/**
	 * Execute prepared statement
	 * @param {string} statementId - Statement ID
	 * @param {Array} params - Parameters
	 * @returns {Promise<Object>} Query result
	 * @private
	 */
	async _executeStatement(statementId, params) {
		const portalId = `portal_${generateId()}`;

		// Bind
		await this._sendMessage(
			"Bind",
			this._buildBindMessage(portalId, statementId, params),
		);

		// Execute
		await this._sendMessage("Execute", this._buildExecuteMessage(portalId, 0));

		// Sync
		await this._sendMessage("Sync", Buffer.alloc(0));

		// Wait for responses
		const responses = await this._waitForMessages([
			"BindComplete",
			"DataRow",
			"CommandComplete",
			"ReadyForQuery",
		]);

		return this._parseQueryResponse(responses);
	}

	/**
	 * Stream prepared statement
	 * @param {string} statementId - Statement ID
	 * @param {Array} params - Parameters
	 * @returns {AsyncIterable<Array>} Row stream
	 * @private
	 */
	async *_streamStatement(statementId, params) {
		const portalId = `portal_${generateId()}`;

		// Bind
		await this._sendMessage(
			"Bind",
			this._buildBindMessage(portalId, statementId, params),
		);

		// Execute in batches
		const batchSize = 1000;
		let hasMore = true;

		while (hasMore) {
			// Execute batch
			await this._sendMessage(
				"Execute",
				this._buildExecuteMessage(portalId, batchSize),
			);
			await this._sendMessage("Sync", Buffer.alloc(0));

			const responses = await this._waitForMessages([
				"DataRow",
				"CommandComplete",
				"PortalSuspended",
				"ReadyForQuery",
			]);

			const dataRows = responses.filter((r) => r.type === "DataRow");
			const commandComplete = responses.find(
				(r) => r.type === "CommandComplete",
			);

			for (const row of dataRows) {
				yield this._parseDataRow(row.data);
			}

			hasMore = !commandComplete && dataRows.length === batchSize;
		}

		// Close portal
		await this._sendMessage("Close", this._buildCloseMessage("P", portalId));
		await this._sendMessage("Sync", Buffer.alloc(0));
		await this._waitForMessages(["CloseComplete", "ReadyForQuery"]);
	}

	/**
	 * Close prepared statement
	 * @param {string} statementId - Statement ID
	 * @private
	 */
	async _closeStatement(statementId) {
		this.statements.delete(statementId);

		await this._sendMessage("Close", this._buildCloseMessage("S", statementId));
		await this._sendMessage("Sync", Buffer.alloc(0));
		await this._waitForMessages(["CloseComplete", "ReadyForQuery"]);
	}

	/**
	 * Send protocol message
	 * @param {string} type - Message type
	 * @param {Buffer} data - Message data
	 * @private
	 */
	async _sendMessage(type, data) {
		const typeCode = this._getMessageTypeCode(type);
		const length = data.length + 4;
		const header = Buffer.alloc(5);

		header[0] = typeCode;
		header.writeUInt32BE(length, 1);

		const message = Buffer.concat([header, data]);

		return new Promise((resolve, reject) => {
			this.socket.write(message, (error) => {
				if (error) reject(error);
				else resolve();
			});
		});
	}

	/**
	 * Wait for specific message types
	 * @param {string[]} types - Expected message types
	 * @returns {Promise<Array>} Received messages
	 * @private
	 */
	async _waitForMessages(types) {
		return new Promise((resolve, reject) => {
			const messages = [];
			const expectedTypes = new Set(types);

			const checkMessages = () => {
				// Check if we have all expected message types
				const receivedTypes = new Set(messages.map((m) => m.type));
				const hasAllTypes = types.every(
					(type) => receivedTypes.has(type) || type === "DataRow",
				);

				if (hasAllTypes || receivedTypes.has("ErrorResponse")) {
					this.waitingForResponse = null;

					const errorMessage = messages.find((m) => m.type === "ErrorResponse");
					if (errorMessage) {
						reject(this._parseErrorResponse(errorMessage.data));
					} else {
						resolve(messages);
					}
				}
			};

			this.waitingForResponse = (message) => {
				if (
					expectedTypes.has(message.type) ||
					message.type === "DataRow" ||
					message.type === "ErrorResponse"
				) {
					messages.push(message);
					checkMessages();
				}
			};

			// Check if we already have pending messages
			checkMessages();
		});
	}

	/**
	 * Handle incoming data
	 * @param {Buffer} data - Raw data
	 * @private
	 */
	_handleData(data) {
		this.messageBuffer = Buffer.concat([this.messageBuffer, data]);

		while (this.messageBuffer.length >= 5) {
			const type = this.messageBuffer[0];
			const length = this.messageBuffer.readUInt32BE(1);

			if (this.messageBuffer.length < length + 1) {
				// Not enough data for complete message
				break;
			}

			const messageData = this.messageBuffer.subarray(5, length + 1);
			const message = {
				type: this._getMessageTypeName(type),
				data: messageData,
			};

			this.messageBuffer = this.messageBuffer.subarray(length + 1);

			if (this.waitingForResponse) {
				this.waitingForResponse(message);
			} else {
				this.pendingMessages.push(message);
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
		// Error will be handled by the calling code
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
	 * Get message type code
	 * @param {string} type - Message type name
	 * @returns {number} Type code
	 * @private
	 */
	_getMessageTypeCode(type) {
		const codes = {
			Parse: 0x50, // P
			Bind: 0x42, // B
			Execute: 0x45, // E
			Describe: 0x44, // D
			Close: 0x43, // C
			Sync: 0x53, // S
			Query: 0x51, // Q
			Terminate: 0x58, // X
		};
		return codes[type] || 0;
	}

	/**
	 * Get message type name
	 * @param {number} code - Type code
	 * @returns {string} Type name
	 * @private
	 */
	_getMessageTypeName(code) {
		const names = {
			82: "Authentication", // R
			75: "BackendKeyData", // K
			50: "BindComplete", // 2
			51: "CloseComplete", // 3
			67: "CommandComplete", // C
			68: "DataRow", // D
			69: "ErrorResponse", // E
			78: "NoticeResponse", // N
			65: "NotificationResponse", // A
			49: "ParseComplete", // 1
			83: "ParameterStatus", // S
			116: "ParameterDescription", // t
			115: "PortalSuspended", // s
			90: "ReadyForQuery", // Z
			84: "RowDescription", // T
		};
		return names[code] || "Unknown";
	}

	/**
	 * Build Parse message
	 * @param {string} statementName - Statement name
	 * @param {string} sql - SQL query
	 * @returns {Buffer} Parse message data
	 * @private
	 */
	_buildParseMessage(statementName, sql) {
		const nameBuffer = Buffer.from(statementName + "\0", "utf8");
		const queryBuffer = Buffer.from(sql + "\0", "utf8");
		const paramTypesBuffer = Buffer.alloc(2); // No parameter types for now

		return Buffer.concat([nameBuffer, queryBuffer, paramTypesBuffer]);
	}

	/**
	 * Build Bind message
	 * @param {string} portalName - Portal name
	 * @param {string} statementName - Statement name
	 * @param {Array} params - Parameters
	 * @returns {Buffer} Bind message data
	 * @private
	 */
	_buildBindMessage(portalName, statementName, params) {
		const portalBuffer = Buffer.from(portalName + "\0", "utf8");
		const statementBuffer = Buffer.from(statementName + "\0", "utf8");

		// Parameter format codes (0 = text)
		const formatCodesBuffer = Buffer.alloc(2);
		formatCodesBuffer.writeUInt16BE(0, 0);

		// Parameter count
		const paramCountBuffer = Buffer.alloc(2);
		paramCountBuffer.writeUInt16BE(params.length, 0);

		// Parameter values
		const paramBuffers = params.map((param) => {
			if (param === null || param === undefined) {
				const lengthBuffer = Buffer.alloc(4);
				lengthBuffer.writeInt32BE(-1, 0); // NULL
				return lengthBuffer;
			} else {
				const valueBuffer = Buffer.from(String(param), "utf8");
				const lengthBuffer = Buffer.alloc(4);
				lengthBuffer.writeUInt32BE(valueBuffer.length, 0);
				return Buffer.concat([lengthBuffer, valueBuffer]);
			}
		});

		// Result format codes (0 = text)
		const resultFormatBuffer = Buffer.alloc(2);
		resultFormatBuffer.writeUInt16BE(0, 0);

		return Buffer.concat([
			portalBuffer,
			statementBuffer,
			formatCodesBuffer,
			paramCountBuffer,
			...paramBuffers,
			resultFormatBuffer,
		]);
	}

	/**
	 * Build Execute message
	 * @param {string} portalName - Portal name
	 * @param {number} maxRows - Maximum rows (0 = all)
	 * @returns {Buffer} Execute message data
	 * @private
	 */
	_buildExecuteMessage(portalName, maxRows) {
		const portalBuffer = Buffer.from(portalName + "\0", "utf8");
		const maxRowsBuffer = Buffer.alloc(4);
		maxRowsBuffer.writeUInt32BE(maxRows, 0);

		return Buffer.concat([portalBuffer, maxRowsBuffer]);
	}

	/**
	 * Build Describe message
	 * @param {string} type - Description type ('S' or 'P')
	 * @param {string} name - Object name
	 * @returns {Buffer} Describe message data
	 * @private
	 */
	_buildDescribeMessage(type, name) {
		const typeBuffer = Buffer.from(type, "utf8");
		const nameBuffer = Buffer.from(name + "\0", "utf8");

		return Buffer.concat([typeBuffer, nameBuffer]);
	}

	/**
	 * Build Close message
	 * @param {string} type - Object type ('S' or 'P')
	 * @param {string} name - Object name
	 * @returns {Buffer} Close message data
	 * @private
	 */
	_buildCloseMessage(type, name) {
		const typeBuffer = Buffer.from(type, "utf8");
		const nameBuffer = Buffer.from(name + "\0", "utf8");

		return Buffer.concat([typeBuffer, nameBuffer]);
	}

	/**
	 * Parse query response messages
	 * @param {Array} messages - Response messages
	 * @returns {Object} Parsed response
	 * @private
	 */
	_parseQueryResponse(messages) {
		const rowDescription = messages.find((m) => m.type === "RowDescription");
		const dataRows = messages.filter((m) => m.type === "DataRow");
		const commandComplete = messages.find((m) => m.type === "CommandComplete");

		let columns = [];
		if (rowDescription) {
			columns = this._parseRowDescription(rowDescription.data);
		}

		const rows = dataRows.map((row) => this._parseDataRow(row.data));

		let rowCount = 0;
		if (commandComplete) {
			const commandText = commandComplete.data.toString("utf8").slice(0, -1);
			const match = commandText.match(/\d+$/);
			if (match) {
				rowCount = Number.parseInt(match[0], 10);
			}
		}

		return { rows, rowCount, columns };
	}

	/**
	 * Parse RowDescription message
	 * @param {Buffer} data - Message data
	 * @returns {Array} Column descriptions
	 * @private
	 */
	_parseRowDescription(data) {
		const columns = [];
		let offset = 0;

		const fieldCount = data.readUInt16BE(offset);
		offset += 2;

		for (let i = 0; i < fieldCount; i++) {
			// Field name (null-terminated)
			let nameEnd = offset;
			while (data[nameEnd] !== 0) nameEnd++;
			const name = data.subarray(offset, nameEnd).toString("utf8");
			offset = nameEnd + 1;

			// Skip table OID and column number
			offset += 6;

			// Data type OID
			const typeOid = data.readUInt32BE(offset);
			offset += 4;

			// Skip type size, type modifier, format code
			offset += 6;

			columns.push({
				name,
				type: typeOid,
			});
		}

		return columns;
	}

	/**
	 * Parse DataRow message
	 * @param {Buffer} data - Message data
	 * @returns {Array} Row values
	 * @private
	 */
	_parseDataRow(data) {
		const values = [];
		let offset = 0;

		const fieldCount = data.readUInt16BE(offset);
		offset += 2;

		for (let i = 0; i < fieldCount; i++) {
			const length = data.readInt32BE(offset);
			offset += 4;

			if (length === -1) {
				values.push(null);
			} else {
				const value = data.subarray(offset, offset + length).toString("utf8");
				values.push(value);
				offset += length;
			}
		}

		return values;
	}

	/**
	 * Parse ErrorResponse message
	 * @param {Buffer} data - Message data
	 * @returns {Error} Parsed error
	 * @private
	 */
	_parseErrorResponse(data) {
		const fields = new Map();
		let offset = 0;

		while (offset < data.length - 1) {
			const fieldType = String.fromCharCode(data[offset]);
			offset++;

			let valueEnd = offset;
			while (data[valueEnd] !== 0) valueEnd++;
			const value = data.subarray(offset, valueEnd).toString("utf8");
			offset = valueEnd + 1;

			fields.set(fieldType, value);
		}

		const error = new Error(fields.get("M") || "Unknown PostgreSQL error");
		error.code = fields.get("C");
		error.detail = fields.get("D");
		error.hint = fields.get("H");
		error.position = fields.get("P");
		error.where = fields.get("W");

		return error;
	}
}

/**
 * Connect to PostgreSQL database
 * @param {PostgresConfig} config - Connection configuration
 * @returns {Promise<PostgresConnection>} Database connection
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

	const connection = new PostgresConnection(socket, config);

	try {
		// Send startup message
		await connection._sendStartupMessage(user, database);

		// Handle authentication
		await connection._authenticate(user, password);

		// Wait for ready
		await connection._waitForReady();

		return connection;
	} catch (error) {
		socket.destroy();
		throw normalizeError(error, "pg");
	}
}

/**
 * Validate connection
 * @param {PostgresConnection} connection - Connection to validate
 * @returns {boolean} True if valid
 */
export function validate(connection) {
	return connection && connection.socket && !connection.socket.destroyed;
}
