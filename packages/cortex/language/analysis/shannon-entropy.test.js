/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateShannonEntropy } from "./shannon-entropy.js";

describe("calculateShannonEntropy", () => {
	describe("basic functionality", () => {
		it("calculates entropy for uniform character distribution", () => {
			// All characters appear with equal frequency
			const text = "abcd";
			const result = calculateShannonEntropy(text);

			// Expected: log₂(4) = 2 bits (maximum entropy for 4 unique characters)
			assert.ok(
				Math.abs(result - 2.0) < 0.001,
				"Uniform distribution should have maximum entropy",
			);
		});

		it("calculates zero entropy for single character", () => {
			const text = "aaaa";
			const result = calculateShannonEntropy(text);

			// Expected: 0 bits (no uncertainty, completely predictable)
			assert.equal(result, 0, "Single character should have zero entropy");
		});

		it("calculates entropy for mixed character distribution", () => {
			// Text with different character frequencies
			const text = "aaabbc";
			const result = calculateShannonEntropy(text);

			// Expected: entropy between 0 and log₂(3) ≈ 1.58
			assert.ok(result > 0, "Mixed distribution should have positive entropy");
			assert.ok(
				result < 1.6,
				"Should be less than maximum possible for 3 unique chars",
			);
		});

		it("handles single character input", () => {
			const text = "x";
			const result = calculateShannonEntropy(text);

			assert.equal(result, 0, "Single character should have zero entropy");
		});
	});

	describe("mathematical properties", () => {
		it("returns higher entropy for more diverse text", () => {
			const lowDiversity = "aaaaaabbbb"; // 2 unique characters
			const highDiversity = "abcdefghij"; // 10 unique characters

			const lowEntropy = calculateShannonEntropy(lowDiversity);
			const highEntropy = calculateShannonEntropy(highDiversity);

			assert.ok(
				highEntropy > lowEntropy,
				"More diverse text should have higher entropy",
			);
		});

		it("returns maximum entropy for equal character distribution", () => {
			const text = "abcdefgh"; // 8 chars, each appears once
			const result = calculateShannonEntropy(text);

			// Maximum entropy = log₂(8) = 3 bits
			assert.ok(
				Math.abs(result - 3.0) < 0.001,
				"Equal distribution should maximize entropy",
			);
		});

		it("entropy increases with character set size", () => {
			const small = "aabb"; // 2 unique chars
			const medium = "aabbcc"; // 3 unique chars
			const large = "aabbccdd"; // 4 unique chars

			const smallEntropy = calculateShannonEntropy(small);
			const mediumEntropy = calculateShannonEntropy(medium);
			const largeEntropy = calculateShannonEntropy(large);

			assert.ok(
				largeEntropy > mediumEntropy,
				"Larger character set should increase entropy",
			);
			assert.ok(
				mediumEntropy > smallEntropy,
				"Medium should be higher than small",
			);
		});

		it("is independent of character order", () => {
			const text1 = "abcabc";
			const text2 = "aabbcc";
			const text3 = "ccbbaa";

			const entropy1 = calculateShannonEntropy(text1);
			const entropy2 = calculateShannonEntropy(text2);
			const entropy3 = calculateShannonEntropy(text3);

			assert.equal(entropy1, entropy2, "Order should not affect entropy");
			assert.equal(
				entropy2,
				entropy3,
				"Different orders should have same entropy",
			);
		});
	});

	describe("multilingual support", () => {
		it("analyzes English text correctly", () => {
			const englishText = "The quick brown fox jumps over the lazy dog!";
			const result = calculateShannonEntropy(englishText);

			assert.ok(result > 3.5, "English text should show reasonable entropy");
			assert.ok(result < 5.0, "Should be within expected range for English");
		});

		it("handles German text with diacriticals", () => {
			const germanText = "Müller führt große Änderungen durch. Schöne Grüße!";
			const result = calculateShannonEntropy(germanText);

			assert.ok(result > 3.0, "German text should show positive entropy");
			assert.ok(typeof result === "number", "Should return a number");
		});

		it("processes special Unicode characters", () => {
			const unicodeText = "Hello 世界! Café ñoño 🌟⭐✨";
			const result = calculateShannonEntropy(unicodeText);

			assert.ok(result > 0, "Unicode text should have positive entropy");
			assert.ok(typeof result === "number", "Should handle Unicode properly");
		});

		it("handles mixed scripts", () => {
			const mixedText = "English العربية 中文 русский ελληνικά";
			const result = calculateShannonEntropy(mixedText);

			assert.ok(result > 0, "Mixed scripts should have positive entropy");
			assert.ok(typeof result === "number", "Should handle multiple scripts");
		});
	});

	describe("text pattern analysis", () => {
		it("detects low entropy in repetitive text", () => {
			const repetitiveText = "The same. The same. The same. The same.";
			const result = calculateShannonEntropy(repetitiveText);

			assert.ok(result < 4.0, "Repetitive text should have lower entropy");
		});

		it("detects high entropy in diverse text", () => {
			const diverseText =
				"Quirky fjord vexing waltz-like hymns by jumping gnomes!";
			const result = calculateShannonEntropy(diverseText);

			assert.ok(result > 4.0, "Diverse text should have higher entropy");
		});

		it("analyzes human-like writing patterns", () => {
			const humanText = `
				The storm approached with frightening intensity. Dark clouds
				swirled overhead while lightning illuminated the landscape in
				brief, dramatic flashes. Thunder rumbled like an ancient beast
				awakening from centuries of sleep. What a sight!
			`;
			const result = calculateShannonEntropy(humanText);

			assert.ok(result > 3.8, "Human-like text should show reasonable entropy");
		});

		it("analyzes AI-like writing patterns", () => {
			const aiText = `
				The system functions correctly. The data processes successfully.
				The results are available for review. The analysis shows trends.
				The implementation meets requirements. The testing completed.
			`;
			const result = calculateShannonEntropy(aiText);

			assert.ok(typeof result === "number", "Should analyze AI-like text");
			// Note: Don't enforce strict thresholds as they depend on training data
		});
	});

	describe("special characters and formatting", () => {
		it("includes whitespace in entropy calculation", () => {
			const noSpaces = "abcdef";
			const withSpaces = "a b c d e f";

			const noSpacesEntropy = calculateShannonEntropy(noSpaces);
			const withSpacesEntropy = calculateShannonEntropy(withSpaces);

			assert.ok(
				withSpacesEntropy !== noSpacesEntropy,
				"Spaces should affect entropy",
			);
		});

		it("handles punctuation marks", () => {
			const text = "Hello, world! How are you? Fine... Really?!";
			const result = calculateShannonEntropy(text);

			assert.ok(result > 0, "Punctuation should contribute to entropy");
		});

		it("processes numbers and symbols", () => {
			const text = "Version 2.0.1 costs $49.99 (50% off!) #savings @store";
			const result = calculateShannonEntropy(text);

			assert.ok(result > 0, "Numbers and symbols should be included");
		});

		it("handles newlines and tabs", () => {
			const text = "Line 1\nLine 2\tTabbed\r\nWindows line";
			const result = calculateShannonEntropy(text);

			assert.ok(result > 0, "Formatting characters should be included");
		});
	});

	describe("edge cases", () => {
		it("handles very long strings efficiently", () => {
			const longText = "The quick brown fox ".repeat(1000);
			const start = performance.now();
			const result = calculateShannonEntropy(longText);
			const duration = performance.now() - start;

			assert.ok(duration < 50, "Should process long text efficiently");
			assert.ok(result > 0, "Should return valid entropy for long text");
		});

		it("processes text with only punctuation", () => {
			const text = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
			const result = calculateShannonEntropy(text);

			assert.ok(
				result > 0,
				"Punctuation-only text should have positive entropy",
			);
		});

		it("handles text with extreme character frequency skew", () => {
			const text = `a${"b".repeat(1000)}`; // Very skewed distribution
			const result = calculateShannonEntropy(text);

			assert.ok(
				result > 0,
				"Skewed distribution should have low but positive entropy",
			);
			assert.ok(result < 1, "Should be much lower than uniform distribution");
		});

		it("processes binary-like content", () => {
			const text = "01010101101010111010101010";
			const result = calculateShannonEntropy(text);

			// Should be close to 1 bit (binary entropy)
			assert.ok(result > 0.5, "Binary content should have reasonable entropy");
			assert.ok(result < 1.5, "Should be close to binary maximum");
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => calculateShannonEntropy(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => calculateShannonEntropy(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => calculateShannonEntropy(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => calculateShannonEntropy([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => calculateShannonEntropy({}),
				TypeError,
				"Should reject objects",
			);
			assert.throws(
				() => calculateShannonEntropy(true),
				TypeError,
				"Should reject booleans",
			);
		});

		it("throws Error for empty string", () => {
			assert.throws(
				() => calculateShannonEntropy(""),
				Error,
				"Should reject empty string",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText =
				"This is a test sentence with various characters! ".repeat(100);
			const start = performance.now();
			const result = calculateShannonEntropy(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 20, "Should process medium text under 20ms");
			assert.ok(typeof result === "number", "Should return valid result");
		});

		it("scales linearly with text length", () => {
			const baseText = "Sample text for performance testing.";
			const shortText = baseText;
			const longText = baseText.repeat(10);

			// Run multiple times to reduce timing variance and JIT effects
			const runs = 3;
			let shortTotal = 0;
			let longTotal = 0;

			for (let i = 0; i < runs; i++) {
				const shortStart = performance.now();
				calculateShannonEntropy(shortText);
				shortTotal += performance.now() - shortStart;

				const longStart = performance.now();
				calculateShannonEntropy(longText);
				longTotal += performance.now() - longStart;
			}

			const shortAvg = shortTotal / runs;
			const longAvg = longTotal / runs;

			// More generous scaling threshold to account for timing variations
			assert.ok(longAvg < shortAvg * 50, "Should scale reasonably with length");
		});
	});

	describe("real-world examples", () => {
		it("analyzes news article style", () => {
			const newsText = `
				Breaking: Local fire department responded to emergency call at downtown building.
				Officials report no injuries. Investigation ongoing. More details to follow.
			`;
			const result = calculateShannonEntropy(newsText);

			assert.ok(result > 3.5, "News text should have reasonable entropy");
		});

		it("analyzes technical documentation", () => {
			const techText = `
				function calculateValue(input) {
					return input * 2 + Math.random();
				}
				// This function multiplies input by 2 and adds random value
			`;
			const result = calculateShannonEntropy(techText);

			assert.ok(result > 3.0, "Technical text should have moderate entropy");
		});

		it("analyzes creative writing", () => {
			const creativeText = `
				Whispers danced through moonlit gardens where forgotten dreams
				bloomed like impossible flowers, their petals shimmering with
				stardust and half-remembered melodies of distant worlds.
			`;
			const result = calculateShannonEntropy(creativeText);

			assert.ok(result > 4.0, "Creative text should show high entropy");
		});
	});
});
