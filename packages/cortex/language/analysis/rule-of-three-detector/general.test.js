/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectRuleOfThreeObsession } from "./general.js";

describe("detectRuleOfThreeObsession (general)", () => {
  describe("basic functionality", () => {
    it("returns neutral baseline metrics", () => {
      const text =
        "This is a comprehensive sample text that contains enough words to meet the minimum requirement for analysis and testing of rule of three detection algorithms. The system provides additional content to ensure sufficient length.";
      const result = detectRuleOfThreeObsession(text);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should return neutral AI likelihood");
      assert.strictEqual(result.overallScore, 0, "Should return zero overall score");
      assert.strictEqual(result.triadicDensity, 0, "Should return zero triadic density");
      assert.strictEqual(result.totalPatterns, 0, "Should return zero total patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
      assert.deepStrictEqual(result.detectedPatterns, [], "Should return empty detected patterns array");
    });

    it("handles case sensitivity option", () => {
      const text = "This is a test text with enough words to meet the minimum requirements for analysis.";
      const caseSensitive = detectRuleOfThreeObsession(text, { minWordCount: 15 });
      const caseInsensitive = detectRuleOfThreeObsession(text, { minWordCount: 15 });

      assert.strictEqual(caseSensitive.aiLikelihood, 0.5, "Case sensitive should return neutral");
      assert.strictEqual(caseInsensitive.aiLikelihood, 0.5, "Case insensitive should return neutral");
    });

    it("respects minimum word count", () => {
      const shortText = "Short text.";
      assert.throws(
        () => detectRuleOfThreeObsession(shortText, { minWordCount: 30 }),
        Error,
        "Should reject text below minimum word count"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectRuleOfThreeObsession(null), TypeError);
      assert.throws(() => detectRuleOfThreeObsession(undefined), TypeError);
      assert.throws(() => detectRuleOfThreeObsession(123), TypeError);
      assert.throws(() => detectRuleOfThreeObsession([]), TypeError);
    });

    it("throws Error for empty text", () => {
      assert.throws(() => detectRuleOfThreeObsession(""), Error);
      assert.throws(() => detectRuleOfThreeObsession("   "), Error);
    });
  });

  describe("multilingual compatibility", () => {
    it("handles Unicode text", () => {
      const unicodeText =
        "Dies ist ein umfassender test text mit genügend worten um die mindestanforderungen zu erfüllen und die analyse zu testen. Das system bietet zusätzliche funktionen wie erweiterte analyse und verbesserte benutzerfreundlichkeit. Unicode zeichen funktionieren einwandfrei.";
      const result = detectRuleOfThreeObsession(unicodeText);

      assert.strictEqual(result.aiLikelihood, 0.5, "Should handle Unicode text");
      assert.ok(result.wordCount > 25, "Should count Unicode words");
    });
  });
});
