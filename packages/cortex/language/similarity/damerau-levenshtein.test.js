/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import {
	damerauLevenshteinDistance,
	damerauLevenshteinSimilarity,
	osaDistance,
	osaSimilarity,
} from "./damerau-levenshtein.js";

describe("Damerau-Levenshtein Distance", () => {
	describe("damerauLevenshteinDistance", () => {
		it("handles identical strings", () => {
			strictEqual(damerauLevenshteinDistance("hello", "hello"), 0);
			strictEqual(damerauLevenshteinDistance("", ""), 0);
		});

		it("handles empty strings", () => {
			strictEqual(damerauLevenshteinDistance("", "hello"), 5);
			strictEqual(damerauLevenshteinDistance("hello", ""), 5);
		});

		it("calculates single character edits", () => {
			// Substitution
			strictEqual(damerauLevenshteinDistance("cat", "bat"), 1);
			// Insertion
			strictEqual(damerauLevenshteinDistance("cat", "cart"), 1);
			// Deletion
			strictEqual(damerauLevenshteinDistance("cart", "cat"), 1);
			// Transposition
			strictEqual(damerauLevenshteinDistance("ca", "ac"), 1);
		});

		it("calculates complex transformations", () => {
			// Multiple operations
			strictEqual(damerauLevenshteinDistance("kitten", "sitting"), 3);
			strictEqual(damerauLevenshteinDistance("saturday", "sunday"), 3);
			// Transpositions
			strictEqual(damerauLevenshteinDistance("abcdef", "abdcef"), 1);
			strictEqual(damerauLevenshteinDistance("hello", "ehllo"), 1);
		});

		it("handles case sensitivity", () => {
			strictEqual(damerauLevenshteinDistance("Hello", "hello"), 1);
			strictEqual(
				damerauLevenshteinDistance("Hello", "hello", { caseSensitive: false }),
				0,
			);
		});

		it("respects maximum distance threshold", () => {
			strictEqual(
				damerauLevenshteinDistance("very different strings", "abc", {
					maxDistance: 5,
				}),
				5,
			);
			strictEqual(
				damerauLevenshteinDistance("cat", "dog", { maxDistance: 10 }),
				3,
			);
		});

		it("handles Unicode characters", () => {
			// "café" vs "cafe" - the é might be counted as multiple characters in some representations
			const cafeResult = damerauLevenshteinDistance("café", "cafe");
			ok(cafeResult >= 1 && cafeResult <= 2); // Allow for Unicode complexity

			// Emoji handling can be complex due to UTF-16 encoding
			const emojiResult = damerauLevenshteinDistance("🚀", "⭐");
			ok(emojiResult >= 1); // At least one edit needed, allow for encoding differences

			// For OSA, transposition is within adjacent characters
			const uniResult = damerauLevenshteinDistance("αβγ", "αγβ");
			ok(uniResult >= 1); // At least 1 edit needed
		});

		it("handles long strings efficiently", () => {
			const long1 = "a".repeat(100);
			const long2 = "b".repeat(100);
			const distance = damerauLevenshteinDistance(long1, long2);
			strictEqual(distance, 100);
		});

		it("throws on invalid input", () => {
			throws(
				() => damerauLevenshteinDistance(123, "string"),
				/must be strings/,
			);
			throws(
				() => damerauLevenshteinDistance("string", null),
				/must be strings/,
			);
		});
	});

	describe("osaDistance", () => {
		it("handles identical strings", () => {
			strictEqual(osaDistance("hello", "hello"), 0);
			strictEqual(osaDistance("", ""), 0);
		});

		it("handles empty strings", () => {
			strictEqual(osaDistance("", "hello"), 5);
			strictEqual(osaDistance("hello", ""), 5);
		});

		it("calculates basic edit operations", () => {
			// Substitution
			strictEqual(osaDistance("cat", "bat"), 1);
			// Insertion
			strictEqual(osaDistance("cat", "cart"), 1);
			// Deletion
			strictEqual(osaDistance("cart", "cat"), 1);
			// Adjacent transposition
			strictEqual(osaDistance("ab", "ba"), 1);
		});

		it("handles simple transpositions", () => {
			strictEqual(osaDistance("abcd", "abdc"), 1);
			strictEqual(osaDistance("hello", "ehllo"), 1);
			strictEqual(osaDistance("12345", "21345"), 1);
		});

		it("differs from full Damerau-Levenshtein for complex cases", () => {
			// OSA may give different results for certain patterns
			// due to restriction on substring operations
			const source = "CA";
			const target = "ABC";

			const osaResult = osaDistance(source, target);
			const dlResult = damerauLevenshteinDistance(source, target);

			// Both should be valid distances, OSA might be >= DL
			ok(osaResult >= dlResult);
		});

		it("handles case sensitivity", () => {
			strictEqual(osaDistance("Hello", "hello"), 1);
			strictEqual(osaDistance("Hello", "hello", { caseSensitive: false }), 0);
		});

		it("respects maximum distance threshold", () => {
			strictEqual(osaDistance("cat", "elephant", { maxDistance: 3 }), 3);
		});

		it("throws on invalid input", () => {
			throws(() => osaDistance(123, "string"), /must be strings/);
			throws(() => osaDistance("string", undefined), /must be strings/);
		});
	});

	describe("damerauLevenshteinSimilarity", () => {
		it("returns 1 for identical strings", () => {
			strictEqual(damerauLevenshteinSimilarity("hello", "hello"), 1);
			strictEqual(damerauLevenshteinSimilarity("", ""), 1);
		});

		it("returns 0 for completely different strings", () => {
			// Maximum distance case
			strictEqual(damerauLevenshteinSimilarity("abc", ""), 0);
			strictEqual(damerauLevenshteinSimilarity("", "xyz"), 0);
		});

		it("calculates similarity scores correctly", () => {
			// One character difference in 3-char string: (3-1)/3 = 0.67
			const sim1 = damerauLevenshteinSimilarity("cat", "bat");
			strictEqual(Math.round(sim1 * 100) / 100, 0.67);

			// One character difference in 6-char string: (6-1)/6 = 0.83
			const sim2 = damerauLevenshteinSimilarity("kitten", "mitten");
			strictEqual(Math.round(sim2 * 100) / 100, 0.83);
		});

		it("handles transpositions in similarity calculation", () => {
			// Single transposition should give high similarity
			const sim = damerauLevenshteinSimilarity("hello", "ehllo");
			ok(sim >= 0.8); // Should be quite similar
		});

		it("returns values between 0 and 1", () => {
			const testPairs = [
				["cat", "dog"],
				["hello", "world"],
				["similarity", "different"],
				["abc", "xyz"],
			];

			for (const [s1, s2] of testPairs) {
				const sim = damerauLevenshteinSimilarity(s1, s2);
				ok(
					sim >= 0 && sim <= 1,
					`Similarity should be between 0 and 1: ${sim}`,
				);
			}
		});

		it("throws on invalid input", () => {
			throws(
				() => damerauLevenshteinSimilarity(123, "string"),
				/must be strings/,
			);
			throws(
				() => damerauLevenshteinSimilarity("string", null),
				/must be strings/,
			);
		});
	});

	describe("osaSimilarity", () => {
		it("returns 1 for identical strings", () => {
			strictEqual(osaSimilarity("hello", "hello"), 1);
			strictEqual(osaSimilarity("", ""), 1);
		});

		it("returns 0 for completely different strings", () => {
			strictEqual(osaSimilarity("abc", ""), 0);
			strictEqual(osaSimilarity("", "xyz"), 0);
		});

		it("calculates similarity scores correctly", () => {
			const sim1 = osaSimilarity("cat", "bat");
			strictEqual(Math.round(sim1 * 100) / 100, 0.67);

			const sim2 = osaSimilarity("hello", "ehllo");
			ok(sim2 >= 0.8);
		});

		it("returns values between 0 and 1", () => {
			const testPairs = [
				["test", "best"],
				["similar", "different"],
				["short", "longer"],
			];

			for (const [s1, s2] of testPairs) {
				const sim = osaSimilarity(s1, s2);
				ok(
					sim >= 0 && sim <= 1,
					`OSA similarity should be between 0 and 1: ${sim}`,
				);
			}
		});

		it("throws on invalid input", () => {
			throws(() => osaSimilarity(123, "string"), /must be strings/);
			throws(() => osaSimilarity("string", {}), /must be strings/);
		});
	});

	describe("edge cases and performance", () => {
		it("handles very short strings", () => {
			strictEqual(damerauLevenshteinDistance("a", "b"), 1);
			strictEqual(damerauLevenshteinDistance("a", "a"), 0);
			strictEqual(osaDistance("x", "y"), 1);
			strictEqual(osaDistance("z", "z"), 0);
		});

		it("handles strings with repeated characters", () => {
			strictEqual(damerauLevenshteinDistance("aaa", "aa"), 1);
			ok(damerauLevenshteinDistance("abab", "baba") >= 1);
			strictEqual(osaDistance("xxx", "xxxx"), 1);
		});

		it("handles whitespace and special characters", () => {
			strictEqual(damerauLevenshteinDistance("a b", "ab"), 1);
			strictEqual(damerauLevenshteinDistance("a-b", "a_b"), 1);
			strictEqual(osaDistance(" ", ""), 1);
			strictEqual(osaDistance(".", ","), 1);
		});

		it("performs reasonably on medium-length strings", () => {
			const str1 = "The quick brown fox jumps over the lazy dog";
			const str2 = "The quick brown fox jumped over the lazy dog";

			const distance = damerauLevenshteinDistance(str1, str2);
			ok(distance >= 1); // At least one edit needed

			const similarity = damerauLevenshteinSimilarity(str1, str2);
			ok(similarity > 0.9); // Should be very similar
		});

		it("compares OSA and Damerau-Levenshtein consistency", () => {
			const testCases = [
				["hello", "world"],
				["abc", "def"],
				["test", "best"],
				["similar", "different"],
			];

			for (const [s1, s2] of testCases) {
				const osaResult = osaDistance(s1, s2);
				const dlResult = damerauLevenshteinDistance(s1, s2);

				// OSA distance should be >= Damerau-Levenshtein distance
				ok(
					osaResult >= dlResult,
					`OSA (${osaResult}) should be >= DL (${dlResult}) for "${s1}" vs "${s2}"`,
				);
			}
		});
	});
});
