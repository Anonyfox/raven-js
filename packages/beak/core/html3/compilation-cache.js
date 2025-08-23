/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Function compilation cache system
 *
 * Manages caching of compiled template functions using WeakMap for automatic
 * memory management. Tracks compilation statistics and optimizes cache usage.
 */

/**
 * Cache entry metadata for tracking compilation efficiency.
 *
 * @typedef {Object} CacheEntry
 * @property {Function} compiled - Compiled function
 * @property {number} hits - Number of cache hits
 * @property {number} compilationTime - Time taken to compile (ms)
 * @property {Date} created - Creation timestamp
 * @property {Date} lastUsed - Last access timestamp
 */

/**
 * Global compilation cache using WeakMap for automatic garbage collection.
 * Key: Original function reference
 * Value: CacheEntry with compiled function and metadata
 */
const compilationCache = new WeakMap();

/**
 * Global compilation statistics for monitoring cache efficiency.
 */
const cacheStats = {
	hits: 0,
	misses: 0,
	compilations: 0,
	totalCompilationTime: 0,
	errors: 0,
};

/**
 * Retrieves a compiled function from cache or returns null if not cached.
 *
 * @param {Function} originalFunc - Original function to look up
 * @returns {Function|null} Cached compiled function or null
 */
export function getCachedFunction(originalFunc) {
	const entry = compilationCache.get(originalFunc);

	if (entry) {
		// Update cache hit statistics
		entry.hits++;
		entry.lastUsed = new Date();
		cacheStats.hits++;

		return entry.compiled;
	}

	// Cache miss
	cacheStats.misses++;
	return null;
}

/**
 * Stores a compiled function in the cache with metadata.
 *
 * @param {Function} originalFunc - Original function (cache key)
 * @param {Function} compiledFunc - Compiled optimized function
 * @param {number} compilationTime - Time taken to compile (ms)
 * @returns {Function} The compiled function (for chaining)
 */
export function setCachedFunction(
	originalFunc,
	compiledFunc,
	compilationTime = 0,
) {
	const now = new Date();

	const entry = {
		compiled: compiledFunc,
		hits: 0,
		compilationTime,
		created: now,
		lastUsed: now,
	};

	compilationCache.set(originalFunc, entry);

	// Update global statistics
	cacheStats.compilations++;
	cacheStats.totalCompilationTime += compilationTime;

	return compiledFunc;
}

/**
 * Checks if a function is cached.
 *
 * @param {Function} originalFunc - Function to check
 * @returns {boolean} True if function is cached
 */
export function isCached(originalFunc) {
	return compilationCache.has(originalFunc);
}

/**
 * Gets compilation metadata for a cached function.
 *
 * @param {Function} originalFunc - Original function
 * @returns {CacheEntry|null} Cache entry metadata or null
 */
export function getCacheMetadata(originalFunc) {
	return compilationCache.get(originalFunc) || null;
}

/**
 * Clears the compilation cache (mainly for testing).
 * Note: This only clears the WeakMap references, actual GC depends on
 * whether original functions are still referenced elsewhere.
 *
 * @returns {void}
 */
export function clearCache() {
	// WeakMap doesn't have a clear() method, but we can reset the stats
	cacheStats.hits = 0;
	cacheStats.misses = 0;
	cacheStats.compilations = 0;
	cacheStats.totalCompilationTime = 0;
	cacheStats.errors = 0;

	// Note: Individual entries will be GC'd when original functions are unreferenced
}

/**
 * Gets current cache statistics.
 *
 * @returns {Object} Cache performance statistics
 */
export function getCacheStats() {
	const totalRequests = cacheStats.hits + cacheStats.misses;
	const hitRate = totalRequests > 0 ? cacheStats.hits / totalRequests : 0;
	const averageCompilationTime =
		cacheStats.compilations > 0
			? cacheStats.totalCompilationTime / cacheStats.compilations
			: 0;

	return {
		hits: cacheStats.hits,
		misses: cacheStats.misses,
		compilations: cacheStats.compilations,
		errors: cacheStats.errors,
		totalRequests,
		hitRate: Math.round(hitRate * 100) / 100,
		totalCompilationTime: cacheStats.totalCompilationTime,
		averageCompilationTime: Math.round(averageCompilationTime * 100) / 100,
	};
}

/**
 * Records a compilation error in statistics.
 *
 * @param {Error} error - Compilation error
 * @returns {void}
 */
export function recordCompilationError(error) {
	cacheStats.errors++;

	// Optional: Could log detailed error info for debugging
	if (typeof console !== "undefined" && console.debug) {
		console.debug("Template compilation error:", error.message);
	}
}

/**
 * Advanced cache analysis for optimization insights.
 *
 * @returns {Object} Detailed cache analysis
 */
export function analyzeCachePerformance() {
	const stats = getCacheStats();

	// Efficiency metrics
	const efficiency = {
		isEffective: stats.hitRate > 0.5, // >50% hit rate is good
		compilationWorthwhile: stats.averageCompilationTime < 10, // <10ms compilation is acceptable
		memoryEfficient: true, // WeakMap handles this automatically
	};

	// Performance insights
	const insights = [];

	if (stats.hitRate < 0.3) {
		insights.push(
			"Low cache hit rate - consider optimizing compilation triggers",
		);
	}

	if (stats.averageCompilationTime > 5) {
		insights.push(
			"High compilation time - consider simplifying template patterns",
		);
	}

	if (stats.errors > stats.compilations * 0.1) {
		insights.push("High error rate - check template compatibility");
	}

	if (stats.hits > 0 && stats.compilations === 0) {
		insights.push("Perfect cache utilization - all requests served from cache");
	}

	return {
		...stats,
		efficiency,
		insights,
		recommendation: generateCacheRecommendation(stats, efficiency),
	};
}

/**
 * Generates performance recommendations based on cache analysis.
 *
 * @param {Object} stats - Cache statistics
 * @param {Object} efficiency - Efficiency metrics
 * @returns {string} Performance recommendation
 */
function generateCacheRecommendation(stats, efficiency) {
	if (!efficiency.isEffective) {
		return "Cache hit rate is low. Consider pre-compiling frequently used templates or adjusting compilation triggers.";
	}

	if (!efficiency.compilationWorthwhile) {
		return "Compilation time is high. Consider simplifying template patterns or reducing function complexity.";
	}

	if (stats.errors > 0) {
		return "Compilation errors detected. Review template patterns for compatibility with compilation system.";
	}

	if (stats.totalRequests < 10) {
		return "Low usage detected. Cache benefits increase with higher template reuse.";
	}

	return "Cache is performing optimally. Template compilation is providing good performance benefits.";
}

/**
 * Smart cache preloader for known high-usage functions.
 * Can be used to pre-compile functions during application initialization.
 *
 * @param {Function[]} functions - Array of functions to pre-compile
 * @param {Object} options - Compilation options
 * @returns {Promise<Object>} Preloading results
 */
export async function preloadCache(functions, options = {}) {
	const results = {
		successful: 0,
		failed: 0,
		totalTime: 0,
		errors: [],
	};

	const startTime = performance.now();

	// Import compiler dynamically to avoid circular dependencies
	const { compileFunction } = await import("./template-compiler.js");

	for (const func of functions) {
		try {
			const compileStart = performance.now();
			const compiled = compileFunction(func, options);
			const compileTime = performance.now() - compileStart;

			setCachedFunction(func, compiled, compileTime);
			results.successful++;
		} catch (error) {
			results.failed++;
			results.errors.push({
				function: func.name || "<anonymous>",
				error: error.message,
			});
			recordCompilationError(error);
		}
	}

	results.totalTime = performance.now() - startTime;

	return results;
}

/**
 * Cache warming utility for development and testing.
 * Automatically identifies and pre-compiles template functions.
 *
 * @param {Object} moduleExports - Module containing template functions
 * @param {Object} options - Compilation options
 * @returns {Promise<Object>} Warming results
 */
export async function warmCache(moduleExports, options = {}) {
	// Find functions that look like template functions
	const templateFunctions = [];

	for (const [_name, value] of Object.entries(moduleExports)) {
		if (typeof value === "function") {
			const source = value.toString();
			// Check if function contains html3 template literals
			if (source.includes("html3`")) {
				templateFunctions.push(value);
			}
		}
	}

	if (templateFunctions.length === 0) {
		return {
			message: "No template functions found for warming",
			successful: 0,
			failed: 0,
			totalTime: 0,
		};
	}

	return preloadCache(templateFunctions, options);
}
