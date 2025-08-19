import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidTestFiles } from "./has-valid-test-files.js";

describe("HasValidTestFiles", () => {
	test("should return true when all JS files have test files", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-test-files-test-"));

		// Create JS files with corresponding test files
		writeFileSync(join(tempDir, "utils.js"), "module.exports = {};");
		writeFileSync(join(tempDir, "utils.test.js"), "// test file");
		writeFileSync(join(tempDir, "helper.js"), "module.exports = {};");
		writeFileSync(join(tempDir, "helper.test.js"), "// test file");

		try {
			const result = HasValidTestFiles(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true when all JS files in subdirectories have test files", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), "valid-nested-test-files-test-"),
		);

		try {
			// Create nested JS files with corresponding test files
			mkdirSync(join(tempDir, "lib"));
			writeFileSync(join(tempDir, "lib", "core.js"), "module.exports = {};");
			writeFileSync(join(tempDir, "lib", "core.test.js"), "// test file");

			const result = HasValidTestFiles(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true when directory has no JS files", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "no-js-files-test-"));

		// Create only non-JS files
		writeFileSync(join(tempDir, "README.md"), "# Project");
		writeFileSync(join(tempDir, "config.json"), "{}");

		try {
			const result = HasValidTestFiles(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should skip bin files and not require tests for them", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "skip-bin-files-test-"));

		try {
			// Create bin files (should be skipped)
			mkdirSync(join(tempDir, "bin"));
			writeFileSync(join(tempDir, "bin", "cli.js"), "#!/usr/bin/env node");

			mkdirSync(join(tempDir, "lib"));
			mkdirSync(join(tempDir, "lib", "bin"));
			writeFileSync(
				join(tempDir, "lib", "bin", "tool.js"),
				"module.exports = {};",
			);

			const result = HasValidTestFiles(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should skip test files themselves", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "skip-test-files-test-"));

		// Create only test files
		writeFileSync(join(tempDir, "something.test.js"), "// test file");
		writeFileSync(join(tempDir, "other.test.js"), "// test file");

		try {
			const result = HasValidTestFiles(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing test files", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-test-files-test-"));

		try {
			// Create JS files without corresponding test files
			writeFileSync(join(tempDir, "utils.js"), "module.exports = {};");
			writeFileSync(join(tempDir, "helper.js"), "module.exports = {};");

			assert.throws(
				() => HasValidTestFiles(tempDir),
				/Missing test files for JavaScript files.*helper\.js.*utils\.js|Missing test files for JavaScript files.*utils\.js.*helper\.js/,
				"Should throw for missing test files",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for partially missing test files", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), "partial-missing-test-files-test-"),
		);

		// Create some JS files with tests, some without
		writeFileSync(join(tempDir, "utils.js"), "module.exports = {};");
		writeFileSync(join(tempDir, "utils.test.js"), "// test file");
		writeFileSync(join(tempDir, "helper.js"), "module.exports = {};");
		// No helper.test.js

		try {
			assert.throws(
				() => HasValidTestFiles(tempDir),
				/Missing test files for JavaScript files.*helper\.js/,
				"Should throw for partially missing test files",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid directory path types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => HasValidTestFiles(path),
				/Directory path must be a non-empty string/,
				`Should throw for invalid directory path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty directory path", () => {
		assert.throws(
			() => HasValidTestFiles(""),
			/Directory path must be a non-empty string/,
			"Should throw for empty directory path",
		);
	});
});
