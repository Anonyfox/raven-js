/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SQLite WASM driver implementation for browser environments.
 *
 * Implements SQLite database access using user-provided WASM engine.
 * Provides the DriverConn interface for the core client system with
 * zero Node.js dependencies for browser compatibility.
 */

import { normalizeError } from "../core/errors.js";
import { generateId } from "../core/utils.js";

/**
 * @typedef {Object} SQLiteWasmConfig
 * @property {Object} wasm - WASM engine instance
 * @property {Function} wasm.engine.prepare - Prepare statement function
 * @property {Function} wasm.engine.exec - Execute SQL function
 */

/**
 * @typedef {Object} WasmStatement
 * @property {Function} step - Step through results
 * @property {Function} get - Get column value
 * @property {Function} finalize - Finalize statement
 * @property {Function} reset - Reset statement
 * @property {Function} bind - Bind parameters
 */

/**
 * SQLite WASM connection implementation
 */
class SQLiteWasmConnection {
	/**
	 * @param {Object} engine - WASM engine instance
	 * @param {SQLiteWasmConfig} config - Connection configuration
	 */
	constructor(engine, config) {
		this.engine = engine;
		this.config = config;
		this.statements = new Map();
		this.nextStatementId = 1;
		this.inTransaction = false;
	}

	/**
	 * Execute a simple query
	 * @param {string} sql - SQL query
	 * @param {Array} params - Query parameters
	 * @param {Object} options - Query options
	 * @returns {Promise<{rows: Array, rowCount: number, columns: Array}>} Query result
	 */
	async simpleQuery(sql, params = [], options = {}) {
		try {
			if (params.length === 0) {
				// Simple execution without parameters
				return this._execSimple(sql);
			} else {
				// Use prepared statement for parameters
				const stmt = this.engine.prepare(sql);
				try {
					return this._executeWasmStatement(stmt, params);
				} finally {
					stmt.finalize();
				}
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
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
		let stmt = null;

		try {
			stmt = this.engine.prepare(sql);

			// Bind parameters if provided
			if (params.length > 0) {
				this._bindParameters(stmt, params);
			}

			// Stream results
			while (stmt.step()) {
				const row = this._extractRow(stmt);
				yield row;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		} finally {
			if (stmt) {
				stmt.finalize();
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
		try {
			const statementId = this.nextStatementId++;
			const stmt = this.engine.prepare(sql);

			// Get column information by stepping once (if it's a SELECT)
			let columns = [];
			try {
				const isSelect = /^\s*SELECT\s/i.test(sql.trim());
				if (isSelect) {
					// Try to get column names
					columns = this._getColumnInfo(stmt, sql);
				}
			} catch {
				// Ignore errors during column detection
			}

			// Store statement
			const statementInfo = {
				id: statementId,
				stmt,
				sql,
				columns,
			};
			this.statements.set(statementId, statementInfo);

			return {
				id: statementId,
				columns,
				execute: (params) => this._executeStatement(statementId, params),
				stream: (params) => this._streamStatement(statementId, params),
				close: () => this._closeStatement(statementId),
			};
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Begin transaction
	 * @param {Object} options - Transaction options
	 */
	async begin(options = {}) {
		try {
			if (this.inTransaction) {
				// Use savepoint for nested transactions
				const savepointName = `sp_${generateId()}`;
				this.engine.exec(`SAVEPOINT ${savepointName}`);
				return { savepoint: savepointName };
			} else {
				this.engine.exec("BEGIN");
				this.inTransaction = true;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Commit transaction
	 * @param {Object} [txInfo] - Transaction info (for savepoints)
	 */
	async commit(txInfo) {
		try {
			if (txInfo?.savepoint) {
				this.engine.exec(`RELEASE SAVEPOINT ${txInfo.savepoint}`);
			} else {
				this.engine.exec("COMMIT");
				this.inTransaction = false;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Rollback transaction
	 * @param {Object} [txInfo] - Transaction info (for savepoints)
	 */
	async rollback(txInfo) {
		try {
			if (txInfo?.savepoint) {
				this.engine.exec(`ROLLBACK TO SAVEPOINT ${txInfo.savepoint}`);
			} else {
				this.engine.exec("ROLLBACK");
				this.inTransaction = false;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Close the connection
	 */
	async close() {
		try {
			// Finalize all prepared statements
			for (const [id, statementInfo] of this.statements) {
				try {
					statementInfo.stmt.finalize();
				} catch {
					// Ignore finalization errors
				}
			}
			this.statements.clear();

			// Close database if engine supports it
			if (this.engine.close) {
				this.engine.close();
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Execute simple SQL without parameters
	 * @param {string} sql - SQL query
	 * @returns {Object} Query result
	 * @private
	 */
	_execSimple(sql) {
		const isSelect = /^\s*SELECT\s/i.test(sql.trim());

		if (isSelect) {
			// For SELECT queries, use prepare/step approach
			const stmt = this.engine.prepare(sql);
			try {
				const rows = [];
				const columns = this._getColumnInfo(stmt, sql);

				while (stmt.step()) {
					rows.push(this._extractRow(stmt));
				}

				return {
					rows,
					rowCount: rows.length,
					columns,
				};
			} finally {
				stmt.finalize();
			}
		} else {
			// For non-SELECT queries, use exec
			const result = this.engine.exec(sql);
			return {
				rows: [],
				rowCount: this._getChangesCount(),
				columns: [],
			};
		}
	}

	/**
	 * Execute WASM statement with parameters
	 * @param {WasmStatement} stmt - WASM statement
	 * @param {Array} params - Parameters
	 * @returns {Object} Query result
	 * @private
	 */
	_executeWasmStatement(stmt, params) {
		// Bind parameters
		this._bindParameters(stmt, params);

		// Determine if this is a SELECT query
		const isSelect = stmt.getColumnCount?.() > 0 || this._hasResults(stmt);

		if (isSelect) {
			const rows = [];
			const columns = this._getColumnInfo(stmt);

			while (stmt.step()) {
				rows.push(this._extractRow(stmt));
			}

			return {
				rows,
				rowCount: rows.length,
				columns,
			};
		} else {
			// Execute non-SELECT statement
			stmt.step();
			return {
				rows: [],
				rowCount: this._getChangesCount(),
				columns: [],
			};
		}
	}

	/**
	 * Execute prepared statement
	 * @param {number} statementId - Statement ID
	 * @param {Array} params - Parameters
	 * @returns {Promise<Object>} Query result
	 * @private
	 */
	async _executeStatement(statementId, params) {
		const statementInfo = this.statements.get(statementId);
		if (!statementInfo) {
			throw new Error("Statement not found");
		}

		try {
			const { stmt, columns } = statementInfo;

			// Reset statement
			stmt.reset();

			// Bind parameters
			if (params.length > 0) {
				this._bindParameters(stmt, params);
			}

			const isSelect = columns.length > 0;

			if (isSelect) {
				const rows = [];
				while (stmt.step()) {
					rows.push(this._extractRow(stmt));
				}

				return {
					rows,
					rowCount: rows.length,
					columns,
				};
			} else {
				stmt.step();
				return {
					rows: [],
					rowCount: this._getChangesCount(),
					columns,
				};
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Stream prepared statement results
	 * @param {number} statementId - Statement ID
	 * @param {Array} params - Parameters
	 * @returns {AsyncIterable<Array>} Row stream
	 * @private
	 */
	async *_streamStatement(statementId, params) {
		const statementInfo = this.statements.get(statementId);
		if (!statementInfo) {
			throw new Error("Statement not found");
		}

		try {
			const { stmt } = statementInfo;

			// Reset statement
			stmt.reset();

			// Bind parameters
			if (params.length > 0) {
				this._bindParameters(stmt, params);
			}

			// Stream results
			while (stmt.step()) {
				yield this._extractRow(stmt);
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-wasm");
		}
	}

	/**
	 * Close prepared statement
	 * @param {number} statementId - Statement ID
	 * @private
	 */
	async _closeStatement(statementId) {
		const statementInfo = this.statements.get(statementId);
		if (!statementInfo) {
			return;
		}

		try {
			statementInfo.stmt.finalize();
			this.statements.delete(statementId);
		} catch (error) {
			// Ignore finalization errors
		}
	}

	/**
	 * Bind parameters to statement
	 * @param {WasmStatement} stmt - WASM statement
	 * @param {Array} params - Parameters to bind
	 * @private
	 */
	_bindParameters(stmt, params) {
		if (stmt.bind) {
			// If statement has bind method, use it
			stmt.bind(params);
		} else if (stmt.bindValue) {
			// Bind parameters individually
			for (let i = 0; i < params.length; i++) {
				stmt.bindValue(i + 1, params[i]);
			}
		} else {
			// Fallback: try common binding patterns
			for (let i = 0; i < params.length; i++) {
				const value = params[i];
				const paramIndex = i + 1;

				if (value === null || value === undefined) {
					stmt.bindNull?.(paramIndex);
				} else if (typeof value === "number") {
					if (Number.isInteger(value)) {
						stmt.bindInt?.(paramIndex, value);
					} else {
						stmt.bindDouble?.(paramIndex, value);
					}
				} else if (typeof value === "string") {
					stmt.bindText?.(paramIndex, value);
				} else if (value instanceof Uint8Array) {
					stmt.bindBlob?.(paramIndex, value);
				} else {
					stmt.bindText?.(paramIndex, String(value));
				}
			}
		}
	}

	/**
	 * Extract row from statement
	 * @param {WasmStatement} stmt - WASM statement
	 * @returns {Array} Row values
	 * @private
	 */
	_extractRow(stmt) {
		const row = [];
		const columnCount = this._getColumnCount(stmt);

		for (let i = 0; i < columnCount; i++) {
			row.push(stmt.get(i));
		}

		return row;
	}

	/**
	 * Get column information
	 * @param {WasmStatement} stmt - WASM statement
	 * @param {string} [sql] - SQL query for fallback parsing
	 * @returns {Array} Column information
	 * @private
	 */
	_getColumnInfo(stmt, sql) {
		const columns = [];
		const columnCount = this._getColumnCount(stmt);

		for (let i = 0; i < columnCount; i++) {
			const name = stmt.getColumnName?.(i) || `col_${i}`;
			columns.push({
				name,
				type: "TEXT", // SQLite WASM typically doesn't provide detailed type info
			});
		}

		// If no columns detected but it's a SELECT, try to parse from SQL
		if (columns.length === 0 && sql && /^\s*SELECT\s/i.test(sql.trim())) {
			const columnMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
			if (columnMatch) {
				const columnStr = columnMatch[1];
				if (columnStr !== "*") {
					const parsedColumns = columnStr.split(",").map((col, index) => ({
						name: col.trim().split(" ").pop() || `col_${index}`,
						type: "TEXT",
					}));
					columns.push(...parsedColumns);
				}
			}
		}

		return columns;
	}

	/**
	 * Get column count from statement
	 * @param {WasmStatement} stmt - WASM statement
	 * @returns {number} Column count
	 * @private
	 */
	_getColumnCount(stmt) {
		if (stmt.getColumnCount) {
			return stmt.getColumnCount();
		}

		if (stmt.columnCount !== undefined) {
			return stmt.columnCount;
		}

		// Fallback: try to determine by checking if get(0) works
		try {
			stmt.get(0);
			// If that worked, count columns by trying indices
			let count = 0;
			while (true) {
				try {
					stmt.get(count);
					count++;
				} catch {
					break;
				}
			}
			return count;
		} catch {
			return 0;
		}
	}

	/**
	 * Check if statement has results
	 * @param {WasmStatement} stmt - WASM statement
	 * @returns {boolean} True if has results
	 * @private
	 */
	_hasResults(stmt) {
		try {
			return stmt.step();
		} catch {
			return false;
		} finally {
			// Reset statement after checking
			try {
				stmt.reset();
			} catch {
				// Ignore reset errors
			}
		}
	}

	/**
	 * Get number of changed rows
	 * @returns {number} Number of changes
	 * @private
	 */
	_getChangesCount() {
		try {
			return this.engine.changes?.() || 0;
		} catch {
			return 0;
		}
	}
}

/**
 * Connect to SQLite WASM database
 * @param {SQLiteWasmConfig} config - Connection configuration
 * @returns {Promise<SQLiteWasmConnection>} Database connection
 */
export async function connect(config) {
	try {
		if (!config.wasm || !config.wasm.engine) {
			throw new Error("WASM engine is required for sqlite-wasm driver");
		}

		const engine = config.wasm.engine;

		// Validate that engine has required methods
		if (!engine.prepare) {
			throw new Error("WASM engine must have prepare() method");
		}

		if (!engine.exec) {
			throw new Error("WASM engine must have exec() method");
		}

		// Set pragmas for better performance if supported
		try {
			engine.exec("PRAGMA journal_mode = MEMORY");
			engine.exec("PRAGMA synchronous = NORMAL");
			engine.exec("PRAGMA cache_size = -2000");
			engine.exec("PRAGMA foreign_keys = ON");
			engine.exec("PRAGMA temp_store = MEMORY");
		} catch {
			// Ignore pragma errors - not all WASM engines support them
		}

		return new SQLiteWasmConnection(engine, config);
	} catch (error) {
		throw normalizeError(error, "sqlite-wasm");
	}
}

/**
 * Validate connection
 * @param {SQLiteWasmConnection} connection - Connection to validate
 * @returns {boolean} True if valid
 */
export function validate(connection) {
	try {
		// Test with a simple query
		const stmt = connection.engine.prepare("SELECT 1");
		stmt.step();
		const result = stmt.get(0);
		stmt.finalize();
		return result === 1;
	} catch {
		return false;
	}
}
