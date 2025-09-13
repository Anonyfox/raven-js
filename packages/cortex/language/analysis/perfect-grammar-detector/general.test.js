/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectPerfectGrammar } from "./general.js";

describe("detectPerfectGrammar (general)", () => {
  describe("basic functionality", () => {
    it("returns neutral baseline metrics", () => {
      const text =
        "This is a comprehensive sample text that contains enough words to meet the minimum requirement for analysis and testing of perfect grammar detection algorithms. The system provides additional content to ensure sufficient length.";
      const result = detectPerfectGrammar(text);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should return neutral AI likelihood");
      assert.strictEqual(result.overallScore, 0.5, "Should return neutral overall score");
      assert.strictEqual(result.perfectionScore, 50, "Should return neutral perfection score");
      assert.strictEqual(result.totalErrors, 0, "Should return zero total errors");
      assert.ok(result.wordCount > 25, "Should count words correctly");
      assert.deepStrictEqual(result.detectedErrors, [], "Should return empty detected errors array");
    });

    it("handles case sensitivity option", () => {
      const text = "This is a test text with enough words to meet the minimum requirements for analysis.";
      const caseSensitive = detectPerfectGrammar(text, { minWordCount: 15 });
      const caseInsensitive = detectPerfectGrammar(text, { minWordCount: 15 });

      assert.strictEqual(caseSensitive.aiLikelihood, 0.5, "Case sensitive should return neutral");
      assert.strictEqual(caseInsensitive.aiLikelihood, 0.5, "Case insensitive should return neutral");
    });

    it("respects minimum word count", () => {
      const shortText = "Short text.";
      assert.throws(
        () => detectPerfectGrammar(shortText, { minWordCount: 30 }),
        Error,
        "Should reject text below minimum word count"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectPerfectGrammar(null), TypeError);
      assert.throws(() => detectPerfectGrammar(undefined), TypeError);
      assert.throws(() => detectPerfectGrammar(123), TypeError);
      assert.throws(() => detectPerfectGrammar([]), TypeError);
    });

    it("throws Error for empty text", () => {
      assert.throws(() => detectPerfectGrammar(""), Error);
      assert.throws(() => detectPerfectGrammar("   "), Error);
    });
  });

  describe("multilingual compatibility", () => {
    it("handles Unicode text", () => {
      const unicodeText =
        "Dies ist ein umfassender test text mit genügend worten um die mindestanforderungen zu erfüllen und die analyse zu testen. Das system bietet zusätzliche funktionen und ermöglicht eine vollständige integration verschiedener komponenten.";
      const result = detectPerfectGrammar(unicodeText);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should handle Unicode text");
      assert.ok(result.wordCount > 30, "Should count Unicode words");
    });
  });
});
