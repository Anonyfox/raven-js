import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidSemver } from "./has-valid-semver.js";

describe("HasValidSemver", () => {
	test("should return true for valid semver versions", () => {
		const validVersions = ["1.0.0", "0.0.1", "10.5.3", "999.999.999"];

		validVersions.forEach((version) => {
			const tempDir = mkdtempSync(join(tmpdir(), "valid-semver-test-"));
			const packageJson = { name: "test-package", version };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				const result = HasValidSemver(tempDir);
				assert.equal(result, true);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for invalid semver formats", () => {
		const invalidVersions = [
			"1.0.0-alpha",
			"1.0.0+build.1",
			"1.0.0-beta.1",
			"v1.0.0",
			"1.0",
			"1.0.0.0",
			"1.x.0",
			"latest",
			"^1.0.0",
			"~1.0.0",
			">=1.0.0",
		];

		invalidVersions.forEach((version) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-semver-test-"));
			const packageJson = { name: "test-package", version };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidSemver(tempDir),
					/Invalid semver format/,
					`Should throw for invalid version: ${version}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing package.json", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-package-test-"));

		try {
			assert.throws(
				() => HasValidSemver(tempDir),
				/Cannot read package\.json/,
				"Should throw for missing package.json",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-json-test-"));
		writeFileSync(join(tempDir, "package.json"), "{ invalid json }");

		try {
			assert.throws(
				() => HasValidSemver(tempDir),
				/Invalid JSON in package\.json/,
				"Should throw for invalid JSON",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing version field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-version-test-"));
		const packageJson = { name: "test-package" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidSemver(tempDir),
				/Missing version field/,
				"Should throw for missing version field",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for non-string version field", () => {
		// These values will be serialized as non-string types in JSON
		const nonStringVersions = [123, null, {}, []];

		nonStringVersions.forEach((version) => {
			const tempDir = mkdtempSync(join(tmpdir(), "non-string-version-test-"));
			const packageJson = { name: "test-package", version };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidSemver(tempDir),
					/Version field must be a string|Missing version field/,
					`Should throw for non-string version: ${typeof version}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for invalid input types", () => {
		const invalidInputs = [null, undefined, 123, {}, []];

		invalidInputs.forEach((input) => {
			assert.throws(
				() => HasValidSemver(input),
				/Package path must be a non-empty string/,
				`Should throw for invalid input: ${typeof input}`,
			);
		});
	});

	test("should throw error for empty string input", () => {
		assert.throws(
			() => HasValidSemver(""),
			/Package path must be a non-empty string/,
			"Should throw for empty string input",
		);
	});
});
