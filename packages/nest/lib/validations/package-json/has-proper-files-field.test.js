/**
 * @fileoverview Tests for package.json files field validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { HasProperFilesField } from "./has-proper-files-field.js";

describe("HasProperFilesField", () => {
	let testDir;

	beforeEach(() => {
		// Create unique temporary directory for each test
		testDir = mkdtempSync(join(tmpdir(), "files-validation-"));
	});

	afterEach(() => {
		// Clean up temporary directory after each test
		try {
			rmSync(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it("should throw error for empty package path", () => {
		assert.throws(
			() => HasProperFilesField(""),
			/Package path must be a non-empty string/,
		);
	});

	it("should throw error for non-string package path", () => {
		assert.throws(
			() => HasProperFilesField(null),
			/Package path must be a non-empty string/,
		);
	});

	it("should throw error when package.json does not exist", () => {
		assert.throws(
			() => HasProperFilesField(testDir),
			/package\.json not found at:/,
		);
	});

	it("should throw error for invalid JSON", () => {
		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, "invalid json");

		assert.throws(
			() => HasProperFilesField(testDir),
			/Failed to parse package\.json/,
		);
	});

	it("should skip validation for private packages", () => {
		const privatePackage = {
			name: "test-package",
			version: "1.0.0",
			private: true,
			files: [], // Empty files field should be ignored for private packages
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, JSON.stringify(privatePackage, null, 2));

		// Should not throw
		assert.doesNotThrow(() => HasProperFilesField(testDir));
	});

	it("should throw error for missing files field", () => {
		const packageWithoutFiles = {
			name: "test-package",
			version: "1.0.0",
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageWithoutFiles, null, 2),
		);

		assert.throws(
			() => HasProperFilesField(testDir),
			/Missing or invalid files field/,
		);
	});

	it("should throw error for non-array files field", () => {
		const packageWithBadFiles = {
			name: "test-package",
			version: "1.0.0",
			files: "not an array",
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageWithBadFiles, null, 2),
		);

		assert.throws(
			() => HasProperFilesField(testDir),
			/Missing or invalid files field/,
		);
	});

	it("should pass validation for canonical files patterns", () => {
		const validPackage = {
			name: "test-package",
			version: "1.0.0",
			files: [
				"**/*.js",
				"*.d.ts",
				"types.*.d.ts",
				"**/README.md",
				"LICENSE",
				"media/**/*",
				"static/**/*",
				"!**/*.test.js",
			],
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, JSON.stringify(validPackage, null, 2));

		// Should not throw
		assert.doesNotThrow(() => HasProperFilesField(testDir));
	});

	it("should pass validation with additional patterns beyond canonical", () => {
		const packageWithExtraPatterns = {
			name: "test-package",
			version: "1.0.0",
			files: [
				"**/*.js",
				"*.d.ts",
				"types.*.d.ts",
				"**/README.md",
				"LICENSE",
				"media/**/*",
				"static/**/*",
				"!**/*.test.js",
				// Additional patterns are allowed
				"templates/**/*",
				"docs/**/*",
				"*.json",
			],
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageWithExtraPatterns, null, 2),
		);

		// Should not throw
		assert.doesNotThrow(() => HasProperFilesField(testDir));
	});

	it("should fail validation for missing required patterns", () => {
		const packageMissingPatterns = {
			name: "test-package",
			version: "1.0.0",
			files: [
				"**/*.js",
				"LICENSE",
				// Missing several required patterns
			],
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageMissingPatterns, null, 2),
		);

		assert.throws(
			() => HasProperFilesField(testDir),
			/files: missing required patterns/,
		);
	});

	it("should fail validation for missing test exclusion", () => {
		const packageWithoutTestExclusion = {
			name: "test-package",
			version: "1.0.0",
			files: [
				"**/*.js",
				"*.d.ts",
				"types.*.d.ts",
				"**/README.md",
				"LICENSE",
				"media/**/*",
				"static/**/*",
				// Missing "!**/*.test.js"
			],
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageWithoutTestExclusion, null, 2),
		);

		assert.throws(
			() => HasProperFilesField(testDir),
			/files: missing required patterns.*!.*\*\.test\.js/,
		);
	});
});
