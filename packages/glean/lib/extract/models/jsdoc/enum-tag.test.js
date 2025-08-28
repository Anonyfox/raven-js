/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocEnumTag } from "./enum-tag.js";

describe("JSDocEnumTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocEnumTag("test");
		assert.strictEqual(tag.tagType, "enum");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle type only", () => {
		const testCases = [
			["{string}", "string", ""],
			["{number}", "number", ""],
			["{Array<string>}", "Array<string>", ""],
			["{Object|null}", "Object|null", ""],
			["{Map<K, V>}", "Map<K, V>", ""],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle description only", () => {
		const testCases = [
			["Available colors", "", "Available colors"],
			["Status values for API", "", "Status values for API"],
			["Configuration options", "", "Configuration options"],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle type with description", () => {
		const testCases = [
			["{string} Available colors", "string", "Available colors"],
			["{number} Status codes", "number", "Status codes"],
			["{Array<string>} List of options", "Array<string>", "List of options"],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should trim whitespace", () => {
		const testCases = [
			["  {string}  ", "string", ""],
			["  {number}  Available options  ", "number", "Available options"],
			["\t{boolean}\tFlag values\t", "boolean", "Flag values"],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle invalid braces", () => {
		const testCases = [
			["{incomplete", "", "{incomplete"],
			["incomplete}", "", "incomplete}"],
			["{nested{braces}}", "nested{braces", "}"], // regex stops at first }
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty braces", () => {
		const testCases = [
			["{}", "", "{}"], // No match, treated as description
			["{} Description", "", "{} Description"], // No match, treated as description
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			// Valid if description has content
			assert.strictEqual(tag.isValidated, expectedDesc.length > 0);
		});
	});

	it("should handle multiline descriptions", () => {
		const input = "{string} Available colors\nfor the application";
		const tag = new JSDocEnumTag(input);
		
		// Regex with $ anchor doesn't match multiline - falls back to description only
		assert.strictEqual(tag.type, "");
		assert.strictEqual(tag.description, input);
		assert.strictEqual(tag.isValidated, true);
	});

	it("should handle special characters in types", () => {
		const testCases = [
			["{Record<string, number>}", "Record<string, number>", ""],
			["{Array<T>}", "Array<T>", ""],
			["{string | number}", "string | number", ""],
			["{Object[]}", "Object[]", ""],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["{string} 状态值 - Status values", "string", "状态值 - Status values"],
			["配置选项", "", "配置选项"],
			["{Map<K, V>} Μόνιμη συλλογή", "Map<K, V>", "Μόνιμη συλλογή"],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle complex nested types", () => {
		const testCases = [
			["{Promise<Array<T>>}", "Promise<Array<T>>", ""],
			["{Record<string, Array<number>>}", "Record<string, Array<number>>", ""],
			["{(a: string) => boolean}", "(a: string) => boolean", ""],
		];

		testCases.forEach(([input, expectedType, expectedDesc]) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should validate correctly based on content", () => {
		const validCases = [
			"{string}",
			"Description only",
			"{number} With description",
			"{} Description after empty braces",
		];

		const invalidCases = [
			"",
			"   ",
		];

		validCases.forEach((input) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocEnumTag(input);
			assert.strictEqual(tag.isValidated, false, `Should be invalid: "${input}"`);
		});
	});
});
