/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocPrivateTag - 100% coverage validation.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocPrivateTag } from "./private-tag.js";

describe("JSDocPrivateTag construction and inheritance", () => {
	test("should inherit from JSDocTagBase correctly", () => {
		const tag = new JSDocPrivateTag("Internal use only");

		strictEqual(tag.getType(), "private");
		strictEqual(tag.getRawContent(), "Internal use only");
		strictEqual(tag.isValid(), true);
	});

	test("should handle standalone private tag", () => {
		const tag = new JSDocPrivateTag("");

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle private tag with description", () => {
		const tag = new JSDocPrivateTag("Internal helper function");

		strictEqual(tag.description, "Internal helper function");
		strictEqual(tag.isValidated, true);
	});

	test("should handle undefined rawContent", () => {
		const tag = new JSDocPrivateTag(undefined);

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle null rawContent", () => {
		const tag = new JSDocPrivateTag(null);

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle whitespace-only rawContent", () => {
		const tag = new JSDocPrivateTag("   \t\n  ");

		strictEqual(tag.description, ""); // Trimmed to empty
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocPrivateTag parsing scenarios", () => {
	test("should parse simple description", () => {
		const tag = new JSDocPrivateTag("Not part of public API");

		strictEqual(tag.description, "Not part of public API");
	});

	test("should trim leading whitespace", () => {
		const tag = new JSDocPrivateTag("   Internal method");

		strictEqual(tag.description, "Internal method");
	});

	test("should trim trailing whitespace", () => {
		const tag = new JSDocPrivateTag("Helper function   ");

		strictEqual(tag.description, "Helper function");
	});

	test("should trim both leading and trailing whitespace", () => {
		const tag = new JSDocPrivateTag("  Implementation detail  ");

		strictEqual(tag.description, "Implementation detail");
	});

	test("should handle description with internal spaces", () => {
		const tag = new JSDocPrivateTag("Used  internally  by  framework");

		strictEqual(tag.description, "Used  internally  by  framework");
	});

	test("should handle mixed whitespace types", () => {
		const tag = new JSDocPrivateTag(" \t Private utility \n ");

		strictEqual(tag.description, "Private utility");
	});

	test("should handle single character description", () => {
		const tag = new JSDocPrivateTag("X");

		strictEqual(tag.description, "X");
	});

	test("should handle numbers in description", () => {
		const tag = new JSDocPrivateTag("Version 2.0 implementation");

		strictEqual(tag.description, "Version 2.0 implementation");
	});

	test("should handle special characters", () => {
		const tag = new JSDocPrivateTag("Uses $internal & @private APIs");

		strictEqual(tag.description, "Uses $internal & @private APIs");
	});

	test("should handle punctuation and symbols", () => {
		const tag = new JSDocPrivateTag("Don't use! (deprecated)");

		strictEqual(tag.description, "Don't use! (deprecated)");
	});
});

describe("JSDocPrivateTag multiline and complex content", () => {
	test("should handle multiline descriptions", () => {
		const tag = new JSDocPrivateTag(
			"Internal helper function.\nUsed by public API methods.",
		);

		strictEqual(
			tag.description,
			"Internal helper function.\nUsed by public API methods.",
		);
	});

	test("should handle descriptions with tabs and newlines", () => {
		const tag = new JSDocPrivateTag("Line 1\n\tIndented line\nLine 3");

		strictEqual(tag.description, "Line 1\n\tIndented line\nLine 3");
	});

	test("should handle very long descriptions", () => {
		const longDescription = `${"Long".repeat(100)} description`;
		const tag = new JSDocPrivateTag(longDescription);

		strictEqual(tag.description, longDescription);
	});

	test("should handle description with HTML-like content", () => {
		const tag = new JSDocPrivateTag("Internal <helper> method");

		strictEqual(tag.description, "Internal <helper> method");
	});

	test("should handle description with JSON-like content", () => {
		const tag = new JSDocPrivateTag('Internal {"config": "value"} parser');

		strictEqual(tag.description, 'Internal {"config": "value"} parser');
	});

	test("should handle description with code-like content", () => {
		const tag = new JSDocPrivateTag("Implements myFunction(param1, param2)");

		strictEqual(tag.description, "Implements myFunction(param1, param2)");
	});
});

describe("JSDocPrivateTag Unicode and international content", () => {
	test("should handle Unicode characters", () => {
		const tag = new JSDocPrivateTag("Función interna para configuración");

		strictEqual(tag.description, "Función interna para configuración");
	});

	test("should handle emoji in descriptions", () => {
		const tag = new JSDocPrivateTag("Internal 🔒 secure method");

		strictEqual(tag.description, "Internal 🔒 secure method");
	});

	test("should handle Asian characters", () => {
		const tag = new JSDocPrivateTag("内部メソッド 用于内部使用");

		strictEqual(tag.description, "内部メソッド 用于内部使用");
	});

	test("should handle mixed Unicode and ASCII", () => {
		const tag = new JSDocPrivateTag("Private método αβγ function");

		strictEqual(tag.description, "Private método αβγ function");
	});
});

describe("JSDocPrivateTag validation scenarios", () => {
	test("should always validate as true (standalone)", () => {
		const tag = new JSDocPrivateTag("");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should always validate as true (with description)", () => {
		const tag = new JSDocPrivateTag("Internal method");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should always validate as true (whitespace only)", () => {
		const tag = new JSDocPrivateTag("   ");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should always validate as true (undefined)", () => {
		const tag = new JSDocPrivateTag(undefined);

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should always validate as true (null)", () => {
		const tag = new JSDocPrivateTag(null);

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should always validate as true (complex content)", () => {
		const tag = new JSDocPrivateTag("Complex\nmultiline\tdescription");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});
});

describe("JSDocPrivateTag edge cases and boundary conditions", () => {
	test("should handle description starting with numbers", () => {
		const tag = new JSDocPrivateTag("2nd version internal method");

		strictEqual(tag.description, "2nd version internal method");
	});

	test("should handle description with only spaces and tabs", () => {
		const tag = new JSDocPrivateTag("     \t\t   ");

		strictEqual(tag.description, ""); // All whitespace trimmed
	});

	test("should handle description with only newlines", () => {
		const tag = new JSDocPrivateTag("\n\n\n");

		strictEqual(tag.description, ""); // All whitespace trimmed
	});

	test("should handle mixed invisible characters", () => {
		const tag = new JSDocPrivateTag("\u00A0\u2000\u2001\u2002");

		strictEqual(tag.description, ""); // Non-breaking spaces and em-spaces
	});

	test("should handle description with URL-like content", () => {
		const tag = new JSDocPrivateTag("See https://internal.example.com/docs");

		strictEqual(tag.description, "See https://internal.example.com/docs");
	});

	test("should handle description with regex-like content", () => {
		const tag = new JSDocPrivateTag("Matches pattern: /^internal_/i");

		strictEqual(tag.description, "Matches pattern: /^internal_/i");
	});

	test("should handle extremely long single word", () => {
		const veryLongWord = "a".repeat(10000);
		const tag = new JSDocPrivateTag(veryLongWord);

		strictEqual(tag.description, veryLongWord);
	});

	test("should handle description with control characters", () => {
		const tag = new JSDocPrivateTag("Internal\x00\x01\x02method");

		strictEqual(tag.description, "Internal\x00\x01\x02method");
	});
});
