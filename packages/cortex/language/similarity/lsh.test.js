/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { LSHBuckets } from "./lsh.js";

describe("LSH Buckets", () => {
	describe("LSHBuckets constructor", () => {
		it("creates instance with default options", () => {
			const lsh = new LSHBuckets();

			strictEqual(lsh.numBands, 16);
			strictEqual(lsh.signatureLength, 128);
			strictEqual(lsh.threshold, 0.5);
			strictEqual(lsh.rowsPerBand, 8);
			strictEqual(lsh.actualSignatureLength, 128);
			strictEqual(lsh.nextItemId, 0);

			ok(lsh.buckets instanceof Map);
			ok(lsh.signatures instanceof Map);
			ok(lsh.items instanceof Map);
		});

		it("creates instance with custom options", () => {
			const lsh = new LSHBuckets({
				numBands: 8,
				signatureLength: 64,
				threshold: 0.7,
			});

			strictEqual(lsh.numBands, 8);
			strictEqual(lsh.signatureLength, 64);
			strictEqual(lsh.threshold, 0.7);
			strictEqual(lsh.rowsPerBand, 8);
			strictEqual(lsh.buckets.size, 8);
		});

		it("throws error for invalid band configuration", () => {
			throws(
				() =>
					new LSHBuckets({
						numBands: 200,
						signatureLength: 64,
					}),
				/too large for signature length/,
			);
		});
	});

	describe("hashBand", () => {
		const lsh = new LSHBuckets();

		it("produces consistent hashes", () => {
			const band = [1, 2, 3, 4, 5];
			const hash1 = lsh.hashBand(band);
			const hash2 = lsh.hashBand(band);

			strictEqual(hash1, hash2);
			ok(typeof hash1 === "string");
		});

		it("produces different hashes for different bands", () => {
			const band1 = [1, 2, 3, 4, 5];
			const band2 = [1, 2, 3, 4, 6];

			const hash1 = lsh.hashBand(band1);
			const hash2 = lsh.hashBand(band2);

			// Should be different (with very high probability)
			ok(hash1 !== hash2);
		});

		it("handles empty bands", () => {
			const hash = lsh.hashBand([]);
			ok(typeof hash === "string");
		});
	});

	describe("add", () => {
		it("adds item with signature", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			const signature = [1, 2, 3, 4, 5, 6, 7, 8];
			const item = "test document";

			const itemId = lsh.add(item, signature);

			strictEqual(typeof itemId, "number");
			strictEqual(itemId, 0);
			strictEqual(lsh.items.get(itemId), item);
			deepStrictEqual(lsh.signatures.get(itemId), signature);
			strictEqual(lsh.nextItemId, 1);
		});

		it("assigns sequential item IDs", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			const sig1 = [1, 2, 3, 4, 5, 6, 7, 8];
			const sig2 = [2, 3, 4, 5, 6, 7, 8, 9];

			const id1 = lsh.add("item1", sig1);
			const id2 = lsh.add("item2", sig2);

			strictEqual(id1, 0);
			strictEqual(id2, 1);
		});

		it("stores items in appropriate buckets", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			const signature = [1, 2, 3, 4, 5, 6, 7, 8];
			const itemId = lsh.add("test", signature);

			// Check that item appears in buckets
			let foundInBuckets = 0;
			for (let bandIdx = 0; bandIdx < lsh.numBands; bandIdx++) {
				const bandBuckets = lsh.buckets.get(bandIdx);
				for (const [, bucket] of bandBuckets) {
					if (bucket.has(itemId)) {
						foundInBuckets++;
						break; // Only count once per band
					}
				}
			}

			strictEqual(foundInBuckets, lsh.numBands);
		});

		it("throws error for invalid signature", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			throws(() => lsh.add("test", "not an array"), /must be an array/);
			throws(
				() => lsh.add("test", [1, 2, 3]),
				/does not match expected length/,
			);
		});
	});

	describe("addBatch", () => {
		it("adds multiple items", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			const items = [
				{ item: "doc1", signature: [1, 2, 3, 4] },
				{ item: "doc2", signature: [2, 3, 4, 5] },
				{ item: "doc3", signature: [3, 4, 5, 6] },
			];

			const itemIds = lsh.addBatch(items);

			strictEqual(itemIds.length, 3);
			deepStrictEqual(itemIds, [0, 1, 2]);

			strictEqual(lsh.items.size, 3);
			strictEqual(lsh.signatures.size, 3);

			for (let i = 0; i < items.length; i++) {
				strictEqual(lsh.items.get(i), items[i].item);
				deepStrictEqual(lsh.signatures.get(i), items[i].signature);
			}
		});

		it("handles empty batch", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			const itemIds = lsh.addBatch([]);
			deepStrictEqual(itemIds, []);
			strictEqual(lsh.items.size, 0);
		});

		it("throws error for invalid input", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			throws(() => lsh.addBatch("not an array"), /must be an array/);
		});
	});

	describe("getCandidates", () => {
		it("finds exact matches", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			const signature = [1, 2, 3, 4, 5, 6, 7, 8];
			const itemId = lsh.add("test", signature);

			const candidates = lsh.getCandidates(signature);

			ok(candidates instanceof Set);
			strictEqual(candidates.size, 1);
			ok(candidates.has(itemId));
		});

		it("finds partial matches", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			// Add items with different signatures
			lsh.add("doc1", [1, 2, 3, 4, 5, 6, 7, 8]);
			lsh.add("doc2", [1, 2, 9, 10, 5, 6, 7, 8]); // Different middle band
			lsh.add("doc3", [9, 10, 11, 12, 13, 14, 15, 16]); // Completely different

			// Query with signature similar to doc1 and doc2
			const candidates = lsh.getCandidates([1, 2, 3, 4, 5, 6, 7, 8]);

			ok(candidates.has(0)); // doc1 should be found (exact match)
			// doc2 might or might not be found depending on which bands match
			ok(candidates.size >= 1);
		});

		it("returns empty set when no matches", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			lsh.add("doc1", [1, 2, 3, 4, 5, 6, 7, 8]);

			const candidates = lsh.getCandidates([9, 10, 11, 12, 13, 14, 15, 16]);

			strictEqual(candidates.size, 0);
		});

		it("throws error for invalid query", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			throws(() => lsh.getCandidates("not an array"), /must be an array/);
			throws(
				() => lsh.getCandidates([1, 2, 3]),
				/does not match expected length/,
			);
		});
	});

	describe("estimateSimilarity", () => {
		const lsh = new LSHBuckets();

		it("returns 1 for identical signatures", () => {
			const sig = [1, 2, 3, 4, 5];
			const similarity = lsh.estimateSimilarity(sig, sig);
			strictEqual(similarity, 1);
		});

		it("returns 0 for completely different signatures", () => {
			const sig1 = [1, 2, 3, 4, 5];
			const sig2 = [6, 7, 8, 9, 10];
			const similarity = lsh.estimateSimilarity(sig1, sig2);
			strictEqual(similarity, 0);
		});

		it("calculates partial similarity correctly", () => {
			const sig1 = [1, 2, 3, 4, 5];
			const sig2 = [1, 2, 8, 9, 10]; // 2 out of 5 match
			const similarity = lsh.estimateSimilarity(sig1, sig2);
			strictEqual(similarity, 0.4);
		});

		it("handles different length signatures", () => {
			const sig1 = [1, 2, 3];
			const sig2 = [1, 2];
			const similarity = lsh.estimateSimilarity(sig1, sig2);
			strictEqual(similarity, 0);
		});
	});

	describe("search", () => {
		it("finds similar items above threshold", () => {
			const lsh = new LSHBuckets({
				numBands: 4,
				signatureLength: 8,
				threshold: 0.5,
			});
			// Add some test documents
			lsh.add("very similar document", [1, 2, 3, 4, 5, 6, 7, 8]);
			lsh.add("somewhat similar doc", [1, 2, 3, 4, 9, 10, 11, 12]);
			lsh.add("different content", [9, 10, 11, 12, 13, 14, 15, 16]);
			lsh.add("another variation", [1, 2, 17, 18, 5, 6, 19, 20]);

			const querySignature = [1, 2, 3, 4, 5, 6, 7, 8];
			const results = lsh.search(querySignature, { threshold: 0.6 });

			ok(Array.isArray(results));

			// Results should be sorted by similarity descending
			for (let i = 1; i < results.length; i++) {
				ok(results[i - 1].similarity >= results[i].similarity);
			}

			// All results should meet threshold
			for (const result of results) {
				ok(result.similarity >= 0.6);
				ok(typeof result.item === "string");
				ok(typeof result.itemId === "number");
			}

			// First result should be the identical document
			if (results.length > 0) {
				strictEqual(results[0].similarity, 1);
				strictEqual(results[0].item, "very similar document");
			}
		});

		it("respects maxResults parameter", () => {
			const lsh = new LSHBuckets({
				numBands: 4,
				signatureLength: 8,
				threshold: 0.5,
			});
			lsh.add("very similar document", [1, 2, 3, 4, 5, 6, 7, 8]);
			lsh.add("somewhat similar doc", [1, 2, 3, 4, 9, 10, 11, 12]);
			lsh.add("different content", [9, 10, 11, 12, 13, 14, 15, 16]);
			lsh.add("another variation", [1, 2, 17, 18, 5, 6, 19, 20]);

			const querySignature = [1, 2, 3, 4, 5, 6, 7, 8];
			const results = lsh.search(querySignature, {
				threshold: 0.1,
				maxResults: 2,
			});

			ok(results.length <= 2);
		});

		it("returns empty array when no matches", () => {
			const lsh = new LSHBuckets({
				numBands: 4,
				signatureLength: 8,
				threshold: 0.5,
			});
			lsh.add("very similar document", [1, 2, 3, 4, 5, 6, 7, 8]);
			lsh.add("somewhat similar doc", [1, 2, 3, 4, 9, 10, 11, 12]);

			const querySignature = [100, 101, 102, 103, 104, 105, 106, 107];
			const results = lsh.search(querySignature, { threshold: 0.5 });

			deepStrictEqual(results, []);
		});

		it("uses default threshold from constructor", () => {
			const lsh = new LSHBuckets({
				numBands: 4,
				signatureLength: 8,
				threshold: 0.5,
			});
			lsh.add("very similar document", [1, 2, 3, 4, 5, 6, 7, 8]);
			lsh.add("somewhat similar doc", [1, 2, 3, 4, 9, 10, 11, 12]);

			const querySignature = [1, 2, 3, 4, 5, 6, 7, 8];
			const results = lsh.search(querySignature); // No explicit threshold

			// Should use the 0.5 threshold from constructor
			for (const result of results) {
				ok(result.similarity >= 0.5);
			}
		});
	});

	describe("remove", () => {
		it("removes existing item", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			lsh.add("doc1", [1, 2, 3, 4]);
			lsh.add("doc2", [2, 3, 4, 5]);

			const removed = lsh.remove(0);

			ok(removed);
			ok(!lsh.items.has(0));
			ok(!lsh.signatures.has(0));

			// Should not find the removed item in search
			const candidates = lsh.getCandidates([1, 2, 3, 4]);
			ok(!candidates.has(0));
		});

		it("returns false for non-existent item", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			const removed = lsh.remove(999);
			ok(!removed);
		});

		it("cleans up empty buckets", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			lsh.add("doc1", [1, 2, 3, 4]);
			lsh.add("doc2", [2, 3, 4, 5]);

			// Remove all items
			lsh.remove(0);
			lsh.remove(1);

			// All buckets should be empty
			for (const [, bandBuckets] of lsh.buckets) {
				strictEqual(bandBuckets.size, 0);
			}
		});
	});

	describe("clear", () => {
		it("removes all items", () => {
			const lsh = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			lsh.add("doc1", [1, 2, 3, 4]);
			lsh.add("doc2", [2, 3, 4, 5]);

			lsh.clear();

			strictEqual(lsh.items.size, 0);
			strictEqual(lsh.signatures.size, 0);
			strictEqual(lsh.nextItemId, 0);

			// All buckets should be empty
			for (const [, bandBuckets] of lsh.buckets) {
				strictEqual(bandBuckets.size, 0);
			}
		});
	});

	describe("getStats", () => {
		it("provides accurate statistics", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			lsh.add("doc1", [1, 2, 3, 4, 5, 6, 7, 8]);
			lsh.add("doc2", [1, 2, 3, 4, 9, 10, 11, 12]);

			const stats = lsh.getStats();

			strictEqual(stats.totalItems, 2);
			strictEqual(stats.totalBands, 4);
			strictEqual(stats.rowsPerBand, 2);
			strictEqual(stats.signatureLength, 8);
			strictEqual(stats.threshold, 0.5);

			ok(stats.usedBuckets >= 0);
			ok(stats.avgBucketSize >= 0);
			ok(stats.maxBucketSize >= 0);
			ok(stats.loadFactor >= 0);
			ok(stats.avgItemsPerBucket >= 0);
		});

		it("handles empty index", () => {
			const lsh = new LSHBuckets();
			const stats = lsh.getStats();

			strictEqual(stats.totalItems, 0);
			strictEqual(stats.usedBuckets, 0);
			strictEqual(stats.avgBucketSize, 0);
			strictEqual(stats.maxBucketSize, 0);
			strictEqual(stats.loadFactor, 0);
			strictEqual(stats.avgItemsPerBucket, 0);
		});
	});

	describe("estimateCollisionProbability", () => {
		const lsh = new LSHBuckets({ numBands: 4, signatureLength: 8 }); // 2 rows per band

		it("returns correct probability for extreme values", () => {
			strictEqual(lsh.estimateCollisionProbability(0), 0);
			strictEqual(lsh.estimateCollisionProbability(1), 1);
		});

		it("calculates intermediate probabilities", () => {
			const prob = lsh.estimateCollisionProbability(0.8);
			ok(prob > 0 && prob < 1);
			ok(typeof prob === "number");

			// Higher similarity should give higher collision probability
			const lowProb = lsh.estimateCollisionProbability(0.3);
			const highProb = lsh.estimateCollisionProbability(0.9);
			ok(highProb > lowProb);
		});

		it("throws error for invalid similarity", () => {
			throws(
				() => lsh.estimateCollisionProbability(-0.1),
				/must be between 0 and 1/,
			);
			throws(
				() => lsh.estimateCollisionProbability(1.1),
				/must be between 0 and 1/,
			);
		});
	});

	describe("findOptimalBands", () => {
		it("finds optimal configuration for threshold", () => {
			const optimal = LSHBuckets.findOptimalBands(0.7, 128);

			ok(typeof optimal.numBands === "number");
			ok(typeof optimal.rowsPerBand === "number");
			ok(typeof optimal.signatureLength === "number");
			ok(typeof optimal.collisionProbability === "number");

			ok(optimal.numBands >= 1);
			ok(optimal.rowsPerBand >= 1);
			ok(optimal.signatureLength <= 128);
			ok(
				optimal.collisionProbability >= 0 && optimal.collisionProbability <= 1,
			);
		});

		it("handles different thresholds", () => {
			const low = LSHBuckets.findOptimalBands(0.3, 64);
			const high = LSHBuckets.findOptimalBands(0.9, 64);

			// Different thresholds should give different configurations
			ok(
				low.numBands !== high.numBands || low.rowsPerBand !== high.rowsPerBand,
			);
		});

		it("throws error for invalid threshold", () => {
			throws(() => LSHBuckets.findOptimalBands(0), /must be between 0 and 1/);
			throws(() => LSHBuckets.findOptimalBands(1), /must be between 0 and 1/);
		});
	});

	describe("createOptimal", () => {
		it("creates optimally configured LSH", () => {
			const lsh = LSHBuckets.createOptimal(0.6, 64);

			ok(lsh instanceof LSHBuckets);
			strictEqual(lsh.threshold, 0.6);

			// Should be able to add items and search
			lsh.add(
				"test",
				Array.from({ length: lsh.signatureLength }, (_, i) => i),
			);
			const stats = lsh.getStats();
			strictEqual(stats.totalItems, 1);
		});

		it("uses default parameters", () => {
			const lsh = LSHBuckets.createOptimal();

			strictEqual(lsh.threshold, 0.5);
			ok(lsh.signatureLength <= 128);
			ok(lsh.numBands >= 1);
		});
	});

	describe("integration and performance", () => {
		it("handles realistic document similarity search", () => {
			const lsh = new LSHBuckets({ numBands: 8, signatureLength: 64 });

			// Add documents with varying similarity
			const docs = [
				{ text: "machine learning algorithms", sig: [1, 2, 3, 4, 5, 6, 7, 8] },
				{ text: "machine learning models", sig: [1, 2, 3, 4, 9, 10, 11, 12] },
				{
					text: "deep learning neural networks",
					sig: [1, 2, 13, 14, 15, 16, 17, 18],
				},
				{ text: "cooking recipes", sig: [20, 21, 22, 23, 24, 25, 26, 27] },
			];

			// Extend signatures to required length
			for (const doc of docs) {
				while (doc.sig.length < 64) {
					doc.sig.push(Math.floor(Math.random() * 1000));
				}
				lsh.add(doc.text, doc.sig);
			}

			// Search for similar documents
			const querySignature = [1, 2, 3, 4, 5, 6, 7, 8];
			while (querySignature.length < 64) {
				querySignature.push(Math.floor(Math.random() * 1000));
			}

			const results = lsh.search(querySignature, { threshold: 0.1 });

			ok(Array.isArray(results));
			// Should find at least the most similar document
			ok(results.length >= 1);

			// Verify result structure
			for (const result of results) {
				ok(typeof result.item === "string");
				ok(typeof result.similarity === "number");
				ok(typeof result.itemId === "number");
				ok(result.similarity >= 0.1);
			}
		});

		it("scales efficiently with many documents", () => {
			const lsh = new LSHBuckets({ numBands: 16, signatureLength: 128 });

			// Add many documents
			const numDocs = 100;
			for (let i = 0; i < numDocs; i++) {
				const signature = Array.from({ length: 128 }, () =>
					Math.floor(Math.random() * 10000),
				);
				lsh.add(`document ${i}`, signature);
			}

			// Search should still be fast
			const querySignature = Array.from({ length: 128 }, () =>
				Math.floor(Math.random() * 10000),
			);
			const results = lsh.search(querySignature, { maxResults: 5 });

			// Should be able to handle the search efficiently
			ok(Array.isArray(results));
			ok(results.length <= 5);

			const stats = lsh.getStats();
			strictEqual(stats.totalItems, numDocs);
			ok(stats.usedBuckets > 0);
		});

		it("maintains consistency across operations", () => {
			const lsh = new LSHBuckets({ numBands: 4, signatureLength: 16 });

			// Add documents
			const sigs = [
				Array.from({ length: 16 }, (_, i) => i),
				Array.from({ length: 16 }, (_, i) => i + 1),
				Array.from({ length: 16 }, (_, i) => i + 2),
			];

			const ids = [];
			for (let i = 0; i < sigs.length; i++) {
				ids.push(lsh.add(`doc${i}`, sigs[i]));
			}

			// Verify all can be found
			for (let i = 0; i < sigs.length; i++) {
				const candidates = lsh.getCandidates(sigs[i]);
				ok(candidates.has(ids[i]));
			}

			// Remove middle document
			lsh.remove(ids[1]);

			// Should not find removed document
			const candidatesAfterRemoval = lsh.getCandidates(sigs[1]);
			ok(!candidatesAfterRemoval.has(ids[1]));

			// Other documents should still be findable
			ok(lsh.getCandidates(sigs[0]).has(ids[0]));
			ok(lsh.getCandidates(sigs[2]).has(ids[2]));
		});
	});
});
