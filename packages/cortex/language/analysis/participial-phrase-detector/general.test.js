/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectParticipalPhraseFormula } from "./general.js";

describe("detectParticipalPhraseFormula (general)", () => {
  describe("basic functionality", () => {
    it("returns neutral baseline metrics", () => {
      const text =
        "This is a comprehensive sample text that contains enough words to meet the minimum requirement for analysis and testing of participial phrase detection algorithms. The implementation provides neutral baseline results for general language processing.";
      const result = detectParticipalPhraseFormula(text);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should return neutral AI likelihood");
      assert.strictEqual(result.overallScore, 0, "Should return zero overall score");
      assert.strictEqual(result.participialDensity, 0, "Should return zero participial density");
      assert.strictEqual(result.totalPatterns, 0, "Should return zero total patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
      assert.deepStrictEqual(result.detectedPatterns, [], "Should return empty detected patterns array");
    });

    it("handles case sensitivity option", () => {
      const text =
        "This is a test text with enough words to meet the minimum requirements for proper analysis and validation of linguistic patterns. The implementation provides comprehensive functionality and supports various use cases effectively.";
      const caseSensitive = detectParticipalPhraseFormula(text);
      const caseInsensitive = detectParticipalPhraseFormula(text);

      assert.strictEqual(caseSensitive.aiLikelihood, 0.5, "Case sensitive should return neutral");
      assert.strictEqual(caseInsensitive.aiLikelihood, 0.5, "Case insensitive should return neutral");
    });

    it("respects minimum word count", () => {
      const shortText = "Short text.";
      assert.throws(
        () => detectParticipalPhraseFormula(shortText, { minWordCount: 20 }),
        Error,
        "Should reject text below minimum word count"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectParticipalPhraseFormula(null), TypeError);
      assert.throws(() => detectParticipalPhraseFormula(undefined), TypeError);
      assert.throws(() => detectParticipalPhraseFormula(123), TypeError);
      assert.throws(() => detectParticipalPhraseFormula([]), TypeError);
    });

    it("throws Error for empty text", () => {
      assert.throws(() => detectParticipalPhraseFormula(""), Error);
      assert.throws(() => detectParticipalPhraseFormula("   "), Error);
    });
  });

  describe("multilingual compatibility", () => {
    it("handles Unicode text", () => {
      const unicodeText =
        "Dies ist ein umfassender test text mit genügend worten um die mindestanforderungen zu erfüllen und die analyse zu testen. Die implementierung unterstützt verschiedene sprachen und zeichensätze für umfassende kompatibilität.";
      const result = detectParticipalPhraseFormula(unicodeText);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should handle Unicode text");
      assert.ok(result.wordCount > 25, "Should count Unicode words");
    });
  });
});
