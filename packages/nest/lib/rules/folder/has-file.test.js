import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasFile } from "./has-file.js";

describe("HasFile", () => {
	test("should return true when file exists", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "has-file-exists-test-"));
		writeFileSync(join(tempDir, "test-file.txt"), "content");

		try {
			const result = HasFile(tempDir, "test-file.txt");
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true when file exists in subdirectory", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "has-file-subdir-test-"));

		try {
			const subDir = join(tempDir, "subdir");
			mkdirSync(subDir);
			writeFileSync(join(subDir, "nested-file.txt"), "content");
			const result = HasFile(tempDir, "subdir/nested-file.txt");
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error when file does not exist", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "has-file-missing-test-"));

		try {
			assert.throws(
				() => HasFile(tempDir, "non-existent-file.txt"),
				/File "non-existent-file\.txt" does not exist/,
				"Should throw for missing file",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid directory path types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => HasFile(path, "file.txt"),
				/Directory path must be a non-empty string/,
				`Should throw for invalid directory path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty directory path", () => {
		assert.throws(
			() => HasFile("", "file.txt"),
			/Directory path must be a non-empty string/,
			"Should throw for empty directory path",
		);
	});

	test("should throw error for invalid file name types", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "has-file-invalid-name-test-"));
		const invalidNames = [null, undefined, 123, {}, []];

		try {
			invalidNames.forEach((name) => {
				assert.throws(
					() => HasFile(tempDir, name),
					/File name must be a non-empty string/,
					`Should throw for invalid file name: ${typeof name}`,
				);
			});
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for empty file name", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "has-file-empty-name-test-"));

		try {
			assert.throws(
				() => HasFile(tempDir, ""),
				/File name must be a non-empty string/,
				"Should throw for empty file name",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
