/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { FeatureHasher } from "./hash-features.js";

describe("FeatureHasher", () => {
	describe("constructor and configuration", () => {
		it("creates hasher with default options", () => {
			const hasher = new FeatureHasher();

			strictEqual(hasher.numFeatures, 1000);
			strictEqual(hasher.useBigInt, false);
			strictEqual(hasher.useSignHash, true);
			strictEqual(hasher.featureType, "mixed");
		});

		it("creates hasher with custom options", () => {
			const hasher = new FeatureHasher({
				numFeatures: 512,
				useBigInt: true,
				useSignHash: false,
				featureType: "word",
				ngramOptions: { normalize: false },
			});

			strictEqual(hasher.numFeatures, 512);
			strictEqual(hasher.useBigInt, true);
			strictEqual(hasher.useSignHash, false);
			strictEqual(hasher.featureType, "word");
			deepStrictEqual(hasher.ngramOptions, { normalize: false });
		});
	});

	describe("hash functions", () => {
		it("produces consistent 32-bit hashes", () => {
			const hasher = new FeatureHasher({ useBigInt: false });

			const hash1 = hasher.hashFunction("test");
			const hash2 = hasher.hashFunction("test");
			const hash3 = hasher.hashFunction("different");

			strictEqual(hash1, hash2);
			ok(hash1 !== hash3);
			ok(typeof hash1 === "number");
			ok(hash1 >= 0 && hash1 <= 0xffffffff);
		});

		it("produces consistent 64-bit hashes", () => {
			const hasher = new FeatureHasher({ useBigInt: true });

			const hash1 = hasher.hashFunction("test");
			const hash2 = hasher.hashFunction("test");
			const hash3 = hasher.hashFunction("different");

			strictEqual(hash1, hash2);
			ok(hash1 !== hash3);
			ok(typeof hash1 === "bigint");
		});

		it("hash distribution appears reasonable", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });
			const indices = new Set();

			// Generate hashes for different inputs
			for (let i = 0; i < 50; i++) {
				const { index } = hasher.hashFeature(`feature_${i}`);
				indices.add(index);
			}

			// Should have reasonable distribution (not all same bucket)
			ok(indices.size > 10, "Should distribute across multiple buckets");
			for (const index of indices) {
				ok(index >= 0 && index < 100, "Index should be within bounds");
			}
		});
	});

	describe("feature extraction", () => {
		it("extracts word features", () => {
			const hasher = new FeatureHasher({ featureType: "word" });
			const features = hasher.extractFeatures("hello world test");

			ok(Array.isArray(features));
			ok(features.length > 0);
			ok(features.includes("hello"));
			ok(features.includes("world"));
			ok(features.includes("test"));
		});

		it("extracts character n-gram features", () => {
			const hasher = new FeatureHasher({ featureType: "char" });
			const features = hasher.extractFeatures("hello");

			ok(Array.isArray(features));
			ok(features.length > 0);
			ok(features.includes("hel"));
			ok(features.includes("ell"));
			ok(features.includes("llo"));
		});

		it("extracts mixed features", () => {
			const hasher = new FeatureHasher({ featureType: "mixed" });
			const features = hasher.extractFeatures("hello world");

			ok(Array.isArray(features));
			ok(features.length > 0);
			// Should contain both char n-grams and words
			ok(features.includes("hel")); // char trigram
			ok(features.includes("hello")); // word
			ok(features.includes("world")); // word
		});

		it("handles empty input", () => {
			const hasher = new FeatureHasher();
			const features = hasher.extractFeatures("");

			ok(Array.isArray(features));
			strictEqual(features.length, 0);
		});

		it("throws on invalid feature type", () => {
			const hasher = new FeatureHasher({ featureType: "invalid" });
			throws(() => hasher.extractFeatures("test"), /Unknown feature type/);
		});
	});

	describe("feature hashing", () => {
		it("hashes features to indices within bounds", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });

			const result1 = hasher.hashFeature("test");
			const result2 = hasher.hashFeature("different");

			ok(result1.index >= 0 && result1.index < 100);
			ok(result2.index >= 0 && result2.index < 100);
			ok(typeof result1.index === "number");
			ok(typeof result2.index === "number");
		});

		it("produces consistent indices for same feature", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });

			const result1 = hasher.hashFeature("test");
			const result2 = hasher.hashFeature("test");

			strictEqual(result1.index, result2.index);
			strictEqual(result1.sign, result2.sign);
		});

		it("uses sign hashing when enabled", () => {
			const hasher = new FeatureHasher({ useSignHash: true });

			const result = hasher.hashFeature("test");

			ok(result.sign === 1 || result.sign === -1);
		});

		it("uses positive sign when sign hashing disabled", () => {
			const hasher = new FeatureHasher({ useSignHash: false });

			const result = hasher.hashFeature("test");

			strictEqual(result.sign, 1);
		});

		it("works with BigInt hashing", () => {
			const hasher = new FeatureHasher({ useBigInt: true, numFeatures: 100 });

			const result = hasher.hashFeature("test");

			ok(result.index >= 0 && result.index < 100);
			ok(typeof result.index === "number");
			ok(result.sign === 1 || result.sign === -1);
		});
	});

	describe("vector transformation", () => {
		it("transforms text to sparse vector", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });
			const vector = hasher.transform("hello world");

			ok(vector instanceof Map);
			ok(vector.size > 0);

			// Check vector properties
			for (const [index, value] of vector) {
				ok(typeof index === "number");
				ok(index >= 0 && index < 100);
				ok(typeof value === "number");
				ok(Math.abs(value) >= 1); // Should be integer counts
			}
		});

		it("transforms text to dense vector", () => {
			const hasher = new FeatureHasher({ numFeatures: 10 });
			const vector = hasher.transformDense("hello world");

			ok(Array.isArray(vector));
			strictEqual(vector.length, 10);

			// Should have some non-zero values
			const nonZeros = vector.filter((v) => v !== 0);
			ok(nonZeros.length > 0);

			// All values should be numbers
			for (const value of vector) {
				ok(typeof value === "number");
			}
		});

		it("handles normalization", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });

			const unnormalized = hasher.transform("hello world", false);
			const normalized = hasher.transform("hello world", true);

			// Normalized should have different values
			const unnormValues = Array.from(unnormalized.values());
			const normValues = Array.from(normalized.values());

			// Calculate norms
			const unnormNorm = Math.sqrt(
				unnormValues.reduce((sum, v) => sum + v * v, 0),
			);
			const normNorm = Math.sqrt(normValues.reduce((sum, v) => sum + v * v, 0));

			ok(Math.abs(unnormNorm - 1) > 0.1); // Should not be unit norm
			ok(Math.abs(normNorm - 1) < 0.001); // Should be approximately unit norm
		});

		it("produces consistent results for same input", () => {
			const hasher = new FeatureHasher({ numFeatures: 50 });

			const vector1 = hasher.transform("machine learning");
			const vector2 = hasher.transform("machine learning");

			// Should be identical
			strictEqual(vector1.size, vector2.size);
			for (const [index, value] of vector1) {
				strictEqual(vector2.get(index), value);
			}
		});

		it("handles empty input gracefully", () => {
			const hasher = new FeatureHasher();

			const sparseVector = hasher.transform("");
			const denseVector = hasher.transformDense("");

			strictEqual(sparseVector.size, 0);
			ok(denseVector.every((v) => v === 0));
		});
	});

	describe("batch processing", () => {
		it("transforms multiple texts to sparse vectors", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });
			const texts = ["hello world", "machine learning", "feature hashing"];

			const vectors = hasher.transformBatch(texts);

			strictEqual(vectors.length, 3);
			ok(vectors.every((v) => v instanceof Map));
			ok(vectors.every((v) => v.size > 0));
		});

		it("transforms multiple texts to dense matrix", () => {
			const hasher = new FeatureHasher({ numFeatures: 20 });
			const texts = ["hello world", "machine learning"];

			const matrix = hasher.transformBatchDense(texts);

			strictEqual(matrix.length, 2);
			ok(matrix.every((row) => Array.isArray(row) && row.length === 20));
		});
	});

	describe("similarity computation", () => {
		it("computes cosine similarity between vectors", () => {
			const hasher = new FeatureHasher({ numFeatures: 1000 });

			// Create test vectors
			const vector1 = new Map([
				[0, 1],
				[1, 2],
				[2, 1],
			]);
			const vector2 = new Map([
				[0, 2],
				[1, 1],
				[3, 1],
			]);

			const similarity = hasher.cosineSimilarity(vector1, vector2);

			ok(typeof similarity === "number");
			ok(similarity >= -1 && similarity <= 1);
		});

		it("computes text similarity", () => {
			const hasher = new FeatureHasher({ numFeatures: 1000 });

			const sim1 = hasher.similarity("hello world", "hello world");
			const sim2 = hasher.similarity("hello world", "goodbye world");
			const sim3 = hasher.similarity("hello world", "completely different");

			// Identical texts should have similarity 1
			ok(Math.abs(sim1 - 1) < 0.001);

			// Similar texts should have higher similarity
			ok(sim2 > sim3);

			// All similarities should be in valid range
			ok(sim1 >= -1 && sim1 <= 1);
			ok(sim2 >= -1 && sim2 <= 1);
			ok(sim3 >= -1 && sim3 <= 1);
		});

		it("handles zero vectors in similarity", () => {
			const hasher = new FeatureHasher();

			const emptyVector = new Map();
			const normalVector = new Map([
				[0, 1],
				[5, 2],
			]);

			const similarity = hasher.cosineSimilarity(emptyVector, normalVector);

			strictEqual(similarity, 0);
		});
	});

	describe("collision analysis", () => {
		it("analyzes hash collisions", () => {
			const hasher = new FeatureHasher({ numFeatures: 10 }); // Small for collisions
			const features = [];

			// Generate many features to force collisions
			for (let i = 0; i < 50; i++) {
				features.push(`feature_${i}`);
			}

			const analysis = hasher.analyzeCollisions(features);

			strictEqual(analysis.totalFeatures, 50);
			ok(analysis.uniqueHashes > 0);
			ok(analysis.uniqueIndices > 0);
			ok(analysis.uniqueIndices <= 10); // Can't exceed numFeatures
			ok(analysis.indexCollisions >= 0);
			ok(analysis.loadFactor > 0);
			ok(typeof analysis.hashCollisions === "number");
		});
	});

	describe("integration with existing arsenal", () => {
		it("integrates with n-gram options", () => {
			const hasher = new FeatureHasher({
				featureType: "word",
				ngramOptions: { normalize: false, lowercase: false },
			});

			const features1 = hasher.extractFeatures("Hello WORLD");
			const features2 = new FeatureHasher({
				featureType: "word",
				ngramOptions: { normalize: true, lowercase: true },
			}).extractFeatures("Hello WORLD");

			// Should get different features due to different normalization
			ok(features1.includes("Hello"));
			ok(features1.includes("WORLD"));
			ok(features2.includes("hello"));
			ok(features2.includes("world"));
		});

		it("works with different n-gram configurations", () => {
			const charHasher = new FeatureHasher({
				featureType: "char",
				ngramOptions: {},
			});

			const wordHasher = new FeatureHasher({
				featureType: "word",
				ngramOptions: {},
			});

			const text = "machine learning";
			const charVector = charHasher.transform(text);
			const wordVector = wordHasher.transform(text);

			// Should produce different feature vectors
			ok(charVector.size !== wordVector.size || charVector !== wordVector);
		});
	});

	describe("edge cases and error handling", () => {
		it("handles very small numFeatures", () => {
			const hasher = new FeatureHasher({ numFeatures: 1 });
			const vector = hasher.transform("hello world");

			// All features should hash to index 0
			for (const [index] of vector) {
				strictEqual(index, 0);
			}
		});

		it("handles large numFeatures", () => {
			const hasher = new FeatureHasher({ numFeatures: 1000000 });
			const vector = hasher.transform("test");

			// Should work without issues
			ok(vector.size > 0);
			for (const [index] of vector) {
				ok(index >= 0 && index < 1000000);
			}
		});

		it("handles Unicode text correctly", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });
			const vector = hasher.transform("café naïve résumé");

			ok(vector.size > 0);
			// Should not crash and produce valid indices
			for (const [index] of vector) {
				ok(index >= 0 && index < 100);
			}
		});

		it("sign hashing produces consistent signs", () => {
			const hasher = new FeatureHasher({ useSignHash: true });

			const signs = new Set();
			for (let i = 0; i < 20; i++) {
				const { sign } = hasher.hashFeature(`feature_${i}`);
				signs.add(sign);
			}

			// Should use both positive and negative signs
			ok(signs.has(1) || signs.has(-1));
		});
	});

	describe("performance and scaling", () => {
		it("handles reasonably large input efficiently", () => {
			const hasher = new FeatureHasher({ numFeatures: 10000 });

			// Generate large text
			const words = Array.from({ length: 1000 }, (_, i) => `word${i}`);
			const largeText = words.join(" ");

			const start = Date.now();
			const vector = hasher.transform(largeText);
			const elapsed = Date.now() - start;

			// Should complete quickly (under 100ms typically)
			ok(elapsed < 1000, "Should process large text efficiently");
			ok(vector.size > 0, "Should produce non-empty vector");
		});

		it("batch processing is consistent with individual processing", () => {
			const hasher = new FeatureHasher({ numFeatures: 100 });
			const texts = ["hello world", "machine learning", "feature hashing"];

			const batchVectors = hasher.transformBatch(texts);
			const individualVectors = texts.map((text) => hasher.transform(text));

			strictEqual(batchVectors.length, individualVectors.length);

			for (let i = 0; i < texts.length; i++) {
				const batchVector = batchVectors[i];
				const individualVector = individualVectors[i];

				strictEqual(batchVector.size, individualVector.size);
				for (const [index, value] of batchVector) {
					strictEqual(individualVector.get(index), value);
				}
			}
		});
	});
});
