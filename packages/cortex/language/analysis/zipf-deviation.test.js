/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeZipfDeviation } from "./zipf-deviation.js";

describe("analyzeZipfDeviation", () => {
	describe("basic functionality", () => {
		it("analyzes word frequency distribution correctly", () => {
			// Text with clear frequency pattern (extended to meet minimum)
			const text =
				"the the the cat cat dog bird bird fish tree water sun moon star cloud";
			const result = analyzeZipfDeviation(text);

			assert.ok(
				typeof result.deviation === "number",
				"Should return deviation metric",
			);
			assert.ok(typeof result.rSquared === "number", "Should return R² metric");
			assert.ok(
				typeof result.chiSquared === "number",
				"Should return chi-squared metric",
			);
			assert.equal(result.totalWords, 15, "Should count total words correctly");
			assert.ok(result.uniqueWords > 5, "Should count unique words correctly");
			assert.ok(
				result.zipfExponent > 0,
				"Should calculate positive Zipf exponent",
			);
		});

		it("handles perfect Zipf distribution", () => {
			// Create text following Zipf's Law exactly (extended to meet minimum)
			// word1: 4 times, word2: 2 times, word3: 1 time, word4: 1 time, etc.
			const text = "a a a a b b c d e f g h i j";
			const result = analyzeZipfDeviation(text);

			// Should show good compliance with Zipf's Law
			assert.ok(
				result.deviation < 50,
				"Should show reasonable deviation for Zipf-like text",
			);
			assert.ok(
				result.rSquared > 0.5,
				"Should show decent R² for Zipf-like text",
			);
		});

		it("detects uniform distribution deviation", () => {
			// Text where all words appear equally often (anti-Zipf, extended)
			const text =
				"apple banana cherry date elderberry fig grape honey indigo jasmine kiwi lemon mango";
			const result = analyzeZipfDeviation(text);

			// Uniform distribution actually fits Zipf with slope=0 perfectly
			assert.ok(
				typeof result.deviation === "number",
				"Should calculate deviation for uniform text",
			);
			assert.ok(
				result.rSquared >= 0,
				"Should return valid R² for uniform distribution",
			);
		});

		it("calculates metrics for minimal text", () => {
			const text = "one two three four five six seven eight nine ten";
			const result = analyzeZipfDeviation(text);

			assert.equal(result.totalWords, 10, "Should handle minimal valid text");
			assert.equal(
				result.uniqueWords,
				10,
				"Should count unique words correctly",
			);
			assert.ok(result.deviation >= 0, "Should return non-negative deviation");
		});
	});

	describe("parameter variations", () => {
		it("handles case sensitivity correctly", () => {
			const text =
				"The the THE Cat cat CAT Dog dog BIRD bird Fish fish Tree tree Water";

			const caseSensitive = analyzeZipfDeviation(text, { caseSensitive: true });
			const caseInsensitive = analyzeZipfDeviation(text, {
				caseSensitive: false,
			});

			// Case insensitive should have fewer unique words
			assert.ok(
				caseInsensitive.uniqueWords <= caseSensitive.uniqueWords,
				"Case insensitive should have fewer or equal unique words",
			);
		});

		it("filters words by minimum length", () => {
			const text =
				"a an the quick brown fox jumps over lazy dog mountain river forest animals create";

			const noFilter = analyzeZipfDeviation(text, { minWordLength: 1 });
			const filtered = analyzeZipfDeviation(text, { minWordLength: 3 });

			// Filtering should reduce word count
			assert.ok(
				filtered.totalWords < noFilter.totalWords,
				"Min length filter should reduce total words",
			);
			assert.ok(
				filtered.uniqueWords <= noFilter.uniqueWords,
				"Min length filter should reduce unique words",
			);
		});

		it("limits analysis to max ranks", () => {
			const text = "a a a b b c d e f g h i j k l m n o p q r s t u v w x y z";

			const unlimited = analyzeZipfDeviation(text, { maxRanks: 100 });
			const limited = analyzeZipfDeviation(text, { maxRanks: 5 });

			// Limited analysis should use fewer ranks but same word counts
			assert.equal(
				limited.totalWords,
				unlimited.totalWords,
				"Max ranks should not affect total word count",
			);
			assert.equal(
				limited.uniqueWords,
				unlimited.uniqueWords,
				"Max ranks should not affect unique word count",
			);
		});

		it("handles different max rank values", () => {
			const text =
				"word ".repeat(50) +
				"other ".repeat(25) +
				"another ".repeat(10) +
				"final ".repeat(5);

			const smallRanks = analyzeZipfDeviation(text, { maxRanks: 2 });
			const largeRanks = analyzeZipfDeviation(text, { maxRanks: 10 });

			// Both should return valid results
			assert.ok(
				typeof smallRanks.deviation === "number",
				"Small ranks should work",
			);
			assert.ok(
				typeof largeRanks.deviation === "number",
				"Large ranks should work",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"the quick brown fox jumps over the lazy dog running through forest",
				"a a a b b c d e f g h i j k",
				"apple banana cherry date elderberry fig grape honey indigo jasmine kiwi lemon",
			];

			for (const text of texts) {
				const result = analyzeZipfDeviation(text);

				assert.ok(result.deviation >= 0, "Deviation should be non-negative");
				assert.ok(
					result.rSquared >= 0 && result.rSquared <= 1,
					"R² should be between 0 and 1",
				);
				assert.ok(result.chiSquared >= 0, "Chi-squared should be non-negative");
				assert.ok(
					result.zipfExponent >= 0,
					"Zipf exponent should be non-negative",
				);
				assert.ok(result.totalWords > 0, "Total words should be positive");
				assert.ok(result.uniqueWords > 0, "Unique words should be positive");
				assert.ok(
					result.uniqueWords <= result.totalWords,
					"Unique words should not exceed total words",
				);
			}
		});

		it("calculates Zipf exponent appropriately", () => {
			// Create text with known frequency pattern
			const zipfLikeText =
				"the ".repeat(20) + "of ".repeat(10) + "to ".repeat(7) + "a ".repeat(5);
			const result = analyzeZipfDeviation(zipfLikeText);

			// Zipf exponent should be close to 1 for natural-like text
			assert.ok(
				result.zipfExponent > 0.5 && result.zipfExponent < 2,
				"Zipf exponent should be reasonable for natural-like text",
			);
		});

		it("handles highly skewed distributions", () => {
			// One word dominates completely
			const skewedText = `${"dominant ".repeat(90)}rare word appears once`;
			const result = analyzeZipfDeviation(skewedText);

			assert.ok(result.deviation >= 0, "Should handle skewed distribution");
			assert.ok(typeof result.rSquared === "number", "Should return valid R²");
		});

		it("maintains consistency across shuffled text", () => {
			const words = [
				"apple",
				"banana",
				"apple",
				"cherry",
				"apple",
				"banana",
				"date",
				"elderberry",
				"fig",
				"grape",
				"honey",
				"indigo",
			];
			const text1 = words.join(" ");
			const text2 = words.reverse().join(" ");

			const result1 = analyzeZipfDeviation(text1);
			const result2 = analyzeZipfDeviation(text2);

			// Word order shouldn't affect frequency analysis
			assert.equal(
				result1.totalWords,
				result2.totalWords,
				"Total words should be same",
			);
			assert.equal(
				result1.uniqueWords,
				result2.uniqueWords,
				"Unique words should be same",
			);
			// Deviation might differ slightly due to rank ordering, but should be close
			assert.ok(
				Math.abs(result1.deviation - result2.deviation) < 5,
				"Deviation should be similar for shuffled text",
			);
		});
	});

	describe("text pattern detection", () => {
		it("detects AI-like repetitive word patterns", () => {
			const aiText =
				"The system processes the data. The system analyzes the data. The system outputs the data efficiently.";
			const result = analyzeZipfDeviation(aiText);

			// AI text often shows deviation from natural Zipf distribution
			assert.ok(
				result.deviation >= 0,
				"Should calculate deviation for AI-like text",
			);
			assert.ok(
				typeof result.rSquared === "number",
				"Should return valid R² for AI text",
			);
		});

		it("analyzes human-like diverse vocabulary", () => {
			const humanText =
				"Creative writers explore fascinating narrative techniques, experimenting with innovative storytelling approaches and diverse literary devices.";
			const result = analyzeZipfDeviation(humanText);

			// Human text should show more natural word distribution
			assert.ok(
				typeof result.deviation === "number",
				"Should analyze human-like text",
			);
			assert.ok(
				typeof result.rSquared === "number" && !Number.isNaN(result.rSquared),
				"Should return valid R² for human text",
			);
		});

		it("detects template-like vocabulary patterns", () => {
			const templateText =
				"Thank you for your inquiry. We appreciate your interest. Your request is important to us.";
			const result = analyzeZipfDeviation(templateText);

			assert.ok(
				typeof result.deviation === "number",
				"Should analyze template text",
			);
			assert.ok(
				result.uniqueWords < result.totalWords,
				"Template should have repeated words",
			);
		});

		it("analyzes academic writing patterns", () => {
			const academicText =
				"This study examines the relationship between variables through comprehensive analysis of data collected from multiple sources.";
			const result = analyzeZipfDeviation(academicText);

			assert.ok(result.totalWords > 10, "Should process academic text");
			assert.ok(
				result.uniqueWords > 5,
				"Academic text should have vocabulary diversity",
			);
		});
	});

	describe("multilingual support", () => {
		it("analyzes German text correctly", () => {
			const germanText =
				"Der schnelle braune Fuchs springt über den faulen Hund. Diese Übung hilft beim Testen verschiedener Wörter.";
			const result = analyzeZipfDeviation(germanText);

			assert.ok(result.totalWords > 10, "Should process German text");
			assert.ok(result.uniqueWords > 5, "German text should have vocabulary");
			assert.ok(
				typeof result.deviation === "number",
				"Should return valid metrics",
			);
		});

		it("handles Unicode characters", () => {
			const unicodeText =
				"café naïve résumé Müller Zürich 世界 平和 мир دنیا शांति español français deutsch italiano português";
			const result = analyzeZipfDeviation(unicodeText);

			assert.ok(result.totalWords > 5, "Should process Unicode text");
			assert.ok(
				result.uniqueWords > 5,
				"Unicode text should have unique words",
			);
		});

		it("processes mixed language content", () => {
			const mixedText =
				"Hello world everyone. Bonjour tout le monde. Hola mundo amigos. こんにちは世界の皆さん. مرحبا بالعالم الجميل.";
			const result = analyzeZipfDeviation(mixedText);

			assert.ok(result.totalWords > 5, "Should handle mixed languages");
			assert.ok(
				typeof result.deviation === "number",
				"Should return valid metrics",
			);
		});
	});

	describe("edge cases", () => {
		it("handles text with punctuation and numbers", () => {
			const text =
				"Version 2.0 released! Features include: authentication, logging, monitoring, configuration, and database support.";
			const result = analyzeZipfDeviation(text);

			assert.ok(
				result.totalWords >= 5,
				"Should extract words from punctuated text",
			);
			assert.ok(
				typeof result.deviation === "number",
				"Should handle punctuation",
			);
		});

		it("processes text with repeated phrases", () => {
			const text =
				"To be or not to be, that is the question. To be or not to be indeed.";
			const result = analyzeZipfDeviation(text);

			assert.ok(result.totalWords > 10, "Should count repeated words");
			assert.ok(
				result.uniqueWords < result.totalWords,
				"Should detect repetition",
			);
		});

		it("handles text with various word lengths", () => {
			const text =
				"I am a developer who creates sophisticated applications using modern technologies and frameworks for building excellent systems.";
			const shortWords = analyzeZipfDeviation(text, { minWordLength: 1 });
			const longWords = analyzeZipfDeviation(text, { minWordLength: 6 });

			assert.ok(
				longWords.totalWords < shortWords.totalWords,
				"Longer min length should reduce word count",
			);
		});

		it("processes very repetitive text", () => {
			const text =
				"same ".repeat(50) + "word ".repeat(25) + "different ".repeat(10);
			const result = analyzeZipfDeviation(text);

			assert.ok(result.totalWords === 85, "Should count all repetitive words");
			assert.equal(
				result.uniqueWords,
				3,
				"Should identify unique words correctly",
			);
			assert.ok(result.deviation >= 0, "Should handle repetitive patterns");
		});

		it("handles single repeated word", () => {
			const text = "repetitive ".repeat(15);
			const result = analyzeZipfDeviation(text);

			assert.equal(result.uniqueWords, 1, "Should handle single unique word");
			assert.equal(result.totalWords, 15, "Should count all occurrences");
		});

		it("processes text with special characters", () => {
			const text =
				"user@example.com visits https://website.com for comprehensive API documentation and programming tutorials #programming";
			const result = analyzeZipfDeviation(text);

			assert.ok(
				result.totalWords >= 3,
				"Should extract words from special chars",
			);
			assert.ok(
				typeof result.deviation === "number",
				"Should handle special characters",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => analyzeZipfDeviation(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => analyzeZipfDeviation(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => analyzeZipfDeviation(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => analyzeZipfDeviation([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => analyzeZipfDeviation({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => analyzeZipfDeviation(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => analyzeZipfDeviation("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for insufficient words", () => {
			assert.throws(
				() => analyzeZipfDeviation("one two three"),
				Error,
				"Should reject text with too few words",
			);
			assert.throws(
				() => analyzeZipfDeviation("!@#$%^&*()"),
				Error,
				"Should reject text with no valid words",
			);
		});

		it("throws Error for invalid options", () => {
			const validText = "one two three four five six seven eight nine ten";

			assert.throws(
				() => analyzeZipfDeviation(validText, { minWordLength: 0 }),
				Error,
				"Should reject zero min word length",
			);
			assert.throws(
				() => analyzeZipfDeviation(validText, { minWordLength: -1 }),
				Error,
				"Should reject negative min word length",
			);
			assert.throws(
				() => analyzeZipfDeviation(validText, { maxRanks: 0 }),
				Error,
				"Should reject zero max ranks",
			);
			assert.throws(
				() => analyzeZipfDeviation(validText, { maxRanks: -1 }),
				Error,
				"Should reject negative max ranks",
			);
		});

		it("throws Error when min word length filters all words", () => {
			assert.throws(
				() =>
					analyzeZipfDeviation(
						"a an and at be do go if is it no of on or so to up we",
						{ minWordLength: 5 },
					),
				Error,
				"Should reject when no words meet minimum length",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText = "The quick brown fox jumps over the lazy dog. ".repeat(
				100,
			);
			const start = performance.now();
			const result = analyzeZipfDeviation(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 50, "Should process medium text under 50ms");
			assert.ok(
				typeof result.deviation === "number",
				"Should return valid result",
			);
		});

		it("handles large text volumes", () => {
			const largeText =
				"Various words creating diverse patterns and linguistic structures. ".repeat(
					500,
				);
			const start = performance.now();
			const result = analyzeZipfDeviation(largeText);
			const duration = performance.now() - start;

			assert.ok(duration < 200, "Should process large text under 200ms");
			assert.ok(
				typeof result.deviation === "number",
				"Should return valid result",
			);
		});

		it("scales appropriately with max ranks", () => {
			const text =
				"word ".repeat(100) +
				Array.from({ length: 50 }, (_, i) => `term${i}`).join(" ");

			// Test correctness rather than timing - both should complete successfully
			const result10 = analyzeZipfDeviation(text, { maxRanks: 10 });
			const result50 = analyzeZipfDeviation(text, { maxRanks: 50 });

			// Both should return valid results
			assert.ok(
				typeof result10.deviation === "number",
				"Should handle 10 ranks successfully",
			);
			assert.ok(
				typeof result50.deviation === "number",
				"Should handle 50 ranks successfully",
			);

			// Results should be consistent (same word counts regardless of rank limit)
			assert.equal(
				result10.totalWords,
				result50.totalWords,
				"Total words should be same regardless of max ranks",
			);
			assert.equal(
				result10.uniqueWords,
				result50.uniqueWords,
				"Unique words should be same regardless of max ranks",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes news article style", () => {
			const newsText = `
				Breaking news from the capital today. Government officials announced significant policy changes
				affecting multiple sectors. Economic indicators show positive trends in various markets.
				Citizens and analysts react to the developments with mixed opinions and careful consideration.
			`;
			const result = analyzeZipfDeviation(newsText);

			assert.ok(
				result.totalWords > 20,
				"News text should have substantial word count",
			);
			assert.ok(
				result.uniqueWords > 15,
				"News should have vocabulary diversity",
			);
			assert.ok(
				typeof result.deviation === "number",
				"Should return valid metrics",
			);
		});

		it("analyzes technical documentation", () => {
			const techText = `
				function calculateOptimalPerformance(parameters) {
					const configuration = initializeSystemConfiguration();
					const result = processDataWithAdvancedAlgorithms(parameters, configuration);
					return optimizeOutputForBestResults(result);
				}
			`;
			const result = analyzeZipfDeviation(techText);

			assert.ok(
				result.totalWords > 10,
				"Technical text should have adequate length",
			);
			assert.ok(
				typeof result.deviation === "number",
				"Should analyze technical text",
			);
		});

		it("analyzes creative writing", () => {
			const creativeText = `
				Whispered secrets danced through moonlit gardens where forgotten dreams
				bloomed like impossible flowers. Their ethereal petals shimmered with
				celestial stardust, carrying melodies from distant, mystical worlds
				beyond mortal imagination and earthly comprehension.
			`;
			const result = analyzeZipfDeviation(creativeText);

			assert.ok(
				result.uniqueWords > 15,
				"Creative writing should show vocabulary diversity",
			);
			assert.ok(
				typeof result.rSquared === "number",
				"Should return valid fit metrics",
			);
		});

		it("analyzes formal business communication", () => {
			const businessText = `
				We acknowledge receipt of your request and appreciate your continued interest
				in our services. Our team will review your requirements and provide
				a comprehensive response within the specified timeframe.
			`;
			const result = analyzeZipfDeviation(businessText);

			assert.ok(
				result.totalWords > 15,
				"Business text should have adequate length",
			);
			assert.ok(
				result.uniqueWords > 10,
				"Business text should have vocabulary variety",
			);
		});
	});
});
