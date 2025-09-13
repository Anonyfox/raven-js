/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GERMAN_STOPWORDS } from "./german.js";

describe("GERMAN_STOPWORDS", () => {
  describe("basic functionality", () => {
    it("contains German definite articles", () => {
      assert.ok(GERMAN_STOPWORDS.has("der"));
      assert.ok(GERMAN_STOPWORDS.has("die"));
      assert.ok(GERMAN_STOPWORDS.has("das"));
      assert.ok(GERMAN_STOPWORDS.has("den"));
      assert.ok(GERMAN_STOPWORDS.has("dem"));
      assert.ok(GERMAN_STOPWORDS.has("des"));
    });

    it("contains German indefinite articles", () => {
      assert.ok(GERMAN_STOPWORDS.has("ein"));
      assert.ok(GERMAN_STOPWORDS.has("eine"));
      assert.ok(GERMAN_STOPWORDS.has("einen"));
      assert.ok(GERMAN_STOPWORDS.has("einem"));
      assert.ok(GERMAN_STOPWORDS.has("eines"));
      assert.ok(GERMAN_STOPWORDS.has("einer"));
    });

    it("contains German prepositions", () => {
      assert.ok(GERMAN_STOPWORDS.has("an"));
      assert.ok(GERMAN_STOPWORDS.has("auf"));
      assert.ok(GERMAN_STOPWORDS.has("aus"));
      assert.ok(GERMAN_STOPWORDS.has("bei"));
      assert.ok(GERMAN_STOPWORDS.has("durch"));
      assert.ok(GERMAN_STOPWORDS.has("für"));
      assert.ok(GERMAN_STOPWORDS.has("gegen"));
      assert.ok(GERMAN_STOPWORDS.has("in"));
      assert.ok(GERMAN_STOPWORDS.has("mit"));
      assert.ok(GERMAN_STOPWORDS.has("nach"));
      assert.ok(GERMAN_STOPWORDS.has("über"));
      assert.ok(GERMAN_STOPWORDS.has("um"));
      assert.ok(GERMAN_STOPWORDS.has("unter"));
      assert.ok(GERMAN_STOPWORDS.has("von"));
      assert.ok(GERMAN_STOPWORDS.has("vor"));
      assert.ok(GERMAN_STOPWORDS.has("zu"));
      assert.ok(GERMAN_STOPWORDS.has("zwischen"));
    });

    it("contains German conjunctions", () => {
      assert.ok(GERMAN_STOPWORDS.has("und"));
      assert.ok(GERMAN_STOPWORDS.has("oder"));
      assert.ok(GERMAN_STOPWORDS.has("aber"));
      assert.ok(GERMAN_STOPWORDS.has("denn"));
      assert.ok(GERMAN_STOPWORDS.has("sondern"));
      assert.ok(GERMAN_STOPWORDS.has("sowie"));
    });

    it("contains German pronouns", () => {
      assert.ok(GERMAN_STOPWORDS.has("ich"));
      assert.ok(GERMAN_STOPWORDS.has("du"));
      assert.ok(GERMAN_STOPWORDS.has("er"));
      assert.ok(GERMAN_STOPWORDS.has("sie"));
      assert.ok(GERMAN_STOPWORDS.has("es"));
      assert.ok(GERMAN_STOPWORDS.has("wir"));
      assert.ok(GERMAN_STOPWORDS.has("ihr"));
    });

    it("contains German auxiliary verbs", () => {
      assert.ok(GERMAN_STOPWORDS.has("bin"));
      assert.ok(GERMAN_STOPWORDS.has("bist"));
      assert.ok(GERMAN_STOPWORDS.has("ist"));
      assert.ok(GERMAN_STOPWORDS.has("sind"));
      assert.ok(GERMAN_STOPWORDS.has("war"));
      assert.ok(GERMAN_STOPWORDS.has("warst"));
      assert.ok(GERMAN_STOPWORDS.has("waren"));
      assert.ok(GERMAN_STOPWORDS.has("sein"));
      assert.ok(GERMAN_STOPWORDS.has("haben"));
      assert.ok(GERMAN_STOPWORDS.has("hat"));
      assert.ok(GERMAN_STOPWORDS.has("hatte"));
      assert.ok(GERMAN_STOPWORDS.has("hatten"));
    });

    it("contains German modal verbs", () => {
      assert.ok(GERMAN_STOPWORDS.has("können"));
      assert.ok(GERMAN_STOPWORDS.has("kann"));
      assert.ok(GERMAN_STOPWORDS.has("konnte"));
      assert.ok(GERMAN_STOPWORDS.has("müssen"));
      assert.ok(GERMAN_STOPWORDS.has("muss"));
      assert.ok(GERMAN_STOPWORDS.has("musste"));
      assert.ok(GERMAN_STOPWORDS.has("sollen"));
      assert.ok(GERMAN_STOPWORDS.has("soll"));
      assert.ok(GERMAN_STOPWORDS.has("sollte"));
      assert.ok(GERMAN_STOPWORDS.has("wollen"));
      assert.ok(GERMAN_STOPWORDS.has("will"));
      assert.ok(GERMAN_STOPWORDS.has("wollte"));
    });
  });

  describe("set properties", () => {
    it("is a Set instance", () => {
      assert.ok(GERMAN_STOPWORDS instanceof Set);
    });

    it("has reasonable size", () => {
      // Should have a substantial number of stopwords including case variants
      assert.ok(GERMAN_STOPWORDS.size > 150);
      assert.ok(GERMAN_STOPWORDS.size < 250);
    });

    it("contains only lowercase strings", () => {
      for (const word of GERMAN_STOPWORDS) {
        assert.ok(typeof word === "string");
        assert.ok(word === word.toLowerCase());
      }
    });

    it("does not contain content words", () => {
      // Should not contain common nouns, verbs, adjectives that carry meaning
      assert.ok(!GERMAN_STOPWORDS.has("haus"));
      assert.ok(!GERMAN_STOPWORDS.has("laufen"));
      assert.ok(!GERMAN_STOPWORDS.has("gut"));
      assert.ok(!GERMAN_STOPWORDS.has("computer"));
      assert.ok(!GERMAN_STOPWORDS.has("arbeit"));
    });
  });

  describe("usage patterns", () => {
    it("can be used for filtering German text", () => {
      const text = "Das Haus ist groß und steht in der Stadt";
      const words = text.toLowerCase().split(/\s+/);
      const filtered = words.filter((word) => !GERMAN_STOPWORDS.has(word));

      // Should filter out articles, prepositions, and auxiliary verb
      assert.ok(filtered.length < words.length);
      assert.ok(!filtered.includes("das"));
      assert.ok(!filtered.includes("ist"));
      assert.ok(!filtered.includes("in"));
      assert.ok(!filtered.includes("der"));
    });
  });
});
