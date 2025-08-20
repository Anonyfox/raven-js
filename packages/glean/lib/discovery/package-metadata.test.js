/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package metadata intelligence tests - 100% branch coverage.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	extractEntryPoints,
	extractExportsRecursively,
	parsePackageJson,
} from "./package-metadata.js";

describe("Package Metadata Intelligence", () => {
	it("parsePackageJson: parses valid package.json", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));
		const packageJson = { name: "test-package", version: "1.0.0" };

		await writeFile(join(tempDir, "package.json"), JSON.stringify(packageJson));

		const result = await parsePackageJson(tempDir);
		deepStrictEqual(result, packageJson);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("parsePackageJson: returns null for missing package.json", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));
		const result = await parsePackageJson(tempDir);
		strictEqual(result, null);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("parsePackageJson: returns null for malformed package.json", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		await writeFile(join(tempDir, "package.json"), "{ invalid json");

		const result = await parsePackageJson(tempDir);
		strictEqual(result, null);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("extractEntryPoints: defaults to index.js when no fields present", () => {
		const result = extractEntryPoints({});
		deepStrictEqual(result, ["index.js"]);
	});

	it("extractEntryPoints: extracts main field", () => {
		const result = extractEntryPoints({ main: "dist/main.js" });
		deepStrictEqual(result, ["dist/main.js"]);
	});

	it("extractEntryPoints: extracts module field", () => {
		const result = extractEntryPoints({ module: "dist/module.js" });
		deepStrictEqual(result, ["dist/module.js"]);
	});

	it("extractEntryPoints: handles exports as string", () => {
		const result = extractEntryPoints({ exports: "./lib/index.js" });
		deepStrictEqual(result, ["./lib/index.js"]);
	});

	it("extractEntryPoints: handles exports as object with conditional exports", () => {
		const packageJson = {
			exports: {
				import: "./lib/index.js",
				require: "./lib/index.cjs",
				default: "./lib/default.js",
			},
		};
		const result = extractEntryPoints(packageJson);
		deepStrictEqual(result, [
			"./lib/index.js",
			"./lib/index.cjs",
			"./lib/default.js",
		]);
	});

	it("extractEntryPoints: handles nested exports recursively", () => {
		const packageJson = {
			exports: {
				".": {
					import: "./lib/index.js",
					require: "./lib/index.cjs",
				},
				"./utils": "./lib/utils.js",
			},
		};
		const result = extractEntryPoints(packageJson);
		deepStrictEqual(result, [
			"./lib/index.js",
			"./lib/index.cjs",
			"./lib/utils.js",
		]);
	});

	it("extractEntryPoints: removes duplicates from multiple sources", () => {
		const packageJson = {
			main: "./lib/index.js",
			module: "./lib/index.js",
			exports: "./lib/index.js",
		};
		const result = extractEntryPoints(packageJson);
		deepStrictEqual(result, ["./lib/index.js"]);
	});

	it("extractExportsRecursively: handles string values", () => {
		const entryPoints = [];
		extractExportsRecursively({ ".": "./lib/index.js" }, entryPoints);
		deepStrictEqual(entryPoints, ["./lib/index.js"]);
	});

	it("extractExportsRecursively: handles conditional exports object", () => {
		const entryPoints = [];
		const exports = {
			import: "./lib/index.js",
			require: "./lib/index.cjs",
			default: "./lib/default.js",
		};
		extractExportsRecursively(exports, entryPoints);
		deepStrictEqual(entryPoints, [
			"./lib/index.js",
			"./lib/index.cjs",
			"./lib/default.js",
		]);
	});

	it("extractExportsRecursively: handles nested recursion", () => {
		const entryPoints = [];
		const exports = {
			utils: {
				production: "./lib/utils.prod.js",
				development: "./lib/utils.dev.js",
			},
			browser: "./lib/browser.js",
		};
		extractExportsRecursively(exports, entryPoints);
		deepStrictEqual(entryPoints, [
			"./lib/utils.prod.js",
			"./lib/utils.dev.js",
			"./lib/browser.js",
		]);
	});

	it("extractExportsRecursively: handles null values gracefully", () => {
		const entryPoints = [];
		const exports = {
			".": null,
			"./utils": "./lib/utils.js",
		};
		extractExportsRecursively(exports, entryPoints);
		deepStrictEqual(entryPoints, ["./lib/utils.js"]);
	});
});
