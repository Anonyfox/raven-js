/**
 * @file Asset List Loader Tests - Comprehensive test suite for asset list loading utilities
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
	loadFileSystemAssetsList,
	loadGlobalAssetsList,
	loadSEAAssetsList,
	SEA_ASSETS_MANIFEST,
} from "./asset-list-loader.js";

test("SEA_ASSETS_MANIFEST constant", () => {
	assert.strictEqual(SEA_ASSETS_MANIFEST, "@raven-js/assets.json");
});

test("loadSEAAssetsList", async (t) => {
	await t.test("returns empty array when node:sea is not available", () => {
		// Mock require to throw an error
		const originalRequire = global.require;
		global.require = () => {
			throw new Error("Module not found");
		};

		const result = loadSEAAssetsList();
		assert.deepStrictEqual(result, []);

		// Restore original require
		global.require = originalRequire;
	});

	await t.test("returns empty array when sea.getAsset throws", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: () => {
						throw new Error("Asset not found");
					},
				};
			}
			return originalRequire(moduleName);
		};

		const result = loadSEAAssetsList();
		assert.deepStrictEqual(result, []);

		global.require = originalRequire;
	});

	await t.test(
		"returns empty array when manifest content is invalid JSON",
		() => {
			const originalRequire = global.require;
			global.require = (moduleName) => {
				if (moduleName === "node:sea") {
					return {
						getAsset: () => "invalid json {",
					};
				}
				return originalRequire(moduleName);
			};

			const result = loadSEAAssetsList();
			assert.deepStrictEqual(result, []);

			global.require = originalRequire;
		},
	);

	await t.test("returns empty array when manifest is not an array", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: () => JSON.stringify({ assets: "not array" }),
				};
			}
			return originalRequire(moduleName);
		};

		const result = loadSEAAssetsList();
		assert.deepStrictEqual(result, []);

		global.require = originalRequire;
	});

	await t.test("returns filtered public assets from valid manifest", () => {
		const manifestContent = [
			"/css/style.css",
			"/js/app.js",
			"private.txt", // Should be filtered out
			"/images/logo.png",
			"internal/config.json", // Should be filtered out
			"/api/data.json",
		];

		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: () => JSON.stringify(manifestContent),
				};
			}
			return originalRequire(moduleName);
		};

		const result = loadSEAAssetsList();
		const expected = [
			"/css/style.css",
			"/js/app.js",
			"/images/logo.png",
			"/api/data.json",
		];
		assert.deepStrictEqual(result, expected);

		global.require = originalRequire;
	});

	await t.test("handles non-string paths in manifest", () => {
		const manifestContent = [
			"/css/style.css",
			42, // Should be filtered out
			null, // Should be filtered out
			"/js/app.js",
			undefined, // Should be filtered out
			{}, // Should be filtered out
			"/images/logo.png",
		];

		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: () => JSON.stringify(manifestContent),
				};
			}
			return originalRequire(moduleName);
		};

		const result = loadSEAAssetsList();
		const expected = ["/css/style.css", "/js/app.js", "/images/logo.png"];
		assert.deepStrictEqual(result, expected);

		global.require = originalRequire;
	});

	await t.test("returns empty array for empty manifest", () => {
		const originalRequire = global.require;
		global.require = (moduleName) => {
			if (moduleName === "node:sea") {
				return {
					getAsset: () => JSON.stringify([]),
				};
			}
			return originalRequire(moduleName);
		};

		const result = loadSEAAssetsList();
		assert.deepStrictEqual(result, []);

		global.require = originalRequire;
	});
});

test("loadGlobalAssetsList", async (t) => {
	const originalGlobalThis = globalThis;

	await t.test("returns empty array when globalThis access throws", () => {
		// Create a scenario where accessing globalThis properties throws
		Object.defineProperty(global, "globalThis", {
			get() {
				throw new Error("Access denied");
			},
			configurable: true,
		});

		const result = loadGlobalAssetsList();
		assert.deepStrictEqual(result, []);

		// Restore
		Object.defineProperty(global, "globalThis", {
			value: originalGlobalThis,
			configurable: true,
		});
	});

	await t.test("returns empty array when RavenJS is not defined", () => {
		const original = globalThis.RavenJS;
		delete globalThis.RavenJS;

		const result = loadGlobalAssetsList();
		assert.deepStrictEqual(result, []);

		// Restore
		if (original) globalThis.RavenJS = original;
	});

	await t.test("returns empty array when RavenJS.assets is not defined", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {};

		const result = loadGlobalAssetsList();
		assert.deepStrictEqual(result, []);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns filtered public assets from global object", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = {
			assets: {
				"/css/style.css": "body { color: red; }",
				"/js/app.js": "console.log('app');",
				"private.txt": "secret content", // Should be filtered out
				"/images/logo.png": Buffer.from([]),
				"internal/config": "config data", // Should be filtered out
				"/api/data.json": '{"key": "value"}',
			},
		};

		const result = loadGlobalAssetsList();
		result.sort(); // Sort for consistent testing

		const expected = [
			"/api/data.json",
			"/css/style.css",
			"/images/logo.png",
			"/js/app.js",
		];
		assert.deepStrictEqual(result, expected);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("handles non-string keys in assets object", () => {
		const original = globalThis.RavenJS;

		// Create an object with non-string keys (though this is unusual in practice)
		const assets = {};
		assets["/css/style.css"] = "content";
		assets[42] = "numeric key content"; // Should be filtered out when converted to string
		assets["/js/app.js"] = "content";

		globalThis.RavenJS = { assets };

		const result = loadGlobalAssetsList();
		result.sort();

		// Object.keys converts all keys to strings, so we need to check what actually happens
		const keys = Object.keys(assets);
		const validKeys = keys.filter((key) => key.startsWith("/"));

		assert.deepStrictEqual(result, validKeys.sort());

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});

	await t.test("returns empty array for empty assets object", () => {
		const original = globalThis.RavenJS;
		globalThis.RavenJS = { assets: {} };

		const result = loadGlobalAssetsList();
		assert.deepStrictEqual(result, []);

		// Restore
		if (original) globalThis.RavenJS = original;
		else delete globalThis.RavenJS;
	});
});

test("loadFileSystemAssetsList", async (t) => {
	const testDir = path.join(process.cwd(), "test-assets-loader");

	async function createTestStructure() {
		await fs.mkdir(testDir, { recursive: true });
		await fs.writeFile(path.join(testDir, "index.html"), "<!DOCTYPE html>");
		await fs.mkdir(path.join(testDir, "css"), { recursive: true });
		await fs.writeFile(path.join(testDir, "css", "style.css"), "body {}");
	}

	async function cleanupTestStructure() {
		try {
			await fs.rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	}

	await t.test("returns empty array for non-existent directory", async () => {
		const result = await loadFileSystemAssetsList("/non/existent/directory");
		assert.deepStrictEqual(result, []);
	});

	await t.test("returns empty array when directory read fails", async () => {
		// Test with a path that would typically cause permission errors
		const result = await loadFileSystemAssetsList("/root/private");
		assert.deepStrictEqual(result, []);
	});

	await t.test("returns asset list from valid directory", async () => {
		await createTestStructure();

		const result = await loadFileSystemAssetsList(testDir);
		result.sort(); // Sort for consistent testing

		const expected = ["/css/style.css", "/index.html"];
		assert.deepStrictEqual(result, expected);

		await cleanupTestStructure();
	});

	await t.test("returns empty array for empty directory", async () => {
		const emptyDir = path.join(process.cwd(), "test-empty-loader");
		await fs.mkdir(emptyDir, { recursive: true });

		const result = await loadFileSystemAssetsList(emptyDir);
		assert.deepStrictEqual(result, []);

		await fs.rm(emptyDir, { recursive: true, force: true });
	});

	await t.test("handles complex directory structure", async () => {
		const complexDir = path.join(process.cwd(), "test-complex-loader");

		// Create complex structure
		await fs.mkdir(path.join(complexDir, "css"), { recursive: true });
		await fs.mkdir(path.join(complexDir, "js", "modules"), { recursive: true });
		await fs.mkdir(path.join(complexDir, "images", "icons"), {
			recursive: true,
		});

		await fs.writeFile(path.join(complexDir, "index.html"), "html");
		await fs.writeFile(path.join(complexDir, "css", "style.css"), "css");
		await fs.writeFile(path.join(complexDir, "css", "theme.css"), "css");
		await fs.writeFile(path.join(complexDir, "js", "app.js"), "js");
		await fs.writeFile(
			path.join(complexDir, "js", "modules", "utils.js"),
			"js",
		);
		await fs.writeFile(path.join(complexDir, "images", "logo.png"), "png");
		await fs.writeFile(
			path.join(complexDir, "images", "icons", "arrow.svg"),
			"svg",
		);

		const result = await loadFileSystemAssetsList(complexDir);
		result.sort();

		const expected = [
			"/css/style.css",
			"/css/theme.css",
			"/images/icons/arrow.svg",
			"/images/logo.png",
			"/index.html",
			"/js/app.js",
			"/js/modules/utils.js",
		];

		assert.deepStrictEqual(result, expected);

		await fs.rm(complexDir, { recursive: true, force: true });
	});
});
