/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { levenshteinDistance, levenshteinSimilarity } from "./levenshtein.js";

describe("levenshteinDistance", () => {
	describe("input validation", () => {
		it("throws error for non-string source", () => {
			throws(() => levenshteinDistance(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for non-string target", () => {
			throws(() => levenshteinDistance("test", null), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for invalid maxDistance", () => {
			throws(() => levenshteinDistance("a", "b", { maxDistance: -1 }), {
				name: "Error",
				message: "maxDistance must be a non-negative finite number",
			});

			throws(() => levenshteinDistance("a", "b", { maxDistance: NaN }), {
				name: "Error",
				message: "maxDistance must be a non-negative finite number",
			});
		});
	});

	describe("base cases", () => {
		it("returns 0 for identical strings", () => {
			strictEqual(levenshteinDistance("", ""), 0);
			strictEqual(levenshteinDistance("hello", "hello"), 0);
			strictEqual(levenshteinDistance("test123", "test123"), 0);
		});

		it("returns target length when source is empty", () => {
			strictEqual(levenshteinDistance("", "abc"), 3);
			strictEqual(levenshteinDistance("", "hello"), 5);
		});

		it("returns source length when target is empty", () => {
			strictEqual(levenshteinDistance("abc", ""), 3);
			strictEqual(levenshteinDistance("hello", ""), 5);
		});
	});

	describe("basic edit operations", () => {
		it("calculates single insertions correctly", () => {
			strictEqual(levenshteinDistance("abc", "abcd"), 1);
			strictEqual(levenshteinDistance("hello", "helloo"), 1);
			strictEqual(levenshteinDistance("", "x"), 1);
		});

		it("calculates single deletions correctly", () => {
			strictEqual(levenshteinDistance("abcd", "abc"), 1);
			strictEqual(levenshteinDistance("helloo", "hello"), 1);
			strictEqual(levenshteinDistance("x", ""), 1);
		});

		it("calculates single substitutions correctly", () => {
			strictEqual(levenshteinDistance("abc", "axc"), 1);
			strictEqual(levenshteinDistance("hello", "hallo"), 1);
			strictEqual(levenshteinDistance("cat", "bat"), 1);
		});

		it("calculates multiple operations correctly", () => {
			strictEqual(levenshteinDistance("kitten", "sitting"), 3); // 2 substitutions + 1 insertion
			strictEqual(levenshteinDistance("saturday", "sunday"), 3); // Classical example
		});
	});

	describe("differences from OSA (no transposition operation)", () => {
		it("requires 2 operations for adjacent character swaps", () => {
			// Unlike OSA, Levenshtein cannot do transposition in 1 operation
			strictEqual(levenshteinDistance("ab", "ba"), 2); // delete 'a' + insert 'a' at end
			strictEqual(levenshteinDistance("abc", "acb"), 2); // substitute b->c, c->b
			strictEqual(levenshteinDistance("hello", "hlelo"), 2); // Two substitutions
			strictEqual(levenshteinDistance("12", "21"), 2); // Two operations required
		});

		it("handles character swaps within larger strings", () => {
			strictEqual(levenshteinDistance("abcdef", "acbdef"), 2); // Two operations for bc -> cb
			strictEqual(levenshteinDistance("testing", "tsetign"), 4); // Multiple swaps require multiple ops
		});

		it("demonstrates difference from OSA algorithm", () => {
			// These cases show where Levenshtein needs more operations than OSA
			strictEqual(levenshteinDistance("ca", "ac"), 2); // Levenshtein: 2 operations
			strictEqual(levenshteinDistance("abcd", "abdc"), 2); // Levenshtein: 2 operations

			// Complex case where OSA would be more efficient
			strictEqual(levenshteinDistance("algorithm", "lagorithm"), 2); // Move 'l' to front
		});
	});

	describe("case sensitivity options", () => {
		it("respects case sensitive comparison by default", () => {
			strictEqual(levenshteinDistance("Hello", "hello"), 1);
			strictEqual(levenshteinDistance("ABC", "abc"), 3);
		});

		it("ignores case when caseSensitive is false", () => {
			strictEqual(
				levenshteinDistance("Hello", "hello", { caseSensitive: false }),
				0,
			);
			strictEqual(
				levenshteinDistance("ABC", "abc", { caseSensitive: false }),
				0,
			);
			strictEqual(
				levenshteinDistance("Test", "test", { caseSensitive: false }),
				0,
			);
		});

		it("applies case folding before calculating distance", () => {
			strictEqual(
				levenshteinDistance("HeLLo", "hEllO", { caseSensitive: false }),
				0,
			);
			strictEqual(levenshteinDistance("AB", "BA", { caseSensitive: false }), 2); // Still 2 operations
		});
	});

	describe("maxDistance optimization", () => {
		it("returns maxDistance when exceeded", () => {
			strictEqual(
				levenshteinDistance("abcdef", "ghijkl", { maxDistance: 3 }),
				3,
			);
			strictEqual(
				levenshteinDistance("very different", "completely other", {
					maxDistance: 5,
				}),
				5,
			);
		});

		it("returns actual distance when within limit", () => {
			strictEqual(levenshteinDistance("abc", "ab", { maxDistance: 5 }), 1);
			strictEqual(
				levenshteinDistance("hello", "hallo", { maxDistance: 10 }),
				1,
			);
		});

		it("early terminates based on length difference", () => {
			// Length difference is 11, so with maxDistance=3 it should return 3 immediately
			strictEqual(
				levenshteinDistance("short", "much longer text", { maxDistance: 3 }),
				3,
			);
		});

		it("handles maxDistance edge cases", () => {
			strictEqual(levenshteinDistance("a", "b", { maxDistance: 0 }), 0);
			strictEqual(levenshteinDistance("same", "same", { maxDistance: 0 }), 0);
			strictEqual(levenshteinDistance("", "", { maxDistance: 0 }), 0);
		});
	});

	describe("performance edge cases", () => {
		it("handles empty strings efficiently", () => {
			strictEqual(levenshteinDistance("", ""), 0);
			strictEqual(levenshteinDistance("", "test"), 4);
			strictEqual(levenshteinDistance("test", ""), 4);
		});

		it("handles single character strings", () => {
			strictEqual(levenshteinDistance("a", "a"), 0);
			strictEqual(levenshteinDistance("a", "b"), 1);
			strictEqual(levenshteinDistance("x", ""), 1);
			strictEqual(levenshteinDistance("", "y"), 1);
		});

		it("handles long identical strings efficiently", () => {
			const longString = "a".repeat(1000);
			strictEqual(levenshteinDistance(longString, longString), 0);
		});
	});

	describe("textbook algorithm correctness", () => {
		// Test cases from classic computer science literature
		const testCases = [
			// [source, target, expected_distance, description]
			["", "", 0, "both empty"],
			["a", "", 1, "delete one"],
			["", "a", 1, "insert one"],
			["a", "a", 0, "identical single char"],
			["a", "b", 1, "substitute one"],
			["ab", "ba", 2, "swap requires 2 operations (not transposition)"],
			["abc", "bac", 2, "two operations for character swap"],
			["abc", "acb", 2, "swap last two chars"],
			["abcd", "abdc", 2, "swap middle chars"],
			["kitten", "sitting", 3, "classic example"],
			["saturday", "sunday", 3, "another classic"],
			["intention", "execution", 5, "complex transformation"],
			["distance", "difference", 5, "real word example"],
			["algorithm", "logarithm", 3, "prefix change"],
			["book", "back", 2, "middle substitution"],
			["hello", "jello", 1, "single substitution"],
			["test", "text", 1, "single substitution"],
		];

		testCases.forEach(([source, target, expected, description]) => {
			it(`correctly computes Levenshtein distance for: ${description}`, () => {
				strictEqual(levenshteinDistance(source, target), expected);
				// Levenshtein is symmetric
				strictEqual(levenshteinDistance(target, source), expected);
			});
		});
	});

	describe("metric space properties verification", () => {
		it("satisfies identity property: d(a,a) = 0", () => {
			const strings = ["", "a", "hello", "test123"];
			strings.forEach((str) => {
				strictEqual(levenshteinDistance(str, str), 0);
			});
		});

		it("satisfies positivity: d(a,b) >= 0", () => {
			const pairs = [
				["hello", "world"],
				["abc", "xyz"],
				["", "test"],
				["short", "longer string"],
			];
			pairs.forEach(([a, b]) => {
				ok(levenshteinDistance(a, b) >= 0);
			});
		});

		it("satisfies symmetry: d(a,b) = d(b,a)", () => {
			const pairs = [
				["hello", "world"],
				["kitten", "sitting"],
				["test", "best"],
				["algorithm", "logarithm"],
			];
			pairs.forEach(([a, b]) => {
				strictEqual(levenshteinDistance(a, b), levenshteinDistance(b, a));
			});
		});

		it("satisfies triangle inequality: d(a,c) <= d(a,b) + d(b,c)", () => {
			const triplets = [
				["abc", "def", "ghi"],
				["hello", "hallo", "hullo"],
				["cat", "bat", "rat"],
				["test", "best", "rest"],
			];

			triplets.forEach(([a, b, c]) => {
				const dAC = levenshteinDistance(a, c);
				const dAB = levenshteinDistance(a, b);
				const dBC = levenshteinDistance(b, c);

				ok(
					dAC <= dAB + dBC,
					`Triangle inequality violated: d("${a}","${c}")=${dAC} > d("${a}","${b}")=${dAB} + d("${b}","${c}")=${dBC} = ${dAB + dBC}`,
				);
			});
		});
	});
});

describe("levenshteinSimilarity", () => {
	describe("input validation", () => {
		it("throws error for non-string inputs", () => {
			throws(() => levenshteinSimilarity(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});
	});

	describe("similarity calculation", () => {
		it("returns 1.0 for identical strings", () => {
			strictEqual(levenshteinSimilarity("", ""), 1.0);
			strictEqual(levenshteinSimilarity("hello", "hello"), 1.0);
			strictEqual(levenshteinSimilarity("test", "test"), 1.0);
		});

		it("returns 0.0 for maximally different strings", () => {
			strictEqual(levenshteinSimilarity("abc", "xyz"), 0.0);
			strictEqual(levenshteinSimilarity("hello", "zzzzz"), 0.0);
		});

		it("returns 0.0 when one string is empty", () => {
			strictEqual(levenshteinSimilarity("", "test"), 0.0);
			strictEqual(levenshteinSimilarity("hello", ""), 0.0);
		});

		it("calculates intermediate similarities correctly", () => {
			// "kitten" vs "sitting": distance=3, max_len=7, similarity=1-3/7≈0.571
			const similarity = levenshteinSimilarity("kitten", "sitting");
			ok(
				Math.abs(similarity - (1 - 3 / 7)) < 1e-10,
				`Expected ~${1 - 3 / 7}, got ${similarity}`,
			);
		});

		it("handles single character differences", () => {
			// "abc" vs "axc": distance=1, max_len=3, similarity=1-1/3≈0.667
			const similarity = levenshteinSimilarity("abc", "axc");
			ok(
				Math.abs(similarity - (1 - 1 / 3)) < 1e-10,
				`Expected ~${1 - 1 / 3}, got ${similarity}`,
			);
		});

		it("shows difference from OSA for character swaps", () => {
			// "ab" vs "ba": Levenshtein distance=2, max_len=2, similarity=1-2/2=0
			strictEqual(levenshteinSimilarity("ab", "ba"), 0.0);

			// "abc" vs "acb": distance=2, max_len=3, similarity=1-2/3≈0.333
			const similarity = levenshteinSimilarity("abc", "acb");
			ok(
				Math.abs(similarity - (1 - 2 / 3)) < 1e-10,
				`Expected ~${1 - 2 / 3}, got ${similarity}`,
			);
		});

		it("respects case sensitivity option", () => {
			strictEqual(
				levenshteinSimilarity("Hello", "hello", { caseSensitive: false }),
				1.0,
			);
			ok(
				levenshteinSimilarity("Hello", "hello", { caseSensitive: true }) < 1.0,
			);
		});

		it("passes through options to levenshteinDistance", () => {
			// When maxDistance limits the result, similarity should reflect that
			const result = levenshteinSimilarity(
				"very different",
				"completely other",
				{
					maxDistance: 3,
				},
			);
			// distance will be capped at 3, max_len = max(13, 16) = 16, so similarity = 1 - 3/16
			const expected = 1 - 3 / 16;
			ok(
				Math.abs(result - expected) < 1e-10,
				`Expected ~${expected}, got ${result}`,
			);
		});

		it("maintains symmetry property", () => {
			const pairs = [
				["hello", "world"],
				["abc", "def"],
				["test", "best"],
				["kitten", "sitting"],
			];

			pairs.forEach(([a, b]) => {
				strictEqual(levenshteinSimilarity(a, b), levenshteinSimilarity(b, a));
			});
		});

		it("produces consistent results with distance function", () => {
			const pairs = [
				["hello", "world"],
				["kitten", "sitting"],
				["abc", "xyz"],
				["test", "best"],
			];

			pairs.forEach(([a, b]) => {
				const distance = levenshteinDistance(a, b);
				const similarity = levenshteinSimilarity(a, b);
				const maxLen = Math.max(a.length, b.length);
				const expectedSimilarity = Math.max(0, 1 - distance / maxLen);

				ok(
					Math.abs(similarity - expectedSimilarity) < 1e-10,
					`Inconsistent similarity for "${a}" vs "${b}": got ${similarity}, expected ${expectedSimilarity}`,
				);
			});
		});
	});
});
