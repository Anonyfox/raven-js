/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocAliasTag - 100% coverage validation.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocAliasTag } from "./alias-tag.js";

describe("JSDocAliasTag construction and inheritance", () => {
	test("should inherit from JSDocTagBase correctly", () => {
		const tag = new JSDocAliasTag("MySymbol");

		strictEqual(tag.getType(), "alias");
		strictEqual(tag.getRawContent(), "MySymbol");
		strictEqual(tag.isValid(), true);
	});

	test("should handle valid symbol reference", () => {
		const tag = new JSDocAliasTag("MySymbol");

		strictEqual(tag.aliasFor, "MySymbol");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty rawContent", () => {
		const tag = new JSDocAliasTag("");

		strictEqual(tag.aliasFor, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle undefined rawContent", () => {
		const tag = new JSDocAliasTag(undefined);

		strictEqual(tag.aliasFor, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle null rawContent", () => {
		const tag = new JSDocAliasTag(null);

		strictEqual(tag.aliasFor, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle whitespace-only rawContent", () => {
		const tag = new JSDocAliasTag("   \t\n  ");

		strictEqual(tag.aliasFor, ""); // Trimmed to empty
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocAliasTag parseContent scenarios", () => {
	test("should parse simple symbol reference", () => {
		const tag = new JSDocAliasTag("MySymbol");

		strictEqual(tag.aliasFor, "MySymbol");
	});

	test("should parse namespaced symbol reference", () => {
		const tag = new JSDocAliasTag("Namespace.MySymbol");

		strictEqual(tag.aliasFor, "Namespace.MySymbol");
	});

	test("should parse module reference", () => {
		const tag = new JSDocAliasTag("module:myModule.MySymbol");

		strictEqual(tag.aliasFor, "module:myModule.MySymbol");
	});

	test("should parse complex nested reference", () => {
		const tag = new JSDocAliasTag("Outer.Inner.Deep.Symbol");

		strictEqual(tag.aliasFor, "Outer.Inner.Deep.Symbol");
	});

	test("should trim leading whitespace", () => {
		const tag = new JSDocAliasTag("   MySymbol");

		strictEqual(tag.aliasFor, "MySymbol");
	});

	test("should trim trailing whitespace", () => {
		const tag = new JSDocAliasTag("MySymbol   ");

		strictEqual(tag.aliasFor, "MySymbol");
	});

	test("should trim both leading and trailing whitespace", () => {
		const tag = new JSDocAliasTag("  MySymbol  ");

		strictEqual(tag.aliasFor, "MySymbol");
	});

	test("should handle symbols with special characters", () => {
		const tag = new JSDocAliasTag("$special_Symbol123");

		strictEqual(tag.aliasFor, "$special_Symbol123");
	});

	test("should handle symbols with hyphens and underscores", () => {
		const tag = new JSDocAliasTag("my-symbol_with_underscores");

		strictEqual(tag.aliasFor, "my-symbol_with_underscores");
	});
});

describe("JSDocAliasTag validation scenarios", () => {
	test("should validate non-empty symbol reference as valid", () => {
		const tag = new JSDocAliasTag("MySymbol");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate empty symbol reference as invalid", () => {
		const tag = new JSDocAliasTag("");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});

	test("should validate whitespace-only reference as invalid", () => {
		const tag = new JSDocAliasTag("   ");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});

	test("should validate single character symbol as valid", () => {
		const tag = new JSDocAliasTag("A");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate numeric-only reference as valid", () => {
		const tag = new JSDocAliasTag("123");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});
});

describe("JSDocAliasTag edge cases", () => {
	test("should handle content with mixed whitespace", () => {
		const tag = new JSDocAliasTag(" \t MySymbol \n ");

		strictEqual(tag.aliasFor, "MySymbol");
		strictEqual(tag.isValidated, true);
	});

	test("should handle very long symbol references", () => {
		const longSymbol = `${"Very".repeat(100)}LongSymbolReference`;
		const tag = new JSDocAliasTag(longSymbol);

		strictEqual(tag.aliasFor, longSymbol);
		strictEqual(tag.isValidated, true);
	});

	test("should handle symbols with spaces (treated as single reference)", () => {
		const tag = new JSDocAliasTag("Symbol With Spaces");

		strictEqual(tag.aliasFor, "Symbol With Spaces");
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode characters in symbol names", () => {
		const tag = new JSDocAliasTag("символ_名前_🦅");

		strictEqual(tag.aliasFor, "символ_名前_🦅");
		strictEqual(tag.isValidated, true);
	});
});
