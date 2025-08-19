/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation
 *
 * Rate limiting store with sliding window algorithm
 * Memory-efficient with automatic cleanup of expired entries
 */
export class RateLimitStore {
	/**
	 * Create a new rate limit store
	 *
	 * @param {number} cleanupInterval - Interval for cleaning up expired entries (milliseconds)
	 */
	constructor(cleanupInterval = 5 * 60 * 1000) {
		/** @type {Map<string, Array<{timestamp: number, count: number}>>} */
		this.store = new Map();
		this.cleanupInterval = cleanupInterval;
		this.lastCleanup = Date.now();
	}

	/**
	 * Check if a request is allowed under rate limits
	 *
	 * @param {string} key - Rate limit key (usually IP address)
	 * @param {number} maxRequests - Maximum requests allowed
	 * @param {number} windowMs - Time window in milliseconds
	 * @returns {boolean} True if request is allowed
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
	 * Clean up expired entries to prevent memory leaks
	 *
	 * @param {number} cutoffTime - Remove entries older than this timestamp
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
	 * Get current statistics for monitoring
	 *
	 * @returns {{totalKeys: number, totalRequests: number}} Current store statistics
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
	 * Clear all rate limit data
	 */
	clear() {
		this.store.clear();
	}
}
