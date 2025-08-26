/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocStaticTag } from "./static-tag.js";

describe("JSDocStaticTag functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocStaticTag("Class-level method");

		strictEqual(tag.getType(), "static");
		strictEqual(tag.getRawContent(), "Class-level method");
		strictEqual(tag.isValid(), true);
	});

	test("should handle standalone static tag", () => {
		const tag = new JSDocStaticTag("");

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle static with description", () => {
		const tag = new JSDocStaticTag("Belongs to class, not instance");

		strictEqual(tag.description, "Belongs to class, not instance");
		strictEqual(tag.isValidated, true);
	});

	test("should handle common static scenarios", () => {
		const scenarios = [
			"Factory method",
			"Utility function",
			"Class constant",
			"Singleton accessor",
		];

		scenarios.forEach((scenario) => {
			const tag = new JSDocStaticTag(scenario);
			strictEqual(tag.description, scenario);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle edge cases", () => {
		const edgeCases = [
			undefined,
			null,
			"",
			"   ",
			"  Static method  ",
			"Multi\nline\ndescription",
		];

		edgeCases.forEach((content) => {
			const tag = new JSDocStaticTag(content);
			const expected = content?.trim() || "";
			strictEqual(tag.description, expected);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should always validate as true", () => {
		const tag1 = new JSDocStaticTag("");
		const tag2 = new JSDocStaticTag("Static method");
		const tag3 = new JSDocStaticTag(undefined);

		strictEqual(tag1.isValidated, true);
		strictEqual(tag2.isValidated, true);
		strictEqual(tag3.isValidated, true);
	});
});
