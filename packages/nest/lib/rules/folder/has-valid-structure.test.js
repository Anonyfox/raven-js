import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidStructure } from "./has-valid-structure.js";

describe("HasValidStructure", () => {
	test("should return true for valid package structure", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-structure-test-"));

		// Create required files
		writeFileSync(join(tempDir, "README.md"), "# Project");
		writeFileSync(join(tempDir, "LICENSE"), "MIT License");
		writeFileSync(
			join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-package",
				main: "index.js",
			}),
		);
		writeFileSync(join(tempDir, "index.js"), "module.exports = {};");

		try {
			const result = HasValidStructure(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true for valid structure without main entry", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), "valid-structure-no-main-test-"),
		);

		// Create required files without main entry
		writeFileSync(join(tempDir, "README.md"), "# Project");
		writeFileSync(join(tempDir, "LICENSE"), "MIT License");
		writeFileSync(
			join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-package",
			}),
		);

		try {
			const result = HasValidStructure(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing README.md", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-readme-test-"));

		writeFileSync(join(tempDir, "LICENSE"), "MIT License");

		try {
			assert.throws(
				() => HasValidStructure(tempDir),
				/Missing required files.*README\.md/,
				"Should throw for missing README.md",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing LICENSE", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-license-test-"));

		writeFileSync(join(tempDir, "README.md"), "# Project");

		try {
			assert.throws(
				() => HasValidStructure(tempDir),
				/Missing required files.*LICENSE/,
				"Should throw for missing LICENSE",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing main entry point", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-main-test-"));

		writeFileSync(join(tempDir, "README.md"), "# Project");
		writeFileSync(join(tempDir, "LICENSE"), "MIT License");
		writeFileSync(
			join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-package",
				main: "non-existent.js",
			}),
		);

		try {
			assert.throws(
				() => HasValidStructure(tempDir),
				/Missing required files.*non-existent\.js/,
				"Should throw for missing main entry point",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for multiple missing files", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "multiple-missing-test-"));

		// Create empty directory - missing both README.md and LICENSE

		try {
			assert.throws(
				() => HasValidStructure(tempDir),
				/Missing required files.*README\.md.*LICENSE/,
				"Should throw for multiple missing files",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle invalid package.json gracefully", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-package-json-test-"));

		writeFileSync(join(tempDir, "README.md"), "# Project");
		writeFileSync(join(tempDir, "LICENSE"), "MIT License");
		writeFileSync(join(tempDir, "package.json"), "{ invalid json }");

		try {
			// Should only check README.md and LICENSE since package.json is invalid
			const result = HasValidStructure(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid directory path types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => HasValidStructure(path),
				/Directory path must be a non-empty string/,
				`Should throw for invalid directory path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty directory path", () => {
		assert.throws(
			() => HasValidStructure(""),
			/Directory path must be a non-empty string/,
			"Should throw for empty directory path",
		);
	});
});
