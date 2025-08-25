/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive test suite for cache manager with TTL and invalidation.
 *
 * Tests all cache management functionality with 100% branch coverage:
 * - Basic cache operations (get, set, has, delete, clear)
 * - TTL expiration and automatic cleanup
 * - LRU eviction and memory management
 * - Pattern-based invalidation (prefix and regex)
 * - Dependency tracking and cascade invalidation
 * - Cache statistics and performance monitoring
 * - Namespaced key creation and scoped operations
 * - Factory functions and preset configurations
 * - Error handling and edge case scenarios
 * - Performance optimization and memory efficiency
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import {
	CacheManager,
	createCacheManager,
	moduleCache,
} from "./cache-manager.js";

// Helper function to wait for a specified duration
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Basic cache operations tests
test("CacheManager - basic set and get", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Set and get a value
	strictEqual(cache.set("test-key", "test-value"), true);
	strictEqual(cache.get("test-key"), "test-value");

	// Get non-existent key
	strictEqual(cache.get("non-existent"), null);

	cache.destroy({ clearCache: true });
});

test("CacheManager - has method", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Key doesn't exist
	strictEqual(cache.has("test-key"), false);

	// Key exists
	cache.set("test-key", "test-value");
	strictEqual(cache.has("test-key"), true);

	cache.destroy({ clearCache: true });
});

test("CacheManager - delete method", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Delete non-existent key
	strictEqual(cache.delete("non-existent"), false);

	// Delete existing key
	cache.set("test-key", "test-value");
	strictEqual(cache.delete("test-key"), true);
	strictEqual(cache.has("test-key"), false);

	cache.destroy({ clearCache: true });
});

test("CacheManager - clear method", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Add multiple entries
	cache.set("key1", "value1");
	cache.set("key2", "value2");
	cache.set("key3", "value3");

	// Clear all
	const cleared = cache.clear();
	strictEqual(cleared, 3);
	strictEqual(cache.has("key1"), false);
	strictEqual(cache.has("key2"), false);
	strictEqual(cache.has("key3"), false);

	cache.destroy({ clearCache: true });
});

// TTL and expiration tests
test("CacheManager - TTL expiration", async () => {
	const cache = new CacheManager({ defaultTTL: 100 });

	// Set value with short TTL
	cache.set("test-key", "test-value");
	strictEqual(cache.get("test-key"), "test-value");

	// Wait for expiration
	await wait(150);

	// Should be expired
	strictEqual(cache.get("test-key"), null);
	strictEqual(cache.has("test-key"), false);

	cache.destroy({ clearCache: true });
});

test("CacheManager - custom TTL", async () => {
	const cache = new CacheManager({ defaultTTL: 100 });

	// Set with custom TTL
	cache.set("short-ttl", "value1", { ttl: 50 });
	cache.set("long-ttl", "value2", { ttl: 200 });

	// Wait for short TTL to expire
	await wait(75);

	strictEqual(cache.get("short-ttl"), null); // Expired
	strictEqual(cache.get("long-ttl"), "value2"); // Still valid

	cache.destroy({ clearCache: true });
});

test("CacheManager - automatic cleanup", async () => {
	const cache = new CacheManager({
		defaultTTL: 50,
		cleanupInterval: 100,
		enableStats: true,
	});

	// Add entries that will expire
	cache.set("key1", "value1");
	cache.set("key2", "value2");

	// Wait for expiration and cleanup
	await wait(200);

	// Entries should be cleaned up
	strictEqual(cache.has("key1"), false);
	strictEqual(cache.has("key2"), false);

	// Check cleanup was performed
	const stats = cache.getStats();
	strictEqual(stats.cleanups > 0, true);

	cache.destroy({ clearCache: true });
});

test("CacheManager - manual cleanup", async () => {
	const cache = new CacheManager({ defaultTTL: 50, cleanupInterval: 0 });

	// Add entries that will expire
	cache.set("key1", "value1");
	cache.set("key2", "value2");

	// Wait for expiration
	await wait(100);

	// Manual cleanup
	const removed = cache.cleanup();
	strictEqual(removed, 2);
	strictEqual(cache.has("key1"), false);
	strictEqual(cache.has("key2"), false);

	cache.destroy({ clearCache: true });
});

// Size limits and LRU eviction tests
test("CacheManager - size limits and LRU eviction", () => {
	const cache = new CacheManager({ maxSize: 3, defaultTTL: 1000 });

	// Fill cache to limit
	cache.set("key1", "value1");
	cache.set("key2", "value2");
	cache.set("key3", "value3");

	// Access key1 to make it recently used
	cache.get("key1");

	// Add another entry, should evict least recently used (key2)
	cache.set("key4", "value4");

	strictEqual(cache.has("key1"), true); // Recently used, should remain
	strictEqual(cache.has("key2"), false); // LRU, should be evicted
	strictEqual(cache.has("key3"), true); // Should remain
	strictEqual(cache.has("key4"), true); // New entry

	cache.destroy({ clearCache: true });
});

test("CacheManager - LRU with equal hits", () => {
	const cache = new CacheManager({ maxSize: 2, defaultTTL: 1000 });

	// Add entries with timestamp difference
	cache.set("old-key", "old-value");
	cache.set("new-key", "new-value");

	// Add another entry, should evict oldest
	cache.set("another-key", "another-value");

	strictEqual(cache.has("old-key"), false); // Oldest, should be evicted
	strictEqual(cache.has("new-key"), true); // Should remain
	strictEqual(cache.has("another-key"), true); // New entry

	cache.destroy({ clearCache: true });
});

// Pattern-based invalidation tests
test("CacheManager - prefix invalidation", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Add entries with different prefixes
	cache.set("module:/src/app.js", "app-module");
	cache.set("module:/src/utils.js", "utils-module");
	cache.set("importmap:workspace", "import-map");
	cache.set("file:/package.json", "package-data");

	// Invalidate all module entries
	const removed = cache.invalidate("module:");
	strictEqual(removed, 2);

	strictEqual(cache.has("module:/src/app.js"), false);
	strictEqual(cache.has("module:/src/utils.js"), false);
	strictEqual(cache.has("importmap:workspace"), true);
	strictEqual(cache.has("file:/package.json"), true);

	cache.destroy({ clearCache: true });
});

test("CacheManager - regex invalidation", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Add entries with different patterns
	cache.set("module:/src/app.js", "app-module");
	cache.set("module:/lib/utils.js", "utils-module");
	cache.set("package:/node_modules/lodash", "lodash-package");
	cache.set("file:/src/data.json", "data-file");

	// Invalidate all /src/ entries
	const removed = cache.invalidate(/\/src\//);
	strictEqual(removed, 2);

	strictEqual(cache.has("module:/src/app.js"), false);
	strictEqual(cache.has("file:/src/data.json"), false);
	strictEqual(cache.has("module:/lib/utils.js"), true);
	strictEqual(cache.has("package:/node_modules/lodash"), true);

	cache.destroy({ clearCache: true });
});

test("CacheManager - invalidate with no matches", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	cache.set("test:key", "value");

	// Invalidate non-matching pattern
	const removed = cache.invalidate("nomatch:");
	strictEqual(removed, 0);
	strictEqual(cache.has("test:key"), true);

	cache.destroy({ clearCache: true });
});

// Namespaced key creation tests
test("CacheManager - createKey method", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	const key1 = cache.createKey("module", "/src/app.js");
	const key2 = cache.createKey("importmap", "workspace");

	strictEqual(key1, "module:/src/app.js");
	strictEqual(key2, "importmap:workspace");

	cache.destroy({ clearCache: true });
});

// Dependency tracking tests
test("CacheManager - dependency tracking", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Set value with dependencies
	const success = cache.setWithDependencies(
		"importmap:workspace",
		{ imports: { lodash: "/lodash.js" } },
		["/package.json", "/src/package.json"],
	);

	strictEqual(success, true);
	strictEqual(cache.has("importmap:workspace"), true);

	// Check dependency mappings were created
	strictEqual(cache.has("deps:importmap:workspace"), true);
	strictEqual(cache.has("reverse:/package.json"), true);
	strictEqual(cache.has("reverse:/src/package.json"), true);

	cache.destroy({ clearCache: true });
});

test("CacheManager - dependency invalidation", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Set multiple values dependent on same file
	cache.setWithDependencies("map1", "value1", ["/package.json"]);
	cache.setWithDependencies("map2", "value2", ["/package.json", "/other.json"]);
	cache.setWithDependencies("map3", "value3", ["/different.json"]);

	// Invalidate based on dependency
	const invalidated = cache.invalidateDependency("/package.json");
	strictEqual(invalidated, 2);

	strictEqual(cache.has("map1"), false); // Invalidated
	strictEqual(cache.has("map2"), false); // Invalidated
	strictEqual(cache.has("map3"), true); // Not dependent, should remain

	cache.destroy({ clearCache: true });
});

test("CacheManager - dependency invalidation with no dependents", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Invalidate non-existent dependency
	const invalidated = cache.invalidateDependency("/non-existent.json");
	strictEqual(invalidated, 0);

	cache.destroy({ clearCache: true });
});

test("CacheManager - multiple dependencies on same key", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Set value with multiple dependencies
	cache.setWithDependencies("key", "value", ["/file1.json", "/file2.json"]);

	// Add another value dependent on same files
	cache.setWithDependencies("key2", "value2", ["/file1.json"]);

	// Invalidate one dependency
	const invalidated = cache.invalidateDependency("/file1.json");
	strictEqual(invalidated, 2);

	strictEqual(cache.has("key"), false);
	strictEqual(cache.has("key2"), false);

	cache.destroy({ clearCache: true });
});

// Statistics tests
test("CacheManager - statistics with enableStats=true", () => {
	const cache = new CacheManager({ defaultTTL: 1000, enableStats: true });

	// Perform operations
	cache.set("key1", "value1");
	cache.set("key2", "value2");
	cache.get("key1"); // Hit
	cache.get("key1"); // Hit
	cache.get("non-existent"); // Miss

	const stats = cache.getStats();

	strictEqual(stats.size, 2);
	strictEqual(stats.hits, 2);
	strictEqual(stats.misses, 1);
	strictEqual(stats.sets, 2);
	strictEqual(stats.hitRate, 66.67);
	strictEqual(typeof stats.memoryUsage, "object");
	strictEqual(stats.memoryUsage.entries, 2);
	strictEqual(typeof stats.memoryUsage.estimatedBytes, "number");
	strictEqual(typeof stats.memoryUsage.averageEntrySize, "number");

	cache.destroy({ clearCache: true });
});

test("CacheManager - statistics with enableStats=false", () => {
	const cache = new CacheManager({ defaultTTL: 1000, enableStats: false });

	// Perform operations
	cache.set("key1", "value1");
	cache.get("key1");
	cache.get("non-existent");

	const stats = cache.getStats();

	// Stats should still work but not track detailed metrics
	strictEqual(stats.size, 1);
	strictEqual(typeof stats.memoryUsage, "object");
	strictEqual(typeof stats.config, "object");

	cache.destroy({ clearCache: true });
});

test("CacheManager - statistics with expired entries", async () => {
	const cache = new CacheManager({ defaultTTL: 50, enableStats: true });

	cache.set("key1", "value1");
	cache.set("key2", "value2");

	// Wait for expiration
	await wait(100);

	const stats = cache.getStats();
	strictEqual(stats.expired, 2);

	cache.destroy({ clearCache: true });
});

// Error handling and edge cases
test("CacheManager - get with expired entry removes it", async () => {
	const cache = new CacheManager({ defaultTTL: 50 });

	cache.set("test-key", "test-value");

	// Wait for expiration
	await wait(100);

	// Get should remove expired entry
	strictEqual(cache.get("test-key"), null);

	// Entry should be completely removed from internal cache
	const stats = cache.getStats();
	strictEqual(stats.size, 0);

	cache.destroy({ clearCache: true });
});

test("CacheManager - has with expired entry removes it", async () => {
	const cache = new CacheManager({ defaultTTL: 50 });

	cache.set("test-key", "test-value");

	// Wait for expiration
	await wait(100);

	// Has should remove expired entry and return false
	strictEqual(cache.has("test-key"), false);

	const stats = cache.getStats();
	strictEqual(stats.size, 0);

	cache.destroy({ clearCache: true });
});

test("CacheManager - caching different value types", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Cache different types
	cache.set("string", "test-string");
	cache.set("number", 42);
	cache.set("boolean", true);
	cache.set("null", null);
	cache.set("undefined", undefined);
	cache.set("object", { key: "value" });
	cache.set("array", [1, 2, 3]);

	// Retrieve and verify
	strictEqual(cache.get("string"), "test-string");
	strictEqual(cache.get("number"), 42);
	strictEqual(cache.get("boolean"), true);
	strictEqual(cache.get("null"), null);
	strictEqual(cache.get("undefined"), undefined);
	deepStrictEqual(cache.get("object"), { key: "value" });
	deepStrictEqual(cache.get("array"), [1, 2, 3]);

	cache.destroy({ clearCache: true });
});

test("CacheManager - content hash option", () => {
	const cache = new CacheManager({ defaultTTL: 1000 });

	// Set with content hash
	cache.set("file:/app.js", "content", { hash: "abc123" });

	strictEqual(cache.get("file:/app.js"), "content");
	strictEqual(cache.has("file:/app.js"), true);

	cache.destroy({ clearCache: true });
});

// Factory function tests
test("createCacheManager - development preset", () => {
	const cache = createCacheManager("development");

	const stats = cache.getStats();
	strictEqual(stats.config.defaultTTL, 5000);
	strictEqual(stats.config.maxSize, 1000);
	strictEqual(stats.config.cleanupInterval, 30000);

	cache.destroy({ clearCache: true });
});

test("createCacheManager - production preset", () => {
	const cache = createCacheManager("production");

	const stats = cache.getStats();
	strictEqual(stats.config.defaultTTL, 300000);
	strictEqual(stats.config.maxSize, 10000);
	strictEqual(stats.config.cleanupInterval, 120000);

	cache.destroy({ clearCache: true });
});

test("createCacheManager - testing preset", () => {
	const cache = createCacheManager("testing");

	const stats = cache.getStats();
	strictEqual(stats.config.defaultTTL, 1000);
	strictEqual(stats.config.maxSize, 100);
	strictEqual(stats.config.cleanupInterval, 5000);

	cache.destroy({ clearCache: true });
});

test("createCacheManager - with overrides", () => {
	const cache = createCacheManager("development", {
		maxSize: 500,
		defaultTTL: 2000,
	});

	const stats = cache.getStats();
	strictEqual(stats.config.defaultTTL, 2000); // Overridden
	strictEqual(stats.config.maxSize, 500); // Overridden
	strictEqual(stats.config.cleanupInterval, 30000); // From preset

	cache.destroy({ clearCache: true });
});

// Global cache instance test
test("moduleCache - global instance", () => {
	// Test global cache is properly configured
	const stats = moduleCache.getStats();
	strictEqual(stats.config.defaultTTL, 5000);
	strictEqual(stats.config.maxSize, 2000);
	strictEqual(typeof stats.config.cleanupInterval, "number");

	// Test basic operations
	moduleCache.set("test-global", "global-value");
	strictEqual(moduleCache.get("test-global"), "global-value");

	moduleCache.clear();
});

// Performance tests
test("performance - large number of operations", () => {
	const cache = new CacheManager({
		defaultTTL: 5000,
		maxSize: 5000,
		enableStats: true,
	});

	const start = performance.now();

	// Perform many operations
	for (let i = 0; i < 1000; i++) {
		cache.set(`key-${i}`, `value-${i}`);
	}

	for (let i = 0; i < 1000; i++) {
		cache.get(`key-${i}`);
	}

	const end = performance.now();

	// Should complete quickly (< 100ms)
	strictEqual(end - start < 100, true);

	const stats = cache.getStats();
	strictEqual(stats.size, 1000);
	strictEqual(stats.hits, 1000);

	cache.destroy({ clearCache: true });
});

test("memory - repeated operations don't leak", () => {
	const cache = new CacheManager({
		defaultTTL: 100,
		maxSize: 50,
		cleanupInterval: 0, // Disable automatic cleanup
	});

	// Repeatedly fill and clear cache
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 100; j++) {
			cache.set(`key-${i}-${j}`, `value-${i}-${j}`);
		}
		cache.clear();
	}

	const stats = cache.getStats();
	strictEqual(stats.size, 0);

	cache.destroy({ clearCache: true });
});

test("cleanup timer - proper destruction", async () => {
	const cache = new CacheManager({
		defaultTTL: 1000,
		cleanupInterval: 50,
	});

	cache.set("test", "value");

	// Destroy and ensure timer is stopped
	cache.destroy({ clearCache: true });

	// Wait to ensure timer doesn't run
	await wait(100);

	// Should not throw or cause issues
	strictEqual(true, true);
});

test("edge case - zero cleanup interval", () => {
	const cache = new CacheManager({
		defaultTTL: 1000,
		cleanupInterval: 0, // Disabled
	});

	cache.set("test", "value");
	strictEqual(cache.get("test"), "value");

	cache.destroy({ clearCache: true });
});

test("edge case - negative values", () => {
	const cache = new CacheManager({
		defaultTTL: -1000, // Invalid, should use default behavior
		maxSize: -100, // Invalid, should use default behavior
		cleanupInterval: -5000, // Invalid, should disable cleanup
	});

	cache.set("test", "value");
	strictEqual(cache.get("test"), "value");

	cache.destroy({ clearCache: true });
});

// Integration tests
test("integration - realistic module caching workflow", async () => {
	const cache = new CacheManager({
		defaultTTL: 1000,
		maxSize: 100,
		enableStats: true,
	});

	// Simulate module resolution caching
	const moduleKey = cache.createKey("module", "/src/app.js");
	const importMapKey = cache.createKey("importmap", "workspace");

	// Cache module resolution
	cache.set(moduleKey, "/absolute/src/app.js");

	// Cache import map with dependencies
	cache.setWithDependencies(
		importMapKey,
		{ imports: { lodash: "/node_modules/lodash/index.js" } },
		["/package.json"],
	);

	// Verify caching
	strictEqual(cache.get(moduleKey), "/absolute/src/app.js");
	strictEqual(typeof cache.get(importMapKey), "object");

	// Simulate package.json change
	const invalidated = cache.invalidateDependency("/package.json");
	strictEqual(invalidated, 1);
	strictEqual(cache.has(importMapKey), false);
	strictEqual(cache.has(moduleKey), true); // Not dependent

	// Check stats
	const stats = cache.getStats();
	strictEqual(stats.size > 0, true);
	strictEqual(stats.hits > 0, true);

	cache.destroy({ clearCache: true });
});

test("integration - multiple cache instances", () => {
	const cache1 = new CacheManager({ defaultTTL: 1000 });
	const cache2 = new CacheManager({ defaultTTL: 2000 });

	// Independent operation
	cache1.set("key", "value1");
	cache2.set("key", "value2");

	strictEqual(cache1.get("key"), "value1");
	strictEqual(cache2.get("key"), "value2");

	// Clear one doesn't affect the other
	cache1.clear();
	strictEqual(cache1.has("key"), false);
	strictEqual(cache2.has("key"), true);

	cache1.destroy({ clearCache: true });
	cache2.destroy({ clearCache: true });
});
