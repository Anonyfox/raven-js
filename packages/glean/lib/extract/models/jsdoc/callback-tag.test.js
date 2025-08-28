/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDocCallbackTag - 100% coverage validation.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocCallbackTag } from "./callback-tag.js";

describe("JSDocCallbackTag core functionality", () => {
	test("should inherit from JSDocTagBase correctly", () => {
		const tag = new JSDocCallbackTag("MyCallback");

		strictEqual(tag.getType(), "callback");
		strictEqual(tag.getRawContent(), "MyCallback");
		strictEqual(tag.isValid(), true);
	});

	test("should parse callback name only", () => {
		const tag = new JSDocCallbackTag("MyCallback");

		strictEqual(tag.name, "MyCallback");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should parse callback with description", () => {
		const tag = new JSDocCallbackTag(
			"MyCallback Function called on completion",
		);

		strictEqual(tag.name, "MyCallback");
		strictEqual(tag.description, "Function called on completion");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty content", () => {
		const tag = new JSDocCallbackTag("");

		strictEqual(tag.name, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle undefined content", () => {
		const tag = new JSDocCallbackTag(undefined);

		strictEqual(tag.name, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle whitespace-only content", () => {
		const tag = new JSDocCallbackTag("   \t\n  ");

		strictEqual(tag.name, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocCallbackTag parsing scenarios", () => {
	test("should handle multiple spaces in description", () => {
		const tag = new JSDocCallbackTag(
			"onComplete Called when  operation   completes",
		);

		strictEqual(tag.name, "onComplete");
		strictEqual(tag.description, "Called when  operation   completes");
	});

	test("should trim whitespace around name and description", () => {
		const tag = new JSDocCallbackTag("  callback   description with spaces  ");

		strictEqual(tag.name, "callback");
		strictEqual(tag.description, "description with spaces");
	});

	test("should handle callback with special characters", () => {
		const tag = new JSDocCallbackTag("onSuccess$ Callback with special chars");

		strictEqual(tag.name, "onSuccess$");
		strictEqual(tag.description, "Callback with special chars");
	});

	test("should handle very long callback names", () => {
		const longName = `${"very".repeat(50)}LongCallbackName`;
		const tag = new JSDocCallbackTag(longName);

		strictEqual(tag.name, longName);
		strictEqual(tag.description, "");
	});

	test("should handle single character name", () => {
		const tag = new JSDocCallbackTag("f Function");

		strictEqual(tag.name, "f");
		strictEqual(tag.description, "Function");
	});
});

describe("JSDocCallbackTag validation", () => {
	test("should validate when name exists", () => {
		const tag = new JSDocCallbackTag("validCallback");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should invalidate when no name", () => {
		const tag = new JSDocCallbackTag("");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});

	test("should invalidate when only whitespace", () => {
		const tag = new JSDocCallbackTag("   ");

		strictEqual(tag.isValidated, false);
		strictEqual(tag.isValid(), false);
	});
});
