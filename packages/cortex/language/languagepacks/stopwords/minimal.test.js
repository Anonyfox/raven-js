/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MINIMAL_STOPWORDS } from "./minimal.js";

describe("MINIMAL_STOPWORDS", () => {
  describe("basic functionality", () => {
    it("contains basic English articles", () => {
      assert.ok(MINIMAL_STOPWORDS.has("a"));
      assert.ok(MINIMAL_STOPWORDS.has("an"));
      assert.ok(MINIMAL_STOPWORDS.has("the"));
    });

    it("contains basic prepositions", () => {
      assert.ok(MINIMAL_STOPWORDS.has("in"));
      assert.ok(MINIMAL_STOPWORDS.has("on"));
      assert.ok(MINIMAL_STOPWORDS.has("at"));
      assert.ok(MINIMAL_STOPWORDS.has("to"));
      assert.ok(MINIMAL_STOPWORDS.has("for"));
      assert.ok(MINIMAL_STOPWORDS.has("of"));
      assert.ok(MINIMAL_STOPWORDS.has("with"));
      assert.ok(MINIMAL_STOPWORDS.has("by"));
    });

    it("contains basic pronouns", () => {
      assert.ok(MINIMAL_STOPWORDS.has("i"));
      assert.ok(MINIMAL_STOPWORDS.has("you"));
      assert.ok(MINIMAL_STOPWORDS.has("he"));
      assert.ok(MINIMAL_STOPWORDS.has("she"));
      assert.ok(MINIMAL_STOPWORDS.has("it"));
      assert.ok(MINIMAL_STOPWORDS.has("we"));
      assert.ok(MINIMAL_STOPWORDS.has("they"));
    });

    it("contains basic conjunctions", () => {
      assert.ok(MINIMAL_STOPWORDS.has("and"));
      assert.ok(MINIMAL_STOPWORDS.has("or"));
      assert.ok(MINIMAL_STOPWORDS.has("but"));
    });

    it("contains basic auxiliary verbs", () => {
      assert.ok(MINIMAL_STOPWORDS.has("is"));
      assert.ok(MINIMAL_STOPWORDS.has("are"));
      assert.ok(MINIMAL_STOPWORDS.has("was"));
      assert.ok(MINIMAL_STOPWORDS.has("were"));
      assert.ok(MINIMAL_STOPWORDS.has("be"));
      assert.ok(MINIMAL_STOPWORDS.has("been"));
      assert.ok(MINIMAL_STOPWORDS.has("have"));
      assert.ok(MINIMAL_STOPWORDS.has("has"));
      assert.ok(MINIMAL_STOPWORDS.has("had"));
      assert.ok(MINIMAL_STOPWORDS.has("do"));
      assert.ok(MINIMAL_STOPWORDS.has("does"));
      assert.ok(MINIMAL_STOPWORDS.has("did"));
    });
  });

  describe("set properties", () => {
    it("is a Set instance", () => {
      assert.ok(MINIMAL_STOPWORDS instanceof Set);
    });

    it("has minimal size", () => {
      // Should have only the most essential stopwords
      assert.ok(MINIMAL_STOPWORDS.size > 25);
      assert.ok(MINIMAL_STOPWORDS.size < 50);
    });

    it("contains only lowercase strings", () => {
      for (const word of MINIMAL_STOPWORDS) {
        assert.ok(typeof word === "string");
        assert.ok(word === word.toLowerCase());
      }
    });

    it("does not contain content words", () => {
      // Should not contain common nouns, verbs, adjectives that carry meaning
      assert.ok(!MINIMAL_STOPWORDS.has("cat"));
      assert.ok(!MINIMAL_STOPWORDS.has("run"));
      assert.ok(!MINIMAL_STOPWORDS.has("good"));
      assert.ok(!MINIMAL_STOPWORDS.has("house"));
    });
  });

  describe("usage patterns", () => {
    it("can be used for basic filtering", () => {
      const text = "The cat is on the house";
      const words = text.toLowerCase().split(/\s+/);
      const filtered = words.filter((word) => !MINIMAL_STOPWORDS.has(word));

      // Should filter out "the", "is", "on"
      assert.ok(filtered.length < words.length);
      assert.ok(!filtered.includes("the"));
      assert.ok(!filtered.includes("is"));
      assert.ok(!filtered.includes("on"));
    });
  });
});
