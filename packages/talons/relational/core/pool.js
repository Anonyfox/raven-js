/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Generic FIFO connection pool for database drivers.
 *
 * Provides a high-performance connection pool with fairness guarantees,
 * automatic cleanup, and configurable sizing. Handles connection lifecycle,
 * error recovery, and backpressure management across all database drivers.
 */

import { isConnectionError, normalizeError } from "./errors.js";
import { createDeferred, timer } from "./utils.js";

/**
 * @typedef {Object} PoolConfig
 * @property {number} max - Maximum number of connections
 * @property {number} min - Minimum number of connections to maintain
 * @property {number} idleMs - Idle timeout in milliseconds
 * @property {number} acquireMs - Acquire timeout in milliseconds
 */

/**
 * @typedef {Object} PoolConnection
 * @property {any} connection - The actual database connection
 * @property {number} createdAt - Timestamp when connection was created
 * @property {number} lastUsed - Timestamp when connection was last used
 * @property {boolean} inUse - Whether connection is currently in use
 * @property {string} id - Unique connection identifier
 */

/**
 * @typedef {Object} PoolStats
 * @property {number} size - Current pool size
 * @property {number} available - Available connections
 * @property {number} pending - Pending acquisition requests
 * @property {number} created - Total connections created
 * @property {number} destroyed - Total connections destroyed
 * @property {number} acquired - Total acquisitions
 * @property {number} released - Total releases
 */

/**
 * Generic connection pool implementation
 */
export class ConnectionPool {
	/**
	 * @param {PoolConfig} config - Pool configuration
	 * @param {Function} factory - Connection factory function
	 * @param {Function} [destroyer] - Connection destroyer function
	 * @param {Function} [validator] - Connection validator function
	 */
	constructor(config, factory, destroyer, validator) {
		this.config = {
			max: 10,
			min: 0,
			idleMs: 30_000,
			acquireMs: 10_000,
			...config,
		};

		this.factory = factory;
		this.destroyer = destroyer || ((conn) => conn.close?.());
		this.validator = validator || (() => true);

		// Pool state
		this.connections = new Map(); // id -> PoolConnection
		this.available = []; // Available connection IDs (FIFO queue)
		this.pending = []; // Pending acquisition requests
		this.destroyed = false;

		// Statistics
		this.stats = {
			size: 0,
			available: 0,
			pending: 0,
			created: 0,
			destroyed: 0,
			acquired: 0,
			released: 0,
		};

		// Cleanup timer
		this.cleanupTimer = null;
		this.nextConnectionId = 1;

		// Start with minimum connections
		this._warmup();
	}

	/**
	 * Acquire a connection from the pool
	 * @param {AbortSignal} [signal] - Abort signal for cancellation
	 * @returns {Promise<any>} Database connection
	 */
	async acquire(signal) {
		if (this.destroyed) {
			throw new Error("Pool has been destroyed");
		}

		// Check for available connection first
		const availableId = this.available.shift();
		if (availableId) {
			const poolConn = this.connections.get(availableId);
			if (poolConn && this._isConnectionValid(poolConn)) {
				poolConn.inUse = true;
				poolConn.lastUsed = Date.now();
				this.stats.available--;
				this.stats.acquired++;
				return poolConn.connection;
			} else {
				// Connection is invalid, remove it
				if (poolConn) {
					this._destroyConnection(poolConn.id);
				}
			}
		}

		// Try to create new connection if under limit
		if (this.stats.size < this.config.max) {
			try {
				const poolConn = await this._createConnection();
				poolConn.inUse = true;
				poolConn.lastUsed = Date.now();
				this.stats.acquired++;
				return poolConn.connection;
			} catch (error) {
				// If creation fails and no pending requests, propagate error
				if (this.pending.length === 0) {
					throw normalizeError(error, "pool");
				}
				// Otherwise, fall through to queuing
			}
		}

		// Queue the request
		const deferred = createDeferred();
		const request = {
			deferred,
			signal,
			createdAt: Date.now(),
		};

		this.pending.push(request);
		this.stats.pending++;

		// Handle abort signal
		if (signal) {
			if (signal.aborted) {
				this._removePendingRequest(request);
				throw new Error("Operation was cancelled");
			}

			const abortHandler = () => {
				this._removePendingRequest(request);
				deferred.reject(new Error("Operation was cancelled"));
			};
			signal.addEventListener("abort", abortHandler, { once: true });
		}

		// Handle acquire timeout
		if (this.config.acquireMs > 0) {
			setTimeout(() => {
				if (this.pending.includes(request)) {
					this._removePendingRequest(request);
					deferred.reject(
						new Error(`Acquire timeout after ${this.config.acquireMs}ms`),
					);
				}
			}, this.config.acquireMs);
		}

		return deferred.promise;
	}

	/**
	 * Release a connection back to the pool
	 * @param {any} connection - Database connection to release
	 * @param {boolean} [destroy=false] - Whether to destroy the connection
	 */
	release(connection, destroy = false) {
		if (this.destroyed) {
			return;
		}

		// Find the pool connection
		let poolConn = null;
		for (const [id, conn] of this.connections) {
			if (conn.connection === connection) {
				poolConn = conn;
				break;
			}
		}

		if (!poolConn) {
			// Connection not found in pool, try to destroy it
			try {
				this.destroyer(connection);
			} catch {
				// Ignore errors during cleanup
			}
			return;
		}

		poolConn.inUse = false;
		poolConn.lastUsed = Date.now();
		this.stats.released++;

		if (destroy || !this._isConnectionValid(poolConn)) {
			this._destroyConnection(poolConn.id);
		} else {
			// Try to fulfill pending request
			if (this.pending.length > 0) {
				const request = this.pending.shift();
				this.stats.pending--;

				poolConn.inUse = true;
				poolConn.lastUsed = Date.now();
				this.stats.acquired++;

				request.deferred.resolve(poolConn.connection);
			} else {
				// Add back to available pool
				this.available.push(poolConn.id);
				this.stats.available++;

				// Schedule cleanup if needed
				this._scheduleCleanup();
			}
		}
	}

	/**
	 * Destroy the pool and all connections
	 * @returns {Promise<void>} Promise that resolves when all connections are closed
	 */
	async destroy() {
		if (this.destroyed) {
			return;
		}

		this.destroyed = true;

		// Clear cleanup timer
		if (this.cleanupTimer) {
			clearTimeout(this.cleanupTimer);
			this.cleanupTimer = null;
		}

		// Reject all pending requests
		for (const request of this.pending) {
			request.deferred.reject(new Error("Pool was destroyed"));
		}
		this.pending.length = 0;
		this.stats.pending = 0;

		// Destroy all connections
		const destroyPromises = [];
		for (const [id, poolConn] of this.connections) {
			destroyPromises.push(this._destroyConnectionAsync(poolConn));
		}

		await Promise.allSettled(destroyPromises);
		this.connections.clear();
		this.available.length = 0;
		this.stats.size = 0;
		this.stats.available = 0;
	}

	/**
	 * Get current pool statistics
	 * @returns {PoolStats} Pool statistics
	 */
	getStats() {
		return { ...this.stats };
	}

	/**
	 * Test a connection with the pool (for monitoring)
	 * @returns {Promise<boolean>} True if a connection can be acquired and released
	 */
	async test() {
		try {
			const connection = await this.acquire();
			this.release(connection);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Create initial minimum connections
	 * @private
	 */
	async _warmup() {
		if (this.config.min <= 0) {
			return;
		}

		const promises = [];
		for (let i = 0; i < this.config.min; i++) {
			promises.push(
				this._createConnection().catch(() => {
					// Ignore warmup failures
				}),
			);
		}

		await Promise.allSettled(promises);
	}

	/**
	 * Create a new connection
	 * @returns {Promise<PoolConnection>} Pool connection
	 * @private
	 */
	async _createConnection() {
		const id = String(this.nextConnectionId++);
		const connection = await this.factory();
		const now = Date.now();

		const poolConn = {
			id,
			connection,
			createdAt: now,
			lastUsed: now,
			inUse: false,
		};

		this.connections.set(id, poolConn);
		this.stats.size++;
		this.stats.created++;

		return poolConn;
	}

	/**
	 * Destroy a connection
	 * @param {string} id - Connection ID
	 * @private
	 */
	_destroyConnection(id) {
		const poolConn = this.connections.get(id);
		if (!poolConn) {
			return;
		}

		this.connections.delete(id);
		this.stats.size--;
		this.stats.destroyed++;

		// Remove from available queue if present
		const availableIndex = this.available.indexOf(id);
		if (availableIndex >= 0) {
			this.available.splice(availableIndex, 1);
			this.stats.available--;
		}

		// Destroy the connection asynchronously
		this._destroyConnectionAsync(poolConn).catch(() => {
			// Ignore destruction errors
		});
	}

	/**
	 * Destroy a connection asynchronously
	 * @param {PoolConnection} poolConn - Pool connection
	 * @returns {Promise<void>} Destruction promise
	 * @private
	 */
	async _destroyConnectionAsync(poolConn) {
		try {
			await this.destroyer(poolConn.connection);
		} catch {
			// Ignore destruction errors
		}
	}

	/**
	 * Check if connection is valid
	 * @param {PoolConnection} poolConn - Pool connection
	 * @returns {boolean} True if valid
	 * @private
	 */
	_isConnectionValid(poolConn) {
		try {
			return this.validator(poolConn.connection);
		} catch {
			return false;
		}
	}

	/**
	 * Remove a pending request
	 * @param {Object} request - Pending request
	 * @private
	 */
	_removePendingRequest(request) {
		const index = this.pending.indexOf(request);
		if (index >= 0) {
			this.pending.splice(index, 1);
			this.stats.pending--;
		}
	}

	/**
	 * Schedule cleanup of idle connections
	 * @private
	 */
	_scheduleCleanup() {
		if (this.cleanupTimer || this.config.idleMs <= 0) {
			return;
		}

		this.cleanupTimer = setTimeout(() => {
			this._cleanup();
			this.cleanupTimer = null;

			// Reschedule if there are still idle connections
			if (this.available.length > 0) {
				this._scheduleCleanup();
			}
		}, this.config.idleMs);
	}

	/**
	 * Clean up idle connections
	 * @private
	 */
	_cleanup() {
		if (this.destroyed) {
			return;
		}

		const now = Date.now();
		const toDestroy = [];

		// Find connections that have been idle too long
		for (const id of this.available) {
			const poolConn = this.connections.get(id);
			if (!poolConn) {
				continue;
			}

			const idleTime = now - poolConn.lastUsed;
			if (idleTime >= this.config.idleMs) {
				// Don't destroy below minimum
				if (this.stats.size > this.config.min) {
					toDestroy.push(id);
				}
			}
		}

		// Destroy idle connections
		for (const id of toDestroy) {
			this._destroyConnection(id);
		}
	}
}

/**
 * Create a connection pool with the given configuration
 * @param {PoolConfig} config - Pool configuration
 * @param {Function} factory - Connection factory function
 * @param {Function} [destroyer] - Connection destroyer function
 * @param {Function} [validator] - Connection validator function
 * @returns {ConnectionPool} Connection pool instance
 */
export function createPool(config, factory, destroyer, validator) {
	return new ConnectionPool(config, factory, destroyer, validator);
}

/**
 * Pool-aware connection wrapper that automatically releases on error
 */
export class PooledConnection {
	/**
	 * @param {any} connection - Database connection
	 * @param {ConnectionPool} pool - Connection pool
	 */
	constructor(connection, pool) {
		this.connection = connection;
		this.pool = pool;
		this.released = false;
	}

	/**
	 * Release the connection back to the pool
	 * @param {boolean} [destroy=false] - Whether to destroy the connection
	 */
	release(destroy = false) {
		if (!this.released) {
			this.released = true;
			this.pool.release(this.connection, destroy);
		}
	}

	/**
	 * Execute a function with automatic connection release
	 * @param {Function} fn - Function to execute with connection
	 * @returns {Promise<any>} Function result
	 */
	async execute(fn) {
		try {
			const result = await fn(this.connection);
			this.release();
			return result;
		} catch (error) {
			// Release connection and mark as destroyed if it's a connection error
			this.release(isConnectionError(error));
			throw error;
		}
	}
}

/**
 * Create a pooled connection wrapper
 * @param {any} connection - Database connection
 * @param {ConnectionPool} pool - Connection pool
 * @returns {PooledConnection} Pooled connection wrapper
 */
export function createPooledConnection(connection, pool) {
	return new PooledConnection(connection, pool);
}
