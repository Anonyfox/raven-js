/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectEmDashEpidemic, detectEmDashEpidemicEnglish, detectEmDashEpidemicGerman } from "./index.js";

describe("em-dash-detector index", () => {
  it("exports all language variants", () => {
    assert.ok(typeof detectEmDashEpidemic === "function", "Should export default detectEmDashEpidemic");
    assert.ok(typeof detectEmDashEpidemicEnglish === "function", "Should export English variant");
    assert.ok(typeof detectEmDashEpidemicGerman === "function", "Should export German variant");
  });

  it("default export is general (language-agnostic) variant", () => {
    const text =
      "This is a comprehensive test text that includes many words to meet the minimum requirement for analysis and testing of punctuation overuse patterns. The system provides additional content.";
    const defaultResult = detectEmDashEpidemic(text);

    assert.strictEqual(defaultResult.aiLikelihood, 0.5, "Default export should return neutral AI likelihood");
    assert.strictEqual(defaultResult.totalPunctuation, 0, "Default export should detect no punctuation overuse");
    assert.strictEqual(
      defaultResult.punctuationDensity,
      50,
      "Default export should return neutral punctuation density"
    );
  });

  describe("language variant behavior", () => {
    const testText =
      "This is a comprehensive sample text for testing punctuation overuse patterns with enough words to meet the minimum requirement for reliable analysis and evaluation of the detection algorithms.";

    it("English variant detects patterns", () => {
      const result = detectEmDashEpidemicEnglish(testText);
      assert.ok(typeof result.aiLikelihood === "number", "English variant should return valid result");
      assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
      assert.ok(typeof result.punctuationDensity === "number", "Should return punctuation density");
    });

    it("German variant handles German text", () => {
      const germanText =
        "Dies ist ein umfassender test text mit vielen worten um die mindestanforderung für eine zuverlässige analyse zu erfüllen und die algorithmen zu evaluieren.";
      const result = detectEmDashEpidemicGerman(germanText);
      assert.ok(typeof result.aiLikelihood === "number", "German variant should handle German text");
      assert.ok(typeof result.punctuationDensity === "number", "Should return punctuation density for German");
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific variants", () => {
      // Test that static imports work (this validates treeshaking setup)
      assert.ok(typeof detectEmDashEpidemicEnglish === "function", "Should allow direct English access");
      assert.ok(typeof detectEmDashEpidemicGerman === "function", "Should allow direct German access");
    });
  });
});
