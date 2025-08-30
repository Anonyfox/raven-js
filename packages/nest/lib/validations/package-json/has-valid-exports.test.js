/**
 * @fileoverview Tests for package.json exports field validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { HasValidExports } from "./has-valid-exports.js";

describe("HasValidExports", () => {
	let testDir;

	beforeEach(() => {
		// Create unique temporary directory for each test
		testDir = mkdtempSync(join(tmpdir(), "exports-validation-"));
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
			() => HasValidExports(""),
			/Package path must be a non-empty string/,
		);
	});

	it("should throw error for non-string package path", () => {
		assert.throws(
			() => HasValidExports(null),
			/Package path must be a non-empty string/,
		);
	});

	it("should throw error when package.json does not exist", () => {
		assert.throws(
			() => HasValidExports(testDir),
			/package\.json not found at:/,
		);
	});

	it("should throw error for invalid JSON", () => {
		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, "invalid json");

		assert.throws(
			() => HasValidExports(testDir),
			/Failed to parse package\.json/,
		);
	});

	it("should skip validation for private packages", () => {
		const privatePackage = {
			name: "test-package",
			version: "1.0.0",
			private: true,
			exports: {
				".": {
					// Missing import/types - should be ignored for private packages
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, JSON.stringify(privatePackage, null, 2));

		// Should not throw
		assert.doesNotThrow(() => HasValidExports(testDir));
	});

	it("should skip validation when no exports field exists", () => {
		const packageWithoutExports = {
			name: "test-package",
			version: "1.0.0",
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageWithoutExports, null, 2),
		);

		// Should not throw
		assert.doesNotThrow(() => HasValidExports(testDir));
	});

	it("should pass validation for valid exports with existing files", () => {
		// Create the files that exports point to
		writeFileSync(join(testDir, "index.js"), "export const main = true;");
		writeFileSync(
			join(testDir, "types.d.ts"),
			"export declare const main: boolean;",
		);

		const validPackage = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					import: "./index.js",
					types: "./types.d.ts",
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, JSON.stringify(validPackage, null, 2));

		// Should not throw
		assert.doesNotThrow(() => HasValidExports(testDir));
	});

	it("should fail validation for missing import field", () => {
		// Create the types file
		writeFileSync(
			join(testDir, "types.d.ts"),
			"export declare const main: boolean;",
		);

		const packageMissingImport = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					// Missing import field
					types: "./types.d.ts",
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageMissingImport, null, 2),
		);

		assert.throws(() => HasValidExports(testDir), /missing "import" field/);
	});

	it("should fail validation for missing types field", () => {
		// Create the import file
		writeFileSync(join(testDir, "index.js"), "export const main = true;");

		const packageMissingTypes = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					import: "./index.js",
					// Missing types field
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageMissingTypes, null, 2),
		);

		assert.throws(() => HasValidExports(testDir), /missing "types" field/);
	});

	it("should fail validation for non-existent import file", () => {
		// Create only the types file
		writeFileSync(
			join(testDir, "types.d.ts"),
			"export declare const main: boolean;",
		);

		const packageBadImport = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					import: "./nonexistent.js", // This file doesn't exist
					types: "./types.d.ts",
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, JSON.stringify(packageBadImport, null, 2));

		assert.throws(
			() => HasValidExports(testDir),
			/import file does not exist: \.\/nonexistent\.js/,
		);
	});

	it("should fail validation for non-existent types file", () => {
		// Create only the import file
		writeFileSync(join(testDir, "index.js"), "export const main = true;");

		const packageBadTypes = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					import: "./index.js",
					types: "./nonexistent.d.ts", // This file doesn't exist
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(packageJsonPath, JSON.stringify(packageBadTypes, null, 2));

		assert.throws(
			() => HasValidExports(testDir),
			/types file does not exist: \.\/nonexistent\.d\.ts/,
		);
	});

	it("should fail validation for absolute paths", () => {
		const packageAbsolutePaths = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					import: "/absolute/path.js", // Absolute path - suspicious
					types: "/absolute/types.d.ts", // Absolute path - suspicious
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageAbsolutePaths, null, 2),
		);

		assert.throws(
			() => HasValidExports(testDir),
			/should be relative, not absolute/,
		);
	});

	it("should fail validation for invalid export entry structure", () => {
		const packageBadStructure = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": "not an object", // Should be object
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(packageBadStructure, null, 2),
		);

		assert.throws(
			() => HasValidExports(testDir),
			/export entry must be an object/,
		);
	});

	it("should pass validation for multiple valid exports", () => {
		// Create all the files that exports point to
		writeFileSync(join(testDir, "index.js"), "export const main = true;");
		writeFileSync(
			join(testDir, "types.d.ts"),
			"export declare const main: boolean;",
		);

		// Create css directory first
		mkdirSync(join(testDir, "css"), { recursive: true });
		writeFileSync(join(testDir, "css/index.js"), "export const css = true;");
		writeFileSync(
			join(testDir, "types.css.d.ts"),
			"export declare const css: boolean;",
		);

		const multipleExportsPackage = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": {
					import: "./index.js",
					types: "./types.d.ts",
				},
				"./css": {
					import: "./css/index.js",
					types: "./types.css.d.ts",
				},
			},
		};

		const packageJsonPath = join(testDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify(multipleExportsPackage, null, 2),
		);

		// Should not throw
		assert.doesNotThrow(() => HasValidExports(testDir));
	});
});
