/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocProtectedTag - 100% coverage validation.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocProtectedTag } from "./protected-tag.js";

describe("JSDocProtectedTag functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocProtectedTag("Subclass access only");

		strictEqual(tag.getType(), "protected");
		strictEqual(tag.getRawContent(), "Subclass access only");
		strictEqual(tag.isValid(), true);
	});

	test("should handle standalone protected tag", () => {
		const tag = new JSDocProtectedTag("");

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle protected tag with description", () => {
		const tag = new JSDocProtectedTag("Access from subclasses only");

		strictEqual(tag.description, "Access from subclasses only");
		strictEqual(tag.isValidated, true);
	});

	test("should handle undefined content", () => {
		const tag = new JSDocProtectedTag(undefined);

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle null content", () => {
		const tag = new JSDocProtectedTag(null);

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should trim whitespace", () => {
		const tag = new JSDocProtectedTag("  Protected method  ");

		strictEqual(tag.description, "Protected method");
		strictEqual(tag.isValidated, true);
	});

	test("should handle complex descriptions", () => {
		const tag = new JSDocProtectedTag(
			"Used by derived classes for template pattern implementation",
		);

		strictEqual(
			tag.description,
			"Used by derived classes for template pattern implementation",
		);
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiline descriptions", () => {
		const tag = new JSDocProtectedTag(
			"Protected method.\nUsed in inheritance hierarchy.",
		);

		strictEqual(
			tag.description,
			"Protected method.\nUsed in inheritance hierarchy.",
		);
		strictEqual(tag.isValidated, true);
	});

	test("should handle special characters", () => {
		const tag = new JSDocProtectedTag("Protected: use with care!");

		strictEqual(tag.description, "Protected: use with care!");
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode content", () => {
		const tag = new JSDocProtectedTag("Método protegido 保護された");

		strictEqual(tag.description, "Método protegido 保護された");
		strictEqual(tag.isValidated, true);
	});

	test("should always validate as true", () => {
		const emptyTag = new JSDocProtectedTag("");
		const contentTag = new JSDocProtectedTag("Protected access");
		const whitespaceTag = new JSDocProtectedTag("   ");

		strictEqual(emptyTag.isValidated, true);
		strictEqual(contentTag.isValidated, true);
		strictEqual(whitespaceTag.isValidated, true);
	});
});
