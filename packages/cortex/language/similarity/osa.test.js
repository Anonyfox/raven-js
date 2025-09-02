/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { osaDistance, osaSimilarity } from "./osa.js";

describe("osaDistance", () => {
	describe("input validation", () => {
		it("throws error for non-string source", () => {
			throws(() => osaDistance(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for non-string target", () => {
			throws(() => osaDistance("test", null), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for invalid maxDistance", () => {
			throws(() => osaDistance("a", "b", { maxDistance: -1 }), {
				name: "Error",
				message: "maxDistance must be a non-negative finite number",
			});

			throws(() => osaDistance("a", "b", { maxDistance: NaN }), {
				name: "Error",
				message: "maxDistance must be a non-negative finite number",
			});
		});
	});

	describe("base cases", () => {
		it("returns 0 for identical strings", () => {
			strictEqual(osaDistance("", ""), 0);
			strictEqual(osaDistance("hello", "hello"), 0);
			strictEqual(osaDistance("test123", "test123"), 0);
		});

		it("returns target length when source is empty", () => {
			strictEqual(osaDistance("", "abc"), 3);
			strictEqual(osaDistance("", "hello"), 5);
		});

		it("returns source length when target is empty", () => {
			strictEqual(osaDistance("abc", ""), 3);
			strictEqual(osaDistance("hello", ""), 5);
		});
	});

	describe("basic edit operations", () => {
		it("calculates single insertions correctly", () => {
			strictEqual(osaDistance("abc", "abcd"), 1);
			strictEqual(osaDistance("hello", "helloo"), 1);
			strictEqual(osaDistance("", "x"), 1);
		});

		it("calculates single deletions correctly", () => {
			strictEqual(osaDistance("abcd", "abc"), 1);
			strictEqual(osaDistance("helloo", "hello"), 1);
			strictEqual(osaDistance("x", ""), 1);
		});

		it("calculates single substitutions correctly", () => {
			strictEqual(osaDistance("abc", "axc"), 1);
			strictEqual(osaDistance("hello", "hallo"), 1);
			strictEqual(osaDistance("cat", "bat"), 1);
		});

		it("calculates multiple operations correctly", () => {
			strictEqual(osaDistance("kitten", "sitting"), 3); // 2 substitutions + 1 insertion
			strictEqual(osaDistance("saturday", "sunday"), 3); // Classical example
		});
	});

	describe("transposition operations", () => {
		it("handles adjacent transpositions in 1 operation", () => {
			strictEqual(osaDistance("ab", "ba"), 1);
			strictEqual(osaDistance("abc", "acb"), 1);
			strictEqual(osaDistance("hello", "hlelo"), 1);
			strictEqual(osaDistance("12", "21"), 1);
		});

		it("handles transpositions within larger strings", () => {
			strictEqual(osaDistance("abcdef", "acbdef"), 1); // Transposition bc -> cb
			strictEqual(osaDistance("testing", "tsetign"), 2); // Two transpositions: es->se, in->ng
		});

		it("distinguishes OSA from Levenshtein distance", () => {
			// This is where OSA is more efficient than pure Levenshtein
			// Levenshtein would need 2 operations (delete + insert), OSA needs 1 (transposition)
			strictEqual(osaDistance("ca", "ac"), 1); // OSA: 1 transposition
			strictEqual(osaDistance("abcd", "abdc"), 1); // OSA: 1 transposition cd->dc
		});

		it("demonstrates OSA limitation (triangle inequality violation)", () => {
			// This is the classic case showing OSA ≠ true Damerau-Levenshtein
			// OSA constraint: no substring can be edited more than once
			// Direct "ca" -> "abc" requires 3 operations (can't combine transpose + insert on same substring)
			// But "ca" -> "ac" -> "abc" would also be 1 + 1 = 2 if allowed
			// The restriction prevents this optimization, showing OSA limitation
			strictEqual(osaDistance("ca", "abc"), 3); // Cannot combine transpose + insert optimally
			strictEqual(osaDistance("ca", "ac"), 1); // Transpose only
			strictEqual(osaDistance("ac", "abc"), 1); // Insert 'b'
			// d("ca","abc") = 3, but d("ca","ac") + d("ac","abc") = 1 + 1 = 2
			// This violates triangle inequality, showing OSA constraint impact
		});
	});

	describe("case sensitivity options", () => {
		it("respects case sensitive comparison by default", () => {
			strictEqual(osaDistance("Hello", "hello"), 1);
			strictEqual(osaDistance("ABC", "abc"), 3);
		});

		it("ignores case when caseSensitive is false", () => {
			strictEqual(osaDistance("Hello", "hello", { caseSensitive: false }), 0);
			strictEqual(osaDistance("ABC", "abc", { caseSensitive: false }), 0);
			strictEqual(osaDistance("Test", "test", { caseSensitive: false }), 0);
		});

		it("applies case folding before calculating distance", () => {
			strictEqual(osaDistance("HeLLo", "hEllO", { caseSensitive: false }), 0);
			strictEqual(osaDistance("AB", "BA", { caseSensitive: false }), 1); // Still transposition
		});
	});

	describe("maxDistance optimization", () => {
		it("returns maxDistance when exceeded", () => {
			strictEqual(osaDistance("abcdef", "ghijkl", { maxDistance: 3 }), 3);
			strictEqual(
				osaDistance("very different", "completely other", { maxDistance: 5 }),
				5,
			);
		});

		it("returns actual distance when within limit", () => {
			strictEqual(osaDistance("abc", "ab", { maxDistance: 5 }), 1);
			strictEqual(osaDistance("hello", "hallo", { maxDistance: 10 }), 1);
		});

		it("early terminates based on length difference", () => {
			// Length difference is 6, so with maxDistance=3 it should return 3 immediately
			strictEqual(
				osaDistance("short", "much longer text", { maxDistance: 3 }),
				3,
			);
		});

		it("handles maxDistance edge cases", () => {
			strictEqual(osaDistance("a", "b", { maxDistance: 0 }), 0);
			strictEqual(osaDistance("same", "same", { maxDistance: 0 }), 0);
			strictEqual(osaDistance("", "", { maxDistance: 0 }), 0);
		});
	});

	describe("performance edge cases", () => {
		it("handles empty strings efficiently", () => {
			strictEqual(osaDistance("", ""), 0);
			strictEqual(osaDistance("", "test"), 4);
			strictEqual(osaDistance("test", ""), 4);
		});

		it("handles single character strings", () => {
			strictEqual(osaDistance("a", "a"), 0);
			strictEqual(osaDistance("a", "b"), 1);
			strictEqual(osaDistance("x", ""), 1);
			strictEqual(osaDistance("", "y"), 1);
		});

		it("handles long identical strings efficiently", () => {
			const longString = "a".repeat(1000);
			strictEqual(osaDistance(longString, longString), 0);
		});
	});

	describe("algorithm correctness verification", () => {
		// Test cases that verify the textbook OSA algorithm
		const testCases = [
			// [source, target, expected_distance, description]
			["", "", 0, "both empty"],
			["a", "", 1, "delete one"],
			["", "a", 1, "insert one"],
			["a", "a", 0, "identical single char"],
			["a", "b", 1, "substitute one"],
			["ab", "ba", 1, "transpose adjacent"],
			["abc", "bac", 1, "transpose first two"],
			["abc", "acb", 1, "transpose last two"],
			["abcd", "abdc", 1, "transpose middle two"],
			["kitten", "sitting", 3, "classic example"],
			["saturday", "sunday", 3, "another classic"],
			["intention", "execution", 5, "complex transformation"],
			["distance", "difference", 5, "real word example"],
			["algorithm", "logarithm", 3, "anagram-like"],
		];

		testCases.forEach(([source, target, expected, description]) => {
			it(`correctly computes OSA distance for: ${description}`, () => {
				strictEqual(osaDistance(source, target), expected);
				// OSA is symmetric
				strictEqual(osaDistance(target, source), expected);
			});
		});
	});
});

describe("osaSimilarity", () => {
	describe("input validation", () => {
		it("throws error for non-string inputs", () => {
			throws(() => osaSimilarity(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});
	});

	describe("similarity calculation", () => {
		it("returns 1.0 for identical strings", () => {
			strictEqual(osaSimilarity("", ""), 1.0);
			strictEqual(osaSimilarity("hello", "hello"), 1.0);
			strictEqual(osaSimilarity("test", "test"), 1.0);
		});

		it("returns 0.0 for maximally different strings", () => {
			strictEqual(osaSimilarity("abc", "xyz"), 0.0);
			strictEqual(osaSimilarity("hello", "zzzzz"), 0.0);
		});

		it("returns 0.0 when one string is empty", () => {
			strictEqual(osaSimilarity("", "test"), 0.0);
			strictEqual(osaSimilarity("hello", ""), 0.0);
		});

		it("calculates intermediate similarities correctly", () => {
			// "kitten" vs "sitting": distance=3, max_len=7, similarity=1-3/7≈0.571
			const similarity = osaSimilarity("kitten", "sitting");
			ok(
				Math.abs(similarity - (1 - 3 / 7)) < 1e-10,
				`Expected ~${1 - 3 / 7}, got ${similarity}`,
			);
		});

		it("handles single character differences", () => {
			// "abc" vs "axc": distance=1, max_len=3, similarity=1-1/3≈0.667
			const similarity = osaSimilarity("abc", "axc");
			ok(
				Math.abs(similarity - (1 - 1 / 3)) < 1e-10,
				`Expected ~${1 - 1 / 3}, got ${similarity}`,
			);
		});

		it("handles transpositions efficiently", () => {
			// "ab" vs "ba": distance=1, max_len=2, similarity=1-1/2=0.5
			strictEqual(osaSimilarity("ab", "ba"), 0.5);
		});

		it("respects case sensitivity option", () => {
			strictEqual(
				osaSimilarity("Hello", "hello", { caseSensitive: false }),
				1.0,
			);
			ok(osaSimilarity("Hello", "hello", { caseSensitive: true }) < 1.0);
		});

		it("passes through options to osaDistance", () => {
			// When maxDistance limits the result, similarity should reflect that
			const result = osaSimilarity("very different", "completely other", {
				maxDistance: 3,
			});
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
				strictEqual(osaSimilarity(a, b), osaSimilarity(b, a));
			});
		});
	});
});
