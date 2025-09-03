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

describe("Levenshtein", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("computes distance and similarity for common edits", () => {
			// base cases
			strictEqual(levenshteinDistance("", ""), 0);
			strictEqual(levenshteinDistance("", "abc"), 3);
			strictEqual(levenshteinDistance("abc", ""), 3);
			strictEqual(levenshteinDistance("hello", "hello"), 0);
			// insert/delete/substitute
			strictEqual(levenshteinDistance("abc", "abcd"), 1);
			strictEqual(levenshteinDistance("abcd", "abc"), 1);
			strictEqual(levenshteinDistance("abc", "axc"), 1);
			// multiple operations
			strictEqual(levenshteinDistance("kitten", "sitting"), 3);
			strictEqual(levenshteinDistance("saturday", "sunday"), 3);
			// no transposition op in Levenshtein
			strictEqual(levenshteinDistance("ab", "ba"), 2);
			// similarity linkage
			const sim = levenshteinSimilarity("kitten", "sitting");
			ok(Math.abs(sim - (1 - 3 / 7)) < 1e-10);
			// zero similarity for completely different equal-length strings
			strictEqual(levenshteinSimilarity("abc", "xyz"), 0);
			// case insensitive identical (similarity)
			strictEqual(
				levenshteinSimilarity("Hello", "hello", { caseSensitive: false }),
				1,
			);
		});
	});

	describe("edge cases and errors", () => {
		it("validates inputs, options, and maxDistance behavior", () => {
			// input validation
			throws(() => levenshteinDistance(123, "test"), /must be strings/);
			throws(
				() => levenshteinDistance("a", "b", { maxDistance: -1 }),
				/maxDistance/,
			);
			// similarity input validation
			throws(() => levenshteinSimilarity(123, "a"), /must be strings/);
			// case folding option
			strictEqual(
				levenshteinDistance("Hello", "hello", { caseSensitive: false }),
				0,
			);
			// maxDistance capping & early termination
			strictEqual(
				levenshteinDistance("abcdef", "ghijkl", { maxDistance: 3 }),
				3,
			);
			strictEqual(
				levenshteinDistance("short", "much longer text", { maxDistance: 3 }),
				3,
			);
			// similarity with maxDistance passthrough
			const limited = levenshteinSimilarity(
				"very different",
				"completely other",
				{ maxDistance: 3 },
			);
			ok(Math.abs(limited - (1 - 3 / 16)) < 1e-10);
			// early returns
			strictEqual(levenshteinSimilarity("same", "same"), 1);
			strictEqual(levenshteinSimilarity("", "nonempty"), 0);
			// length-diff >= maxDistance shortcut
			strictEqual(levenshteinDistance("a", "aaaaa", { maxDistance: 2 }), 2);
		});
	});

	describe("integration scenarios", () => {
		it("verifies metric properties and symmetry, and short cases", () => {
			// identity, symmetry
			strictEqual(levenshteinDistance("test", "test"), 0);
			strictEqual(
				levenshteinDistance("best", "test"),
				levenshteinDistance("test", "best"),
			);
			// triangle inequality sample
			const dAC = levenshteinDistance("abc", "ghi");
			const dAB = levenshteinDistance("abc", "def");
			const dBC = levenshteinDistance("def", "ghi");
			ok(dAC <= dAB + dBC);
			// very short strings
			strictEqual(levenshteinDistance("a", "b"), 1);
			strictEqual(levenshteinSimilarity("ab", "ba"), 0);
		});
	});
});
