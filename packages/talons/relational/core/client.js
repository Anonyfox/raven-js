/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Public client façade and driver routing for database connections.
 *
 * Provides the main entry point for database operations with automatic driver
 * selection, connection pooling, and unified API across all database engines.
 * Routes operations to appropriate drivers while maintaining consistent behavior.
 */

import { raceWithCancellation } from "./cancel.js";
import { createDecoderMap } from "./codecs.js";
import { mergeConfig, validateConfig } from "./config.js";
import { isConnectionError, normalizeError } from "./errors.js";
import { recordConnection, recordError, recordQuery } from "./metrics.js";
import { createPool, createPooledConnection } from "./pool.js";
import { createRowShaper, createStreamingRowShaper } from "./row-shapes.js";
import { createStatement, createStatementCache } from "./statement.js";
import { LRUCache } from "./utils.js";

/**
 * @typedef {Object} QueryOptions
 * @property {'object'|'array'} [shape='object'] - Row shape
 * @property {boolean} [dateAsString=true] - Return dates as strings
 * @property {string} [bigint='bigint'] - Bigint handling
 * @property {string} [json='parse'] - JSON handling
 * @property {boolean} [meta=false] - Include metadata
 * @property {AbortSignal} [signal] - Abort signal
 * @property {number} [timeoutMs] - Timeout in milliseconds
 */

/**
 * @typedef {Object} TransactionOptions
 * @property {string} [isolationLevel] - Transaction isolation level
 * @property {boolean} [readOnly=false] - Read-only transaction
 * @property {AbortSignal} [signal] - Abort signal
 * @property {number} [timeoutMs] - Timeout in milliseconds
 */

/**
 * Database client with unified API across all drivers
 */
export class Client {
	/**
	 * @param {Object} config - Database configuration
	 * @param {Object} driver - Database driver instance
	 * @param {Object} [pool] - Connection pool instance
	 */
	constructor(config, driver, pool) {
		this.config = config;
		this.driver = driver;
		this.pool = pool;
		this.closed = false;

		// Statement cache for prepared statements
		this.statementCache = createStatementCache(100);

		// Default query options
		this.defaultOptions = {
			shape: config.shape || "object",
			dateAsString: config.dateAsString !== false,
			bigint: config.bigint || "bigint",
			json: config.json || "parse",
			meta: false,
		};
	}

	/**
	 * Execute a SQL query
	 * @param {string} sql - SQL query
	 * @param {Array} [params] - Query parameters
	 * @param {QueryOptions} [options] - Query options
	 * @returns {Promise<{rows: Array, rowCount?: number}>} Query result
	 */
	async query(sql, params = [], options = {}) {
		if (this.closed) {
			throw new Error("Client has been closed");
		}

		const mergedOptions = { ...this.defaultOptions, ...options };
		const startTime = performance.now();

		try {
			// Get connection from pool or use direct connection
			const connection = this.pool
				? await this.pool.acquire(mergedOptions.signal)
				: this.driver;

			try {
				// Execute query through driver
				const queryPromise = this.driver.simpleQuery(
					sql,
					params,
					mergedOptions,
				);
				const result = await raceWithCancellation(
					queryPromise,
					mergedOptions.signal,
					mergedOptions.timeoutMs,
					this.config.driver,
				);

				// Shape results if we have column information
				if (result.columns && result.rows) {
					const decoders = createDecoderMap(
						result.columns,
						this.config.driver,
						mergedOptions,
					);
					const shaper = createRowShaper(
						result.columns,
						mergedOptions,
						this.config.driver,
						decoders,
					);
					const shapedResult = shaper.createResult(
						result.rows,
						result.rowCount,
					);

					// Record metrics
					recordQuery(
						sql,
						startTime,
						shapedResult.rows.length,
						this.config.driver,
						"query",
					);

					return shapedResult;
				}

				// Record metrics for non-select queries
				recordQuery(
					sql,
					startTime,
					result.rowCount || 0,
					this.config.driver,
					"query",
				);

				return {
					rows: [],
					rowCount: result.rowCount || 0,
				};
			} finally {
				// Release connection back to pool
				if (this.pool) {
					this.pool.release(connection);
				}
			}
		} catch (error) {
			const normalizedError = normalizeError(error, this.config.driver);
			recordError(normalizedError, this.config.driver, "query", startTime);
			throw normalizedError;
		}
	}

	/**
	 * Stream query results
	 * @param {string} sql - SQL query
	 * @param {Array} [params] - Query parameters
	 * @param {QueryOptions} [options] - Query options
	 * @returns {AsyncIterable<Object|Array>} Async iterable of rows
	 */
	async *stream(sql, params = [], options = {}) {
		if (this.closed) {
			throw new Error("Client has been closed");
		}

		const mergedOptions = { ...this.defaultOptions, ...options };
		const startTime = performance.now();
		let rowCount = 0;
		let connection = null;

		try {
			// Get connection from pool or use direct connection
			connection = this.pool
				? await this.pool.acquire(mergedOptions.signal)
				: this.driver;

			// Execute streaming query through driver
			const streamPromise = this.driver.streamQuery(sql, params, mergedOptions);
			const rawStream = await raceWithCancellation(
				streamPromise,
				mergedOptions.signal,
				mergedOptions.timeoutMs,
				this.config.driver,
			);

			// Create shaper if we have column information
			let shaper = null;
			if (rawStream.columns) {
				const decoders = createDecoderMap(
					rawStream.columns,
					this.config.driver,
					mergedOptions,
				);
				const rowShaper = createRowShaper(
					rawStream.columns,
					mergedOptions,
					this.config.driver,
					decoders,
				);
				shaper = createStreamingRowShaper(rowShaper);
			}

			// Stream results
			const iterator = shaper ? shaper.transform(rawStream) : rawStream;

			for await (const row of iterator) {
				rowCount++;

				// Check for cancellation periodically
				if (mergedOptions.signal?.aborted) {
					throw new Error("Operation was cancelled");
				}

				yield row;
			}

			// Record metrics
			recordQuery(sql, startTime, rowCount, this.config.driver, "stream");
		} catch (error) {
			const normalizedError = normalizeError(error, this.config.driver);
			recordError(normalizedError, this.config.driver, "stream", startTime);
			throw normalizedError;
		} finally {
			// Release connection back to pool
			if (this.pool && connection) {
				this.pool.release(connection, isConnectionError(error));
			}
		}
	}

	/**
	 * Prepare a SQL statement
	 * @param {string} sql - SQL query
	 * @param {QueryOptions} [options] - Prepare options
	 * @returns {Promise<Statement>} Prepared statement
	 */
	async prepare(sql, options = {}) {
		if (this.closed) {
			throw new Error("Client has been closed");
		}

		// Check statement cache first
		const cached = this.statementCache.get(sql);
		if (cached && !cached.isClosed()) {
			return cached;
		}

		const mergedOptions = { ...this.defaultOptions, ...options };
		const startTime = performance.now();

		try {
			// Get connection from pool or use direct connection
			const connection = this.pool
				? await this.pool.acquire(mergedOptions.signal)
				: this.driver;

			try {
				// Prepare statement through driver
				const preparePromise = this.driver.prepare(sql, mergedOptions);
				const driverStatement = await raceWithCancellation(
					preparePromise,
					mergedOptions.signal,
					mergedOptions.timeoutMs,
					this.config.driver,
				);

				// Create statement wrapper
				const statement = createStatement(
					driverStatement,
					sql,
					this.config.driver,
					mergedOptions,
				);

				// Cache the statement
				this.statementCache.set(sql, statement);

				// Record metrics
				recordQuery(sql, startTime, 0, this.config.driver, "prepare");

				return statement;
			} finally {
				// Release connection back to pool (statement keeps its own connection)
				if (this.pool) {
					this.pool.release(connection);
				}
			}
		} catch (error) {
			const normalizedError = normalizeError(error, this.config.driver);
			recordError(normalizedError, this.config.driver, "prepare", startTime);
			throw normalizedError;
		}
	}

	/**
	 * Execute a transaction
	 * @param {Function} fn - Transaction function
	 * @param {TransactionOptions} [options] - Transaction options
	 * @returns {Promise<any>} Transaction result
	 */
	async transaction(fn, options = {}) {
		if (this.closed) {
			throw new Error("Client has been closed");
		}

		if (typeof fn !== "function") {
			throw new Error("Transaction function is required");
		}

		const mergedOptions = { ...options };
		const startTime = performance.now();
		let connection = null;
		let inTransaction = false;

		try {
			// Get connection from pool or use direct connection
			connection = this.pool
				? await this.pool.acquire(mergedOptions.signal)
				: this.driver;

			// Begin transaction
			await this.driver.begin(mergedOptions);
			inTransaction = true;

			// Create transaction client that reuses the connection
			const txClient = new TransactionClient(this, connection);

			// Execute transaction function
			const result = await raceWithCancellation(
				fn(txClient),
				mergedOptions.signal,
				mergedOptions.timeoutMs,
				this.config.driver,
			);

			// Commit transaction
			await this.driver.commit();
			inTransaction = false;

			// Record metrics
			recordQuery(
				"TRANSACTION",
				startTime,
				0,
				this.config.driver,
				"transaction",
			);

			return result;
		} catch (error) {
			// Rollback on error
			if (inTransaction) {
				try {
					await this.driver.rollback();
				} catch (rollbackError) {
					// Log rollback error but don't throw it
					recordError(
						normalizeError(rollbackError, this.config.driver),
						this.config.driver,
						"rollback",
					);
				}
			}

			const normalizedError = normalizeError(error, this.config.driver);
			recordError(
				normalizedError,
				this.config.driver,
				"transaction",
				startTime,
			);
			throw normalizedError;
		} finally {
			// Release connection back to pool
			if (this.pool && connection) {
				this.pool.release(connection, isConnectionError(error));
			}
		}
	}

	/**
	 * Close the client and release all resources
	 * @returns {Promise<void>} Close promise
	 */
	async close() {
		if (this.closed) {
			return;
		}

		this.closed = true;

		try {
			// Clear statement cache
			await this.statementCache.clear();

			// Close pool if present
			if (this.pool) {
				await this.pool.destroy();
			} else {
				// Close direct connection
				if (this.driver && this.driver.close) {
					await this.driver.close();
				}
			}
		} catch (error) {
			// Log but don't throw errors during cleanup
			recordError(
				normalizeError(error, this.config.driver),
				this.config.driver,
				"close",
			);
		}
	}

	/**
	 * Test the connection
	 * @returns {Promise<boolean>} True if connection is working
	 */
	async test() {
		try {
			if (this.pool) {
				return await this.pool.test();
			} else {
				// Test direct connection with simple query
				await this.query("SELECT 1");
				return true;
			}
		} catch {
			return false;
		}
	}

	/**
	 * Get client statistics
	 * @returns {Object} Client statistics
	 */
	getStats() {
		const stats = {
			driver: this.config.driver,
			closed: this.closed,
			statements: this.statementCache.getStats(),
		};

		if (this.pool) {
			stats.pool = this.pool.getStats();
		}

		return stats;
	}

	/**
	 * Get client configuration
	 * @returns {Object} Client configuration (without sensitive data)
	 */
	getConfig() {
		const { password, ...safeConfig } = this.config;
		return safeConfig;
	}
}

/**
 * Transaction client that reuses a connection
 */
class TransactionClient {
	/**
	 * @param {Client} parentClient - Parent client
	 * @param {Object} connection - Database connection
	 */
	constructor(parentClient, connection) {
		this.parentClient = parentClient;
		this.connection = connection;
		this.config = parentClient.config;
		this.driver = parentClient.driver;
		this.defaultOptions = parentClient.defaultOptions;
	}

	/**
	 * Execute a query within the transaction
	 * @param {string} sql - SQL query
	 * @param {Array} [params] - Query parameters
	 * @param {QueryOptions} [options] - Query options
	 * @returns {Promise<{rows: Array, rowCount?: number}>} Query result
	 */
	async query(sql, params = [], options = {}) {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const startTime = performance.now();

		try {
			// Execute query using the transaction connection
			const result = await this.driver.simpleQuery(sql, params, mergedOptions);

			// Shape results if we have column information
			if (result.columns && result.rows) {
				const decoders = createDecoderMap(
					result.columns,
					this.config.driver,
					mergedOptions,
				);
				const shaper = createRowShaper(
					result.columns,
					mergedOptions,
					this.config.driver,
					decoders,
				);
				const shapedResult = shaper.createResult(result.rows, result.rowCount);

				recordQuery(
					sql,
					startTime,
					shapedResult.rows.length,
					this.config.driver,
					"query",
				);
				return shapedResult;
			}

			recordQuery(
				sql,
				startTime,
				result.rowCount || 0,
				this.config.driver,
				"query",
			);
			return {
				rows: [],
				rowCount: result.rowCount || 0,
			};
		} catch (error) {
			const normalizedError = normalizeError(error, this.config.driver);
			recordError(normalizedError, this.config.driver, "query", startTime);
			throw normalizedError;
		}
	}

	/**
	 * Stream query results within the transaction
	 * @param {string} sql - SQL query
	 * @param {Array} [params] - Query parameters
	 * @param {QueryOptions} [options] - Query options
	 * @returns {AsyncIterable<Object|Array>} Async iterable of rows
	 */
	async *stream(sql, params = [], options = {}) {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const startTime = performance.now();
		let rowCount = 0;

		try {
			// Execute streaming query using the transaction connection
			const rawStream = await this.driver.streamQuery(
				sql,
				params,
				mergedOptions,
			);

			// Create shaper if we have column information
			let shaper = null;
			if (rawStream.columns) {
				const decoders = createDecoderMap(
					rawStream.columns,
					this.config.driver,
					mergedOptions,
				);
				const rowShaper = createRowShaper(
					rawStream.columns,
					mergedOptions,
					this.config.driver,
					decoders,
				);
				shaper = createStreamingRowShaper(rowShaper);
			}

			// Stream results
			const iterator = shaper ? shaper.transform(rawStream) : rawStream;

			for await (const row of iterator) {
				rowCount++;
				yield row;
			}

			recordQuery(sql, startTime, rowCount, this.config.driver, "stream");
		} catch (error) {
			const normalizedError = normalizeError(error, this.config.driver);
			recordError(normalizedError, this.config.driver, "stream", startTime);
			throw normalizedError;
		}
	}

	/**
	 * Nested transactions use savepoints
	 * @param {Function} fn - Nested transaction function
	 * @param {TransactionOptions} [options] - Transaction options
	 * @returns {Promise<any>} Transaction result
	 */
	async transaction(fn, options = {}) {
		if (typeof fn !== "function") {
			throw new Error("Transaction function is required");
		}

		const savepointName = `sp_${Math.random().toString(36).slice(2, 11)}`;
		const startTime = performance.now();

		try {
			// Create savepoint
			await this.query(`SAVEPOINT ${savepointName}`);

			// Execute nested transaction
			const result = await fn(this);

			// Release savepoint
			await this.query(`RELEASE SAVEPOINT ${savepointName}`);

			recordQuery("SAVEPOINT", startTime, 0, this.config.driver, "transaction");
			return result;
		} catch (error) {
			// Rollback to savepoint
			try {
				await this.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
			} catch (rollbackError) {
				recordError(
					normalizeError(rollbackError, this.config.driver),
					this.config.driver,
					"rollback",
				);
			}

			const normalizedError = normalizeError(error, this.config.driver);
			recordError(
				normalizedError,
				this.config.driver,
				"transaction",
				startTime,
			);
			throw normalizedError;
		}
	}
}

/**
 * Connect to a database
 * @param {string|Object} config - Database configuration or DSN
 * @param {Object} [options] - Additional options
 * @returns {Promise<Client>} Database client
 */
export async function connect(config, options = {}) {
	// Merge and validate configuration
	const mergedConfig = mergeConfig(config, options);
	validateConfig(mergedConfig);

	const startTime = performance.now();

	try {
		// Load appropriate driver
		const driver = await loadDriver(mergedConfig.driver);

		// Create connection
		const connection = await driver.connect(mergedConfig);

		// Create pool if configured
		let pool = null;
		if (mergedConfig.pool) {
			pool = createPool(
				mergedConfig.pool,
				() => driver.connect(mergedConfig),
				(conn) => conn.close(),
				(conn) => driver.validate?.(conn) ?? true,
			);
		}

		// Record connection metrics
		recordConnection(
			"create",
			mergedConfig.driver,
			mergedConfig.host,
			startTime,
			!!pool,
		);

		return new Client(mergedConfig, connection, pool);
	} catch (error) {
		const normalizedError = normalizeError(error, mergedConfig.driver);
		recordError(normalizedError, mergedConfig.driver, "connect", startTime);
		throw normalizedError;
	}
}

/**
 * Load database driver
 * @param {string} driverName - Driver name
 * @returns {Promise<Object>} Driver instance
 * @private
 */
async function loadDriver(driverName) {
	switch (driverName) {
		case "pg":
			return await import("../drivers/pg.js");
		case "mysql":
			return await import("../drivers/mysql.js");
		case "sqlite-node":
			return await import("../drivers/sqlite-node.js");
		case "sqlite-wasm":
			return await import("../drivers/sqlite-wasm.js");
		default:
			throw new Error(`Unsupported driver: ${driverName}`);
	}
}
