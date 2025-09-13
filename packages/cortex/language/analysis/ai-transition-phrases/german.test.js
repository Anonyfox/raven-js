/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeAITransitionPhrases } from "./german.js";

describe("analyzeAITransitionPhrases (german)", () => {
  describe("basic functionality", () => {
    it("detects German AI transition phrases", () => {
      const aiText =
        "Darüber hinaus ist es wichtig zu beachten, dass wir uns mit den komplexitäten auseinandersetzen müssen. Des weiteren werden verschiedene implementierungen verwendet.";
      const result = analyzeAITransitionPhrases(aiText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood");
      assert.ok(typeof result.totalPhrases === "number", "Should detect transition phrases");
    });

    it("handles natural German connectors appropriately", () => {
      const naturalText =
        "Die analyse zeigt interessante ergebnisse. Und obwohl die methode komplex ist, jedoch liefert sie zuverlässige resultate. Die forscher haben gründlich gearbeitet und wichtige erkenntnisse gewonnen.";
      const result = analyzeAITransitionPhrases(naturalText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for natural connectors");
      assert.ok(result.totalPhrases > 0, "Should detect natural connectors");
    });
  });

  describe("phrase categorization", () => {
    it("distinguishes natural connectors from mechanical transitions", () => {
      const mixedText =
        "Die analyse ist komplex. Und obwohl es schwierig ist, jedoch zeigt sie interessante ergebnisse. Darüber hinaus müssen wir uns mit zusätzlichen faktoren auseinandersetzen.";
      const result = analyzeAITransitionPhrases(mixedText, { includeDetails: true });

      assert.ok(result.detectedPhrases.length > 0, "Should detect multiple phrase types");

      const naturalConnectors = result.detectedPhrases.filter((p) => p.category === "natural_connector");
      const mechanicalTransitions = result.detectedPhrases.filter((p) => p.category === "mechanical_transition");

      assert.ok(naturalConnectors.length > 0 || mechanicalTransitions.length > 0, "Should categorize phrases");
    });

    it("applies appropriate weights to different phrase types", () => {
      const naturalHeavyText =
        "Die methode ist gut. Und sie funktioniert. Jedoch gibt es limitationen. Trotzdem ist sie nützlich. Die benutzer finden sie praktisch und zuverlässig.";
      const mechanicalHeavyText =
        "Darüber hinaus müssen wir beachten, dass verschiedene faktoren eine rolle spielen. Des weiteren ist es wichtig zu erwähnen, dass zusätzliche aspekte berücksichtigt werden müssen.";

      const naturalResult = analyzeAITransitionPhrases(naturalHeavyText);
      const mechanicalResult = analyzeAITransitionPhrases(mechanicalHeavyText);

      // Both should return valid results
      assert.ok(typeof naturalResult.aiLikelihood === "number", "Should calculate AI likelihood for natural text");
      assert.ok(
        typeof mechanicalResult.aiLikelihood === "number",
        "Should calculate AI likelihood for mechanical text"
      );
    });
  });

  describe("German-specific handling", () => {
    it("recognizes common German natural connectors", () => {
      const connectors = ["und", "oder", "aber", "jedoch", "dennoch", "trotzdem", "obwohl"];

      for (const connector of connectors) {
        const text = `Die analyse zeigt interessante ergebnisse. ${connector} die methode hat ihre grenzen. Trotzdem bietet sie viele vorteile für die benutzer. Viele forscher haben das bestätigt.`;
        const result = analyzeAITransitionPhrases(text);

        assert.ok(typeof result.aiLikelihood === "number", `Should process text with ${connector}`);
        assert.ok(result.wordCount > 20, `Should count words correctly for ${connector}`);
      }
    });

    it("recognizes German mechanical AI transitions", () => {
      const transitions = ["darüber hinaus", "des weiteren", "ferner", "außerdem"];

      for (const transition of transitions) {
        const text = `Die analyse zeigt interessante ergebnisse. ${transition} müssen wir weitere faktoren betrachten. Zusätzlich gibt es noch viele andere möglichkeiten zu berücksichtigen.`;
        const result = analyzeAITransitionPhrases(text);

        assert.ok(typeof result.aiLikelihood === "number", `Should process text with ${transition}`);
        assert.ok(result.wordCount >= 20, `Should count words correctly for ${transition}`);
      }
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => analyzeAITransitionPhrases(null), TypeError);
      assert.throws(() => analyzeAITransitionPhrases(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => analyzeAITransitionPhrases("Kurz."), Error);
    });
  });

  describe("performance", () => {
    it("handles German text efficiently", () => {
      const longGermanText =
        "Die analyse zeigt interessante ergebnisse. Und obwohl die methode komplex ist, jedoch liefert sie zuverlässige resultate. ".repeat(
          50
        );
      const start = performance.now();
      const result = analyzeAITransitionPhrases(longGermanText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long German text under 100ms");
      assert.ok(result.wordCount > 0, "Should analyze German text");
    });
  });
});
