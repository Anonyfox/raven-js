/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for sentence tokenization functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { tokenizeSentences } from "./tokenize-sentences.js";

describe("tokenizeSentences", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("segments common punctuation patterns and trims", () => {
			// basic sentences
			deepStrictEqual(tokenizeSentences("Hello world. How are you?"), [
				"Hello world.",
				"How are you?",
			]);
			// different punctuation
			deepStrictEqual(
				tokenizeSentences("First sentence! Second sentence? Third sentence."),
				["First sentence!", "Second sentence?", "Third sentence."],
			);
			// exclamation and question combos
			deepStrictEqual(tokenizeSentences("Really?! Yes, I think so."), [
				"Really?!",
				"Yes, I think so.",
			]);
			// trims whitespace
			deepStrictEqual(
				tokenizeSentences("   First sentence.   Second sentence.   "),
				["First sentence.", "Second sentence."],
			);
			// single sentence and endings
			deepStrictEqual(tokenizeSentences("This is just one sentence."), [
				"This is just one sentence.",
			]);
			deepStrictEqual(tokenizeSentences("Test."), ["Test."]);
			// multiple consecutive punctuation
			deepStrictEqual(tokenizeSentences("What?!?! I cannot believe it!!!"), [
				"What?!?!",
				"I cannot believe it!!!",
			]);
			// mixed case after punctuation stays intact
			deepStrictEqual(
				tokenizeSentences("First sentence. second sentence starts lowercase."),
				["First sentence. second sentence starts lowercase."],
			);
			// Unicode punctuation
			const unicode = tokenizeSentences("First sentence。 Second sentence！");
			strictEqual(Array.isArray(unicode), true);
			strictEqual(unicode.length >= 1, true);
		});
	});

	describe("edge cases and errors", () => {
		it("handles ellipses, abbreviations, decimals, invalids, and newlines", () => {
			// ellipses preserved
			const ellipses = tokenizeSentences("First thought... Second thought.");
			strictEqual(Array.isArray(ellipses), true);
			strictEqual(ellipses.length >= 1, true);
			// abbreviations: preserve content
			const abbrev = tokenizeSentences(
				"Mr. Smith went to Dr. Jones. They discussed business.",
			);
			strictEqual(Array.isArray(abbrev), true);
			strictEqual(abbrev.length >= 1, true);
			const combined = abbrev.join(" ");
			strictEqual(combined.includes("Smith"), true);
			strictEqual(combined.includes("Jones"), true);
			strictEqual(combined.includes("business"), true);
			// decimals not split
			const price = tokenizeSentences(
				"The price was $12.50. That seems reasonable.",
			);
			strictEqual(
				price.some((s) => s.includes("$12.50")),
				true,
			);
			// invalid inputs
			deepStrictEqual(tokenizeSentences(null), []);
			deepStrictEqual(tokenizeSentences(undefined), []);
			deepStrictEqual(tokenizeSentences(""), []);
			deepStrictEqual(tokenizeSentences("   "), []);
			deepStrictEqual(tokenizeSentences("\t\n\r"), []);
			// invalid locale handling
			deepStrictEqual(tokenizeSentences("Hello world.", null), [
				"Hello world.",
			]);
			deepStrictEqual(tokenizeSentences("Hello world.", undefined), [
				"Hello world.",
			]);
			// newlines / paragraph breaks
			const para = tokenizeSentences("First sentence.\n\nSecond sentence.");
			strictEqual(Array.isArray(para), true);
			strictEqual(para.length >= 1, true);
			strictEqual(
				para.some((s) => s.includes("First")),
				true,
			);
			strictEqual(
				para.some((s) => s.includes("Second")),
				true,
			);
			// force regex fallback via throwing Segmenter
			const originalSegmenter = Intl.Segmenter;
			Intl.Segmenter = () => {
				throw new Error("Segmenter unavailable");
			};
			try {
				deepStrictEqual(tokenizeSentences("Hello world. How are you?"), [
					"Hello world.",
					"How are you?",
				]);
				deepStrictEqual(tokenizeSentences("First sentence! Second sentence?"), [
					"First sentence!",
					"Second sentence?",
				]);
			} finally {
				Intl.Segmenter = originalSegmenter;
			}
			// force regex fallback via undefined Segmenter
			const original2 = Intl.Segmenter;
			// eslint-disable-next-line unicorn/no-unreadable-array-destructuring
			delete Intl.Segmenter;
			try {
				deepStrictEqual(tokenizeSentences("Test sentence. Another one."), [
					"Test sentence.",
					"Another one.",
				]);
			} finally {
				Intl.Segmenter = original2;
			}
		});
	});

	describe("integration scenarios", () => {
		it("handles long text and fallback edge cases", () => {
			// long text
			const text =
				"This is the first sentence. This is the second one! And here comes a third? Finally, the fourth sentence.";
			const result = tokenizeSentences(text);
			strictEqual(Array.isArray(result), true);
			strictEqual(result.length >= 2, true);
			// fallback edge cases: no boundary after punctuation
			const originalSegmenter = Intl.Segmenter;
			delete Intl.Segmenter;
			try {
				deepStrictEqual(tokenizeSentences("no capitals here, just text"), [
					"no capitals here, just text",
				]);
				deepStrictEqual(tokenizeSentences("   "), []);
			} finally {
				Intl.Segmenter = originalSegmenter;
			}
		});
	});
});
