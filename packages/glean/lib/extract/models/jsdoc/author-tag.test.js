/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocAuthorTag - 100% coverage validation.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocAuthorTag } from "./author-tag.js";

describe("JSDocAuthorTag construction and inheritance", () => {
	test("should inherit from JSDocTagBase correctly", () => {
		const tag = new JSDocAuthorTag("John Doe");

		strictEqual(tag.tagType, "author");
		strictEqual(tag.rawContent, "John Doe");
		strictEqual(tag.isValid(), true);
	});

	test("should handle valid author name only", () => {
		const tag = new JSDocAuthorTag("John Doe");

		strictEqual(tag.authorInfo, "John Doe");
		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty rawContent", () => {
		const tag = new JSDocAuthorTag("");

		strictEqual(tag.authorInfo, "");
		strictEqual(tag.name, "");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle undefined rawContent", () => {
		const tag = new JSDocAuthorTag(undefined);

		strictEqual(tag.authorInfo, "");
		strictEqual(tag.name, "");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle null rawContent", () => {
		const tag = new JSDocAuthorTag(null);

		strictEqual(tag.authorInfo, "");
		strictEqual(tag.name, "");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle whitespace-only rawContent", () => {
		const tag = new JSDocAuthorTag("   \t\n  ");

		strictEqual(tag.authorInfo, "");
		strictEqual(tag.name, "");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocAuthorTag parseContent scenarios", () => {
	test("should parse simple author name", () => {
		const tag = new JSDocAuthorTag("John Doe");

		strictEqual(tag.authorInfo, "John Doe");
		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
	});

	test("should parse author with email", () => {
		const tag = new JSDocAuthorTag("John Doe <john@example.com>");

		strictEqual(tag.authorInfo, "John Doe <john@example.com>");
		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john@example.com");
		strictEqual(tag.additional, "");
	});

	test("should parse author with email and additional info", () => {
		const tag = new JSDocAuthorTag(
			"John Doe <john@example.com> (Company Inc.)",
		);

		strictEqual(tag.authorInfo, "John Doe <john@example.com> (Company Inc.)");
		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john@example.com");
		strictEqual(tag.additional, "(Company Inc.)");
	});

	test("should handle email with spaces around", () => {
		const tag = new JSDocAuthorTag("John Doe < john@example.com >");

		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john@example.com"); // Email is trimmed
		strictEqual(tag.additional, "");
	});

	test("should parse complex email formats", () => {
		const tag = new JSDocAuthorTag("John Doe <john.doe+tag@example.co.uk>");

		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john.doe+tag@example.co.uk");
		strictEqual(tag.additional, "");
	});

	test("should handle international names", () => {
		const tag = new JSDocAuthorTag("João da Silva <joao@exemplo.com.br>");

		strictEqual(tag.name, "João da Silva");
		strictEqual(tag.email, "joao@exemplo.com.br");
		strictEqual(tag.additional, "");
	});

	test("should handle unicode and emoji in names", () => {
		const tag = new JSDocAuthorTag("山田太郎 🦅 <yamada@example.jp>");

		strictEqual(tag.name, "山田太郎 🦅");
		strictEqual(tag.email, "yamada@example.jp");
		strictEqual(tag.additional, "");
	});

	test("should trim leading whitespace from name", () => {
		const tag = new JSDocAuthorTag("   John Doe <john@example.com>");

		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john@example.com");
	});

	test("should trim trailing whitespace from additional info", () => {
		const tag = new JSDocAuthorTag("John Doe <john@example.com> (Company)   ");

		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john@example.com");
		strictEqual(tag.additional, "(Company)");
	});

	test("should handle organization without email", () => {
		const tag = new JSDocAuthorTag("John Doe (Company Inc.)");

		strictEqual(tag.name, "John Doe (Company Inc.)");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
	});
});

describe("JSDocAuthorTag malformed content scenarios", () => {
	test("should handle multiple angle brackets", () => {
		const tag = new JSDocAuthorTag("John < Doe < <email> >");

		// Regex matches: name="John", email="Doe < <email", additional=">"
		strictEqual(tag.name, "John");
		strictEqual(tag.email, "Doe < <email");
		strictEqual(tag.additional, ">");
	});

	test("should handle email without closing bracket", () => {
		const tag = new JSDocAuthorTag("John <email@domain");

		// No valid email match
		strictEqual(tag.name, "John <email@domain");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
	});

	test("should handle email without opening bracket", () => {
		const tag = new JSDocAuthorTag("John email@domain>");

		// No valid email match
		strictEqual(tag.name, "John email@domain>");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
	});

	test("should handle empty name with email", () => {
		const tag = new JSDocAuthorTag(" <email@domain.com>");

		// After trimming: "<email@domain.com>" - regex requires non-< chars before <, so no match
		strictEqual(tag.name, "<email@domain.com>");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
	});

	test("should handle nested angle brackets", () => {
		const tag = new JSDocAuthorTag("John <<nested@email.com>>");

		// Regex matches: name="John", email="<nested@email.com", additional=">"
		strictEqual(tag.name, "John");
		strictEqual(tag.email, "<nested@email.com");
		strictEqual(tag.additional, ">");
	});

	test("should handle empty email brackets", () => {
		const tag = new JSDocAuthorTag("John Doe <>");

		// No match because <> doesn't satisfy the [^>]+ pattern, so everything goes to name
		strictEqual(tag.name, "John Doe <>");
		strictEqual(tag.email, "");
		strictEqual(tag.additional, "");
	});
});

describe("JSDocAuthorTag validation scenarios", () => {
	test("should validate non-empty author info as valid", () => {
		const tag = new JSDocAuthorTag("John Doe");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate empty author info as invalid", () => {
		const tag = new JSDocAuthorTag("");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});

	test("should validate whitespace-only author info as invalid", () => {
		const tag = new JSDocAuthorTag("   ");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});

	test("should validate author with email as valid", () => {
		const tag = new JSDocAuthorTag("John <john@example.com>");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate single character name as valid", () => {
		const tag = new JSDocAuthorTag("X");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});
});

describe("JSDocAuthorTag edge cases", () => {
	test("should handle very long author names", () => {
		const longName = `${"Very".repeat(100)}LongAuthorName`;
		const tag = new JSDocAuthorTag(longName);

		strictEqual(tag.name, longName);
		strictEqual(tag.isValidated, true);
	});

	test("should handle author with mixed whitespace", () => {
		const tag = new JSDocAuthorTag(" \t John Doe \n ");

		strictEqual(tag.authorInfo, "John Doe");
		strictEqual(tag.name, "John Doe");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiple spaces in name", () => {
		const tag = new JSDocAuthorTag("John   Middle   Doe");

		strictEqual(tag.name, "John   Middle   Doe");
		strictEqual(tag.email, "");
	});

	test("should handle author with special characters", () => {
		const tag = new JSDocAuthorTag(
			"Dr. John O'Brien-Smith Jr. <john@example.com>",
		);

		strictEqual(tag.name, "Dr. John O'Brien-Smith Jr.");
		strictEqual(tag.email, "john@example.com");
	});

	test("should handle very long email addresses", () => {
		const longEmail =
			"very.long.email.address.with.many.dots@very-long-domain-name.example.com";
		const tag = new JSDocAuthorTag(`John Doe <${longEmail}>`);

		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, longEmail);
	});

	test("should handle multiple additional info sections", () => {
		const tag = new JSDocAuthorTag(
			"John Doe <john@example.com> (Company) [Team] {Role}",
		);

		strictEqual(tag.name, "John Doe");
		strictEqual(tag.email, "john@example.com");
		strictEqual(tag.additional, "(Company) [Team] {Role}");
	});
});
