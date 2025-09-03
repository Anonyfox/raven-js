/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as language from "./index.js";

describe("language module", () => {
	it("re-exports all analysis functions", () => {
		// Verify that all expected functions are available using static access
		assert.ok(
			typeof language.analyzeAITransitionPhrases === "function",
			"Should export analyzeAITransitionPhrases",
		);
		assert.ok(
			typeof language.analyzeNgramRepetition === "function",
			"Should export analyzeNgramRepetition",
		);
		assert.ok(
			typeof language.analyzeWithEnsemble === "function",
			"Should export analyzeWithEnsemble",
		);
		assert.ok(
			typeof language.analyzeZipfDeviation === "function",
			"Should export analyzeZipfDeviation",
		);
		assert.ok(
			typeof language.approximatePerplexity === "function",
			"Should export approximatePerplexity",
		);
		assert.ok(
			typeof language.calculateBurstiness === "function",
			"Should export calculateBurstiness",
		);
		assert.ok(
			typeof language.calculateShannonEntropy === "function",
			"Should export calculateShannonEntropy",
		);
		assert.ok(
			typeof language.detectEmDashEpidemic === "function",
			"Should export detectEmDashEpidemic",
		);
		assert.ok(
			typeof language.detectParticipalPhraseFormula === "function",
			"Should export detectParticipalPhraseFormula",
		);
		assert.ok(
			typeof language.detectPerfectGrammar === "function",
			"Should export detectPerfectGrammar",
		);
		assert.ok(
			typeof language.detectRuleOfThreeObsession === "function",
			"Should export detectRuleOfThreeObsession",
		);
		assert.ok(
			typeof language.isAIText === "function",
			"Should export isAIText",
		);
	});

	it("re-exports transformation functions", () => {
		// Verify stemming functions are available
		assert.ok(
			typeof language.stemPorter2 === "function",
			"Should export stemPorter2",
		);
		assert.ok(
			typeof language.stemCistem === "function",
			"Should export stemCistem",
		);
	});

	it("re-exports featurization functions", () => {
		// Verify n-gram functions are available
		assert.ok(
			typeof language.extractCharNgrams === "function",
			"Should export extractCharNgrams",
		);
		assert.ok(
			typeof language.extractWordNgrams === "function",
			"Should export extractWordNgrams",
		);
		assert.ok(
			typeof language.extractMixedNgrams === "function",
			"Should export extractMixedNgrams",
		);
		// Note: TF-IDF is now a dedicated ML model in cortex/learning
		// Use: import { Tfidf } from '@raven-js/cortex/learning'
		assert.ok(
			typeof language.hashFeatures === "function",
			"Should export hashFeatures",
		);
		assert.ok(
			typeof language.extractKeywords === "function",
			"Should export extractKeywords",
		);
		assert.ok(
			typeof language.extractKeywordsTextRank === "function",
			"Should export extractKeywordsTextRank",
		);

		// Similarity functions
		assert.ok(
			typeof language.osaDistance === "function",
			"Should export osaDistance",
		);
		assert.ok(
			typeof language.osaSimilarity === "function",
			"Should export osaSimilarity",
		);
		assert.ok(
			typeof language.jaroSimilarity === "function",
			"Should export jaroSimilarity",
		);
		assert.ok(
			typeof language.jaroWinklerSimilarity === "function",
			"Should export jaroWinklerSimilarity",
		);
		assert.ok(
			typeof language.findBestMatch === "function",
			"Should export findBestMatch",
		);
		assert.ok(
			typeof language.groupSimilarStrings === "function",
			"Should export groupSimilarStrings",
		);

		// MinHash class
		assert.ok(
			typeof language.MinHasher === "function",
			"Should export MinHasher class",
		);

		// LSH class
		assert.ok(
			typeof language.LSHBuckets === "function",
			"Should export LSHBuckets class",
		);

		// SimHash class
		assert.ok(
			typeof language.SimHasher === "function",
			"Should export SimHasher class",
		);
	});

	it("functions are callable", () => {
		// Test a few key functions to ensure they work through the re-export
		const testText =
			"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. Furthermore, it provides comprehensive functionality that ensures reliable outcomes across diverse operational environments and modern infrastructure solutions.";

		// Test ensemble function
		const ensembleResult = language.analyzeWithEnsemble(testText);
		assert.ok(
			typeof ensembleResult === "object",
			"analyzeWithEnsemble should return an object",
		);
		assert.ok(
			typeof ensembleResult.aiLikelihood === "number",
			"Should return AI likelihood",
		);

		// Test burstiness function
		const burstinessResult = language.calculateBurstiness(testText);
		assert.ok(
			typeof burstinessResult === "number",
			"calculateBurstiness should return a number",
		);
		assert.ok(burstinessResult >= 0, "Should return non-negative burstiness");

		// Test entropy function
		const entropyResult = language.calculateShannonEntropy(testText);
		assert.ok(
			typeof entropyResult === "number",
			"calculateShannonEntropy should return a number",
		);
		assert.ok(entropyResult >= 0, "Should return non-negative entropy");

		// Test isAIText function
		const aiResult = language.isAIText(testText);
		assert.ok(typeof aiResult === "object", "isAIText should return an object");
		assert.ok(
			typeof aiResult.aiLikelihood === "number",
			"Should return AI likelihood",
		);
		assert.ok(
			aiResult.aiLikelihood >= 0 && aiResult.aiLikelihood <= 1,
			"AI likelihood should be between 0 and 1",
		);
		assert.ok(
			typeof aiResult.certainty === "number",
			"Should return certainty",
		);
		assert.ok(
			typeof aiResult.combinedScore === "number",
			"Should return combined score",
		);
		assert.ok(
			typeof aiResult.classification === "string",
			"Should return classification",
		);
	});

	it("transformation functions are callable", () => {
		// Test English stemming
		const englishResult = language.stemPorter2("running");
		assert.strictEqual(
			englishResult,
			"run",
			"Should stem English words correctly",
		);

		const complexEnglish = language.stemPorter2("nationalization");
		assert.strictEqual(
			complexEnglish,
			"nation",
			"Should handle complex English suffixes",
		);

		// Test German stemming
		const germanResult = language.stemCistem("laufen");
		assert.strictEqual(
			germanResult,
			"lauf",
			"Should stem German words correctly",
		);

		const germanUmlaut = language.stemCistem("Möglichkeit");
		assert.strictEqual(
			germanUmlaut,
			"moeglich",
			"Should handle German umlauts and suffixes",
		);
	});

	it("featurization functions are callable", () => {
		const testText = "machine learning algorithms";

		// Test character n-grams
		const charNgrams = language.extractCharNgrams(testText, 3);
		assert.ok(
			Array.isArray(charNgrams),
			"Should return character n-grams array",
		);
		assert.ok(charNgrams.length > 0, "Should extract character features");
		assert.ok(charNgrams.includes("mac"), "Should contain expected trigram");

		// Test word n-grams
		const wordNgrams = language.extractWordNgrams(testText, 2);
		assert.ok(Array.isArray(wordNgrams), "Should return word n-grams array");
		assert.ok(
			wordNgrams.includes("machine learning"),
			"Should contain expected bigram",
		);
		assert.ok(
			wordNgrams.includes("learning algorithms"),
			"Should contain expected bigram",
		);

		// Test mixed n-grams
		const mixedNgrams = language.extractMixedNgrams(testText);
		assert.ok(
			typeof mixedNgrams === "object",
			"Should return mixed features object",
		);
		assert.ok(
			Array.isArray(mixedNgrams.char),
			"Should have character features",
		);
		assert.ok(Array.isArray(mixedNgrams.word), "Should have word features");
		assert.ok(mixedNgrams.char.length > 0, "Should extract character n-grams");
		assert.ok(mixedNgrams.word.length > 0, "Should extract word n-grams");
	});

	// Note: TF-IDF integration tests moved to learning/tfidf.test.js
	// TF-IDF is now a proper ML model: import { Tfidf } from '@raven-js/cortex/learning'

	it("hashFeatures integration works", () => {
		// Test with documents that should produce consistent hashes
		const doc1 = "machine learning algorithms";
		const doc2 = "deep learning neural networks";
		const doc3 = "completely different topic entirely";

		const hash1 = language.hashFeatures(doc1, {
			numFeatures: 256,
			featureType: "mixed",
		});
		const hash2 = language.hashFeatures(doc2, {
			numFeatures: 256,
			featureType: "mixed",
		});
		const hash3 = language.hashFeatures(doc3, {
			numFeatures: 256,
			featureType: "mixed",
		});

		// All should be hex strings of correct length
		assert.strictEqual(typeof hash1, "string");
		assert.strictEqual(typeof hash2, "string");
		assert.strictEqual(typeof hash3, "string");
		assert.strictEqual(hash1.length, 64); // 256 features = 32 bytes = 64 hex chars
		assert.strictEqual(hash2.length, 64);
		assert.strictEqual(hash3.length, 64);

		// All hashes should be valid hex and different
		assert.ok(/^[0-9a-f]+$/.test(hash1));
		assert.ok(/^[0-9a-f]+$/.test(hash2));
		assert.ok(/^[0-9a-f]+$/.test(hash3));
		assert.notStrictEqual(hash1, hash2);
		assert.notStrictEqual(hash1, hash3);
		assert.notStrictEqual(hash2, hash3);
	});
});
