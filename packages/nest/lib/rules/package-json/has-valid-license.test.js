import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidLicense } from "./has-valid-license.js";

describe("HasValidLicense", () => {
	test("should return true for valid MIT license with LICENSE file", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-license-test-"));
		const packageJson = { name: "test-package", license: "MIT" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));
		writeFileSync(join(tempDir, "LICENSE"), "MIT License");

		try {
			const result = HasValidLicense(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid license values", () => {
		const invalidLicenses = [
			"ISC",
			"Apache-2.0",
			"GPL-3.0",
			"BSD-3-Clause",
			"",
		];

		invalidLicenses.forEach((license) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-license-test-"));
			const packageJson = { name: "test-package", license };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));
			writeFileSync(join(tempDir, "LICENSE"), "License content"); // Add LICENSE file

			try {
				assert.throws(
					() => HasValidLicense(tempDir),
					/License must be "MIT"/,
					`Should throw for invalid license: ${license}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing license field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-license-test-"));
		const packageJson = { name: "test-package" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidLicense(tempDir),
				/License must be "MIT"/,
				"Should throw for missing license field",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing LICENSE file", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-license-file-test-"));
		const packageJson = { name: "test-package", license: "MIT" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));
		// No LICENSE file created

		try {
			assert.throws(
				() => HasValidLicense(tempDir),
				/Package must have a LICENSE file/,
				"Should throw for missing LICENSE file",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for non-string license types", () => {
		const invalidTypes = [null, 123, {}, [], true];

		invalidTypes.forEach((license) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-license-type-test-"));
			const packageJson = { name: "test-package", license };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));
			writeFileSync(join(tempDir, "LICENSE"), "License content"); // Add LICENSE file

			try {
				assert.throws(
					() => HasValidLicense(tempDir),
					/License must be "MIT"/,
					`Should throw for invalid license type: ${typeof license}`,
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
				() => HasValidLicense(input),
				/Package path must be a non-empty string/,
				`Should throw for invalid input: ${typeof input}`,
			);
		});
	});
});
