/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocDeprecatedTag } from "./deprecated-tag.js";

describe("JSDocDeprecatedTag functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocDeprecatedTag("This is deprecated");

		strictEqual(tag.tagType, "deprecated");
		strictEqual(tag.rawContent, "This is deprecated");
		strictEqual(tag.isValid(), true);
	});

	test("should handle message content", () => {
		const tag = new JSDocDeprecatedTag("Use newMethod() instead");

		strictEqual(tag.message, "Use newMethod() instead");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty content", () => {
		const tag = new JSDocDeprecatedTag("");

		strictEqual(tag.message, "");
		strictEqual(tag.isValidated, true); // Always valid
	});

	test("should handle undefined content", () => {
		const tag = new JSDocDeprecatedTag(undefined);

		strictEqual(tag.message, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle null content", () => {
		const tag = new JSDocDeprecatedTag(null);

		strictEqual(tag.message, "");
		strictEqual(tag.isValidated, true);
	});

	test("should trim whitespace", () => {
		const tag = new JSDocDeprecatedTag("  Since version 2.0  ");

		strictEqual(tag.message, "Since version 2.0");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiline messages", () => {
		const tag = new JSDocDeprecatedTag(
			"This method is deprecated.\nUse the new API instead.",
		);

		strictEqual(
			tag.message,
			"This method is deprecated.\nUse the new API instead.",
		);
		strictEqual(tag.isValidated, true);
	});
});
