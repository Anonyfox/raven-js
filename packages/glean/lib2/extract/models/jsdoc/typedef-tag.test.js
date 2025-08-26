/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocTypedefTag } from "./typedef-tag.js";

describe("JSDocTypedefTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocTypedefTag("test");
		assert.strictEqual(tag.tagType, "typedef");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle basic type with name", () => {
		const testCases = [
			["{Object} MyType", "Object", "MyType", ""],
			["{Function} Callback", "Function", "Callback", ""],
			["{string} UserId", "string", "UserId", ""],
			["{number} Count", "number", "Count", ""],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle type with name and description", () => {
		const testCases = [
			[
				"{Object} User User object definition",
				"Object",
				"User",
				"User object definition",
			],
			[
				"{Function} Callback Function callback type",
				"Function",
				"Callback",
				"Function callback type",
			],
			[
				"{Array<string>} StringList List of strings",
				"Array<string>",
				"StringList",
				"List of strings",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle complex nested types", () => {
		const testCases = [
			[
				"{Record<string, number>} ScoreMap",
				"Record<string, number>",
				"ScoreMap",
				"",
			],
			[
				"{Promise<Array<User>>} UserListPromise",
				"Promise<Array<User>>",
				"UserListPromise",
				"",
			],
			["{Map<K, V>} GenericMap", "Map<K, V>", "GenericMap", ""],
			[
				"{Object<string, Array<{id: number, name: string}>>} ComplexData",
				"Object<string, Array<{id: number, name: string}>>",
				"ComplexData",
				"",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle function type definitions", () => {
		const testCases = [
			["{Function} EventHandler", "Function", "EventHandler", ""],
			[
				"{(x: number) => string} Transform",
				"(x: number) => string",
				"Transform",
				"",
			],
			[
				"{(...args: any[]) => Promise<void>} AsyncHandler",
				"(...args: any[]) => Promise<void>",
				"AsyncHandler",
				"",
			],
			[
				"{(a: string, b: number) => boolean} Validator",
				"(a: string, b: number) => boolean",
				"Validator",
				"",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle union and intersection types", () => {
		const testCases = [
			["{string | number} Value", "string | number", "Value", ""],
			[
				"{User & {role: string}} UserWithRole",
				"User & {role: string}",
				"UserWithRole",
				"",
			],
			[
				"{(string | number) & Serializable} SerializableValue",
				"(string | number) & Serializable",
				"SerializableValue",
				"",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle name only (no type)", () => {
		const testCases = [
			["MyType", "", "MyType", ""],
			["Callback", "", "Callback", ""],
			["UserData", "", "UserData", ""],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle name with description (no type)", () => {
		const testCases = [
			["MyType Custom type definition", "", "MyType", "Custom type definition"],
			["Callback Function callback", "", "Callback", "Function callback"],
			["UserData User data structure", "", "UserData", "User data structure"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle malformed braces", () => {
		const testCases = [
			["{incomplete MyType", "", "{incomplete", "MyType"],
			["incomplete} MyType", "", "incomplete}", "MyType"],
			["{nested{braces} MyType", "", "{nested{braces}", "MyType"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty braces", () => {
		const testCases = [
			["{} MyType", "", "MyType", ""],
			["{   } MyType Custom type", "", "MyType", "Custom type"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle special characters in names", () => {
		const testCases = [
			["{Object} $MyType", "Object", "$MyType", ""],
			["{Function} _PrivateCallback", "Function", "_PrivateCallback", ""],
			["{string} MyType2", "string", "MyType2", ""],
			["{Array} my-type", "Array", "my-type", ""],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle trimming whitespace", () => {
		const testCases = [
			["  {Object}  MyType  ", "Object", "MyType", ""],
			// Tab characters don't split - only space character does
			[
				"\t{Function}\tCallback\tDescription\t",
				"Function",
				"Callback\tDescription",
				"",
			],
			[
				"\n{string} UserId User identifier\n",
				"string",
				"UserId",
				"User identifier",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["{Object} 类型", "Object", "类型", ""],
			["{Function} Тип", "Function", "Тип", ""],
			["{string} MyType 类型描述", "string", "MyType", "类型描述"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle generic types with constraints", () => {
		const testCases = [
			["{T extends string} GenericType", "T extends string", "GenericType", ""],
			["{K extends keyof T} KeyType", "K extends keyof T", "KeyType", ""],
			[
				"{V extends Record<string, any>} ValueType",
				"V extends Record<string, any>",
				"ValueType",
				"",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle optional and nullable types", () => {
		const testCases = [
			["{?string} NullableString", "?string", "NullableString", ""],
			["{!string} NonNullString", "!string", "NonNullString", ""],
			["{string=} OptionalString", "string=", "OptionalString", ""],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle array notation", () => {
		const testCases = [
			["{string[]} StringArray", "string[]", "StringArray", ""],
			["{Object[]} ObjectArray", "Object[]", "ObjectArray", ""],
			["{Array<number>} NumberList", "Array<number>", "NumberList", ""],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle long descriptions with special characters", () => {
		const testCases = [
			[
				"{Object} User User object containing name, email & preferences",
				"Object",
				"User",
				"User object containing name, email & preferences",
			],
			[
				"{Function} Handler Event handler (callback function)",
				"Function",
				"Handler",
				"Event handler (callback function)",
			],
			[
				"{Array<string>} Tags List of tags: #tag1, #tag2, etc.",
				"Array<string>",
				"Tags",
				"List of tags: #tag1, #tag2, etc.",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle deeply nested object types", () => {
		const testCases = [
			[
				"{Object<string, {config: {host: string, port: number}}>} Settings",
				"Object<string, {config: {host: string, port: number}}>",
				"Settings",
				"",
			],
			[
				"{Record<string, Array<{id: number, data: {name: string, value: any}}>>} ComplexType",
				"Record<string, Array<{id: number, data: {name: string, value: any}}>>",
				"ComplexType",
				"",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should validate correctly based on name content", () => {
		const validCases = [
			"{Object} MyType",
			"TypeName Description",
			"{Function} Callback",
			"SimpleName",
			" \t TypeName \t ", // Whitespace around name
		];

		const invalidCases = ["", "   ", "\t", "\n"];

		validCases.forEach((input) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocTypedefTag(input);
			assert.strictEqual(
				tag.isValidated,
				false,
				`Should be invalid: "${input}"`,
			);
		});
	});
});
