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
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("applies NFKC and compatibility mappings", () => {
			// canonical composition: decomposed e + acute -> composed é
			const decomposed = "e\u0301";
			const composed = "é";
			strictEqual(normalizeUnicode(decomposed), composed);
			strictEqual(normalizeUnicode(composed), composed);
			// compatibility ligatures and enclosed numbers
			strictEqual(normalizeUnicode("ﬀ"), "ff");
			strictEqual(normalizeUnicode("ﬁ"), "fi");
			strictEqual(normalizeUnicode("①"), "1");
			// CJK fullwidth to ASCII via NFKC
			strictEqual(normalizeUnicode("ＡＢＣ"), "ABC");
			strictEqual(normalizeUnicode("１２３"), "123");
		});
	});

	describe("edge cases and errors", () => {
		it("handles diacritic stripping, empty, and plain text", () => {
			// diacritic stripping
			strictEqual(normalizeUnicode("café", true), "cafe");
			strictEqual(normalizeUnicode("naïve", true), "naive");
			strictEqual(normalizeUnicode("résumé", true), "resume");
			strictEqual(normalizeUnicode("Zürich", true), "Zurich");
			// default preserves diacritics
			strictEqual(normalizeUnicode("café"), "café");
			strictEqual(normalizeUnicode("naïve"), "naïve");
			strictEqual(normalizeUnicode("résumé"), "résumé");
			// empty string and plain ASCII
			strictEqual(normalizeUnicode(""), "");
			strictEqual(normalizeUnicode("", true), "");
			const text = "hello world";
			strictEqual(normalizeUnicode(text), text);
			strictEqual(normalizeUnicode(text, true), text);
			// multiple combining marks, then strip to base
			const complex = "e\u0301\u0302"; // e + acute + circumflex
			strictEqual(normalizeUnicode(complex, true), "e");
		});
	});

	describe("integration scenarios", () => {
		it("combines compatibility mapping with mark stripping", () => {
			// pipeline NFKD -> strip marks -> NFC on compatibility chars
			strictEqual(normalizeUnicode("ﬁ", true), "fi");
			strictEqual(normalizeUnicode("①", true), "1");
		});
	});
});
