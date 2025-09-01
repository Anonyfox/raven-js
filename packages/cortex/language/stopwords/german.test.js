/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok } from "node:assert";
import { describe, it } from "node:test";
import { GERMAN_STOPWORDS } from "./german.js";

describe("German stopwords", () => {
	it("exports stopwords as Set", () => {
		ok(GERMAN_STOPWORDS instanceof Set);
		ok(GERMAN_STOPWORDS.size > 0);
	});

	it("contains expected core stopwords", () => {
		ok(GERMAN_STOPWORDS.has("der"));
		ok(GERMAN_STOPWORDS.has("die"));
		ok(GERMAN_STOPWORDS.has("das"));
		ok(GERMAN_STOPWORDS.has("und"));
		ok(GERMAN_STOPWORDS.has("ist"));
		ok(GERMAN_STOPWORDS.has("in"));
	});

	it("all stopwords are lowercase strings", () => {
		for (const word of GERMAN_STOPWORDS) {
			ok(typeof word === "string");
			ok(word === word.toLowerCase());
			ok(word.trim() === word);
			ok(word.length > 0);
		}
	});
});
