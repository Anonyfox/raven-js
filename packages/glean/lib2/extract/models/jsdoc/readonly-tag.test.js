/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocReadonlyTag } from "./readonly-tag.js";

describe("JSDocReadonlyTag functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocReadonlyTag("Immutable property");

		strictEqual(tag.getType(), "readonly");
		strictEqual(tag.getRawContent(), "Immutable property");
		strictEqual(tag.isValid(), true);
	});

	test("should handle standalone readonly tag", () => {
		const tag = new JSDocReadonlyTag("");

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle readonly with description", () => {
		const tag = new JSDocReadonlyTag("Cannot be modified after creation");

		strictEqual(tag.description, "Cannot be modified after creation");
		strictEqual(tag.isValidated, true);
	});

	test("should handle various readonly descriptions", () => {
		const descriptions = [
			"Immutable value",
			"Set once during initialization",
			"Configuration constant",
			"Computed from other properties",
		];

		descriptions.forEach((desc) => {
			const tag = new JSDocReadonlyTag(desc);
			strictEqual(tag.description, desc);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle undefined/null content", () => {
		const undefinedTag = new JSDocReadonlyTag(undefined);
		const nullTag = new JSDocReadonlyTag(null);

		strictEqual(undefinedTag.description, "");
		strictEqual(nullTag.description, "");
		strictEqual(undefinedTag.isValidated, true);
		strictEqual(nullTag.isValidated, true);
	});

	test("should trim whitespace properly", () => {
		const tag = new JSDocReadonlyTag("  Readonly constant  ");

		strictEqual(tag.description, "Readonly constant");
		strictEqual(tag.isValidated, true);
	});

	test("should handle complex readonly scenarios", () => {
		const tag = new JSDocReadonlyTag(
			"Frozen object - modifications will throw in strict mode",
		);

		strictEqual(
			tag.description,
			"Frozen object - modifications will throw in strict mode",
		);
		strictEqual(tag.isValidated, true);
	});

	test("should always validate as true", () => {
		const tags = [
			new JSDocReadonlyTag(""),
			new JSDocReadonlyTag("   "),
			new JSDocReadonlyTag("readonly"),
			new JSDocReadonlyTag(undefined),
			new JSDocReadonlyTag(null),
		];

		tags.forEach((tag) => {
			strictEqual(tag.isValidated, true);
			strictEqual(tag.isValid(), true);
		});
	});
});
