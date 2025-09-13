/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectEmDashEpidemic } from "./general.js";

describe("detectEmDashEpidemic (general)", () => {
  describe("basic functionality", () => {
    it("returns neutral baseline metrics", () => {
      const text =
        "This is a comprehensive sample text that contains enough words to meet the minimum requirement for analysis and testing of punctuation overuse patterns. The system provides additional content.";
      const result = detectEmDashEpidemic(text);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should return neutral AI likelihood");
      assert.strictEqual(result.overallScore, 0.5, "Should return neutral overall score");
      assert.strictEqual(result.punctuationDensity, 50, "Should return neutral punctuation density");
      assert.strictEqual(result.totalPunctuation, 0, "Should return zero total punctuation");
      assert.ok(result.wordCount > 20, "Should count words correctly");
      assert.deepStrictEqual(result.detectedOveruse, [], "Should return empty detected overuse array");
    });

    it("respects minimum word count", () => {
      const shortText = "Short text.";
      assert.throws(
        () => detectEmDashEpidemic(shortText, { minWordCount: 20 }),
        Error,
        "Should reject text below minimum word count"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectEmDashEpidemic(null), TypeError);
      assert.throws(() => detectEmDashEpidemic(undefined), TypeError);
      assert.throws(() => detectEmDashEpidemic(123), TypeError);
      assert.throws(() => detectEmDashEpidemic([]), TypeError);
    });

    it("throws Error for empty text", () => {
      assert.throws(() => detectEmDashEpidemic(""), Error);
      assert.throws(() => detectEmDashEpidemic("   "), Error);
    });
  });

  describe("multilingual compatibility", () => {
    it("handles Unicode text", () => {
      const unicodeText =
        "Dies ist ein umfassender test text mit genügend worten um die mindestanforderungen zu erfüllen und die analyse zu testen. Das system bietet zusätzliche funktionen.";
      const result = detectEmDashEpidemic(unicodeText);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should handle Unicode text");
      assert.ok(result.wordCount > 20, "Should count Unicode words");
    });
  });
});
