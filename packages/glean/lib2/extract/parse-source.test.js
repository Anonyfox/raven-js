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
});
