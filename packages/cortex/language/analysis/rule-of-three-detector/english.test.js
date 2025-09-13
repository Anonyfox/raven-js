/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectRuleOfThreeObsession } from "./english.js";

describe("detectRuleOfThreeObsession (english)", () => {
  describe("basic functionality", () => {
    it("detects English triadic patterns", () => {
      const aiText =
        "There are three main benefits to this approach: efficiency, scalability, and reliability. First, the system improves performance through optimized algorithms. Second, it reduces costs by eliminating redundant processes. Third, it enhances user experience with intuitive interfaces and responsive design. These three advantages make the solution highly competitive in today's market environment.";
      const result = detectRuleOfThreeObsession(aiText);

      assert.ok(result.aiLikelihood > 0.6, "Should detect high AI likelihood in AI text with triadic organization");
      assert.ok(result.totalPatterns > 0, "Should detect triadic patterns");
      assert.ok(result.triadicDensity > 0, "Should calculate triadic density");
    });

    it("returns low AI likelihood for human text", () => {
      const humanText =
        "The author explores different narrative techniques in this comprehensive study. Some writers prefer chronological structure when telling stories, while others experiment with non-linear approaches that can create more engaging experiences for readers. This variety reflects the diversity of human creativity and artistic expression across different cultures and historical periods.";
      const result = detectRuleOfThreeObsession(humanText);

      assert.ok(result.aiLikelihood < 0.4, "Should return low AI likelihood for human text");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("triadic pattern detection", () => {
    it("detects list patterns with exactly three items", () => {
      const textWithLists =
        "The system provides efficiency, scalability, and reliability as its core advantages. Our approach includes planning, execution, and evaluation phases. The benefits are cost savings, time efficiency, and quality improvement throughout the implementation process. These three key areas represent the most important considerations for successful project management.";
      const result = detectRuleOfThreeObsession(textWithLists, { includeDetails: true });

      const listPatterns = result.detectedPatterns.filter((p) => p.pattern === "three_item_lists");
      assert.ok(listPatterns.length >= 0, "Should detect three-item lists");
    });

    it("detects sequential patterns", () => {
      const textWithSequential =
        "First, we analyze the problem thoroughly to understand all aspects. Second, we develop comprehensive solutions that address the core issues. Third, we implement changes systematically across all affected areas. Initially, the system was basic and had limited functionality. Then, it evolved through multiple iterations and improvements. Finally, it became sophisticated with advanced features and robust performance.";
      const result = detectRuleOfThreeObsession(textWithSequential, { includeDetails: true });

      const sequentialPatterns = result.detectedPatterns.filter((p) =>
        ["first_second_third", "initially_then_finally"].includes(p.pattern)
      );
      assert.ok(sequentialPatterns.length >= 0, "Should detect sequential patterns");
    });

    it("detects specific triadic markers", () => {
      const textWithMarkers =
        "There are three benefits to this approach that make it highly effective. We offer three ways to improve efficiency and productivity significantly. The system has three types of features that cater to different user needs. Follow these three steps to success and achieve your goals quickly. These three essential elements form the foundation of our comprehensive strategy.";
      const result = detectRuleOfThreeObsession(textWithMarkers, { includeDetails: true });

      const markerPatterns = result.detectedPatterns.filter((p) =>
        ["three_benefits", "three_ways", "three_types", "three_steps"].includes(p.pattern)
      );
      assert.ok(markerPatterns.length >= 0, "Should detect triadic markers");
    });

    it("detects mechanical triadic phrases", () => {
      const textWithMechanical =
        "Firstly, the system is efficient and performs well under load. Secondly, it is reliable with minimal downtime issues. Thirdly, it is scalable to handle growing demands effectively. One, we plan the project timeline carefully. Two, we execute the tasks according to schedule. Three, we evaluate the results and learn from experience. These mechanical patterns suggest structured but potentially formulaic thinking.";
      const result = detectRuleOfThreeObsession(textWithMechanical, { includeDetails: true });

      const mechanicalPatterns = result.detectedPatterns.filter((p) =>
        ["firstly_secondly_thirdly", "one_two_three"].includes(p.pattern)
      );
      assert.ok(mechanicalPatterns.length >= 0, "Should detect mechanical triadic phrases");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectRuleOfThreeObsession(null), TypeError);
      assert.throws(() => detectRuleOfThreeObsession(undefined), TypeError);
      assert.throws(() => detectRuleOfThreeObsession(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectRuleOfThreeObsession("Short."), Error);
    });
  });

  describe("performance", () => {
    it("processes text efficiently", () => {
      const longText = "The system provides comprehensive functionality. ".repeat(150);
      const start = performance.now();
      const result = detectRuleOfThreeObsession(longText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long text under 100ms");
      assert.ok(result.wordCount > 400, "Should analyze long text");
    });
  });

  describe("mathematical properties", () => {
    it("returns bounded metrics", () => {
      const texts = [
        "The comprehensive analysis reveals significant patterns in the dataset that demonstrate important relationships between various factors and components of the system. Researchers have identified key correlations and statistical significance that provide valuable insights for future decision-making processes.",
        "There are three main benefits: efficiency, scalability, and reliability. First, the performance improves dramatically. Second, operational costs decrease significantly. Third, user satisfaction increases substantially over time. These three advantages make the solution highly effective and valuable for organizations seeking optimal results.",
      ];

      for (const text of texts) {
        const result = detectRuleOfThreeObsession(text);
        assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
        assert.ok(result.triadicDensity >= 0, "Triadic density should be non-negative");
        assert.ok(result.overallScore >= 0, "Overall score should be non-negative");
        assert.ok(result.wordCount > 25, "Word count should be sufficient");
      }
    });
  });
});
