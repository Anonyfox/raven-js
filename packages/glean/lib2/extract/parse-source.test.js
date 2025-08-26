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
function testFunc(input) { return true; }`,
				},
				{
					path: "class.js",
					text: `/**
 * @class TestClass
 * @param {string} name - Class name
 */
class TestClass {
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
function someFunction() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should handle JSDoc without entity tags");
	});

	test("should extract multiple entities from single file", () => {
		const discoveryModule = {
			files: [
				{
					path: "multi.js",
					text: `/**
 * @function first
 */
function first() {}

/**
 * @class Second
 */
class Second {}

/**
 * @typedef ThirdType
 */`,
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
function broken() {}

/** @function validFunc */
function validFunc() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);

		strictEqual(
			result.length,
			0,
			"Should not extract from malformed JSDoc (no complete blocks)",
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
function testLocation() {}`,
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
function richFunc(input, count) {}`,
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
function complexFunc() {}`,
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
function anonymousFunc() {}`,
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
function someFunc() {}`,
				},
			],
		};

		const result = parseModuleEntities(discoveryModule);
		deepStrictEqual(result, [], "Should ignore unsupported entity types");
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
});
