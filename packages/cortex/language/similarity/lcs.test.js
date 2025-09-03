/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { lcsLength, lcsSimilarity, lcsString } from "./lcs.js";

describe("lcsLength", () => {
	describe("input validation", () => {
		it("throws error for non-string source", () => {
			throws(() => lcsLength(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});

		it("throws error for non-string target", () => {
			throws(() => lcsLength("test", null), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});
	});

	describe("base cases", () => {
		it("returns 0 for empty source string", () => {
			strictEqual(lcsLength("", "abc"), 0);
			strictEqual(lcsLength("", "hello"), 0);
		});

		it("returns 0 for empty target string", () => {
			strictEqual(lcsLength("abc", ""), 0);
			strictEqual(lcsLength("hello", ""), 0);
		});

		it("returns 0 for both empty strings", () => {
			strictEqual(lcsLength("", ""), 0);
		});

		it("returns full length for identical strings", () => {
			strictEqual(lcsLength("hello", "hello"), 5);
			strictEqual(lcsLength("test123", "test123"), 7);
			strictEqual(lcsLength("a", "a"), 1);
		});
	});

	describe("basic LCS calculations", () => {
		it("calculates LCS for simple cases", () => {
			strictEqual(lcsLength("abc", "ac"), 2); // "ac"
			strictEqual(lcsLength("abc", "bc"), 2); // "bc"
			strictEqual(lcsLength("abc", "ab"), 2); // "ab"
		});

		it("calculates LCS when no common characters", () => {
			strictEqual(lcsLength("abc", "xyz"), 0);
			strictEqual(lcsLength("123", "456"), 0);
			strictEqual(lcsLength("hello", "zzzzz"), 0);
		});

		it("calculates LCS for single character matches", () => {
			strictEqual(lcsLength("abc", "xay"), 1); // "a"
			strictEqual(lcsLength("hello", "world"), 1); // "l" or "o" (one char only)
			strictEqual(lcsLength("test", "set"), 2); // "et"
		});
	});

	describe("textbook examples", () => {
		it("calculates classic textbook example: ABCDGH vs AEDFHR", () => {
			// LCS should be "ADH" with length 3
			strictEqual(lcsLength("ABCDGH", "AEDFHR"), 3);
		});

		it("calculates classic textbook example: AGGTAB vs GXTXAYB", () => {
			// LCS should be "GTAB" with length 4
			strictEqual(lcsLength("AGGTAB", "GXTXAYB"), 4);
		});

		it("calculates programming vs program example", () => {
			// LCS should be "program" with length 7
			strictEqual(lcsLength("programming", "program"), 7);
		});

		it("calculates stone vs longest example", () => {
			// LCS should be "one" with length 3
			strictEqual(lcsLength("stone", "longest"), 3);
		});
	});

	describe("DNA sequence examples", () => {
		it("calculates LCS for DNA sequences", () => {
			strictEqual(lcsLength("ATCGATCG", "TCGATGAC"), 6); // "TCGATG" or similar
			strictEqual(lcsLength("AAAA", "TTTT"), 0); // No common bases
			strictEqual(lcsLength("ATCG", "ATCG"), 4); // Identical sequences
		});

		it("handles mutations in DNA sequences", () => {
			strictEqual(lcsLength("ATCGATCG", "ATCGATGG"), 7); // Most characters match
			strictEqual(lcsLength("GGGGAAAA", "AAAATTTT"), 4); // "AAAA" common
		});
	});

	describe("case sensitivity options", () => {
		it("respects case sensitive comparison by default", () => {
			strictEqual(lcsLength("Hello", "hello"), 4); // "ello"
			strictEqual(lcsLength("ABC", "abc"), 0); // No common characters
		});

		it("ignores case when caseSensitive is false", () => {
			strictEqual(lcsLength("Hello", "hello", { caseSensitive: false }), 5);
			strictEqual(lcsLength("ABC", "abc", { caseSensitive: false }), 3);
			strictEqual(lcsLength("Test", "test", { caseSensitive: false }), 4);
		});
	});

	describe("performance edge cases", () => {
		it("handles long identical strings efficiently", () => {
			const longString = "a".repeat(1000);
			strictEqual(lcsLength(longString, longString), 1000);
		});

		it("handles long strings with no common characters", () => {
			const longString1 = "a".repeat(500);
			const longString2 = "b".repeat(500);
			strictEqual(lcsLength(longString1, longString2), 0);
		});

		it("handles long strings with scattered matches", () => {
			const str1 = `${"a".repeat(100)}x${"b".repeat(100)}`;
			const str2 = `${"c".repeat(50)}x${"d".repeat(150)}`;
			strictEqual(lcsLength(str1, str2), 1); // Only "x" is common
		});
	});

	describe("algorithmic properties", () => {
		it("satisfies symmetry: LCS(a,b) = LCS(b,a)", () => {
			const pairs = [
				["hello", "world"],
				["ABCDGH", "AEDFHR"],
				["programming", "program"],
				["abc", "xyz"],
			];

			pairs.forEach(([a, b]) => {
				strictEqual(lcsLength(a, b), lcsLength(b, a));
			});
		});

		it("satisfies monotonicity: LCS <= min(len(a), len(b))", () => {
			const pairs = [
				["hello", "world"],
				["ABCDGH", "AEDFHR"],
				["programming", "program"],
				["test", "best"],
			];

			pairs.forEach(([a, b]) => {
				const lcs = lcsLength(a, b);
				const minLen = Math.min(a.length, b.length);
				ok(
					lcs <= minLen,
					`LCS(${a}, ${b}) = ${lcs} should be <= min(${a.length}, ${b.length}) = ${minLen}`,
				);
			});
		});

		it("satisfies boundary conditions", () => {
			// LCS with empty string is always 0
			const testStrings = ["hello", "world", "test", "abc"];
			testStrings.forEach((str) => {
				strictEqual(lcsLength(str, ""), 0);
				strictEqual(lcsLength("", str), 0);
			});

			// LCS with itself is the string length
			testStrings.forEach((str) => {
				strictEqual(lcsLength(str, str), str.length);
			});
		});
	});
});

describe("lcsString", () => {
	describe("input validation", () => {
		it("throws error for non-string inputs", () => {
			throws(() => lcsString(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});
	});

	describe("LCS string reconstruction", () => {
		it("returns empty string for empty inputs", () => {
			strictEqual(lcsString("", "abc"), "");
			strictEqual(lcsString("abc", ""), "");
			strictEqual(lcsString("", ""), "");
		});

		it("returns full string for identical strings", () => {
			strictEqual(lcsString("hello", "hello"), "hello");
			strictEqual(lcsString("test", "test"), "test");
		});

		it("reconstructs classic textbook examples", () => {
			// Note: There might be multiple valid LCS, we test for correct length and validity
			const lcs1 = lcsString("ABCDGH", "AEDFHR");
			strictEqual(lcs1.length, 3); // Should be length 3
			// Verify it's actually a subsequence of both strings
			ok(
				isSubsequence(lcs1, "ABCDGH"),
				`${lcs1} should be subsequence of ABCDGH`,
			);
			ok(
				isSubsequence(lcs1, "AEDFHR"),
				`${lcs1} should be subsequence of AEDFHR`,
			);

			const lcs2 = lcsString("AGGTAB", "GXTXAYB");
			strictEqual(lcs2.length, 4); // Should be length 4
			ok(
				isSubsequence(lcs2, "AGGTAB"),
				`${lcs2} should be subsequence of AGGTAB`,
			);
			ok(
				isSubsequence(lcs2, "GXTXAYB"),
				`${lcs2} should be subsequence of GXTXAYB`,
			);
		});

		it("reconstructs programming vs program example", () => {
			const lcs = lcsString("programming", "program");
			strictEqual(lcs, "program"); // This should be exact
		});

		it("handles simple cases", () => {
			strictEqual(lcsString("abc", "ac"), "ac");
			strictEqual(lcsString("abc", "bc"), "bc");
			// For "hello" vs "world", LCS can be "l" or "o" (length 1)
			const lcs = lcsString("hello", "world");
			ok(lcs === "l" || lcs === "o", `Expected "l" or "o", got "${lcs}"`);
		});

		it("respects case sensitivity", () => {
			const lcs1 = lcsString("Hello", "hello");
			strictEqual(lcs1.length, 4); // "ello"

			const lcs2 = lcsString("Hello", "hello", { caseSensitive: false });
			strictEqual(lcs2, "hello"); // Should be full match when case insensitive
		});
	});

	describe("consistency with lcsLength", () => {
		it("string length matches lcsLength result", () => {
			const pairs = [
				["ABCDGH", "AEDFHR"],
				["AGGTAB", "GXTXAYB"],
				["programming", "program"],
				["hello", "world"],
				["abc", "xyz"],
			];

			pairs.forEach(([a, b]) => {
				const lcsStr = lcsString(a, b);
				const lcsLen = lcsLength(a, b);
				strictEqual(
					lcsStr.length,
					lcsLen,
					`LCS string "${lcsStr}" length should match lcsLength result ${lcsLen}`,
				);
			});
		});

		it("reconstructed string is valid subsequence", () => {
			const pairs = [
				["ABCDGH", "AEDFHR"],
				["programming", "program"],
				["hello", "world"],
			];

			pairs.forEach(([a, b]) => {
				const lcsStr = lcsString(a, b);
				if (lcsStr.length > 0) {
					ok(
						isSubsequence(lcsStr, a),
						`${lcsStr} should be subsequence of ${a}`,
					);
					ok(
						isSubsequence(lcsStr, b),
						`${lcsStr} should be subsequence of ${b}`,
					);
				}
			});
		});
	});
});

describe("lcsSimilarity", () => {
	describe("input validation", () => {
		it("throws error for non-string inputs", () => {
			throws(() => lcsSimilarity(123, "test"), {
				name: "Error",
				message: "Both arguments must be strings",
			});
		});
	});

	describe("similarity calculation", () => {
		it("returns 1.0 for identical strings", () => {
			strictEqual(lcsSimilarity("hello", "hello"), 1.0);
			strictEqual(lcsSimilarity("test", "test"), 1.0);
			strictEqual(lcsSimilarity("", ""), 1.0);
		});

		it("returns 0.0 for strings with no common subsequence", () => {
			strictEqual(lcsSimilarity("abc", "xyz"), 0.0);
			strictEqual(lcsSimilarity("123", "456"), 0.0);
		});

		it("returns 0.0 when one string is empty", () => {
			strictEqual(lcsSimilarity("", "test"), 0.0);
			strictEqual(lcsSimilarity("hello", ""), 0.0);
		});

		it("calculates intermediate similarities correctly", () => {
			// "ABCDGH" vs "AEDFHR": LCS=3, lengths=6+6=12, similarity=2*3/12=0.5
			const similarity = lcsSimilarity("ABCDGH", "AEDFHR");
			ok(
				Math.abs(similarity - 0.5) < 1e-10,
				`Expected ~0.5, got ${similarity}`,
			);
		});

		it("calculates high similarity for subset strings", () => {
			// "programming" vs "program": LCS=7, lengths=11+7=18, similarity=2*7/18≈0.778
			const similarity = lcsSimilarity("programming", "program");
			const expected = (2 * 7) / (11 + 7); // 14/18 ≈ 0.778
			ok(
				Math.abs(similarity - expected) < 1e-10,
				`Expected ~${expected}, got ${similarity}`,
			);
		});

		it("respects case sensitivity option", () => {
			strictEqual(
				lcsSimilarity("Hello", "hello", { caseSensitive: false }),
				1.0,
			);
			ok(lcsSimilarity("Hello", "hello", { caseSensitive: true }) < 1.0);
		});

		it("maintains symmetry property", () => {
			const pairs = [
				["hello", "world"],
				["ABCDGH", "AEDFHR"],
				["programming", "program"],
				["abc", "xyz"],
			];

			pairs.forEach(([a, b]) => {
				strictEqual(lcsSimilarity(a, b), lcsSimilarity(b, a));
			});
		});

		it("validates similarity range bounds", () => {
			const pairs = [
				["hello", "hello"], // Should be 1.0
				["abc", "xyz"], // Should be 0.0
				["hello", "world"], // Should be between 0 and 1
				["programming", "program"], // Should be between 0 and 1
			];

			pairs.forEach(([a, b]) => {
				const similarity = lcsSimilarity(a, b);
				ok(
					similarity >= 0.0 && similarity <= 1.0,
					`Similarity ${similarity} for "${a}" vs "${b}" is outside [0,1] range`,
				);
			});
		});

		it("produces consistent results with lcsLength", () => {
			const pairs = [
				["hello", "world"],
				["ABCDGH", "AEDFHR"],
				["programming", "program"],
				["test", "best"],
			];

			pairs.forEach(([a, b]) => {
				const lcsLen = lcsLength(a, b);
				const similarity = lcsSimilarity(a, b);
				const expectedSimilarity = (2 * lcsLen) / (a.length + b.length);

				ok(
					Math.abs(similarity - expectedSimilarity) < 1e-10,
					`Inconsistent similarity for "${a}" vs "${b}": got ${similarity}, expected ${expectedSimilarity}`,
				);
			});
		});
	});
});

// Helper function to check if string s is a subsequence of string t
function isSubsequence(s, t) {
	let sIndex = 0;
	let tIndex = 0;

	while (sIndex < s.length && tIndex < t.length) {
		if (s[sIndex] === t[tIndex]) {
			sIndex++;
		}
		tIndex++;
	}

	return sIndex === s.length;
}
