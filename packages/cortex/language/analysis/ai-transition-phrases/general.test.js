/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeAITransitionPhrases } from "./general.js";

describe("analyzeAITransitionPhrases (general)", () => {
  describe("basic functionality", () => {
    it("returns neutral baseline metrics", () => {
      const text =
        "This is a sample text with some words that should be analyzed for transition phrases. The implementation provides neutral baseline results for general language processing.";
      const result = analyzeAITransitionPhrases(text);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should return neutral AI likelihood");
      assert.strictEqual(result.overallScore, 0, "Should return zero overall score");
      assert.strictEqual(result.phrasesPerThousand, 0, "Should return zero phrases per thousand");
      assert.strictEqual(result.totalPhrases, 0, "Should return zero total phrases");
      assert.ok(result.wordCount > 20, "Should count words correctly");
      assert.deepStrictEqual(result.detectedPhrases, [], "Should return empty detected phrases array");
    });

    it("handles case sensitivity option", () => {
      const text =
        "This is a test text that demonstrates the functionality of our system. The implementation works correctly in all scenarios properly.";
      const caseSensitive = analyzeAITransitionPhrases(text);
      const caseInsensitive = analyzeAITransitionPhrases(text, { caseSensitive: false });

      assert.strictEqual(caseSensitive.aiLikelihood, 0.5, "Case sensitive should return neutral");
      assert.strictEqual(caseInsensitive.aiLikelihood, 0.5, "Case insensitive should return neutral");
    });

    it("respects minimum word count", () => {
      const shortText = "Short text.";
      assert.throws(
        () => analyzeAITransitionPhrases(shortText, { minWordCount: 10 }),
        Error,
        "Should reject text below minimum word count"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => analyzeAITransitionPhrases(null), TypeError);
      assert.throws(() => analyzeAITransitionPhrases(undefined), TypeError);
      assert.throws(() => analyzeAITransitionPhrases(123), TypeError);
      assert.throws(() => analyzeAITransitionPhrases([]), TypeError);
    });

    it("throws Error for empty text", () => {
      assert.throws(() => analyzeAITransitionPhrases(""), Error);
      assert.throws(() => analyzeAITransitionPhrases("   "), Error);
    });
  });

  describe("multilingual compatibility", () => {
    it("handles Unicode text", () => {
      const unicodeText =
        "Это тест на русском языке с некоторыми словами. Система поддерживает различные языки и кодировки для полноценной совместимости. Приложение работает эффективно и надежно в различных условиях.";
      const result = analyzeAITransitionPhrases(unicodeText);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should handle Unicode text");
      assert.ok(result.wordCount > 20, "Should count Unicode words");
    });
  });
});
