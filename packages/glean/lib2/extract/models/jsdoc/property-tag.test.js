/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocPropertyTag } from "./property-tag.js";

describe("JSDocPropertyTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocPropertyTag("test");
		assert.strictEqual(tag.tagType, "property");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle type, name and description", () => {
		const testCases = [
			["{string} name User name", "string", "name", "User name"],
			["{number} age User age", "number", "age", "User age"],
			[
				"{boolean} active Whether user is active",
				"boolean",
				"active",
				"Whether user is active",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle complex nested types", () => {
		const testCases = [
			[
				"{Array<string>} items List of items",
				"Array<string>",
				"items",
				"List of items",
			],
			[
				"{Record<string, number>} scores User scores",
				"Record<string, number>",
				"scores",
				"User scores",
			],
			[
				"{Promise<User>} user User promise",
				"Promise<User>",
				"user",
				"User promise",
			],
			["{Map<K, V>} cache Cache map", "Map<K, V>", "cache", "Cache map"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle deeply nested types with multiple braces", () => {
		const testCases = [
			[
				"{Object<string, Array<{id: number, name: string}>>} data Complex data",
				"Object<string, Array<{id: number, name: string}>>",
				"data",
				"Complex data",
			],
			[
				"{Record<string, {config: {host: string, port: number}}>} settings Nested settings",
				"Record<string, {config: {host: string, port: number}}>",
				"settings",
				"Nested settings",
			],
			[
				"{Function<{params: Array<string>}, Promise<{result: boolean}>>} handler Function handler",
				"Function<{params: Array<string>}, Promise<{result: boolean}>>",
				"handler",
				"Function handler",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle union and intersection types", () => {
		const testCases = [
			[
				"{string | number} value Union type value",
				"string | number",
				"value",
				"Union type value",
			],
			[
				"{User & {role: string}} user User with role",
				"User & {role: string}",
				"user",
				"User with role",
			],
			[
				"{(string | number) & Serializable} data Serializable data",
				"(string | number) & Serializable",
				"data",
				"Serializable data",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle function types", () => {
		const testCases = [
			[
				"{Function} callback Callback function",
				"Function",
				"callback",
				"Callback function",
			],
			[
				"{(x: number) => string} transform Transform function",
				"(x: number) => string",
				"transform",
				"Transform function",
			],
			[
				"{(...args: any[]) => Promise<void>} handler Event handler",
				"(...args: any[]) => Promise<void>",
				"handler",
				"Event handler",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle name only (no type)", () => {
		const testCases = [
			["name User name", "", "name", "User name"],
			["age User age", "", "age", "User age"],
			["active Status flag", "", "active", "Status flag"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle name only (no description)", () => {
		const testCases = [
			["{string} name", "string", "name", ""],
			["{number} age", "number", "age", ""],
			["property", "", "property", ""],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle malformed braces", () => {
		const testCases = [
			[
				"{incomplete property description",
				"",
				"",
				"{incomplete property description",
			],
			["property} invalid brace", "", "property", "} invalid brace"],
			[
				"{nested{braces property description",
				"",
				"",
				"{nested{braces property description",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, expectedName.length > 0);
		});
	});

	it("should handle empty braces", () => {
		const testCases = [
			["{} property Empty type", "", "property", "Empty type"],
			["{   } name Whitespace type", "", "name", "Whitespace type"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle special characters in names", () => {
		const testCases = [
			// Only word characters match \w+ regex
			[
				"{string} $element jQuery element",
				"string",
				"",
				"$element jQuery element",
			],
			[
				"{Object} _private Private property",
				"Object",
				"_private",
				"Private property",
			],
			["{number} value2 Second value", "number", "value2", "Second value"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, expectedName.length > 0);
		});
	});

	it("should trim whitespace", () => {
		const testCases = [
			["  {string}  name  Description  ", "string", "name", "Description"],
			["\t{number}\tage\tUser age\t", "number", "age", "User age"],
			["\n{boolean} active Active flag\n", "boolean", "active", "Active flag"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			// Unicode characters don't match \w+ regex
			["{string} 名前 Name in Japanese", "string", "", "名前 Name in Japanese"],
			[
				"{number} возраст Age in Russian",
				"number",
				"",
				"возраст Age in Russian",
			],
			[
				"{boolean} _flag Flag with underscore",
				"boolean",
				"_flag",
				"Flag with underscore",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, expectedName.length > 0);
		});
	});

	it("should handle property paths", () => {
		const testCases = [
			// Dots don't match \w+ so only captures first part
			[
				"{Object} config.host Configuration host",
				"Object",
				"config",
				".host Configuration host",
			],
			[
				"{string} user.profile.name User name",
				"string",
				"user",
				".profile.name User name",
			],
			[
				"{number} settings.port.number Port number",
				"number",
				"settings",
				".port.number Port number",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle array notation", () => {
		const testCases = [
			[
				"{Array<string>} items[] Array of items",
				"Array<string>",
				"items",
				"[] Array of items",
			],
			[
				"{Object[]} users Array of users",
				"Object[]",
				"users",
				"Array of users",
			],
			["{number[]} scores Score array", "number[]", "scores", "Score array"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle optional and nullable types", () => {
		const testCases = [
			["{?string} name Nullable name", "?string", "name", "Nullable name"],
			["{!string} name Non-null name", "!string", "name", "Non-null name"],
			["{string=} name Optional name", "string=", "name", "Optional name"],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle generic constraints", () => {
		const testCases = [
			[
				"{T extends string} value Generic value",
				"T extends string",
				"value",
				"Generic value",
			],
			[
				"{K extends keyof T} key Object key",
				"K extends keyof T",
				"key",
				"Object key",
			],
			[
				"{V extends Record<string, any>} data Generic data",
				"V extends Record<string, any>",
				"data",
				"Generic data",
			],
		];

		testCases.forEach(([input, expectedType, expectedName, expectedDesc]) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.type, expectedType);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should validate correctly based on name content", () => {
		const validCases = [
			"{string} name",
			"property Description",
			"{type} value",
			" \t name \t ", // Whitespace around name
		];

		const invalidCases = [
			"",
			"   ",
			"{type}",
			// "Description only with no name matching \\w+" actually captures "Description" as name
			"{string} $invalid", // $ doesn't match \w+
		];

		validCases.forEach((input) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocPropertyTag(input);
			assert.strictEqual(
				tag.isValidated,
				false,
				`Should be invalid: "${input}"`,
			);
		});
	});
});
