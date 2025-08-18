/**
 * @fileoverview Tests for rate limiting functionality
 */

import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { RateLimitStore } from "./rate-limit.js";

describe("RateLimitStore", () => {
	let store;
	let originalDateNow;
	let mockTime = 1000000;

	beforeEach(() => {
		// Mock Date.now() for consistent testing
		originalDateNow = Date.now;
		Date.now = () => mockTime;

		store = new RateLimitStore(5000); // 5 second cleanup interval
	});

	// Restore Date.now after each test
	const restoreTime = () => {
		if (originalDateNow) {
			Date.now = originalDateNow;
		}
	};

	describe("constructor", () => {
		it("should create store with default cleanup interval", () => {
			restoreTime();
			const defaultStore = new RateLimitStore();
			assert.strictEqual(defaultStore.cleanupInterval, 5 * 60 * 1000);
			assert.ok(defaultStore.store instanceof Map);
		});

		it("should create store with custom cleanup interval", () => {
			restoreTime();
			const customStore = new RateLimitStore(10000);
			assert.strictEqual(customStore.cleanupInterval, 10000);
			assert.ok(customStore.store instanceof Map);
		});

		it("should initialize with current timestamp", () => {
			restoreTime();
			const now = Date.now();
			const timeStore = new RateLimitStore();
			assert.ok(timeStore.lastCleanup >= now);
			assert.ok(timeStore.lastCleanup <= Date.now());
		});
	});

	describe("isAllowed", () => {
		it("should allow requests under the limit", () => {
			const allowed = store.isAllowed("user1", 5, 10000);
			assert.strictEqual(allowed, true);
			assert.strictEqual(store.store.size, 1);

			// Verify the request was recorded
			const requests = store.store.get("user1");
			assert.strictEqual(requests.length, 1);
			assert.strictEqual(requests[0].count, 1);
			assert.strictEqual(requests[0].timestamp, mockTime);

			restoreTime();
		});

		it("should block requests when limit exceeded", () => {
			// Add 5 requests (at the limit)
			for (let i = 0; i < 5; i++) {
				const allowed = store.isAllowed("user1", 5, 10000);
				assert.strictEqual(allowed, true);
				mockTime += 100; // Advance time slightly
			}

			// 6th request should be blocked
			const blocked = store.isAllowed("user1", 5, 10000);
			assert.strictEqual(blocked, false);

			restoreTime();
		});

		it("should allow requests from different keys independently", () => {
			// User1 hits limit
			for (let i = 0; i < 5; i++) {
				store.isAllowed("user1", 5, 10000);
				mockTime += 100;
			}

			// User1 should be blocked
			assert.strictEqual(store.isAllowed("user1", 5, 10000), false);

			// User2 should still be allowed
			assert.strictEqual(store.isAllowed("user2", 5, 10000), true);

			restoreTime();
		});

		it("should implement sliding window correctly", () => {
			const windowMs = 10000; // 10 second window

			// Add 5 requests at start of window
			for (let i = 0; i < 5; i++) {
				assert.strictEqual(store.isAllowed("user1", 5, windowMs), true);
				mockTime += 100;
			}

			// Should be at limit
			assert.strictEqual(store.isAllowed("user1", 5, windowMs), false);

			// Move time forward to expire the first request
			mockTime += windowMs - 500 + 1; // Move beyond the first request's window

			// Should be allowed again (first request expired)
			assert.strictEqual(store.isAllowed("user1", 5, windowMs), true);

			restoreTime();
		});

		it("should batch requests within the same second", () => {
			// Multiple requests in same millisecond
			assert.strictEqual(store.isAllowed("user1", 10, 10000), true);
			assert.strictEqual(store.isAllowed("user1", 10, 10000), true);
			assert.strictEqual(store.isAllowed("user1", 10, 10000), true);

			// Should only have one entry with count=3
			const requests = store.store.get("user1");
			assert.strictEqual(requests.length, 1);
			assert.strictEqual(requests[0].count, 3);

			restoreTime();
		});

		it("should create separate entries for different time slots", () => {
			assert.strictEqual(store.isAllowed("user1", 10, 10000), true);

			mockTime += 1000; // Advance by 1 second
			assert.strictEqual(store.isAllowed("user1", 10, 10000), true);

			// Should have two entries
			const requests = store.store.get("user1");
			assert.strictEqual(requests.length, 2);
			assert.strictEqual(requests[0].count, 1);
			assert.strictEqual(requests[1].count, 1);

			restoreTime();
		});

		it("should handle edge case of exactly at limit", () => {
			// Add exactly 5 requests
			for (let i = 0; i < 5; i++) {
				assert.strictEqual(store.isAllowed("user1", 5, 10000), true);
				mockTime += 100;
			}

			// Next request should be blocked
			assert.strictEqual(store.isAllowed("user1", 5, 10000), false);

			restoreTime();
		});

		it("should handle zero request limit", () => {
			const blocked = store.isAllowed("user1", 0, 10000);
			assert.strictEqual(blocked, false);

			restoreTime();
		});

		it("should handle very small window", () => {
			assert.strictEqual(store.isAllowed("user1", 5, 1), true);

			mockTime += 2; // Move past window
			assert.strictEqual(store.isAllowed("user1", 5, 1), true);

			// Should have cleaned up expired request
			const requests = store.store.get("user1");
			assert.strictEqual(requests.length, 1);

			restoreTime();
		});
	});

	describe("cleanup", () => {
		it("should remove expired requests from entries", () => {
			// Add requests at different times
			store.isAllowed("user1", 10, 10000);
			mockTime += 5000;
			store.isAllowed("user1", 10, 10000);
			mockTime += 5000;
			store.isAllowed("user1", 10, 10000);

			// Cleanup entries older than 8 seconds ago
			const cutoffTime = mockTime - 8000;
			store.cleanup(cutoffTime);

			// First request should be removed
			const requests = store.store.get("user1");
			assert.strictEqual(requests.length, 2);

			restoreTime();
		});

		it("should remove empty entries completely", () => {
			store.isAllowed("user1", 10, 10000);
			mockTime += 1000;
			store.isAllowed("user2", 10, 10000);

			// Cleanup all entries
			const cutoffTime = mockTime + 1000;
			store.cleanup(cutoffTime);

			// Both entries should be removed
			assert.strictEqual(store.store.size, 0);

			restoreTime();
		});

		it("should update lastCleanup timestamp", () => {
			const oldCleanup = store.lastCleanup;
			mockTime += 5000;

			store.cleanup(mockTime);

			assert.ok(store.lastCleanup > oldCleanup);

			restoreTime();
		});

		it("should handle cleanup of completely expired entries", () => {
			// Add some requests
			store.isAllowed("user1", 10, 10000);
			store.isAllowed("user2", 10, 10000);

			// Move time forward significantly
			mockTime += 20000;

			// Cleanup with current time as cutoff
			store.cleanup(mockTime);

			// All entries should be removed
			assert.strictEqual(store.store.size, 0);

			restoreTime();
		});

		it("should handle empty store gracefully", () => {
			// Cleanup empty store should not throw
			assert.doesNotThrow(() => {
				store.cleanup(mockTime);
			});

			restoreTime();
		});
	});

	describe("automatic cleanup trigger", () => {
		it("should trigger cleanup when cleanup interval exceeded", () => {
			// Set up store with 1 second cleanup interval
			const fastStore = new RateLimitStore(1000);

			// Add a request
			fastStore.isAllowed("user1", 10, 10000);

			// Advance time past cleanup interval
			mockTime += 1500;

			// Add another request - should trigger cleanup
			const oldLastCleanup = fastStore.lastCleanup;
			fastStore.isAllowed("user2", 10, 10000);

			// Cleanup should have been triggered
			assert.ok(fastStore.lastCleanup > oldLastCleanup);

			restoreTime();
		});

		it("should not trigger cleanup when interval not exceeded", () => {
			// Add a request
			store.isAllowed("user1", 10, 10000);

			// Advance time but not past cleanup interval
			mockTime += 1000;

			// Add another request
			const oldLastCleanup = store.lastCleanup;
			store.isAllowed("user2", 10, 10000);

			// Cleanup should not have been triggered
			assert.strictEqual(store.lastCleanup, oldLastCleanup);

			restoreTime();
		});
	});

	describe("getStats", () => {
		it("should return correct statistics for empty store", () => {
			const stats = store.getStats();
			assert.deepStrictEqual(stats, {
				totalKeys: 0,
				totalRequests: 0,
			});

			restoreTime();
		});

		it("should count total keys and requests correctly", () => {
			// Add requests for multiple users
			store.isAllowed("user1", 10, 10000);
			store.isAllowed("user1", 10, 10000); // Same second, should batch

			mockTime += 1000;
			store.isAllowed("user1", 10, 10000); // Different second

			store.isAllowed("user2", 10, 10000);

			const stats = store.getStats();
			assert.strictEqual(stats.totalKeys, 2);
			assert.strictEqual(stats.totalRequests, 4); // 2 + 1 + 1

			restoreTime();
		});

		it("should handle batched requests in statistics", () => {
			// Add multiple requests in same second
			for (let i = 0; i < 5; i++) {
				store.isAllowed("user1", 10, 10000);
			}

			const stats = store.getStats();
			assert.strictEqual(stats.totalKeys, 1);
			assert.strictEqual(stats.totalRequests, 5);

			restoreTime();
		});

		it("should reflect changes after cleanup", () => {
			// Add requests
			store.isAllowed("user1", 10, 10000);
			mockTime += 10000;
			store.isAllowed("user1", 10, 10000);

			// Initial stats
			let stats = store.getStats();
			assert.strictEqual(stats.totalRequests, 2);

			// Cleanup old requests
			store.cleanup(mockTime - 5000);

			// Stats should reflect cleanup
			stats = store.getStats();
			assert.strictEqual(stats.totalRequests, 1);

			restoreTime();
		});
	});

	describe("clear", () => {
		it("should remove all data from store", () => {
			// Add some data
			store.isAllowed("user1", 10, 10000);
			store.isAllowed("user2", 10, 10000);

			assert.strictEqual(store.store.size, 2);

			// Clear store
			store.clear();

			assert.strictEqual(store.store.size, 0);

			// Stats should reflect empty store
			const stats = store.getStats();
			assert.deepStrictEqual(stats, {
				totalKeys: 0,
				totalRequests: 0,
			});

			restoreTime();
		});

		it("should allow adding new data after clear", () => {
			// Add and clear data
			store.isAllowed("user1", 10, 10000);
			store.clear();

			// Should be able to add new data
			assert.strictEqual(store.isAllowed("user1", 10, 10000), true);
			assert.strictEqual(store.store.size, 1);

			restoreTime();
		});
	});

	describe("edge cases and error conditions", () => {
		it("should handle negative time values gracefully", () => {
			mockTime = -1000;

			// Should not throw and should work reasonably
			assert.doesNotThrow(() => {
				store.isAllowed("user1", 5, 10000);
			});

			restoreTime();
		});

		it("should handle very large request counts", () => {
			const allowed = store.isAllowed("user1", Number.MAX_SAFE_INTEGER, 10000);
			assert.strictEqual(allowed, true);

			restoreTime();
		});

		it("should handle very large time windows", () => {
			const allowed = store.isAllowed("user1", 5, Number.MAX_SAFE_INTEGER);
			assert.strictEqual(allowed, true);

			restoreTime();
		});

		it("should handle string keys properly", () => {
			// Test various string formats
			assert.strictEqual(store.isAllowed("", 5, 10000), true);
			assert.strictEqual(store.isAllowed("user with spaces", 5, 10000), true);
			assert.strictEqual(store.isAllowed("user@email.com", 5, 10000), true);
			assert.strictEqual(store.isAllowed("192.168.1.1", 5, 10000), true);

			// Should have 4 different keys
			assert.strictEqual(store.store.size, 4);

			restoreTime();
		});

		it("should handle rapid successive calls", () => {
			// Many calls in tight loop
			let allowedCount = 0;
			for (let i = 0; i < 100; i++) {
				if (store.isAllowed("user1", 10, 10000)) {
					allowedCount++;
				}
			}

			// Should allow exactly 10 requests
			assert.strictEqual(allowedCount, 10);

			restoreTime();
		});

		it("should handle cleanup with future cutoff time", () => {
			store.isAllowed("user1", 10, 10000);

			// Cleanup with future time
			store.cleanup(mockTime + 10000);

			// All entries should be removed
			assert.strictEqual(store.store.size, 0);

			restoreTime();
		});
	});

	describe("memory management", () => {
		it("should prevent unlimited memory growth", () => {
			// Add many requests over time
			for (let i = 0; i < 1000; i++) {
				store.isAllowed(`user${i}`, 5, 1000);
				mockTime += 10;
			}

			// Force cleanup with current time
			store.cleanup(mockTime);

			// Most entries should be cleaned up (only recent ones remain)
			assert.ok(store.store.size < 100);

			restoreTime();
		});

		it("should handle sliding window memory efficiently", () => {
			const key = "user1";
			const windowMs = 1000;

			// Add requests that should slide out of window
			for (let i = 0; i < 100; i++) {
				store.isAllowed(key, 1000, windowMs);
				mockTime += 100; // Each request is 100ms apart
			}

			// Only recent requests should remain in window
			const requests = store.store.get(key);
			assert.ok(requests.length < 100);

			restoreTime();
		});
	});
});
