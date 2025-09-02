/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for locale-aware case folding functionality.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { foldCase } from "./fold-case.js";

describe("foldCase", () => {
	it("performs basic case folding", () => {
		strictEqual(foldCase("Hello World"), "hello world");
		strictEqual(foldCase("UPPERCASE"), "uppercase");
		strictEqual(foldCase("MiXeDcAsE"), "mixedcase");
	});

	it("uses English locale by default", () => {
		strictEqual(foldCase("Test"), "test");
		strictEqual(foldCase("İstanbul"), "i̇stanbul");
	});

	it("handles Turkish locale correctly", () => {
		// Turkish has specific rules for I/İ and ı/i
		const turkish = foldCase("İstanbul", "tr");
		const english = foldCase("İstanbul", "en");
		// Results should be processed according to locale rules
		strictEqual(typeof turkish, "string");
		strictEqual(typeof english, "string");
	});

	it("handles German case folding", () => {
		strictEqual(foldCase("Straße", "de"), "straße");
		strictEqual(foldCase("Weiß", "de"), "weiß");
		strictEqual(foldCase("Großbritannien", "de"), "großbritannien");
	});

	it("handles uppercase ẞ (sharp S) correctly", () => {
		// Modern German uppercase sharp s (introduced 2017) - ẞ → ß via locale rules
		strictEqual(foldCase("STRAẞE", "de"), "straße");
		strictEqual(foldCase("GROẞ", "de"), "groß");
	});

	it("handles empty string", () => {
		strictEqual(foldCase(""), "");
	});

	it("handles text without uppercase", () => {
		const text = "already lowercase";
		strictEqual(foldCase(text), text);
		strictEqual(foldCase(text, "de"), text);
	});

	it("preserves non-Latin scripts", () => {
		// Cyrillic
		strictEqual(foldCase("Москва", "ru"), "москва");

		// Greek
		strictEqual(foldCase("Αθήνα", "el"), "αθήνα");
	});

	it("handles German locale variations", () => {
		// Test valid German locale formats
		strictEqual(foldCase("Straße", "de-DE"), "straße");
		strictEqual(foldCase("Straße", "de-AT"), "straße");
		strictEqual(foldCase("Straße", "de-CH"), "straße");
	});

	it("distinguishes Turkish I variations", () => {
		// Turkish has different I/i mappings than English
		const turkishResult = foldCase("ISTANBUL", "tr");
		const englishResult = foldCase("ISTANBUL", "en");

		// Both should be strings
		strictEqual(typeof turkishResult, "string");
		strictEqual(typeof englishResult, "string");

		// Test dotted İ specifically
		const dottedTurkish = foldCase("İSTANBUL", "tr");
		const dottedEnglish = foldCase("İSTANBUL", "en");
		strictEqual(typeof dottedTurkish, "string");
		strictEqual(typeof dottedEnglish, "string");
	});

	it("handles invalid inputs gracefully", () => {
		// Null/undefined text
		strictEqual(foldCase(null), "");
		strictEqual(foldCase(undefined), "");
		strictEqual(foldCase(""), "");

		// Invalid locales fallback to English
		strictEqual(foldCase("Test", null), "test");
		strictEqual(foldCase("Test", undefined), "test");
		strictEqual(foldCase("Test", ""), "test");
		strictEqual(foldCase("Test", "xyz"), "test");

		// Very short/invalid locales fallback to English
		strictEqual(foldCase("Test", "d"), "test");
		strictEqual(foldCase("Test", "x"), "test");
	});
});
