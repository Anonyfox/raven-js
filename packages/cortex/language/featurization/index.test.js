/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import * as featurization from "./index.js";

describe("featurization module", () => {
	it("re-exports all n-gram functions", () => {
		// Verify all expected functions are available
		ok(typeof featurization.ngrams === "function", "Should export ngrams");
		// Note: TF-IDF is now a dedicated ML model in cortex/learning
		// Use: import { Tfidf } from '@raven-js/cortex/learning'
		ok(
			typeof featurization.hashFeatures === "function",
			"Should export hashFeatures",
		);
		ok(typeof featurization.rake === "function", "Should export rake");
		ok(typeof featurization.textrank === "function", "Should export textrank");
	});

	it("ngrams function works through re-export", () => {
		const testText = "the quick brown fox jumps";

		// Test default word n-grams
		const wordResult = featurization.ngrams(testText);
		ok(Array.isArray(wordResult), "ngrams should return array by default");
		ok(wordResult.length > 0, "Should extract word n-grams by default");
		ok(wordResult.includes("the quick"), "Should contain expected bigram");
		ok(wordResult.includes("brown fox"), "Should contain expected bigram");

		// Test character n-grams
		const charResult = featurization.ngrams(testText, { type: "chars", n: 3 });
		ok(Array.isArray(charResult), "ngrams with chars type should return array");
		ok(charResult.length > 0, "Should extract character n-grams");
		ok(charResult.includes("the"), "Should contain expected trigram");

		// Test mixed n-grams
		const mixedResult = featurization.ngrams(testText, { type: "mixed" });
		ok(
			typeof mixedResult === "object",
			"ngrams with mixed type should return object",
		);
		ok(Array.isArray(mixedResult.char), "Should have char array");
		ok(Array.isArray(mixedResult.word), "Should have word array");
		ok(mixedResult.char.length > 0, "Should extract character features");
		ok(mixedResult.word.length > 0, "Should extract word features");
	});

	it("handles edge cases consistently", () => {
		// Empty input
		const emptyWord = featurization.ngrams("");
		const emptyChar = featurization.ngrams("", { type: "chars" });
		const emptyMixed = featurization.ngrams("", { type: "mixed" });

		deepStrictEqual(emptyWord, []);
		deepStrictEqual(emptyChar, []);
		deepStrictEqual(emptyMixed.char, []);
		deepStrictEqual(emptyMixed.word, []);

		// Single character/word
		const singleChar = featurization.ngrams("x", { type: "chars", n: 3 });
		const singleWord = featurization.ngrams("hello", { n: 2 });

		deepStrictEqual(singleChar, []);
		deepStrictEqual(singleWord, []);
	});

	it("integration with normalization pipeline", () => {
		// Test that normalization options work through re-exports
		const unnormalized = "CAFÉ";

		const normalized = featurization.ngrams(unnormalized, {
			type: "chars",
			n: 2,
			normalize: true,
			lowercase: true,
		});

		const notNormalized = featurization.ngrams(unnormalized, {
			type: "chars",
			n: 2,
			normalize: false,
			lowercase: false,
		});

		// Should get different results with vs without normalization
		ok(normalized.length > 0, "Should extract normalized n-grams");
		ok(notNormalized.length > 0, "Should extract raw n-grams");
		ok(normalized.includes("ca"), "Should normalize to lowercase");
	});

	// Note: TF-IDF tests moved to learning/tfidf.test.js
	// TF-IDF is now a proper ML model: import { Tfidf } from '@raven-js/cortex/learning'

	it("hashFeatures works through re-export", () => {
		const text = "Hello world! This is a test document.";
		const hash = featurization.hashFeatures(text, {
			numFeatures: 512,
			featureType: "mixed",
		});

		strictEqual(typeof hash, "string");
		strictEqual(hash.length, 128);
		ok(/^[0-9a-f]+$/.test(hash));
	});
});
