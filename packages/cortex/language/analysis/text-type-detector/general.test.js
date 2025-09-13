/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectTextType } from "./general.js";

describe("detectTextType (general)", () => {
  describe("basic functionality", () => {
    it("returns neutral default classification", () => {
      const text =
        "This is a comprehensive sample text that contains enough words to meet the minimum requirement for analysis and testing of text type detection algorithms. The system provides additional content.";
      const result = detectTextType(text);

      assert.strictEqual(result.type, "unknown", "Should return default unknown type");
      assert.strictEqual(result.confidence, 0.1, "Should return low confidence");
      assert.deepStrictEqual(result.scores, {}, "Should return empty scores object");
    });

    it("handles case sensitivity option", () => {
      const text = "This is a test text with enough words to meet the minimum requirements for analysis.";
      const result = detectTextType(text);

      assert.strictEqual(result.type, "unknown", "Should handle text consistently");
      assert.strictEqual(result.confidence, 0.1, "Should return low confidence");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectTextType(null), TypeError);
      assert.throws(() => detectTextType(undefined), TypeError);
      assert.throws(() => detectTextType(123), TypeError);
      assert.throws(() => detectTextType([]), TypeError);
    });

    it("throws Error for empty text", () => {
      assert.throws(() => detectTextType(""), Error);
      assert.throws(() => detectTextType("   "), Error);
    });
  });

  describe("multilingual compatibility", () => {
    it("handles Unicode text", () => {
      const unicodeText =
        "Dies ist ein umfassender test text mit genügend worten um die mindestanforderungen zu erfüllen und die analyse zu testen. Das system bietet zusätzliche funktionen.";
      const result = detectTextType(unicodeText);

      assert.strictEqual(result.type, "unknown", "Should handle Unicode text");
      assert.strictEqual(result.confidence, 0.1, "Should return low confidence for Unicode");
    });
  });
});
