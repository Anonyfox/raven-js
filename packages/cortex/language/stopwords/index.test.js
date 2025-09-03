/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { ENGLISH_STOPWORDS, GERMAN_STOPWORDS } from "./index.js";

describe("stopwords module", () => {
	describe("English stopwords", () => {
		it("exports English stopwords as Set", () => {
			ok(ENGLISH_STOPWORDS instanceof Set);
			ok(ENGLISH_STOPWORDS.size > 0);
		});

		it("contains expected English stopwords", () => {
			ok(ENGLISH_STOPWORDS.has("the"));
			ok(ENGLISH_STOPWORDS.has("and"));
			ok(ENGLISH_STOPWORDS.has("is"));
			ok(ENGLISH_STOPWORDS.has("in"));
			ok(ENGLISH_STOPWORDS.has("to"));
		});

		it("does not contain content words", () => {
			ok(!ENGLISH_STOPWORDS.has("machine"));
			ok(!ENGLISH_STOPWORDS.has("learning"));
			ok(!ENGLISH_STOPWORDS.has("algorithm"));
			ok(!ENGLISH_STOPWORDS.has("computer"));
		});
	});

	describe("German stopwords", () => {
		it("exports German stopwords as Set", () => {
			ok(GERMAN_STOPWORDS instanceof Set);
			ok(GERMAN_STOPWORDS.size > 0);
		});

		it("contains expected German stopwords", () => {
			ok(GERMAN_STOPWORDS.has("der"));
			ok(GERMAN_STOPWORDS.has("die"));
			ok(GERMAN_STOPWORDS.has("das"));
			ok(GERMAN_STOPWORDS.has("und"));
			ok(GERMAN_STOPWORDS.has("ist"));
			ok(GERMAN_STOPWORDS.has("in"));
		});

		it("does not contain content words", () => {
			ok(!GERMAN_STOPWORDS.has("maschine"));
			ok(!GERMAN_STOPWORDS.has("lernen"));
			ok(!GERMAN_STOPWORDS.has("algorithmus"));
			ok(!GERMAN_STOPWORDS.has("computer"));
		});
	});

	describe("stopwords quality checks", () => {
		it("English and German stopwords are different", () => {
			ok(ENGLISH_STOPWORDS !== GERMAN_STOPWORDS);
			// Should have some non-overlapping words
			ok(!GERMAN_STOPWORDS.has("the"));
			ok(!ENGLISH_STOPWORDS.has("der"));
		});

		it("stopwords are reasonably comprehensive", () => {
			// English should have substantial coverage
			ok(ENGLISH_STOPWORDS.size > 50);
			ok(GERMAN_STOPWORDS.size > 50);

			// But not too excessive
			ok(ENGLISH_STOPWORDS.size < 300);
			ok(GERMAN_STOPWORDS.size < 300);
		});

		it("all stopwords are lowercase", () => {
			for (const word of ENGLISH_STOPWORDS) {
				strictEqual(
					word,
					word.toLowerCase(),
					`English stopword '${word}' should be lowercase`,
				);
			}

			for (const word of GERMAN_STOPWORDS) {
				strictEqual(
					word,
					word.toLowerCase(),
					`German stopword '${word}' should be lowercase`,
				);
			}
		});

		it("no empty or whitespace-only stopwords", () => {
			for (const word of ENGLISH_STOPWORDS) {
				ok(word.trim().length > 0, "English stopwords should not be empty");
				strictEqual(
					word,
					word.trim(),
					"English stopwords should not have whitespace",
				);
			}

			for (const word of GERMAN_STOPWORDS) {
				ok(word.trim().length > 0, "German stopwords should not be empty");
				strictEqual(
					word,
					word.trim(),
					"German stopwords should not have whitespace",
				);
			}
		});
	});
});
