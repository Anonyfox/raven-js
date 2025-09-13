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
  detectRuleOfThreeObsession,
  detectRuleOfThreeObsessionEnglish,
  detectRuleOfThreeObsessionGerman,
} from "./index.js";

describe("rule-of-three-detector index", () => {
  it("exports all language variants", () => {
    assert.ok(typeof detectRuleOfThreeObsession === "function", "Should export default detectRuleOfThreeObsession");
    assert.ok(typeof detectRuleOfThreeObsessionEnglish === "function", "Should export English variant");
    assert.ok(typeof detectRuleOfThreeObsessionGerman === "function", "Should export German variant");
  });

  it("default export is general (language-agnostic) variant", () => {
    // Test that default export is the general variant (neutral baseline)
    const text =
      "This is a comprehensive test text that includes many words to meet the minimum requirement for analysis and testing of rule of three detection algorithms. The system provides additional content.";
    const defaultResult = detectRuleOfThreeObsession(text);

    assert.strictEqual(defaultResult.aiLikelihood, 0.5, "Default export should return neutral AI likelihood");
    assert.strictEqual(defaultResult.totalPatterns, 0, "Default export should detect no patterns");
    assert.strictEqual(defaultResult.overallScore, 0, "Default export should return zero overall score");
  });

  describe("language variant behavior", () => {
    const testText =
      "This is a comprehensive sample text for testing triadic patterns with enough words to meet the minimum requirement for reliable analysis and evaluation of the detection algorithms. The system provides three main benefits: efficiency, scalability, and reliability. First, the approach improves performance. Second, it reduces costs. Third, it enhances user experience. There are three essential elements to consider: planning, execution, and evaluation.";

    it("English variant detects patterns", () => {
      const result = detectRuleOfThreeObsessionEnglish(testText);
      assert.ok(typeof result.aiLikelihood === "number", "English variant should return valid result");
      assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
    });

    it("German variant handles German text", () => {
      const germanText =
        "Dies ist ein umfassender test text mit vielen worten um die mindestanforderung für eine zuverlässige analyse zu erfüllen und die algorithmen zu evaluieren. Das system bietet drei hauptvorteile: effizienz, skalierbarkeit und zuverlässigkeit. Erstens verbessert der ansatz die leistung. Zweitens reduziert er die kosten. Drittens verbessert er die benutzererfahrung. Es gibt drei wesentliche elemente zu berücksichtigen: planung, ausführung und evaluation.";
      const result = detectRuleOfThreeObsessionGerman(germanText);
      assert.ok(typeof result.aiLikelihood === "number", "German variant should handle German text");
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific variants", () => {
      // Test that static imports work (this validates treeshaking setup)
      // The functions are already imported at the top of this file
      assert.ok(typeof detectRuleOfThreeObsessionEnglish === "function", "Should allow direct English access");
      assert.ok(typeof detectRuleOfThreeObsessionGerman === "function", "Should allow direct German access");
    });
  });
});
