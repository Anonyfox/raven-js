/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Assets class.
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Assets } from "./assets.js";

describe("Assets", () => {
	describe("constructor", () => {
		it("creates assets with file array", () => {
			const files = ["./file1.js", "./file2.css"];
			const assets = new Assets(files);

			assert.deepStrictEqual(assets.getFiles(), files);
			assert.strictEqual(assets.hasAssets(), true);
		});

		it("creates assets with empty array", () => {
			const assets = new Assets([]);

			assert.deepStrictEqual(assets.getFiles(), []);
			assert.strictEqual(assets.hasAssets(), false);
		});

		it("handles null files parameter", () => {
			const assets = new Assets(null);

			assert.deepStrictEqual(assets.getFiles(), []);
			assert.strictEqual(assets.hasAssets(), false);
		});
	});

	describe("resolve", () => {
		// Create test directory structure
		const testDir = mkdtempSync(join(tmpdir(), "fledge-assets-test-"));
		const subDir = join(testDir, "subdir");
		const testFile1 = join(testDir, "test1.txt");
		const testFile2 = join(testDir, "test2.js");
		const subFile = join(subDir, "nested.css");

		// Setup test files
		mkdirSync(subDir);
		writeFileSync(testFile1, "test content 1");
		writeFileSync(testFile2, "test content 2");
		writeFileSync(subFile, "nested content");

		it("resolves null input to empty assets", async () => {
			const assets = await Assets.resolve(null);

			assert.deepStrictEqual(assets.getFiles(), []);
			assert.strictEqual(assets.hasAssets(), false);
		});

		it("resolves undefined input to empty assets", async () => {
			const assets = await Assets.resolve(undefined);

			assert.deepStrictEqual(assets.getFiles(), []);
			assert.strictEqual(assets.hasAssets(), false);
		});

		it("resolves string file path", async () => {
			const assets = await Assets.resolve(testFile1);

			assert.deepStrictEqual(assets.getFiles(), [testFile1]);
			assert.strictEqual(assets.hasAssets(), true);
		});

		it("resolves string directory path", async () => {
			const assets = await Assets.resolve(testDir);
			const files = assets.getFiles();

			assert.ok(files.includes(testFile1));
			assert.ok(files.includes(testFile2));
			assert.ok(files.includes(subFile));
			assert.strictEqual(assets.hasAssets(), true);
		});

		it("resolves array of paths", async () => {
			const assets = await Assets.resolve([testFile1, testFile2]);
			const files = assets.getFiles();

			assert.ok(files.includes(testFile1));
			assert.ok(files.includes(testFile2));
			assert.strictEqual(files.length, 2);
		});

		it("resolves mixed array with files and directories", async () => {
			const assets = await Assets.resolve([testFile1, subDir]);
			const files = assets.getFiles();

			assert.ok(files.includes(testFile1));
			assert.ok(files.includes(subFile));
		});

		it("removes duplicates from array input", async () => {
			const assets = await Assets.resolve([testFile1, testFile1, testFile2]);
			const files = assets.getFiles();

			assert.strictEqual(files.filter((f) => f === testFile1).length, 1);
			assert.ok(files.includes(testFile2));
		});

		it("resolves function returning string", async () => {
			const assetFunction = async () => testFile1;
			const assets = await Assets.resolve(assetFunction);

			assert.deepStrictEqual(assets.getFiles(), [testFile1]);
		});

		it("resolves function returning array", async () => {
			const assetFunction = async () => [testFile1, testFile2];
			const assets = await Assets.resolve(assetFunction);
			const files = assets.getFiles();

			assert.ok(files.includes(testFile1));
			assert.ok(files.includes(testFile2));
		});

		it("throws error for invalid input type", async () => {
			await assert.rejects(async () => await Assets.resolve(123), {
				name: "Error",
				message:
					"Assets configuration must be a string, array, function, or null",
			});
		});

		it("throws error for nonexistent path", async () => {
			await assert.rejects(
				async () => await Assets.resolve("./nonexistent/path"),
				{
					name: "Error",
					message: /Asset path not found:/,
				},
			);
		});

		it("sorts resolved files", async () => {
			// Create files that would sort differently by name vs path
			const file1 = join(testDir, "z-file.txt");
			const file2 = join(testDir, "a-file.txt");
			writeFileSync(file1, "content");
			writeFileSync(file2, "content");

			const assets = await Assets.resolve([file1, file2]);
			const files = assets.getFiles();

			// Should be sorted alphabetically
			assert.ok(files.indexOf(file2) < files.indexOf(file1));
		});
	});

	describe("validate", () => {
		const testDir = mkdtempSync(join(tmpdir(), "fledge-assets-validate-test-"));
		const existingFile = join(testDir, "exists.txt");
		writeFileSync(existingFile, "content");

		it("passes validation for existing files", () => {
			const assets = new Assets([existingFile]);

			assert.doesNotThrow(() => assets.validate());
		});

		it("throws error for missing files", () => {
			const missingFile = join(testDir, "missing.txt");
			const assets = new Assets([missingFile]);

			assert.throws(() => assets.validate(), {
				name: "Error",
				message: `Asset file not found: ${missingFile}`,
			});
		});

		it("passes validation for empty assets", () => {
			const assets = new Assets([]);

			assert.doesNotThrow(() => assets.validate());
		});
	});

	describe("getters", () => {
		const files = ["./file1.js", "./file2.css", "./file3.html"];
		const assets = new Assets(files);

		it("getFiles returns file array", () => {
			assert.deepStrictEqual(assets.getFiles(), files);
		});

		it("hasAssets returns true for non-empty assets", () => {
			assert.strictEqual(assets.hasAssets(), true);
		});

		it("hasAssets returns false for empty assets", () => {
			const emptyAssets = new Assets([]);
			assert.strictEqual(emptyAssets.hasAssets(), false);
		});
	});
});
