/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as languages from "./index.js";

describe("languages module", () => {
  it("exports analyzeAITransitionPhrases function", () => {
    assert.ok(typeof languages.analyzeAITransitionPhrases === "function", "Should export analyzeAITransitionPhrases");
  });

  it("exports calculateBurstiness function", () => {
    assert.ok(typeof languages.calculateBurstiness === "function", "Should export calculateBurstiness");
  });

  it("exports detectEmDashEpidemic function", () => {
    assert.ok(typeof languages.detectEmDashEpidemic === "function", "Should export detectEmDashEpidemic");
  });

  it("exports approximatePerplexity function", () => {
    assert.ok(typeof languages.approximatePerplexity === "function", "Should export approximatePerplexity");
  });

  it("exports detectParticipalPhraseFormula function", () => {
    assert.ok(
      typeof languages.detectParticipalPhraseFormula === "function",
      "Should export detectParticipalPhraseFormula"
    );
  });

  it("exports detectRuleOfThreeObsession function", () => {
    assert.ok(typeof languages.detectRuleOfThreeObsession === "function", "Should export detectRuleOfThreeObsession");
  });

  it("exports calculateShannonEntropy function", () => {
    assert.ok(typeof languages.calculateShannonEntropy === "function", "Should export calculateShannonEntropy");
  });

  it("exports analyzeNgramRepetition function", () => {
    assert.ok(typeof languages.analyzeNgramRepetition === "function", "Should export analyzeNgramRepetition");
  });

  it("exports analyzeZipfDeviation function", () => {
    assert.ok(typeof languages.analyzeZipfDeviation === "function", "Should export analyzeZipfDeviation");
  });

  it("calculateBurstiness is callable", () => {
    const result = languages.calculateBurstiness("First sentence. Second sentence is longer.");
    assert.ok(typeof result === "number", "Should return a number");
    assert.ok(result >= 0, "Should return non-negative value");
  });

  it("calculateShannonEntropy is callable", () => {
    const result = languages.calculateShannonEntropy("Sample text for entropy calculation.");
    assert.ok(typeof result === "number", "Should return a number");
    assert.ok(result >= 0, "Should return non-negative value");
  });

  it("analyzeNgramRepetition is callable", () => {
    const result = languages.analyzeNgramRepetition("Sample text for analysis.");
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.diversityRatio === "number", "Should return diversity ratio");
    assert.ok(result.diversityRatio >= 0, "Should return non-negative diversity");
  });

  it("analyzeZipfDeviation is callable", () => {
    const result = languages.analyzeZipfDeviation(
      "Sample text for analyzing word frequency distribution patterns and linguistic structures in natural language content."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.deviation === "number", "Should return deviation metric");
    assert.ok(result.deviation >= 0, "Should return non-negative deviation");
  });

  it("analyzeAITransitionPhrases is callable", () => {
    const result = languages.analyzeAITransitionPhrases(
      "Furthermore, this comprehensive analysis utilizes various methodologies to examine substantial patterns and considerable differences in natural language content processing systems."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.aiLikelihood === "number", "Should return AI likelihood");
    assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "Should return valid probability");
  });

  it("detectEmDashEpidemic is callable", () => {
    const result = languages.detectEmDashEpidemic(
      "Furthermore—this comprehensive analysis utilizes various methodologies for modern systems; consequently, substantial patterns (using different approaches) work effectively... across different platforms and environments."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.aiLikelihood === "number", "Should return AI likelihood");
    assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "Should return valid probability");
  });

  it("approximatePerplexity is callable", () => {
    const result = languages.approximatePerplexity(
      "The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate comprehensive insights for informed decision-making processes across diverse organizational contexts."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.aiLikelihood === "number", "Should return AI likelihood");
    assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "Should return valid probability");
    assert.ok(typeof result.overallPerplexity === "number", "Should return perplexity measure");
  });

  it("detectParticipalPhraseFormula is callable", () => {
    const result = languages.detectParticipalPhraseFormula(
      "Optimized for maximum performance, the system delivers exceptional results efficiently. Designed with scalability in mind, the architecture supports growing demands across different platforms and environments."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.aiLikelihood === "number", "Should return AI likelihood");
    assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "Should return valid probability");
  });

  it("detectRuleOfThreeObsession is callable", () => {
    const result = languages.detectRuleOfThreeObsession(
      "There are three main benefits to this systematic approach: efficiency, scalability, and reliability. First, the system improves performance. Second, it reduces costs. Third, it enhances user experience across different platforms and environments."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.aiLikelihood === "number", "Should return AI likelihood");
    assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "Should return valid probability");
  });

  it("detectPerfectGrammar is callable", () => {
    const result = languages.detectPerfectGrammar(
      "The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters for various applications and use cases. This approach ensures maximum efficiency and effectiveness."
    );
    assert.ok(typeof result === "object", "Should return an object");
    assert.ok(typeof result.aiLikelihood === "number", "Should return AI likelihood");
    assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "Should return valid probability");
    assert.ok(typeof result.perfectionScore === "number", "Should return perfection score");
  });
});
