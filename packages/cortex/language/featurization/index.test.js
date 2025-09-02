/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import * as featurization from "./index.js";

describe("featurization module", () => {
	it("re-exports all n-gram functions", () => {
		// Verify all expected functions are available
		ok(
			typeof featurization.extractCharNgrams === "function",
			"Should export extractCharNgrams",
		);
		ok(
			typeof featurization.extractWordNgrams === "function",
			"Should export extractWordNgrams",
		);
		ok(
			typeof featurization.extractMixedNgrams === "function",
			"Should export extractMixedNgrams",
		);
		ok(
			typeof featurization.TfIdfVectorizer === "function",
			"Should export TfIdfVectorizer",
		);
		ok(
			typeof featurization.hashFeatures === "function",
			"Should export hashFeatures",
		);
		ok(
			typeof featurization.RakeExtractor === "function",
			"Should export RakeExtractor",
		);
		ok(
			typeof featurization.TextRankExtractor === "function",
			"Should export TextRankExtractor",
		);
	});

	it("n-gram functions work through re-exports", () => {
		const testText = "the quick brown fox jumps";

		// Test character n-grams
		const charResult = featurization.extractCharNgrams(testText, 3);
		ok(Array.isArray(charResult), "extractCharNgrams should return array");
		ok(charResult.length > 0, "Should extract character n-grams");
		ok(charResult.includes("the"), "Should contain expected trigram");

		// Test word n-grams
		const wordResult = featurization.extractWordNgrams(testText, 2);
		ok(Array.isArray(wordResult), "extractWordNgrams should return array");
		ok(wordResult.length > 0, "Should extract word n-grams");
		ok(wordResult.includes("the quick"), "Should contain expected bigram");
		ok(wordResult.includes("brown fox"), "Should contain expected bigram");

		// Test mixed n-grams
		const mixedResult = featurization.extractMixedNgrams(testText);
		ok(
			typeof mixedResult === "object",
			"extractMixedNgrams should return object",
		);
		ok(Array.isArray(mixedResult.char), "Should have char array");
		ok(Array.isArray(mixedResult.word), "Should have word array");
		ok(mixedResult.char.length > 0, "Should extract character features");
		ok(mixedResult.word.length > 0, "Should extract word features");
	});

	it("handles edge cases consistently", () => {
		// Empty input
		const emptyChar = featurization.extractCharNgrams("");
		const emptyWord = featurization.extractWordNgrams("");
		const emptyMixed = featurization.extractMixedNgrams("");

		deepStrictEqual(emptyChar, []);
		deepStrictEqual(emptyWord, []);
		deepStrictEqual(emptyMixed.char, []);
		deepStrictEqual(emptyMixed.word, []);

		// Single character/word
		const singleChar = featurization.extractCharNgrams("x", 3);
		const singleWord = featurization.extractWordNgrams("hello", 2);

		deepStrictEqual(singleChar, []);
		deepStrictEqual(singleWord, []);
	});

	it("integration with normalization pipeline", () => {
		// Test that normalization options work through re-exports
		const unnormalized = "CAFÉ";

		const normalized = featurization.extractCharNgrams(unnormalized, 2, 1, {
			normalize: true,
			lowercase: true,
		});

		const notNormalized = featurization.extractCharNgrams(unnormalized, 2, 1, {
			normalize: false,
			lowercase: false,
		});

		// Should get different results with vs without normalization
		ok(normalized.length > 0, "Should extract normalized n-grams");
		ok(notNormalized.length > 0, "Should extract raw n-grams");
		ok(normalized.includes("ca"), "Should normalize to lowercase");
	});

	it("TfIdfVectorizer works through re-export", () => {
		const vectorizer = new featurization.TfIdfVectorizer();

		// Test basic functionality
		vectorizer.addDocument("machine learning algorithms");
		vectorizer.addDocument("natural language processing");

		strictEqual(vectorizer.documentCount, 2);
		ok(vectorizer.vocabularySize > 0, "Should have vocabulary");

		// Test scoring
		const tfidfScores = vectorizer.computeTfIdf("machine learning");
		ok(tfidfScores instanceof Map, "Should return Map of scores");
		ok(tfidfScores.has("machine"), "Should score query terms");

		const bm25Scores = vectorizer.computeBm25("machine learning");
		ok(bm25Scores instanceof Map, "Should return BM25 scores");
		ok(bm25Scores.has("machine"), "Should score BM25 terms");
	});

	it("hashFeatures works through re-export", () => {
		const text = "Hello world! This is a test document.";
		const hash = featurization.hashFeatures(text, {
			numFeatures: 512,
			featureType: "mixed",
		});

		strictEqual(typeof hash, "string");
		strictEqual(hash.length, 128);
		ok(/^[0-9a-f]+$/.test(hash));
	});
});
