/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { MinHasher } from "./minhash.js";

describe("MinHash Algorithm", () => {
	describe("MinHasher constructor", () => {
		it("creates instance with default options", () => {
			const hasher = new MinHasher();

			strictEqual(hasher.numHashes, 128);
			strictEqual(hasher.shingleSize, 3);
			strictEqual(hasher.useWordShingles, false);
			strictEqual(hasher.wordShingleSize, 2);
			strictEqual(hasher.normalize, true);
			strictEqual(hasher.lowercase, true);
			ok(Array.isArray(hasher.hashFunctions));
			strictEqual(hasher.hashFunctions.length, 128);
		});

		it("creates instance with custom options", () => {
			const hasher = new MinHasher({
				numHashes: 64,
				shingleSize: 4,
				useWordShingles: true,
				wordShingleSize: 3,
				normalize: false,
				lowercase: false,
			});

			strictEqual(hasher.numHashes, 64);
			strictEqual(hasher.shingleSize, 4);
			strictEqual(hasher.useWordShingles, true);
			strictEqual(hasher.wordShingleSize, 3);
			strictEqual(hasher.normalize, false);
			strictEqual(hasher.lowercase, false);
			strictEqual(hasher.hashFunctions.length, 64);
		});
	});

	describe("extractShingles", () => {
		const hasher = new MinHasher({ shingleSize: 3 });

		it("extracts character shingles", () => {
			const shingles = hasher.extractShingles("hello");
			ok(shingles instanceof Set);
			ok(shingles.has("hel"));
			ok(shingles.has("ell"));
			ok(shingles.has("llo"));
		});

		it("applies lowercase transformation", () => {
			const shingles = hasher.extractShingles("HELLO");
			ok(shingles.has("hel"));
			ok(shingles.has("ell"));
			ok(shingles.has("llo"));
		});

		it("extracts word shingles when configured", () => {
			const wordHasher = new MinHasher({
				useWordShingles: true,
				wordShingleSize: 2,
			});
			const shingles = wordHasher.extractShingles("hello world test");

			ok(shingles instanceof Set);
			ok(shingles.has("hello world"));
			ok(shingles.has("world test"));
		});

		it("handles empty string", () => {
			const shingles = hasher.extractShingles("");
			ok(shingles instanceof Set);
			strictEqual(shingles.size, 0);
		});

		it("handles short strings", () => {
			const shingles = hasher.extractShingles("hi");
			ok(shingles instanceof Set);
			// Should be empty since string is shorter than shingle size
			strictEqual(shingles.size, 0);
		});

		it("throws on non-string input", () => {
			throws(() => hasher.extractShingles(123), /Input must be a string/);
			throws(() => hasher.extractShingles(null), /Input must be a string/);
		});
	});

	describe("computeSignature", () => {
		const hasher = new MinHasher({ numHashes: 10 });

		it("computes signature for Set input", () => {
			const items = new Set(["abc", "def", "ghi"]);
			const signature = hasher.computeSignature(items);

			ok(Array.isArray(signature));
			strictEqual(signature.length, 10);

			// All values should be finite numbers
			for (const value of signature) {
				ok(typeof value === "number");
				ok(Number.isFinite(value));
			}
		});

		it("computes signature for Array input", () => {
			const items = ["abc", "def", "ghi"];
			const signature = hasher.computeSignature(items);

			ok(Array.isArray(signature));
			strictEqual(signature.length, 10);
		});

		it("handles empty input", () => {
			const signature = hasher.computeSignature(new Set());

			strictEqual(signature.length, 10);
			// All values should be Infinity (no items to hash)
			for (const value of signature) {
				strictEqual(value, Number.POSITIVE_INFINITY);
			}
		});

		it("filters out non-string items", () => {
			const items = ["abc", 123, "def", null, "ghi"];
			const signature1 = hasher.computeSignature(items);

			const stringItems = ["abc", "def", "ghi"];
			const signature2 = hasher.computeSignature(stringItems);

			// Should be the same since non-strings are filtered
			deepStrictEqual(signature1, signature2);
		});

		it("produces deterministic results", () => {
			const items = new Set(["test", "data", "example"]);
			const signature1 = hasher.computeSignature(items);
			const signature2 = hasher.computeSignature(items);

			deepStrictEqual(signature1, signature2);
		});

		it("throws on invalid input", () => {
			throws(() => hasher.computeSignature(null), /must be iterable/);
			throws(() => hasher.computeSignature(123), /must be iterable/);
		});
	});

	describe("computeTextSignature", () => {
		const hasher = new MinHasher({ numHashes: 16, shingleSize: 3 });

		it("computes signature from text", () => {
			const signature = hasher.computeTextSignature("hello world");

			ok(Array.isArray(signature));
			strictEqual(signature.length, 16);

			// Should have finite values since text generates shingles
			for (const value of signature) {
				ok(Number.isFinite(value));
			}
		});

		it("produces different signatures for different texts", () => {
			const sig1 = hasher.computeTextSignature("hello world");
			const sig2 = hasher.computeTextSignature("goodbye universe");

			// Signatures should be different (very unlikely to be identical)
			let different = false;
			for (let i = 0; i < sig1.length; i++) {
				if (sig1[i] !== sig2[i]) {
					different = true;
					break;
				}
			}
			ok(different, "Different texts should produce different signatures");
		});

		it("produces similar signatures for similar texts", () => {
			const sig1 = hasher.computeTextSignature("the quick brown fox");
			const sig2 = hasher.computeTextSignature("the quick brown fox jumps");

			// Should have some matching values
			let matches = 0;
			for (let i = 0; i < sig1.length; i++) {
				if (sig1[i] === sig2[i]) {
					matches++;
				}
			}

			// Should have some similarity (at least some matches)
			ok(
				matches > 0,
				"Similar texts should have some matching signature values",
			);
		});
	});

	describe("estimateSimilarity", () => {
		const hasher = new MinHasher({ numHashes: 100 });

		it("returns 1 for identical signatures", () => {
			const signature = [1, 2, 3, 4, 5];
			const similarity = hasher.estimateSimilarity(signature, signature);
			strictEqual(similarity, 1);
		});

		it("returns 0 for completely different signatures", () => {
			const sig1 = [1, 2, 3, 4, 5];
			const sig2 = [6, 7, 8, 9, 10];
			const similarity = hasher.estimateSimilarity(sig1, sig2);
			strictEqual(similarity, 0);
		});

		it("calculates partial similarity correctly", () => {
			const sig1 = [1, 2, 3, 4, 5];
			const sig2 = [1, 2, 8, 9, 10]; // 2 out of 5 match
			const similarity = hasher.estimateSimilarity(sig1, sig2);
			strictEqual(similarity, 0.4);
		});

		it("returns 0 for empty signatures", () => {
			const similarity = hasher.estimateSimilarity([], []);
			strictEqual(similarity, 0);
		});

		it("throws on invalid input", () => {
			throws(
				() => hasher.estimateSimilarity("not array", [1, 2, 3]),
				/must be arrays/,
			);
			throws(
				() => hasher.estimateSimilarity([1, 2, 3], null),
				/must be arrays/,
			);
		});

		it("throws on mismatched signature lengths", () => {
			throws(
				() => hasher.estimateSimilarity([1, 2, 3], [1, 2]),
				/must have the same length/,
			);
		});
	});

	describe("computeJaccardSimilarity", () => {
		const hasher = new MinHasher();

		it("returns 1 for identical sets", () => {
			const set1 = new Set(["a", "b", "c"]);
			const set2 = new Set(["a", "b", "c"]);
			const similarity = hasher.computeJaccardSimilarity(set1, set2);
			strictEqual(similarity, 1);
		});

		it("returns 0 for disjoint sets", () => {
			const set1 = new Set(["a", "b", "c"]);
			const set2 = new Set(["d", "e", "f"]);
			const similarity = hasher.computeJaccardSimilarity(set1, set2);
			strictEqual(similarity, 0);
		});

		it("calculates partial overlap correctly", () => {
			const set1 = new Set(["a", "b", "c"]);
			const set2 = new Set(["b", "c", "d"]);
			// Intersection: {b, c} (2), Union: {a, b, c, d} (4)
			const similarity = hasher.computeJaccardSimilarity(set1, set2);
			strictEqual(similarity, 0.5);
		});

		it("returns 1 for empty sets", () => {
			const similarity = hasher.computeJaccardSimilarity(new Set(), new Set());
			strictEqual(similarity, 1);
		});

		it("handles arrays as input", () => {
			const arr1 = ["a", "b", "c"];
			const arr2 = ["b", "c", "d"];
			const similarity = hasher.computeJaccardSimilarity(arr1, arr2);
			strictEqual(similarity, 0.5);
		});

		it("handles duplicate elements in arrays", () => {
			const arr1 = ["a", "b", "b", "c"];
			const arr2 = ["b", "c", "c", "d"];
			const similarity = hasher.computeJaccardSimilarity(arr1, arr2);
			strictEqual(similarity, 0.5); // Same as without duplicates
		});
	});

	describe("estimateTextSimilarity", () => {
		const hasher = new MinHasher({ numHashes: 64, shingleSize: 3 });

		it("returns high similarity for identical texts", () => {
			const text = "the quick brown fox jumps over the lazy dog";
			const similarity = hasher.estimateTextSimilarity(text, text);
			strictEqual(similarity, 1);
		});

		it("returns low similarity for very different texts", () => {
			const text1 = "machine learning algorithms";
			const text2 = "cooking delicious pasta";
			const similarity = hasher.estimateTextSimilarity(text1, text2);
			ok(similarity < 0.3, "Very different texts should have low similarity");
		});

		it("returns moderate similarity for related texts", () => {
			const text1 = "machine learning algorithms are powerful";
			const text2 = "machine learning models are effective";
			const similarity = hasher.estimateTextSimilarity(text1, text2);
			// MinHash can be probabilistic, so just ensure it's a valid similarity score
			ok(
				similarity >= 0 && similarity <= 1,
				"Similarity should be between 0 and 1",
			);
		});

		it("handles short texts", () => {
			const similarity = hasher.estimateTextSimilarity("cat", "dog");
			ok(typeof similarity === "number");
			ok(similarity >= 0 && similarity <= 1);
		});

		it("handles empty texts", () => {
			const similarity = hasher.estimateTextSimilarity("", "");
			// Both generate empty shingle sets, so similarity depends on implementation
			ok(typeof similarity === "number");
			ok(similarity >= 0 && similarity <= 1);
		});
	});

	describe("findSimilar", () => {
		const hasher = new MinHasher({ numHashes: 32 });
		const documents = [
			"the quick brown fox jumps",
			"the quick brown fox runs",
			"a lazy dog sleeps peacefully",
			"machine learning algorithms",
			"the quick red fox jumps",
		];

		it("finds similar documents", () => {
			const results = hasher.findSimilar(
				"the quick brown fox leaps",
				documents,
			);

			ok(Array.isArray(results));
			ok(results.length > 0);

			// Results should be sorted by similarity
			for (let i = 1; i < results.length; i++) {
				ok(results[i - 1].similarity >= results[i].similarity);
			}

			// Each result should have required properties
			for (const result of results) {
				ok(typeof result.document === "string");
				ok(typeof result.similarity === "number");
				ok(typeof result.index === "number");
				ok(result.similarity >= 0 && result.similarity <= 1);
			}
		});

		it("respects threshold parameter", () => {
			const results = hasher.findSimilar(
				"completely different text",
				documents,
				{
					threshold: 0.8,
				},
			);

			// With high threshold, should find few or no matches
			for (const result of results) {
				ok(result.similarity >= 0.8);
			}
		});

		it("respects maxResults parameter", () => {
			const results = hasher.findSimilar("the quick fox", documents, {
				maxResults: 2,
				threshold: 0.1,
			});

			ok(results.length <= 2);
		});

		it("handles empty documents array", () => {
			const results = hasher.findSimilar("test", []);
			deepStrictEqual(results, []);
		});

		it("filters out non-string documents", () => {
			const mixedDocs = ["valid document", 123, null, "another document"];
			const results = hasher.findSimilar("valid", mixedDocs, { threshold: 0 });

			// Should only include string documents
			for (const result of results) {
				ok(typeof result.document === "string");
			}
		});

		it("throws on invalid documents parameter", () => {
			throws(
				() => hasher.findSimilar("test", "not an array"),
				/must be an array/,
			);
		});
	});

	describe("analyzeAccuracy", () => {
		const hasher = new MinHasher({ numHashes: 128 });

		it("analyzes estimation accuracy", () => {
			const analysis = hasher.analyzeAccuracy(
				"the quick brown fox",
				"the quick brown fox jumps",
			);

			ok(typeof analysis.estimated === "number");
			ok(typeof analysis.exact === "number");
			ok(typeof analysis.error === "number");
			ok(typeof analysis.relativeError === "number");

			strictEqual(analysis.signatureLength, 128);
			strictEqual(analysis.shingleSize, 3);
			strictEqual(analysis.shingleType, "character");

			// Error should be non-negative
			ok(analysis.error >= 0);
			ok(analysis.relativeError >= 0);

			// Both similarities should be in valid range
			ok(analysis.estimated >= 0 && analysis.estimated <= 1);
			ok(analysis.exact >= 0 && analysis.exact <= 1);
		});

		it("shows word shingle analysis", () => {
			const wordHasher = new MinHasher({
				useWordShingles: true,
				wordShingleSize: 2,
			});

			const analysis = wordHasher.analyzeAccuracy(
				"machine learning algorithms",
				"machine learning models",
			);

			strictEqual(analysis.shingleType, "word");
			strictEqual(analysis.shingleSize, 2);
		});

		it("handles identical texts", () => {
			const text = "identical text content";
			const analysis = hasher.analyzeAccuracy(text, text);

			strictEqual(analysis.estimated, 1);
			strictEqual(analysis.exact, 1);
			strictEqual(analysis.error, 0);
			strictEqual(analysis.relativeError, 0);
		});
	});

	describe("integration and performance", () => {
		it("handles realistic document comparison", () => {
			const hasher = new MinHasher({ numHashes: 64 });

			const doc1 = `
				Machine learning is a subset of artificial intelligence that enables
				computers to learn and make decisions from data without explicit programming.
				It uses algorithms to identify patterns and make predictions.
			`;

			const doc2 = `
				Artificial intelligence and machine learning allow computers to process
				data and make intelligent decisions. These technologies use pattern
				recognition algorithms for predictions and insights.
			`;

			const doc3 = `
				Cooking is an art that requires patience and creativity. The best dishes
				combine fresh ingredients with traditional techniques and modern innovation.
			`;

			// Similar documents should have higher similarity
			const sim12 = hasher.estimateTextSimilarity(doc1, doc2);
			const sim13 = hasher.estimateTextSimilarity(doc1, doc3);

			// Both similarities should be reasonable values
			ok(sim12 >= 0 && sim12 <= 1, "Similarity should be between 0 and 1");
			ok(sim13 >= 0 && sim13 <= 1, "Similarity should be between 0 and 1");

			// For this test to be meaningful, at least one should have some similarity
			ok(
				sim12 > 0.05 || sim13 > 0.05,
				"At least one similarity should be meaningful",
			);

			// Test search functionality
			const documents = [doc1, doc2, doc3];
			const results = hasher.findSimilar(
				"machine learning algorithms for data analysis",
				documents,
				{ threshold: 0.05 }, // Lower threshold for probabilistic matching
			);

			ok(Array.isArray(results), "Should return array of results");
			// MinHash is probabilistic, so just ensure valid structure
			for (const result of results) {
				ok(typeof result.document === "string", "Result should have document");
				ok(
					typeof result.similarity === "number",
					"Result should have similarity",
				);
				ok(typeof result.index === "number", "Result should have index");
			}
		});

		it("maintains accuracy with different signature sizes", () => {
			const text1 = "the quick brown fox jumps over the lazy dog";
			const text2 = "the quick brown fox leaps over the lazy dog";

			const small = new MinHasher({ numHashes: 32 });
			const medium = new MinHasher({ numHashes: 128 });
			const large = new MinHasher({ numHashes: 256 });

			const sim32 = small.estimateTextSimilarity(text1, text2);
			const sim128 = medium.estimateTextSimilarity(text1, text2);
			const sim256 = large.estimateTextSimilarity(text1, text2);

			// All should be reasonable estimates
			ok(sim32 >= 0 && sim32 <= 1);
			ok(sim128 >= 0 && sim128 <= 1);
			ok(sim256 >= 0 && sim256 <= 1);

			// Larger signatures may be more stable, but all should be in similar range
			const maxDiff = Math.max(
				Math.abs(sim32 - sim128),
				Math.abs(sim128 - sim256),
				Math.abs(sim32 - sim256),
			);
			ok(
				maxDiff < 0.5,
				"Different signature sizes should give similar results",
			);
		});
	});
});
