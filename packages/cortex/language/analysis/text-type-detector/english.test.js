/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectTextType } from "./english.js";

describe("detectTextType (english)", () => {
  describe("basic functionality", () => {
    it("classifies business text correctly", () => {
      const businessText =
        "Our quarterly revenue growth exceeded expectations, with strong performance in key markets and increased customer acquisition through strategic partnerships. The ROI on our marketing campaigns has been exceptional. Market share expansion continues through innovative product development and enhanced customer service initiatives. Financial projections indicate continued profitability with sustainable growth metrics.";
      const result = detectTextType(businessText);

      assert.strictEqual(result.type, "business", "Should classify business text");
      assert.ok(result.confidence > 0.5, "Should have reasonable confidence for business text");
      assert.ok(result.scores.business > 0, "Should have positive business score");
    });

    it("classifies academic text correctly", () => {
      const academicText =
        "This empirical study examines the theoretical framework underlying consumer behavior, utilizing quantitative analysis to test several key hypotheses. The literature review reveals significant gaps in current research methodology and theoretical approaches. Statistical analysis demonstrates clear correlations between independent and dependent variables across multiple experimental conditions. Further investigation is warranted to explore causal relationships and potential confounding factors.";
      const result = detectTextType(academicText);

      assert.strictEqual(result.type, "academic", "Should classify academic text");
      assert.ok(result.confidence > 0.5, "Should have reasonable confidence for academic text");
      assert.ok(result.scores.academic > 0, "Should have positive academic score");
    });

    it("classifies technical text correctly", () => {
      const technicalText =
        "The algorithm implements a sophisticated caching mechanism with O(1) lookup time complexity. API documentation specifies RESTful endpoints for data retrieval and CRUD operations using JSON schemas. Database optimization requires indexing strategies and query performance monitoring to ensure efficient data access patterns across distributed systems.";
      const result = detectTextType(technicalText);

      assert.strictEqual(result.type, "technical", "Should classify technical text");
      assert.ok(result.confidence > 0.5, "Should have reasonable confidence for technical text");
      assert.ok(result.scores.technical > 0, "Should have positive technical score");
    });

    it("classifies creative text correctly", () => {
      const creativeText =
        "The artist's imagination soared through ethereal landscapes of pure wonder, where emotions danced like fireflies in the velvet night. Her creative expression flowed like a river of liquid poetry.";
      const result = detectTextType(creativeText);

      assert.strictEqual(result.type, "creative", "Should classify creative text");
      assert.ok(result.confidence > 0.6, "Should have high confidence for clear creative text");
      assert.ok(result.scores.creative > 0, "Should have positive creative score");
    });

    it("classifies marketing text correctly", () => {
      const marketingText =
        "Discover the revolutionary solution that transforms your customer journey! Our viral campaign delivers exceptional engagement rates and conversion optimization for maximum ROI and brand awareness.";
      const result = detectTextType(marketingText);

      assert.strictEqual(result.type, "marketing", "Should classify marketing text");
      assert.ok(result.confidence > 0.6, "Should have high confidence for clear marketing text");
      assert.ok(result.scores.marketing > 0, "Should have positive marketing score");
    });
  });

  describe("classification accuracy", () => {
    it("returns bounded confidence scores", () => {
      const texts = [
        "Business report shows quarterly growth metrics and strategic initiatives that demonstrate significant improvement in key performance indicators and market positioning over the previous fiscal period.",
        "Academic paper presents empirical research methodology and theoretical framework with comprehensive literature review and statistical analysis of data collected from multiple sources over extended periods.",
        "Technical documentation explains API implementation and system architecture with detailed code examples and performance benchmarks that demonstrate scalability and reliability under various conditions.",
        "Creative story weaves narrative threads of imagination and emotional depth through character development and plot progression that explores themes of human experience and personal transformation.",
        "Marketing campaign targets audience engagement through viral content strategies and social media optimization techniques that maximize reach and conversion rates across multiple platforms.",
      ];

      for (const text of texts) {
        const result = detectTextType(text);
        assert.ok(result.confidence >= 0 && result.confidence <= 1, "Confidence should be bounded");
        assert.ok(Object.keys(result.scores).length > 0, "Should have category scores");
      }
    });

    it("handles ambiguous text with lower confidence", () => {
      const ambiguousText =
        "The system provides various features that help users achieve their goals through different methods and approaches that work well together in complex environments with multiple stakeholders involved in the decision-making process.";
      const result = detectTextType(ambiguousText);

      assert.ok(result.confidence < 0.8, "Should have lower confidence for ambiguous text");
      assert.ok(typeof result.type === "string", "Should still provide a classification");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectTextType(null), TypeError);
      assert.throws(() => detectTextType(undefined), TypeError);
      assert.throws(() => detectTextType(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectTextType("Short."), Error);
    });
  });

  describe("performance", () => {
    it("processes text efficiently", () => {
      const longText = "Business strategy involves comprehensive market analysis and competitive positioning. ".repeat(
        100
      );
      const start = performance.now();
      const result = detectTextType(longText);
      const duration = performance.now() - start;

      assert.ok(duration < 50, "Should process long text under 50ms");
      assert.ok(typeof result.type === "string", "Should classify long text");
    });
  });
});
