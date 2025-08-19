/**
 * @file Test suite for JavaScript file JSDoc header validation functionality
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
	shouldHaveJSDocHeader,
} from "./has-valid-jsdoc-headers.js";

describe("HasValidJSDocHeaders", () => {
	const validJSDocHeader = `/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file
 *
 * Test utility functions for data processing
 */`;

	test("should return true for file with valid JSDoc header", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-jsdoc-file-test-"));
		const filePath = join(tempDir, "utils.js");

		try {
			writeFileSync(
				filePath,
				`${validJSDocHeader}\n\nexport const utils = {};`,
			);

			const result = HasValidJSDocHeaders(filePath);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true for file with additional authors and links", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "multiple-authors-file-test-"));
		const filePath = join(tempDir, "utils.js");

		try {
			const headerWithMultipleAuthors = `/**
 * @author Anonyfox <max@anonyfox.com>
 * @author Jane Doe <jane@example.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 * @see {@link https://example.com/additional-docs}
 */

/**
 * @file
 *
 * Test utility with multiple contributors
 */`;

			writeFileSync(
				filePath,
				`${headerWithMultipleAuthors}\n\nexport const utils = {};`,
			);

			const result = HasValidJSDocHeaders(filePath);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for file missing JSDoc header", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-jsdoc-file-test-"));
		const filePath = join(tempDir, "utils.js");

		try {
			writeFileSync(filePath, "export const utils = {};");

			assert.throws(
				() => HasValidJSDocHeaders(filePath),
				/Files must have exactly two JSDoc blocks: metadata block first, then documentation block/,
				"Should throw for missing JSDoc header",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for file missing @file tag", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-file-tag-file-test-"));
		const filePath = join(tempDir, "utils.js");

		try {
			const headerWithoutFile = `/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */`;

			writeFileSync(
				filePath,
				`${headerWithoutFile}\n\nexport const utils = {};`,
			);

			assert.throws(
				() => HasValidJSDocHeaders(filePath),
				/Files must have exactly two JSDoc blocks: metadata block first, then documentation block/,
				"Should throw for missing @file tag",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for file missing required author", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-author-file-test-"));
		const filePath = join(tempDir, "utils.js");

		try {
			const headerWithWrongAuthor = `/**
 * @author Jane Doe <jane@example.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file
 *
 * Test utility functions
 */`;

			writeFileSync(
				filePath,
				`${headerWithWrongAuthor}\n\nexport const utils = {};`,
			);

			assert.throws(
				() => HasValidJSDocHeaders(filePath),
				/First JSDoc block missing required @author Anonyfox <max@anonyfox\.com>/,
				"Should throw for missing required author",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid file path types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => HasValidJSDocHeaders(path),
				/File path must be a non-empty string/,
				`Should throw for invalid file path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty file path", () => {
		assert.throws(
			() => HasValidJSDocHeaders(""),
			/File path must be a non-empty string/,
			"Should throw for empty file path",
		);
	});
});

describe("shouldHaveJSDocHeader", () => {
	test("should return true for regular JavaScript files", () => {
		assert.equal(shouldHaveJSDocHeader("lib/utils.js"), true);
		assert.equal(shouldHaveJSDocHeader("src/components/button.js"), true);
		assert.equal(shouldHaveJSDocHeader("index.js"), true);
	});

	test("should return false for test files", () => {
		assert.equal(shouldHaveJSDocHeader("lib/utils.test.js"), false);
		assert.equal(shouldHaveJSDocHeader("src/button.test.js"), false);
		assert.equal(shouldHaveJSDocHeader("index.test.js"), false);
	});

	test("should return false for bin files", () => {
		assert.equal(shouldHaveJSDocHeader("bin/cli.js"), false);
		assert.equal(shouldHaveJSDocHeader("lib/bin/tool.js"), false);
		assert.equal(shouldHaveJSDocHeader("src/bin/helper.js"), false);
	});

	test("should return false for non-JavaScript files", () => {
		assert.equal(shouldHaveJSDocHeader("README.md"), false);
		assert.equal(shouldHaveJSDocHeader("package.json"), false);
		assert.equal(shouldHaveJSDocHeader("config.xml"), false);
		assert.equal(shouldHaveJSDocHeader("style.css"), false);
	});
});
