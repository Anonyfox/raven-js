/**
 * @fileoverview Tests for context generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { generateContext, generateContextJson } from "./generate-context.js";

describe("generateContext", () => {
	test("should return null when package.json is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			const result = generateContext(tempDir);
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return null when package.json is invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), "{ invalid json");
			const result = generateContext(tempDir);
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return null when README.md is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
				}),
			);
			const result = generateContext(tempDir);
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate context for package with exports", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
					exports: {
						".": { import: "./index.js" },
						"./utils": { import: "./utils.js" },
					},
				}),
			);
			writeFileSync(
				join(tempDir, "README.md"),
				"# Test Package\n\nThis is a test package.",
			);

			const result = generateContext(tempDir);

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.name, "@raven-js/test");
			assert.strictEqual(result?.version, "1.0.0");
			assert.deepStrictEqual(result?.exports, {
				".": { import: "./index.js" },
				"./utils": { import: "./utils.js" },
			});
			assert.strictEqual(
				result?.readme,
				"# Test Package\n\nThis is a test package.",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate context for package with main field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
					main: "./lib/index.js",
				}),
			);
			writeFileSync(join(tempDir, "README.md"), "# Test Package");

			const result = generateContext(tempDir);

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.name, "@raven-js/test");
			assert.strictEqual(result?.version, "1.0.0");
			assert.strictEqual(result?.exports, "./lib/index.js");
			assert.strictEqual(result?.readme, "# Test Package");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle package without exports or main", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
				}),
			);
			writeFileSync(join(tempDir, "README.md"), "# Test Package");

			const result = generateContext(tempDir);

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.name, "@raven-js/test");
			assert.strictEqual(result?.version, "1.0.0");
			assert.strictEqual(result?.exports, undefined);
			assert.strictEqual(result?.readme, "# Test Package");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("generateContextJson", () => {
	test("should return null when context generation fails", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			const result = generateContextJson(tempDir);
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return JSON string when context generation succeeds", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
					main: "./index.js",
				}),
			);
			writeFileSync(join(tempDir, "README.md"), "# Test Package");

			const result = generateContextJson(tempDir);

			assert.notStrictEqual(result, null);
			assert.strictEqual(typeof result, "string");

			const parsed = JSON.parse(/** @type {string} */ (result));
			assert.strictEqual(parsed.name, "@raven-js/test");
			assert.strictEqual(parsed.version, "1.0.0");
			assert.strictEqual(parsed.exports, "./index.js");
			assert.strictEqual(parsed.readme, "# Test Package");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return properly formatted JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "context-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
				}),
			);
			writeFileSync(join(tempDir, "README.md"), "# Test Package");

			const result = generateContextJson(tempDir);

			assert.notStrictEqual(result, null);
			// Should be properly formatted with indentation
			assert(/** @type {string} */ (result).includes('\n  "name"'));
			assert(/** @type {string} */ (result).includes('\n  "version"'));
			assert(/** @type {string} */ (result).includes('\n  "readme"'));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
