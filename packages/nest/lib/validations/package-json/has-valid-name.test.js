import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidName } from "./has-valid-name.js";

describe("HasValidName", () => {
	test("should return true for valid package names", () => {
		const validNames = [
			"raven-js",
			"@raven-js/core",
			"@raven-js/wings",
			"@raven-js/beak",
			"@raven-js/nest",
			"@raven-js/some-package",
		];

		validNames.forEach((name) => {
			const tempDir = mkdtempSync(join(tmpdir(), "valid-name-test-"));
			const packageJson = { name, version: "1.0.0" };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				const result = HasValidName(tempDir);
				assert.equal(result, true, `Should pass for valid name: ${name}`);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for invalid package names", () => {
		const invalidNames = [
			"some-package",
			"@other/package",
			"@raven-js",
			"@raven-js/",
			"raven-js-something",
			"ravenjs",
			"@raven/package",
			"@scope/raven-js",
		];

		invalidNames.forEach((name) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-name-test-"));
			const packageJson = { name, version: "1.0.0" };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidName(tempDir),
					/Package name must be "raven-js" or start with "@raven-js\/"|Scoped package name must be in format @raven-js\/package-name/,
					`Should throw for invalid name: ${name}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing name field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-name-test-"));
		const packageJson = { version: "1.0.0" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidName(tempDir),
				/Missing or invalid name field/,
				"Should throw for missing name field",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid name types", () => {
		const invalidNameTypes = [null, 123, {}, [], true];

		invalidNameTypes.forEach((name) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-name-type-test-"));
			const packageJson = { name, version: "1.0.0" };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidName(tempDir),
					/Missing or invalid name field/,
					`Should throw for invalid name type: ${typeof name}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for empty/whitespace name", () => {
		const emptyNames = ["", "   ", "\t\n"];

		emptyNames.forEach((name) => {
			const tempDir = mkdtempSync(join(tmpdir(), "empty-name-test-"));
			const packageJson = { name, version: "1.0.0" };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidName(tempDir),
					/Missing or invalid name field/,
					`Should throw for empty name: "${name}"`,
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
				() => HasValidName(tempDir),
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
				() => HasValidName(tempDir),
				/Invalid JSON in package\.json/,
				"Should throw for invalid JSON",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid input types", () => {
		const invalidInputs = [null, undefined, 123, {}, []];

		invalidInputs.forEach((input) => {
			assert.throws(
				() => HasValidName(input),
				/Package path must be a non-empty string/,
				`Should throw for invalid input: ${typeof input}`,
			);
		});
	});

	test("should throw error for empty string input", () => {
		assert.throws(
			() => HasValidName(""),
			/Package path must be a non-empty string/,
			"Should throw for empty string input",
		);
	});
});
