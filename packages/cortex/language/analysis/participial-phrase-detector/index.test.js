/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectParticipalPhraseFormula,
  detectParticipalPhraseFormulaEnglish,
  detectParticipalPhraseFormulaGerman,
} from "./index.js";

describe("participial-phrase-detector index", () => {
  it("exports all language variants", () => {
    assert.ok(
      typeof detectParticipalPhraseFormula === "function",
      "Should export default detectParticipalPhraseFormula"
    );
    assert.ok(typeof detectParticipalPhraseFormulaEnglish === "function", "Should export English variant");
    assert.ok(typeof detectParticipalPhraseFormulaGerman === "function", "Should export German variant");
  });

  it("default export is general (language-agnostic) variant", () => {
    // Test that default export is the general variant (neutral baseline)
    const text =
      "This is a comprehensive test text that includes many words to meet the minimum requirement for analysis and testing of participial phrase detection algorithms. The system provides additional content to ensure sufficient length for proper evaluation of the detection mechanisms.";
    const defaultResult = detectParticipalPhraseFormula(text);

    assert.strictEqual(defaultResult.aiLikelihood, 0.5, "Default export should return neutral AI likelihood");
    assert.strictEqual(defaultResult.totalPatterns, 0, "Default export should detect no patterns");
    assert.strictEqual(defaultResult.overallScore, 0, "Default export should return zero overall score");
  });

  describe("language variant behavior", () => {
    const testText =
      "This is a comprehensive sample text for testing participial phrase patterns with enough words to meet the minimum requirement for reliable analysis and evaluation of the detection algorithms.";

    it("English variant detects patterns", () => {
      const result = detectParticipalPhraseFormulaEnglish(testText);
      assert.ok(typeof result.aiLikelihood === "number", "English variant should return valid result");
      assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
    });

    it("German variant handles German text", () => {
      const germanText =
        "Dies ist ein umfassender test text mit vielen worten um die mindestanforderung für eine zuverlässige analyse zu erfüllen und die algorithmen zu evaluieren. Das system bietet zusätzliche funktionen für die verbesserung der analyse und ermöglicht detaillierte auswertungen.";
      const result = detectParticipalPhraseFormulaGerman(germanText);
      assert.ok(typeof result.aiLikelihood === "number", "German variant should handle German text");
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific variants", () => {
      // Test that static imports work (this validates treeshaking setup)
      // The functions are already imported at the top of this file
      assert.ok(typeof detectParticipalPhraseFormulaEnglish === "function", "Should allow direct English access");
      assert.ok(typeof detectParticipalPhraseFormulaGerman === "function", "Should allow direct German access");
    });
  });
});
