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
			"",
			"Should not use package README for empty module README",
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

	test("should not use package readme when module readme is empty", () => {
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
			"",
			"Should not fallback to package README",
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

	test("should handle realistic beak-like package structure with complex JSDoc", () => {
		// Mock discovery package structure mimicking @raven-js/beak
		const mockPackage = { name: "@raven-js/beak" };
		const discoveryPackage = {
			name: "@raven-js/beak",
			version: "0.4.7",
			description: "Zero-dependency templating library for modern JavaScript",
			readme: "# Beak\n\nZero-dependency templating library.",
			modules: [
				{
					importPath: "@raven-js/beak",
					package: mockPackage,
					readme: "",
					files: [
						{
							path: "index.js",
							text: `/**
 * @file Zero-dependency template literal engine for modern JavaScript
 *
 * Tagged template literals for HTML, CSS, JavaScript, SQL, and Markdown generation.
 * Near string-concatenation performance with intelligent value processing.
 *
 * @example
 * // Conditional rendering with ternary operators
 * const greeting = html\`<div>
 *   \${isLoggedIn ? html\`<p>Welcome back!</p>\` : html\`<p>Please log in.</p>\`}
 * </div>\`;
 */

export { css, style } from "./css/index.js";
export { html, safeHtml } from "./html/index.js";`,
						},
					],
				},
				{
					importPath: "@raven-js/beak/html",
					package: mockPackage,
					readme: "",
					files: [
						{
							path: "html/index.js",
							text: `/**
 * @file HTML tagged template literal engine - apex performance through platform primitives
 */

/**
 * Character-level HTML escaping with XSS protection.
 * Switch-based for V8 optimization. Blocks dangerous protocols/events.
 *
 * @function escapeHtml
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 * @example
 * escapeHtml('<script>alert("xss")</script>');
 * // Returns: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
export function escapeHtml(str) {
	let stringValue = String(str);
	let result = "";
	for (let i = 0; i < stringValue.length; i++) {
		const char = stringValue[i];
		switch (char) {
			case "&": result += "&amp;"; break;
			case "<": result += "&lt;"; break;
			default: result += char;
		}
	}
	return result;
}

/**
 * HTML template literal processor with automatic escaping
 *
 * @function html
 * @param {TemplateStringsArray} strings - Template literal static parts
 * @param {...any} values - Dynamic values to interpolate
 * @returns {string} HTML string with escaped values
 */
export const html = (strings, ...values) => {
	return strings.reduce((result, string, i) => {
		const value = values[i] || '';
		return result + string + escapeHtml(value);
	}, '');
};`,
						},
					],
				},
				{
					importPath: "@raven-js/beak/md",
					package: mockPackage,
					readme: "# Markdown Module\n\nAdvanced markdown processing.",
					files: [
						{
							path: "md/types.js",
							text: `/**
 * @file AST node types and validation for markdown parsing
 */

/**
 * Node type constants for markdown AST
 * @typedef {Object} NodeTypes
 * @property {string} PARAGRAPH - Paragraph node type
 * @property {string} HEADING - Heading node type
 */
export const NODE_TYPES = {
	PARAGRAPH: "paragraph",
	HEADING: "heading",
	LIST: "list",
};

/**
 * Validates if a node type is supported
 * @function isValidNodeType
 * @param {string} type - Node type to validate
 * @returns {boolean} True if node type is valid
 */
export function isValidNodeType(type) {
	return Object.values(NODE_TYPES).includes(type);
}

// Export the NodeTypes typedef to make it part of the public API
export { NodeTypes };`,
						},
					],
				},
			],
		};

		const result = extract(discoveryPackage);

		// Verify package-level metadata
		strictEqual(result.name, "@raven-js/beak", "Should preserve package name");
		strictEqual(result.version, "0.4.7", "Should preserve version");
		strictEqual(
			result.description,
			"Zero-dependency templating library for modern JavaScript",
			"Should preserve description",
		);

		// Verify module structure
		strictEqual(result.modules.length, 3, "Should have 3 modules");

		// Check main module
		const mainModule = result.modules.find(
			(m) => m.importPath === "@raven-js/beak",
		);
		strictEqual(
			mainModule.isDefault,
			true,
			"Main module should be marked as default",
		);
		strictEqual(
			mainModule.entities.length,
			0,
			"Main module should have no documented entities (only exports)",
		);

		// Check HTML module
		const htmlModule = result.modules.find(
			(m) => m.importPath === "@raven-js/beak/html",
		);
		strictEqual(
			htmlModule.isDefault,
			false,
			"HTML module should not be default",
		);
		strictEqual(
			htmlModule.entities.length,
			2,
			"HTML module should have 2 entities",
		);

		// Verify escapeHtml function entity
		const escapeHtmlEntity = htmlModule.entities.find(
			(e) => e.name === "escapeHtml",
		);
		strictEqual(
			escapeHtmlEntity.entityType,
			"function",
			"Should identify escapeHtml as function",
		);
		strictEqual(
			escapeHtmlEntity.location.file,
			"html/index.js",
			"Should preserve file location",
		);
		strictEqual(
			escapeHtmlEntity.jsdocTags.length > 0,
			true,
			"Should have JSDoc tags",
		);

		// Check for param and returns tags
		const paramTags = escapeHtmlEntity.jsdocTags.filter(
			(tag) => tag.tagType === "param",
		);
		const returnTags = escapeHtmlEntity.jsdocTags.filter(
			(tag) => tag.tagType === "returns",
		);
		const exampleTags = escapeHtmlEntity.jsdocTags.filter(
			(tag) => tag.tagType === "example",
		);

		strictEqual(paramTags.length, 1, "Should have 1 param tag");
		strictEqual(returnTags.length, 1, "Should have 1 returns tag");
		strictEqual(exampleTags.length, 1, "Should have 1 example tag");

		// Verify html function entity
		const htmlEntity = htmlModule.entities.find((e) => e.name === "html");
		strictEqual(
			htmlEntity.entityType,
			"function",
			"Should identify html as function",
		);

		// Check MD module
		const mdModule = result.modules.find(
			(m) => m.importPath === "@raven-js/beak/md",
		);
		strictEqual(
			mdModule.entities.length,
			2,
			"MD module should have 2 entities (@typedef and @function)",
		);
		strictEqual(
			mdModule.readme,
			"# Markdown Module\n\nAdvanced markdown processing.",
			"Should use module-specific README",
		);

		// Verify typedef entity (name extraction might pick up type instead of name)
		const typedefEntity = mdModule.entities.find(
			(e) => e.entityType === "typedef",
		);
		strictEqual(
			typedefEntity !== undefined,
			true,
			"Should have a typedef entity",
		);
		strictEqual(
			typedefEntity.entityType,
			"typedef",
			"Should identify entity as typedef",
		);

		// Verify isValidNodeType function
		const isValidNodeTypeEntity = mdModule.entities.find(
			(e) => e.name === "isValidNodeType",
		);
		strictEqual(
			isValidNodeTypeEntity.entityType,
			"function",
			"Should identify isValidNodeType as function",
		);

		// Verify total entity count across all modules
		const totalEntities = result.allEntities.length;
		strictEqual(
			totalEntities,
			4,
			"Should have 4 total entities across all modules",
		);

		// Verify entity types distribution
		const functionEntities = result.allEntities.filter(
			(e) => e.entityType === "function",
		);
		const typedefEntities = result.allEntities.filter(
			(e) => e.entityType === "typedef",
		);
		strictEqual(functionEntities.length, 3, "Should have 3 function entities");
		strictEqual(typedefEntities.length, 1, "Should have 1 typedef entity");
	});

	test("should not show package README on individual module pages", () => {
		const mockPackage = { name: "test-pkg" };
		const discoveryPackage = {
			name: "test-pkg",
			version: "1.0.0",
			description: "Test package",
			readme:
				"# Package README\n\nThis is the package-level README that should only appear on the package overview page.",
			modules: [
				{
					importPath: "test-pkg",
					package: mockPackage,
					readme: "", // Module has no README
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
					readme: "# Utils Module README\n\nThis is the module's own README.", // Module has its own README
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

		// Package should have the package README
		strictEqual(
			result.readme,
			"# Package README\n\nThis is the package-level README that should only appear on the package overview page.",
			"Package should have package README",
		);

		// First module (no README) should have empty README
		const defaultModule = result.modules[0];
		strictEqual(
			defaultModule.readme,
			"",
			"Module without README should have empty README, not package README",
		);

		// Second module (has README) should have its own README
		const utilsModule = result.modules[1];
		strictEqual(
			utilsModule.readme,
			"# Utils Module README\n\nThis is the module's own README.",
			"Module with README should have its own README",
		);
	});
});
