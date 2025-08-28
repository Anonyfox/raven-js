/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocTypeTag } from "./type-tag.js";

describe("JSDocTypeTag core functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocTypeTag("{string}");

		strictEqual(tag.getType(), "type");
		strictEqual(tag.getRawContent(), "{string}");
		strictEqual(tag.isValid(), true);
	});

	test("should extract simple types", () => {
		const types = ["string", "number", "boolean", "Object", "Array"];

		types.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			strictEqual(tag.type, type);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should extract complex types", () => {
		const complexTypes = [
			"Array<string>",
			"Promise<Object>",
			"Map<string, number>",
			"function(string): boolean",
			"Object.<string, *>",
		];

		complexTypes.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			strictEqual(tag.type, type);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle empty content", () => {
		const tag = new JSDocTypeTag("");

		strictEqual(tag.type, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle undefined/null content", () => {
		const undefinedTag = new JSDocTypeTag(undefined);
		const nullTag = new JSDocTypeTag(null);

		strictEqual(undefinedTag.type, "");
		strictEqual(undefinedTag.isValidated, false);

		strictEqual(nullTag.type, "");
		strictEqual(nullTag.isValidated, false);
	});
});

describe("JSDocTypeTag brace parsing", () => {
	test("should extract from properly formatted braces", () => {
		const tag = new JSDocTypeTag("{string}");

		strictEqual(tag.type, "string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle whitespace inside braces", () => {
		const tag = new JSDocTypeTag("{  string  }");

		strictEqual(tag.type, "string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle whitespace outside braces", () => {
		const tag = new JSDocTypeTag("  {string}  ");

		strictEqual(tag.type, "string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty braces", () => {
		const tag = new JSDocTypeTag("{}");

		// Empty braces don't match regex, so uses raw content
		strictEqual(tag.type, "{}");
		strictEqual(tag.isValidated, true);
	});

	test("should handle whitespace-only braces", () => {
		const tag = new JSDocTypeTag("{   }");

		strictEqual(tag.type, "");
		strictEqual(tag.isValidated, false);
	});

	test("should accept content without braces", () => {
		const tag = new JSDocTypeTag("string");

		// Content without braces uses raw content
		strictEqual(tag.type, "string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle malformed braces as raw content", () => {
		const malformed = [
			{ input: "{string", expected: "{string" },
			{ input: "string}", expected: "string}" },
			{ input: "string} {", expected: "string} {" },
			{ input: "{string} extra", expected: "{string} extra" },
		];

		malformed.forEach(({ input, expected }) => {
			const tag = new JSDocTypeTag(input);
			strictEqual(tag.type, expected, `Failed for: ${input}`);
			strictEqual(tag.isValidated, true);
		});
	});
});

describe("JSDocTypeTag complex type scenarios", () => {
	test("should handle union types", () => {
		const tag = new JSDocTypeTag("{string | number}");

		strictEqual(tag.type, "string | number");
		strictEqual(tag.isValidated, true);
	});

	test("should handle intersection types", () => {
		const tag = new JSDocTypeTag("{A & B}");

		strictEqual(tag.type, "A & B");
		strictEqual(tag.isValidated, true);
	});

	test("should handle generic types", () => {
		const generics = [
			"Array<T>",
			"Promise<Array<string>>",
			"Map<K, V>",
			"Record<string, unknown>",
		];

		generics.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			strictEqual(tag.type, type);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle function types", () => {
		const functions = [
			"function()",
			"function(string): boolean",
			"function(a: string, b: number): void",
			"(x: number) => string",
		];

		functions.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			strictEqual(tag.type, type);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle object types", () => {
		const objects = [
			"Object",
			"Object<string, any>",
			"Object.<string, number>",
			"{x: number, y: string}",
		];

		objects.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			// Types with nested braces fall back to raw content
			const expected = type.includes("{") ? `{${type}}` : type;
			strictEqual(tag.type, expected);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle nested generics", () => {
		const tag = new JSDocTypeTag("{Promise<Array<Map<string, Object>>>}");

		strictEqual(tag.type, "Promise<Array<Map<string, Object>>>");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocTypeTag special characters and syntax", () => {
	test("should handle optional types", () => {
		const tag = new JSDocTypeTag("{string=}");

		strictEqual(tag.type, "string=");
		strictEqual(tag.isValidated, true);
	});

	test("should handle nullable types", () => {
		const tag = new JSDocTypeTag("{?string}");

		strictEqual(tag.type, "?string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle non-nullable types", () => {
		const tag = new JSDocTypeTag("{!string}");

		strictEqual(tag.type, "!string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle rest parameters", () => {
		const tag = new JSDocTypeTag("{...string}");

		strictEqual(tag.type, "...string");
		strictEqual(tag.isValidated, true);
	});

	test("should handle wildcard types", () => {
		const tag = new JSDocTypeTag("{*}");

		strictEqual(tag.type, "*");
		strictEqual(tag.isValidated, true);
	});

	test("should handle literal types", () => {
		const literals = ["'hello'", '"world"', "42", "true", "false"];

		literals.forEach((literal) => {
			const tag = new JSDocTypeTag(`{${literal}}`);
			strictEqual(tag.type, literal);
			strictEqual(tag.isValidated, true);
		});
	});
});

describe("JSDocTypeTag edge cases", () => {
	test("should handle very long type names", () => {
		const longType = `${"Very".repeat(100)}LongTypeName`;
		const tag = new JSDocTypeTag(`{${longType}}`);

		strictEqual(tag.type, longType);
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode in type names", () => {
		const tag = new JSDocTypeTag("{Configuración}");

		strictEqual(tag.type, "Configuración");
		strictEqual(tag.isValidated, true);
	});

	test("should handle single character types", () => {
		const tag = new JSDocTypeTag("{T}");

		strictEqual(tag.type, "T");
		strictEqual(tag.isValidated, true);
	});

	test("should handle numeric types", () => {
		const tag = new JSDocTypeTag("{42}");

		strictEqual(tag.type, "42");
		strictEqual(tag.isValidated, true);
	});

	test("should handle types with special symbols", () => {
		const specialTypes = ["$", "@", "#", "%", "^", "&"];

		specialTypes.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			strictEqual(tag.type, type);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle types with spaces", () => {
		const tag = new JSDocTypeTag("{string | number | boolean}");

		strictEqual(tag.type, "string | number | boolean");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocTypeTag validation", () => {
	test("should validate when type exists", () => {
		const tag = new JSDocTypeTag("{string}");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate empty braces as raw content", () => {
		const tag = new JSDocTypeTag("{}");

		// Empty braces become raw content "{}", which is non-empty
		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should not validate whitespace-only type", () => {
		const tag = new JSDocTypeTag("{   }");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});

	test("should validate content without braces", () => {
		const noBraces = ["string", "number", "Array<string>", "function()"];

		noBraces.forEach((content) => {
			const tag = new JSDocTypeTag(content);
			strictEqual(tag.isValidated, true, `Failed for: ${content}`);
			strictEqual(tag.isValid(), true);
		});
	});

	test("should not validate empty content", () => {
		const emptyTags = ["", "   ", undefined, null];

		emptyTags.forEach((content) => {
			const tag = new JSDocTypeTag(content);
			strictEqual(tag.isValidated, false);
			strictEqual(tag.isValid(), false);
		});
	});
});

describe("JSDocTypeTag real-world scenarios", () => {
	test("should handle TypeScript-like types", () => {
		const tsTypes = [
			{
				input: "{Array<{id: string, name: string}>}",
				expected: "{Array<{id: string, name: string}>}",
			},
			{ input: "{Promise<Response>}", expected: "Promise<Response>" },
			{
				input: "{Record<string, unknown>}",
				expected: "Record<string, unknown>",
			},
			{ input: "{Partial<User>}", expected: "Partial<User>" },
			{ input: "{Required<Config>}", expected: "Required<Config>" },
		];

		tsTypes.forEach(({ input, expected }) => {
			const tag = new JSDocTypeTag(input);
			strictEqual(tag.type, expected);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle JSDoc-specific syntax", () => {
		const jsdocTypes = [
			"Object.<string, number>",
			"Array.<string>",
			"function(this:MyClass, string): boolean",
			"module:myModule.MyClass",
		];

		jsdocTypes.forEach((type) => {
			const tag = new JSDocTypeTag(`{${type}}`);
			strictEqual(tag.type, type);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle mixed syntax types", () => {
		const tag = new JSDocTypeTag(
			"{Array<{key: string, value: number | string}>}",
		);

		// Contains nested braces, so doesn't match regex, uses raw content
		strictEqual(tag.type, "{Array<{key: string, value: number | string}>}");
		strictEqual(tag.isValidated, true);
	});
});
