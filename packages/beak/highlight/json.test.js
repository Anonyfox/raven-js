/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSON syntax highlighter
 *
 * Comprehensive test coverage for JSON tokenization, syntax highlighting,
 * Bootstrap class mapping, and edge cases with 100% branch coverage.
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, test } from "node:test";
import { highlightJSON } from "./json.js";

// Helper to create expected span with class
const span = (className, content) =>
	`<span class="${className}">${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")}</span>`;

// Helper to create expected output without escaping
const spanRaw = (className, content) =>
	`<span class="${className}">${content}</span>`;

describe("JSON Syntax Highlighter", () => {
	describe("Input Validation", () => {
		test("throws TypeError for non-string input", () => {
			throws(() => highlightJSON(null), {
				name: "TypeError",
				message: "JSON source must be a string",
			});
			throws(() => highlightJSON(42), {
				name: "TypeError",
				message: "JSON source must be a string",
			});
			throws(() => highlightJSON({}), {
				name: "TypeError",
				message: "JSON source must be a string",
			});
		});

		test("returns empty string for empty/whitespace input", () => {
			strictEqual(highlightJSON(""), "");
			strictEqual(highlightJSON("   "), "");
			strictEqual(highlightJSON("\n\t\r"), "");
		});
	});

	describe("Primitive Values", () => {
		test("string values", () => {
			const json = `"hello world"`;
			const expected = span("text-success", '"hello world"');
			strictEqual(highlightJSON(json), expected);
		});

		test("strings with escaped characters", () => {
			const json = `"hello\\n\\t\\"world\\""`;
			const expected = span("text-success", '"hello\\n\\t\\"world\\""');
			strictEqual(highlightJSON(json), expected);
		});

		test("number values", () => {
			strictEqual(highlightJSON("42"), span("text-warning", "42"));
			strictEqual(highlightJSON("-42"), span("text-warning", "-42"));
			strictEqual(highlightJSON("3.14"), span("text-warning", "3.14"));
			strictEqual(highlightJSON("0"), span("text-warning", "0"));
		});

		test("scientific notation numbers", () => {
			strictEqual(highlightJSON("1e10"), span("text-warning", "1e10"));
			strictEqual(highlightJSON("1.23e-4"), span("text-warning", "1.23e-4"));
			strictEqual(highlightJSON("5E+3"), span("text-warning", "5E+3"));
		});

		test("boolean values", () => {
			strictEqual(highlightJSON("true"), span("text-warning", "true"));
			strictEqual(highlightJSON("false"), span("text-warning", "false"));
		});

		test("null value", () => {
			strictEqual(highlightJSON("null"), span("text-warning", "null"));
		});
	});

	describe("Objects", () => {
		test("empty object", () => {
			const json = `{}`;
			const expected =
				spanRaw("text-secondary", "{") + spanRaw("text-secondary", "}");
			strictEqual(highlightJSON(json), expected);
		});

		test("simple object with one property", () => {
			const json = `{"key": "value"}`;
			const expected =
				spanRaw("text-secondary", "{") +
				span("text-primary", '"key"') +
				spanRaw("text-secondary", ":") +
				" " +
				span("text-success", '"value"') +
				spanRaw("text-secondary", "}");
			strictEqual(highlightJSON(json), expected);
		});

		test("object with multiple properties", () => {
			const json = `{"name": "John", "age": 30, "active": true}`;
			const expected =
				spanRaw("text-secondary", "{") +
				span("text-primary", '"name"') +
				spanRaw("text-secondary", ":") +
				" " +
				span("text-success", '"John"') +
				spanRaw("text-secondary", ",") +
				" " +
				span("text-primary", '"age"') +
				spanRaw("text-secondary", ":") +
				" " +
				span("text-warning", "30") +
				spanRaw("text-secondary", ",") +
				" " +
				span("text-primary", '"active"') +
				spanRaw("text-secondary", ":") +
				" " +
				span("text-warning", "true") +
				spanRaw("text-secondary", "}");
			strictEqual(highlightJSON(json), expected);
		});

		test("nested objects", () => {
			const json = `{"user": {"name": "Alice", "profile": {"age": 25}}}`;
			const result = highlightJSON(json);

			// Verify structure is present
			strictEqual(result.includes('class="text-primary"'), true); // Object keys
			strictEqual(result.includes('class="text-success"'), true); // String values
			strictEqual(result.includes('class="text-warning"'), true); // Numbers
			strictEqual(result.includes('class="text-secondary"'), true); // Punctuation
		});

		test("object with whitespace", () => {
			const json = `{  "key"  :  "value"  }`;
			const expected =
				spanRaw("text-secondary", "{") +
				"  " +
				span("text-primary", '"key"') +
				"  " +
				spanRaw("text-secondary", ":") +
				"  " +
				span("text-success", '"value"') +
				"  " +
				spanRaw("text-secondary", "}");
			strictEqual(highlightJSON(json), expected);
		});
	});

	describe("Arrays", () => {
		test("empty array", () => {
			const json = `[]`;
			const expected =
				spanRaw("text-secondary", "[") + spanRaw("text-secondary", "]");
			strictEqual(highlightJSON(json), expected);
		});

		test("array with primitive values", () => {
			const json = `[1, "text", true, null]`;
			const expected =
				spanRaw("text-secondary", "[") +
				span("text-warning", "1") +
				spanRaw("text-secondary", ",") +
				" " +
				span("text-success", '"text"') +
				spanRaw("text-secondary", ",") +
				" " +
				span("text-warning", "true") +
				spanRaw("text-secondary", ",") +
				" " +
				span("text-warning", "null") +
				spanRaw("text-secondary", "]");
			strictEqual(highlightJSON(json), expected);
		});

		test("array of objects", () => {
			const json = `[{"id": 1}, {"id": 2}]`;
			const result = highlightJSON(json);

			// Should contain array brackets
			strictEqual(result.includes("["), true);
			strictEqual(result.includes("]"), true);
			// Should contain object keys and values
			strictEqual(result.includes('class="text-primary"'), true);
			strictEqual(result.includes('class="text-warning"'), true);
		});

		test("nested arrays", () => {
			const json = `[[1, 2], [3, 4]]`;
			const result = highlightJSON(json);

			// Should contain array brackets and nested structure
			strictEqual(result.includes("["), true);
			strictEqual(result.includes("]"), true);
			// Should contain properly highlighted numbers
			strictEqual(result.includes('class="text-warning"'), true);
		});
	});

	describe("Complex JSON Structures", () => {
		test("realistic JSON document", () => {
			const json = `{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "active": true,
      "metadata": {
        "lastLogin": "2024-01-15",
        "loginCount": 42
      }
    }
  ],
  "total": 1,
  "page": null
}`;
			const result = highlightJSON(json);

			// Verify all token types are present
			strictEqual(result.includes('class="text-primary"'), true); // Object keys
			strictEqual(result.includes('class="text-success"'), true); // Strings
			strictEqual(result.includes('class="text-warning"'), true); // Numbers, booleans, null
			strictEqual(result.includes('class="text-secondary"'), true); // Punctuation
		});

		test("JSON with various data types", () => {
			const json = `{
  "string": "hello",
  "number": 123,
  "float": 45.67,
  "scientific": 1.23e-4,
  "boolean": true,
  "null": null,
  "array": [1, 2, 3],
  "object": {"nested": "value"}
}`;
			const result = highlightJSON(json);

			// Check specific number patterns
			strictEqual(result.includes(span("text-warning", "123")), true);
			strictEqual(result.includes(span("text-warning", "45.67")), true);
			strictEqual(result.includes(span("text-warning", "1.23e-4")), true);
		});
	});

	describe("JSON5/JSONC Support", () => {
		test("single-line comments", () => {
			const json = `{
  "key": "value" // This is a comment
}`;
			const result = highlightJSON(json);
			strictEqual(result.includes('class="text-muted"'), true);
			strictEqual(result.includes("// This is a comment"), true);
		});

		test("multi-line comments", () => {
			const json = `{
  /* This is a
     multiline comment */
  "key": "value"
}`;
			const result = highlightJSON(json);
			strictEqual(result.includes('class="text-muted"'), true);
			strictEqual(result.includes("/* This is a"), true);
		});

		test("comments mixed with JSON", () => {
			const json = `{
  // Start of object
  "name": "John", /* inline comment */
  "age": 30
  // End of object
}`;
			const result = highlightJSON(json);

			// Should have both comment types
			strictEqual(result.includes("// Start of object"), true);
			strictEqual(result.includes("/* inline comment */"), true);
			strictEqual(result.includes("// End of object"), true);
		});
	});

	describe("Edge Cases and Error Handling", () => {
		test("invalid JSON tokens", () => {
			const json = `{undefined: invalid}`;
			const result = highlightJSON(json);

			// Invalid tokens should not be highlighted
			strictEqual(result.includes("undefined"), true);
			strictEqual(result.includes("invalid"), true);
		});

		test("unclosed strings", () => {
			const json = `{"key": "unclosed string`;
			const result = highlightJSON(json);

			// Should still highlight what it can
			strictEqual(result.includes('class="text-primary"'), true);
		});

		test("trailing commas", () => {
			const json = `{"key": "value",}`;
			const result = highlightJSON(json);

			// Should highlight the structure
			strictEqual(result.includes('class="text-primary"'), true);
			strictEqual(result.includes('class="text-success"'), true);
		});

		test("mixed quotes in strings", () => {
			const json = `{"key": "string with \\"escaped\\" quotes"}`;
			const result = highlightJSON(json);
			strictEqual(result.includes('class="text-primary"'), true);
			strictEqual(result.includes('class="text-success"'), true);
		});

		test("numbers at boundaries", () => {
			const json = `[0, -0, 1, -1, 0.1, -0.1]`;
			const result = highlightJSON(json);

			// All numbers should be highlighted
			const numberMatches = result.match(/class="text-warning"/g);
			strictEqual(numberMatches?.length, 6);
		});

		test("empty strings and whitespace", () => {
			const json = `{"empty": "", "spaces": "   "}`;
			const result = highlightJSON(json);

			strictEqual(result.includes(span("text-success", '""')), true);
			strictEqual(result.includes(span("text-success", '"   "')), true);
		});

		test("deeply nested structure", () => {
			const json = `{"a": {"b": {"c": {"d": {"e": "deep"}}}}}`;
			const result = highlightJSON(json);

			// Should handle deep nesting
			const braceCount = (result.match(/\{/g) || []).length;
			strictEqual(braceCount, 5);
		});

		test("large numbers and special cases", () => {
			const json = `[999999999999999, 0.0000000001, 1e100, -1e-100]`;
			const result = highlightJSON(json);

			// All should be highlighted as numbers
			const numberMatches = result.match(/class="text-warning"/g);
			strictEqual(numberMatches?.length, 4);
		});

		test("invalid JSON characters (surgical coverage)", () => {
			// Test characters that don't match any valid JSON patterns (lines 253-261)
			const json = '{"valid": true} @ # $ invalid characters';
			const result = highlightJSON(json);
			strictEqual(typeof result, "string");
			// Should still process the valid JSON parts and handle invalid characters
			if (
				!result.includes("valid") ||
				!result.includes("true") ||
				!result.includes("@")
			) {
				throw new Error("Should handle valid JSON and invalid characters");
			}
		});

		test("decimal numbers starting with dot (surgical coverage for line 142)", () => {
			// Test the condition: (char === "." && /\d/.test(nextChar))
			const json = `[.5, .123, .0]`;
			const result = highlightJSON(json);
			// Should highlight decimal numbers starting with dot
			ok(result.includes(span("text-warning", ".5")));
			ok(result.includes(span("text-warning", ".123")));
			ok(result.includes(span("text-warning", ".0")));
		});
	});

	describe("Whitespace Handling", () => {
		test("preserves formatting whitespace", () => {
			const json = `{
  "indented": {
    "nested": "value"
  }
}`;
			const result = highlightJSON(json);

			// Should preserve newlines and indentation
			strictEqual(result.includes("\n"), true);
			strictEqual(result.includes("  "), true);
		});

		test("handles mixed whitespace", () => {
			const json = `{\t"tab":\r\n  "value"\n}`;
			const result = highlightJSON(json);

			// Should preserve all types of whitespace
			strictEqual(result.includes("\t"), true);
			strictEqual(result.includes("\r\n"), true);
			strictEqual(result.includes("  "), true);
		});
	});
});
