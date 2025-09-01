/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import {
	extractCharNgrams,
	extractMixedNgrams,
	extractWordNgrams,
} from "./ngrams.js";

describe("extractCharNgrams", () => {
	it("generates basic character trigrams", () => {
		const result = extractCharNgrams("hello");
		deepStrictEqual(result, ["hel", "ell", "llo"]);
	});

	it("handles custom n-gram size", () => {
		const result = extractCharNgrams("hello", 2);
		deepStrictEqual(result, ["he", "el", "ll", "lo"]);
	});

	it("handles custom stride", () => {
		const result = extractCharNgrams("hello", 3, 2);
		deepStrictEqual(result, ["hel", "llo"]);
	});

	it("applies normalization by default", () => {
		const result = extractCharNgrams("café");
		deepStrictEqual(result, ["caf", "afé"]);
	});

	it("applies lowercase by default", () => {
		const result = extractCharNgrams("Hello");
		deepStrictEqual(result, ["hel", "ell", "llo"]);
	});

	it("can disable normalization", () => {
		const result = extractCharNgrams("Hello", 3, 1, {
			normalize: false,
			lowercase: false,
		});
		deepStrictEqual(result, ["Hel", "ell", "llo"]);
	});

	it("handles empty string", () => {
		const result = extractCharNgrams("");
		deepStrictEqual(result, []);
	});

	it("handles string shorter than n", () => {
		const result = extractCharNgrams("hi", 5);
		deepStrictEqual(result, []);
	});

	it("throws on invalid parameters", () => {
		throws(() => extractCharNgrams("hello", 0), /positive integers/);
		throws(() => extractCharNgrams("hello", 3, 0), /positive integers/);
	});

	it("handles Unicode correctly", () => {
		// Test simpler Unicode case that works predictably
		const result = extractCharNgrams("café", 2, 1, { normalize: false });
		deepStrictEqual(result, ["ca", "af", "fé"]);
	});
});

describe("extractWordNgrams", () => {
	it("generates basic word bigrams", () => {
		const result = extractWordNgrams("hello world test");
		deepStrictEqual(result, ["hello world", "world test"]);
	});

	it("handles custom n-gram size", () => {
		const result = extractWordNgrams("the quick brown fox", 3);
		deepStrictEqual(result, ["the quick brown", "quick brown fox"]);
	});

	it("handles custom stride", () => {
		const result = extractWordNgrams("the quick brown fox jumps", 2, 2);
		deepStrictEqual(result, ["the quick", "brown fox"]);
	});

	it("handles custom separator", () => {
		const result = extractWordNgrams("hello world test", 2, 1, {
			separator: "_",
		});
		deepStrictEqual(result, ["hello_world", "world_test"]);
	});

	it("applies lowercase by default", () => {
		const result = extractWordNgrams("Hello World Test");
		deepStrictEqual(result, ["hello world", "world test"]);
	});

	it("can disable normalization options", () => {
		const result = extractWordNgrams("Hello World", 2, 1, {
			normalize: false,
			lowercase: false,
		});
		deepStrictEqual(result, ["Hello World"]);
	});

	it("handles single word", () => {
		const result = extractWordNgrams("hello", 2);
		deepStrictEqual(result, []);
	});

	it("handles empty string", () => {
		const result = extractWordNgrams("");
		deepStrictEqual(result, []);
	});

	it("handles punctuation correctly", () => {
		const result = extractWordNgrams("hello, world! how are you?");
		deepStrictEqual(result, ["hello world", "world how", "how are", "are you"]);
	});

	it("handles hyphenated and contracted words", () => {
		const result = extractWordNgrams(
			"state-of-the-art technology isn't perfect",
		);
		deepStrictEqual(result, [
			"state-of-the-art technology",
			"technology isn't",
			"isn't perfect",
		]);
	});

	it("throws on invalid parameters", () => {
		throws(() => extractWordNgrams("hello world", 0), /positive integers/);
		throws(() => extractWordNgrams("hello world", 2, 0), /positive integers/);
	});
});

describe("extractMixedNgrams", () => {
	it("extracts both char and word n-grams", () => {
		const result = extractMixedNgrams("hello world");

		deepStrictEqual(result.char, [
			"hel",
			"ell",
			"llo",
			"lo ",
			"o w",
			" wo",
			"wor",
			"orl",
			"rld",
		]);
		deepStrictEqual(result.word, ["hello world"]);
	});

	it("handles custom configuration", () => {
		const result = extractMixedNgrams("the quick brown", {
			charN: 2,
			wordN: 3,
			stride: 1,
			options: { lowercase: false, normalize: false },
		});

		deepStrictEqual(result.char, [
			"th",
			"he",
			"e ",
			" q",
			"qu",
			"ui",
			"ic",
			"ck",
			"k ",
			" b",
			"br",
			"ro",
			"ow",
			"wn",
		]);
		deepStrictEqual(result.word, ["the quick brown"]);
	});

	it("handles empty input", () => {
		const result = extractMixedNgrams("");
		deepStrictEqual(result.char, []);
		deepStrictEqual(result.word, []);
	});

	it("handles single character input", () => {
		const result = extractMixedNgrams("x");
		deepStrictEqual(result.char, []);
		deepStrictEqual(result.word, []);
	});
});
