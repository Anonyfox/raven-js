/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Metrics and monitoring hooks for database operations.
 *
 * Provides optional monitoring capabilities with no-op defaults for zero overhead.
 * Applications can register custom metric collectors for observability without
 * affecting performance when monitoring is disabled.
 */

/**
 * @typedef {Object} QueryMetrics
 * @property {string} sql - SQL query text (potentially truncated)
 * @property {number} duration - Query duration in milliseconds
 * @property {number} rows - Number of rows affected/returned
 * @property {boolean} cached - Whether result came from cache
 * @property {string} driver - Database driver used
 * @property {string} operation - Operation type ('query'|'prepare'|'execute'|'stream')
 */

/**
 * @typedef {Object} ConnectionMetrics
 * @property {string} driver - Database driver
 * @property {string} host - Database host
 * @property {number} duration - Connection duration in milliseconds
 * @property {boolean} pooled - Whether connection came from pool
 * @property {string} event - Event type ('acquire'|'release'|'create'|'destroy'|'error')
 */

/**
 * @typedef {Object} PoolMetrics
 * @property {number} size - Current pool size
 * @property {number} available - Available connections
 * @property {number} pending - Pending acquisition requests
 * @property {number} created - Total connections created
 * @property {number} destroyed - Total connections destroyed
 * @property {number} acquired - Total acquisitions
 * @property {number} released - Total releases
 * @property {string} event - Event type ('acquire'|'release'|'create'|'destroy'|'timeout'|'full')
 */

/**
 * @typedef {Object} ErrorMetrics
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} driver - Database driver
 * @property {string} operation - Operation that failed
 * @property {number} duration - Time until error occurred
 * @property {boolean} retryable - Whether error is retryable
 */

/**
 * Default no-op metric collectors (zero overhead)
 */
const defaultCollectors = {
	/**
	 * Called when a query is executed
	 * @param {QueryMetrics} metrics - Query metrics
	 */
	onQuery: () => {},

	/**
	 * Called on connection events
	 * @param {ConnectionMetrics} metrics - Connection metrics
	 */
	onConnection: () => {},

	/**
	 * Called on pool events
	 * @param {PoolMetrics} metrics - Pool metrics
	 */
	onPool: () => {},

	/**
	 * Called when an error occurs
	 * @param {ErrorMetrics} metrics - Error metrics
	 */
	onError: () => {},

	/**
	 * Called periodically with current stats
	 * @param {Object} stats - Current statistics
	 */
	onStats: () => {},
};

/**
 * Current metric collectors
 */
let collectors = { ...defaultCollectors };

/**
 * Register custom metric collectors
 * @param {Partial<typeof defaultCollectors>} customCollectors - Custom collectors
 */
export function registerCollectors(customCollectors) {
	collectors = {
		...defaultCollectors,
		...customCollectors,
	};
}

/**
 * Reset to default no-op collectors
 */
export function resetCollectors() {
	collectors = { ...defaultCollectors };
}

/**
 * Get current collectors (for testing)
 * @returns {typeof defaultCollectors} Current collectors
 */
export function getCollectors() {
	return collectors;
}

/**
 * Record query metrics
 * @param {string} sql - SQL query
 * @param {number} startTime - Query start time
 * @param {number} rows - Number of rows
 * @param {string} driver - Database driver
 * @param {string} operation - Operation type
 * @param {boolean} [cached=false] - Whether cached
 */
export function recordQuery(
	sql,
	startTime,
	rows,
	driver,
	operation,
	cached = false,
) {
	const duration = performance.now() - startTime;

	collectors.onQuery({
		sql: truncateQuery(sql),
		duration,
		rows,
		cached,
		driver,
		operation,
	});
}

/**
 * Record connection metrics
 * @param {string} event - Event type
 * @param {string} driver - Database driver
 * @param {string} [host] - Database host
 * @param {number} [startTime] - Operation start time
 * @param {boolean} [pooled=false] - Whether pooled
 */
export function recordConnection(
	event,
	driver,
	host,
	startTime,
	pooled = false,
) {
	const duration = startTime ? performance.now() - startTime : 0;

	collectors.onConnection({
		driver,
		host,
		duration,
		pooled,
		event,
	});
}

/**
 * Record pool metrics
 * @param {string} event - Event type
 * @param {Object} stats - Pool statistics
 */
export function recordPool(event, stats) {
	collectors.onPool({
		...stats,
		event,
	});
}

/**
 * Record error metrics
 * @param {Error} error - Error that occurred
 * @param {string} driver - Database driver
 * @param {string} operation - Operation that failed
 * @param {number} [startTime] - Operation start time
 * @param {boolean} [retryable=false] - Whether error is retryable
 */
export function recordError(
	error,
	driver,
	operation,
	startTime,
	retryable = false,
) {
	const duration = startTime ? performance.now() - startTime : 0;

	collectors.onError({
		code: error.code || "UNKNOWN_ERROR",
		message: error.message,
		driver,
		operation,
		duration,
		retryable,
	});
}

/**
 * Record periodic statistics
 * @param {Object} stats - Current statistics
 */
export function recordStats(stats) {
	collectors.onStats(stats);
}

/**
 * Truncate SQL query for logging (remove sensitive data, limit length)
 * @param {string} sql - SQL query
 * @param {number} [maxLength=200] - Maximum length
 * @returns {string} Truncated query
 */
export function truncateQuery(sql, maxLength = 200) {
	if (!sql || typeof sql !== "string") {
		return "";
	}

	// Remove extra whitespace and normalize
	const normalized = sql.replace(/\s+/g, " ").trim();

	if (normalized.length <= maxLength) {
		return normalized;
	}

	return normalized.slice(0, maxLength - 3) + "...";
}

/**
 * Create a timer for measuring operation duration
 * @returns {Object} Timer with start time and elapsed function
 */
export function createTimer() {
	const startTime = performance.now();

	return {
		startTime,
		elapsed() {
			return performance.now() - startTime;
		},
	};
}

/**
 * Utility metric collectors for common monitoring systems
 */
export const collectors = {
	/**
	 * Console logger (for development)
	 * @param {Object} [options] - Logger options
	 * @returns {Object} Console collectors
	 */
	console(options = {}) {
		const {
			logQueries = true,
			logConnections = true,
			logPools = true,
			logErrors = true,
			logStats = false,
			queryThreshold = 100, // Log slow queries over 100ms
		} = options;

		return {
			onQuery: logQueries
				? (metrics) => {
						if (metrics.duration >= queryThreshold) {
							console.log(
								`[SLOW QUERY] ${metrics.duration.toFixed(2)}ms: ${metrics.sql}`,
							);
						}
					}
				: undefined,

			onConnection: logConnections
				? (metrics) => {
						console.log(
							`[CONNECTION] ${metrics.event} ${metrics.driver}${metrics.host ? `@${metrics.host}` : ""} (${metrics.duration.toFixed(2)}ms)`,
						);
					}
				: undefined,

			onPool: logPools
				? (metrics) => {
						console.log(
							`[POOL] ${metrics.event} size=${metrics.size} available=${metrics.available} pending=${metrics.pending}`,
						);
					}
				: undefined,

			onError: logErrors
				? (metrics) => {
						console.error(
							`[DB ERROR] ${metrics.code}: ${metrics.message} (${metrics.operation}, ${metrics.duration.toFixed(2)}ms)`,
						);
					}
				: undefined,

			onStats: logStats
				? (stats) => {
						console.log(`[STATS]`, stats);
					}
				: undefined,
		};
	},

	/**
	 * Prometheus-style metrics collector
	 * @param {Object} [options] - Prometheus options
	 * @returns {Object} Prometheus collectors
	 */
	prometheus(options = {}) {
		const { prefix = "db_" } = options;
		const metrics = new Map();

		const getCounter = (name) => {
			if (!metrics.has(name)) {
				metrics.set(name, 0);
			}
			return metrics.get(name);
		};

		const incCounter = (name, value = 1) => {
			metrics.set(name, getCounter(name) + value);
		};

		return {
			onQuery: (queryMetrics) => {
				incCounter(`${prefix}queries_total`);
				incCounter(`${prefix}query_duration_ms`, queryMetrics.duration);
				incCounter(`${prefix}query_rows_total`, queryMetrics.rows);

				if (queryMetrics.cached) {
					incCounter(`${prefix}query_cache_hits`);
				}
			},

			onConnection: (connMetrics) => {
				incCounter(`${prefix}connections_${connMetrics.event}_total`);
				if (connMetrics.event === "create") {
					incCounter(`${prefix}connection_duration_ms`, connMetrics.duration);
				}
			},

			onPool: (poolMetrics) => {
				metrics.set(`${prefix}pool_size`, poolMetrics.size);
				metrics.set(`${prefix}pool_available`, poolMetrics.available);
				metrics.set(`${prefix}pool_pending`, poolMetrics.pending);
			},

			onError: (errorMetrics) => {
				incCounter(`${prefix}errors_total`);
				incCounter(
					`${prefix}errors_by_code_${errorMetrics.code.toLowerCase()}`,
				);
			},

			// Get current metrics for scraping
			getMetrics() {
				return Object.fromEntries(metrics);
			},

			// Reset all metrics
			reset() {
				metrics.clear();
			},
		};
	},

	/**
	 * StatsD-style metrics collector
	 * @param {Function} statsd - StatsD client function
	 * @param {Object} [options] - StatsD options
	 * @returns {Object} StatsD collectors
	 */
	statsd(statsd, options = {}) {
		const { prefix = "db." } = options;

		return {
			onQuery: (metrics) => {
				statsd.increment(`${prefix}query.count`, 1, [
					`driver:${metrics.driver}`,
					`operation:${metrics.operation}`,
				]);
				statsd.timing(`${prefix}query.duration`, metrics.duration, [
					`driver:${metrics.driver}`,
				]);
				statsd.gauge(`${prefix}query.rows`, metrics.rows, [
					`driver:${metrics.driver}`,
				]);
			},

			onConnection: (metrics) => {
				statsd.increment(`${prefix}connection.${metrics.event}`, 1, [
					`driver:${metrics.driver}`,
				]);
				if (metrics.duration > 0) {
					statsd.timing(`${prefix}connection.duration`, metrics.duration, [
						`driver:${metrics.driver}`,
					]);
				}
			},

			onPool: (metrics) => {
				statsd.gauge(`${prefix}pool.size`, metrics.size);
				statsd.gauge(`${prefix}pool.available`, metrics.available);
				statsd.gauge(`${prefix}pool.pending`, metrics.pending);
			},

			onError: (metrics) => {
				statsd.increment(`${prefix}error.count`, 1, [
					`driver:${metrics.driver}`,
					`code:${metrics.code}`,
					`operation:${metrics.operation}`,
				]);
			},
		};
	},
};

/**
 * Create a metrics middleware wrapper for database operations
 * @param {string} operation - Operation name
 * @param {string} driver - Database driver
 * @returns {Function} Middleware function
 */
export function createMetricsMiddleware(operation, driver) {
	return async (fn, ...args) => {
		const timer = createTimer();
		let rows = 0;
		let error = null;

		try {
			const result = await fn(...args);

			// Extract row count from result
			if (result && typeof result === "object") {
				if (typeof result.rowCount === "number") {
					rows = result.rowCount;
				} else if (Array.isArray(result.rows)) {
					rows = result.rows.length;
				} else if (Array.isArray(result)) {
					rows = result.length;
				}
			}

			// Record successful operation
			recordQuery(
				args[0] || "", // Assume first arg is SQL
				timer.startTime,
				rows,
				driver,
				operation,
			);

			return result;
		} catch (err) {
			error = err;

			// Record error
			recordError(err, driver, operation, timer.startTime);

			throw err;
		}
	};
}
