/**
 * @file Test suite for JavaScript file test file validation functionality
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidTestFile, shouldHaveTestFile } from "./has-valid-test-file.js";

describe("HasValidTestFile", () => {
	test("should return true when test file exists", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-test-file-test-"));
		const jsFile = join(tempDir, "utils.js");
		const testFile = join(tempDir, "utils.test.js");

		try {
			writeFileSync(jsFile, "export const utils = {};");
			writeFileSync(testFile, "// test file");

			const result = HasValidTestFile(jsFile);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error when test file is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-test-file-test-"));
		const jsFile = join(tempDir, "utils.js");

		try {
			writeFileSync(jsFile, "export const utils = {};");

			assert.throws(
				() => HasValidTestFile(jsFile),
				/Missing test file: expected.*utils\.test\.js/,
				"Should throw for missing test file",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should work with nested directory structure", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nested-test-file-test-"));
		const jsFile = join(tempDir, "lib", "utils.js");
		const testFile = join(tempDir, "lib", "utils.test.js");

		try {
			// Create directory structure
			mkdirSync(join(tempDir, "lib"), { recursive: true });
			writeFileSync(jsFile, "export const utils = {};");
			writeFileSync(testFile, "// test file");

			const result = HasValidTestFile(jsFile);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid file path types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => HasValidTestFile(path),
				/File path must be a non-empty string/,
				`Should throw for invalid file path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty file path", () => {
		assert.throws(
			() => HasValidTestFile(""),
			/File path must be a non-empty string/,
			"Should throw for empty file path",
		);
	});
});

describe("shouldHaveTestFile", () => {
	test("should return true for regular JavaScript files", () => {
		assert.equal(shouldHaveTestFile("lib/utils.js"), true);
		assert.equal(shouldHaveTestFile("src/components/button.js"), true);
		assert.equal(shouldHaveTestFile("index.js"), true);
	});

	test("should return false for test files themselves", () => {
		assert.equal(shouldHaveTestFile("lib/utils.test.js"), false);
		assert.equal(shouldHaveTestFile("src/button.test.js"), false);
		assert.equal(shouldHaveTestFile("index.test.js"), false);
	});

	test("should return false for bin files", () => {
		assert.equal(shouldHaveTestFile("bin/cli.js"), false);
		assert.equal(shouldHaveTestFile("lib/bin/tool.js"), false);
		assert.equal(shouldHaveTestFile("src/bin/helper.js"), false);
	});

	test("should return false for non-JavaScript files", () => {
		assert.equal(shouldHaveTestFile("README.md"), false);
		assert.equal(shouldHaveTestFile("package.json"), false);
		assert.equal(shouldHaveTestFile("config.xml"), false);
		assert.equal(shouldHaveTestFile("style.css"), false);
	});
});
