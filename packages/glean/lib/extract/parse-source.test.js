/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for source parsing engine - predatory JSDoc extraction validation
 *
 * Ravens validate JSDoc parsing with surgical precision.
 * 100% branch coverage ensuring all code paths handle edge cases
 * and error conditions. Zero external dependencies.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { parseModuleEntities } from "./parse-source.js";

describe("parseModuleEntities()", () => {
	test("should return empty array for null input", () => {
		const result = parseModuleEntities(null);
		deepStrictEqual(result, [], "Should handle null input");
	});

	test("should return empty array for undefined input", () => {
		const result = parseModuleEntities(undefined);
		deepStrictEqual(result, [], "Should handle undefined input");
	});

	test("should return empty array for input without files property", () => {
		const discoveryModule = {};
		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should handle missing files property");
	});

	test("should return empty array for input with non-array files", () => {
		const discoveryModule = { files: "not an array" };
		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should handle non-array files property");
	});

	test("should return empty array for empty files array", () => {
		const discoveryModule = { files: [] };
		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should handle empty files array");
	});

	test("should parse entities from files with JSDoc", () => {
		const discoveryModule = {
			files: [
				{
					path: "test.js",
					text: `/**
 * @function testFunc
 * @param {string} input - Test parameter
 * @returns {boolean} Test result
 */
export function testFunc(input) { return true; }`,
				},
				{
					path: "class.js",
					text: `/**
 * @class TestClass
 * @param {string} name - Class name
 */
export class TestClass {
	constructor(name) {
		this.name = name;
	}
}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 2, "Should parse entities from both files");
		strictEqual(result[0].name, "testFunc", "Should extract function name");
		strictEqual(
			result[0].entityType,
			"function",
			"Should identify function type",
		);
		strictEqual(result[1].name, "TestClass", "Should extract class name");
		strictEqual(result[1].entityType, "class", "Should identify class type");
	});

	test("should classify tagged template literals and arrow functions as functions", () => {
		const discoveryModule = {
			files: [
				{
					path: "templates.js",
					text: `/**
 * Tagged template for HTML generation
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...any} values - Template values
 * @returns {string} Generated HTML
 */
export const html = (strings, ...values) => {
	return strings.join('');
};

/**
 * Tagged template for markdown
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...any} values - Template values
 * @returns {string} Generated markdown
 */
export const md = (strings, ...values) => {
	return strings.join('');
};

/**
 * Regular arrow function
 * @param {number} x - Input value
 * @returns {number} Result
 */
export const multiply = (x) => x * 2;

/**
 * Function expression
 * @param {string} str - Input string
 * @returns {string} Processed string
 */
export const process = function(str) { return str.toUpperCase(); };

/**
 * Regular variable
 * @type {string}
 */
export const MESSAGE = 'Hello World';`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 5, "Should parse all 5 entities");

		// Tagged template with (strings, ...values) signature should be function
		const htmlEntity = result.find((e) => e.name === "html");
		strictEqual(
			htmlEntity.entityType,
			"function",
			"Tagged template html should be classified as function",
		);

		// Another tagged template
		const mdEntity = result.find((e) => e.name === "md");
		strictEqual(
			mdEntity.entityType,
			"function",
			"Tagged template md should be classified as function",
		);

		// Regular arrow function
		const multiplyEntity = result.find((e) => e.name === "multiply");
		strictEqual(
			multiplyEntity.entityType,
			"function",
			"Arrow function should be classified as function",
		);

		// Function expression
		const processEntity = result.find((e) => e.name === "process");
		strictEqual(
			processEntity.entityType,
			"function",
			"Function expression should be classified as function",
		);

		// Regular variable should remain variable
		const messageEntity = result.find((e) => e.name === "MESSAGE");
		strictEqual(
			messageEntity.entityType,
			"variable",
			"Regular variable should remain as variable",
		);
	});

	test("should handle files without content", () => {
		const discoveryModule = {
			files: [
				{
					path: "empty.js",
					text: null,
				},
				{
					path: "undefined.js",
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should handle files without content");
	});

	test("should handle files with no JSDoc blocks", () => {
		const discoveryModule = {
			files: [
				{
					path: "plain.js",
					text: "function plainFunction() { return 42; }",
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should handle files without JSDoc");
	});

	test("should handle JSDoc blocks without entity tags", () => {
		const discoveryModule = {
			files: [
				{
					path: "comment.js",
					text: `/**
 * Just a regular comment
 * @author Someone
 * @since 1.0.0
 */
export function someFunction() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);
		// Now that code analysis is implemented, this should detect the function
		strictEqual(result.length, 1, "Should detect function from code analysis");
		strictEqual(
			result[0].name,
			"someFunction",
			"Should extract function name from code",
		);
		strictEqual(
			result[0].entityType,
			"function",
			"Should detect entity type as function",
		);
	});

	test("should extract multiple entities from single file", () => {
		const discoveryModule = {
			files: [
				{
					path: "multi.js",
					text: `/**
 * @function first
 */
export function first() {}

/**
 * @class Second
 */
export class Second {}

/**
 * @typedef ThirdType
 */
export const ThirdType = {};`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 3, "Should extract multiple entities");
		strictEqual(result[0].name, "first", "Should extract first entity");
		strictEqual(result[1].name, "Second", "Should extract second entity");
		strictEqual(result[2].name, "ThirdType", "Should extract third entity");
	});

	test("should handle malformed JSDoc blocks", () => {
		const discoveryModule = {
			files: [
				{
					path: "malformed.js",
					text: `/**
 * Incomplete block without closing
export function broken() {}

/** @function validFunc */
export function validFunc() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(
			result.length,
			1,
			"Should extract from valid JSDoc blocks despite malformed ones",
		);
		strictEqual(result[0].name, "validFunc", "Should extract valid function");
		strictEqual(
			result[0].entityType,
			"function",
			"Should detect valid function type",
		);
		// The malformed test actually has no complete JSDoc blocks - the first is unclosed,
		// so no entities should be extracted
	});

	test("should preserve file location in entities", () => {
		const discoveryModule = {
			files: [
				{
					path: "location.js",
					text: `line 1
line 2
/**
 * @function testLocation
 */
export function testLocation() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 1, "Should extract one entity");
		strictEqual(
			result[0].location.file,
			"location.js",
			"Should preserve file path",
		);
		strictEqual(
			result[0].location.line,
			3,
			"Should calculate correct line number",
		);
		strictEqual(result[0].location.column, 1, "Should set default column");
	});

	test("should parse JSDoc tags on entities", () => {
		const discoveryModule = {
			files: [
				{
					path: "tags.js",
					text: `/**
 * @function richFunc
 * @param {string} input - Input parameter
 * @param {number} count - Count parameter
 * @returns {boolean} Success indicator
 * @throws {Error} When input is invalid
 * @example
 * richFunc("test", 5);
 * @since 1.2.0
 * @deprecated Use newFunc instead
 */
export function richFunc(input, count) {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 1, "Should extract one entity");
		const entity = result[0];

		// Check that tags were parsed and attached
		const tags = entity.jsdocTags;
		strictEqual(Array.isArray(tags), true, "Should have tags array");

		// Find specific tag types
		const paramTags = tags.filter((tag) => tag.tagType === "param");
		const returnTag = tags.find((tag) => tag.tagType === "returns");
		const throwTag = tags.find((tag) => tag.tagType === "throws");

		strictEqual(paramTags.length, 2, "Should parse multiple param tags");
		strictEqual(Boolean(returnTag), true, "Should parse returns tag");
		strictEqual(Boolean(throwTag), true, "Should parse throws tag");
	});

	test("should handle entity names with spaces", () => {
		const discoveryModule = {
			files: [
				{
					path: "spaces.js",
					text: `/**
 * @function complex name here
 */
export function complexFunc() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 1, "Should extract entity");
		strictEqual(result[0].name, "complex", "Should extract first word as name");
	});

	test("should handle empty entity names", () => {
		const discoveryModule = {
			files: [
				{
					path: "empty-name.js",
					text: `/**
 * @function
 */
export function anonymousFunc() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(result.length, 1, "Should extract entity");
		strictEqual(result[0].name, "anonymous", "Should use default name");
	});

	test("should handle unsupported entity types", () => {
		const discoveryModule = {
			files: [
				{
					path: "unsupported.js",
					text: `/**
 * @unknown unsupportedType
 */
export function someFunc() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);
		// Even with unsupported JSDoc tags, code analysis should detect the function
		strictEqual(
			result.length,
			1,
			"Should detect function from code analysis despite unsupported tags",
		);
		strictEqual(
			result[0].name,
			"someFunc",
			"Should extract function name from code",
		);
		strictEqual(
			result[0].entityType,
			"function",
			"Should detect entity type as function",
		);
	});

	test("should extract description content separately from JSDoc tags", () => {
		const file = {
			path: "test.js",
			text: `/**
 * This is a detailed description of the function.
 * It explains what the function does and provides context.
 * Multiple lines of rich documentation content.
 *
 * @function myFunction
 * @param {string} input - The input parameter
 * @returns {string} The output result
 * @example
 * myFunction('hello');
 * // Returns: 'HELLO'
 */
export function myFunction(input) {
	return input.toUpperCase();
}`,
		};

		const entities = parseModuleEntities({
			files: [file],
		});

		strictEqual(entities.length, 1, "Should create one entity");

		const entity = entities[0];
		strictEqual(entity.entityType, "function", "Should be function type");
		strictEqual(entity.name, "myFunction", "Should have correct name");

		// Check description content (should NOT include @tag content)
		const expectedDescription = `This is a detailed description of the function.
It explains what the function does and provides context.
Multiple lines of rich documentation content.`;

		strictEqual(
			entity.description,
			expectedDescription,
			"Should have clean description without tags",
		);
		strictEqual(
			entity.description.includes("@function"),
			false,
			"Description should not contain @function",
		);
		strictEqual(
			entity.description.includes("@param"),
			false,
			"Description should not contain @param",
		);
		strictEqual(
			entity.description.includes("myFunction('hello')"),
			false,
			"Description should not contain @example content",
		);

		// Check JSDoc tags (excluding @function as it's not in TAG_REGISTRY)
		strictEqual(entity.jsdocTags.length, 3, "Should have 3 JSDoc tags");

		const paramTag = entity.jsdocTags.find((tag) => tag.tagType === "param");
		const returnsTag = entity.jsdocTags.find(
			(tag) => tag.tagType === "returns",
		);
		const exampleTag = entity.jsdocTags.find(
			(tag) => tag.tagType === "example",
		);

		strictEqual(paramTag !== undefined, true, "Should have param tag");
		strictEqual(returnsTag !== undefined, true, "Should have returns tag");
		strictEqual(exampleTag !== undefined, true, "Should have example tag");

		// Example tag should contain the example code
		strictEqual(
			exampleTag.rawContent.includes("myFunction('hello')"),
			true,
			"Example tag should contain example code",
		);
	});

	test("should validate entity property completeness and types", () => {
		const file = {
			path: "validation.js",
			text: `/**
 * Test function for property validation
 * @callback validateMe
 * @param {string} input - Test parameter
 */`,
		};

		const entities = parseModuleEntities({ files: [file] });
		strictEqual(entities.length, 1, "Should create one entity");

		const entity = entities[0];

		// Core property existence
		strictEqual(
			typeof entity.entityType,
			"string",
			"entityType should be string",
		);
		strictEqual(typeof entity.name, "string", "name should be string");
		strictEqual(
			typeof entity.description,
			"string",
			"description should be string",
		);
		strictEqual(
			Array.isArray(entity.jsdocTags),
			true,
			"jsdocTags should be array",
		);
		strictEqual(typeof entity.location, "object", "location should be object");
		strictEqual(entity.location !== null, true, "location should not be null");

		// Location property completeness
		strictEqual(
			typeof entity.location.file,
			"string",
			"location.file should be string",
		);
		strictEqual(
			typeof entity.location.line,
			"number",
			"location.line should be number",
		);
		strictEqual(
			typeof entity.location.column,
			"number",
			"location.column should be number",
		);

		// Property values validation
		strictEqual(
			entity.entityType,
			"callback",
			"Should have correct entityType",
		);
		strictEqual(entity.name, "validateMe", "Should have correct name");
		strictEqual(
			entity.location.file,
			"validation.js",
			"Should preserve file path",
		);
		strictEqual(
			entity.location.line > 0,
			true,
			"Line number should be positive",
		);
		strictEqual(
			entity.location.column > 0,
			true,
			"Column number should be positive",
		);
	});

	test("should handle JSDoc content quality and formatting preservation", () => {
		const file = {
			path: "formatting.js",
			text: `/**
 * Function with complex formatting and special characters.
 * Handles: áéíóú, 中文, emoji 🚀, and "quotes" & <symbols>.
 *
 * @callback complexFormatting
 * @param {Object} config - Configuration object with special chars: {"key": "value"}
 * @example
 * // Multi-line example with indentation
 * const result = complexFormatting({
 *   property: "value with spaces",
 *   number: 42,
 *   array: [1, 2, 3]
 * });
 *
 * console.log(result); // Expected output
 */`,
		};

		const entities = parseModuleEntities({ files: [file] });
		const entity = entities[0];

		// Description formatting preservation
		strictEqual(
			entity.description.includes("áéíóú, 中文, emoji 🚀"),
			true,
			"Should preserve Unicode characters",
		);
		strictEqual(
			entity.description.includes('"quotes" & <symbols>'),
			true,
			"Should preserve special characters",
		);

		// JSDoc tag content preservation
		const paramTag = entity.jsdocTags.find((tag) => tag.tagType === "param");
		const exampleTag = entity.jsdocTags.find(
			(tag) => tag.tagType === "example",
		);

		strictEqual(
			paramTag.rawContent.includes('{"key": "value"}'),
			true,
			"Should preserve JSON in param content",
		);
		strictEqual(
			exampleTag.rawContent.includes('property: "value with spaces"'),
			true,
			"Should preserve formatting in examples",
		);
		strictEqual(
			exampleTag.rawContent.includes("console.log(result);"),
			true,
			"Should preserve multi-line example content",
		);

		// Content should not include @ symbols from tag parsing
		strictEqual(
			entity.description.includes("@"),
			false,
			"Description should not contain @ symbols",
		);
		strictEqual(
			paramTag.rawContent.startsWith("@"),
			false,
			"Tag content should not start with @",
		);
	});

	test("should handle edge cases and malformed JSDoc", () => {
		const file = {
			path: "edge-cases.js",
			text: `/**
 *
 *
 * Empty description with whitespace only.
 *
 *
 * @callback emptyDescription
 * @param {} - Empty type parameter
 * @param {string} - Missing parameter name
 * @param {*} anything - Any type parameter
 * @returns
 * @example
 *
 * emptyDescription();
 *
 */

/**
 * @callback onlyTags
 * @param {string} input
 */

/**
 * Only description, no tags at all.
 * Multiple lines without any JSDoc tags.
 * @typedef InvalidTag
 */`,
		};

		const entities = parseModuleEntities({ files: [file] });
		strictEqual(entities.length, 3, "Should extract 3 entities");

		// First entity: empty description handling
		const firstEntity = entities[0];
		strictEqual(
			firstEntity.name,
			"emptyDescription",
			"Should extract correct name",
		);
		strictEqual(
			firstEntity.description.trim(),
			"Empty description with whitespace only.",
			"Should clean up whitespace in descriptions",
		);

		// Second entity: no description, only tags
		const secondEntity = entities[1];
		strictEqual(
			secondEntity.name,
			"onlyTags",
			"Should extract name from tags-only block",
		);
		strictEqual(
			secondEntity.description,
			"",
			"Should have empty description when no description provided",
		);
		strictEqual(
			secondEntity.jsdocTags.length > 0,
			true,
			"Should still extract tags when no description",
		);

		// Third entity: only description, invalid entity tag
		const thirdEntity = entities[2];
		strictEqual(
			thirdEntity.name,
			"InvalidTag",
			"Should extract name from typedef",
		);
		strictEqual(
			thirdEntity.description.includes("Only description, no tags at all"),
			true,
			"Should preserve description when entity tag is not in registry",
		);

		// Malformed parameter handling
		const paramTags = firstEntity.jsdocTags.filter(
			(tag) => tag.tagType === "param",
		);
		strictEqual(paramTags.length, 3, "Should handle malformed param tags");

		// Empty returns tag
		const returnsTag = firstEntity.jsdocTags.find(
			(tag) => tag.tagType === "returns",
		);
		strictEqual(returnsTag.rawContent, "", "Should handle empty returns tag");
	});

	test("should handle multiple entities with accurate line numbers", () => {
		const file = {
			path: "multi-entity.js",
			text: `// Line 1: Comment
// Line 2: Comment

/**
 * First entity description
 * @callback firstEntity
 */

// Line 9: Comment

/**
 * Second entity with longer description.
 * Spans multiple lines with details.
 * @callback secondEntity
 * @param {string} input - Parameter description
 */

// Line 18: Comment

/**
 * Third entity
 * @callback thirdEntity
 */`,
		};

		const entities = parseModuleEntities({ files: [file] });
		strictEqual(entities.length, 3, "Should extract 3 entities");

		// Line number accuracy testing
		strictEqual(
			entities[0].location.line,
			4,
			"First entity should start at line 4",
		);
		strictEqual(
			entities[1].location.line,
			11,
			"Second entity should start at line 11",
		);
		strictEqual(
			entities[2].location.line,
			20,
			"Third entity should start at line 20",
		);

		// Entity content validation
		strictEqual(entities[0].name, "firstEntity", "First entity name");
		strictEqual(entities[1].name, "secondEntity", "Second entity name");
		strictEqual(entities[2].name, "thirdEntity", "Third entity name");

		// Description length differences
		strictEqual(
			entities[0].description.length < entities[1].description.length,
			true,
			"Second entity should have longer description",
		);
		strictEqual(
			entities[1].jsdocTags.length > entities[0].jsdocTags.length,
			true,
			"Second entity should have more tags",
		);
	});

	test("should handle special entity names and extraction patterns", () => {
		const file = {
			path: "special-names.js",
			text: `/**
 * @callback $specialName
 */

/**
 * @callback _privateFunction
 */

/**
 * @callback kebab-case-name
 */

/**
 * @callback 123numeric
 */

/**
 * @callback
 */

/**
 * @callback with spaces in name
 */`,
		};

		const entities = parseModuleEntities({ files: [file] });
		strictEqual(entities.length, 6, "Should extract 6 entities");

		// Special character names
		strictEqual(entities[0].name, "$specialName", "Should handle $ in names");
		strictEqual(
			entities[1].name,
			"_privateFunction",
			"Should handle _ in names",
		);
		strictEqual(
			entities[2].name,
			"kebab-case-name",
			"Should handle hyphens in names",
		);
		strictEqual(
			entities[3].name,
			"123numeric",
			"Should handle numeric prefixes",
		);

		// Edge cases for name extraction
		strictEqual(
			entities[4].name,
			"anonymous",
			"Should default to 'anonymous' for missing names",
		);
		strictEqual(
			entities[5].name,
			"with",
			"Should extract first word when spaces in name",
		);

		// All entities should have valid structure despite name variations
		entities.forEach((entity, i) => {
			strictEqual(
				typeof entity.description,
				"string",
				`Entity ${i} should have string description`,
			);
			strictEqual(
				Array.isArray(entity.jsdocTags),
				true,
				`Entity ${i} should have jsdocTags array`,
			);
			strictEqual(
				entity.entityType,
				"callback",
				`Entity ${i} should have correct entityType`,
			);
		});
	});

	test("should validate tag content integrity and type safety", () => {
		const file = {
			path: "tag-integrity.js",
			text: `/**
 * Complex function with all supported tag types
 * @callback complexFunction
 * @param {string|number} input - Union type parameter
 * @param {Object} options - Options object
 * @param {string} options.name - Nested property
 * @returns {Promise<string>} Async return type
 * @throws {Error} When input is invalid
 * @throws {TypeError} When type mismatch occurs
 * @example
 * const result = await complexFunction("test", {name: "value"});
 * @example
 * // Second example
 * complexFunction(123, {name: "number"});
 * @see {@link https://example.com} External reference
 * @since 1.0.0
 * @deprecated Use newFunction instead
 */`,
		};

		const entities = parseModuleEntities({ files: [file] });
		const entity = entities[0];

		// Tag count and type validation
		const tagTypes = entity.jsdocTags.map((tag) => tag.tagType);

		strictEqual(
			entity.jsdocTags.length >= 8,
			true,
			"Should have multiple tags",
		);
		strictEqual(tagTypes.includes("param"), true, "Should include param tags");
		strictEqual(
			tagTypes.includes("returns"),
			true,
			"Should include returns tag",
		);
		strictEqual(
			tagTypes.includes("throws"),
			true,
			"Should include throws tags",
		);
		strictEqual(
			tagTypes.includes("example"),
			true,
			"Should include example tags",
		);

		// Multiple tags of same type handling
		const paramTags = entity.jsdocTags.filter((tag) => tag.tagType === "param");
		const throwsTags = entity.jsdocTags.filter(
			(tag) => tag.tagType === "throws",
		);
		const exampleTags = entity.jsdocTags.filter(
			(tag) => tag.tagType === "example",
		);

		strictEqual(paramTags.length, 3, "Should have 3 param tags");
		strictEqual(throwsTags.length, 2, "Should have 2 throws tags");
		strictEqual(exampleTags.length, 2, "Should have 2 example tags");

		// Content integrity for each tag type
		entity.jsdocTags.forEach((tag, i) => {
			strictEqual(
				typeof tag.tagType,
				"string",
				`Tag ${i} should have string tagType`,
			);
			strictEqual(
				typeof tag.rawContent,
				"string",
				`Tag ${i} should have string rawContent`,
			);
			strictEqual(
				tag.tagType.length > 0,
				true,
				`Tag ${i} should have non-empty tagType`,
			);

			// @ symbols are allowed in @see tags for {@link} syntax
			if (tag.tagType !== "see") {
				strictEqual(
					tag.rawContent.includes("@"),
					false,
					`Tag ${i} content should not contain @ (except @see tags)`,
				);
			}
		});

		// Complex type content preservation
		const unionParamTag = paramTags.find((tag) =>
			tag.rawContent.includes("string|number"),
		);
		strictEqual(
			unionParamTag !== undefined,
			true,
			"Should preserve union types in param tags",
		);

		const nestedParamTag = paramTags.find((tag) =>
			tag.rawContent.includes("options.name"),
		);
		strictEqual(
			nestedParamTag !== undefined,
			true,
			"Should preserve nested property documentation",
		);
	});

	test("should NOT extract non-exported entities", () => {
		const discoveryModule = {
			files: [
				{
					path: "internal.js",
					text: `/**
 * Internal function - should NOT be extracted
 * @param {string} input - Internal parameter
 * @returns {boolean} Internal result
 */
function internalFunction(input) {
	return input.length > 0;
}

/**
 * Internal class - should NOT be extracted
 * @class InternalClass
 */
class InternalClass {
	constructor() {
		this.internal = true;
	}
}

/**
 * Internal constant - should NOT be extracted
 * @const {string} INTERNAL_CONST
 */
const INTERNAL_CONST = "internal";

/**
 * Public function - SHOULD be extracted
 * @param {string} input - Public parameter
 * @returns {string} Public result
 */
export function publicFunction(input) {
	return input.toUpperCase();
}

/**
 * Public class - SHOULD be extracted
 * @class PublicClass
 */
export class PublicClass {
	constructor() {
		this.public = true;
	}
}

/**
 * Public constant - SHOULD be extracted
 * @const {string} PUBLIC_CONST
 */
export const PUBLIC_CONST = "public";`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		// Should only extract exported entities
		strictEqual(result.length, 3, "Should only extract exported entities");

		// Verify only exported entities are present
		const entityNames = result.map((entity) => entity.name).sort();
		const expectedNames = [
			"publicFunction",
			"PublicClass",
			"PUBLIC_CONST",
		].sort();

		deepStrictEqual(
			entityNames,
			expectedNames,
			"Should only contain exported entity names",
		);

		// Verify internal entities are NOT present
		const hasInternalFunction = result.some(
			(entity) => entity.name === "internalFunction",
		);
		const hasInternalClass = result.some(
			(entity) => entity.name === "InternalClass",
		);
		const hasInternalConst = result.some(
			(entity) => entity.name === "INTERNAL_CONST",
		);

		strictEqual(
			hasInternalFunction,
			false,
			"Should NOT extract internal function",
		);
		strictEqual(hasInternalClass, false, "Should NOT extract internal class");
		strictEqual(
			hasInternalConst,
			false,
			"Should NOT extract internal constant",
		);
	});

	test("should extract typedef names correctly", () => {
		const discoveryModule = {
			files: [
				{
					path: "typedefs.js",
					text: `/**
 * Simple string type
 * @typedef {string} StringType
 */

/**
 * Object type with properties
 * @typedef {Object} UserObject
 * @property {string} name - User name
 * @property {number} age - User age
 */

/**
 * Complex generic type
 * @typedef {Array<Map<string, number>>} ComplexType
 */

/**
 * Union type
 * @typedef {string|number|boolean} UnionType
 */

/**
 * Function type
 * @typedef {function(string, number): boolean} FunctionType
 */

/**
 * Simple typedef without braces
 * @typedef SimpleType
 */`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		// Should extract all typedef entities
		strictEqual(result.length, 6, "Should extract all typedef entities");

		// Verify correct names are extracted
		const entityNames = result.map((entity) => entity.name).sort();
		const expectedNames = [
			"StringType",
			"UserObject",
			"ComplexType",
			"UnionType",
			"FunctionType",
			"SimpleType",
		].sort();

		deepStrictEqual(
			entityNames,
			expectedNames,
			"Should extract correct typedef names",
		);

		// Verify all are typedef entities
		for (const entity of result) {
			strictEqual(
				entity.entityType,
				"typedef",
				"Should be typedef entity type",
			);
		}
	});

	test("should extract typedef names from complex formats", () => {
		const discoveryModule = {
			files: [
				{
					path: "seo/pinterest.js",
					text: `/**
 * Pinterest configuration object
 * @typedef {Object} PinterestConfig
 * @property {string} appId - Pinterest app ID
 * @property {string} apiKey - Pinterest API key
 */`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		// Should extract the typedef entity
		strictEqual(result.length, 1, "Should extract typedef entity");

		const entity = result[0];
		strictEqual(
			entity.name,
			"PinterestConfig",
			"Should extract correct typedef name",
		);
		strictEqual(entity.entityType, "typedef", "Should be typedef entity type");
		strictEqual(
			entity.location.file,
			"seo/pinterest.js",
			"Should preserve file path",
		);
		strictEqual(
			entity.location.line,
			1,
			"Should calculate correct line number",
		);
	});
});
