import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { extractKeywords } from "./rake.js";

describe("extractKeywords", () => {
	it("works with basic text and no stopwords", () => {
		const text = "Machine learning algorithms are powerful tools";
		// Without stopwords, entire sentence is one phrase - need higher maxPhraseLength
		const keywords = extractKeywords(text, { maxPhraseLength: 6 });

		assert(Array.isArray(keywords));
		assert(keywords.length > 0);
		assert.strictEqual(typeof keywords[0], "string");
		assert(keywords[0].includes("machine learning"));
	});

	it("extracts meaningful keywords with stopwords", () => {
		const text =
			"Natural language processing is a fascinating field of computer science";
		const stopwords = new Set([
			"is",
			"a",
			"of",
			"the",
			"and",
			"or",
			"in",
			"on",
			"at",
			"to",
		]);

		const keywords = extractKeywords(text, {
			stopwords,
			maxKeywords: 5,
		});

		assert(Array.isArray(keywords));
		assert(keywords.length > 0);
		assert(keywords.includes("natural language processing"));
		assert(keywords.includes("computer science"));
		assert(keywords.includes("fascinating field"));
	});

	it("handles empty text", () => {
		const keywords = extractKeywords("");
		assert.deepStrictEqual(keywords, []);
	});

	it("throws on invalid input", () => {
		assert.throws(() => extractKeywords(null), TypeError);
		assert.throws(() => extractKeywords(123), TypeError);
		assert.throws(() => extractKeywords({}), TypeError);
	});

	it("provides consistent output for same input", () => {
		const text =
			"Artificial intelligence and machine learning revolutionize technology";
		const stopwords = new Set(["and"]);
		const options = { stopwords, maxKeywords: 5 };

		const keywords1 = extractKeywords(text, options);
		const keywords2 = extractKeywords(text, options);

		assert.deepStrictEqual(keywords1, keywords2);
	});
});
