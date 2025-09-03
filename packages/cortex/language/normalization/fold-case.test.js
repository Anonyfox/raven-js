/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for locale-aware case folding.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { foldCase } from "./fold-case.js";

describe("foldCase", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("lowercases ASCII and preserves length", () => {
			// basic ASCII lowercase
			strictEqual(foldCase("Hello World", "en"), "hello world");
			// idempotence
			strictEqual(foldCase("hello", "en"), "hello");
		});
	});

	describe("edge cases and errors", () => {
		it("handles locales, empty, and invalid locale codes", () => {
			// german ß handling (note: toLocaleLowerCase preserves ß as ß)
			strictEqual(foldCase("STRAßE", "de"), "straße");
			// turkish dotted I behavior (Node may produce 'istanbul' depending on ICU)
			strictEqual(foldCase("İstanbul", "tr"), "istanbul");
			// empty input
			strictEqual(foldCase("", "en"), "");
			// explicit empty locale -> fallback to 'en'
			strictEqual(foldCase("ABC", ""), "abc");
			// invalid locale should not throw; falls back to 'en' (underscore invalid)
			strictEqual(foldCase("XYZ", "en_US"), "xyz");
		});
	});

	describe("integration scenarios", () => {
		it("normalizes mixed scripts consistently per locale", () => {
			// mixture of ASCII and locale-sensitive characters
			strictEqual(foldCase("Café İSTANBUL", "tr"), "café istanbul");
		});
	});
});
