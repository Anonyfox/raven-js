/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Sliding window rate limiting with automatic memory management
 *
 * Memory-efficient sliding window rate limiter using optimized data structures.
 * Automatic cleanup prevents memory leaks in long-running applications.
 * Sub-second request batching reduces memory overhead for burst traffic.
 *
 * **Algorithm**: Sliding window with sub-second batching
 * **Memory**: O(k×n) where k = unique keys, n = average requests per window
 * **Performance**: O(1) for isAllowed(), O(k) for cleanup where k = total keys
 * **Accuracy**: 1-second granularity for request timestamps
 * **Cleanup**: Automatic expiry prevents unbounded memory growth
 */

/**
 * Rate limiting store implementing sliding window algorithm with memory optimization.
 * Tracks request timestamps per key with automatic cleanup of expired data.
 *
 * **Sub-second Batching**: Groups requests within same second to reduce memory usage
 * **Sliding Window**: Removes expired requests on each operation for accurate limits
 * **Memory Safety**: Periodic cleanup prevents accumulation of empty key entries
 */
export class RateLimitStore {
	/**
	 * Create a new rate limit store with configurable cleanup interval.
	 *
	 * **Cleanup Strategy**: Remove expired entries periodically to prevent memory bloat
	 * **Default Interval**: 5 minutes balances memory efficiency with CPU overhead
	 * **Memory Growth**: Without cleanup, memory usage grows linearly with unique request keys
	 *
	 * @param {number} [cleanupInterval=300000] - Cleanup interval in milliseconds (default: 5 minutes)
	 */
	constructor(cleanupInterval = 5 * 60 * 1000) {
		/** @type {Map<string, Array<{timestamp: number, count: number}>>} */
		this.store = new Map();
		this.cleanupInterval = cleanupInterval;
		this.lastCleanup = Date.now();
	}

	/**
	 * Check if request is allowed under current rate limits using sliding window.
	 * Performs window slide, request counting, and limit enforcement in single operation.
	 *
	 * **Window Sliding**: Removes expired requests before counting current requests
	 * **Request Batching**: Groups requests within same second to optimize memory
	 * **Early Rejection**: Returns false immediately if limit exceeded (no state modification)
	 * **Automatic Cleanup**: Triggers periodic cleanup to prevent memory accumulation
	 *
	 * @param {string} key - Rate limiting key (typically IP address or user ID)
	 * @param {number} maxRequests - Maximum requests allowed in window
	 * @param {number} windowMs - Time window duration in milliseconds
	 * @returns {boolean} true if request allowed and recorded, false if limit exceeded
	 */
	isAllowed(key, maxRequests, windowMs) {
		const now = Date.now();
		const windowStart = now - windowMs;

		// Periodic cleanup to prevent memory leaks
		if (now - this.lastCleanup > this.cleanupInterval) {
			this.cleanup(windowStart);
		}

		// Get or create request history for this key
		let requests = this.store.get(key);
		if (!requests) {
			requests = [];
			this.store.set(key, requests);
		}

		// Remove expired requests (sliding window)
		while (requests.length > 0 && requests[0].timestamp < windowStart) {
			requests.shift();
		}

		// Count current requests in window
		const currentCount = requests.reduce((sum, req) => sum + req.count, 0);

		// Check if request would exceed limit
		if (currentCount >= maxRequests) {
			return false;
		}

		// Add this request
		const lastRequest = requests[requests.length - 1];
		if (lastRequest && now - lastRequest.timestamp < 1000) {
			// Increment count for requests within same second (batch processing)
			lastRequest.count++;
		} else {
			// New time slot
			requests.push({ timestamp: now, count: 1 });
		}

		return true;
	}

	/**
	 * Remove expired entries from all keys to prevent memory leaks.
	 * Scans all stored keys and removes requests older than cutoff time.
	 *
	 * **Performance**: O(k×n) where k = keys, n = average requests per key
	 * **Memory Reclaim**: Deletes empty key entries to fully reclaim memory
	 * **Trigger Strategy**: Called automatically based on cleanup interval
	 * **Production Impact**: CPU spike during cleanup proportional to stored request count
	 *
	 * @param {number} cutoffTime - Timestamp cutoff - remove requests older than this
	 */
	cleanup(cutoffTime) {
		for (const [key, requests] of this.store.entries()) {
			// Remove expired requests
			while (requests.length > 0 && requests[0].timestamp < cutoffTime) {
				requests.shift();
			}

			// Remove empty entries
			if (requests.length === 0) {
				this.store.delete(key);
			}
		}

		this.lastCleanup = Date.now();
	}

	/**
	 * Get current store statistics for monitoring and capacity planning.
	 * Provides insights into memory usage and request distribution.
	 *
	 * **Monitoring Use**: Track memory growth and request patterns over time
	 * **Performance**: O(k×n) scan of all stored data - use sparingly in production
	 * **Capacity Planning**: Use totalKeys and totalRequests to predict memory requirements
	 *
	 * @returns {{totalKeys: number, totalRequests: number}} Memory and request statistics
	 */
	getStats() {
		let totalRequests = 0;
		for (const requests of this.store.values()) {
			totalRequests += requests.reduce((sum, req) => sum + req.count, 0);
		}

		return {
			totalKeys: this.store.size,
			totalRequests,
		};
	}

	/**
	 * Clear all rate limiting data immediately.
	 * Removes all stored request history for all keys.
	 *
	 * **Use Cases**: Testing, emergency reset, configuration changes
	 * **Effect**: All clients get fresh rate limit allowances immediately
	 * **Performance**: O(1) operation using Map.clear()
	 */
	clear() {
		this.store.clear();
	}
}
