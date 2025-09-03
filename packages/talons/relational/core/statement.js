/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Engine-neutral prepared statement wrapper.
 *
 * Provides a unified interface for prepared statements across all database drivers.
 * Handles parameter binding, result shaping, and resource cleanup with consistent
 * behavior regardless of underlying database engine.
 */

import { raceWithCancellation } from "./cancel.js";
import { createDecoderMap } from "./codecs.js";
import { normalizeError } from "./errors.js";
import { recordError, recordQuery } from "./metrics.js";
import { createRowShaper, createStreamingRowShaper } from "./row-shapes.js";

/**
 * @typedef {Object} StatementOptions
 * @property {'object'|'array'} [shape='object'] - Row shape
 * @property {boolean} [dateAsString=true] - Return dates as strings
 * @property {string} [bigint='bigint'] - Bigint handling
 * @property {string} [json='parse'] - JSON handling
 * @property {boolean} [meta=false] - Include metadata
 * @property {AbortSignal} [signal] - Abort signal
 * @property {number} [timeoutMs] - Timeout in milliseconds
 */

/**
 * @typedef {Object} DriverStatement
 * @property {string} id - Statement identifier
 * @property {Array} columns - Column information
 * @property {Function} execute - Execute with parameters
 * @property {Function} stream - Stream results
 * @property {Function} close - Close statement
 */

/**
 * Engine-neutral prepared statement wrapper
 */
export class Statement {
	/**
	 * @param {DriverStatement} driverStatement - Driver-specific statement
	 * @param {string} sql - Original SQL query
	 * @param {string} driver - Database driver name
	 * @param {StatementOptions} options - Statement options
	 */
	constructor(driverStatement, sql, driver, options) {
		this.driverStatement = driverStatement;
		this.sql = sql;
		this.driver = driver;
		this.options = {
			shape: "object",
			dateAsString: true,
			bigint: "bigint",
			json: "parse",
			meta: false,
			...options,
		};

		this.closed = false;
		this.columns = driverStatement.columns || [];

		// Create decoder map and row shaper
		this.decoders = createDecoderMap(this.columns, driver, this.options);
		this.rowShaper = createRowShaper(
			this.columns,
			this.options,
			driver,
			this.decoders,
		);
	}

	/**
	 * Execute the prepared statement with parameters
	 * @param {Array} [params] - Query parameters
	 * @param {StatementOptions} [options] - Execution options
	 * @returns {Promise<{rows: Array, rowCount?: number}>} Query result
	 */
	async execute(params = [], options = {}) {
		if (this.closed) {
			throw new Error("Statement has been closed");
		}

		const mergedOptions = { ...this.options, ...options };
		const startTime = performance.now();

		try {
			const executePromise = this.driverStatement.execute(
				params,
				mergedOptions,
			);
			const result = await raceWithCancellation(
				executePromise,
				mergedOptions.signal,
				mergedOptions.timeoutMs,
				this.driver,
			);

			// Shape the results
			const shapedResult = this.rowShaper.createResult(
				result.rows || [],
				result.rowCount,
			);

			// Record metrics
			recordQuery(
				this.sql,
				startTime,
				shapedResult.rows.length,
				this.driver,
				"execute",
			);

			return shapedResult;
		} catch (error) {
			const normalizedError = normalizeError(error, this.driver);
			recordError(normalizedError, this.driver, "execute", startTime);
			throw normalizedError;
		}
	}

	/**
	 * Stream results from the prepared statement
	 * @param {Array} [params] - Query parameters
	 * @param {StatementOptions} [options] - Streaming options
	 * @returns {AsyncIterable<Object|Array>} Async iterable of rows
	 */
	async *stream(params = [], options = {}) {
		if (this.closed) {
			throw new Error("Statement has been closed");
		}

		const mergedOptions = { ...this.options, ...options };
		const startTime = performance.now();
		let rowCount = 0;

		try {
			const streamPromise = this.driverStatement.stream(params, mergedOptions);
			const rawStream = await raceWithCancellation(
				streamPromise,
				mergedOptions.signal,
				mergedOptions.timeoutMs,
				this.driver,
			);

			const streamingShaper = createStreamingRowShaper(this.rowShaper);

			// Stream and shape rows
			for await (const row of streamingShaper.transform(rawStream)) {
				rowCount++;

				// Check for cancellation periodically
				if (mergedOptions.signal?.aborted) {
					throw new Error("Operation was cancelled");
				}

				yield row;
			}

			// Record metrics
			recordQuery(this.sql, startTime, rowCount, this.driver, "stream");
		} catch (error) {
			const normalizedError = normalizeError(error, this.driver);
			recordError(normalizedError, this.driver, "stream", startTime);
			throw normalizedError;
		}
	}

	/**
	 * Get statement metadata
	 * @returns {Object} Statement metadata
	 */
	getMetadata() {
		return {
			sql: this.sql,
			driver: this.driver,
			columns: this.columns.map((col) => ({
				name: col.name,
				type: col.type,
			})),
			closed: this.closed,
		};
	}

	/**
	 * Close the prepared statement and release resources
	 * @returns {Promise<void>} Close promise
	 */
	async close() {
		if (this.closed) {
			return;
		}

		this.closed = true;

		try {
			if (this.driverStatement.close) {
				await this.driverStatement.close();
			}
		} catch (error) {
			// Log but don't throw errors during cleanup
			recordError(normalizeError(error, this.driver), this.driver, "close");
		}
	}

	/**
	 * Check if statement is closed
	 * @returns {boolean} True if closed
	 */
	isClosed() {
		return this.closed;
	}

	/**
	 * Get SQL query text
	 * @returns {string} SQL query
	 */
	getSql() {
		return this.sql;
	}

	/**
	 * Get column information
	 * @returns {Array} Column metadata
	 */
	getColumns() {
		return this.columns.map((col) => ({
			name: col.name,
			type: col.type,
		}));
	}

	/**
	 * Execute statement and return first row only
	 * @param {Array} [params] - Query parameters
	 * @param {StatementOptions} [options] - Execution options
	 * @returns {Promise<Object|Array|null>} First row or null
	 */
	async first(params = [], options = {}) {
		const result = await this.execute(params, options);
		return result.rows.length > 0 ? result.rows[0] : null;
	}

	/**
	 * Execute statement and return all rows as array
	 * @param {Array} [params] - Query parameters
	 * @param {StatementOptions} [options] - Execution options
	 * @returns {Promise<Array>} Array of rows
	 */
	async all(params = [], options = {}) {
		const result = await this.execute(params, options);
		return result.rows;
	}

	/**
	 * Execute statement and collect streamed results
	 * @param {Array} [params] - Query parameters
	 * @param {StatementOptions} [options] - Execution options
	 * @returns {Promise<Array>} Array of rows
	 */
	async collect(params = [], options = {}) {
		const rows = [];
		for await (const row of this.stream(params, options)) {
			rows.push(row);
		}
		return rows;
	}

	/**
	 * Execute statement for each row in a batch
	 * @param {Array<Array>} paramBatches - Array of parameter arrays
	 * @param {StatementOptions} [options] - Execution options
	 * @returns {Promise<Array>} Array of results
	 */
	async batch(paramBatches, options = {}) {
		if (!Array.isArray(paramBatches)) {
			throw new Error("Parameter batches must be an array");
		}

		const results = [];
		for (const params of paramBatches) {
			if (options.signal?.aborted) {
				throw new Error("Operation was cancelled");
			}

			const result = await this.execute(params, options);
			results.push(result);
		}

		return results;
	}

	/**
	 * Execute statement with automatic retry on retryable errors
	 * @param {Array} [params] - Query parameters
	 * @param {StatementOptions & {retries?: number, retryDelay?: number}} [options] - Options with retry config
	 * @returns {Promise<{rows: Array, rowCount?: number}>} Query result
	 */
	async executeWithRetry(params = [], options = {}) {
		const { retries = 3, retryDelay = 1000, ...executeOptions } = options;
		let lastError;

		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				return await this.execute(params, executeOptions);
			} catch (error) {
				lastError = error;

				// Don't retry on last attempt or non-retryable errors
				if (attempt === retries || !this._isRetryableError(error)) {
					break;
				}

				// Wait before retry
				if (retryDelay > 0) {
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}

		throw lastError;
	}

	/**
	 * Check if error is retryable
	 * @param {Error} error - Error to check
	 * @returns {boolean} True if retryable
	 * @private
	 */
	_isRetryableError(error) {
		// Import here to avoid circular dependency
		const { isRetryableError } = require("./errors.js");
		return isRetryableError(error);
	}
}

/**
 * Create a statement wrapper
 * @param {DriverStatement} driverStatement - Driver-specific statement
 * @param {string} sql - Original SQL query
 * @param {string} driver - Database driver name
 * @param {StatementOptions} [options] - Statement options
 * @returns {Statement} Statement wrapper
 */
export function createStatement(driverStatement, sql, driver, options = {}) {
	return new Statement(driverStatement, sql, driver, options);
}

/**
 * Statement cache for managing prepared statements
 */
export class StatementCache {
	/**
	 * @param {number} [maxSize=100] - Maximum cache size
	 */
	constructor(maxSize = 100) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.accessOrder = [];
	}

	/**
	 * Get cached statement
	 * @param {string} sql - SQL query
	 * @returns {Statement|undefined} Cached statement
	 */
	get(sql) {
		const statement = this.cache.get(sql);
		if (statement) {
			// Move to end (most recently used)
			const index = this.accessOrder.indexOf(sql);
			if (index >= 0) {
				this.accessOrder.splice(index, 1);
			}
			this.accessOrder.push(sql);
		}
		return statement;
	}

	/**
	 * Set cached statement
	 * @param {string} sql - SQL query
	 * @param {Statement} statement - Statement to cache
	 */
	set(sql, statement) {
		// Remove if already exists
		if (this.cache.has(sql)) {
			const index = this.accessOrder.indexOf(sql);
			if (index >= 0) {
				this.accessOrder.splice(index, 1);
			}
		}

		// Add to cache
		this.cache.set(sql, statement);
		this.accessOrder.push(sql);

		// Evict LRU if over capacity
		if (this.cache.size > this.maxSize) {
			const lru = this.accessOrder.shift();
			const lruStatement = this.cache.get(lru);
			this.cache.delete(lru);

			// Close evicted statement
			if (lruStatement && !lruStatement.isClosed()) {
				lruStatement.close().catch(() => {
					// Ignore close errors
				});
			}
		}
	}

	/**
	 * Remove statement from cache
	 * @param {string} sql - SQL query
	 * @returns {boolean} True if removed
	 */
	delete(sql) {
		const statement = this.cache.get(sql);
		const removed = this.cache.delete(sql);

		if (removed) {
			const index = this.accessOrder.indexOf(sql);
			if (index >= 0) {
				this.accessOrder.splice(index, 1);
			}

			// Close removed statement
			if (statement && !statement.isClosed()) {
				statement.close().catch(() => {
					// Ignore close errors
				});
			}
		}

		return removed;
	}

	/**
	 * Clear all cached statements
	 * @returns {Promise<void>} Clear promise
	 */
	async clear() {
		const statements = Array.from(this.cache.values());
		this.cache.clear();
		this.accessOrder.length = 0;

		// Close all statements
		await Promise.allSettled(
			statements.map((statement) => {
				if (!statement.isClosed()) {
					return statement.close();
				}
			}),
		);
	}

	/**
	 * Get cache statistics
	 * @returns {Object} Cache stats
	 */
	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			hitRate: this._calculateHitRate(),
		};
	}

	/**
	 * Calculate hit rate (placeholder - would need hit/miss tracking)
	 * @returns {number} Hit rate percentage
	 * @private
	 */
	_calculateHitRate() {
		// This would require tracking hits/misses in a real implementation
		return 0;
	}
}

/**
 * Create a statement cache
 * @param {number} [maxSize=100] - Maximum cache size
 * @returns {StatementCache} Statement cache
 */
export function createStatementCache(maxSize = 100) {
	return new StatementCache(maxSize);
}
