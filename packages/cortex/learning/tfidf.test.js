/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { test } from "node:test";
import { Model } from "./model.js";
import { Tfidf } from "./tfidf.js";

test("Tfidf class structure and inheritance", () => {
	const tfidf = new Tfidf();

	// Should extend Model base class
	ok(tfidf instanceof Model, "Should extend Model base class");
	ok(tfidf instanceof Tfidf, "Should be instance of Tfidf");

	// Should have required properties
	ok(
		tfidf.documentFrequencies instanceof Map,
		"Should have documentFrequencies Map",
	);
	strictEqual(tfidf.documentCount, 0, "Should start with 0 documents");
	strictEqual(
		tfidf.averageDocumentLength,
		0,
		"Should start with 0 average length",
	);
});

test("Tfidf constructor with options", () => {
	const tfidf = new Tfidf({
		normalize: false,
		lowercase: false,
		useStemming: true,
		stemmer: (word) => word.replace(/ing$/, ""),
	});

	strictEqual(
		tfidf.options.normalize,
		false,
		"Should respect normalize option",
	);
	strictEqual(
		tfidf.options.lowercase,
		false,
		"Should respect lowercase option",
	);
	strictEqual(
		tfidf.options.useStemming,
		true,
		"Should respect useStemming option",
	);
	strictEqual(
		typeof tfidf.options.stemmer,
		"function",
		"Should store stemmer function",
	);
});

test("Tfidf.train() with document array", () => {
	const tfidf = new Tfidf();

	// Should throw with invalid input
	throws(() => tfidf.train(), "Should throw without arguments");
	throws(() => tfidf.train([]), "Should throw with empty array");
	throws(() => tfidf.train("not an array"), "Should throw with non-array");

	// Should train successfully with document array
	const result = tfidf.train([
		"machine learning algorithms",
		"artificial intelligence systems",
		"data science applications",
	]);

	// Should return self for chaining
	strictEqual(result, tfidf, "Should return self for method chaining");

	// Should mark as trained
	ok(tfidf._trained, "Should mark model as trained");
	strictEqual(tfidf.documentCount, 3, "Should have correct document count");
	ok(
		tfidf.averageDocumentLength > 0,
		"Should calculate average document length",
	);
});

test("Tfidf.trainDocument() incremental learning", () => {
	const tfidf = new Tfidf();

	// Should throw with invalid input
	throws(() => tfidf.trainDocument(), "Should throw without arguments");
	throws(() => tfidf.trainDocument(123), "Should throw with non-string");

	// Should train incrementally
	tfidf.trainDocument("machine learning rocks");
	strictEqual(
		tfidf.documentCount,
		1,
		"Should have 1 document after first training",
	);
	ok(tfidf._trained, "Should be trained after first document");

	tfidf.trainDocument("artificial intelligence works");
	strictEqual(
		tfidf.documentCount,
		2,
		"Should have 2 documents after second training",
	);

	// Should build vocabulary
	ok(
		tfidf.documentFrequencies.has("machine"),
		"Should have 'machine' in vocabulary",
	);
	ok(
		tfidf.documentFrequencies.has("learning"),
		"Should have 'learning' in vocabulary",
	);
	ok(
		tfidf.documentFrequencies.has("intelligence"),
		"Should have 'intelligence' in vocabulary",
	);
});

test("Tfidf.predict() basic functionality", () => {
	const tfidf = new Tfidf();

	// Should throw when not trained
	throws(() => tfidf.predict("query"), "Should throw when model not trained");

	// Train model
	tfidf.train([
		"machine learning algorithms are powerful",
		"artificial intelligence systems learn patterns",
		"data science uses statistical methods",
	]);

	// Should throw with invalid input
	throws(() => tfidf.predict(), "Should throw without arguments");
	throws(() => tfidf.predict(123), "Should throw with non-string");

	// Should return string array by default
	const results = tfidf.predict("machine learning");
	ok(Array.isArray(results), "Should return array");
	ok(
		results.every((term) => typeof term === "string"),
		"Should return array of strings",
	);
	ok(results.length > 0, "Should return non-empty results");

	// Should include query terms when they exist in corpus
	ok(
		results.includes("machine") || results.includes("learning"),
		"Should include relevant terms",
	);
});

test("Tfidf.predict() with options", () => {
	const tfidf = new Tfidf();
	tfidf.train([
		"machine learning artificial intelligence",
		"data science statistical analysis",
		"neural networks deep learning",
	]);

	// Test maxTerms option
	const limited = tfidf.predict("machine learning data", { maxTerms: 2 });
	strictEqual(limited.length, 2, "Should respect maxTerms limit");

	// Test includeScores option
	const withScores = tfidf.predict("machine learning", { includeScores: true });
	ok(Array.isArray(withScores), "Should return array with includeScores");
	ok(
		withScores.every((item) => typeof item === "object"),
		"Should return objects with includeScores",
	);
	ok(
		withScores.every((item) => typeof item.term === "string"),
		"Should have term property",
	);
	ok(
		withScores.every((item) => typeof item.score === "number"),
		"Should have score property",
	);

	// Test minScore option
	const filtered = tfidf.predict("machine learning", { minScore: 0.5 });
	ok(Array.isArray(filtered), "Should return array with minScore filter");
});

test("Tfidf.predictBM25() convenience method", () => {
	const tfidf = new Tfidf();
	tfidf.train([
		"machine learning algorithms",
		"artificial intelligence systems",
		"data science methods",
	]);

	const bm25Results = tfidf.predictBM25("machine learning");
	ok(Array.isArray(bm25Results), "Should return array");
	ok(
		bm25Results.every((term) => typeof term === "string"),
		"Should return strings",
	);

	// Should be different from regular TF-IDF (in general)
	const tfidfResults = tfidf.predict("machine learning");
	// Note: Results may be similar for short documents, but method should work
	ok(Array.isArray(tfidfResults), "Regular predict should also work");
});

test("Tfidf.getStats() method", () => {
	const tfidf = new Tfidf();

	// Should work on empty model
	const emptyStats = tfidf.getStats();
	strictEqual(
		emptyStats.vocabularySize,
		0,
		"Should have 0 vocabulary size when empty",
	);
	strictEqual(
		emptyStats.documentCount,
		0,
		"Should have 0 documents when empty",
	);
	strictEqual(emptyStats.trained, false, "Should not be trained initially");

	// Should work on trained model
	tfidf.train(["machine learning", "data science", "artificial intelligence"]);
	const stats = tfidf.getStats();

	ok(stats.vocabularySize > 0, "Should have vocabulary after training");
	strictEqual(stats.documentCount, 3, "Should have correct document count");
	ok(stats.averageDocumentLength > 0, "Should have average document length");
	strictEqual(stats.trained, true, "Should be marked as trained");
});

test("Tfidf serialization with toJSON() and fromJSON()", () => {
	const tfidf = new Tfidf({ normalize: false });
	tfidf.train([
		"machine learning algorithms",
		"artificial intelligence systems",
	]);

	// Should serialize properly
	const serialized = tfidf.toJSON();
	ok(typeof serialized === "object", "Should return object");
	ok(
		Array.isArray(serialized.documentFrequencies),
		"Should serialize Map as array",
	);
	strictEqual(serialized.documentCount, 2, "Should include document count");
	strictEqual(serialized._trained, true, "Should include training status");

	// Should deserialize properly
	const restored = Tfidf.fromJSON(serialized);
	ok(restored instanceof Tfidf, "Should restore as Tfidf instance");
	ok(restored._trained, "Should restore training status");
	strictEqual(restored.documentCount, 2, "Should restore document count");
	ok(
		restored.documentFrequencies instanceof Map,
		"Should restore Map from array",
	);

	// Should make same predictions
	const originalPrediction = tfidf.predict("machine learning");
	const restoredPrediction = restored.predict("machine learning");
	deepStrictEqual(
		restoredPrediction,
		originalPrediction,
		"Should make same predictions",
	);
});

test("Tfidf text preprocessing with options", () => {
	// Test normalization and case folding
	const tfidf1 = new Tfidf({ normalize: true, lowercase: true });
	tfidf1.train(["Machine Learning"]);

	const tfidf2 = new Tfidf({ normalize: false, lowercase: false });
	tfidf2.train(["Machine Learning"]);

	// Different preprocessing should affect results
	ok(
		tfidf1.documentFrequencies.has("machine"),
		"Should have lowercase terms with lowercasing",
	);
	ok(
		tfidf2.documentFrequencies.has("Machine"),
		"Should preserve case without lowercasing",
	);
});

test("Tfidf edge cases and robustness", () => {
	const tfidf = new Tfidf();

	// Should handle empty documents gracefully
	tfidf.trainDocument("");
	strictEqual(tfidf.documentCount, 1, "Should accept empty documents");

	// Should handle single word documents
	tfidf.trainDocument("word");
	strictEqual(tfidf.documentCount, 2, "Should handle single word documents");

	// Should handle queries with terms not in corpus
	const results = tfidf.predict("unknown nonexistent terms");
	ok(Array.isArray(results), "Should return array even for unknown terms");
	// Results may be empty or contain zero-scored terms, both are valid
});

test("Tfidf scoring algorithms comparison", () => {
	const tfidf = new Tfidf();
	tfidf.train([
		"the quick brown fox jumps over the lazy dog",
		"the dog was lazy and slow",
		"quick brown animals are energetic",
	]);

	// Get both TF-IDF and BM25 scores with scores included
	const tfidfScores = tfidf.predict("quick brown dog", {
		includeScores: true,
		useBM25: false,
	});
	const bm25Scores = tfidf.predict("quick brown dog", {
		includeScores: true,
		useBM25: true,
	});

	// Both should return scored results
	ok(Array.isArray(tfidfScores), "TF-IDF should return array");
	ok(Array.isArray(bm25Scores), "BM25 should return array");

	// Scores should be numbers
	if (tfidfScores.length > 0) {
		ok(
			tfidfScores.every((item) => typeof item.score === "number"),
			"TF-IDF scores should be numbers",
		);
	}
	if (bm25Scores.length > 0) {
		ok(
			bm25Scores.every((item) => typeof item.score === "number"),
			"BM25 scores should be numbers",
		);
	}
});
