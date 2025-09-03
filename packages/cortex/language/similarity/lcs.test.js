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

function isSubsequence(s, t) {
	let i = 0;
	let j = 0;
	while (i < s.length && j < t.length) {
		if (s[i] === t[j]) i++;
		j++;
	}
	return i === s.length;
}

describe("LCS", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("computes LCS length and string for common cases", () => {
			// base cases
			strictEqual(lcsLength("", ""), 0);
			strictEqual(lcsLength("hello", "hello"), 5);
			// early identical return (length)
			strictEqual(lcsLength("same", "same"), 4);
			// simple LCS
			strictEqual(lcsLength("abc", "ac"), 2);
			strictEqual(lcsLength("abc", "bc"), 2);
			// textbook examples
			strictEqual(lcsLength("ABCDGH", "AEDFHR"), 3);
			strictEqual(lcsLength("AGGTAB", "GXTXAYB"), 4);
			// lcsString consistency
			strictEqual(lcsString("programming", "program"), "program");
			const s1 = lcsString("ABCDGH", "AEDFHR");
			ok(
				s1.length === 3 &&
					isSubsequence(s1, "ABCDGH") &&
					isSubsequence(s1, "AEDFHR"),
			);
			// lcsString identical branch
			strictEqual(lcsString("same", "same"), "same");
			// lcsString empty branch
			strictEqual(lcsString("", "x"), "");
			strictEqual(lcsString("x", ""), "");
			// lcsString case-insensitive branch
			strictEqual(
				lcsString("Hello", "hello", { caseSensitive: false }),
				"hello",
			);
		});
	});

	describe("edge cases and errors", () => {
		it("validates inputs, case option, and performance edges", () => {
			// input validation
			throws(() => lcsLength(123, "test"), /must be strings/);
			throws(() => lcsString(123, "test"), /must be strings/);
			throws(() => lcsSimilarity(123, "test"), /must be strings/);
			// case-sensitive vs insensitive
			strictEqual(lcsLength("Hello", "hello"), 4);
			strictEqual(lcsLength("Hello", "hello", { caseSensitive: false }), 5);
			// performance sanity
			const long = "a".repeat(120);
			strictEqual(lcsLength(long, long), 120);
			strictEqual(lcsLength("a".repeat(80), "b".repeat(80)), 0);
		});
	});

	describe("integration scenarios", () => {
		it("ties similarity to lcsLength and validates bounds", () => {
			// similarity bounds
			strictEqual(lcsSimilarity("hello", "hello"), 1);
			strictEqual(lcsSimilarity("abc", "xyz"), 0);
			// lcsSimilarity empty branch
			strictEqual(lcsSimilarity("", "x"), 0);
			strictEqual(lcsSimilarity("x", ""), 0);
			// case-insensitive similarity branch
			strictEqual(lcsSimilarity("Hello", "hello", { caseSensitive: false }), 1);
			// intermediate value
			const sim = lcsSimilarity("ABCDGH", "AEDFHR");
			ok(Math.abs(sim - 0.5) < 1e-10);
			// consistency with lcsLength
			const pairs = [
				["programming", "program"],
				["hello", "world"],
			];
			pairs.forEach(([a, b]) => {
				const len = lcsLength(a, b);
				const expected = (2 * len) / (a.length + b.length);
				ok(Math.abs(lcsSimilarity(a, b) - expected) < 1e-10);
			});
			// lcsString subsequence property
			const l = lcsString("hello", "world");
			ok(
				l.length <= 5 && isSubsequence(l, "hello") && isSubsequence(l, "world"),
			);
		});
	});
});
