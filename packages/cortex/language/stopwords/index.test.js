/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENGLISH_STOPWORDS, GERMAN_STOPWORDS, MINIMAL_STOPWORDS } from "./index.js";

describe("stopwords index", () => {
  it("exports all language variants", () => {
    assert.ok(ENGLISH_STOPWORDS instanceof Set);
    assert.ok(GERMAN_STOPWORDS instanceof Set);
    assert.ok(MINIMAL_STOPWORDS instanceof Set);
  });

  describe("language variant characteristics", () => {
    it("German stopwords has largest vocabulary due to case complexity", () => {
      assert.ok(GERMAN_STOPWORDS.size > ENGLISH_STOPWORDS.size);
      assert.ok(GERMAN_STOPWORDS.size > MINIMAL_STOPWORDS.size);
    });

    it("English stopwords has substantial vocabulary", () => {
      assert.ok(ENGLISH_STOPWORDS.size > MINIMAL_STOPWORDS.size);
      assert.ok(ENGLISH_STOPWORDS.size > 100);
    });

    it("minimal stopwords has smallest vocabulary", () => {
      assert.ok(MINIMAL_STOPWORDS.size < ENGLISH_STOPWORDS.size);
      assert.ok(MINIMAL_STOPWORDS.size < GERMAN_STOPWORDS.size);
      assert.ok(MINIMAL_STOPWORDS.size < 50);
    });
  });

  describe("cross-language differences", () => {
    it("different languages have different stopwords", () => {
      // English has different pronouns than German
      assert.ok(ENGLISH_STOPWORDS.has("i"));
      assert.ok(!GERMAN_STOPWORDS.has("i"));

      assert.ok(GERMAN_STOPWORDS.has("ich"));
      assert.ok(!ENGLISH_STOPWORDS.has("ich"));

      // Articles are different
      assert.ok(ENGLISH_STOPWORDS.has("the"));
      assert.ok(!GERMAN_STOPWORDS.has("the"));

      assert.ok(GERMAN_STOPWORDS.has("der"));
      assert.ok(!ENGLISH_STOPWORDS.has("der"));
    });
  });

  describe("treeshaking compatibility", () => {
    it("allows direct import of specific stopwords", () => {
      // Test that static imports work (this validates treeshaking setup)
      assert.ok(ENGLISH_STOPWORDS.has("the"));
      assert.ok(GERMAN_STOPWORDS.has("der"));
      assert.ok(MINIMAL_STOPWORDS.has("the"));
    });
  });
});
