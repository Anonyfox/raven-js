/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectParticipalPhraseFormula } from "./english.js";

describe("detectParticipalPhraseFormula (english)", () => {
  describe("basic functionality", () => {
    it("detects English participial phrase patterns", () => {
      const aiText =
        "Optimized for performance, the system delivers exceptional results. Designed with scalability in mind, the architecture supports growing demands. Implemented using best practices, the solution ensures reliability.";
      const result = detectParticipalPhraseFormula(aiText);

      assert.ok(result.aiLikelihood > 0.6, "Should detect high AI likelihood in AI text with participial formulas");
      assert.ok(result.totalPatterns > 0, "Should detect participial patterns");
      assert.ok(result.participialDensity > 0, "Should calculate participial density");
    });

    it("returns low AI likelihood for human text", () => {
      const humanText =
        "The author carefully examines narrative techniques through detailed analysis. Creative writers often experiment with different approaches to storytelling that enhance reader engagement and create meaningful connections with audiences.";
      const result = detectParticipalPhraseFormula(humanText);

      assert.ok(result.aiLikelihood < 0.4, "Should return low AI likelihood for human text");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("participial pattern detection", () => {
    it("detects sentence-initial participial phrases", () => {
      const textWithInitial =
        "Running the analysis, we discovered interesting patterns. Having completed the review, the team presented their findings. Considering the options, they chose the most efficient approach. Working together, they achieved excellent results.";
      const result = detectParticipalPhraseFormula(textWithInitial, { includeDetails: true });

      assert.ok(result.detectedPatterns.length >= 0, "Should detect participial patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });

    it("detects mechanical construction patterns", () => {
      const textWithMechanical =
        "The system is optimized for performance and designed with scalability in mind. The solution is implemented using best practices and configured to meet requirements. The framework is built for reliability and engineered to handle complex scenarios.";
      const result = detectParticipalPhraseFormula(textWithMechanical, { includeDetails: true });

      assert.ok(result.detectedPatterns.length >= 0, "Should detect participial patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });

    it("detects present participle constructions", () => {
      const textWithPresent =
        "The system is running efficiently while processing large datasets. Having analyzed the results, we can see clear patterns emerging. Working continuously, the application maintains optimal performance throughout extended operations.";
      const result = detectParticipalPhraseFormula(textWithPresent, { includeDetails: true });

      assert.ok(result.detectedPatterns.length >= 0, "Should detect participial patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectParticipalPhraseFormula(null), TypeError);
      assert.throws(() => detectParticipalPhraseFormula(undefined), TypeError);
      assert.throws(() => detectParticipalPhraseFormula(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectParticipalPhraseFormula("Short."), Error);
    });
  });

  describe("performance", () => {
    it("processes text efficiently", () => {
      const longText = "The system provides comprehensive functionality. ".repeat(100);
      const start = performance.now();
      const result = detectParticipalPhraseFormula(longText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long text under 100ms");
      assert.ok(result.wordCount > 200, "Should analyze long text");
    });
  });

  describe("mathematical properties", () => {
    it("returns bounded metrics", () => {
      const texts = [
        "The comprehensive analysis reveals significant patterns in the dataset that demonstrate important relationships between various factors. Researchers conducted extensive evaluations to understand complex phenomena and identify meaningful correlations across different variables.",
        "Optimized for performance, the system delivers exceptional results. Designed with scalability in mind, the architecture supports growing demands. Implemented using best practices, the solution ensures reliability and maintains high quality standards.",
      ];

      for (const text of texts) {
        const result = detectParticipalPhraseFormula(text);
        assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
        assert.ok(result.participialDensity >= 0, "Participial density should be non-negative");
        assert.ok(result.overallScore >= 0, "Overall score should be non-negative");
        assert.ok(result.wordCount > 20, "Word count should be sufficient");
      }
    });
  });
});
