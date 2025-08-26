/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for the Package model - Raven doctrine applied.
 */

import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { describe, test } from "node:test";
import { Package } from "./package.js";

describe("core functionality", () => {
	test("should parse valid package.json with proper property extraction", () => {
		// Test with complete package.json
		const completePackageJson = JSON.stringify({
			name: "test-package",
			version: "1.0.0",
			description: "A test package",
			main: "./index.js",
			exports: {
				".": "./index.js",
				"./utils": "./lib/utils.js",
			},
		});
		const files = new Set(["index.js", "lib/utils.js", "package.json"]);
		const pkg = new Package(completePackageJson, files);

		strictEqual(pkg.name, "test-package");
		strictEqual(pkg.version, "1.0.0");
		strictEqual(pkg.description, "A test package");
		deepStrictEqual(pkg.entryPoints, {
			".": "index.js",
			"./utils": "lib/utils.js",
		});

		// Test with minimal package.json
		const minimalJson = JSON.stringify({ name: "minimal-package" });
		const minimalPkg = new Package(minimalJson);
		strictEqual(minimalPkg.name, "minimal-package");
		strictEqual(minimalPkg.version, "");
		strictEqual(minimalPkg.description, "");
		deepStrictEqual(minimalPkg.entryPoints, {});
	});

	test("should handle entry point extraction and file validation", () => {
		// Test wildcard exports
		const wildcardJson = JSON.stringify({
			name: "entry-points-test",
			exports: {
				".": "./src/index.js",
				"./utils/*": "./src/utils/*.js",
			},
		});
		const wildcardFiles = new Set([
			"src/index.js",
			"src/utils/format.js",
			"src/utils/validate.js",
		]);
		const wildcardPkg = new Package(wildcardJson, wildcardFiles);
		deepStrictEqual(wildcardPkg.entryPoints, {
			".": "src/index.js",
			"./utils/format": "./src/utils/format.js",
			"./utils/validate": "./src/utils/validate.js",
		});

		// Test without files parameter
		const noFilesJson = JSON.stringify({
			name: "no-files-test",
			version: "2.0.0",
			main: "./index.js",
		});
		const noFilesPkg = new Package(noFilesJson);
		deepStrictEqual(noFilesPkg.entryPoints, {}); // No files to validate against

		// Test getExistingFile method
		strictEqual(typeof wildcardPkg.getExistingFile, "function");
		strictEqual(wildcardPkg.getExistingFile("nonexistent"), undefined);
	});

	test("should handle type coercion and default values for invalid properties", () => {
		// Test invalid types that should default to empty strings
		const invalidTypesJson = JSON.stringify({
			name: "partial-package",
			version: 123, // Invalid type
			description: null, // Invalid type
		});
		const partialPkg = new Package(invalidTypesJson);
		strictEqual(partialPkg.name, "partial-package");
		strictEqual(partialPkg.version, "");
		strictEqual(partialPkg.description, "");

		// Test missing name (should default to empty string)
		const missingNameJson = JSON.stringify({
			version: "1.0.0",
			description: "No name specified",
		});
		const missingNamePkg = new Package(missingNameJson);
		strictEqual(missingNamePkg.name, "");
		strictEqual(missingNamePkg.version, "1.0.0");
		strictEqual(missingNamePkg.description, "No name specified");
	});
});

describe("edge cases and error handling", () => {
	test("should throw appropriate errors for invalid constructor inputs", () => {
		// Invalid jsonString types
		throws(() => new Package(null), {
			name: "Error",
			message: "Package constructor requires a valid JSON string",
		});
		throws(() => new Package(123), {
			name: "Error",
			message: "Package constructor requires a valid JSON string",
		});
		throws(() => new Package({}), {
			name: "Error",
			message: "Package constructor requires a valid JSON string",
		});
		throws(() => new Package(undefined), {
			name: "Error",
			message: "Package constructor requires a valid JSON string",
		});

		// Empty JSON strings
		throws(() => new Package(""), {
			name: "Error",
			message: "Package JSON string cannot be empty",
		});
		throws(() => new Package("   "), {
			name: "Error",
			message: "Package JSON string cannot be empty",
		});
		throws(() => new Package("\t\n\r"), {
			name: "Error",
			message: "Package JSON string cannot be empty",
		});
	});

	test("should throw errors for malformed and invalid JSON", () => {
		// Malformed JSON
		throws(() => new Package('{"invalid": json}'), {
			name: "Error",
			message: /Invalid package\.json format:/,
		});
		throws(() => new Package("{invalid json"), {
			name: "Error",
			message: /Invalid package\.json format:/,
		});
		throws(() => new Package('{"name": "test",}'), {
			name: "Error",
			message: /Invalid package\.json format:/,
		});

		// Non-object JSON
		throws(() => new Package('"just a string"'), {
			name: "Error",
			message: "Package JSON must be a valid object",
		});
		throws(() => new Package("123"), {
			name: "Error",
			message: "Package JSON must be a valid object",
		});
		throws(() => new Package('["array", "not", "object"]'), {
			name: "Error",
			message: "Package JSON must be a valid object",
		});
		throws(() => new Package("null"), {
			name: "Error",
			message: "Package JSON must be a valid object",
		});
		throws(() => new Package("false"), {
			name: "Error",
			message: "Package JSON must be a valid object",
		});
	});

	test("should validate files parameter when provided", () => {
		const validJson = JSON.stringify({ name: "test" });

		// Invalid files parameter types
		throws(() => new Package(validJson, "not-a-set"), {
			name: "Error",
			message: "Files parameter must be a Set of file paths",
		});
		throws(() => new Package(validJson, 123), {
			name: "Error",
			message: "Files parameter must be a Set of file paths",
		});
		throws(() => new Package(validJson, {}), {
			name: "Error",
			message: "Files parameter must be a Set of file paths",
		});
		throws(() => new Package(validJson, []), {
			name: "Error",
			message: "Files parameter must be a Set of file paths",
		});

		// Valid files parameter should work
		const validPkg = new Package(validJson, new Set(["index.js"]));
		strictEqual(validPkg.name, "test");
	});
});

describe("integration scenarios", () => {
	test("should handle complex real-world package configurations", () => {
		const complexJson = JSON.stringify({
			name: "@scope/complex-package",
			version: "1.2.3-beta.4",
			description: "A complex package with many features",
			main: "./dist/index.js",
			exports: {
				".": {
					import: "./dist/esm/index.js",
					require: "./dist/cjs/index.js",
				},
				"./utils": "./dist/utils.js",
			},
			scripts: {
				build: "tsc",
				test: "jest",
			},
			dependencies: {
				lodash: "^4.17.21",
			},
		});

		const complexFiles = new Set([
			"dist/esm/index.js",
			"dist/cjs/index.js",
			"dist/utils.js",
			"package.json",
		]);

		const complexPkg = new Package(complexJson, complexFiles);

		strictEqual(complexPkg.name, "@scope/complex-package");
		strictEqual(complexPkg.version, "1.2.3-beta.4");
		strictEqual(complexPkg.description, "A complex package with many features");
		// Entry points should use import condition for modern ESM
		deepStrictEqual(complexPkg.entryPoints, {
			".": "dist/esm/index.js",
			"./utils": "dist/utils.js",
		});
	});

	test("should maintain state consistency and support file tracking", () => {
		const pkg = new Package(
			'{"name":"state-test","version":"1.0.0"}',
			new Set(),
		);

		// Test initial state
		strictEqual(pkg.modules.length, 0);
		strictEqual(pkg.files.length, 0);
		strictEqual(pkg.readme, "");

		// Test that arrays are properly initialized
		strictEqual(Array.isArray(pkg.modules), true);
		strictEqual(Array.isArray(pkg.files), true);

		// Test getExistingFile with empty files
		strictEqual(pkg.getExistingFile("any-path"), undefined);

		// Test getExistingFile after adding a file
		const testFile = { path: "test-file.js" }; // Mock file-like object
		pkg.files.push(testFile);
		strictEqual(pkg.getExistingFile("test-file.js"), testFile);
		strictEqual(pkg.getExistingFile("non-existent.js"), undefined);

		// Test that properties are accessible and modifiable (not read-only)
		const originalName = pkg.name;
		pkg.name = "changed";
		strictEqual(pkg.name, "changed"); // Properties are mutable by design
		pkg.name = originalName; // Restore for consistency
	});

	test("should support edge case package.json structures", () => {
		// Package with no exports or main
		const noExportsJson = JSON.stringify({
			name: "no-exports",
			private: true,
			devDependencies: { jest: "^29.0.0" },
		});
		const noExportsPkg = new Package(noExportsJson, new Set(["index.js"]));
		strictEqual(noExportsPkg.name, "no-exports");
		deepStrictEqual(noExportsPkg.entryPoints, {});

		// Package with unusual but valid properties
		const unusualJson = JSON.stringify({
			name: "unusual",
			version: "0.0.0-development",
			description: "",
			main: "does-not-exist.js", // File doesn't exist
		});
		const unusualPkg = new Package(unusualJson, new Set(["other.js"]));
		strictEqual(unusualPkg.name, "unusual");
		strictEqual(unusualPkg.description, "");
		deepStrictEqual(unusualPkg.entryPoints, {}); // main file doesn't exist
	});
});
