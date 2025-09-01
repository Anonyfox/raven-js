/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import * as similarity from "./index.js";

describe("similarity module", () => {
	it("exports all similarity functions", () => {
		// Damerau-Levenshtein exports
		ok(
			typeof similarity.damerauLevenshteinDistance === "function",
			"Should export damerauLevenshteinDistance",
		);
		ok(
			typeof similarity.damerauLevenshteinSimilarity === "function",
			"Should export damerauLevenshteinSimilarity",
		);
		ok(
			typeof similarity.osaDistance === "function",
			"Should export osaDistance",
		);
		ok(
			typeof similarity.osaSimilarity === "function",
			"Should export osaSimilarity",
		);

		// Jaro-Winkler exports
		ok(
			typeof similarity.jaroSimilarity === "function",
			"Should export jaroSimilarity",
		);
		ok(
			typeof similarity.jaroDistance === "function",
			"Should export jaroDistance",
		);
		ok(
			typeof similarity.jaroWinklerSimilarity === "function",
			"Should export jaroWinklerSimilarity",
		);
		ok(
			typeof similarity.jaroWinklerDistance === "function",
			"Should export jaroWinklerDistance",
		);
		ok(
			typeof similarity.findBestMatch === "function",
			"Should export findBestMatch",
		);
		ok(
			typeof similarity.groupSimilarStrings === "function",
			"Should export groupSimilarStrings",
		);
	});

	it("functions work through re-exports", () => {
		// Test Damerau-Levenshtein
		const dlDistance = similarity.damerauLevenshteinDistance("cat", "bat");
		ok(typeof dlDistance === "number", "Should return numeric distance");
		ok(dlDistance >= 0, "Distance should be non-negative");

		const dlSimilarity = similarity.damerauLevenshteinSimilarity(
			"hello",
			"hello",
		);
		ok(dlSimilarity === 1, "Identical strings should have similarity 1");

		// Test OSA
		const osaDistance = similarity.osaDistance("test", "best");
		ok(typeof osaDistance === "number", "Should return numeric OSA distance");

		const osaSim = similarity.osaSimilarity("identical", "identical");
		ok(osaSim === 1, "Identical strings should have OSA similarity 1");

		// Test Jaro
		const jaroSim = similarity.jaroSimilarity("martha", "marhta");
		ok(typeof jaroSim === "number", "Should return numeric Jaro similarity");
		ok(
			jaroSim >= 0 && jaroSim <= 1,
			"Jaro similarity should be between 0 and 1",
		);

		const jaroDist = similarity.jaroDistance("abc", "xyz");
		ok(typeof jaroDist === "number", "Should return numeric Jaro distance");

		// Test Jaro-Winkler
		const jwSim = similarity.jaroWinklerSimilarity(
			"prefix_test",
			"prefix_best",
		);
		ok(
			typeof jwSim === "number",
			"Should return numeric Jaro-Winkler similarity",
		);
		ok(
			jwSim >= 0 && jwSim <= 1,
			"Jaro-Winkler similarity should be between 0 and 1",
		);

		const jwDist = similarity.jaroWinklerDistance("hello", "world");
		ok(
			typeof jwDist === "number",
			"Should return numeric Jaro-Winkler distance",
		);

		// Test utility functions
		const match = similarity.findBestMatch("test", ["test1", "test2", "best"]);
		ok(match !== null, "Should find a match");
		ok(
			typeof match.candidate === "string",
			"Match should have candidate string",
		);
		ok(
			typeof match.similarity === "number",
			"Match should have similarity score",
		);

		const groups = similarity.groupSimilarStrings(["apple", "aple", "orange"]);
		ok(Array.isArray(groups), "Should return array of groups");
		ok(groups.length > 0, "Should create at least one group");

		// Test MinHash
		const minhasher = new similarity.MinHasher({ numHashes: 32 });
		const textSig = minhasher.computeTextSignature("hello world");
		ok(Array.isArray(textSig), "Should compute MinHash signature");
		strictEqual(textSig.length, 32, "Signature should have correct length");

		// Test LSH
		const lsh = new similarity.LSHBuckets({ numBands: 4, signatureLength: 16 });
		const itemId = lsh.add(
			"test document",
			Array.from({ length: 16 }, (_, i) => i),
		);
		ok(typeof itemId === "number", "Should add item and return ID");
		strictEqual(lsh.getStats().totalItems, 1, "Should have one item");

		// Test SimHash
		const simhasher = new similarity.SimHasher({ hashBits: 32 });
		const simhash1 = simhasher.computeFromText("hello world test");
		const simhash2 = simhasher.computeFromText("hello world test");
		ok(typeof simhash1 === "bigint", "Should compute SimHash signature");
		strictEqual(simhash1, simhash2, "Should produce consistent hashes");

		const hammingDist = simhasher.hammingDistance(simhash1, simhash2);
		strictEqual(hammingDist, 0, "Identical texts should have distance 0");
	});

	it("algorithms produce consistent results", () => {
		const testString1 = "algorithm";
		const testString2 = "logarithm";

		// All similarity measures should return values between 0 and 1
		const dlSim = similarity.damerauLevenshteinSimilarity(
			testString1,
			testString2,
		);
		const osaSim = similarity.osaSimilarity(testString1, testString2);
		const jaroSim = similarity.jaroSimilarity(testString1, testString2);
		const jwSim = similarity.jaroWinklerSimilarity(testString1, testString2);

		ok(dlSim >= 0 && dlSim <= 1, "DL similarity in valid range");
		ok(osaSim >= 0 && osaSim <= 1, "OSA similarity in valid range");
		ok(jaroSim >= 0 && jaroSim <= 1, "Jaro similarity in valid range");
		ok(jwSim >= 0 && jwSim <= 1, "Jaro-Winkler similarity in valid range");

		// Jaro-Winkler should be >= Jaro for strings with common prefixes
		ok(jwSim >= jaroSim, "Jaro-Winkler should be >= Jaro");

		// Distance + similarity should complement each other
		const jaroDist = similarity.jaroDistance(testString1, testString2);
		const jwDist = similarity.jaroWinklerDistance(testString1, testString2);

		ok(
			Math.abs(jaroSim + jaroDist - 1) < 0.001,
			"Jaro similarity and distance should be complementary",
		);
		ok(
			Math.abs(jwSim + jwDist - 1) < 0.001,
			"Jaro-Winkler similarity and distance should be complementary",
		);
	});

	it("handles edge cases consistently", () => {
		// Empty strings
		const dlEmpty = similarity.damerauLevenshteinSimilarity("", "");
		const osaEmpty = similarity.osaSimilarity("", "");
		const jaroEmpty = similarity.jaroSimilarity("", "");
		const jwEmpty = similarity.jaroWinklerSimilarity("", "");

		ok(dlEmpty === 1, "All algorithms should return 1 for empty strings");
		ok(osaEmpty === 1, "OSA should return 1 for empty strings");
		ok(jaroEmpty === 1, "Jaro should return 1 for empty strings");
		ok(jwEmpty === 1, "Jaro-Winkler should return 1 for empty strings");

		// Identical strings
		const testStr = "identical";
		ok(
			similarity.damerauLevenshteinDistance(testStr, testStr) === 0,
			"DL distance should be 0 for identical strings",
		);
		ok(
			similarity.osaDistance(testStr, testStr) === 0,
			"OSA distance should be 0 for identical strings",
		);
		ok(
			similarity.jaroSimilarity(testStr, testStr) === 1,
			"Jaro similarity should be 1 for identical strings",
		);
		ok(
			similarity.jaroWinklerSimilarity(testStr, testStr) === 1,
			"Jaro-Winkler similarity should be 1 for identical strings",
		);
	});
});
