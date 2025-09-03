/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SQLite driver implementation using Node.js built-in sqlite module.
 *
 * Implements SQLite database access using Node 22+ native sqlite module.
 * Provides the DriverConn interface for the core client system with
 * prepared statement support and streaming capabilities.
 */

import { normalizeError } from "../core/errors.js";
import { generateId } from "../core/utils.js";

/**
 * @typedef {Object} SQLiteConfig
 * @property {string} database - Database file path or ':memory:'
 * @property {boolean} [readOnly=false] - Open in read-only mode
 * @property {boolean} [create=true] - Create database if not exists
 */

/**
 * SQLite connection implementation
 */
class SQLiteConnection {
	/**
	 * @param {Object} db - SQLite database instance
	 * @param {SQLiteConfig} config - Connection configuration
	 */
	constructor(db, config) {
		this.db = db;
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
			// Determine if this is a SELECT query
			const isSelect = /^\s*SELECT\s/i.test(sql.trim());

			if (isSelect) {
				// Use all() for SELECT queries
				const stmt = this.db.prepare(sql);
				const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
				stmt.finalize();

				// Extract column information from first row
				const columns =
					rows.length > 0
						? Object.keys(rows[0]).map((name) => ({ name, type: "TEXT" }))
						: [];

				return {
					rows: rows.map((row) => Object.values(row)),
					rowCount: rows.length,
					columns,
				};
			} else {
				// Use run() for non-SELECT queries
				const stmt = this.db.prepare(sql);
				const result = params.length > 0 ? stmt.run(...params) : stmt.run();
				stmt.finalize();

				return {
					rows: [],
					rowCount: result.changes || 0,
					columns: [],
				};
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
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
			stmt = this.db.prepare(sql);

			// SQLite doesn't have native streaming, so we iterate over results
			const iterator =
				params.length > 0 ? stmt.iterate(...params) : stmt.iterate();

			for (const row of iterator) {
				yield Object.values(row);
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
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
			const stmt = this.db.prepare(sql);

			// Try to get column info by doing a dry run with LIMIT 0
			let columns = [];
			try {
				const isSelect = /^\s*SELECT\s/i.test(sql.trim());
				if (isSelect) {
					const testResult = stmt.all();
					if (testResult.length > 0) {
						columns = Object.keys(testResult[0]).map((name) => ({
							name,
							type: "TEXT",
						}));
					} else {
						// If no results, try to extract column names from the query
						// This is a simplified approach
						const columnMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
						if (columnMatch) {
							const columnStr = columnMatch[1];
							if (columnStr !== "*") {
								columns = columnStr.split(",").map((col, index) => ({
									name: col.trim().split(" ").pop() || `col_${index}`,
									type: "TEXT",
								}));
							}
						}
					}
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
			throw normalizeError(error, "sqlite-node");
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
				this.db.exec(`SAVEPOINT ${savepointName}`);
				return { savepoint: savepointName };
			} else {
				this.db.exec("BEGIN");
				this.inTransaction = true;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
		}
	}

	/**
	 * Commit transaction
	 * @param {Object} [txInfo] - Transaction info (for savepoints)
	 */
	async commit(txInfo) {
		try {
			if (txInfo?.savepoint) {
				this.db.exec(`RELEASE SAVEPOINT ${txInfo.savepoint}`);
			} else {
				this.db.exec("COMMIT");
				this.inTransaction = false;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
		}
	}

	/**
	 * Rollback transaction
	 * @param {Object} [txInfo] - Transaction info (for savepoints)
	 */
	async rollback(txInfo) {
		try {
			if (txInfo?.savepoint) {
				this.db.exec(`ROLLBACK TO SAVEPOINT ${txInfo.savepoint}`);
			} else {
				this.db.exec("ROLLBACK");
				this.inTransaction = false;
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
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

			// Close database
			this.db.close();
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
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

			// Determine if this is a SELECT query
			const isSelect = /^\s*SELECT\s/i.test(statementInfo.sql.trim());

			if (isSelect) {
				const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
				return {
					rows: rows.map((row) => Object.values(row)),
					rowCount: rows.length,
					columns,
				};
			} else {
				const result = params.length > 0 ? stmt.run(...params) : stmt.run();
				return {
					rows: [],
					rowCount: result.changes || 0,
					columns,
				};
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
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
			const iterator =
				params.length > 0 ? stmt.iterate(...params) : stmt.iterate();

			for (const row of iterator) {
				yield Object.values(row);
			}
		} catch (error) {
			throw normalizeError(error, "sqlite-node");
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
}

/**
 * Connect to SQLite database
 * @param {SQLiteConfig} config - Connection configuration
 * @returns {Promise<SQLiteConnection>} Database connection
 */
export async function connect(config) {
	try {
		// Import Node.js built-in sqlite module
		let Database;
		try {
			const sqlite = await import("node:sqlite");
			Database = sqlite.DatabaseSync;
		} catch (importError) {
			throw new Error(
				"Node.js built-in sqlite module not available. " +
					"Ensure you're using Node.js 22.5+ and enable the sqlite module with --experimental-sqlite",
			);
		}

		// Determine database path
		const dbPath =
			config.database === ":memory:" ? ":memory:" : config.database;

		// Open database
		const options = {};
		if (config.readOnly) {
			options.open = Database.constants.SQLITE_OPEN_READONLY;
		} else {
			options.open = Database.constants.SQLITE_OPEN_READWRITE;
			if (config.create !== false) {
				options.open |= Database.constants.SQLITE_OPEN_CREATE;
			}
		}

		const db = new Database(dbPath, options);

		// Set pragmas for better performance and safety
		db.exec("PRAGMA journal_mode = WAL");
		db.exec("PRAGMA synchronous = NORMAL");
		db.exec("PRAGMA cache_size = -2000"); // 2MB cache
		db.exec("PRAGMA foreign_keys = ON");
		db.exec("PRAGMA temp_store = MEMORY");

		return new SQLiteConnection(db, config);
	} catch (error) {
		throw normalizeError(error, "sqlite-node");
	}
}

/**
 * Validate connection
 * @param {SQLiteConnection} connection - Connection to validate
 * @returns {boolean} True if valid
 */
export function validate(connection) {
	try {
		// Test with a simple query
		connection.db.prepare("SELECT 1").get();
		return true;
	} catch {
		return false;
	}
}
