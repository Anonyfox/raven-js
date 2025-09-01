/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeNgramRepetition } from "./ngram-repetition.js";

describe("analyzeNgramRepetition", () => {
	describe("basic functionality", () => {
		it("analyzes character-level trigrams correctly", () => {
			const text = "abcdef";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 3 });

			// Expected: "abc", "bcd", "cde", "def" (4 total, 4 unique)
			assert.equal(result.totalNgrams, 4, "Should extract 4 trigrams");
			assert.equal(result.uniqueNgrams, 4, "Should have 4 unique trigrams");
			assert.equal(result.diversityRatio, 1, "Should have perfect diversity");
			assert.equal(result.averageFrequency, 1, "Each trigram appears once");
			assert.equal(result.repetitionRate, 0, "No repeated trigrams");
		});

		it("analyzes word-level bigrams correctly", () => {
			const text = "the quick brown fox";
			const result = analyzeNgramRepetition(text, { unit: "word", n: 2 });

			// Expected: "the quick", "quick brown", "brown fox" (3 total, 3 unique)
			assert.equal(result.totalNgrams, 3, "Should extract 3 bigrams");
			assert.equal(result.uniqueNgrams, 3, "Should have 3 unique bigrams");
			assert.equal(result.diversityRatio, 1, "Should have perfect diversity");
			assert.equal(result.averageFrequency, 1, "Each bigram appears once");
			assert.equal(result.repetitionRate, 0, "No repeated bigrams");
		});

		it("detects repetitive patterns", () => {
			const text = "abcabc";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 2 });

			// Expected: "ab", "bc", "ca", "ab", "bc" (5 total, 3 unique)
			assert.equal(result.totalNgrams, 5, "Should extract 5 bigrams");
			assert.equal(result.uniqueNgrams, 3, "Should have 3 unique bigrams");
			assert.equal(result.diversityRatio, 0.6, "Should show 60% diversity");
			assert.ok(result.repetitionRate > 0, "Should detect repetition");
		});

		it("handles single character repetition", () => {
			const text = "aaaa";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 2 });

			// Expected: "aa", "aa", "aa" (3 total, 1 unique)
			assert.equal(result.totalNgrams, 3, "Should extract 3 bigrams");
			assert.equal(result.uniqueNgrams, 1, "Should have 1 unique bigram");
			assert.equal(result.diversityRatio, 1 / 3, "Should show low diversity");
			assert.equal(
				result.averageFrequency,
				3,
				"Should have high average frequency",
			);
			assert.equal(result.repetitionRate, 1, "All unique n-grams are repeated");
		});
	});

	describe("parameter variations", () => {
		it("handles different n-gram sizes", () => {
			const text = "abcdefgh";

			const bigrams = analyzeNgramRepetition(text, {
				unit: "character",
				n: 2,
			});
			const trigrams = analyzeNgramRepetition(text, {
				unit: "character",
				n: 3,
			});
			const fourgrams = analyzeNgramRepetition(text, {
				unit: "character",
				n: 4,
			});

			assert.equal(bigrams.totalNgrams, 7, "Should extract 7 bigrams");
			assert.equal(trigrams.totalNgrams, 6, "Should extract 6 trigrams");
			assert.equal(fourgrams.totalNgrams, 5, "Should extract 5 fourgrams");

			// All should have perfect diversity for unique characters
			assert.equal(bigrams.diversityRatio, 1, "Bigrams should be unique");
			assert.equal(trigrams.diversityRatio, 1, "Trigrams should be unique");
			assert.equal(fourgrams.diversityRatio, 1, "Fourgrams should be unique");
		});

		it("compares character vs word analysis", () => {
			const text = "cat bat cat";

			const charAnalysis = analyzeNgramRepetition(text, {
				unit: "character",
				n: 2,
			});
			const wordAnalysis = analyzeNgramRepetition(text, {
				unit: "word",
				n: 2,
			});

			// Word analysis: "cat bat", "bat cat" (2 total, 2 unique)
			assert.equal(
				wordAnalysis.totalNgrams,
				2,
				"Should extract 2 word bigrams",
			);
			assert.equal(
				wordAnalysis.uniqueNgrams,
				2,
				"Word bigrams should be unique",
			);

			// Character analysis will have more n-grams due to spaces and repetition
			assert.ok(
				charAnalysis.totalNgrams > wordAnalysis.totalNgrams,
				"Character analysis should have more n-grams",
			);
		});

		it("handles case sensitivity correctly", () => {
			const text = "AbC aBc";

			const caseSensitive = analyzeNgramRepetition(text, {
				unit: "character",
				n: 2,
				caseSensitive: true,
			});
			const caseInsensitive = analyzeNgramRepetition(text, {
				unit: "character",
				n: 2,
				caseSensitive: false,
			});

			// Case sensitive should see different patterns, insensitive should see repetition
			assert.ok(
				caseSensitive.diversityRatio >= caseInsensitive.diversityRatio,
				"Case sensitive should have higher or equal diversity",
			);
		});
	});

	describe("multilingual support", () => {
		it("analyzes German text correctly", () => {
			const germanText = "Müller führt große Änderungen durch";
			const result = analyzeNgramRepetition(germanText, {
				unit: "word",
				n: 2,
			});

			assert.ok(result.totalNgrams > 0, "Should extract German word bigrams");
			assert.ok(result.uniqueNgrams > 0, "Should have unique German bigrams");
			assert.ok(result.diversityRatio >= 0, "Should calculate valid diversity");
		});

		it("handles Unicode characters", () => {
			const unicodeText = "🌟⭐✨ 世界 café ñoño";
			const result = analyzeNgramRepetition(unicodeText, {
				unit: "character",
				n: 2,
			});

			assert.ok(
				result.totalNgrams > 0,
				"Should extract Unicode character bigrams",
			);
			assert.ok(result.uniqueNgrams > 0, "Should have unique Unicode bigrams");
			assert.ok(
				typeof result.diversityRatio === "number",
				"Should return valid metrics",
			);
		});

		it("processes mixed script content", () => {
			const mixedText = "Hello 世界 مرحبا mundo";
			const result = analyzeNgramRepetition(mixedText, { unit: "word", n: 2 });

			assert.ok(result.totalNgrams > 0, "Should handle mixed scripts");
			assert.ok(result.diversityRatio >= 0, "Should calculate valid diversity");
		});
	});

	describe("text pattern detection", () => {
		it("detects AI-like repetitive patterns", () => {
			const aiText =
				"The system processes data. The system analyzes data. The system outputs data.";
			const result = analyzeNgramRepetition(aiText, { unit: "word", n: 2 });

			assert.ok(
				result.diversityRatio < 0.8,
				"AI-like text should show lower diversity",
			);
			assert.ok(
				result.repetitionRate > 0.2,
				"Should detect repetitive patterns",
			);
		});

		it("detects human-like diverse patterns", () => {
			const humanText =
				"Creative writers explore various narrative techniques, experimenting with different storytelling approaches and innovative literary devices.";
			const result = analyzeNgramRepetition(humanText, { unit: "word", n: 2 });

			assert.ok(
				result.diversityRatio > 0.7,
				"Human-like text should show higher diversity",
			);
		});

		it("analyzes template-like content", () => {
			const templateText =
				"Dear Sir or Madam, Thank you for your inquiry. Dear Sir or Madam, We appreciate your interest.";
			const result = analyzeNgramRepetition(templateText, {
				unit: "word",
				n: 3,
			});

			assert.ok(
				result.repetitionRate > 0.1,
				"Template text should show some repetitive patterns",
			);
		});

		it("detects form letter patterns", () => {
			const formLetter = `
				Thank you for contacting our customer service team.
				Thank you for your patience while we process your request.
				Thank you for choosing our company for your needs.
			`;
			const result = analyzeNgramRepetition(formLetter, { unit: "word", n: 2 });

			assert.ok(
				result.repetitionRate > 0.1,
				"Form letters should show repetitive patterns",
			);
		});
	});

	describe("edge cases", () => {
		it("handles minimal text length", () => {
			const text = "abc";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 2 });

			// Expected: "ab", "bc" (2 total, 2 unique)
			assert.equal(
				result.totalNgrams,
				2,
				"Should extract 2 bigrams from 3 chars",
			);
			assert.equal(result.uniqueNgrams, 2, "Should have 2 unique bigrams");
		});

		it("handles text exactly matching n-gram size", () => {
			const text = "abc";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 3 });

			// Expected: "abc" (1 total, 1 unique)
			assert.equal(result.totalNgrams, 1, "Should extract 1 trigram");
			assert.equal(result.uniqueNgrams, 1, "Should have 1 unique trigram");
			assert.equal(result.diversityRatio, 1, "Should have perfect diversity");
		});

		it("handles single word input", () => {
			const text = "word";
			const result = analyzeNgramRepetition(text, { unit: "word", n: 1 });

			assert.equal(result.totalNgrams, 1, "Should extract 1 unigram");
			assert.equal(result.uniqueNgrams, 1, "Should have 1 unique unigram");
		});

		it("handles highly repetitive text", () => {
			const text = "a".repeat(100);
			const result = analyzeNgramRepetition(text, { unit: "character", n: 3 });

			// All trigrams will be "aaa"
			assert.equal(result.uniqueNgrams, 1, "Should have only 1 unique trigram");
			assert.equal(
				result.diversityRatio,
				1 / 98,
				"Should have very low diversity",
			);
			assert.equal(result.repetitionRate, 1, "All unique n-grams are repeated");
		});

		it("processes text with only whitespace words", () => {
			const text = "   a   b   c   ";
			const result = analyzeNgramRepetition(text, { unit: "word", n: 2 });

			// Should extract: "a b", "b c"
			assert.equal(result.totalNgrams, 2, "Should handle spaced words");
			assert.equal(result.uniqueNgrams, 2, "Should have unique word bigrams");
		});

		it("handles large n-gram sizes", () => {
			const text = "abcdefghijklmnop";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 10 });

			assert.equal(
				result.totalNgrams,
				7,
				"Should extract 7 10-grams from 16 chars",
			);
			assert.ok(result.diversityRatio > 0, "Should calculate valid diversity");
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => analyzeNgramRepetition(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => analyzeNgramRepetition(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => analyzeNgramRepetition(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => analyzeNgramRepetition([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => analyzeNgramRepetition({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => analyzeNgramRepetition(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => analyzeNgramRepetition("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for invalid n parameter", () => {
			assert.throws(
				() => analyzeNgramRepetition("text", { n: 0 }),
				Error,
				"Should reject n=0",
			);
			assert.throws(
				() => analyzeNgramRepetition("text", { n: -1 }),
				Error,
				"Should reject negative n",
			);
			assert.throws(
				() => analyzeNgramRepetition("text", { n: 1.5 }),
				Error,
				"Should reject fractional n",
			);
			assert.throws(
				() => analyzeNgramRepetition("text", { n: "3" }),
				Error,
				"Should reject string n",
			);
		});

		it("throws Error for invalid unit parameter", () => {
			assert.throws(
				() => analyzeNgramRepetition("text", { unit: "invalid" }),
				Error,
				"Should reject invalid unit",
			);
			assert.throws(
				() => analyzeNgramRepetition("text", { unit: 123 }),
				Error,
				"Should reject numeric unit",
			);
		});

		it("throws Error for insufficient text length", () => {
			assert.throws(
				() => analyzeNgramRepetition("ab", { unit: "character", n: 5 }),
				Error,
				"Should reject text shorter than n",
			);
			assert.throws(
				() => analyzeNgramRepetition("one", { unit: "word", n: 3 }),
				Error,
				"Should reject insufficient words",
			);
		});
	});

	describe("mathematical properties", () => {
		it("ensures diversity ratio is between 0 and 1", () => {
			const texts = [
				"abcdefgh", // High diversity
				"aaaabbbb", // Medium diversity
				"aaaaaaaa", // Low diversity
			];

			for (const text of texts) {
				const result = analyzeNgramRepetition(text, {
					unit: "character",
					n: 2,
				});
				assert.ok(
					result.diversityRatio >= 0 && result.diversityRatio <= 1,
					"Diversity ratio should be between 0 and 1",
				);
			}
		});

		it("ensures repetition rate is between 0 and 1", () => {
			const texts = ["abcdefgh", "aaaabbbb", "aaaaaaaa"];

			for (const text of texts) {
				const result = analyzeNgramRepetition(text, {
					unit: "character",
					n: 2,
				});
				assert.ok(
					result.repetitionRate >= 0 && result.repetitionRate <= 1,
					"Repetition rate should be between 0 and 1",
				);
			}
		});

		it("verifies total equals unique when no repetition", () => {
			const text = "abcdefgh";
			const result = analyzeNgramRepetition(text, { unit: "character", n: 2 });

			assert.equal(
				result.totalNgrams,
				result.uniqueNgrams,
				"Total should equal unique when no repetition",
			);
			assert.equal(result.diversityRatio, 1, "Diversity should be 1");
			assert.equal(result.repetitionRate, 0, "Repetition rate should be 0");
		});

		it("verifies average frequency calculation", () => {
			const text = "abab"; // "ab", "ba", "ab" -> frequencies [2, 1]
			const result = analyzeNgramRepetition(text, { unit: "character", n: 2 });

			// Expected average: (2 + 1) / 2 = 1.5
			assert.equal(
				result.averageFrequency,
				1.5,
				"Should calculate correct average frequency",
			);
		});

		it("maintains consistency across different orderings", () => {
			const text1 = "abc def ghi";
			const text2 = "ghi abc def";

			const result1 = analyzeNgramRepetition(text1, { unit: "word", n: 2 });
			const result2 = analyzeNgramRepetition(text2, { unit: "word", n: 2 });

			// Different orderings should have same diversity (all unique)
			assert.equal(
				result1.diversityRatio,
				result2.diversityRatio,
				"Different orderings should have same diversity",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText = "The quick brown fox jumps over the lazy dog. ".repeat(
				50,
			);
			const start = performance.now();
			const result = analyzeNgramRepetition(mediumText, {
				unit: "word",
				n: 3,
			});
			const duration = performance.now() - start;

			assert.ok(duration < 50, "Should process medium text under 50ms");
			assert.ok(
				typeof result.diversityRatio === "number",
				"Should return valid result",
			);
		});

		it("handles large text volumes", () => {
			const largeText =
				"Various words creating diverse patterns and combinations. ".repeat(
					200,
				);
			const start = performance.now();
			const result = analyzeNgramRepetition(largeText, {
				unit: "character",
				n: 4,
			});
			const duration = performance.now() - start;

			assert.ok(duration < 200, "Should process large text under 200ms");
			assert.ok(
				typeof result.diversityRatio === "number",
				"Should return valid result",
			);
		});

		it("scales reasonably with n-gram size", () => {
			const text =
				"Sample text for performance testing with various words and patterns.";

			const start2 = performance.now();
			analyzeNgramRepetition(text, { unit: "character", n: 2 });
			const duration2 = performance.now() - start2;

			const start5 = performance.now();
			analyzeNgramRepetition(text, { unit: "character", n: 5 });
			const duration5 = performance.now() - start5;

			// Allow for some overhead but should scale reasonably
			assert.ok(
				duration5 < duration2 * 10,
				"Larger n-grams should not be dramatically slower",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes news article style", () => {
			const newsText = `
				Breaking news from the capital today. Government officials announced new policy changes.
				Economic indicators show positive trends in multiple sectors. Citizens react to developments.
			`;
			const result = analyzeNgramRepetition(newsText, { unit: "word", n: 2 });

			assert.ok(
				result.diversityRatio > 0.5,
				"News should have reasonable diversity",
			);
			assert.ok(
				typeof result.repetitionRate === "number",
				"Should return valid metrics",
			);
		});

		it("analyzes technical documentation", () => {
			const techText = `
				function calculateValue(input) {
					const result = input * 2;
					return result + Math.random();
				}
				// Function processes input data and returns calculated output
			`;
			const result = analyzeNgramRepetition(techText, {
				unit: "character",
				n: 3,
			});

			assert.ok(
				result.diversityRatio > 0.3,
				"Technical text should have moderate diversity",
			);
		});

		it("analyzes creative writing", () => {
			const creativeText = `
				Whispered secrets danced through moonlit gardens where forgotten dreams
				bloomed like impossible flowers. Their petals shimmered with stardust,
				carrying melodies from distant, unknown worlds beyond imagination.
			`;
			const result = analyzeNgramRepetition(creativeText, {
				unit: "word",
				n: 3,
			});

			assert.ok(
				result.diversityRatio > 0.7,
				"Creative writing should show high diversity",
			);
		});

		it("analyzes repetitive marketing copy", () => {
			const marketingText = `
				Best deals today! Get the best prices on best products.
				Best quality guaranteed. Best service available.
				Best choice for best results.
			`;
			const result = analyzeNgramRepetition(marketingText, {
				unit: "word",
				n: 2,
			});

			// Marketing copy may have unique bigrams but still show patterns
			assert.ok(
				typeof result.repetitionRate === "number",
				"Should return valid repetition rate",
			);
			assert.ok(
				result.diversityRatio >= 0,
				"Should return valid diversity ratio",
			);
		});
	});
});
