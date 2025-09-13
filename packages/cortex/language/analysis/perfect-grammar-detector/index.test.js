/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectPerfectGrammar, detectPerfectGrammarEnglish, detectPerfectGrammarGerman } from "./index.js";

describe("perfect-grammar-detector index", () => {
  it("exports all language variants", () => {
    assert.ok(typeof detectPerfectGrammar === "function", "Should export default detectPerfectGrammar");
    assert.ok(typeof detectPerfectGrammarEnglish === "function", "Should export English variant");
    assert.ok(typeof detectPerfectGrammarGerman === "function", "Should export German variant");
  });

  it("default export is general (language-agnostic) variant", () => {
    // Test that default export is the general variant (neutral baseline)
    const text =
      "This is a comprehensive test text that includes many words to meet the minimum requirement for analysis and testing of perfect grammar detection algorithms. The system provides additional content with various examples and patterns that help ensure proper functionality across different scenarios and use cases. Multiple sentences are included here to provide sufficient length for reliable testing purposes.";
    const defaultResult = detectPerfectGrammar(text);

    assert.strictEqual(defaultResult.aiLikelihood, 0.5, "Default export should return neutral AI likelihood");
    assert.strictEqual(defaultResult.totalErrors, 0, "Default export should detect no errors");
    assert.strictEqual(defaultResult.perfectionScore, 50, "Default export should return neutral perfection score");
  });

  describe("language variant behavior", () => {
    const testText =
      "This is a comprehensive sample text for testing perfect grammar patterns with enough words to meet the minimum requirement for reliable analysis and evaluation of the detection algorithms. The system includes various features and capabilities that work together seamlessly. Different approaches can be taken depending on specific requirements and constraints. Multiple examples demonstrate the effectiveness of the implementation.";

    it("English variant detects patterns", () => {
      const result = detectPerfectGrammarEnglish(testText);
      assert.ok(typeof result.aiLikelihood === "number", "English variant should return valid result");
      assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
      assert.ok(typeof result.perfectionScore === "number", "Should return perfection score");
    });

    it("German variant handles German text", () => {
      const germanText =
        "Dies ist ein umfassender test text mit vielen worten um die mindestanforderung für eine zuverlässige analyse zu erfüllen und die algorithmen zu evaluieren. Das system bietet verschiedene funktionen und möglichkeiten die zusammen nahtlos arbeiten. Verschiedene ansätze können je nach spezifischen anforderungen und einschränkungen gewählt werden. Mehrere beispiele zeigen die effektivitat der implementierung.";
      const result = detectPerfectGrammarGerman(germanText);
      assert.ok(typeof result.aiLikelihood === "number", "German variant should handle German text");
      assert.ok(typeof result.perfectionScore === "number", "Should return perfection score for German");
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific variants", () => {
      // Test that static imports work (this validates treeshaking setup)
      // The functions are already imported at the top of this file
      assert.ok(typeof detectPerfectGrammarEnglish === "function", "Should allow direct English access");
      assert.ok(typeof detectPerfectGrammarGerman === "function", "Should allow direct German access");
    });
  });
});
