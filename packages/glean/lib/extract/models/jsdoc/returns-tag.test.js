/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocReturnsTag - 100% coverage validation.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocReturnsTag } from "./returns-tag.js";

describe("JSDocReturnsTag construction and inheritance", () => {
	test("should inherit from JSDocTagBase correctly", () => {
		const tag = new JSDocReturnsTag("{string} The result");

		strictEqual(tag.tagType, "returns");
		strictEqual(tag.rawContent, "{string} The result");
		strictEqual(tag.isValid(), true);
	});

	test("should handle empty rawContent", () => {
		const tag = new JSDocReturnsTag("");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle undefined rawContent", () => {
		const tag = new JSDocReturnsTag(undefined);

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle null rawContent", () => {
		const tag = new JSDocReturnsTag(null);

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle whitespace-only rawContent", () => {
		const tag = new JSDocReturnsTag("   \t\n  ");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocReturnsTag type-only parsing", () => {
	test("should parse simple type only", () => {
		const tag = new JSDocReturnsTag("{string}");

		strictEqual(tag.type, "string");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should parse complex types", () => {
		const complexTypes = [
			"Array<string>",
			"Promise<Object>",
			"Map<string, number>",
			"function(string): boolean",
			"Object.<string, *>",
		];

		complexTypes.forEach((complexType) => {
			const tag = new JSDocReturnsTag(`{${complexType}}`);
			strictEqual(tag.type, complexType);
			strictEqual(tag.description, "");
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle types with spaces", () => {
		const tag = new JSDocReturnsTag("{ string | number }");

		strictEqual(tag.type, "string | number");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty braces", () => {
		const tag = new JSDocReturnsTag("{}");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle whitespace in braces", () => {
		const tag = new JSDocReturnsTag("{   }");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocReturnsTag description-only parsing", () => {
	test("should parse description only", () => {
		const tag = new JSDocReturnsTag("The computed result");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "The computed result");
		strictEqual(tag.isValidated, true);
	});

	test("should handle long descriptions", () => {
		const longDesc =
			"A very long description that explains exactly what this function returns and why it's important for the application flow";
		const tag = new JSDocReturnsTag(longDesc);

		strictEqual(tag.type, "");
		strictEqual(tag.description, longDesc);
		strictEqual(tag.isValidated, true);
	});

	test("should handle descriptions with special characters", () => {
		const tag = new JSDocReturnsTag("Result with symbols: @#$%^&*()");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "Result with symbols: @#$%^&*()");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiline descriptions", () => {
		const tag = new JSDocReturnsTag(
			"First line of description\nSecond line with details",
		);

		// Regex doesn't match multiline content due to $ anchor, so no match
		strictEqual(tag.type, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocReturnsTag type and description parsing", () => {
	test("should parse type and description", () => {
		const tag = new JSDocReturnsTag("{string} The processed text");

		strictEqual(tag.type, "string");
		strictEqual(tag.description, "The processed text");
		strictEqual(tag.isValidated, true);
	});

	test("should handle complex type with description", () => {
		const tag = new JSDocReturnsTag(
			"{Promise<Array<Object>>} Resolves to array of user objects",
		);

		strictEqual(tag.type, "Promise<Array<Object>>");
		strictEqual(tag.description, "Resolves to array of user objects");
		strictEqual(tag.isValidated, true);
	});

	test("should trim whitespace around type and description", () => {
		const tag = new JSDocReturnsTag("  { string }   The result   ");

		strictEqual(tag.type, "string");
		strictEqual(tag.description, "The result");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiple spaces between type and description", () => {
		const tag = new JSDocReturnsTag("{number}     The calculated value");

		strictEqual(tag.type, "number");
		strictEqual(tag.description, "The calculated value");
		strictEqual(tag.isValidated, true);
	});

	test("should handle function types with descriptions", () => {
		const tag = new JSDocReturnsTag(
			"{function(string, number): boolean} Validation function",
		);

		strictEqual(tag.type, "function(string, number): boolean");
		strictEqual(tag.description, "Validation function");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocReturnsTag malformed content scenarios", () => {
	test("should handle unclosed braces", () => {
		const tag = new JSDocReturnsTag("{string The result");

		// Regex doesn't match, so no braces found
		strictEqual(tag.type, "");
		strictEqual(tag.description, "{string The result");
		strictEqual(tag.isValidated, true);
	});

	test("should handle unopened braces", () => {
		const tag = new JSDocReturnsTag("string} The result");

		strictEqual(tag.type, "");
		strictEqual(tag.description, "string} The result");
		strictEqual(tag.isValidated, true);
	});

	test("should handle nested braces in type", () => {
		const tag = new JSDocReturnsTag(
			"{Object.<string, {x: number}>} Complex object",
		);

		// Regex [^}]* stops at first } - inner brace breaks parsing
		strictEqual(tag.type, "Object.<string, {x: number");
		strictEqual(tag.description, ">} Complex object");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiple brace pairs", () => {
		const tag = new JSDocReturnsTag("{string} {number} Description");

		strictEqual(tag.type, "string");
		strictEqual(tag.description, "{number} Description");
		strictEqual(tag.isValidated, true);
	});

	test("should handle braces in description", () => {
		const tag = new JSDocReturnsTag("{string} Object with {property: value}");

		strictEqual(tag.type, "string");
		strictEqual(tag.description, "Object with {property: value}");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocReturnsTag validation scenarios", () => {
	test("should validate when type is present", () => {
		const tag = new JSDocReturnsTag("{string}");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate when description is present", () => {
		const tag = new JSDocReturnsTag("Returns the result");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate when both type and description are present", () => {
		const tag = new JSDocReturnsTag("{number} The calculated value");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should not validate when both type and description are empty", () => {
		const emptyTags = ["", "   ", "{}", "{   }", undefined, null];

		emptyTags.forEach((content) => {
			const tag = new JSDocReturnsTag(content);
			strictEqual(tag.isValidated, false, `Failed for content: ${content}`);
			strictEqual(tag.isValid(), false);
		});
	});

	test("should not validate whitespace-only content", () => {
		const tag = new JSDocReturnsTag("   \t\n   ");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});
});

describe("JSDocReturnsTag edge cases and boundary conditions", () => {
	test("should handle very long type names", () => {
		const longType = `${"Very".repeat(100)}LongTypeName`;
		const tag = new JSDocReturnsTag(`{${longType}} Description`);

		strictEqual(tag.type, longType);
		strictEqual(tag.description, "Description");
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode in types and descriptions", () => {
		const tag = new JSDocReturnsTag("{Configuración} Descripción en español");

		strictEqual(tag.type, "Configuración");
		strictEqual(tag.description, "Descripción en español");
		strictEqual(tag.isValidated, true);
	});

	test("should handle emoji in descriptions", () => {
		const tag = new JSDocReturnsTag("{boolean} Success status 🎉");

		strictEqual(tag.type, "boolean");
		strictEqual(tag.description, "Success status 🎉");
		strictEqual(tag.isValidated, true);
	});

	test("should handle single character types", () => {
		const tag = new JSDocReturnsTag("{T} Generic type");

		strictEqual(tag.type, "T");
		strictEqual(tag.description, "Generic type");
		strictEqual(tag.isValidated, true);
	});

	test("should handle numeric types", () => {
		const tag = new JSDocReturnsTag("{42} The answer");

		strictEqual(tag.type, "42");
		strictEqual(tag.description, "The answer");
		strictEqual(tag.isValidated, true);
	});

	test("should handle complex nested generics", () => {
		const tag = new JSDocReturnsTag(
			"{Promise<Result<Array<User>, Error>>} Complex return type",
		);

		strictEqual(tag.type, "Promise<Result<Array<User>, Error>>");
		strictEqual(tag.description, "Complex return type");
		strictEqual(tag.isValidated, true);
	});

	test("should handle URL-like content in descriptions", () => {
		const tag = new JSDocReturnsTag(
			"{string} URL like https://example.com/api/users",
		);

		strictEqual(tag.type, "string");
		strictEqual(tag.description, "URL like https://example.com/api/users");
		strictEqual(tag.isValidated, true);
	});
});
