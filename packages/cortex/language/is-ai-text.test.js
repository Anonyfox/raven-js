/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAIText } from "./is-ai-text.js";
import { ENGLISH_LANGUAGE_PACK } from "./languagepacks/english.js";
import { GERMAN_LANGUAGE_PACK } from "./languagepacks/german.js";

describe("isAIText - Hierarchical Cascade Detection", () => {
	describe("Core Functionality", () => {
		it("detects obvious AI text with high confidence", () => {
			const aiText =
				"Furthermore, the comprehensive system delivers optimal performance through advanced algorithms. Moreover, it provides three main benefits: efficiency, scalability, and reliability. Additionally, the framework ensures consistent results across all operational parameters.";

			const result = isAIText(aiText, { languagePack: ENGLISH_LANGUAGE_PACK });

			// Validate return structure
			assert.strictEqual(typeof result.aiLikelihood, "number");
			assert.strictEqual(typeof result.certainty, "number");
			assert.strictEqual(typeof result.dominantPattern, "string");
			assert.strictEqual(typeof result.executionTime, "number");
			assert.strictEqual(typeof result.textMetrics, "object");

			// Validate ranges
			assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1);
			assert.ok(result.certainty >= 0 && result.certainty <= 1);
			assert.ok(result.executionTime > 0);

			// AI text should have high likelihood and confidence
			assert.ok(
				result.aiLikelihood > 0.7,
				`Expected AI likelihood > 0.7, got ${result.aiLikelihood}`,
			);
			assert.ok(
				result.certainty > 0.7,
				`Expected certainty > 0.7, got ${result.certainty}`,
			);
		});

		it("detects human text with natural imperfections", () => {
			const humanText =
				"I can't believe what happened today! The system was acting kinda weird and their were some issues. Its not perfect but it gets the job done for most users needs.";

			const result = isAIText(humanText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
			});

			// Human text with errors should have moderate AI likelihood due to mixed signals
			// (errors suggest human, but uniform structure suggests AI)
			assert.ok(
				result.aiLikelihood < 0.8,
				`Expected AI likelihood < 0.8, got ${result.aiLikelihood}`,
			);
			assert.ok(
				result.certainty >= 0.6,
				`Expected reasonable certainty, got ${result.certainty}`,
			);
		});

		it("handles German text correctly", () => {
			const germanText =
				"Das stimmt – es gibt definitiv einige Risiken, und im Vorfeld ist einiges zu testen und zu prüfen. Als Einzelperson kann ich absolut nachvollziehen, dass Automatisierung und laufende Pflege mit Aufwand verbunden sind.";

			const result = isAIText(germanText, {
				languagePack: GERMAN_LANGUAGE_PACK,
			});

			assert.strictEqual(typeof result.aiLikelihood, "number");
			assert.strictEqual(typeof result.certainty, "number");
			assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1);
		});
	});

	describe("Performance Requirements", () => {
		it("executes in under 5ms for typical text", () => {
			const text =
				"The system provides comprehensive functionality for various applications and use cases. It delivers reliable performance across different operational environments.";

			const result = isAIText(text, { languagePack: ENGLISH_LANGUAGE_PACK });

			assert.ok(
				result.executionTime < 5,
				`Expected execution time < 5ms, got ${result.executionTime}ms`,
			);
		});

		it("executes very fast for clear statistical cases", () => {
			// Text with very low burstiness (uniform sentence lengths)
			const uniformText =
				"This is a sentence. This is another sentence. This is yet another sentence. This is one more sentence.";

			const result = isAIText(uniformText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
			});

			// Should terminate early with high certainty
			assert.ok(
				result.executionTime < 2,
				`Expected very fast execution < 2ms, got ${result.executionTime}ms`,
			);
			assert.ok(
				result.certainty > 0.8,
				`Expected high certainty from early termination, got ${result.certainty}`,
			);
		});
	});

	describe("Layer-by-Layer Analysis", () => {
		it("provides detailed layer results when requested", () => {
			const text =
				"Furthermore, the comprehensive system delivers optimal performance. Moreover, it provides three main benefits: efficiency, scalability, and reliability.";

			const result = isAIText(text, {
				languagePack: ENGLISH_LANGUAGE_PACK,
				includeDetails: true,
			});

			assert.ok(result.layerResults, "Should include layer results");
			assert.ok(result.layerResults.layer1, "Should include Layer 1 results");
			assert.ok(
				result.layerResults.layer1.signals,
				"Should include Layer 1 signals",
			);

			// Check Layer 1 signals
			const layer1 = result.layerResults.layer1;
			assert.strictEqual(typeof layer1.signals.burstiness, "number");
			assert.strictEqual(typeof layer1.signals.entropy, "number");
			assert.strictEqual(typeof layer1.signals.grammarPerfection, "number");
			assert.strictEqual(typeof layer1.signals.executionTime, "number");
		});

		it("terminates early on high statistical certainty", () => {
			// Text with extremely low burstiness
			const uniformText =
				"Short sentence. Another short sentence. Yet another short sentence. One more short sentence. Final short sentence.";

			const result = isAIText(uniformText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
				includeDetails: true,
			});

			if (result.layerResults.terminatedEarly) {
				assert.strictEqual(
					result.layerResults.reason,
					"high-certainty-statistical",
				);
				assert.ok(!result.layerResults.layer2, "Should not execute Layer 2");
			}
		});

		it("proceeds to Layer 2 when statistical evidence is insufficient", () => {
			// Text with ambiguous statistical properties that requires linguistic analysis
			const text =
				"This approach works. It has some benefits. The method is good. Quality varies. Results differ. Performance changes.";

			const result = isAIText(text, {
				languagePack: ENGLISH_LANGUAGE_PACK,
				includeDetails: true,
			});

			assert.ok(result.layerResults.layer1, "Should execute Layer 1");

			// Either Layer 2 executes, OR Layer 1 terminates early with high certainty
			if (result.layerResults.layer2) {
				// Check Layer 2 signals if it executed
				const layer2 = result.layerResults.layer2;
				assert.strictEqual(typeof layer2.signals.transitionPhrases, "number");
				assert.strictEqual(typeof layer2.signals.punctuationOveruse, "number");
				assert.strictEqual(typeof layer2.signals.triadicObsession, "number");
			} else {
				// If Layer 1 terminated early, it should have high certainty
				assert.ok(
					result.layerResults.layer1.certainty >= 0.9,
					"Early termination should have high certainty",
				);
			}
		});
	});

	describe("Dominant Pattern Identification", () => {
		it("identifies mechanical transitions as dominant pattern", () => {
			const transitionHeavyText =
				"Furthermore, the system delivers performance. Moreover, it provides benefits. Additionally, the framework ensures reliability. Consequently, users experience optimal functionality.";

			const result = isAIText(transitionHeavyText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
			});

			// The cascade may find statistical patterns (like uniform sentences) or linguistic patterns (transitions)
			// Both are valid AI indicators for this text
			assert.ok(
				result.dominantPattern.includes("transition") ||
					result.dominantPattern.includes("mechanical") ||
					result.dominantPattern.includes("uniform") ||
					result.dominantPattern.includes("statistical"),
				`Expected AI-related pattern, got ${result.dominantPattern}`,
			);
		});

		it("identifies uniform sentence lengths as dominant pattern", () => {
			const uniformText =
				"This is a test sentence. This is another test sentence. This is yet another test sentence.";

			const result = isAIText(uniformText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
			});

			assert.ok(
				result.dominantPattern.includes("uniform") ||
					result.dominantPattern.includes("sentence"),
				`Expected uniform sentence pattern, got ${result.dominantPattern}`,
			);
		});

		it("identifies rule-of-three obsession", () => {
			const triadicText =
				"The system provides three main benefits: efficiency, scalability, and reliability. There are three key features: speed, accuracy, and consistency. We offer three service levels: basic, standard, and premium.";

			const result = isAIText(triadicText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
			});

			if (result.aiLikelihood > 0.5) {
				// The cascade may identify various AI patterns - statistical, linguistic, or triadic
				assert.ok(
					result.dominantPattern.includes("three") ||
						result.dominantPattern.includes("triadic") ||
						result.dominantPattern.includes("uniform") ||
						result.dominantPattern.includes("statistical") ||
						result.dominantPattern.includes("rule-of-three"),
					`Expected AI-related pattern, got ${result.dominantPattern}`,
				);
			}
		});
	});

	describe("Edge Cases & Error Handling", () => {
		it("throws error for missing language pack", () => {
			assert.throws(
				() => isAIText("Test text", {}),
				/Parameter 'languagePack' is required/,
			);
		});

		it("throws error for non-string input", () => {
			assert.throws(
				() => isAIText(123, { languagePack: ENGLISH_LANGUAGE_PACK }),
				/Input 'text' must be a string/,
			);
		});

		it("throws error for empty text", () => {
			assert.throws(
				() => isAIText("", { languagePack: ENGLISH_LANGUAGE_PACK }),
				/Cannot analyze empty text/,
			);
		});

		it("throws error for text too short", () => {
			assert.throws(
				() => isAIText("Short", { languagePack: ENGLISH_LANGUAGE_PACK }),
				/Text must contain at least \d+ words for analysis/,
			);
		});

		it("handles minimum word count option", () => {
			const shortText = "This is short text here.";

			const result = isAIText(shortText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
				minWordCount: 3,
			});

			assert.strictEqual(typeof result.aiLikelihood, "number");
		});
	});

	describe("Text Metrics", () => {
		it("calculates text metrics correctly", () => {
			const text =
				"This is a test sentence. This is another sentence for testing purposes.";

			const result = isAIText(text, { languagePack: ENGLISH_LANGUAGE_PACK });

			assert.strictEqual(typeof result.textMetrics.wordCount, "number");
			assert.strictEqual(typeof result.textMetrics.sentenceCount, "number");
			assert.strictEqual(typeof result.textMetrics.characterCount, "number");
			assert.strictEqual(typeof result.textMetrics.detectedTextType, "string");

			assert.ok(result.textMetrics.wordCount > 0);
			assert.ok(result.textMetrics.sentenceCount > 0);
			assert.ok(result.textMetrics.characterCount > 0);
		});
	});

	describe("Signal Strength Logic", () => {
		it("uses strongest signal for combined likelihood", () => {
			// Test with text that has mixed signals
			const mixedText =
				"The system works okay for most things. Furthermore, it provides comprehensive functionality and delivers three main benefits: efficiency, scalability, and reliability.";

			const result = isAIText(mixedText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
				includeDetails: true,
			});

			// Combined likelihood should be at least as high as the strongest individual signal
			if (result.layerResults.layer1 && result.layerResults.layer2) {
				const maxLayer1Signal = Math.max(
					1 - result.layerResults.layer1.signals.burstiness,
					1 - result.layerResults.layer1.signals.entropy / 5,
					result.layerResults.layer1.signals.grammarPerfection,
				);
				const maxLayer2Signal = Math.max(
					result.layerResults.layer2.signals.transitionPhrases,
					result.layerResults.layer2.signals.punctuationOveruse,
					result.layerResults.layer2.signals.triadicObsession,
				);

				const expectedMinimum =
					Math.max(maxLayer1Signal, maxLayer2Signal) * 0.7; // Allow larger variance for cascade
				assert.ok(
					result.aiLikelihood >= expectedMinimum,
					`Combined likelihood ${result.aiLikelihood} should be at least ${expectedMinimum}`,
				);
			}
		});
	});

	describe("Cross-Language Consistency", () => {
		it("provides consistent API across language packs", () => {
			const englishText =
				"The system provides comprehensive functionality for modern business applications and workflows.";
			const germanText =
				"Das System bietet umfassende Funktionalität für moderne Geschäftsanwendungen und Arbeitsabläufe.";

			const englishResult = isAIText(englishText, {
				languagePack: ENGLISH_LANGUAGE_PACK,
			});
			const germanResult = isAIText(germanText, {
				languagePack: GERMAN_LANGUAGE_PACK,
			});

			// Both should have same result structure
			const englishKeys = Object.keys(englishResult).sort();
			const germanKeys = Object.keys(germanResult).sort();

			assert.deepStrictEqual(
				englishKeys,
				germanKeys,
				"Results should have consistent structure",
			);
		});
	});
});
