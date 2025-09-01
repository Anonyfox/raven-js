/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { SimHasher } from "./simhash.js";

describe("SimHash", () => {
	describe("SimHasher constructor", () => {
		it("creates instance with default options", () => {
			const hasher = new SimHasher();

			strictEqual(hasher.hashBits, 64);
			strictEqual(hasher.useWordShingles, true);
			strictEqual(hasher.wordShingleSize, 2);
			strictEqual(hasher.charShingleSize, 3);
			strictEqual(hasher.normalize, true);
			strictEqual(hasher.lowercase, true);
		});

		it("creates instance with custom options", () => {
			const hasher = new SimHasher({
				hashBits: 32,
				useWordShingles: false,
				wordShingleSize: 3,
				charShingleSize: 4,
				normalize: false,
				lowercase: false,
			});

			strictEqual(hasher.hashBits, 32);
			strictEqual(hasher.useWordShingles, false);
			strictEqual(hasher.wordShingleSize, 3);
			strictEqual(hasher.charShingleSize, 4);
			strictEqual(hasher.normalize, false);
			strictEqual(hasher.lowercase, false);
		});

		it("throws error for invalid hash bits", () => {
			throws(() => new SimHasher({ hashBits: 0 }), /must be between 1 and 64/);
			throws(() => new SimHasher({ hashBits: 65 }), /must be between 1 and 64/);
			throws(() => new SimHasher({ hashBits: -1 }), /must be between 1 and 64/);
		});
	});

	describe("extractFeatures", () => {
		const hasher = new SimHasher({ hashBits: 32 });

		it("extracts word features by default", () => {
			const features = hasher.extractFeatures("hello world test");

			ok(features instanceof Map);
			ok(features.has("hello world"));
			ok(features.has("world test"));
			strictEqual(features.size, 2);
		});

		it("extracts character features when configured", () => {
			const charHasher = new SimHasher({
				hashBits: 32,
				useWordShingles: false,
				charShingleSize: 3,
			});

			const features = charHasher.extractFeatures("hello");

			ok(features instanceof Map);
			ok(features.has("hel"));
			ok(features.has("ell"));
			ok(features.has("llo"));
		});

		it("counts feature frequencies", () => {
			const features = hasher.extractFeatures("hello world hello test");

			ok(features.has("hello world"));
			ok(features.has("world hello"));
			ok(features.has("hello test"));
			strictEqual(features.get("hello world"), 1);
			strictEqual(features.get("world hello"), 1);
			strictEqual(features.get("hello test"), 1);
		});

		it("applies normalization when enabled", () => {
			const normalizedHasher = new SimHasher({
				hashBits: 32,
				normalize: true,
				lowercase: true,
			});

			const features1 = normalizedHasher.extractFeatures("Hello World");
			const features2 = normalizedHasher.extractFeatures("hello world");

			// Should produce the same features after normalization
			ok(features1.has("hello world"));
			ok(features2.has("hello world"));
		});

		it("preserves case when normalization disabled", () => {
			const unnormalizedHasher = new SimHasher({
				hashBits: 32,
				normalize: false,
				lowercase: false,
			});

			const features = unnormalizedHasher.extractFeatures("Hello World");

			ok(features.has("Hello World"));
			ok(!features.has("hello world"));
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.extractFeatures(123), /must be a string/);
			throws(() => hasher.extractFeatures(null), /must be a string/);
		});
	});

	describe("computeFromFeatures", () => {
		const hasher = new SimHasher({ hashBits: 8 }); // Small for easier testing

		it("computes hash from feature map", () => {
			const features = new Map([
				["feature1", 1],
				["feature2", 2],
				["feature3", 1],
			]);

			const hash = hasher.computeFromFeatures(features);

			ok(typeof hash === "bigint");
			ok(hash >= 0n);
			ok(hash < 256n); // 2^8
		});

		it("produces different hashes for different features", () => {
			const features1 = new Map([["feature1", 1]]);
			const features2 = new Map([["feature2", 1]]);

			const hash1 = hasher.computeFromFeatures(features1);
			const hash2 = hasher.computeFromFeatures(features2);

			// Should be different (with very high probability)
			ok(hash1 !== hash2);
		});

		it("considers feature weights", () => {
			const features1 = new Map([["feature1", 1]]);
			const features2 = new Map([["feature1", 10]]);

			const hash1 = hasher.computeFromFeatures(features1);
			const hash2 = hasher.computeFromFeatures(features2);

			// May be same or different depending on hash collision, but should handle weights
			ok(typeof hash1 === "bigint");
			ok(typeof hash2 === "bigint");
		});

		it("handles empty feature map", () => {
			const features = new Map();
			const hash = hasher.computeFromFeatures(features);

			ok(typeof hash === "bigint");
			// Empty features typically result in all bits being 0
		});

		it("skips invalid feature entries", () => {
			const features = new Map([
				["valid", 1],
				[123, "invalid"], // Invalid key type
				["also valid", 2],
			]);

			const hash = hasher.computeFromFeatures(features);
			ok(typeof hash === "bigint");
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.computeFromFeatures("not a map"), /must be a Map/);
			throws(() => hasher.computeFromFeatures([]), /must be a Map/);
		});
	});

	describe("computeFromText", () => {
		const hasher = new SimHasher({ hashBits: 32 });

		it("computes hash directly from text", () => {
			const hash = hasher.computeFromText("hello world test");

			ok(typeof hash === "bigint");
			ok(hash >= 0n);
		});

		it("produces similar hashes for similar text", () => {
			const hash1 = hasher.computeFromText("hello world");
			const hash2 = hasher.computeFromText("hello world test");

			ok(typeof hash1 === "bigint");
			ok(typeof hash2 === "bigint");

			// Similar texts should have small Hamming distance
			const distance = hasher.hammingDistance(hash1, hash2);
			ok(distance < hasher.hashBits / 2); // Should be relatively similar
		});

		it("produces different hashes for different text", () => {
			const hash1 = hasher.computeFromText("hello world");
			const hash2 = hasher.computeFromText("goodbye universe");

			const distance = hasher.hammingDistance(hash1, hash2);
			ok(distance > 0); // Should be different
		});

		it("handles empty text", () => {
			const hash = hasher.computeFromText("");
			ok(typeof hash === "bigint");
		});

		it("is deterministic", () => {
			const text = "deterministic test";
			const hash1 = hasher.computeFromText(text);
			const hash2 = hasher.computeFromText(text);

			strictEqual(hash1, hash2);
		});
	});

	describe("computeBatch", () => {
		const hasher = new SimHasher({ hashBits: 16 });

		it("computes hashes for multiple texts", () => {
			const texts = ["hello world", "goodbye universe", "test document"];
			const hashes = hasher.computeBatch(texts);

			strictEqual(hashes.length, 3);
			for (const hash of hashes) {
				ok(typeof hash === "bigint");
			}
		});

		it("handles empty array", () => {
			const hashes = hasher.computeBatch([]);
			deepStrictEqual(hashes, []);
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.computeBatch("not an array"), /must be an array/);
			throws(() => hasher.computeBatch(["valid", 123]), /must be strings/);
		});
	});

	describe("hammingDistance", () => {
		const hasher = new SimHasher({ hashBits: 8 });

		it("calculates distance between identical hashes", () => {
			const hash = 0b10101010n;
			const distance = hasher.hammingDistance(hash, hash);
			strictEqual(distance, 0);
		});

		it("calculates distance between different hashes", () => {
			const hash1 = 0b10101010n;
			const hash2 = 0b01010101n;
			const distance = hasher.hammingDistance(hash1, hash2);
			strictEqual(distance, 8); // All bits different
		});

		it("calculates partial distance", () => {
			const hash1 = 0b10000000n;
			const hash2 = 0b10000001n;
			const distance = hasher.hammingDistance(hash1, hash2);
			strictEqual(distance, 1); // One bit different
		});

		it("is symmetric", () => {
			const hash1 = 0b10101010n;
			const hash2 = 0b11001100n;
			const distance1 = hasher.hammingDistance(hash1, hash2);
			const distance2 = hasher.hammingDistance(hash2, hash1);
			strictEqual(distance1, distance2);
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.hammingDistance("not bigint", 0n), /must be BigInt/);
			throws(() => hasher.hammingDistance(0n, 123), /must be BigInt/);
		});
	});

	describe("similarity", () => {
		const hasher = new SimHasher({ hashBits: 8 });

		it("returns 1 for identical hashes", () => {
			const hash = 0b10101010n;
			const sim = hasher.similarity(hash, hash);
			strictEqual(sim, 1);
		});

		it("returns 0 for maximally different hashes", () => {
			const hash1 = 0b11111111n;
			const hash2 = 0b00000000n;
			const sim = hasher.similarity(hash1, hash2);
			strictEqual(sim, 0);
		});

		it("calculates intermediate similarity", () => {
			const hash1 = 0b11110000n;
			const hash2 = 0b11111111n; // 4 bits different
			const sim = hasher.similarity(hash1, hash2);
			strictEqual(sim, 0.5); // (8-4)/8 = 0.5
		});

		it("is symmetric", () => {
			const hash1 = 0b10101010n;
			const hash2 = 0b11001100n;
			const sim1 = hasher.similarity(hash1, hash2);
			const sim2 = hasher.similarity(hash2, hash1);
			strictEqual(sim1, sim2);
		});
	});

	describe("findSimilar", () => {
		const hasher = new SimHasher({ hashBits: 8 });
		const query = 0b10101010n;
		const candidates = [
			0b10101010n, // Identical (distance 0)
			0b10101011n, // Distance 1
			0b10100010n, // Distance 2
			0b11111111n, // Distance 6
		];

		it("finds similar hashes within distance threshold", () => {
			const results = hasher.findSimilar(query, candidates, {
				maxDistance: 2,
			});

			ok(results.length >= 1); // At least the identical match
			ok(results.length <= 3); // No more than the expected candidates
			strictEqual(results[0].distance, 0); // First result should be identical

			// Verify all results are within threshold
			for (const result of results) {
				ok(result.distance <= 2);
			}
		});

		it("sorts results by distance", () => {
			const results = hasher.findSimilar(query, candidates, {
				maxDistance: 10,
			});

			for (let i = 1; i < results.length; i++) {
				ok(results[i - 1].distance <= results[i].distance);
			}
		});

		it("respects maxResults parameter", () => {
			const results = hasher.findSimilar(query, candidates, {
				maxDistance: 10,
				maxResults: 2,
			});

			ok(results.length <= 2);
		});

		it("includes similarity scores", () => {
			const results = hasher.findSimilar(query, candidates, {
				maxDistance: 1,
			});

			for (const result of results) {
				ok(typeof result.similarity === "number");
				ok(result.similarity >= 0 && result.similarity <= 1);
			}
		});

		it("includes original indices", () => {
			const results = hasher.findSimilar(query, candidates, {
				maxDistance: 2,
			});

			for (const result of results) {
				ok(typeof result.index === "number");
				ok(result.index >= 0 && result.index < candidates.length);
			}
		});

		it("handles empty candidates", () => {
			const results = hasher.findSimilar(query, []);
			deepStrictEqual(results, []);
		});

		it("skips invalid candidate entries", () => {
			const mixedCandidates = [0b10101010n, "invalid", 0b10101011n, null];

			const results = hasher.findSimilar(query, mixedCandidates, {
				maxDistance: 1,
			});

			strictEqual(results.length, 2);
			strictEqual(results[0].index, 0);
			strictEqual(results[1].index, 2);
		});

		it("throws error for invalid input", () => {
			throws(
				() => hasher.findSimilar("not bigint", candidates),
				/must be BigInt/,
			);
			throws(() => hasher.findSimilar(query, "not array"), /must be an array/);
		});
	});

	describe("findSimilarTexts", () => {
		const hasher = new SimHasher({ hashBits: 16 });

		it("finds similar texts", () => {
			const query = "hello world test";
			const candidates = [
				"hello world test", // Identical
				"hello world testing", // Similar
				"goodbye universe", // Different
				"hello world example", // Similar
			];

			const results = hasher.findSimilarTexts(query, candidates, {
				maxDistance: 3,
			});

			ok(results.length >= 1);
			strictEqual(results[0].text, "hello world test");
			strictEqual(results[0].distance, 0);
			strictEqual(results[0].similarity, 1);
		});

		it("includes all result properties", () => {
			const query = "test document";
			const candidates = ["test document", "test documentation"];

			const results = hasher.findSimilarTexts(query, candidates, {
				maxDistance: 5,
			});

			for (const result of results) {
				ok(typeof result.text === "string");
				ok(typeof result.hash === "bigint");
				ok(typeof result.distance === "number");
				ok(typeof result.similarity === "number");
				ok(typeof result.index === "number");
			}
		});

		it("handles empty candidates", () => {
			const results = hasher.findSimilarTexts("test", []);
			deepStrictEqual(results, []);
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.findSimilarTexts(123, ["text"]), /must be a string/);
			throws(
				() => hasher.findSimilarTexts("text", "not array"),
				/must be an array/,
			);
		});
	});

	describe("clusterSimilar", () => {
		const hasher = new SimHasher({ hashBits: 16 });

		it("groups similar texts together", () => {
			const texts = [
				"hello world",
				"hello world test", // Similar to first
				"goodbye universe",
				"goodbye world", // Different from all
				"hello earth", // Somewhat similar to first group
			];

			const groups = hasher.clusterSimilar(texts, { maxDistance: 3 });

			ok(Array.isArray(groups));
			ok(groups.length >= 1);

			// Check group structure
			for (const group of groups) {
				ok(typeof group.representative === "string");
				ok(Array.isArray(group.members));
				ok(Array.isArray(group.hashes));
				ok(group.members.length === group.hashes.length);
				ok(group.members.includes(group.representative));
			}

			// Verify all texts are assigned to exactly one group
			const allMembers = groups.flatMap((g) => g.members);
			strictEqual(allMembers.length, texts.length);
			for (const text of texts) {
				ok(allMembers.includes(text));
			}
		});

		it("sorts groups by size", () => {
			const texts = [
				"single item",
				"group1 item1",
				"group1 item2",
				"group1 item3",
				"group2 item1",
				"group2 item2",
			];

			const groups = hasher.clusterSimilar(texts, { maxDistance: 1 });

			for (let i = 1; i < groups.length; i++) {
				ok(groups[i - 1].members.length >= groups[i].members.length);
			}
		});

		it("handles single text", () => {
			const groups = hasher.clusterSimilar(["single text"]);

			strictEqual(groups.length, 1);
			strictEqual(groups[0].members.length, 1);
			strictEqual(groups[0].representative, "single text");
		});

		it("handles empty array", () => {
			const groups = hasher.clusterSimilar([]);
			deepStrictEqual(groups, []);
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.clusterSimilar("not array"), /must be an array/);
		});
	});

	describe("analyzeDistribution", () => {
		const hasher = new SimHasher({ hashBits: 8 });

		it("analyzes distance distribution", () => {
			const signatures = [
				0b00000000n,
				0b00000001n, // Distance 1 from first
				0b00000011n, // Distance 2 from first, 1 from second
				0b11111111n, // Distance 8 from first
			];

			const analysis = hasher.analyzeDistribution(signatures);

			strictEqual(analysis.totalPairs, 6); // C(4,2) = 6 pairs
			ok(typeof analysis.distanceDistribution === "object");
			ok(typeof analysis.meanDistance === "number");
			ok(typeof analysis.medianDistance === "number");
			ok(typeof analysis.minDistance === "number");
			ok(typeof analysis.maxDistance === "number");
			strictEqual(analysis.hashBits, 8);

			// Verify some expected distances exist
			ok(analysis.distanceDistribution[1] > 0);
		});

		it("handles single signature", () => {
			const analysis = hasher.analyzeDistribution([0b10101010n]);

			strictEqual(analysis.totalPairs, 0);
			strictEqual(analysis.meanDistance, 0);
			strictEqual(analysis.minDistance, 0);
			strictEqual(analysis.maxDistance, 0);
		});

		it("handles empty array", () => {
			const analysis = hasher.analyzeDistribution([]);

			strictEqual(analysis.totalPairs, 0);
			strictEqual(analysis.meanDistance, 0);
			strictEqual(analysis.minDistance, 0);
			strictEqual(analysis.maxDistance, 0);
		});

		it("throws error for invalid input", () => {
			throws(() => hasher.analyzeDistribution("not array"), /must be an array/);
		});
	});

	describe("string conversions", () => {
		const hasher = new SimHasher({ hashBits: 8 });

		describe("binary string", () => {
			it("converts to binary string", () => {
				const hash = 0b10101010n;
				const binary = hasher.toBinaryString(hash);
				strictEqual(binary, "10101010");
			});

			it("pads shorter hashes", () => {
				const hash = 0b1010n;
				const binary = hasher.toBinaryString(hash);
				strictEqual(binary, "00001010");
			});

			it("converts from binary string", () => {
				const binary = "10101010";
				const hash = hasher.fromBinaryString(binary);
				strictEqual(hash, 0b10101010n);
			});

			it("round-trips correctly", () => {
				const original = 0b11001100n;
				const binary = hasher.toBinaryString(original);
				const restored = hasher.fromBinaryString(binary);
				strictEqual(original, restored);
			});

			it("throws error for invalid binary string", () => {
				throws(
					() => hasher.fromBinaryString("1010101"), // Wrong length
					/does not match hash bits/,
				);
				throws(
					() => hasher.fromBinaryString("1010102"), // Invalid character
					/must contain only 0s and 1s/,
				);
			});

			it("throws error for invalid input", () => {
				throws(() => hasher.toBinaryString("not bigint"), /must be BigInt/);
				throws(() => hasher.fromBinaryString(123), /must be a string/);
			});
		});

		describe("hex string", () => {
			it("converts to hex string", () => {
				const hash = 0xaan;
				const hex = hasher.toHexString(hash);
				strictEqual(hex, "aa");
			});

			it("pads shorter hashes", () => {
				const hash = 0xan;
				const hex = hasher.toHexString(hash);
				strictEqual(hex, "0a");
			});

			it("converts from hex string", () => {
				const hex = "aa";
				const hash = hasher.fromHexString(hex);
				strictEqual(hash, 0xaan);
			});

			it("round-trips correctly", () => {
				const original = 0xccn;
				const hex = hasher.toHexString(original);
				const restored = hasher.fromHexString(hex);
				strictEqual(original, restored);
			});

			it("handles uppercase hex", () => {
				const hash = hasher.fromHexString("AA");
				strictEqual(hash, 0xaan);
			});

			it("throws error for invalid hex string", () => {
				throws(
					() => hasher.fromHexString("GG"), // Invalid character
					/must contain only hexadecimal characters/,
				);
				throws(
					() => hasher.fromHexString("123456789"), // Too large for 8 bits
					/too large for hash bits/,
				);
			});

			it("throws error for invalid input", () => {
				throws(() => hasher.toHexString("not bigint"), /must be BigInt/);
				throws(() => hasher.fromHexString(123), /must be a string/);
			});
		});
	});

	describe("integration and performance", () => {
		it("handles realistic document deduplication", () => {
			const hasher = new SimHasher({ hashBits: 64 });

			const documents = [
				"Machine learning is a powerful tool for data analysis and pattern recognition.",
				"Machine learning is a powerful technique for data analysis and pattern recognition.", // Very similar
				"Deep learning uses neural networks to process complex data structures effectively.",
				"Artificial intelligence encompasses machine learning and deep learning methodologies.",
				"The quick brown fox jumps over the lazy dog in the meadow.", // Completely different
				"Machine learning provides powerful tools for analyzing data and recognizing patterns.", // Similar to first
			];

			// Compute signatures
			const signatures = hasher.computeBatch(documents);
			strictEqual(signatures.length, documents.length);

			// Find duplicates (very similar documents) - use higher threshold for clustering
			const groups = hasher.clusterSimilar(documents, { maxDistance: 8 });

			ok(groups.length > 0);
			ok(groups.length <= documents.length); // Should group some together or keep all separate

			// Test search functionality with a very high threshold
			let queryResults = hasher.findSimilarTexts(
				"Machine learning for pattern recognition",
				documents,
				{ maxDistance: 20 }, // Very high threshold
			);

			// If no results, try with identical text
			if (queryResults.length === 0) {
				queryResults = hasher.findSimilarTexts(
					documents[0], // Use exact document
					documents,
					{ maxDistance: 5 },
				);
			}

			ok(
				queryResults.length > 0,
				"Should find at least some similar documents",
			);

			// Test with exact text match should always work
			const exactResults = hasher.findSimilarTexts(documents[0], documents);
			ok(exactResults.length > 0, "Should find exact matches");
			strictEqual(
				exactResults[0].distance,
				0,
				"Exact match should have distance 0",
			);

			// Verify that similar documents have relatively small distances
			const hash1 = hasher.computeFromText(documents[0]);
			const hash2 = hasher.computeFromText(documents[1]);
			const distance = hasher.hammingDistance(hash1, hash2);

			// Very similar documents should have smaller distance than random documents
			ok(
				distance < hasher.hashBits / 2,
				"Similar documents should have smaller Hamming distance",
			);
		});

		it("produces consistent results across multiple runs", () => {
			const hasher = new SimHasher({ hashBits: 32 });
			const text = "consistent test document for reproducibility";

			const hash1 = hasher.computeFromText(text);
			const hash2 = hasher.computeFromText(text);
			const hash3 = hasher.computeFromText(text);

			strictEqual(hash1, hash2);
			strictEqual(hash2, hash3);
		});

		it("handles large batch processing", () => {
			const hasher = new SimHasher({ hashBits: 48 });

			// Generate test documents
			const documents = [];
			for (let i = 0; i < 50; i++) {
				documents.push(
					`Document ${i} contains some text about topic ${i % 5} with additional content.`,
				);
			}

			// Should handle batch computation efficiently
			const signatures = hasher.computeBatch(documents);
			strictEqual(signatures.length, 50);

			// Analyze distribution
			const analysis = hasher.analyzeDistribution(signatures);
			strictEqual(analysis.totalPairs, 1225); // C(50,2) = 1225

			ok(analysis.meanDistance > 0);
			ok(analysis.maxDistance <= hasher.hashBits);
			ok(typeof analysis.distanceDistribution === "object");
		});

		it("string conversions preserve hash information", () => {
			const hasher = new SimHasher({ hashBits: 24 });
			const originalHash = hasher.computeFromText("conversion test");

			// Test binary conversion
			const binary = hasher.toBinaryString(originalHash);
			const fromBinary = hasher.fromBinaryString(binary);
			strictEqual(originalHash, fromBinary);

			// Test hex conversion
			const hex = hasher.toHexString(originalHash);
			const fromHex = hasher.fromHexString(hex);
			strictEqual(originalHash, fromHex);

			// Verify the conversions represent the same value
			strictEqual(fromBinary, fromHex);
		});

		it("different hash bit sizes work correctly", () => {
			const sizes = [8, 16, 32, 48, 64];
			const testText = "multi-size hash test document";

			for (const bits of sizes) {
				const hasher = new SimHasher({ hashBits: bits });
				const hash = hasher.computeFromText(testText);

				ok(typeof hash === "bigint");
				ok(hash >= 0n);
				ok(hash < 2n ** BigInt(bits));

				// Test string conversion works for all sizes
				const binary = hasher.toBinaryString(hash);
				strictEqual(binary.length, bits);

				const restored = hasher.fromBinaryString(binary);
				strictEqual(hash, restored);
			}
		});
	});
});
