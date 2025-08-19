/**
 * @file Environment Detection Tests - Comprehensive test suite for environment detection utilities
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
	isGlobalAssetsAvailable,
	isSEAEnvironment,
} from "./environment-detection.js";

test("isSEAEnvironment", async (t) => {
	await t.test("returns false when node:sea is not available", () => {
		// Mock require to throw an error
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		const result = isSEAEnvironment();
		assert.strictEqual(result, false);

		// Restore original require
		global.require = originalRequire;
	});

	await t.test(
		"returns false when sea module exists but isSea is not a function",
		() => {
			const originalRequire = global.require;
			global.require = (moduleName) => {
				if (moduleName === "node:sea") {
					return { isSea: "not a function" };
				}
				return originalRequire(moduleName);
			};

			const result = isSEAEnvironment();
			assert.strictEqual(result, false);

			global.require = originalRequire;
		},
	);

	await t.test("returns false when sea.isSea() returns false", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return { isSea: () => false };
			}
			return originalRequire(moduleName);
		};

		const result = isSEAEnvironment();
		assert.strictEqual(result, false);

		global.require = originalRequire;
	});

	await t.test("returns true when sea.isSea() returns true", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return { isSea: () => true };
			}
			return originalRequire(moduleName);
		};

		const result = isSEAEnvironment();
		assert.strictEqual(result, true);

		global.require = originalRequire;
	});

	await t.test("returns false when sea module is null", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return null;
			}
			return originalRequire(moduleName);
		};

		const result = isSEAEnvironment();
		assert.strictEqual(result, false);

		global.require = originalRequire;
	});

	await t.test("returns false when sea module is undefined", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return undefined;
			}
			return originalRequire(moduleName);
		};

		const result = isSEAEnvironment();
		assert.strictEqual(result, false);

		global.require = originalRequire;
	});
});

test("isGlobalAssetsAvailable", async (t) => {
	const originalGlobalThis = globalThis;

	await t.test("returns false when globalThis is not accessible", () => {
		// Create a scenario where accessing globalThis would throw
		Object.defineProperty(global, "globalThis", {
			get() {
				throw new Error("Access denied");
			},
			configurable: true,
		});

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		Object.defineProperty(global, "globalThis", {
			value: originalGlobalThis,
			configurable: true,
		});
	});

	await t.test("returns false when RavenJS is not defined", () => {
		const original = globalThis.RavenJS;
		delete globalThis.RavenJS;

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
	});

	await t.test("returns false when RavenJS is null", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = null;

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns false when RavenJS.assets is not defined", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {};

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns false when RavenJS.assets is null", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: null };

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns false when RavenJS.assets is an array", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: [] };

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns false when RavenJS.assets is not an object", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: "not an object" };

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns false when RavenJS.assets is a primitive", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: 42 };

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, false);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns true when RavenJS.assets is a valid object", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: { "/test.css": "body{}" } };

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, true);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns true when RavenJS.assets is an empty object", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: {} };

		const result = isGlobalAssetsAvailable();
		assert.strictEqual(result, true);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});
});
