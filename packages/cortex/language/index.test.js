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
		assert.ok(
			typeof language.TfIdfVectorizer === "function",
			"Should export TfIdfVectorizer",
		);
		assert.ok(
			typeof language.FeatureHasher === "function",
			"Should export FeatureHasher",
		);
		assert.ok(
			typeof language.RakeExtractor === "function",
			"Should export RakeExtractor",
		);
		assert.ok(
			typeof language.TextRankExtractor === "function",
			"Should export TextRankExtractor",
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

	it("TfIdfVectorizer integration works", () => {
		// Test integration with stemming from transformation module
		const mockStemmer = language.stemPorter2; // Use our Porter2 stemmer
		const vectorizer = new language.TfIdfVectorizer({
			useStemming: true,
			stemmer: mockStemmer,
		});

		// Build corpus with words that benefit from stemming
		vectorizer.addDocument("running algorithms are testing machine learning");
		vectorizer.addDocument("tested implementations run efficiently");
		vectorizer.addDocument("tests demonstrate algorithmic performance");

		assert.strictEqual(vectorizer.documentCount, 3, "Should add all documents");
		assert.ok(vectorizer.vocabularySize > 0, "Should build vocabulary");

		// Query with related terms that should match through stemming
		const tfidfScores = vectorizer.computeTfIdf("test algorithm run");
		assert.ok(tfidfScores instanceof Map, "Should return TF-IDF scores");

		const bm25Scores = vectorizer.computeBm25("test algorithm run");
		assert.ok(bm25Scores instanceof Map, "Should return BM25 scores");

		// Test state management
		const state = vectorizer.exportState();
		assert.ok(typeof state === "object", "Should export serializable state");

		const newVectorizer = language.TfIdfVectorizer.fromState(state, {
			useStemming: true,
			stemmer: mockStemmer,
		});
		assert.strictEqual(
			newVectorizer.documentCount,
			vectorizer.documentCount,
			"Should restore document count",
		);
	});

	it("FeatureHasher integration works", () => {
		// Test integration with n-gram extraction
		const hasher = new language.FeatureHasher({
			numFeatures: 256,
			featureType: "mixed", // Use both char and word n-grams
			ngramOptions: {
				normalize: true,
				lowercase: true,
			},
		});

		// Test with documents that should have similarity
		const doc1 = "machine learning algorithms";
		const doc2 = "deep learning neural networks";
		const doc3 = "completely different topic entirely";

		// Transform to vectors
		const vector1 = hasher.transform(doc1);
		const vector2 = hasher.transform(doc2);

		assert.ok(vector1 instanceof Map, "Should return sparse vector");
		assert.ok(vector2 instanceof Map, "Should return sparse vector");
		assert.ok(vector1.size > 0, "Should have features");

		// Test similarity computation
		const similarity12 = hasher.similarity(doc1, doc2);
		const similarity13 = hasher.similarity(doc1, doc3);

		assert.ok(typeof similarity12 === "number", "Should compute similarity");
		assert.ok(
			similarity12 >= -1 && similarity12 <= 1,
			"Valid similarity range",
		);
		// Similar docs should be more similar than dissimilar ones
		assert.ok(similarity12 > similarity13, "Should detect similarity patterns");

		// Test batch processing
		const documents = [doc1, doc2, doc3];
		const batchVectors = hasher.transformBatch(documents);
		assert.strictEqual(batchVectors.length, 3, "Should process all documents");

		const denseMatrix = hasher.transformBatchDense(documents);
		assert.strictEqual(denseMatrix.length, 3, "Should create matrix");
		assert.ok(
			denseMatrix.every((row) => row.length === 256),
			"All rows should match numFeatures",
		);

		// Test collision analysis
		const features = hasher.extractFeatures("test document for analysis");
		const analysis = hasher.analyzeCollisions(features);
		assert.ok(
			typeof analysis.totalFeatures === "number",
			"Should analyze features",
		);
		assert.ok(analysis.loadFactor >= 0, "Should compute load factor");
	});

	it("RakeExtractor integration works", () => {
		// Test integration with stopwords and text processing
		const rake = new language.RakeExtractor({
			language: "en",
			normalize: true,
			lowercase: true,
			minWordLength: 2,
			maxPhraseLength: 4,
		});

		// Test with technical text that should have good keywords
		const text =
			"Machine learning algorithms enable artificial intelligence systems to process natural language and perform complex pattern recognition tasks.";

		// Extract keywords
		const keywords = rake.extract(text, {
			maxKeywords: 5,
			includeScores: true,
		});

		assert.ok(Array.isArray(keywords), "Should return keywords array");
		assert.ok(keywords.length > 0, "Should extract keywords");
		assert.ok(keywords.length <= 5, "Should respect max keywords limit");

		// Verify keyword structure
		for (const keyword of keywords) {
			assert.ok(typeof keyword === "object", "Should return keyword objects");
			assert.ok(typeof keyword.phrase === "string", "Should have phrase");
			assert.ok(typeof keyword.score === "number", "Should have score");
			assert.ok(keyword.score > 0, "Should have positive score");
		}

		// Should extract meaningful technical terms
		const phrases = keywords.map((k) => k.phrase);
		const hasGoodKeywords = phrases.some(
			(phrase) =>
				phrase.includes("machine learning") ||
				phrase.includes("artificial intelligence") ||
				phrase.includes("natural language") ||
				phrase.includes("pattern recognition"),
		);
		assert.ok(hasGoodKeywords, "Should extract technical keywords");

		// Test candidate phrase extraction
		const candidatePhrases = rake.extractCandidatePhrases(text);
		assert.ok(
			Array.isArray(candidatePhrases),
			"Should extract candidate phrases",
		);
		assert.ok(candidatePhrases.length > 0, "Should have candidate phrases");

		// Test detailed analysis
		const analysis = rake.analyzeText(text);
		assert.ok(typeof analysis === "object", "Should return analysis");
		assert.ok(analysis.totalWords > 0, "Should count words");
		assert.ok(analysis.totalPhrases > 0, "Should count phrases");
		assert.ok(analysis.avgWordsPerPhrase > 0, "Should calculate average");

		// Test with German text
		const germanRake = new language.RakeExtractor({ language: "de" });
		const germanKeywords = germanRake.extract(
			"Maschinelles Lernen und künstliche Intelligenz",
		);
		assert.ok(Array.isArray(germanKeywords), "Should work with German text");
		assert.ok(germanKeywords.length > 0, "Should extract German keywords");
	});

	it("TextRankExtractor integration works", () => {
		// Test integration with text processing and graph-based ranking
		const textrank = new language.TextRankExtractor({
			language: "en",
			normalize: true,
			lowercase: true,
			windowSize: 4,
			minWordLength: 2,
			maxIterations: 30,
		});

		// Test with technical text that should have good keywords
		const text =
			"Machine learning algorithms use artificial intelligence to process natural language and recognize complex patterns in large datasets.";

		// Extract keywords
		const keywords = textrank.extract(text, {
			maxKeywords: 5,
			includeScores: true,
		});

		assert.ok(Array.isArray(keywords), "Should return keywords array");
		assert.ok(keywords.length > 0, "Should extract keywords");
		assert.ok(keywords.length <= 5, "Should respect max keywords limit");

		// Verify keyword structure
		for (const keyword of keywords) {
			assert.ok(typeof keyword === "object", "Should return keyword objects");
			assert.ok(typeof keyword.phrase === "string", "Should have phrase");
			assert.ok(typeof keyword.score === "number", "Should have score");
			assert.ok(keyword.score > 0, "Should have positive score");
		}

		// Should extract meaningful technical terms
		const phrases = keywords.map((k) => k.phrase);
		const hasGoodKeywords = phrases.some(
			(phrase) =>
				phrase.includes("machine learning") ||
				phrase.includes("artificial intelligence") ||
				phrase.includes("natural language") ||
				phrase.includes("machine") ||
				phrase.includes("learning") ||
				phrase.includes("algorithms"),
		);
		assert.ok(hasGoodKeywords, "Should extract technical keywords");

		// Test word extraction
		const words = textrank.extractWords(text);
		assert.ok(Array.isArray(words), "Should extract words");
		assert.ok(words.length > 0, "Should have extracted words");

		// Test detailed analysis
		const analysis = textrank.analyzeText(text);
		assert.ok(typeof analysis === "object", "Should return analysis");
		assert.ok(analysis.totalWords > 0, "Should count words");
		assert.ok(analysis.uniqueWords > 0, "Should count unique words");
		assert.ok(analysis.avgScore > 0, "Should calculate average score");

		// Test graph data
		const graphData = textrank.getGraph(text);
		assert.ok(typeof graphData === "object", "Should return graph data");
		assert.ok(Array.isArray(graphData.nodes), "Should have nodes");
		assert.ok(Array.isArray(graphData.edges), "Should have edges");

		// Test with German text
		const germanTextrank = new language.TextRankExtractor({ language: "de" });
		const germanKeywords = germanTextrank.extract(
			"Maschinelles Lernen und künstliche Intelligenz",
		);
		assert.ok(Array.isArray(germanKeywords), "Should work with German text");
		assert.ok(germanKeywords.length > 0, "Should extract German keywords");

		// Test individual word extraction
		const individualWords = textrank.extractWordsOnly(text, { maxKeywords: 3 });
		assert.ok(
			Array.isArray(individualWords),
			"Should extract individual words",
		);
		for (const word of individualWords) {
			assert.ok(
				typeof word === "string" && !word.includes(" "),
				"Should be individual words",
			);
		}
	});
});
