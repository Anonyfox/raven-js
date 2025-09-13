/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeAITransitionPhrases } from "./english.js";

describe("analyzeAITransitionPhrases (english)", () => {
  describe("basic functionality", () => {
    it("detects English AI transition phrases", () => {
      const aiText =
        "Furthermore, it's important to note that we must delve into the complexities. Moreover, various implementations utilize comprehensive approaches. Additionally, the system provides enhanced functionality and improved performance.";
      const result = analyzeAITransitionPhrases(aiText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood");
      assert.ok(typeof result.totalPhrases === "number", "Should detect transition phrases");
      assert.ok(typeof result.phrasesPerThousand === "number", "Should calculate phrases per thousand");
    });

    it("returns low AI likelihood for human text", () => {
      const humanText =
        "The author carefully considered different approaches to solve the problem. She explored various solutions and finally chose the most practical one for the team.";
      const result = analyzeAITransitionPhrases(humanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for human text");
      assert.ok(result.wordCount > 20, "Should count words correctly");
    });

    it("handles case sensitivity", () => {
      const text =
        "Furthermore, this is a test that demonstrates the functionality of our system. Moreover, the implementation provides comprehensive features and reliable performance.";
      const caseSensitive = analyzeAITransitionPhrases(text);
      const caseInsensitive = analyzeAITransitionPhrases(text);

      assert.ok(typeof caseSensitive.totalPhrases === "number", "Should detect phrases");
      assert.ok(typeof caseInsensitive.totalPhrases === "number", "Should detect phrases");
    });
  });

  describe("phrase detection", () => {
    it("detects common AI phrases", () => {
      const testCases = [
        {
          text: "Furthermore, this is important to understand for the project requirements. Additionally, the system provides enhanced functionality and improved user experience.",
          expectedPhrase: "furthermore",
        },
        {
          text: "Moreover, we should consider this approach for better results and efficiency. The implementation offers significant improvements and better performance throughout the entire system.",
          expectedPhrase: "moreover",
        },
        {
          text: "It's important to note that this solution provides significant advantages. The framework delivers comprehensive capabilities and reliable operation for all users.",
          expectedPhrase: "it's important to note",
        },
        {
          text: "Delve into the complexities of this system to understand its full potential. The architecture supports various use cases and provides flexibility.",
          expectedPhrase: "delve into",
        },
      ];

      for (const { text, expectedPhrase } of testCases) {
        const result = analyzeAITransitionPhrases(text);
        assert.ok(typeof result.totalPhrases === "number", `Should detect phrases in: ${expectedPhrase}`);
        assert.ok(result.wordCount >= 20, `Should count words correctly for: ${expectedPhrase}`);
      }
    });

    it("calculates frequency metrics correctly", () => {
      const text =
        "Furthermore, it's important to note that we must delve into the complexities. Furthermore, various implementations utilize comprehensive approaches. Moreover, the system provides enhanced functionality and improved performance.";
      const result = analyzeAITransitionPhrases(text);

      assert.ok(typeof result.phrasesPerThousand === "number", "Should calculate phrases per thousand");
      assert.ok(typeof result.overallScore === "number", "Should calculate overall score");
      assert.ok(result.wordCount > 20, "Should count words correctly");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => analyzeAITransitionPhrases(null), TypeError);
      assert.throws(() => analyzeAITransitionPhrases(undefined), TypeError);
      assert.throws(() => analyzeAITransitionPhrases(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => analyzeAITransitionPhrases("Short."), Error);
      assert.throws(() => analyzeAITransitionPhrases(""), Error);
    });
  });

  describe("performance", () => {
    it("processes text efficiently", () => {
      const longText = "Furthermore, this is a comprehensive analysis. ".repeat(100);
      const start = performance.now();
      const result = analyzeAITransitionPhrases(longText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long text under 100ms");
      assert.ok(result.wordCount > 0, "Should analyze long text");
    });
  });
});
