/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENGLISH_STOPWORDS } from "./english.js";

describe("ENGLISH_STOPWORDS", () => {
  describe("basic functionality", () => {
    it("contains common English articles", () => {
      assert.ok(ENGLISH_STOPWORDS.has("a"));
      assert.ok(ENGLISH_STOPWORDS.has("an"));
      assert.ok(ENGLISH_STOPWORDS.has("the"));
    });

    it("contains common English prepositions", () => {
      assert.ok(ENGLISH_STOPWORDS.has("in"));
      assert.ok(ENGLISH_STOPWORDS.has("on"));
      assert.ok(ENGLISH_STOPWORDS.has("at"));
      assert.ok(ENGLISH_STOPWORDS.has("to"));
      assert.ok(ENGLISH_STOPWORDS.has("for"));
      assert.ok(ENGLISH_STOPWORDS.has("of"));
      assert.ok(ENGLISH_STOPWORDS.has("with"));
      assert.ok(ENGLISH_STOPWORDS.has("by"));
    });

    it("contains English pronouns", () => {
      assert.ok(ENGLISH_STOPWORDS.has("i"));
      assert.ok(ENGLISH_STOPWORDS.has("you"));
      assert.ok(ENGLISH_STOPWORDS.has("he"));
      assert.ok(ENGLISH_STOPWORDS.has("she"));
      assert.ok(ENGLISH_STOPWORDS.has("it"));
      assert.ok(ENGLISH_STOPWORDS.has("we"));
      assert.ok(ENGLISH_STOPWORDS.has("they"));
    });

    it("contains English conjunctions", () => {
      assert.ok(ENGLISH_STOPWORDS.has("and"));
      assert.ok(ENGLISH_STOPWORDS.has("but"));
      assert.ok(ENGLISH_STOPWORDS.has("or"));
      assert.ok(ENGLISH_STOPWORDS.has("nor"));
      assert.ok(ENGLISH_STOPWORDS.has("for"));
      assert.ok(ENGLISH_STOPWORDS.has("yet"));
      assert.ok(ENGLISH_STOPWORDS.has("so"));
    });

    it("contains English auxiliary verbs", () => {
      assert.ok(ENGLISH_STOPWORDS.has("is"));
      assert.ok(ENGLISH_STOPWORDS.has("are"));
      assert.ok(ENGLISH_STOPWORDS.has("was"));
      assert.ok(ENGLISH_STOPWORDS.has("were"));
      assert.ok(ENGLISH_STOPWORDS.has("be"));
      assert.ok(ENGLISH_STOPWORDS.has("been"));
      assert.ok(ENGLISH_STOPWORDS.has("being"));
      assert.ok(ENGLISH_STOPWORDS.has("have"));
      assert.ok(ENGLISH_STOPWORDS.has("has"));
      assert.ok(ENGLISH_STOPWORDS.has("had"));
      assert.ok(ENGLISH_STOPWORDS.has("having"));
      assert.ok(ENGLISH_STOPWORDS.has("do"));
      assert.ok(ENGLISH_STOPWORDS.has("does"));
      assert.ok(ENGLISH_STOPWORDS.has("did"));
    });

    it("contains modal verbs", () => {
      assert.ok(ENGLISH_STOPWORDS.has("will"));
      assert.ok(ENGLISH_STOPWORDS.has("would"));
      assert.ok(ENGLISH_STOPWORDS.has("should"));
      assert.ok(ENGLISH_STOPWORDS.has("could"));
      assert.ok(ENGLISH_STOPWORDS.has("can"));
      assert.ok(ENGLISH_STOPWORDS.has("may"));
      assert.ok(ENGLISH_STOPWORDS.has("might"));
      assert.ok(ENGLISH_STOPWORDS.has("must"));
      assert.ok(ENGLISH_STOPWORDS.has("shall"));
    });
  });

  describe("set properties", () => {
    it("is a Set instance", () => {
      assert.ok(ENGLISH_STOPWORDS instanceof Set);
    });

    it("has reasonable size", () => {
      // Should have a substantial number of stopwords but not be excessive
      assert.ok(ENGLISH_STOPWORDS.size > 100);
      assert.ok(ENGLISH_STOPWORDS.size < 200);
    });

    it("contains only lowercase strings", () => {
      for (const word of ENGLISH_STOPWORDS) {
        assert.ok(typeof word === "string");
        assert.ok(word === word.toLowerCase());
      }
    });

    it("does not contain content words", () => {
      // Should not contain common nouns, verbs, adjectives that carry meaning
      assert.ok(!ENGLISH_STOPWORDS.has("cat"));
      assert.ok(!ENGLISH_STOPWORDS.has("run"));
      assert.ok(!ENGLISH_STOPWORDS.has("good"));
      assert.ok(!ENGLISH_STOPWORDS.has("house"));
      assert.ok(!ENGLISH_STOPWORDS.has("computer"));
    });
  });

  describe("usage patterns", () => {
    it("can be used for filtering text", () => {
      const text = "The quick brown fox jumps over the lazy dog";
      const words = text.toLowerCase().split(/\s+/);
      const filtered = words.filter((word) => !ENGLISH_STOPWORDS.has(word));

      // Should filter out "the" and "over"
      assert.ok(filtered.length < words.length);
      assert.ok(!filtered.includes("the"));
      assert.ok(!filtered.includes("over"));
    });
  });
});
