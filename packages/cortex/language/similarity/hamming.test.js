/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { hammingDistance, hammingSimilarity } from "./hamming.js";

describe("hammingDistance", () => {
	describe("input validation", () => {
		it("throws error for non-string source", () => {
			throws(() => hammingDistance(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for non-string target", () => {
			throws(() => hammingDistance("test", null), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for unequal length strings", () => {
			throws(() => hammingDistance("abc", "abcd"), {
				name: "Error",
				message: "Hamming distance requires equal-length strings",
			});

			throws(() => hammingDistance("hello", "hi"), {
				name: "Error",
				message: "Hamming distance requires equal-length strings",
			});

			throws(() => hammingDistance("", "a"), {
				name: "Error",
				message: "Hamming distance requires equal-length strings",
			});
		});
	});

	describe("base cases", () => {
		it("returns 0 for identical strings", () => {
			strictEqual(hammingDistance("", ""), 0);
			strictEqual(hammingDistance("hello", "hello"), 0);
			strictEqual(hammingDistance("test123", "test123"), 0);
			strictEqual(hammingDistance("a", "a"), 0);
		});

		it("handles empty strings", () => {
			strictEqual(hammingDistance("", ""), 0);
		});

		it("handles single character strings", () => {
			strictEqual(hammingDistance("a", "a"), 0);
			strictEqual(hammingDistance("a", "b"), 1);
			strictEqual(hammingDistance("x", "y"), 1);
		});
	});

	describe("basic Hamming distance calculations", () => {
		it("calculates distance for simple substitutions", () => {
			strictEqual(hammingDistance("abc", "axc"), 1); // One difference
			strictEqual(hammingDistance("abc", "xyz"), 3); // All different
			strictEqual(hammingDistance("hello", "hallo"), 1); // Single substitution
		});

		it("calculates distance for multiple differences", () => {
			strictEqual(hammingDistance("karolin", "kathrin"), 3); // Classic example
			strictEqual(hammingDistance("sitting", "kitten*"), 3); // Three positions differ
			strictEqual(hammingDistance("1234567", "7654321"), 6); // Numbers with patterns
		});

		it("handles all positions different", () => {
			strictEqual(hammingDistance("abc", "xyz"), 3);
			strictEqual(hammingDistance("1010", "0101"), 4);
			strictEqual(hammingDistance("AAAA", "TTTT"), 4);
		});

		it("handles partial differences", () => {
			strictEqual(hammingDistance("abcdef", "axczef"), 2); // Positions 1 and 3
			strictEqual(hammingDistance("hello!", "hallo!"), 1); // One difference
			strictEqual(hammingDistance("test01", "best02"), 2); // Two differences
		});
	});

	describe("binary string comparisons", () => {
		it("calculates distance for binary strings", () => {
			strictEqual(hammingDistance("1011101", "1001001"), 2);
			strictEqual(hammingDistance("0000", "1111"), 4);
			strictEqual(hammingDistance("101010", "010101"), 6);
			strictEqual(hammingDistance("11111111", "00000000"), 8);
		});

		it("handles binary error detection patterns", () => {
			strictEqual(hammingDistance("1100", "1101"), 1); // Single bit error
			strictEqual(hammingDistance("101010101", "101010100"), 1); // Flip last bit
			strictEqual(hammingDistance("000000", "111111"), 6); // All bits flipped
		});
	});

	describe("DNA sequence comparisons", () => {
		it("calculates distance for DNA sequences", () => {
			strictEqual(hammingDistance("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"), 7);
			strictEqual(hammingDistance("ATCG", "CGTA"), 4); // All different
			strictEqual(hammingDistance("AAAA", "TTTT"), 4); // All substitutions
		});

		it("handles mutations in DNA", () => {
			strictEqual(hammingDistance("ATCGATCG", "ATCGATGG"), 1); // Single mutation
			strictEqual(hammingDistance("GGGGAAAA", "AAAATTTT"), 8); // All mutations
			strictEqual(hammingDistance("ATGC", "ATGC"), 0); // Identical sequence
		});
	});

	describe("case sensitivity options", () => {
		it("respects case sensitive comparison by default", () => {
			strictEqual(hammingDistance("Hello", "hello"), 1);
			strictEqual(hammingDistance("ABC", "abc"), 3);
			strictEqual(hammingDistance("Test", "TEST"), 3);
		});

		it("ignores case when caseSensitive is false", () => {
			strictEqual(
				hammingDistance("Hello", "hello", { caseSensitive: false }),
				0,
			);
			strictEqual(hammingDistance("ABC", "abc", { caseSensitive: false }), 0);
			strictEqual(hammingDistance("Test", "test", { caseSensitive: false }), 0);
		});

		it("applies case folding correctly", () => {
			strictEqual(
				hammingDistance("HeLLo", "hEllO", { caseSensitive: false }),
				0,
			);
			strictEqual(hammingDistance("AbC", "XyZ", { caseSensitive: false }), 3);
		});
	});

	describe("performance edge cases", () => {
		it("handles long identical strings efficiently", () => {
			const longString1 = "a".repeat(10000);
			const longString2 = "a".repeat(10000);
			strictEqual(hammingDistance(longString1, longString2), 0);
		});

		it("handles long strings with single difference", () => {
			const longString1 = "a".repeat(10000);
			const longString2 = `${"a".repeat(9999)}b`;
			strictEqual(hammingDistance(longString1, longString2), 1);
		});

		it("handles long strings with all differences", () => {
			const longString1 = "a".repeat(1000);
			const longString2 = "b".repeat(1000);
			strictEqual(hammingDistance(longString1, longString2), 1000);
		});
	});

	describe("textbook algorithm correctness", () => {
		// Test cases from classic computer science literature and applications
		const testCases = [
			// [source, target, expected_distance, description]
			["", "", 0, "both empty"],
			["a", "a", 0, "identical single char"],
			["a", "b", 1, "single substitution"],
			["abc", "abc", 0, "identical strings"],
			["abc", "axc", 1, "single difference middle"],
			["abc", "xyz", 3, "all positions different"],
			["karolin", "kathrin", 3, "classic textbook example"],
			["1011101", "1001001", 2, "binary string example"],
			["toned", "roses", 3, "equal length word comparison"],
			["12345", "54321", 4, "numeric string comparison"],
			["ATCG", "CGTA", 4, "DNA sequence all different"],
			["hello", "jello", 1, "single character difference"],
			["abcdef", "abcdxy", 2, "suffix differences"],
			["GGGGGG", "AAAAAA", 6, "homogeneous string comparison"],
			["101010", "010101", 6, "alternating binary pattern"],
		];

		testCases.forEach(([source, target, expected, description]) => {
			it(`correctly computes Hamming distance for: ${description}`, () => {
				strictEqual(hammingDistance(source, target), expected);
				// Hamming distance is symmetric
				strictEqual(hammingDistance(target, source), expected);
			});
		});
	});

	describe("metric space properties verification", () => {
		it("satisfies identity property: d(a,a) = 0", () => {
			const strings = ["", "a", "hello", "12345", "ATCG"];
			strings.forEach((str) => {
				strictEqual(hammingDistance(str, str), 0);
			});
		});

		it("satisfies positivity: d(a,b) >= 0", () => {
			const pairs = [
				["hello", "world"],
				["abc", "xyz"],
				["12345", "54321"],
				["ATCG", "CGTA"],
			];
			pairs.forEach(([a, b]) => {
				ok(hammingDistance(a, b) >= 0);
			});
		});

		it("satisfies symmetry: d(a,b) = d(b,a)", () => {
			const pairs = [
				["hello", "jello"],
				["karolin", "kathrin"],
				["abc", "xyz"],
				["10101", "01010"],
			];
			pairs.forEach(([a, b]) => {
				strictEqual(hammingDistance(a, b), hammingDistance(b, a));
			});
		});

		it("satisfies triangle inequality: d(a,c) <= d(a,b) + d(b,c)", () => {
			const triplets = [
				["abc", "axc", "xyz"],
				["hello", "hallo", "hullo"],
				["12345", "12335", "12333"],
				["ATCG", "ATGG", "TTGG"],
			];

			triplets.forEach(([a, b, c]) => {
				const dAC = hammingDistance(a, c);
				const dAB = hammingDistance(a, b);
				const dBC = hammingDistance(b, c);

				ok(
					dAC <= dAB + dBC,
					`Triangle inequality violated: d("${a}","${c}")=${dAC} > d("${a}","${b}")=${dAB} + d("${b}","${c}")=${dBC} = ${dAB + dBC}`,
				);
			});
		});

		it("demonstrates triangle inequality equality cases", () => {
			// Cases where triangle inequality becomes equality
			// This happens when b lies on the "path" from a to c
			const a = "000";
			const b = "001"; // One step from a
			const c = "011"; // One step from b, two from a

			const dAC = hammingDistance(a, c);
			const dAB = hammingDistance(a, b);
			const dBC = hammingDistance(b, c);

			strictEqual(dAC, 2);
			strictEqual(dAB, 1);
			strictEqual(dBC, 1);
			strictEqual(dAC, dAB + dBC); // Equality case
		});
	});

	describe("comparison with other edit distances", () => {
		it("shows Hamming is more restrictive than Levenshtein", () => {
			// Hamming can only do substitutions, so it's >= Levenshtein for equal-length strings
			// But since strings must be equal length, we test the substitution-only nature

			// These would require insertions/deletions in Levenshtein,
			// but Hamming requires equal length so we compare equivalent cases
			strictEqual(hammingDistance("abc", "xyz"), 3); // All substitutions
			strictEqual(hammingDistance("hello", "jello"), 1); // One substitution

			// Hamming cannot handle cases like "abc" vs "ab" (different lengths)
			// This is why Hamming is more restrictive - it requires equal lengths
		});

		it("demonstrates fixed-length constraint difference from other algorithms", () => {
			// Test that Hamming requires exactly equal lengths
			// while other algorithms (Levenshtein, OSA) allow different lengths

			const equalLengthPairs = [
				["abc", "xyz"], // Equal length, all different
				["hello", "world"], // Equal length, some different
				["test1", "test2"], // Equal length, one different
			];

			equalLengthPairs.forEach(([a, b]) => {
				// Should work fine for Hamming since lengths are equal
				const distance = hammingDistance(a, b);
				ok(distance >= 0 && distance <= a.length);
			});
		});
	});
});

describe("hammingSimilarity", () => {
	describe("input validation", () => {
		it("throws error for non-string inputs", () => {
			throws(() => hammingSimilarity(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for unequal length strings", () => {
			throws(() => hammingSimilarity("abc", "abcd"), {
				name: "Error",
				message: "Hamming similarity requires equal-length strings",
			});
		});
	});

	describe("similarity calculation", () => {
		it("returns 1.0 for identical strings", () => {
			strictEqual(hammingSimilarity("", ""), 1.0);
			strictEqual(hammingSimilarity("hello", "hello"), 1.0);
			strictEqual(hammingSimilarity("test", "test"), 1.0);
		});

		it("returns 0.0 for maximally different strings", () => {
			strictEqual(hammingSimilarity("abc", "xyz"), 0.0);
			strictEqual(hammingSimilarity("1111", "0000"), 0.0);
			strictEqual(hammingSimilarity("AAAA", "TTTT"), 0.0);
		});

		it("calculates intermediate similarities correctly", () => {
			// "karolin" vs "kathrin": distance=3, length=7, similarity=1-3/7≈0.571
			const similarity = hammingSimilarity("karolin", "kathrin");
			ok(
				Math.abs(similarity - (1 - 3 / 7)) < 1e-10,
				`Expected ~${1 - 3 / 7}, got ${similarity}`,
			);
		});

		it("handles single character differences", () => {
			// "abc" vs "axc": distance=1, length=3, similarity=1-1/3≈0.667
			const similarity = hammingSimilarity("abc", "axc");
			ok(
				Math.abs(similarity - (1 - 1 / 3)) < 1e-10,
				`Expected ~${1 - 1 / 3}, got ${similarity}`,
			);
		});

		it("handles binary string similarities", () => {
			// "1011" vs "1001": distance=1, length=4, similarity=1-1/4=0.75
			strictEqual(hammingSimilarity("1011", "1001"), 0.75);

			// "10101" vs "01010": distance=5, length=5, similarity=1-5/5=0
			strictEqual(hammingSimilarity("10101", "01010"), 0.0);
		});

		it("respects case sensitivity option", () => {
			strictEqual(
				hammingSimilarity("Hello", "hello", { caseSensitive: false }),
				1.0,
			);
			ok(hammingSimilarity("Hello", "hello", { caseSensitive: true }) < 1.0);
		});

		it("maintains symmetry property", () => {
			const pairs = [
				["hello", "world"],
				["abc", "xyz"],
				["12345", "54321"],
				["karolin", "kathrin"],
			];

			pairs.forEach(([a, b]) => {
				strictEqual(hammingSimilarity(a, b), hammingSimilarity(b, a));
			});
		});

		it("produces consistent results with distance function", () => {
			const pairs = [
				["hello", "jello"],
				["karolin", "kathrin"],
				["abc", "xyz"],
				["10101", "01010"],
			];

			pairs.forEach(([a, b]) => {
				const distance = hammingDistance(a, b);
				const similarity = hammingSimilarity(a, b);
				const stringLength = a.length;
				const expectedSimilarity = 1 - distance / stringLength;

				ok(
					Math.abs(similarity - expectedSimilarity) < 1e-10,
					`Inconsistent similarity for "${a}" vs "${b}": got ${similarity}, expected ${expectedSimilarity}`,
				);
			});
		});

		it("handles edge case of empty strings", () => {
			strictEqual(hammingSimilarity("", ""), 1.0);
		});

		it("validates range bounds", () => {
			const pairs = [
				["abc", "abc"], // Should be 1.0
				["abc", "xyz"], // Should be 0.0
				["abc", "axc"], // Should be between 0 and 1
				["hello", "jello"], // Should be between 0 and 1
			];

			pairs.forEach(([a, b]) => {
				const similarity = hammingSimilarity(a, b);
				ok(
					similarity >= 0.0 && similarity <= 1.0,
					`Similarity ${similarity} for "${a}" vs "${b}" is outside [0,1] range`,
				);
			});
		});
	});
});
