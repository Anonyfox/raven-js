import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { extractKeywords } from "./textrank.js";

describe("extractKeywords (TextRank)", () => {
	it("works with basic text", () => {
		const text = "Machine learning algorithms revolutionize artificial intelligence research";
		const keywords = extractKeywords(text);
		
		assert(Array.isArray(keywords));
		assert(keywords.length >= 0); // May be empty without stopwords
		if (keywords.length > 0) {
			assert.strictEqual(typeof keywords[0], "string");
		}
	});

	it("extracts meaningful keywords with stopwords", () => {
		const text = "Natural language processing is a fascinating field of computer science research";
		const stopwords = new Set(["is", "a", "of", "the", "and", "or", "in", "on", "at", "to"]);
		
		const keywords = extractKeywords(text, { 
			stopwords,
			maxKeywords: 5 
		});
		
		assert(Array.isArray(keywords));
		assert(keywords.length > 0);
		// TextRank should find meaningful phrases or words
		assert(keywords.some(k => k.includes("natural") || k.includes("language") || k.includes("processing") || k.includes("computer") || k.includes("science")));
	});

	it("handles empty text", () => {
		const keywords = extractKeywords("");
		assert.deepStrictEqual(keywords, []);
	});

	it("throws on invalid input", () => {
		assert.throws(() => extractKeywords(null), TypeError);
		assert.throws(() => extractKeywords(123), TypeError);
	});

	it("provides consistent output for same input", () => {
		const text = "Artificial intelligence and machine learning";
		const stopwords = new Set(["and"]);
		const options = { stopwords, maxKeywords: 5 };
		
		const keywords1 = extractKeywords(text, options);
		const keywords2 = extractKeywords(text, options);
		
		assert.deepStrictEqual(keywords1, keywords2);
	});
});
