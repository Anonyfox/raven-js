/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocFileTag } from "./file-tag.js";

describe("JSDocFileTag functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocFileTag("Main application file");

		strictEqual(tag.tagType, "file");
		strictEqual(tag.rawContent, "Main application file");
		strictEqual(tag.isValid(), true);
	});

	test("should handle file descriptions", () => {
		const descriptions = [
			"Main application entry point",
			"Utility functions for data processing", 
			"Configuration and settings module",
			"API route handlers for user management",
		];

		descriptions.forEach((desc) => {
			const tag = new JSDocFileTag(desc);
			strictEqual(tag.description, desc);
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle empty content", () => {
		const tag = new JSDocFileTag("");

		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle undefined/null content", () => {
		const undefinedTag = new JSDocFileTag(undefined);
		const nullTag = new JSDocFileTag(null);

		strictEqual(undefinedTag.description, "");
		strictEqual(undefinedTag.isValidated, true);

		strictEqual(nullTag.description, "");
		strictEqual(nullTag.isValidated, true);
	});

	test("should trim whitespace", () => {
		const tag = new JSDocFileTag("  Core module implementation  ");

		strictEqual(tag.description, "Core module implementation");
		strictEqual(tag.isValidated, true);
	});

	test("should handle multiline descriptions", () => {
		const tag = new JSDocFileTag(
			"Main application module.\nHandles initialization and routing.",
		);

		strictEqual(
			tag.description,
			"Main application module.\nHandles initialization and routing.",
		);
		strictEqual(tag.isValidated, true);
	});

	test("should handle special characters", () => {
		const tag = new JSDocFileTag("File for @admin & $config handling");

		strictEqual(tag.description, "File for @admin & $config handling");
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode content", () => {
		const tag = new JSDocFileTag("配置文件 - Configuration file");

		strictEqual(tag.description, "配置文件 - Configuration file");
		strictEqual(tag.isValidated, true);
	});

	test("should handle file paths in descriptions", () => {
		const tag = new JSDocFileTag("Located at src/utils/helpers.js");

		strictEqual(tag.description, "Located at src/utils/helpers.js");
		strictEqual(tag.isValidated, true);
	});

	test("should handle URLs in descriptions", () => {
		const tag = new JSDocFileTag(
			"See documentation at https://example.com/docs",
		);

		strictEqual(tag.description, "See documentation at https://example.com/docs");
		strictEqual(tag.isValidated, true);
	});

	test("should always validate as true", () => {
		const testCases = [
			"",
			"   ",
			"Valid description",
			undefined,
			null,
			"Multi\nline\tcontent",
		];

		testCases.forEach((content) => {
			const tag = new JSDocFileTag(content);
			strictEqual(tag.isValidated, true);
			strictEqual(tag.isValid(), true);
		});
	});
});
