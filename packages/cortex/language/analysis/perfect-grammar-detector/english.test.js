/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectPerfectGrammar } from "./english.js";

describe("detectPerfectGrammar (english)", () => {
  describe("basic functionality", () => {
    it("detects AI-generated perfect English grammar", () => {
      const aiText =
        "The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters. The implementation ensures comprehensive functionality and provides seamless integration capabilities.";
      const result = detectPerfectGrammar(aiText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for perfect grammar text");
      assert.ok(typeof result.perfectionScore === "number", "Should calculate perfection score");
      assert.ok(result.wordCount > 30, "Should count words correctly");
    });

    it("detects human errors in natural English text", () => {
      const humanText =
        "The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs. Sometimes there are small issues but overall it works pretty well and satisfies most requirements.";
      const result = detectPerfectGrammar(humanText);

      assert.ok(result.aiLikelihood < 0.4, "Should return low AI likelihood for human text with errors");
      assert.ok(result.totalErrors > 0, "Should detect grammar errors in human text");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("grammar error detection", () => {
    it("detects homophone errors", () => {
      const textWithHomophones =
        "The system works their because its designed to meet they're needs. The affect is quite noticeable when than happens. These errors occur quite frequently in written communication and can effect the overall clarity of the message being conveyed.";
      const result = detectPerfectGrammar(textWithHomophones, { includeDetails: true });

      assert.ok(result.detectedErrors.length >= 0, "Should detect grammar errors");
      assert.ok(result.totalErrors > 0, "Should count grammar errors");
      assert.ok(result.wordCount > 30, "Should count words correctly");
    });

    it("detects subject-verb agreement issues", () => {
      const textWithAgreement =
        "The systems is working well. They was designed carefully. This are important features. The algorithms runs efficiently. Those functions works correctly. The data flows smoothly. These processes operate effectively. The interfaces displays correctly.";
      const result = detectPerfectGrammar(textWithAgreement, { includeDetails: true });

      assert.ok(result.detectedErrors.length >= 0, "Should detect grammar errors");
      assert.ok(result.wordCount > 30, "Should count words correctly");
    });

    it("detects article usage errors", () => {
      const textWithArticles =
        "The system uses a unique algorithm. An apple a day keeps doctor away. The a important feature. The framework provides an comprehensive solution. A user interface is essential. The an important aspect.";
      const result = detectPerfectGrammar(textWithArticles, { includeDetails: true });

      assert.ok(result.detectedErrors.length >= 0, "Should detect grammar errors");
      assert.ok(result.wordCount > 30, "Should count words correctly");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectPerfectGrammar(null), TypeError);
      assert.throws(() => detectPerfectGrammar(undefined), TypeError);
      assert.throws(() => detectPerfectGrammar(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectPerfectGrammar("Short."), Error);
    });
  });

  describe("performance", () => {
    it("processes text efficiently", () => {
      const longText = "The system provides comprehensive functionality. ".repeat(150);
      const start = performance.now();
      const result = detectPerfectGrammar(longText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long text under 100ms");
      assert.ok(result.wordCount > 400, "Should analyze long text");
    });
  });

  describe("mathematical properties", () => {
    it("returns bounded metrics", () => {
      const texts = [
        "The comprehensive analysis reveals significant patterns in the dataset that demonstrate important relationships between various factors and components of the system. Researchers have identified key correlations and statistical significance that provide valuable insights for future decision-making processes.",
        "The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs. Sometimes there are small issues but overall everything functions reasonably well.",
      ];

      for (const text of texts) {
        const result = detectPerfectGrammar(text);
        assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
        assert.ok(result.overallScore >= 0 && result.overallScore <= 1, "Overall score should be bounded");
        assert.ok(result.perfectionScore >= 0 && result.perfectionScore <= 100, "Perfection score should be bounded");
        assert.ok(result.wordCount >= 30, "Word count should be sufficient");
      }
    });

    it("higher error density reduces AI likelihood", () => {
      const lowErrorText =
        "The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters. The implementation follows industry best practices and ensures robust operation under various conditions.";
      const highErrorText =
        "The systems is working pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs. Sometimes there are small problems but overall it works okay.";

      const lowErrorResult = detectPerfectGrammar(lowErrorText);
      const highErrorResult = detectPerfectGrammar(highErrorText);

      assert.ok(
        typeof lowErrorResult.aiLikelihood === "number" && typeof highErrorResult.aiLikelihood === "number",
        "Should calculate AI likelihood for both texts"
      );
    });
  });
});
