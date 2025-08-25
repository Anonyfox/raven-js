/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file High-performance cache manager with TTL and intelligent invalidation.
 *
 * Implements memory-efficient caching for module resolution, import maps, and file
 * operations with automatic expiration, intelligent invalidation, and performance
 * optimization. Zero-dependency implementation optimized for development server
 * workflows with configurable policies.
 *
 * Cache categories:
 * - Module resolution cache (file paths, entry points)
 * - Import map cache (generated import maps)
 * - File metadata cache (stats, existence checks)
 * - Package resolution cache (package.json parsing)
 */

/**
 * Cache entry structure for internal management.
 *
 * @typedef {Object} CacheEntry
 * @property {any} value - Cached value
 * @property {number} timestamp - Creation timestamp
 * @property {number} ttl - Time to live in milliseconds
 * @property {number} hits - Access count for LRU
 * @property {string} [hash] - Content hash for validation
 */

/**
 * High-performance cache manager with automatic expiration and invalidation.
 *
 * Implements efficient caching strategies for module serving with intelligent
 * TTL management, memory optimization, and selective invalidation. Essential
 * for zero-build development server performance.
 *
 * **Performance**: Uses Map for O(1) operations with periodic cleanup to
 * maintain memory efficiency and prevent memory leaks.
 *
 * @example
 * ```javascript
 * const cache = new CacheManager({
 *   defaultTTL: 5000,
 *   maxSize: 1000,
 *   cleanupInterval: 30000
 * });
 *
 * // Cache module resolution
 * cache.set('module:/src/app.js', resolvedPath, { ttl: 10000 });
 * const cached = cache.get('module:/src/app.js');
 * ```
 */
export class CacheManager {
	/**
	 * @param {Object} [options={}] - Cache configuration
	 * @param {number} [options.defaultTTL=5000] - Default TTL in milliseconds
	 * @param {number} [options.maxSize=1000] - Maximum cache entries
	 * @param {number} [options.cleanupInterval=30000] - Cleanup interval in ms
	 * @param {boolean} [options.enableStats=false] - Enable hit/miss statistics
	 */
	constructor(options = {}) {
		const {
			defaultTTL = 5000,
			maxSize = 1000,
			cleanupInterval = 30000,
			enableStats = false,
		} = options;

		// Validate and sanitize configuration values
		/** @private */
		this.defaultTTL = Math.max(defaultTTL, 1); // Minimum 1ms TTL
		/** @private */
		this.maxSize = Math.max(maxSize, 1); // Minimum 1 entry
		/** @private */
		this.cleanupInterval = Math.max(cleanupInterval, 0); // 0 disables cleanup
		/** @private */
		this.enableStats = enableStats;

		/** @private @type {Map<string, CacheEntry>} */
		this.cache = new Map();
		/** @private */
		this.cleanupTimer = null;
		/** @private */
		this.stats = {
			hits: 0,
			misses: 0,
			sets: 0,
			evictions: 0,
			cleanups: 0,
		};

		// Start automatic cleanup
		this.startCleanup();
	}

	/**
	 * Retrieves a value from the cache.
	 *
	 * Automatically validates TTL and removes expired entries. Updates access
	 * statistics for LRU policies and performance monitoring.
	 *
	 * **Performance**: O(1) retrieval with automatic expiration handling
	 * to ensure cache consistency without manual intervention.
	 *
	 * @param {string} key - Cache key
	 * @returns {any|null} Cached value or null if not found/expired
	 *
	 * @example
	 * ```javascript
	 * const importMap = cache.get('importmap:workspace');
	 * if (importMap) {
	 *   return importMap; // Cache hit
	 * }
	 * ```
	 */
	get(key) {
		const entry = this.cache.get(key);
		if (!entry) {
			this.updateStats("miss");
			return null;
		}

		const now = Date.now();
		if (now > entry.timestamp + entry.ttl) {
			// Expired entry
			this.cache.delete(key);
			this.updateStats("miss");
			return null;
		}

		// Update access statistics
		entry.hits++;
		this.updateStats("hit");
		return entry.value;
	}

	/**
	 * Stores a value in the cache with optional TTL override.
	 *
	 * Implements intelligent cache management with size limits, LRU eviction,
	 * and optional content hashing for validation. Automatically manages
	 * memory usage to prevent cache bloat.
	 *
	 * **Memory Management**: Uses LRU eviction when cache reaches maximum
	 * size to maintain consistent memory usage patterns.
	 *
	 * @param {string} key - Cache key
	 * @param {any} value - Value to cache
	 * @param {Object} [options={}] - Caching options
	 * @param {number} [options.ttl] - Custom TTL in milliseconds
	 * @param {string} [options.hash] - Content hash for validation
	 * @returns {boolean} True if value was cached successfully
	 *
	 * @example
	 * ```javascript
	 * // Cache with default TTL
	 * cache.set('packages:workspace', packages);
	 *
	 * // Cache with custom TTL
	 * cache.set('file:/app.js', fileContent, { ttl: 60000 });
	 * ```
	 */
	set(key, value, options = {}) {
		const { ttl = this.defaultTTL, hash } = options;

		// Validate TTL to ensure it's positive
		const validTTL = Math.max(ttl, 1);

		// Check size limit and evict if necessary
		if (this.cache.size >= this.maxSize) {
			this.evictLRU();
		}

		const entry = {
			value,
			timestamp: Date.now(),
			ttl: validTTL,
			hits: 0,
			...(hash && { hash }),
		};

		this.cache.set(key, entry);
		this.updateStats("set");
		return true;
	}

	/**
	 * Checks if a key exists in the cache and is not expired.
	 *
	 * Performs efficient existence check without retrieving the value,
	 * useful for conditional operations and cache validation workflows.
	 *
	 * **Efficiency**: Validates expiration without affecting hit statistics
	 * to provide accurate cache state information.
	 *
	 * @param {string} key - Cache key to check
	 * @returns {boolean} True if key exists and is not expired
	 *
	 * @example
	 * ```javascript
	 * if (cache.has('module:/src/utils.js')) {
	 *   // Use cached resolution
	 * } else {
	 *   // Perform fresh resolution
	 * }
	 * ```
	 */
	has(key) {
		const entry = this.cache.get(key);
		if (!entry) {
			return false;
		}

		const now = Date.now();
		if (now > entry.timestamp + entry.ttl) {
			// Expired entry
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	/**
	 * Removes a specific key from the cache.
	 *
	 * Implements immediate cache invalidation for specific entries, essential
	 * for maintaining cache consistency when underlying data changes.
	 *
	 * @param {string} key - Cache key to remove
	 * @returns {boolean} True if key was found and removed
	 *
	 * @example
	 * ```javascript
	 * // Invalidate when file changes
	 * cache.delete('file:/package.json');
	 * ```
	 */
	delete(key) {
		return this.cache.delete(key);
	}

	/**
	 * Clears all cache entries matching a pattern.
	 *
	 * Implements selective cache invalidation using prefix matching or regex
	 * patterns. Essential for bulk invalidation when file system changes
	 * affect multiple cached entries.
	 *
	 * **Invalidation Strategy**: Supports prefix matching for efficient
	 * invalidation of related cache entries without full cache clear.
	 *
	 * @param {string|RegExp} pattern - Pattern to match keys for removal
	 * @returns {number} Number of entries removed
	 *
	 * @example
	 * ```javascript
	 * // Clear all module resolution cache
	 * cache.invalidate('module:');
	 *
	 * // Clear workspace-related entries
	 * cache.invalidate(/^workspace:/);
	 * ```
	 */
	invalidate(pattern) {
		let removed = 0;
		const keys = Array.from(this.cache.keys());

		for (const key of keys) {
			let shouldRemove = false;

			if (typeof pattern === "string") {
				// Prefix matching
				shouldRemove = key.startsWith(pattern);
			} else if (pattern instanceof RegExp) {
				// Regex matching
				shouldRemove = pattern.test(key);
			}

			if (shouldRemove) {
				this.cache.delete(key);
				removed++;
			}
		}

		if (removed > 0) {
			this.updateStats("invalidation", removed);
		}

		return removed;
	}

	/**
	 * Clears all cache entries.
	 *
	 * Implements complete cache reset for scenarios requiring full invalidation
	 * such as configuration changes or development server restarts.
	 *
	 * @returns {number} Number of entries cleared
	 *
	 * @example
	 * ```javascript
	 * // Clear everything on config change
	 * const cleared = cache.clear();
	 * console.log(`Cleared ${cleared} cache entries`);
	 * ```
	 */
	clear() {
		const size = this.cache.size;
		this.cache.clear();
		this.updateStats("clear", size);
		return size;
	}

	/**
	 * Gets current cache statistics.
	 *
	 * Provides comprehensive cache performance metrics for monitoring and
	 * optimization. Essential for understanding cache effectiveness and
	 * tuning cache policies.
	 *
	 * **Metrics**: Hit rate, memory usage, entry counts, and operation
	 * statistics for comprehensive cache performance analysis.
	 *
	 * @returns {Object} Cache statistics and metrics
	 *
	 * @example
	 * ```javascript
	 * const stats = cache.getStats();
	 * console.log(`Hit rate: ${stats.hitRate}%`);
	 * console.log(`Memory usage: ${stats.memoryUsage.entries} entries`);
	 * ```
	 */
	getStats() {
		const now = Date.now();
		let totalSize = 0;
		let expiredCount = 0;

		// Calculate memory usage and expired entries
		for (const [key, entry] of this.cache.entries()) {
			totalSize += this.estimateEntrySize(key, entry);
			if (now > entry.timestamp + entry.ttl) {
				expiredCount++;
			}
		}

		const totalRequests = this.stats.hits + this.stats.misses;
		const hitRate =
			totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			hits: this.stats.hits,
			misses: this.stats.misses,
			hitRate: Math.round(hitRate * 100) / 100,
			sets: this.stats.sets,
			evictions: this.stats.evictions,
			cleanups: this.stats.cleanups,
			expired: expiredCount,
			memoryUsage: {
				entries: this.cache.size,
				estimatedBytes: totalSize,
				averageEntrySize:
					this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0,
			},
			config: {
				defaultTTL: this.defaultTTL,
				maxSize: this.maxSize,
				cleanupInterval: this.cleanupInterval,
			},
		};
	}

	/**
	 * Manually triggers cache cleanup.
	 *
	 * Removes expired entries and performs memory optimization. Useful for
	 * manual cache management and testing scenarios where immediate cleanup
	 * is required.
	 *
	 * **Cleanup Strategy**: Removes expired entries and optimizes memory
	 * usage without affecting valid cache entries.
	 *
	 * @returns {number} Number of entries removed
	 *
	 * @example
	 * ```javascript
	 * // Force cleanup before memory-intensive operation
	 * const removed = cache.cleanup();
	 * console.log(`Cleaned up ${removed} expired entries`);
	 * ```
	 */
	cleanup() {
		const now = Date.now();
		let removed = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.timestamp + entry.ttl) {
				this.cache.delete(key);
				removed++;
			}
		}

		if (removed > 0) {
			this.updateStats("cleanup", removed);
		}

		return removed;
	}

	/**
	 * Gracefully shuts down the cache manager.
	 *
	 * Stops automatic cleanup timers and optionally clears all cached data.
	 * Essential for proper cleanup in testing and application shutdown
	 * scenarios.
	 *
	 * @param {Object} [options={}] - Shutdown options
	 * @param {boolean} [options.clearCache=false] - Whether to clear all data
	 *
	 * @example
	 * ```javascript
	 * // Clean shutdown
	 * await cache.destroy({ clearCache: true });
	 * ```
	 */
	destroy(options = {}) {
		const { clearCache = false } = options;

		// Stop cleanup timer
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}

		// Clear cache if requested
		if (clearCache) {
			this.clear();
		}
	}

	/**
	 * Creates a scoped cache key with namespace prefix.
	 *
	 * Implements namespaced caching for different cache categories to prevent
	 * key collisions and enable efficient selective invalidation.
	 *
	 * **Namespacing**: Provides logical separation of cache categories
	 * for improved organization and selective invalidation capabilities.
	 *
	 * @param {string} namespace - Cache namespace (e.g., 'module', 'importmap')
	 * @param {string} key - Base cache key
	 * @returns {string} Namespaced cache key
	 *
	 * @example
	 * ```javascript
	 * const moduleKey = cache.createKey('module', '/src/app.js');
	 * // Returns: 'module:/src/app.js'
	 * ```
	 */
	createKey(namespace, key) {
		return `${namespace}:${key}`;
	}

	/**
	 * Updates cache with dependency tracking for smart invalidation.
	 *
	 * Implements intelligent cache invalidation based on file dependencies.
	 * When a dependency changes, all dependent cache entries are automatically
	 * invalidated to maintain consistency.
	 *
	 * **Dependency Tracking**: Maintains relationships between cache entries
	 * and their dependencies for automatic invalidation cascades.
	 *
	 * @param {string} key - Cache key
	 * @param {any} value - Value to cache
	 * @param {string[]} dependencies - File paths this entry depends on
	 * @param {Object} [options={}] - Caching options
	 * @returns {boolean} True if value was cached successfully
	 *
	 * @example
	 * ```javascript
	 * // Cache import map with dependencies
	 * cache.setWithDependencies(
	 *   'importmap:workspace',
	 *   importMap,
	 *   ['/package.json', '/src/package.json']
	 * );
	 * ```
	 */
	setWithDependencies(key, value, dependencies, options = {}) {
		// Store the main cache entry
		const success = this.set(key, value, options);

		if (success && dependencies && dependencies.length > 0) {
			// Store dependency mapping
			const depKey = this.createKey("deps", key);
			this.set(depKey, dependencies, { ttl: options.ttl || this.defaultTTL });

			// Store reverse mapping for each dependency
			for (const dep of dependencies) {
				const reverseKey = this.createKey("reverse", dep);
				const existing = this.get(reverseKey) || [];
				if (!existing.includes(key)) {
					existing.push(key);
					this.set(reverseKey, existing, {
						ttl: options.ttl || this.defaultTTL,
					});
				}
			}
		}

		return success;
	}

	/**
	 * Invalidates cache entries based on file dependency changes.
	 *
	 * Implements cascade invalidation when a file dependency changes,
	 * automatically removing all cache entries that depend on the changed file.
	 *
	 * **Cascade Invalidation**: Efficiently removes all dependent cache
	 * entries when a dependency changes to maintain cache consistency.
	 *
	 * @param {string} filePath - Changed file path
	 * @returns {number} Number of entries invalidated
	 *
	 * @example
	 * ```javascript
	 * // Invalidate when package.json changes
	 * const invalidated = cache.invalidateDependency('/package.json');
	 * console.log(`Invalidated ${invalidated} dependent entries`);
	 * ```
	 */
	invalidateDependency(filePath) {
		const reverseKey = this.createKey("reverse", filePath);
		const dependentKeys = this.get(reverseKey);

		if (!dependentKeys || !Array.isArray(dependentKeys)) {
			return 0;
		}

		let invalidated = 0;

		// Remove all dependent entries
		for (const depKey of dependentKeys) {
			if (this.delete(depKey)) {
				invalidated++;
			}

			// Also remove the dependency mapping
			const depMapKey = this.createKey("deps", depKey);
			this.delete(depMapKey);
		}

		// Remove the reverse mapping
		this.delete(reverseKey);

		return invalidated;
	}

	// Private methods

	/**
	 * Starts the automatic cleanup timer.
	 * @private
	 */
	startCleanup() {
		if (this.cleanupInterval > 0) {
			this.cleanupTimer = setInterval(() => {
				this.cleanup();
			}, this.cleanupInterval);
		}
	}

	/**
	 * Evicts the least recently used entry.
	 * @private
	 */
	evictLRU() {
		let lruKey = null;
		let lruHits = Number.POSITIVE_INFINITY;
		let lruTimestamp = Number.POSITIVE_INFINITY;

		for (const [key, entry] of this.cache.entries()) {
			if (
				entry.hits < lruHits ||
				(entry.hits === lruHits && entry.timestamp < lruTimestamp)
			) {
				lruKey = key;
				lruHits = entry.hits;
				lruTimestamp = entry.timestamp;
			}
		}

		if (lruKey) {
			this.cache.delete(lruKey);
			this.updateStats("eviction");
		}
	}

	/**
	 * Updates cache statistics.
	 * @private
	 */
	updateStats(type, count = 1) {
		if (!this.enableStats) return;

		switch (type) {
			case "hit":
				this.stats.hits += count;
				break;
			case "miss":
				this.stats.misses += count;
				break;
			case "set":
				this.stats.sets += count;
				break;
			case "eviction":
				this.stats.evictions += count;
				break;
			case "cleanup":
				this.stats.cleanups++;
				break;
			case "invalidation":
				// Custom stat tracking for invalidations
				break;
			case "clear":
				// Custom stat tracking for clears
				break;
		}
	}

	/**
	 * Estimates memory usage of a cache entry.
	 * @private
	 */
	estimateEntrySize(key, entry) {
		// Rough estimation in bytes
		const keySize = key.length * 2; // UTF-16
		const valueSize = this.estimateValueSize(entry.value);
		const metadataSize = 64; // Rough estimate for timestamps, hits, etc.

		return keySize + valueSize + metadataSize;
	}

	/**
	 * Estimates memory usage of a value.
	 * @private
	 */
	estimateValueSize(value) {
		if (value === null || value === undefined) return 0;
		if (typeof value === "string") return value.length * 2;
		if (typeof value === "number") return 8;
		if (typeof value === "boolean") return 4;
		if (Array.isArray(value)) return value.length * 8; // Rough estimate
		if (typeof value === "object") return Object.keys(value).length * 16; // Rough estimate
		return 8; // Default estimate
	}
}

/**
 * Creates a cache manager instance with predefined configurations.
 *
 * Provides factory function for common cache configurations optimized for
 * different use cases in module serving and development workflows.
 *
 * **Presets**: Optimized configurations for development, production, and
 * testing scenarios with appropriate TTL and size limits.
 *
 * @param {string} preset - Configuration preset ('development', 'production', 'testing')
 * @param {Object} [overrides={}] - Configuration overrides
 * @returns {CacheManager} Configured cache manager instance
 *
 * @example
 * ```javascript
 * // Development cache with frequent invalidation
 * const devCache = createCacheManager('development');
 *
 * // Production cache with longer TTL
 * const prodCache = createCacheManager('production', { maxSize: 5000 });
 * ```
 */
export function createCacheManager(preset = "development", overrides = {}) {
	const presets = {
		development: {
			defaultTTL: 5000, // 5 seconds
			maxSize: 1000,
			cleanupInterval: 30000, // 30 seconds
			enableStats: true,
		},
		production: {
			defaultTTL: 300000, // 5 minutes
			maxSize: 10000,
			cleanupInterval: 120000, // 2 minutes
			enableStats: false,
		},
		testing: {
			defaultTTL: 1000, // 1 second
			maxSize: 100,
			cleanupInterval: 5000, // 5 seconds
			enableStats: true,
		},
	};

	const config = { ...presets[preset], ...overrides };
	return new CacheManager(config);
}

/**
 * Global cache instance for module serving.
 *
 * Pre-configured cache manager optimized for development workflows with
 * appropriate TTL and invalidation policies for module resolution.
 */
export const moduleCache = createCacheManager("development", {
	defaultTTL: 5000,
	maxSize: 2000,
	enableStats: true,
	cleanupInterval: 0, // Disable cleanup timer for global instance
});

export default CacheManager;
