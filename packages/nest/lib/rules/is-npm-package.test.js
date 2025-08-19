import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { IsNpmPackage } from "./is-npm-package.js";

describe("IsNpmPackage", () => {
	test("should return true for valid npm package with package.json", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "npm-package-test-"));
		const packageJsonPath = join(tempDir, "package.json");
		writeFileSync(packageJsonPath, '{"name": "test-package"}');

		try {
			const result = IsNpmPackage(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return false for directory without package.json", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "non-npm-test-"));
		writeFileSync(join(tempDir, "other-file.txt"), "content");

		try {
			const result = IsNpmPackage(tempDir);
			assert.equal(result, false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return false for non-existent path", () => {
		const nonExistentPath = join(
			tmpdir(),
			`definitely-does-not-exist-${Date.now()}`,
		);
		const result = IsNpmPackage(nonExistentPath);
		assert.equal(result, false);
	});

	test("should return false for invalid input types", () => {
		assert.equal(IsNpmPackage(null), false);
		assert.equal(IsNpmPackage(undefined), false);
		assert.equal(IsNpmPackage(123), false);
		assert.equal(IsNpmPackage({}), false);
		assert.equal(IsNpmPackage([]), false);
	});

	test("should return false for empty string", () => {
		const result = IsNpmPackage("");
		assert.equal(result, false);
	});
});
