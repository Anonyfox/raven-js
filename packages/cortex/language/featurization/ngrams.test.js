import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ngrams } from "./ngrams.js";

describe("ngrams", () => {
	it("extracts word n-grams by default", () => {
		const text = "machine learning algorithms";
		const result = ngrams(text);

		assert(Array.isArray(result));
		assert.deepStrictEqual(result, ["machine learning", "learning algorithms"]);
	});

	it("extracts character n-grams when type is 'chars'", () => {
		const text = "hello";
		const result = ngrams(text, { type: "chars" });

		assert(Array.isArray(result));
		assert.deepStrictEqual(result, ["hel", "ell", "llo"]);
	});

	it("respects custom n-gram size", () => {
		const text = "natural language processing";

		// Word trigrams
		const wordTrigrams = ngrams(text, { n: 3 });
		assert.deepStrictEqual(wordTrigrams, ["natural language processing"]);

		// Character bigrams
		const charBigrams = ngrams("hello", { type: "chars", n: 2 });
		assert.deepStrictEqual(charBigrams, ["he", "el", "ll", "lo"]);
	});

	it("extracts mixed n-grams when type is 'mixed'", () => {
		const text = "hello world";
		const result = ngrams(text, { type: "mixed" });

		assert(typeof result === "object");
		assert(Array.isArray(result.char));
		assert(Array.isArray(result.word));
		assert(result.char.includes("hel"));
		assert(result.word.includes("hello world"));
	});

	it("handles stride parameter", () => {
		const text = "abcdef";
		const result = ngrams(text, { type: "chars", n: 2, stride: 2 });

		assert.deepStrictEqual(result, ["ab", "cd", "ef"]);
	});

	it("applies normalization options", () => {
		const text = "CAFÉ";

		const normalized = ngrams(text, {
			type: "chars",
			n: 2,
			normalize: true,
			lowercase: true,
		});

		const notNormalized = ngrams(text, {
			type: "chars",
			n: 2,
			normalize: false,
			lowercase: false,
		});

		assert(normalized.includes("ca"));
		assert(!notNormalized.includes("ca"));
		assert(notNormalized.includes("CA"));
	});

	it("respects custom separator for word n-grams", () => {
		const text = "machine learning algorithms";
		const result = ngrams(text, { separator: "_" });

		assert.deepStrictEqual(result, ["machine_learning", "learning_algorithms"]);
	});

	it("handles edge cases", () => {
		// Empty text
		assert.deepStrictEqual(ngrams(""), []);
		assert.deepStrictEqual(ngrams("", { type: "chars" }), []);

		const emptyMixed = ngrams("", { type: "mixed" });
		assert.deepStrictEqual(emptyMixed.char, []);
		assert.deepStrictEqual(emptyMixed.word, []);

		// Text shorter than n-gram size
		assert.deepStrictEqual(ngrams("hi", { n: 5 }), []);
		assert.deepStrictEqual(ngrams("x", { type: "chars", n: 3 }), []);

		// Single word/character at boundary
		assert.deepStrictEqual(ngrams("hello", { n: 2 }), []);
		assert.deepStrictEqual(ngrams("ab", { type: "chars", n: 2 }), ["ab"]);
	});

	it("throws error for invalid type", () => {
		assert.throws(
			() => ngrams("test", { type: "invalid" }),
			/Unknown n-gram type/,
		);
	});

	it("throws error for invalid parameters", () => {
		assert.throws(() => ngrams("test", { n: 0 }), /positive integers/);

		assert.throws(() => ngrams("test", { stride: 0 }), /positive integers/);
	});

	it("handles mixed type with custom sizes", () => {
		const text = "hello world test";
		const result = ngrams(text, {
			type: "mixed",
			charN: 2,
			wordN: 3,
		});

		assert(result.char.includes("he"));
		assert(result.char.includes("el"));
		// Text has 3 words, so wordN=3 creates a single 3-gram "hello world test"
		assert(result.word.includes("hello world test"));
	});

	it("provides consistent results", () => {
		const text = "machine learning artificial intelligence";
		const options = { type: "words", n: 2, lowercase: false };

		const result1 = ngrams(text, options);
		const result2 = ngrams(text, options);

		assert.deepStrictEqual(result1, result2);
	});

	it("works with various text types", () => {
		// Punctuation
		const withPunct = "Hello, world! How are you?";
		const result1 = ngrams(withPunct);
		assert(result1.length > 0);

		// Unicode
		const unicode = "Zürich café naïve résumé";
		const result2 = ngrams(unicode);
		assert(result2.length > 0);

		// Numbers
		const withNumbers = "Version 2.1 released in 2024";
		const result3 = ngrams(withNumbers);
		assert(result3.length > 0);
	});
});
