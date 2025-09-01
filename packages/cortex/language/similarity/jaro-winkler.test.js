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

describe("Jaro-Winkler Algorithms", () => {
	describe("jaroSimilarity", () => {
		it("returns 1 for identical strings", () => {
			strictEqual(jaroSimilarity("hello", "hello"), 1);
			strictEqual(jaroSimilarity("", ""), 1);
		});

		it("returns 0 for empty strings with content", () => {
			strictEqual(jaroSimilarity("", "hello"), 0);
			strictEqual(jaroSimilarity("hello", ""), 0);
		});

		it("calculates known Jaro similarity values", () => {
			// Classic test cases from literature
			const sim1 = jaroSimilarity("MARTHA", "MARHTA");
			ok(Math.abs(sim1 - 0.944) < 0.01); // ≈ 0.944

			const sim2 = jaroSimilarity("DIXON", "DICKSONX");
			ok(Math.abs(sim2 - 0.767) < 0.01); // ≈ 0.767

			const sim3 = jaroSimilarity("JELLYFISH", "SMELLYFISH");
			ok(Math.abs(sim3 - 0.896) < 0.01); // ≈ 0.896
		});

		it("handles case sensitivity", () => {
			const sim1 = jaroSimilarity("Hello", "hello");
			ok(sim1 < 1); // Should not be identical due to case

			const sim2 = jaroSimilarity("Hello", "hello", { caseSensitive: false });
			strictEqual(sim2, 1); // Should be identical when case insensitive
		});

		it("handles single character strings", () => {
			strictEqual(jaroSimilarity("a", "a"), 1);
			strictEqual(jaroSimilarity("a", "b"), 0);
		});

		it("calculates similarity for short strings", () => {
			const sim1 = jaroSimilarity("ab", "ba");
			ok(sim1 >= 0); // May not match due to position requirements

			const sim2 = jaroSimilarity("abc", "bca");
			ok(sim2 >= 0); // Characters match but positions affect score
		});

		it("handles completely different strings", () => {
			const sim = jaroSimilarity("abc", "xyz");
			strictEqual(sim, 0); // No matching characters
		});

		it("throws on invalid input", () => {
			throws(() => jaroSimilarity(123, "string"), /must be strings/);
			throws(() => jaroSimilarity("string", null), /must be strings/);
		});
	});

	describe("jaroDistance", () => {
		it("returns complement of similarity", () => {
			const sim = jaroSimilarity("hello", "hallo");
			const dist = jaroDistance("hello", "hallo");
			strictEqual(Math.round((sim + dist) * 1000) / 1000, 1);
		});

		it("returns 0 for identical strings", () => {
			strictEqual(jaroDistance("test", "test"), 0);
		});

		it("returns 1 for completely different strings", () => {
			strictEqual(jaroDistance("abc", "xyz"), 1);
		});
	});

	describe("jaroWinklerSimilarity", () => {
		it("returns 1 for identical strings", () => {
			strictEqual(jaroWinklerSimilarity("hello", "hello"), 1);
			strictEqual(jaroWinklerSimilarity("", ""), 1);
		});

		it("gives higher scores for common prefixes", () => {
			// Strings with common prefixes should score higher than Jaro alone
			const jaro = jaroSimilarity("MARTHA", "MARHTA");
			const jaroWinkler = jaroWinklerSimilarity("MARTHA", "MARHTA");
			ok(jaroWinkler >= jaro); // Should be at least as good

			// Example with clear prefix advantage
			const jw1 = jaroWinklerSimilarity("prefix_abc", "prefix_xyz");
			const jw2 = jaroWinklerSimilarity("abc_prefix", "xyz_prefix");
			ok(jw1 > jw2); // Common prefix should score higher
		});

		it("calculates known Jaro-Winkler values", () => {
			// Classic test cases
			const sim1 = jaroWinklerSimilarity("MARTHA", "MARHTA");
			ok(Math.abs(sim1 - 0.961) < 0.01); // ≈ 0.961

			const sim2 = jaroWinklerSimilarity("DIXON", "DICKSONX");
			ok(Math.abs(sim2 - 0.813) < 0.01); // ≈ 0.813
		});

		it("respects threshold parameter", () => {
			// Below threshold should return Jaro similarity without prefix bonus
			const lowThreshold = jaroWinklerSimilarity("abc", "xyz", {
				threshold: 0.9,
			});
			const jaro = jaroSimilarity("abc", "xyz");
			strictEqual(lowThreshold, jaro);
		});

		it("respects prefix scale parameter", () => {
			const defaultScale = jaroWinklerSimilarity("prefix_test", "prefix_best");
			const highScale = jaroWinklerSimilarity("prefix_test", "prefix_best", {
				prefixScale: 0.25,
			});
			ok(highScale >= defaultScale); // Higher scale should give higher score
		});

		it("respects max prefix length", () => {
			const longPrefix = "verylongprefix_abc";
			const longPrefix2 = "verylongprefix_xyz";

			const maxLen4 = jaroWinklerSimilarity(longPrefix, longPrefix2, {
				maxPrefixLength: 4,
			});
			const maxLen8 = jaroWinklerSimilarity(longPrefix, longPrefix2, {
				maxPrefixLength: 8,
			});

			ok(maxLen8 >= maxLen4); // Longer prefix should give higher score
		});

		it("handles case sensitivity", () => {
			const caseSensitive = jaroWinklerSimilarity("Prefix", "prefix");
			const caseInsensitive = jaroWinklerSimilarity("Prefix", "prefix", {
				caseSensitive: false,
			});
			ok(caseInsensitive > caseSensitive);
		});

		it("throws on invalid input", () => {
			throws(() => jaroWinklerSimilarity(123, "string"), /must be strings/);
			throws(() => jaroWinklerSimilarity("string", {}), /must be strings/);
		});
	});

	describe("jaroWinklerDistance", () => {
		it("returns complement of similarity", () => {
			const sim = jaroWinklerSimilarity("hello", "hallo");
			const dist = jaroWinklerDistance("hello", "hallo");
			strictEqual(Math.round((sim + dist) * 1000) / 1000, 1);
		});

		it("returns 0 for identical strings", () => {
			strictEqual(jaroWinklerDistance("test", "test"), 0);
		});
	});

	describe("findBestMatch", () => {
		const candidates = ["apple", "application", "apply", "orange", "grape"];

		it("finds best match above threshold", () => {
			const match = findBestMatch("app", candidates, { minSimilarity: 0.5 });

			ok(match !== null);
			// Could be either "apple" or "apply" depending on algorithm scoring
			ok(match.candidate === "apple" || match.candidate === "apply");
			ok(match.similarity > 0.5);
			ok(typeof match.index === "number");
		});

		it("returns null when no match above threshold", () => {
			const match = findBestMatch("xyz", candidates, { minSimilarity: 0.8 });
			strictEqual(match, null);
		});

		it("returns all matches when requested", () => {
			const matches = findBestMatch("app", candidates, {
				minSimilarity: 0.4,
				returnAll: true,
			});

			ok(Array.isArray(matches));
			ok(matches.length > 0);
			// Should be sorted by similarity descending
			for (let i = 1; i < matches.length; i++) {
				ok(matches[i - 1].similarity >= matches[i].similarity);
			}
		});

		it("handles case sensitivity", () => {
			const upperCandidates = ["APPLE", "APPLICATION", "APPLY"];

			const caseSensitive = findBestMatch("app", upperCandidates, {
				caseSensitive: true,
				minSimilarity: 0.1,
			});
			const caseInsensitive = findBestMatch("app", upperCandidates, {
				caseSensitive: false,
				minSimilarity: 0.1,
			});

			// Both should find matches, case insensitive should score higher
			ok(caseSensitive !== null || caseInsensitive !== null);
			if (caseInsensitive && caseSensitive) {
				ok(caseInsensitive.similarity >= caseSensitive.similarity);
			}
		});

		it("handles edge cases", () => {
			// Empty candidates
			strictEqual(findBestMatch("test", []), null);
			deepStrictEqual(findBestMatch("test", [], { returnAll: true }), []);

			// Non-string candidates (should be filtered out)
			const mixedCandidates = ["apple", 123, "orange", null, "grape"];
			const match = findBestMatch("app", mixedCandidates);
			ok(match !== null);
			strictEqual(typeof match.candidate, "string");
		});

		it("throws on invalid query", () => {
			throws(() => findBestMatch(123, candidates), /Query must be a string/);
			throws(() => findBestMatch(null, candidates), /Query must be a string/);
		});
	});

	describe("groupSimilarStrings", () => {
		it("groups similar strings correctly", () => {
			const strings = [
				"apple",
				"aple", // misspelling of apple
				"orange",
				"ornge", // misspelling of orange
				"grape",
				"grapes", // plural of grape
			];

			const groups = groupSimilarStrings(strings, { threshold: 0.7 });

			ok(Array.isArray(groups));
			ok(groups.length >= 1);

			// Check that each group contains only strings
			for (const group of groups) {
				ok(Array.isArray(group));
				ok(group.length > 0);
				for (const item of group) {
					strictEqual(typeof item, "string");
				}
			}

			// All original strings should be included exactly once
			const allGroupedStrings = groups.flat();
			strictEqual(allGroupedStrings.length, strings.length);
			for (const str of strings) {
				ok(allGroupedStrings.includes(str));
			}
		});

		it("creates single groups with high threshold", () => {
			const strings = ["apple", "orange", "grape"];
			const groups = groupSimilarStrings(strings, { threshold: 0.9 });

			// With high threshold, dissimilar strings should be in separate groups
			strictEqual(groups.length, 3);
			for (const group of groups) {
				strictEqual(group.length, 1);
			}
		});

		it("creates fewer groups with low threshold", () => {
			const strings = ["test1", "test2", "test3"];
			const highThresholdGroups = groupSimilarStrings(strings, {
				threshold: 0.9,
			});
			const lowThresholdGroups = groupSimilarStrings(strings, {
				threshold: 0.3,
			});

			// Lower threshold should result in fewer groups
			ok(lowThresholdGroups.length <= highThresholdGroups.length);
		});

		it("handles case sensitivity", () => {
			const strings = ["Apple", "apple", "APPLE"];

			const caseSensitive = groupSimilarStrings(strings, {
				threshold: 0.8,
				caseSensitive: true,
			});
			const caseInsensitive = groupSimilarStrings(strings, {
				threshold: 0.8,
				caseSensitive: false,
			});

			// Case insensitive should group them together
			ok(caseInsensitive.length <= caseSensitive.length);
		});

		it("filters out non-strings", () => {
			const mixed = ["apple", 123, "orange", null, undefined, "grape"];
			const groups = groupSimilarStrings(mixed);

			const allGroupedItems = groups.flat();
			for (const item of allGroupedItems) {
				strictEqual(typeof item, "string");
			}
		});

		it("handles edge cases", () => {
			// Empty array
			deepStrictEqual(groupSimilarStrings([]), []);

			// Single string
			const singleResult = groupSimilarStrings(["test"]);
			deepStrictEqual(singleResult, [["test"]]);

			// All identical strings
			const identical = ["same", "same", "same"];
			const identicalGroups = groupSimilarStrings(identical, {
				threshold: 0.9,
			});
			strictEqual(identicalGroups.length, 1);
			strictEqual(identicalGroups[0].length, 3);
		});

		it("throws on invalid input", () => {
			throws(() => groupSimilarStrings("not an array"), /must be an array/);
			throws(() => groupSimilarStrings(123), /must be an array/);
		});
	});

	describe("edge cases and performance", () => {
		it("handles Unicode characters", () => {
			const sim1 = jaroSimilarity("café", "cafe");
			ok(sim1 > 0.8); // Should be quite similar

			const sim2 = jaroWinklerSimilarity("αβγ", "αβδ");
			ok(sim2 > 0.6); // Greek characters with common prefix
		});

		it("handles very short strings", () => {
			strictEqual(jaroSimilarity("a", "a"), 1);
			strictEqual(jaroWinklerSimilarity("a", "a"), 1);

			const sim = jaroWinklerSimilarity("a", "b");
			strictEqual(sim, 0); // No matches possible
		});

		it("handles strings with whitespace and punctuation", () => {
			const sim1 = jaroSimilarity("hello world", "hello-world");
			ok(sim1 > 0.8);

			const sim2 = jaroWinklerSimilarity("Dr. Smith", "Dr Smith");
			ok(sim2 > 0.9);
		});

		it("performs consistently on medium-length strings", () => {
			const str1 = "The quick brown fox";
			const str2 = "The quick brown fox jumps";

			const jaro = jaroSimilarity(str1, str2);
			const jaroWinkler = jaroWinklerSimilarity(str1, str2);

			ok(jaro > 0.7);
			ok(jaroWinkler >= jaro);
		});

		it("maintains score bounds", () => {
			const testPairs = [
				["similarity", "different"],
				["test123", "test456"],
				["short", "longer string"],
				["", "non-empty"],
			];

			for (const [s1, s2] of testPairs) {
				const jaro = jaroSimilarity(s1, s2);
				const jaroWinkler = jaroWinklerSimilarity(s1, s2);

				ok(jaro >= 0 && jaro <= 1, `Jaro should be 0-1: ${jaro}`);
				ok(
					jaroWinkler >= 0 && jaroWinkler <= 1,
					`Jaro-Winkler should be 0-1: ${jaroWinkler}`,
				);
				ok(
					jaroWinkler >= jaro,
					`Jaro-Winkler should be >= Jaro: ${jaroWinkler} >= ${jaro}`,
				);
			}
		});
	});
});
