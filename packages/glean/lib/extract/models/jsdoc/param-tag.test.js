/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocParamTag } from "./param-tag.js";

describe("JSDocParamTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocParamTag("test");
		assert.strictEqual(tag.tagType, "param");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle type, name and description", () => {
		const testCases = [
			["{string} name User name", "string", "name", "User name", false, ""],
			["{number} age User age", "number", "age", "User age", false, ""],
			[
				"{Object} config Configuration object",
				"Object",
				"config",
				"Configuration object",
				false,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle optional parameters", () => {
		const testCases = [
			[
				"{string} [name] Optional name",
				"string",
				"name",
				"Optional name",
				true,
				"",
			],
			[
				"{number} [age] Optional age",
				"number",
				"age",
				"Optional age",
				true,
				"",
			],
			[
				"{boolean} [flag] Optional flag",
				"boolean",
				"flag",
				"Optional flag",
				true,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle parameters with default values", () => {
		const testCases = [
			[
				"{string} [name=John] Name with default",
				"string",
				"name",
				"Name with default",
				true,
				"John",
			],
			[
				"{number} [age=25] Age with default",
				"number",
				"age",
				"Age with default",
				true,
				"25",
			],
			[
				"{boolean} [flag=true] Flag with default",
				"boolean",
				"flag",
				"Flag with default",
				true,
				"true",
			],
			[
				"{Object} [config={}] Config with default",
				"Object",
				"config",
				"Config with default",
				true,
				"{}",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle type only", () => {
		const testCases = [
			["{string} name", "string", "name", "", false, ""],
			["{number} age", "number", "age", "", false, ""],
			["{boolean} flag", "boolean", "flag", "", false, ""],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle name only (no type)", () => {
		const testCases = [
			["name User name", "", "name", "User name", false, ""],
			["age User age", "", "age", "User age", false, ""],
			[
				"config Configuration object",
				"",
				"config",
				"Configuration object",
				false,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle complex types", () => {
		const testCases = [
			[
				"{Array<string>} names List of names",
				"Array<string>",
				"names",
				"List of names",
				false,
				"",
			],
			[
				"{Promise<User>} user User promise",
				"Promise<User>",
				"user",
				"User promise",
				false,
				"",
			],
			[
				"{Record<string, number>} map String to number map",
				"Record<string, number>",
				"map",
				"String to number map",
				false,
				"",
			],
			[
				"{string | number} value Union type value",
				"string | number",
				"value",
				"Union type value",
				false,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle special characters in names", () => {
		const testCases = [
			// $ is not a word character, so it doesn't match \w+ regex
			[
				"{string} $element jQuery element",
				"string",
				"",
				"$element jQuery element",
				false,
				"",
			],
			[
				"{Object} _private Private object",
				"Object",
				"_private",
				"Private object",
				false,
				"",
			],
			[
				"{number} value2 Second value",
				"number",
				"value2",
				"Second value",
				false,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, expectedName.length > 0);
			},
		);
	});

	it("should handle complex default values", () => {
		const testCases = [
			[
				"{Object} [config={a: 1, b: 2}] Object default",
				"Object",
				"config",
				"Object default",
				true,
				"{a: 1, b: 2}",
			],
			// Regex stops at first ] - remaining content goes to description
			[
				"{Array} [items=[1, 2, 3]] Array default",
				"Array",
				"items",
				"] Array default",
				true,
				"[1, 2, 3",
			],
			[
				"{Function} [callback=() => {}] Function default",
				"Function",
				"callback",
				"Function default",
				true,
				"() => {}",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocParamTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.optional, false);
			assert.strictEqual(tag.defaultValue, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocParamTag(input);
			assert.strictEqual(tag.type, "");
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.optional, false);
			assert.strictEqual(tag.defaultValue, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle malformed syntax", () => {
		const testCases = [
			[
				"{incomplete name Description",
				"",
				"",
				"{incomplete name Description",
				false,
				"",
			],
			[
				"[unclosed name Description",
				"",
				"",
				"[unclosed name Description",
				false,
				"",
			],
			// [name= doesn't match bracketed pattern (no closing ]), treated as regular name
			[
				"{type} [name= Description",
				"type",
				"",
				"[name= Description",
				false,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				// Valid if has name, otherwise invalid
				assert.strictEqual(tag.isValidated, expectedName.length > 0);
			},
		);
	});

	it("should trim whitespace", () => {
		const testCases = [
			[
				"  {string}  name  Description  ",
				"string",
				"name",
				"Description",
				false,
				"",
			],
			["\t{number}\t[age=25]\tAge\t", "number", "age", "Age", true, "25"],
			// \n in the middle causes the regex to not match properly, description becomes empty
			["\n{boolean} flag Value\n", "", "", "", false, ""],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, expectedName.length > 0);
			},
		);
	});

	it("should handle Unicode content", () => {
		const testCases = [
			// Unicode characters don't match \w+ regex
			[
				"{string} 名前 User name in Japanese",
				"string",
				"",
				"名前 User name in Japanese",
				false,
				"",
			],
			[
				"{number} возраст User age in Russian",
				"number",
				"",
				"возраст User age in Russian",
				false,
				"",
			],
			[
				"{boolean} [标志=true] Flag in Chinese",
				"boolean",
				"标志",
				"Flag in Chinese",
				true,
				"true",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, expectedName.length > 0);
			},
		);
	});

	it("should handle destructuring parameters", () => {
		const testCases = [
			// Dots don't match \w+ so only captures 'options', rest goes to description
			[
				"{Object} options.name Name from options",
				"Object",
				"options",
				".name Name from options",
				false,
				"",
			],
			["{string} user.id User ID", "string", "user", ".id User ID", false, ""],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle function types", () => {
		const testCases = [
			[
				"{Function} callback Callback function",
				"Function",
				"callback",
				"Callback function",
				false,
				"",
			],
			[
				"{(x: number) => string} transform Transform function",
				"(x: number) => string",
				"transform",
				"Transform function",
				false,
				"",
			],
			[
				"{(...args: any[]) => void} handler Event handler",
				"(...args: any[]) => void",
				"handler",
				"Event handler",
				false,
				"",
			],
		];

		testCases.forEach(
			([
				input,
				expectedType,
				expectedName,
				expectedDesc,
				expectedOpt,
				expectedDefault,
			]) => {
				const tag = new JSDocParamTag(input);
				assert.strictEqual(tag.type, expectedType);
				assert.strictEqual(tag.name, expectedName);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.optional, expectedOpt);
				assert.strictEqual(tag.defaultValue, expectedDefault);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should validate correctly based on name content", () => {
		const validCases = [
			"{string} name",
			"param Description",
			"{type} [optional]",
			"{type} [name=default]",
			" \t name \t ", // Whitespace around name
		];

		const invalidCases = [
			"",
			"   ",
			"{type}",
			// "Description only" actually captures "Description" as name since it's a word
		];

		validCases.forEach((input) => {
			const tag = new JSDocParamTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocParamTag(input);
			assert.strictEqual(
				tag.isValidated,
				false,
				`Should be invalid: "${input}"`,
			);
		});
	});
});
