/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for extraction orchestrator - surgical transformation validation
 *
 * Ravens validate transformation logic with predatory precision.
 * 100% branch coverage ensuring discovery → documentation transformation
 * handles all edge cases and error conditions. Zero external dependencies.
 */

import { strictEqual, throws } from "node:assert";
import { describe, test } from "node:test";
import { extract } from "./index.js";
import { Package as ExtractPackage } from "./models/package.js";

describe("extract()", () => {
	test("should throw error for null input", () => {
		throws(
			() => extract(null),
			/extract\(\) requires a valid discovery package/,
			"Should reject null input",
		);
	});

	test("should throw error for undefined input", () => {
		throws(
			() => extract(undefined),
			/extract\(\) requires a valid discovery package/,
			"Should reject undefined input",
		);
	});

	test("should throw error for non-object input", () => {
		throws(
			() => extract("not an object"),
			/extract\(\) requires a valid discovery package/,
			"Should reject string input",
		);

		throws(
			() => extract(42),
			/extract\(\) requires a valid discovery package/,
			"Should reject number input",
		);
	});

	test("should create extract package with discovery metadata", () => {
		const discoveryPackage = {
			name: "test-package",
			version: "1.0.0",
			description: "Test package description",
			readme: "# Test Package\n\nThis is a test.",
			modules: [],
		};

		const result = extract(discoveryPackage);

		strictEqual(
			result instanceof ExtractPackage,
			true,
			"Should return ExtractPackage instance",
		);
		strictEqual(result.name, "test-package", "Should preserve package name");
		strictEqual(result.version, "1.0.0", "Should preserve package version");
		strictEqual(
			result.description,
			"Test package description",
			"Should preserve description",
		);
		strictEqual(
			result.readme,
			"# Test Package\n\nThis is a test.",
			"Should preserve readme",
		);
		strictEqual(
			result.modules.length,
			0,
			"Should have no modules for empty input",
		);
	});

	test("should handle empty modules array", () => {
		const discoveryPackage = {
			name: "empty-package",
			version: "0.1.0",
			description: "",
			readme: "",
			modules: [],
		};

		const result = extract(discoveryPackage);

		strictEqual(result.modules.length, 0, "Should handle empty modules array");
	});

	test("should transform discovery modules into extract modules", () => {
		const mockPackage = { name: "test-pkg" };
		const discoveryPackage = {
			name: "test-pkg",
			version: "1.0.0",
			description: "Test",
			readme: "Package README",
			modules: [
				{
					importPath: "test-pkg",
					package: mockPackage,
					readme: "",
					files: [
						{
							path: "index.js",
							content: "/** @function test */\nfunction test() {}",
						},
					],
				},
				{
					importPath: "test-pkg/utils",
					package: mockPackage,
					readme: "Utils README",
					files: [
						{
							path: "utils.js",
							content: "/** @class Util */\nclass Util {}",
						},
					],
				},
			],
		};

		const result = extract(discoveryPackage);

		strictEqual(
			result.modules.length,
			2,
			"Should create modules for each discovery module",
		);

		// Check first module (default)
		const defaultModule = result.modules[0];
		strictEqual(
			defaultModule.importPath,
			"test-pkg",
			"Should preserve import path",
		);
		strictEqual(
			defaultModule.isDefault,
			true,
			"Should mark main package as default",
		);
		strictEqual(
			defaultModule.readme,
			"Package README",
			"Should use package README for empty module README",
		);

		// Check second module (submodule)
		const subModule = result.modules[1];
		strictEqual(
			subModule.importPath,
			"test-pkg/utils",
			"Should preserve submodule import path",
		);
		strictEqual(
			subModule.isDefault,
			false,
			"Should mark submodule as non-default",
		);
		strictEqual(
			subModule.readme,
			"Utils README",
			"Should use module-specific README",
		);
	});

	test("should use package readme when module readme is empty", () => {
		const mockPackage = { name: "pkg" };
		const discoveryPackage = {
			name: "pkg",
			version: "1.0.0",
			description: "Test",
			readme: "Fallback README",
			modules: [
				{
					importPath: "pkg",
					package: mockPackage,
					readme: "",
					files: [],
				},
			],
		};

		const result = extract(discoveryPackage);

		strictEqual(
			result.modules[0].readme,
			"Fallback README",
			"Should fallback to package README",
		);
	});

	test("should prefer module readme over package readme when available", () => {
		const mockPackage = { name: "pkg" };
		const discoveryPackage = {
			name: "pkg",
			version: "1.0.0",
			description: "Test",
			readme: "Package README",
			modules: [
				{
					importPath: "pkg",
					package: mockPackage,
					readme: "Module README",
					files: [],
				},
			],
		};

		const result = extract(discoveryPackage);

		strictEqual(
			result.modules[0].readme,
			"Module README",
			"Should prefer module README",
		);
	});

	test("should handle missing or malformed discovery package properties", () => {
		const discoveryPackage = {
			// Missing name, version, description, readme
			modules: [],
		};

		const result = extract(discoveryPackage);

		strictEqual(result.name, "", "Should handle missing name");
		strictEqual(result.version, "", "Should handle missing version");
		strictEqual(result.description, "", "Should handle missing description");
		strictEqual(result.readme, "", "Should handle missing readme");
	});
});
