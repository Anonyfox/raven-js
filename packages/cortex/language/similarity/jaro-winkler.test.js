/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import {
	findBestMatch,
	groupSimilarStrings,
	jaroDistance,
	jaroSimilarity,
	jaroWinklerDistance,
	jaroWinklerSimilarity,
} from "./jaro-winkler.js";

describe("Jaro-Winkler", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("computes Jaro/JW similarity and distance basics", () => {
			// identical and empty
			strictEqual(jaroSimilarity("hello", "hello"), 1);
			strictEqual(jaroSimilarity("", ""), 1);
			strictEqual(jaroWinklerSimilarity("hello", "hello"), 1);
			// complement relation
			const sim = jaroSimilarity("hello", "hallo");
			const dist = jaroDistance("hello", "hallo");
			strictEqual(Math.round((sim + dist) * 1000) / 1000, 1);
			// known values (approx)
			ok(Math.abs(jaroSimilarity("MARTHA", "MARHTA") - 0.944) < 0.02);
			ok(Math.abs(jaroWinklerSimilarity("MARTHA", "MARHTA") - 0.961) < 0.02);
			ok(Math.abs(jaroSimilarity("DIXON", "DICKSONX") - 0.767) < 0.02);
			// common prefix advantage
			ok(
				jaroWinklerSimilarity("prefix_abc", "prefix_xyz") >
					jaroWinklerSimilarity("abc_prefix", "xyz_prefix"),
			);
			// ensure case-insensitive JW path enters prefix logic and returns 1
			strictEqual(
				jaroWinklerSimilarity("Hello", "hello", { caseSensitive: false }),
				1,
			);
		});
	});

	describe("edge cases and errors", () => {
		it("handles case, params, invalid inputs, and bounds", () => {
			// case sensitivity
			ok(jaroSimilarity("Hello", "hello") < 1);
			strictEqual(
				jaroSimilarity("Hello", "hello", { caseSensitive: false }),
				1,
			);
			// thresholds and scales
			const lowThreshold = jaroWinklerSimilarity("abc", "xyz", {
				threshold: 0.9,
			});
			strictEqual(lowThreshold, jaroSimilarity("abc", "xyz"));
			const defaultScale = jaroWinklerSimilarity("prefix_test", "prefix_best");
			const highScale = jaroWinklerSimilarity("prefix_test", "prefix_best", {
				prefixScale: 0.25,
			});
			ok(highScale >= defaultScale);
			// max prefix length
			const lp1 = jaroWinklerSimilarity(
				"verylongprefix_abc",
				"verylongprefix_xyz",
				{ maxPrefixLength: 4 },
			);
			const lp2 = jaroWinklerSimilarity(
				"verylongprefix_abc",
				"verylongprefix_xyz",
				{ maxPrefixLength: 8 },
			);
			ok(lp2 >= lp1);
			// invalid inputs
			throws(() => jaroSimilarity(123, "string"), /must be strings/);
			throws(() => jaroWinklerSimilarity("string", {}), /must be strings/);
			// distance bounds
			strictEqual(jaroDistance("test", "test"), 0);
			strictEqual(jaroDistance("abc", "xyz"), 1);
			// ensure threshold short-circuit path when below threshold
			const below = jaroWinklerSimilarity("abc", "xyz", { threshold: 0.9 });
			strictEqual(below, jaroSimilarity("abc", "xyz"));
			// identical and empty paths
			strictEqual(jaroSimilarity("", ""), 1);
			strictEqual(jaroSimilarity("", "x"), 0);
			strictEqual(jaroSimilarity("same", "same"), 1);
			// non-string candidates filtered
			strictEqual(
				findBestMatch("q", [123, null], { minSimilarity: 0.1 }),
				null,
			);
			// invalid inputs
			throws(() => findBestMatch(123, ["a"]), /Query must be a string/);
			throws(() => groupSimilarStrings("not array"), /array of strings/);
		});
	});

	describe("integration scenarios", () => {
		it("finds best matches and groups strings", () => {
			const candidates = ["apple", "application", "apply", "orange", "grape"];
			const match = findBestMatch("app", candidates, { minSimilarity: 0.5 });
			ok(
				match === null ||
					(typeof match.index === "number" && match.similarity > 0.5),
			);
			const noMatch = findBestMatch("xyz", candidates, { minSimilarity: 0.8 });
			strictEqual(noMatch, null);
			const matches = findBestMatch("app", candidates, {
				minSimilarity: 0.4,
				returnAll: true,
			});
			ok(Array.isArray(matches));
			for (let i = 1; i < matches.length; i++)
				ok(matches[i - 1].similarity >= matches[i].similarity);
			// grouping
			const strings = ["apple", "aple", "orange", "ornge", "grape", "grapes"];
			const groups = groupSimilarStrings(strings, { threshold: 0.7 });
			ok(Array.isArray(groups));
			ok(groups.flat().every((s) => typeof s === "string"));
			// high threshold yields singleton groups
			const singletons = groupSimilarStrings(["apple", "orange", "grape"], {
				threshold: 0.9,
			});
			singletons.forEach((g) => {
				strictEqual(g.length, 1);
			});
			// wrapper distance function coverage
			ok(jaroWinklerDistance("prefix", "prefix") === 0);
			// findBestMatch returnAll + empty candidates
			strictEqual(findBestMatch("q", [], { returnAll: false }), null);
			deepStrictEqual(findBestMatch("q", [], { returnAll: true }), []);
			// findBestMatch returnAll when no matches in non-empty candidates
			deepStrictEqual(
				findBestMatch("q", ["apple", "orange"], {
					minSimilarity: 0.99,
					returnAll: true,
				}),
				[],
			);
			// groupSimilarStrings filters non-strings
			const mixed = ["apple", 123, "aple", null, "orange"];
			const g = groupSimilarStrings(mixed, { threshold: 0.8 });
			ok(Array.isArray(g));
		});
	});
});
