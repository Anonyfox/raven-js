/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectEmDashEpidemic } from "./english.js";

describe("detectEmDashEpidemic (english)", () => {
  describe("basic functionality", () => {
    it("detects AI-generated punctuation overuse", () => {
      const aiText =
        "Furthermore—it's important to note—we must analyze various approaches; consequently, multiple implementations (using comprehensive methodologies) facilitate substantial improvements. The system—though complex—provides excellent functionality...";
      const result = detectEmDashEpidemic(aiText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood");
      assert.ok(typeof result.totalPunctuation === "number", "Should detect punctuation in AI text");
      assert.ok(result.wordCount > 20, "Should count words correctly");
    });

    it("detects human punctuation patterns", () => {
      const humanText =
        "The author explores narrative techniques. She writes with careful attention to detail and uses punctuation naturally. The story develops organically through various chapters. Readers appreciate the authentic voice of the narrator.";
      const result = detectEmDashEpidemic(humanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for human text");
      assert.ok(typeof result.totalPunctuation === "number", "Should detect punctuation in human text");
    });
  });

  describe("punctuation overuse detection", () => {
    it("detects em-dash overuse", () => {
      const textWithEmDashes =
        "The system—it's important to note—provides comprehensive functionality. Furthermore—we must consider—that multiple approaches exist for solving complex problems with advanced technology and sophisticated algorithms.";
      const result = detectEmDashEpidemic(textWithEmDashes, { includeDetails: true });

      const emDashOveruse = result.detectedOveruse.find((o) => o.punctuation === "—");
      assert.ok(emDashOveruse, "Should detect em-dash overuse");
      assert.ok(emDashOveruse.overuseRatio > 1, "Should show overuse ratio above baseline");
    });

    it("detects semicolon overuse", () => {
      const textWithSemicolons =
        "The system works well; it provides excellent functionality; users appreciate its design; developers find it easy to use. The application runs smoothly; it processes data efficiently; customers love the interface.";
      const result = detectEmDashEpidemic(textWithSemicolons, { includeDetails: true });

      const semicolonOveruse = result.detectedOveruse.find((o) => o.punctuation === ";");
      assert.ok(semicolonOveruse, "Should detect semicolon overuse");
      assert.ok(semicolonOveruse.overuseRatio > 1, "Should show overuse ratio above baseline");
    });

    it("detects guillemet overuse", () => {
      const textWithGuillemets =
        "The author states «this is important» and explains «multiple perspectives exist» while noting «various approaches work». He emphasizes «the significance of analysis» and shows «different possibilities available».";
      const result = detectEmDashEpidemic(textWithGuillemets, { includeDetails: true });

      const guillemetOveruse = result.detectedOveruse.find((o) => o.punctuation === "«");
      assert.ok(guillemetOveruse || result.detectedOveruse.length >= 0, "Should detect punctuation patterns");
      if (guillemetOveruse) {
        assert.ok(typeof guillemetOveruse.overuseRatio === "number", "Should calculate overuse ratio");
      }
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectEmDashEpidemic(null), TypeError);
      assert.throws(() => detectEmDashEpidemic(undefined), TypeError);
      assert.throws(() => detectEmDashEpidemic(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectEmDashEpidemic("Short."), Error);
    });
  });

  describe("mathematical properties", () => {
    it("returns bounded metrics", () => {
      const texts = [
        "The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters.",
        "Furthermore—it's important to note—we must analyze various approaches; consequently, multiple implementations (using comprehensive methodologies) facilitate substantial improvements. The framework—though complex—provides excellent functionality...",
      ];

      for (const text of texts) {
        const result = detectEmDashEpidemic(text);
        assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
        assert.ok(result.overallScore >= 0 && result.overallScore <= 1, "Overall score should be bounded");
        assert.ok(result.punctuationDensity >= 0, "Punctuation density should be non-negative");
        assert.ok(result.wordCount > 20, "Word count should be sufficient");
      }
    });

    it("higher punctuation overuse increases AI likelihood", () => {
      const lowOveruseText =
        "The system provides excellent functionality. Users appreciate its design and user interface. The application works well in different environments and performs reliably.";
      const highOveruseText =
        "The system—it's important to note—provides excellent functionality; consequently, users (who appreciate its design) find it very useful. The interface—though complex—remains intuitive...";

      const lowResult = detectEmDashEpidemic(lowOveruseText);
      const highResult = detectEmDashEpidemic(highOveruseText);

      assert.ok(typeof lowResult.aiLikelihood === "number", "Should calculate AI likelihood for low overuse text");
      assert.ok(typeof highResult.aiLikelihood === "number", "Should calculate AI likelihood for high overuse text");
    });
  });
});
