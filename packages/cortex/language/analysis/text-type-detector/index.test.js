/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectTextType, detectTextTypeEnglish, detectTextTypeGerman } from "./index.js";

describe("text-type-detector index", () => {
  it("exports all language variants", () => {
    assert.ok(typeof detectTextType === "function", "Should export default detectTextType");
    assert.ok(typeof detectTextTypeEnglish === "function", "Should export English variant");
    assert.ok(typeof detectTextTypeGerman === "function", "Should export German variant");
  });

  it("default export is general (language-agnostic) variant", () => {
    const text =
      "This is a comprehensive test text that includes many words to meet the minimum requirement for analysis and testing of text type detection algorithms. The system provides additional content.";
    const defaultResult = detectTextType(text);

    assert.strictEqual(defaultResult.type, "unknown", "Default export should return unknown type");
    assert.strictEqual(defaultResult.confidence, 0.1, "Default export should return low confidence");
    assert.deepStrictEqual(defaultResult.scores, {}, "Default export should return empty scores");
  });

  describe("language variant behavior", () => {
    const testText =
      "This is a comprehensive sample text for testing text type classification patterns with enough words to meet the minimum requirement for reliable analysis and evaluation of the detection algorithms.";

    it("English variant classifies text", () => {
      const result = detectTextTypeEnglish(testText);
      assert.ok(typeof result.type === "string", "English variant should return valid result");
      assert.ok(result.confidence >= 0 && result.confidence <= 1, "Confidence should be bounded");
      assert.ok(Object.keys(result.scores).length > 0, "Should have category scores");
    });

    it("German variant handles German text", () => {
      const germanText =
        "Dies ist ein umfassender test text mit vielen worten um die mindestanforderung für eine zuverlässige analyse zu erfüllen und die algorithmen zu evaluieren.";
      const result = detectTextTypeGerman(germanText);
      assert.ok(typeof result.type === "string", "German variant should handle German text");
      assert.ok(typeof result.confidence === "number", "Should return confidence for German");
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific variants", () => {
      // Test that static imports work (this validates treeshaking setup)
      assert.ok(typeof detectTextTypeEnglish === "function", "Should allow direct English access");
      assert.ok(typeof detectTextTypeGerman === "function", "Should allow direct German access");
    });
  });
});
