import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { GetAllFilePaths } from "./get-all-file-paths.js";

describe("GetAllFilePaths", () => {
	test("should return all file paths in flat directory", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "get-paths-flat-test-"));
		writeFileSync(join(tempDir, "file1.txt"), "content1");
		writeFileSync(join(tempDir, "file2.js"), "content2");
		writeFileSync(join(tempDir, "file3.md"), "content3");

		try {
			const result = GetAllFilePaths(tempDir);
			assert.deepStrictEqual(result.sort(), [
				"file1.txt",
				"file2.js",
				"file3.md",
			]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return all file paths recursively", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "get-paths-recursive-test-"));

		try {
			// Create files and subdirectories
			writeFileSync(join(tempDir, "root-file.txt"), "content");

			mkdirSync(join(tempDir, "subdir"));
			writeFileSync(join(tempDir, "subdir", "nested-file.js"), "content");

			mkdirSync(join(tempDir, "subdir", "deep"));
			writeFileSync(join(tempDir, "subdir", "deep", "deep-file.md"), "content");

			const result = GetAllFilePaths(tempDir);
			const expected = [
				"root-file.txt",
				"subdir/nested-file.js",
				"subdir/deep/deep-file.md",
			];
			assert.deepStrictEqual(result.sort(), expected.sort());
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return empty array for empty directory", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "get-paths-empty-test-"));

		try {
			const result = GetAllFilePaths(tempDir);
			assert.deepStrictEqual(result, []);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should respect .gitignore patterns", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "get-paths-gitignore-test-"));

		try {
			// Create .gitignore file
			writeFileSync(
				join(tempDir, ".gitignore"),
				".*\nnode_modules/\n*.log\nbuild/",
			);

			// Create files that should and shouldn't be ignored
			writeFileSync(join(tempDir, "visible-file.txt"), "content");
			writeFileSync(join(tempDir, ".hidden-file"), "content"); // Should be ignored
			writeFileSync(join(tempDir, "debug.log"), "content"); // Should be ignored

			mkdirSync(join(tempDir, "node_modules"));
			writeFileSync(join(tempDir, "node_modules", "package.js"), "content"); // Should be ignored

			mkdirSync(join(tempDir, "build"));
			writeFileSync(join(tempDir, "build", "output.js"), "content"); // Should be ignored

			mkdirSync(join(tempDir, "src"));
			writeFileSync(join(tempDir, "src", "main.js"), "content"); // Should be included

			const result = GetAllFilePaths(tempDir);
			assert.deepStrictEqual(result.sort(), [
				"src/main.js",
				"visible-file.txt",
			]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should work without .gitignore file", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "get-paths-no-gitignore-test-"));

		try {
			// Create files without .gitignore
			writeFileSync(join(tempDir, "file1.txt"), "content");
			writeFileSync(join(tempDir, ".hidden-file"), "content");

			mkdirSync(join(tempDir, "node_modules"));
			writeFileSync(join(tempDir, "node_modules", "package.js"), "content");

			const result = GetAllFilePaths(tempDir);
			// Without gitignore, all files should be included
			assert.deepStrictEqual(result.sort(), [
				".hidden-file",
				"file1.txt",
				"node_modules/package.js",
			]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should inherit .gitignore patterns from parent directories", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), "get-paths-parent-gitignore-test-"),
		);

		try {
			// Create parent .gitignore
			writeFileSync(join(tempDir, ".gitignore"), "*.log\ntemp/");

			// Create subdirectory with its own .gitignore
			mkdirSync(join(tempDir, "subproject"));
			writeFileSync(join(tempDir, "subproject", ".gitignore"), "*.tmp");

			// Create files in subdirectory
			writeFileSync(join(tempDir, "subproject", "main.js"), "content"); // Should be included
			writeFileSync(join(tempDir, "subproject", "debug.log"), "content"); // Should be ignored (parent gitignore)
			writeFileSync(join(tempDir, "subproject", "cache.tmp"), "content"); // Should be ignored (local gitignore)

			mkdirSync(join(tempDir, "subproject", "temp"));
			writeFileSync(join(tempDir, "subproject", "temp", "file.txt"), "content"); // Should be ignored (parent gitignore)

			const result = GetAllFilePaths(join(tempDir, "subproject"));
			// main.js and .gitignore should be included
			assert.deepStrictEqual(result.sort(), [".gitignore", "main.js"]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for non-existent directory", () => {
		const nonExistentPath = join(
			tmpdir(),
			`definitely-does-not-exist-${Date.now()}`,
		);

		assert.throws(
			() => GetAllFilePaths(nonExistentPath),
			/Directory does not exist/,
			"Should throw for non-existent directory",
		);
	});

	test("should throw error for invalid directory path types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => GetAllFilePaths(path),
				/Directory path must be a non-empty string/,
				`Should throw for invalid directory path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty directory path", () => {
		assert.throws(
			() => GetAllFilePaths(""),
			/Directory path must be a non-empty string/,
			"Should throw for empty directory path",
		);
	});
});
