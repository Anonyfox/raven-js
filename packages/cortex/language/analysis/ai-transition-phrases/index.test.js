/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeAITransitionPhrases as analyzeAITransitionPhrasesGeneral } from "./general.js";
import {
  analyzeAITransitionPhrases,
  analyzeAITransitionPhrasesEnglish,
  analyzeAITransitionPhrasesGerman,
} from "./index.js";

describe("ai-transition-phrases index", () => {
  it("exports all language variants", () => {
    assert.ok(typeof analyzeAITransitionPhrases === "function", "Should export default analyzeAITransitionPhrases");
    assert.ok(typeof analyzeAITransitionPhrasesEnglish === "function", "Should export English variant");
    assert.ok(typeof analyzeAITransitionPhrasesGerman === "function", "Should export German variant");
    assert.ok(typeof analyzeAITransitionPhrasesGeneral === "function", "Should export general variant");
  });

  it("default export is general (language-agnostic) variant", () => {
    // Test that default export is the general variant (neutral baseline)
    const text =
      "Furthermore, this is a comprehensive test text that includes many words to meet the minimum requirement for analysis. Moreover, it contains various transition phrases that should be detected by the algorithm.";
    const defaultResult = analyzeAITransitionPhrases(text);

    assert.strictEqual(defaultResult.aiLikelihood, 0.5, "Default export should return neutral AI likelihood");
    assert.strictEqual(defaultResult.totalPhrases, 0, "Default export should detect no phrases");
    assert.strictEqual(defaultResult.overallScore, 0, "Default export should return zero overall score");
  });

  describe("language variant behavior", () => {
    const testText =
      "This is a comprehensive sample text for testing transition phrases with enough words to meet the minimum requirement for reliable analysis.";

    it("English variant detects phrases", () => {
      const result = analyzeAITransitionPhrasesEnglish(testText);
      assert.ok(typeof result.aiLikelihood === "number", "English variant should return valid result");
      assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
    });

    it("German variant handles German text", () => {
      const germanText =
        "Dies ist ein umfassender test text mit vielen worten um die mindestanforderung für eine zuverlässige analyse zu erfüllen. Und obwohl es eine herausforderung ist, jedoch liefert diese methode zuverlässige ergebnisse in verschiedenen situationen.";
      const result = analyzeAITransitionPhrasesGerman(germanText);
      assert.ok(typeof result.aiLikelihood === "number", "German variant should handle German text");
    });

    it("General variant returns neutral results", () => {
      const result = analyzeAITransitionPhrasesGeneral(testText);
      assert.strictEqual(result.aiLikelihood, 0.5, "General variant should return neutral AI likelihood");
      assert.strictEqual(result.totalPhrases, 0, "General variant should detect no phrases");
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific variants", () => {
      // Test that static imports work (this validates treeshaking setup)
      // The functions are already imported at the top of this file
      assert.ok(typeof analyzeAITransitionPhrasesEnglish === "function", "Should allow direct English access");
      assert.ok(typeof analyzeAITransitionPhrasesGerman === "function", "Should allow direct German access");
      assert.ok(typeof analyzeAITransitionPhrasesGeneral === "function", "Should allow direct general access");
    });
  });
});
