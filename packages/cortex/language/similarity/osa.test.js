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

describe("OSA", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("handles insert/delete/substitute and single transposition", () => {
			// base cases
			strictEqual(osaDistance("", ""), 0);
			strictEqual(osaDistance("hello", "hello"), 0);
			// single ops
			strictEqual(osaDistance("abc", "abcd"), 1);
			strictEqual(osaDistance("abcd", "abc"), 1);
			strictEqual(osaDistance("abc", "axc"), 1);
			// transposition in 1 op
			strictEqual(osaDistance("ab", "ba"), 1);
			strictEqual(osaDistance("abc", "acb"), 1);
			// similarity linkage
			const sim = osaSimilarity("kitten", "sitting");
			ok(Math.abs(sim - (1 - 3 / 7)) < 1e-10);
			// identical similarity branch
			strictEqual(osaSimilarity("same", "same"), 1);
			// empty similarity branch
			strictEqual(osaSimilarity("", "x"), 0);
			strictEqual(osaSimilarity("x", ""), 0);
			// case-insensitive similarity branch
			strictEqual(osaSimilarity("Hello", "hello", { caseSensitive: false }), 1);
		});
	});

	describe("edge cases and errors", () => {
		it("validates inputs, case option, maxDistance, and limits", () => {
			// input validation
			throws(() => osaDistance(123, "test"), /must be strings/);
			throws(() => osaSimilarity(123, "test"), /must be strings/);
			throws(() => osaDistance("a", "b", { maxDistance: -1 }), /maxDistance/);
			// case folding
			strictEqual(osaDistance("Hello", "hello", { caseSensitive: false }), 0);
			// maxDistance capping and early termination
			strictEqual(osaDistance("abcdef", "ghijkl", { maxDistance: 3 }), 3);
			strictEqual(
				osaDistance("short", "much longer text", { maxDistance: 3 }),
				3,
			);
			// early return when target empty (source non-empty)
			strictEqual(osaDistance("abc", ""), 3);
			// OSA limitation (triangle inequality violation documentation)
			strictEqual(osaDistance("ca", "abc"), 3);
		});
	});

	describe("integration scenarios", () => {
		it("verifies symmetry, short strings, and transposition efficiency", () => {
			// symmetry
			strictEqual(osaDistance("best", "test"), osaDistance("test", "best"));
			// short strings
			strictEqual(osaDistance("a", "b"), 1);
			strictEqual(osaSimilarity("ab", "ba"), 0.5);
		});
	});
});
