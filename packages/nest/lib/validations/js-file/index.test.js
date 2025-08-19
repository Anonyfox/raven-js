/**
 * @file Test suite for JavaScript file validation module exports
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
	HasValidJSDocHeaders,
	HasValidTestFile,
	shouldHaveJSDocHeader,
	shouldHaveTestFile,
} from "./index.js";

describe("JS file validation module exports", () => {
	test("should export HasValidJSDocHeaders function", () => {
		assert.equal(typeof HasValidJSDocHeaders, "function");
	});

	test("should export shouldHaveJSDocHeader function", () => {
		assert.equal(typeof shouldHaveJSDocHeader, "function");
	});

	test("should export HasValidTestFile function", () => {
		assert.equal(typeof HasValidTestFile, "function");
	});

	test("should export shouldHaveTestFile function", () => {
		assert.equal(typeof shouldHaveTestFile, "function");
	});

	test("exported functions should work correctly", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "js-file-module-test-"));
		const jsFilePath = join(tempDir, "utils.js");
		const testFilePath = join(tempDir, "utils.test.js");

		try {
			const validJSDocHeader = `/**
 * @file Test utility functions for data processing
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */`;

			writeFileSync(
				jsFilePath,
				`${validJSDocHeader}\n\nexport const utils = {};`,
			);
			writeFileSync(testFilePath, "// Test file");

			// Test shouldHaveJSDocHeader
			assert.equal(shouldHaveJSDocHeader(jsFilePath), true);
			assert.equal(shouldHaveJSDocHeader(testFilePath), false);

			// Test HasValidJSDocHeaders
			assert.equal(HasValidJSDocHeaders(jsFilePath), true);

			// Test shouldHaveTestFile
			assert.equal(shouldHaveTestFile(jsFilePath), true);
			assert.equal(shouldHaveTestFile(testFilePath), false);

			// Test HasValidTestFile
			assert.equal(HasValidTestFile(jsFilePath), true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
