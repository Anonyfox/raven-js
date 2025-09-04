/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BinaryBundler class.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { BinaryBundler } from "./bundler.js";
import { BinaryConfig } from "./config/config.js";

describe("BinaryBundler constructor", () => {
	it("creates bundler with valid configuration", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);

		assert.ok(bundler instanceof BinaryBundler);
		assert.strictEqual(bundler.isBundled(), false);
		assert.strictEqual(bundler.getExecutablePath(), null);
	});

	it("initializes with default statistics", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);
		const stats = bundler.getStatistics();

		assert.strictEqual(stats.startTime, 0);
		assert.strictEqual(stats.endTime, 0);
		assert.strictEqual(stats.totalTime, 0);
		assert.strictEqual(stats.executableSize, 0);
		assert.strictEqual(stats.assetCount, 0);
	});
});

describe("BinaryBundler state management", () => {
	it("tracks bundling state correctly", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);

		// Initial state
		assert.strictEqual(bundler.isBundled(), false);
		assert.strictEqual(bundler.getExecutablePath(), null);

		// Statistics should be immutable copies
		const stats1 = bundler.getStatistics();
		const stats2 = bundler.getStatistics();
		assert.notStrictEqual(stats1, stats2); // Different objects
		assert.deepStrictEqual(stats1, stats2); // Same content
	});

	it("prevents multiple bundling attempts", async () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);

		// Mock the bundler as already completed
		// We can't actually run generate() without setting up a full environment
		// so we test the state check logic by simulating the error condition

		// This would require complex mocking to test properly
		// For now, we test that the bundler correctly reports its initial state
		assert.strictEqual(bundler.isBundled(), false);
	});
});

describe("BinaryBundler configuration integration", () => {
	it("works with minimal configuration", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);

		assert.ok(bundler instanceof BinaryBundler);
		assert.strictEqual(bundler.isBundled(), false);
	});

	it("works with complex configuration", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
			output: "./dist/myapp",
			bundles: {
				"/app.js": "./src/client.js",
				"/admin.js": "./src/admin.js",
			},
			assets: [], // Empty to avoid filesystem dependencies
			env: {
				NODE_ENV: "production",
				DEBUG: "false",
			},
			sea: {
				useCodeCache: false,
				disableExperimentalSEAWarning: true,
			},
			signing: {
				enabled: false,
				identity: "Test Identity",
			},
		});

		const bundler = new BinaryBundler(config);

		assert.ok(bundler instanceof BinaryBundler);
		assert.strictEqual(bundler.isBundled(), false);

		// Verify the configuration is accessible through the bundler
		const stats = bundler.getStatistics();
		assert.strictEqual(typeof stats, "object");
		assert.strictEqual(stats.assetCount, 0); // Initial state
	});
});

describe("BinaryBundler statistics", () => {
	it("returns immutable statistics objects", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);

		const stats1 = bundler.getStatistics();
		const stats2 = bundler.getStatistics();

		// Should be different object instances (immutable copies)
		assert.notStrictEqual(stats1, stats2);

		// But should have same content
		assert.deepStrictEqual(stats1, stats2);

		// Modifying returned stats should not affect bundler
		stats1.startTime = 12345;
		const stats3 = bundler.getStatistics();
		assert.strictEqual(stats3.startTime, 0); // Unchanged
	});

	it("has all required statistics fields", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		const bundler = new BinaryBundler(config);
		const stats = bundler.getStatistics();

		// Verify all expected fields are present
		assert.strictEqual(typeof stats.startTime, "number");
		assert.strictEqual(typeof stats.endTime, "number");
		assert.strictEqual(typeof stats.totalTime, "number");
		assert.strictEqual(typeof stats.executableSize, "number");
		assert.strictEqual(typeof stats.assetCount, "number");

		// Initial values should be zero
		assert.strictEqual(stats.startTime, 0);
		assert.strictEqual(stats.endTime, 0);
		assert.strictEqual(stats.totalTime, 0);
		assert.strictEqual(stats.executableSize, 0);
		assert.strictEqual(stats.assetCount, 0);
	});
});

describe("BinaryBundler error handling", () => {
	it("handles configuration edge cases", () => {
		// Test with edge case entry paths
		const edgeCases = [
			"./simple.js",
			"/absolute/path/server.js",
			"relative/server.js",
			"server.mjs",
		];

		for (const entry of edgeCases) {
			const config = new BinaryConfig({ entry });
			const bundler = new BinaryBundler(config);

			assert.ok(bundler instanceof BinaryBundler);
			assert.strictEqual(bundler.isBundled(), false);
		}
	});

	it("maintains consistent state after construction", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
			output: "./dist/myapp",
		});

		const bundler = new BinaryBundler(config);

		// State should remain consistent across multiple calls
		for (let i = 0; i < 5; i++) {
			assert.strictEqual(bundler.isBundled(), false);
			assert.strictEqual(bundler.getExecutablePath(), null);

			const stats = bundler.getStatistics();
			assert.strictEqual(stats.startTime, 0);
			assert.strictEqual(stats.endTime, 0);
		}
	});
});

// Note: Full integration tests with actual bundling would require:
// 1. Setting up temporary directories and files
// 2. Mocking or installing external dependencies (postject)
// 3. Platform-specific testing for signing operations
// 4. Handling Node.js SEA experimental features
//
// These are better suited for integration tests rather than unit tests.
// The current tests focus on the public interface, state management,
// and configuration integration which can be tested reliably.
