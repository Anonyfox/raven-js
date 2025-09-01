/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for segmentation module exports.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import * as segmentation from "./index.js";

describe("segmentation module", () => {
	it("exports all segmentation functions", () => {
		strictEqual(typeof segmentation.tokenizeWords, "function");
		strictEqual(typeof segmentation.tokenizeSentences, "function");
		strictEqual(typeof segmentation.tokenizeCode, "function");
	});

	it("provides working text segmentation pipeline", () => {
		const { tokenizeWords, tokenizeSentences, tokenizeCode } = segmentation;

		// Test word tokenization
		const words = tokenizeWords("Hello world! How are you?");
		strictEqual(Array.isArray(words), true);
		strictEqual(words.includes("Hello"), true);
		strictEqual(words.includes("world"), true);

		// Test sentence tokenization
		const sentences = tokenizeSentences("First sentence. Second sentence!");
		strictEqual(Array.isArray(sentences), true);
		strictEqual(sentences.length >= 1, true);

		// Test code tokenization
		const codeTokens = tokenizeCode("getUserData");
		deepStrictEqual(codeTokens, ["get", "User", "Data"]);
	});

	it("handles complex text segmentation", () => {
		const { tokenizeWords, tokenizeCode } = segmentation;

		// Complex word tokenization with contractions and hyphens
		const words = tokenizeWords("state-of-the-art don't");
		strictEqual(words.includes("state-of-the-art"), true);
		strictEqual(words.includes("don't"), true);

		// Complex code tokenization with mixed conventions
		const codeTokens = tokenizeCode("user_profile.getData");
		strictEqual(codeTokens.includes("user"), true);
		strictEqual(codeTokens.includes("profile"), true);
		strictEqual(codeTokens.includes("get"), true);
		strictEqual(codeTokens.includes("Data"), true);
	});

	it("handles edge cases gracefully", () => {
		const { tokenizeWords, tokenizeSentences, tokenizeCode } = segmentation;

		// Empty strings
		deepStrictEqual(tokenizeWords(""), []);
		deepStrictEqual(tokenizeSentences(""), []);
		deepStrictEqual(tokenizeCode(""), []);

		// Single tokens
		deepStrictEqual(tokenizeWords("word"), ["word"]);
		deepStrictEqual(tokenizeSentences("sentence"), ["sentence"]);
		deepStrictEqual(tokenizeCode("function"), ["function"]);
	});
});
