/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Database diagnostics and performance monitoring utilities.
 *
 * Provides comprehensive monitoring, profiling, and diagnostic
 * capabilities for database operations. Includes query analysis,
 * connection health checks, and performance metrics collection.
 */

import { performance } from "node:perf_hooks";

/**
 * @typedef {Object} QueryProfile
 * @property {string} sql - SQL query
 * @property {Array} params - Query parameters
 * @property {number} duration - Execution duration (ms)
 * @property {number} timestamp - Execution timestamp
 * @property {number} rowCount - Number of rows affected/returned
 * @property {string} driver - Database driver
 * @property {string} operation - Operation type
 * @property {Object} [error] - Error information if failed
 */

/**
 * @typedef {Object} ConnectionMetrics
 * @property {number} activeConnections - Current active connections
 * @property {number} totalConnections - Total connections created
 * @property {number} failedConnections - Failed connection attempts
 * @property {number} avgConnectionTime - Average connection time (ms)
 * @property {number} poolSize - Current pool size
 * @property {number} poolWaitTime - Average pool wait time (ms)
 */

/**
 * @typedef {Object} PerformanceStats
 * @property {number} totalQueries - Total queries executed
 * @property {number} successfulQueries - Successful queries
 * @property {number} failedQueries - Failed queries
 * @property {number} avgQueryTime - Average query time (ms)
 * @property {number} slowQueries - Queries exceeding threshold
 * @property {Array<QueryProfile>} slowestQueries - Top slowest queries
 * @property {Object} queryTypes - Query type breakdown
 */

/**
 * Database diagnostics collector
 */
export class DiagnosticsCollector {
	/**
	 * @param {Object} [options={}] - Collector options
	 * @param {number} [options.slowQueryThreshold=1000] - Slow query threshold (ms)
	 * @param {number} [options.maxProfiles=1000] - Max query profiles to keep
	 * @param {boolean} [options.collectParams=false] - Whether to collect parameters
	 * @param {boolean} [options.enabled=true] - Whether collection is enabled
	 */
	constructor(options = {}) {
		this.options = {
			slowQueryThreshold: 1000,
			maxProfiles: 1000,
			collectParams: false,
			enabled: true,
			...options,
		};

		// Query profiles and metrics
		this.profiles = [];
		this.connectionMetrics = {
			activeConnections: 0,
			totalConnections: 0,
			failedConnections: 0,
			connectionTimes: [],
			poolWaitTimes: [],
		};

		// Performance counters
		this.counters = {
			totalQueries: 0,
			successfulQueries: 0,
			failedQueries: 0,
			queryTimes: [],
			queryTypes: new Map(),
		};

		// Slow query tracking
		this.slowQueries = [];
	}

	/**
	 * Record a query execution
	 * @param {string} sql - SQL query
	 * @param {Array} params - Query parameters
	 * @param {number} duration - Execution duration (ms)
	 * @param {number} rowCount - Number of rows
	 * @param {string} driver - Database driver
	 * @param {string} operation - Operation type
	 * @param {Error} [error] - Error if failed
	 */
	recordQuery(sql, params, duration, rowCount, driver, operation, error) {
		if (!this.options.enabled) return;

		const profile = {
			sql: this._sanitizeQuery(sql),
			params: this.options.collectParams ? params : [],
			duration,
			timestamp: Date.now(),
			rowCount,
			driver,
			operation,
			error: error ? this._sanitizeError(error) : null,
		};

		// Add to profiles
		this.profiles.push(profile);
		if (this.profiles.length > this.options.maxProfiles) {
			this.profiles.shift();
		}

		// Update counters
		this.counters.totalQueries++;
		this.counters.queryTimes.push(duration);

		if (error) {
			this.counters.failedQueries++;
		} else {
			this.counters.successfulQueries++;
		}

		// Track query types
		const queryType = this._getQueryType(sql);
		const currentCount = this.counters.queryTypes.get(queryType) || 0;
		this.counters.queryTypes.set(queryType, currentCount + 1);

		// Track slow queries
		if (duration >= this.options.slowQueryThreshold) {
			this.slowQueries.push(profile);
			this.slowQueries.sort((a, b) => b.duration - a.duration);
			if (this.slowQueries.length > 100) {
				this.slowQueries = this.slowQueries.slice(0, 100);
			}
		}

		// Limit query times array size
		if (this.counters.queryTimes.length > 10000) {
			this.counters.queryTimes = this.counters.queryTimes.slice(-5000);
		}
	}

	/**
	 * Record connection event
	 * @param {string} event - Event type ('create'|'close'|'error'|'pool_acquire'|'pool_release')
	 * @param {string} driver - Database driver
	 * @param {string} host - Database host
	 * @param {number} [duration] - Operation duration (ms)
	 * @param {boolean} [pooled] - Whether connection is pooled
	 */
	recordConnection(event, driver, host, duration, pooled) {
		if (!this.options.enabled) return;

		switch (event) {
			case "create":
				this.connectionMetrics.totalConnections++;
				this.connectionMetrics.activeConnections++;
				if (duration !== undefined) {
					this.connectionMetrics.connectionTimes.push(duration);
					if (this.connectionMetrics.connectionTimes.length > 1000) {
						this.connectionMetrics.connectionTimes =
							this.connectionMetrics.connectionTimes.slice(-500);
					}
				}
				break;

			case "close":
				this.connectionMetrics.activeConnections = Math.max(
					0,
					this.connectionMetrics.activeConnections - 1,
				);
				break;

			case "error":
				this.connectionMetrics.failedConnections++;
				break;

			case "pool_acquire":
				if (duration !== undefined) {
					this.connectionMetrics.poolWaitTimes.push(duration);
					if (this.connectionMetrics.poolWaitTimes.length > 1000) {
						this.connectionMetrics.poolWaitTimes =
							this.connectionMetrics.poolWaitTimes.slice(-500);
					}
				}
				break;
		}
	}

	/**
	 * Record error
	 * @param {Error} error - Error object
	 * @param {string} driver - Database driver
	 * @param {string} operation - Operation type
	 * @param {number} [startTime] - Operation start time
	 */
	recordError(error, driver, operation, startTime) {
		if (!this.options.enabled) return;

		const duration = startTime ? performance.now() - startTime : 0;
		this.recordQuery("", [], duration, 0, driver, operation, error);
	}

	/**
	 * Get performance statistics
	 * @returns {PerformanceStats} Performance statistics
	 */
	getStats() {
		const queryTimes = this.counters.queryTimes;
		const connectionTimes = this.connectionMetrics.connectionTimes;
		const poolWaitTimes = this.connectionMetrics.poolWaitTimes;

		return {
			totalQueries: this.counters.totalQueries,
			successfulQueries: this.counters.successfulQueries,
			failedQueries: this.counters.failedQueries,
			avgQueryTime: this._calculateAverage(queryTimes),
			minQueryTime: queryTimes.length > 0 ? Math.min(...queryTimes) : 0,
			maxQueryTime: queryTimes.length > 0 ? Math.max(...queryTimes) : 0,
			p50QueryTime: this._calculatePercentile(queryTimes, 0.5),
			p90QueryTime: this._calculatePercentile(queryTimes, 0.9),
			p95QueryTime: this._calculatePercentile(queryTimes, 0.95),
			p99QueryTime: this._calculatePercentile(queryTimes, 0.99),
			slowQueries: this.slowQueries.length,
			slowestQueries: this.slowQueries.slice(0, 10),
			queryTypes: Object.fromEntries(this.counters.queryTypes),
			connectionMetrics: {
				...this.connectionMetrics,
				avgConnectionTime: this._calculateAverage(connectionTimes),
				avgPoolWaitTime: this._calculateAverage(poolWaitTimes),
			},
		};
	}

	/**
	 * Get recent query profiles
	 * @param {number} [limit=100] - Maximum number of profiles
	 * @returns {Array<QueryProfile>} Recent query profiles
	 */
	getRecentQueries(limit = 100) {
		return this.profiles.slice(-limit).reverse();
	}

	/**
	 * Get slow queries
	 * @param {number} [limit=50] - Maximum number of queries
	 * @returns {Array<QueryProfile>} Slow queries
	 */
	getSlowQueries(limit = 50) {
		return this.slowQueries.slice(0, limit);
	}

	/**
	 * Get queries by type
	 * @param {string} type - Query type ('SELECT'|'INSERT'|'UPDATE'|'DELETE')
	 * @param {number} [limit=100] - Maximum number of queries
	 * @returns {Array<QueryProfile>} Queries of specified type
	 */
	getQueriesByType(type, limit = 100) {
		return this.profiles
			.filter((profile) => this._getQueryType(profile.sql) === type)
			.slice(-limit)
			.reverse();
	}

	/**
	 * Clear all collected data
	 */
	clear() {
		this.profiles = [];
		this.slowQueries = [];
		this.counters = {
			totalQueries: 0,
			successfulQueries: 0,
			failedQueries: 0,
			queryTimes: [],
			queryTypes: new Map(),
		};
		this.connectionMetrics = {
			activeConnections: 0,
			totalConnections: 0,
			failedConnections: 0,
			connectionTimes: [],
			poolWaitTimes: [],
		};
	}

	/**
	 * Enable/disable collection
	 * @param {boolean} enabled - Whether to enable collection
	 */
	setEnabled(enabled) {
		this.options.enabled = enabled;
	}

	/**
	 * Export diagnostics data
	 * @returns {Object} Exported data
	 */
	export() {
		return {
			options: this.options,
			stats: this.getStats(),
			recentQueries: this.getRecentQueries(50),
			slowQueries: this.getSlowQueries(25),
			timestamp: Date.now(),
		};
	}

	/**
	 * Import diagnostics data
	 * @param {Object} data - Data to import
	 */
	import(data) {
		if (data.options) {
			this.options = { ...this.options, ...data.options };
		}

		if (data.recentQueries) {
			this.profiles = [...this.profiles, ...data.recentQueries];
			if (this.profiles.length > this.options.maxProfiles) {
				this.profiles = this.profiles.slice(-this.options.maxProfiles);
			}
		}

		if (data.slowQueries) {
			this.slowQueries = [...this.slowQueries, ...data.slowQueries];
			this.slowQueries.sort((a, b) => b.duration - a.duration);
			this.slowQueries = this.slowQueries.slice(0, 100);
		}
	}

	/**
	 * Sanitize SQL query for logging
	 * @param {string} sql - SQL query
	 * @returns {string} Sanitized query
	 * @private
	 */
	_sanitizeQuery(sql) {
		// Remove excessive whitespace
		return sql.replace(/\s+/g, " ").trim();
	}

	/**
	 * Sanitize error for logging
	 * @param {Error} error - Error object
	 * @returns {Object} Sanitized error
	 * @private
	 */
	_sanitizeError(error) {
		return {
			message: error.message,
			code: error.code,
			errno: error.errno,
			sqlState: error.sqlState,
		};
	}

	/**
	 * Get query type from SQL
	 * @param {string} sql - SQL query
	 * @returns {string} Query type
	 * @private
	 */
	_getQueryType(sql) {
		const match = sql.trim().match(/^\s*(\w+)/i);
		return match ? match[1].toUpperCase() : "UNKNOWN";
	}

	/**
	 * Calculate average of array
	 * @param {Array<number>} values - Values to average
	 * @returns {number} Average value
	 * @private
	 */
	_calculateAverage(values) {
		if (values.length === 0) return 0;
		return values.reduce((sum, val) => sum + val, 0) / values.length;
	}

	/**
	 * Calculate percentile of array
	 * @param {Array<number>} values - Values to calculate percentile for
	 * @param {number} percentile - Percentile (0-1)
	 * @returns {number} Percentile value
	 * @private
	 */
	_calculatePercentile(values, percentile) {
		if (values.length === 0) return 0;

		const sorted = [...values].sort((a, b) => a - b);
		const index = Math.ceil(sorted.length * percentile) - 1;
		return sorted[Math.max(0, index)];
	}
}

/**
 * Database health checker
 */
export class HealthChecker {
	/**
	 * @param {Object} client - Database client
	 * @param {Object} [options={}] - Health check options
	 */
	constructor(client, options = {}) {
		this.client = client;
		this.options = {
			interval: 30000, // 30 seconds
			timeout: 5000, // 5 seconds
			retries: 3,
			query: "SELECT 1",
			...options,
		};

		this.isHealthy = true;
		this.lastCheck = 0;
		this.consecutiveFailures = 0;
		this.checkInterval = null;
	}

	/**
	 * Start health monitoring
	 */
	start() {
		if (this.checkInterval) {
			this.stop();
		}

		this.checkInterval = setInterval(() => {
			this.check().catch(() => {
				// Health check errors are handled internally
			});
		}, this.options.interval);

		// Perform initial check
		this.check().catch(() => {});
	}

	/**
	 * Stop health monitoring
	 */
	stop() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
	}

	/**
	 * Perform health check
	 * @returns {Promise<boolean>} Health status
	 */
	async check() {
		const startTime = performance.now();

		try {
			await this.client.query(this.options.query, [], {
				timeoutMs: this.options.timeout,
			});

			// Health check successful
			this.isHealthy = true;
			this.consecutiveFailures = 0;
			this.lastCheck = Date.now();

			return true;
		} catch (error) {
			this.consecutiveFailures++;

			// Mark as unhealthy after configured retries
			if (this.consecutiveFailures >= this.options.retries) {
				this.isHealthy = false;
			}

			this.lastCheck = Date.now();
			throw error;
		}
	}

	/**
	 * Get health status
	 * @returns {Object} Health status
	 */
	getStatus() {
		return {
			healthy: this.isHealthy,
			lastCheck: this.lastCheck,
			consecutiveFailures: this.consecutiveFailures,
			uptime: this.lastCheck ? Date.now() - this.lastCheck : 0,
		};
	}
}

/**
 * Query analyzer for performance insights
 */
export class QueryAnalyzer {
	/**
	 * @param {DiagnosticsCollector} collector - Diagnostics collector
	 */
	constructor(collector) {
		this.collector = collector;
	}

	/**
	 * Analyze query performance
	 * @param {Object} [options={}] - Analysis options
	 * @returns {Object} Analysis results
	 */
	analyze(options = {}) {
		const stats = this.collector.getStats();
		const profiles = this.collector.profiles;

		return {
			summary: this._analyzeSummary(stats),
			performance: this._analyzePerformance(stats, profiles),
			patterns: this._analyzePatterns(profiles),
			recommendations: this._generateRecommendations(stats, profiles),
		};
	}

	/**
	 * Analyze summary statistics
	 * @param {PerformanceStats} stats - Performance statistics
	 * @returns {Object} Summary analysis
	 * @private
	 */
	_analyzeSummary(stats) {
		const errorRate =
			stats.totalQueries > 0
				? (stats.failedQueries / stats.totalQueries) * 100
				: 0;

		const slowQueryRate =
			stats.totalQueries > 0
				? (stats.slowQueries / stats.totalQueries) * 100
				: 0;

		return {
			totalQueries: stats.totalQueries,
			errorRate: Math.round(errorRate * 100) / 100,
			slowQueryRate: Math.round(slowQueryRate * 100) / 100,
			avgQueryTime: Math.round(stats.avgQueryTime * 100) / 100,
			p95QueryTime: Math.round(stats.p95QueryTime * 100) / 100,
		};
	}

	/**
	 * Analyze performance characteristics
	 * @param {PerformanceStats} stats - Performance statistics
	 * @param {Array<QueryProfile>} profiles - Query profiles
	 * @returns {Object} Performance analysis
	 * @private
	 */
	_analyzePerformance(stats, profiles) {
		const recentProfiles = profiles.slice(-1000);
		const timeRanges = this._categorizeByTime(recentProfiles);

		return {
			queryDistribution: stats.queryTypes,
			timeRanges,
			bottlenecks: this._identifyBottlenecks(stats),
			trends: this._analyzeTrends(recentProfiles),
		};
	}

	/**
	 * Analyze query patterns
	 * @param {Array<QueryProfile>} profiles - Query profiles
	 * @returns {Object} Pattern analysis
	 * @private
	 */
	_analyzePatterns(profiles) {
		const patterns = new Map();
		const duplicates = new Map();

		for (const profile of profiles) {
			const normalized = this._normalizeQuery(profile.sql);

			if (patterns.has(normalized)) {
				patterns.set(normalized, patterns.get(normalized) + 1);
			} else {
				patterns.set(normalized, 1);
			}

			// Track exact duplicates
			if (duplicates.has(profile.sql)) {
				duplicates.set(profile.sql, duplicates.get(profile.sql) + 1);
			} else {
				duplicates.set(profile.sql, 1);
			}
		}

		// Find most common patterns
		const commonPatterns = Array.from(patterns.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10);

		const duplicateQueries = Array.from(duplicates.entries())
			.filter(([, count]) => count > 1)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10);

		return {
			commonPatterns,
			duplicateQueries,
			uniqueQueries: patterns.size,
		};
	}

	/**
	 * Generate performance recommendations
	 * @param {PerformanceStats} stats - Performance statistics
	 * @param {Array<QueryProfile>} profiles - Query profiles
	 * @returns {Array<string>} Recommendations
	 * @private
	 */
	_generateRecommendations(stats, profiles) {
		const recommendations = [];

		// High error rate
		if (stats.failedQueries / stats.totalQueries > 0.05) {
			recommendations.push(
				"High error rate detected. Review failed queries and connection stability.",
			);
		}

		// Slow queries
		if (stats.slowQueries > stats.totalQueries * 0.1) {
			recommendations.push(
				"Many slow queries detected. Consider adding indexes or optimizing queries.",
			);
		}

		// High average query time
		if (stats.avgQueryTime > 100) {
			recommendations.push(
				"High average query time. Review query complexity and database performance.",
			);
		}

		// Connection issues
		if (stats.connectionMetrics.failedConnections > 0) {
			recommendations.push(
				"Connection failures detected. Check network stability and database availability.",
			);
		}

		// Pool wait time
		if (stats.connectionMetrics.avgPoolWaitTime > 50) {
			recommendations.push(
				"High pool wait times. Consider increasing pool size or optimizing query performance.",
			);
		}

		return recommendations;
	}

	/**
	 * Categorize queries by execution time
	 * @param {Array<QueryProfile>} profiles - Query profiles
	 * @returns {Object} Time range categorization
	 * @private
	 */
	_categorizeByTime(profiles) {
		const ranges = {
			fast: 0, // < 10ms
			medium: 0, // 10-100ms
			slow: 0, // 100-1000ms
			verySlow: 0, // > 1000ms
		};

		for (const profile of profiles) {
			if (profile.duration < 10) {
				ranges.fast++;
			} else if (profile.duration < 100) {
				ranges.medium++;
			} else if (profile.duration < 1000) {
				ranges.slow++;
			} else {
				ranges.verySlow++;
			}
		}

		return ranges;
	}

	/**
	 * Identify performance bottlenecks
	 * @param {PerformanceStats} stats - Performance statistics
	 * @returns {Array<string>} Identified bottlenecks
	 * @private
	 */
	_identifyBottlenecks(stats) {
		const bottlenecks = [];

		if (stats.p95QueryTime > stats.avgQueryTime * 5) {
			bottlenecks.push("High P95 query time indicates query variability");
		}

		if (stats.connectionMetrics.avgPoolWaitTime > 10) {
			bottlenecks.push(
				"Pool contention - connections not available quickly enough",
			);
		}

		if (stats.failedQueries > stats.totalQueries * 0.01) {
			bottlenecks.push("Query failures affecting overall performance");
		}

		return bottlenecks;
	}

	/**
	 * Analyze performance trends
	 * @param {Array<QueryProfile>} profiles - Query profiles
	 * @returns {Object} Trend analysis
	 * @private
	 */
	_analyzeTrends(profiles) {
		if (profiles.length < 10) {
			return { insufficient_data: true };
		}

		const recent = profiles.slice(-Math.floor(profiles.length / 2));
		const older = profiles.slice(0, Math.floor(profiles.length / 2));

		const recentAvg =
			recent.reduce((sum, p) => sum + p.duration, 0) / recent.length;
		const olderAvg =
			older.reduce((sum, p) => sum + p.duration, 0) / older.length;

		const trend = recentAvg > olderAvg ? "degrading" : "improving";
		const change = Math.abs(recentAvg - olderAvg);

		return {
			trend,
			change: Math.round(change * 100) / 100,
			recentAvg: Math.round(recentAvg * 100) / 100,
			olderAvg: Math.round(olderAvg * 100) / 100,
		};
	}

	/**
	 * Normalize query for pattern matching
	 * @param {string} sql - SQL query
	 * @returns {string} Normalized query
	 * @private
	 */
	_normalizeQuery(sql) {
		return sql
			.replace(/\s+/g, " ")
			.replace(/\b\d+\b/g, "?")
			.replace(/'[^']*'/g, "?")
			.replace(/"[^"]*"/g, "?")
			.trim()
			.toLowerCase();
	}
}

/**
 * Create diagnostics collector
 * @param {Object} [options={}] - Collector options
 * @returns {DiagnosticsCollector} Diagnostics collector
 */
export function createDiagnostics(options = {}) {
	return new DiagnosticsCollector(options);
}

/**
 * Create health checker
 * @param {Object} client - Database client
 * @param {Object} [options={}] - Health check options
 * @returns {HealthChecker} Health checker
 */
export function createHealthChecker(client, options = {}) {
	return new HealthChecker(client, options);
}

/**
 * Create query analyzer
 * @param {DiagnosticsCollector} collector - Diagnostics collector
 * @returns {QueryAnalyzer} Query analyzer
 */
export function createAnalyzer(collector) {
	return new QueryAnalyzer(collector);
}
