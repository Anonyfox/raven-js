/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Unicode normalization functionality.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { normalizeUnicode } from "./normalize-unicode.js";

describe("normalizeUnicode", () => {
	it("applies NFKC normalization to composed characters", () => {
		// Test canonical composition
		const decomposed = "e\u0301"; // e + combining acute accent
		const composed = "é"; // precomposed character
		strictEqual(normalizeUnicode(decomposed), composed);
		strictEqual(normalizeUnicode(composed), composed);
	});

	it("applies compatibility mappings", () => {
		// Test compatibility character mappings
		strictEqual(normalizeUnicode("ﬀ"), "ff"); // ligature ff
		strictEqual(normalizeUnicode("ﬁ"), "fi"); // ligature fi
		strictEqual(normalizeUnicode("①"), "1"); // circled 1
	});

	it("strips diacritical marks when requested", () => {
		strictEqual(normalizeUnicode("café", true), "cafe");
		strictEqual(normalizeUnicode("naïve", true), "naive");
		strictEqual(normalizeUnicode("résumé", true), "resume");
		strictEqual(normalizeUnicode("Zürich", true), "Zurich");
	});

	it("preserves diacritical marks by default", () => {
		strictEqual(normalizeUnicode("café"), "café");
		strictEqual(normalizeUnicode("naïve"), "naïve");
		strictEqual(normalizeUnicode("résumé"), "résumé");
	});

	it("handles empty string", () => {
		strictEqual(normalizeUnicode(""), "");
		strictEqual(normalizeUnicode("", true), "");
	});

	it("handles text without diacritics", () => {
		const text = "hello world";
		strictEqual(normalizeUnicode(text), text);
		strictEqual(normalizeUnicode(text, true), text);
	});

	it("handles complex Unicode combinations", () => {
		// Test multiple combining marks
		const complex = "e\u0301\u0302"; // e + acute + circumflex
		const result = normalizeUnicode(complex, true);
		strictEqual(result, "e");
	});

	it("handles CJK fullwidth characters", () => {
		// Test fullwidth to halfwidth conversion
		strictEqual(normalizeUnicode("ＡＢＣ"), "ABC");
		strictEqual(normalizeUnicode("１２３"), "123");
	});

	it("combines compatibility mappings with diacritic stripping", () => {
		// Test NFKD → strip → NFC flow with compatibility characters that have diacritics
		strictEqual(normalizeUnicode("ﬁ", true), "fi"); // ligature fi, no diacritics
		strictEqual(normalizeUnicode("①", true), "1"); // circled 1, no diacritics
		// Note: Most compatibility characters don't have diacritical variants,
		// but the algorithm must handle the full pipeline correctly
	});
});
