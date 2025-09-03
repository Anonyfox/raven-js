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

describe("Hamming", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("computes distance/similarity across common patterns", () => {
			// base cases
			strictEqual(hammingDistance("", ""), 0);
			strictEqual(hammingDistance("hello", "hello"), 0);
			strictEqual(hammingDistance("a", "b"), 1);
			// substitutions and classics
			strictEqual(hammingDistance("abc", "axc"), 1);
			strictEqual(hammingDistance("karolin", "kathrin"), 3);
			// binary and DNA
			strictEqual(hammingDistance("1011101", "1001001"), 2);
			strictEqual(hammingDistance("ATCG", "CGTA"), 4);
			// similarity relation
			const sim = hammingSimilarity("abc", "axc");
			ok(Math.abs(sim - (1 - 1 / 3)) < 1e-10);
			// identical similarity branch
			strictEqual(hammingSimilarity("same", "same"), 1);
			strictEqual(
				hammingSimilarity("Hello", "hello", { caseSensitive: false }),
				1,
			);
		});
	});

	describe("edge cases and errors", () => {
		it("validates inputs, casing options, and performance", () => {
			// input validation
			throws(() => hammingDistance(123, "test"), /must be strings/);
			throws(() => hammingSimilarity(123, "test"), /must be strings/);
			throws(() => hammingDistance("abc", "abcd"), /equal-length/);
			throws(() => hammingSimilarity("abc", "abcd"), /equal-length/);
			// case sensitivity option
			strictEqual(
				hammingDistance("Hello", "hello", { caseSensitive: false }),
				0,
			);
			ok(hammingSimilarity("Hello", "hello", { caseSensitive: true }) < 1);
			// performance scale
			const a = "a".repeat(300);
			const b = "b".repeat(300);
			strictEqual(hammingDistance(a, b), 300);
		});
	});

	describe("integration scenarios", () => {
		it("verifies metric properties and distance-similarity consistency", () => {
			// identity, symmetry
			strictEqual(hammingDistance("test", "test"), 0);
			strictEqual(
				hammingDistance("jello", "hello"),
				hammingDistance("hello", "jello"),
			);
			// triangle inequality (sample)
			const dAC = hammingDistance("abc", "xyz");
			const dAB = hammingDistance("abc", "axc");
			const dBC = hammingDistance("axc", "xyz");
			ok(dAC <= dAB + dBC);
			// distance vs similarity relation
			const s = "karolin";
			const t = "kathrin";
			const d = hammingDistance(s, t);
			const ss = hammingSimilarity(s, t);
			ok(Math.abs(ss - (1 - d / s.length)) < 1e-10);
		});
	});
});
