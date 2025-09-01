/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok } from "node:assert";
import { describe, it } from "node:test";
import { ENGLISH_STOPWORDS } from "./english.js";

describe("English stopwords", () => {
	it("exports stopwords as Set", () => {
		ok(ENGLISH_STOPWORDS instanceof Set);
		ok(ENGLISH_STOPWORDS.size > 0);
	});

	it("contains expected core stopwords", () => {
		ok(ENGLISH_STOPWORDS.has("the"));
		ok(ENGLISH_STOPWORDS.has("and"));
		ok(ENGLISH_STOPWORDS.has("is"));
		ok(ENGLISH_STOPWORDS.has("in"));
		ok(ENGLISH_STOPWORDS.has("to"));
		ok(ENGLISH_STOPWORDS.has("of"));
	});

	it("all stopwords are lowercase strings", () => {
		for (const word of ENGLISH_STOPWORDS) {
			ok(typeof word === "string");
			ok(word === word.toLowerCase());
			ok(word.trim() === word);
			ok(word.length > 0);
		}
	});
});
