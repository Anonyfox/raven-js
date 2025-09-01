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
			typeof featurization.FeatureHasher === "function",
			"Should export FeatureHasher",
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

	it("FeatureHasher works through re-export", () => {
		const hasher = new featurization.FeatureHasher({
			numFeatures: 100,
			featureType: "mixed",
		});

		// Test basic functionality
		const features = hasher.extractFeatures("machine learning algorithms");
		ok(Array.isArray(features), "Should extract features");
		ok(features.length > 0, "Should extract some features");

		// Test vector transformation
		const sparseVector = hasher.transform("machine learning");
		ok(sparseVector instanceof Map, "Should return sparse vector");
		ok(sparseVector.size > 0, "Should have non-empty vector");

		const denseVector = hasher.transformDense("machine learning");
		ok(Array.isArray(denseVector), "Should return dense vector");
		strictEqual(denseVector.length, 100, "Should match numFeatures");

		// Test similarity
		const similarity = hasher.similarity("machine learning", "deep learning");
		ok(typeof similarity === "number", "Should return similarity score");
		ok(similarity >= -1 && similarity <= 1, "Should be valid similarity");
	});

	it("RakeExtractor works through re-export", () => {
		const rake = new featurization.RakeExtractor({
			language: "en",
			maxPhraseLength: 3,
		});

		// Test basic functionality
		const phrases = rake.extractCandidatePhrases(
			"machine learning algorithms are powerful",
		);
		ok(Array.isArray(phrases), "Should extract candidate phrases");
		ok(phrases.length > 0, "Should extract some phrases");

		// Test keyword extraction
		const keywords = rake.extract(
			"artificial intelligence and machine learning",
		);
		ok(Array.isArray(keywords), "Should return keywords array");
		ok(keywords.length > 0, "Should extract some keywords");

		// Test with scores
		const keywordsWithScores = rake.extract("natural language processing", {
			includeScores: true,
			maxKeywords: 5,
		});
		ok(Array.isArray(keywordsWithScores), "Should return results array");
		for (const result of keywordsWithScores) {
			ok(typeof result === "object", "Should return objects with scores");
			ok(typeof result.phrase === "string", "Should have phrase");
			ok(typeof result.score === "number", "Should have numeric score");
		}

		// Test analysis
		const analysis = rake.analyzeText("deep learning neural networks");
		ok(typeof analysis === "object", "Should return analysis object");
		ok(typeof analysis.totalWords === "number", "Should have word count");
		ok(typeof analysis.totalPhrases === "number", "Should have phrase count");
	});

	it("TextRankExtractor works through re-export", () => {
		const textrank = new featurization.TextRankExtractor({
			language: "en",
			windowSize: 3,
			maxIterations: 20,
		});

		// Test basic functionality
		const words = textrank.extractWords(
			"machine learning algorithms are powerful",
		);
		ok(Array.isArray(words), "Should extract words");
		ok(words.length > 0, "Should extract some words");

		// Test keyword extraction
		const keywords = textrank.extract(
			"artificial intelligence and machine learning",
		);
		ok(Array.isArray(keywords), "Should return keywords array");
		ok(keywords.length > 0, "Should extract some keywords");

		// Test with scores
		const keywordsWithScores = textrank.extract("natural language processing", {
			includeScores: true,
			maxKeywords: 5,
		});
		ok(Array.isArray(keywordsWithScores), "Should return results array");
		for (const result of keywordsWithScores) {
			ok(typeof result === "object", "Should return objects with scores");
			ok(typeof result.phrase === "string", "Should have phrase");
			ok(typeof result.score === "number", "Should have numeric score");
		}

		// Test analysis
		const analysis = textrank.analyzeText("deep learning neural networks");
		ok(typeof analysis === "object", "Should return analysis object");
		ok(typeof analysis.totalWords === "number", "Should have word count");
		ok(
			typeof analysis.uniqueWords === "number",
			"Should have unique word count",
		);
		ok(
			typeof analysis.cooccurrenceEdges === "number",
			"Should have edge count",
		);

		// Test graph extraction
		const graphData = textrank.getGraph("machine learning algorithms");
		ok(typeof graphData === "object", "Should return graph data");
		ok(Array.isArray(graphData.nodes), "Should have nodes array");
		ok(Array.isArray(graphData.edges), "Should have edges array");
	});
});
