/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { MinHasher } from "./minhash.js";

describe("MinHash", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("constructs, extracts shingles, computes signatures and similarities", () => {
			// constructor defaults
			const d = new MinHasher();
			strictEqual(d.numHashes, 128);
			strictEqual(d.shingleSize, 3);
			strictEqual(d.useWordShingles, false);
			strictEqual(d.wordShingleSize, 2);
			strictEqual(d.normalize, true);
			strictEqual(d.lowercase, true);
			ok(Array.isArray(d.hashFunctions));
			strictEqual(d.hashFunctions.length, 128);
			// custom options (word shingles, no normalize/lowercase)
			const w = new MinHasher({
				numHashes: 32,
				useWordShingles: true,
				wordShingleSize: 2,
				normalize: false,
				lowercase: false,
			});
			strictEqual(w.numHashes, 32);
			strictEqual(w.useWordShingles, true);
			strictEqual(w.wordShingleSize, 2);
			strictEqual(w.normalize, false);
			strictEqual(w.lowercase, false);

			// extractShingles branches: chars vs words, lowercase effect
			const chars = d.extractShingles("HELLO");
			ok(chars instanceof Set);
			ok(chars.has("hel")); // lowercase applied
			const words = w.extractShingles("hello world test");
			ok(words instanceof Set);
			ok(words.has("hello world"));
			ok(words.has("world test"));

			// computeSignature: Set vs Array paths, deterministic, skip non-strings
			const sigSet = d.computeSignature(new Set(["abc", "def", "ghi"]));
			ok(Array.isArray(sigSet));
			strictEqual(sigSet.length, 128);
			const sigArr = d.computeSignature(["abc", 123, "def", null, "ghi"]);
			ok(Array.isArray(sigArr));
			strictEqual(sigArr.length, 128);
			deepStrictEqual(
				d.computeSignature(new Set(["x", "y"])),
				d.computeSignature(new Set(["x", "y"])),
			);

			// computeTextSignature: produces finite values
			const sigText = d.computeTextSignature("hello world");
			ok(Array.isArray(sigText));
			strictEqual(sigText.length, 128);
			ok(sigText.every((v) => Number.isFinite(v)));

			// estimateSimilarity: identical, partial, empty
			strictEqual(d.estimateSimilarity([1, 2, 3], [1, 2, 3]), 1);
			strictEqual(d.estimateSimilarity([1, 2, 3, 4, 5], [1, 2, 8, 9, 10]), 0.4);
			strictEqual(d.estimateSimilarity([], []), 0);

			// Jaccard similarity helpers: exact sets and texts
			strictEqual(
				d.computeJaccardSimilarity(
					new Set(["a", "b", "c"]),
					new Set(["a", "b", "c"]),
				),
				1,
			);
			strictEqual(
				d.computeJaccardSimilarity(["a", "b", "c"], ["b", "c", "d"]),
				0.5,
			);
			strictEqual(d.computeJaccardSimilarity(new Set(), new Set()), 1);
			ok(d.computeTextJaccardSimilarity("the quick", "the quick brown") >= 0);

			// estimateTextSimilarity: identical texts return 1
			strictEqual(d.estimateTextSimilarity("the quick", "the quick"), 1);
		});
	});

	describe("edge cases and errors", () => {
		it("validates inputs, mismatches, and early branches", () => {
			const d = new MinHasher({ numHashes: 10 });
			// extractShingles invalid input
			throws(() => d.extractShingles(123), /Input must be a string/);
			// computeSignature invalids
			throws(() => d.computeSignature(null), /must be iterable/);
			throws(() => d.computeSignature(123), /must be iterable/);
			// computeSignature empty -> Infinity values
			const emptySig = d.computeSignature(new Set());
			strictEqual(emptySig.length, 10);
			emptySig.forEach((v) => {
				strictEqual(v, Number.POSITIVE_INFINITY);
			});
			// estimateSimilarity invalids & mismatch
			throws(
				() => d.estimateSimilarity("not array", [1, 2, 3]),
				/must be arrays/,
			);
			throws(() => d.estimateSimilarity([1, 2, 3], null), /must be arrays/);
			throws(() => d.estimateSimilarity([1, 2, 3], [1, 2]), /same length/);
			// findSimilar invalid docs param, and skips non-string docs
			throws(() => d.findSimilar("q", "not array"), /must be an array/);
			const filtered = d.findSimilar(
				"valid",
				["valid document", 123, null, "another doc"],
				{ threshold: 0 },
			);
			ok(filtered.every((r) => typeof r.document === "string"));
			// analyzeAccuracy with exact==0 triggers relativeError=0 path
			const analysis = d.analyzeAccuracy("aaa", "bbb"); // disjoint shingles -> exact 0
			ok(analysis.estimated >= 0 && analysis.estimated <= 1);
			strictEqual(analysis.relativeError, 0);
		});
	});

	describe("integration scenarios", () => {
		it("searches similar docs, returns sorted limited results, and reports accuracy", () => {
			const d = new MinHasher({ numHashes: 32 });
			const docs = [
				"the quick brown fox jumps",
				"the quick brown fox runs",
				"a lazy dog sleeps",
				"the quick red fox jumps",
			];
			const results = d.findSimilar("the quick brown fox leaps", docs, {
				threshold: 0.1,
				maxResults: 3,
			});
			ok(Array.isArray(results));
			ok(results.length <= 3);
			for (let i = 1; i < results.length; i++)
				ok(results[i - 1].similarity >= results[i].similarity);
			ok(
				results.every(
					(r) =>
						typeof r.document === "string" &&
						typeof r.similarity === "number" &&
						typeof r.index === "number",
				),
			);
			// word shingles variant
			const w = new MinHasher({ useWordShingles: true, wordShingleSize: 2 });
			const acc = w.analyzeAccuracy(
				"machine learning algorithms",
				"machine learning models",
			);
			strictEqual(acc.shingleType, "word");
			strictEqual(acc.shingleSize, 2);
		});
	});
});
