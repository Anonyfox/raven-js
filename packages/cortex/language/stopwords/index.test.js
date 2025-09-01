/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import {
	ENGLISH_STOPWORDS,
	GERMAN_STOPWORDS,
	getStopwords,
	getSupportedLanguages,
} from "./index.js";

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

	describe("getStopwords function", () => {
		it("returns English stopwords for 'en'", () => {
			const stopwords = getStopwords("en");
			strictEqual(stopwords, ENGLISH_STOPWORDS);
		});

		it("returns English stopwords for 'english'", () => {
			const stopwords = getStopwords("english");
			strictEqual(stopwords, ENGLISH_STOPWORDS);
		});

		it("returns German stopwords for 'de'", () => {
			const stopwords = getStopwords("de");
			strictEqual(stopwords, GERMAN_STOPWORDS);
		});

		it("returns German stopwords for 'german'", () => {
			const stopwords = getStopwords("german");
			strictEqual(stopwords, GERMAN_STOPWORDS);
		});

		it("returns German stopwords for 'deutsch'", () => {
			const stopwords = getStopwords("deutsch");
			strictEqual(stopwords, GERMAN_STOPWORDS);
		});

		it("handles case insensitive language codes", () => {
			strictEqual(getStopwords("EN"), ENGLISH_STOPWORDS);
			strictEqual(getStopwords("De"), GERMAN_STOPWORDS);
			strictEqual(getStopwords("ENGLISH"), ENGLISH_STOPWORDS);
		});

		it("throws error for unsupported language", () => {
			throws(() => getStopwords("fr"), /Unsupported language: fr/);
			throws(() => getStopwords("spanish"), /Unsupported language: spanish/);
			throws(() => getStopwords(""), /Unsupported language: /);
		});
	});

	describe("getSupportedLanguages function", () => {
		it("returns array of supported languages", () => {
			const languages = getSupportedLanguages();
			ok(Array.isArray(languages));
			ok(languages.includes("en"));
			ok(languages.includes("de"));
			strictEqual(languages.length, 2);
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
