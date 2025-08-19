/**
 * @file Test suite for package.json funding validation functionality
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
import { HasValidFunding } from "./has-valid-funding.js";

describe("HasValidFunding", () => {
	test("should return true for valid funding configuration", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-funding-test-"));

		try {
			const validPackageJson = {
				name: "@test/package",
				version: "1.0.0",
				funding: {
					type: "github",
					url: "https://github.com/sponsors/Anonyfox",
				},
			};

			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify(validPackageJson, null, 2),
			);

			const result = HasValidFunding(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true for private packages without funding", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "private-package-test-"));

		try {
			const privatePackageJson = {
				name: "@test/private-package",
				version: "1.0.0",
				private: true,
			};

			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify(privatePackageJson, null, 2),
			);

			const result = HasValidFunding(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing funding field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-funding-test-"));

		try {
			const packageJsonWithoutFunding = {
				name: "@test/package",
				version: "1.0.0",
			};

			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify(packageJsonWithoutFunding, null, 2),
			);

			assert.throws(
				() => HasValidFunding(tempDir),
				/Missing funding field in package\.json/,
				"Should throw for missing funding field",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid funding type", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-funding-type-test-"));

		try {
			const packageJsonWithWrongType = {
				name: "@test/package",
				version: "1.0.0",
				funding: {
					type: "patreon",
					url: "https://github.com/sponsors/Anonyfox",
				},
			};

			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify(packageJsonWithWrongType, null, 2),
			);

			assert.throws(
				() => HasValidFunding(tempDir),
				/Funding type must be "github"/,
				"Should throw for wrong funding type",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid funding url", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-funding-url-test-"));

		try {
			const packageJsonWithWrongUrl = {
				name: "@test/package",
				version: "1.0.0",
				funding: {
					type: "github",
					url: "https://github.com/sponsors/someone-else",
				},
			};

			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify(packageJsonWithWrongUrl, null, 2),
			);

			assert.throws(
				() => HasValidFunding(tempDir),
				/Funding url must be "https:\/\/github\.com\/sponsors\/Anonyfox"/,
				"Should throw for wrong funding URL",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for non-object funding field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-funding-object-test-"));

		try {
			const packageJsonWithStringFunding = {
				name: "@test/package",
				version: "1.0.0",
				funding: "https://github.com/sponsors/Anonyfox",
			};

			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify(packageJsonWithStringFunding, null, 2),
			);

			assert.throws(
				() => HasValidFunding(tempDir),
				/Funding field must be an object/,
				"Should throw for string funding field",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing package.json", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "no-package-json-test-"));

		try {
			assert.throws(
				() => HasValidFunding(tempDir),
				/Cannot read package\.json/,
				"Should throw for missing package.json",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-json-test-"));

		try {
			writeFileSync(join(tempDir, "package.json"), "{ invalid json }");

			assert.throws(
				() => HasValidFunding(tempDir),
				/Invalid JSON in package\.json/,
				"Should throw for invalid JSON",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid input types", () => {
		const invalidPaths = [null, undefined, 123, {}, []];

		invalidPaths.forEach((path) => {
			assert.throws(
				() => HasValidFunding(path),
				/Package path must be a non-empty string/,
				`Should throw for invalid package path: ${typeof path}`,
			);
		});
	});

	test("should throw error for empty string input", () => {
		assert.throws(
			() => HasValidFunding(""),
			/Package path must be a non-empty string/,
			"Should throw for empty string input",
		);
	});
});
