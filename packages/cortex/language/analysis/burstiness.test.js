/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBurstiness } from "./burstiness.js";

describe("calculateBurstiness", () => {
	describe("basic functionality", () => {
		it("calculates burstiness for varied sentence lengths", () => {
			// Text with high variation: 1, 4, 2 words per sentence
			const text = "Go. This is four words. Two words.";
			const result = calculateBurstiness(text);

			// Expected: mean = 2.33, std = 1.247, burstiness = 0.535
			assert.ok(result > 0.5, "High variation should produce high burstiness");
			assert.ok(result < 0.6, "Result should be within expected range");
		});

		it("calculates low burstiness for uniform sentence lengths", () => {
			// Text with low variation: 3, 3, 3 words per sentence
			const text = "This is uniform. This is uniform. This is uniform.";
			const result = calculateBurstiness(text);

			// Expected: mean = 3, std = 0, burstiness = 0
			assert.equal(result, 0, "Uniform sentences should have zero burstiness");
		});

		it("handles minimal variation correctly", () => {
			// Text with slight variation: 2, 3 words per sentence
			const text = "Two words. Three word sentence.";
			const result = calculateBurstiness(text);

			// Expected: mean = 2.5, std = 0.5, burstiness = 0.2
			assert.ok(result > 0.15, "Should detect minimal variation");
			assert.ok(result < 0.25, "Should be within expected range");
		});
	});

	describe("multilingual support", () => {
		it("analyzes German text correctly", () => {
			const germanText =
				"Hallo! Das ist ein längerer deutscher Satz mit vielen Wörtern. Kurz. Ein sehr komplexer Satz mit unterschiedlicher Struktur und Länge.";
			const result = calculateBurstiness(germanText);

			assert.ok(
				result > 0.4,
				"German text with variation should show high burstiness",
			);
			assert.ok(typeof result === "number", "Should return a number");
		});

		it("handles German punctuation patterns", () => {
			const germanText = "Das ist ein Satz… Ein anderer Satz! Noch ein Satz?";
			const result = calculateBurstiness(germanText);

			assert.ok(result >= 0, "Should handle German ellipsis and punctuation");
			assert.ok(typeof result === "number", "Should return a number");
		});

		it("processes mixed language content", () => {
			const mixedText =
				"Hello world! Das ist deutsch. This is English again. Auf Wiedersehen!";
			const result = calculateBurstiness(mixedText);

			assert.ok(typeof result === "number", "Should handle mixed languages");
			assert.ok(result >= 0, "Should return valid burstiness value");
		});
	});

	describe("sentence parsing", () => {
		it("handles multiple punctuation marks", () => {
			const text = "What?! Yes!!! This is... interesting.";
			const result = calculateBurstiness(text);

			assert.ok(typeof result === "number", "Should parse complex punctuation");
		});

		it("processes proper sentence boundaries", () => {
			const text =
				"First sentence. Second sentence is much longer than the first. Short.";
			const result = calculateBurstiness(text);

			assert.ok(result > 0, "Should handle proper sentence boundaries");
		});

		it("handles sentences with extra whitespace", () => {
			const text = "  Sentence one.    Sentence two is longer.   Short.  ";
			const result = calculateBurstiness(text);

			assert.ok(result > 0, "Should handle irregular spacing");
		});

		it("processes newlines and formatting", () => {
			const text = "First sentence.\n\nSecond sentence is longer.\nShort.";
			const result = calculateBurstiness(text);

			assert.ok(result > 0, "Should handle newlines correctly");
		});
	});

	describe("realistic text samples", () => {
		it("detects human-like writing patterns", () => {
			const humanText = `
				The storm was approaching. Dark clouds gathered ominously on the horizon,
				casting long shadows across the landscape. Lightning flashed. Thunder
				rumbled in the distance like an angry giant awakening from centuries of
				slumber. Rain began to fall, slowly at first, then with increasing intensity
				until it became a torrential downpour that transformed the quiet street
				into a raging river. Safe!
			`;
			const result = calculateBurstiness(humanText);

			assert.ok(result > 0.5, "Human-like text should show high burstiness");
		});

		it("detects AI-like writing patterns", () => {
			const aiText = `
				The system is functioning correctly. The data has been processed successfully.
				The results are now available for review. The analysis shows positive trends.
				The implementation meets all specified requirements. The testing phase has
				been completed without issues.
			`;
			const result = calculateBurstiness(aiText);

			assert.ok(result < 0.3, "AI-like text should show low burstiness");
		});

		it("analyzes academic writing style", () => {
			const academicText = `
				This study examines the relationship between sentence variation and text authenticity.
				Previous research has shown significant differences. The methodology involved
				statistical analysis of multiple text samples. Results indicate clear patterns.
				Further investigation is needed to validate these preliminary findings across
				different domains and languages.
			`;
			const result = calculateBurstiness(academicText);

			assert.ok(typeof result === "number", "Should analyze academic text");
			assert.ok(result >= 0, "Should return valid result");
		});
	});

	describe("edge cases", () => {
		it("handles single word sentences", () => {
			const text = "Yes. No. Maybe.";
			const result = calculateBurstiness(text);

			assert.equal(
				result,
				0,
				"Identical single-word sentences should have zero burstiness",
			);
		});

		it("processes very long sentences", () => {
			const longSentence =
				"This is an extremely long sentence with many words that goes on and on and contains various clauses and phrases that make it quite lengthy and complex to parse but should still be handled correctly by the algorithm.";
			const text = `Short. ${longSentence} Medium length sentence.`;
			const result = calculateBurstiness(text);

			assert.ok(
				result > 1,
				"High variation with long sentences should show very high burstiness",
			);
		});

		it("handles text with only punctuation sentences", () => {
			const text = "!!! ??? ...";

			assert.throws(
				() => calculateBurstiness(text),
				Error,
				"Punctuation-only sentences should throw error",
			);
		});

		it("processes numbers and special characters", () => {
			const text =
				"Version 2.0 released. The update includes 15 new features and 3 bug fixes. Performance improved by 25%.";
			const result = calculateBurstiness(text);

			assert.ok(
				typeof result === "number",
				"Should handle numbers and special characters",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => calculateBurstiness(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => calculateBurstiness(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => calculateBurstiness(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => calculateBurstiness([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => calculateBurstiness({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => calculateBurstiness(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => calculateBurstiness("   "),
				Error,
				"Should reject whitespace-only",
			);
			assert.throws(
				() => calculateBurstiness("\n\t"),
				Error,
				"Should reject formatting-only",
			);
		});

		it("throws Error for insufficient sentences", () => {
			assert.throws(
				() => calculateBurstiness("Single sentence."),
				Error,
				"Should reject single sentence",
			);
			assert.throws(
				() => calculateBurstiness("Just words without punctuation"),
				Error,
				"Should reject no sentences",
			);
		});

		it("throws Error for sentences without words", () => {
			assert.throws(
				() => calculateBurstiness("! ?"),
				Error,
				"Should reject punctuation-only sentences",
			);
			assert.throws(
				() => calculateBurstiness(". ."),
				Error,
				"Should reject empty sentences",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns non-negative values", () => {
			const text = "First sentence. Second sentence is different. Third.";
			const result = calculateBurstiness(text);

			assert.ok(result >= 0, "Burstiness should never be negative");
		});

		it("increases with greater variation", () => {
			const lowVariation =
				"Three words here. Three words there. Three words everywhere.";
			const highVariation =
				"One. This sentence has many more words than the others. Two.";

			const lowResult = calculateBurstiness(lowVariation);
			const highResult = calculateBurstiness(highVariation);

			assert.ok(
				highResult > lowResult,
				"Higher variation should produce higher burstiness",
			);
		});

		it("remains stable with text order changes", () => {
			const text1 = "Short. This is a longer sentence. Medium length.";
			const text2 = "This is a longer sentence. Short. Medium length.";

			const result1 = calculateBurstiness(text1);
			const result2 = calculateBurstiness(text2);

			assert.equal(
				result1,
				result2,
				"Order should not affect burstiness calculation",
			);
		});

		it("scales appropriately with text length", () => {
			const shortText = "One word. Two words here. Three words in sentence.";
			const longText = `${shortText} ${shortText} ${shortText}`;

			const shortResult = calculateBurstiness(shortText);
			const longResult = calculateBurstiness(longText);

			// Results should be identical since pattern repeats
			assert.equal(
				shortResult,
				longResult,
				"Repetitive patterns should maintain same burstiness",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText = `${"This is a sentence. ".repeat(100)}Different length sentence here.`;
			const start = performance.now();
			const result = calculateBurstiness(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 10, "Should process medium text under 10ms");
			assert.ok(typeof result === "number", "Should return valid result");
		});

		it("handles large text volumes", () => {
			const largeText =
				"Sentence with multiple words here. Short. Medium length sentence. ".repeat(
					1000,
				);
			const start = performance.now();
			const result = calculateBurstiness(largeText);
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should process large text under 100ms");
			assert.ok(typeof result === "number", "Should return valid result");
		});
	});
});
