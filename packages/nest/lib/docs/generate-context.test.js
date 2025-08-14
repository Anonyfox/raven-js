/**
 * @fileoverview Tests for context generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { generateContext, generateContextJson } from "./generate-context.js";

describe("generateContext", () => {
	test("should return null when package.json is missing", () => {
		const folder = new Folder();
		const result = generateContext(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const result = generateContext(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when README.md is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
			}),
		);

		const result = generateContext(folder);

		assert.strictEqual(result, null);
	});

	test("should generate context for package with exports", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				exports: {
					".": { import: "./index.js" },
					"./utils": { import: "./utils.js" },
				},
			}),
		);
		folder.addFile("README.md", "# Test Package\n\nThis is a test package.");

		const result = generateContext(folder);

		assert.notStrictEqual(result, null);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).name,
			"@raven-js/test",
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).version,
			"1.0.0",
		);
		assert.deepStrictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).exports,
			{
				".": { import: "./index.js" },
				"./utils": { import: "./utils.js" },
			},
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).readme,
			"# Test Package\n\nThis is a test package.",
		);
	});

	test("should generate context for package with main field", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				main: "./lib/index.js",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const result = generateContext(folder);

		assert.notStrictEqual(result, null);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).name,
			"@raven-js/test",
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).version,
			"1.0.0",
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).exports,
			"./lib/index.js",
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).readme,
			"# Test Package",
		);
	});

	test("should handle package without exports or main", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const result = generateContext(folder);

		assert.notStrictEqual(result, null);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).name,
			"@raven-js/test",
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).version,
			"1.0.0",
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).exports,
			undefined,
		);
		assert.strictEqual(
			/** @type {import('../types.js').ContextObject} */ (result).readme,
			"# Test Package",
		);
	});
});

describe("generateContextJson", () => {
	test("should return null when context generation fails", () => {
		const folder = new Folder();
		const result = generateContextJson(folder);

		assert.strictEqual(result, null);
	});

	test("should return JSON string when context generation succeeds", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				main: "./index.js",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const result = generateContextJson(folder);

		assert.notStrictEqual(result, null);
		assert.strictEqual(typeof result, "string");

		const parsed = JSON.parse(/** @type {string} */ (result));
		assert.strictEqual(parsed.name, "@raven-js/test");
		assert.strictEqual(parsed.version, "1.0.0");
		assert.strictEqual(parsed.exports, "./index.js");
		assert.strictEqual(parsed.readme, "# Test Package");
	});

	test("should return properly formatted JSON", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const result = generateContextJson(folder);

		assert.notStrictEqual(result, null);
		// Should be properly formatted with indentation
		assert(/** @type {string} */ (result).includes('\n  "name"'));
		assert(/** @type {string} */ (result).includes('\n  "version"'));
		assert(/** @type {string} */ (result).includes('\n  "readme"'));
	});
});
