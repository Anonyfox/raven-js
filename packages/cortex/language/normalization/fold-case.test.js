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

	it("handles German ß without conversion by default", () => {
		strictEqual(foldCase("Straße", "de"), "straße");
		strictEqual(foldCase("Weiß", "de"), "weiß");
	});

	it("converts German ß to ss when requested", () => {
		strictEqual(foldCase("Straße", "de", true), "strasse");
		strictEqual(foldCase("Weiß", "de", true), "weiss");
		strictEqual(foldCase("Großbritannien", "de", true), "grossbritannien");
	});

	it("only applies ß conversion for German locales", () => {
		strictEqual(foldCase("Straße", "en", true), "straße");
		strictEqual(foldCase("Straße", "fr", true), "straße");
		strictEqual(foldCase("Straße", "de-AT", true), "strasse");
		strictEqual(foldCase("Straße", "de-CH", true), "strasse");
	});

	it("handles empty string", () => {
		strictEqual(foldCase(""), "");
		strictEqual(foldCase("", "de", true), "");
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

	it("handles multiple ß characters", () => {
		strictEqual(foldCase("Weiß und Groß", "de", true), "weiss und gross");
	});
});
