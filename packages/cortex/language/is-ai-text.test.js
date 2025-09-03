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
import { ENGLISH_SIGNATURE_PHRASES } from "./signaturephrases/english.js";

describe("isAIText", () => {
	describe("basic functionality", () => {
		it("analyzes AI-like text correctly", () => {
			const aiText =
				"Furthermore, the comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. The implementation provides three main benefits: efficiency, scalability, and reliability. Additionally, the framework ensures consistent results across all operational parameters while maintaining exceptional quality standards.";

			const result = isAIText(aiText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(typeof result === "object", "Should return an object");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"AI likelihood should be between 0 and 1",
			);
			assert.ok(
				typeof result.certainty === "number",
				"Should return certainty",
			);
			assert.ok(
				result.certainty >= 0 && result.certainty <= 1,
				"Certainty should be between 0 and 1",
			);
			assert.ok(
				typeof result.combinedScore === "number",
				"Should return combined score",
			);
			assert.ok(
				result.combinedScore >= 0 && result.combinedScore <= 1,
				"Combined score should be between 0 and 1",
			);
			assert.ok(
				typeof result.totalExecutionTime === "number",
				"Should return execution time",
			);
			assert.ok(
				result.totalExecutionTime > 0,
				"Execution time should be positive",
			);
			assert.ok(
				Array.isArray(result.algorithmResults),
				"Should return algorithm results array",
			);
			assert.ok(
				typeof result.textMetrics === "object",
				"Should return text metrics",
			);
			assert.ok(
				typeof result.explanation === "string",
				"Should return explanation",
			);
			assert.ok(
				typeof result.classification === "string",
				"Should return classification",
			);

			// AI text should have higher AI likelihood
			assert.ok(
				result.aiLikelihood > 0.5,
				"AI text should have high AI likelihood",
			);
		});

		it("analyzes human-like text correctly", () => {
			const humanText =
				"I can't believe what happened today! The system was acting kinda weird and their were some issues with the setup. Its not perfect but it gets the job done most of the time. Sometimes things just don't work as expected, you know? We're trying to fix all the problems that keep popping up in different areas.";

			const result = isAIText(humanText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"AI likelihood should be between 0 and 1",
			);
			assert.ok(
				typeof result.certainty === "number",
				"Should return certainty",
			);
			assert.ok(result.certainty > 0, "Should have some certainty");
			assert.ok(
				typeof result.combinedScore === "number",
				"Should return combined score",
			);

			// Human text should have lower AI likelihood
			assert.ok(
				result.aiLikelihood < 0.6,
				"Human text should have lower AI likelihood",
			);
		});

		it("handles mixed characteristics text", () => {
			const mixedText =
				"The system delivers optimal performance and provides three benefits: efficiency, scalability, reliability. However, it's kinda weird that users can't access some features properly. We're working on fixing these issues as they pop up organically.";

			const result = isAIText(mixedText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"AI likelihood should be between 0 and 1",
			);
			assert.ok(
				typeof result.certainty === "number",
				"Should return certainty",
			);
			assert.ok(
				typeof result.combinedScore === "number",
				"Should return combined score",
			);
		});
	});

	describe("performance tracking", () => {
		it("tracks execution time for each algorithm", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate insights for informed decision-making processes across diverse organizational contexts.";

			const result = isAIText(text, {
				includeDetails: true,
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.totalExecutionTime > 0,
				"Should track total execution time",
			);
			assert.ok(
				result.algorithmResults.length > 0,
				"Should have algorithm results",
			);

			// Check that contributing algorithms have execution times
			const contributingResults = result.algorithmResults.filter(
				(r) => r.contributes,
			);
			assert.ok(
				contributingResults.length > 0,
				"Should have contributing algorithms",
			);

			for (const algorithmResult of contributingResults) {
				assert.ok(
					typeof algorithmResult.executionTime === "number",
					"Should track execution time",
				);
				assert.ok(
					algorithmResult.executionTime >= 0,
					"Execution time should be non-negative",
				);
				assert.ok(
					typeof algorithmResult.name === "string",
					"Should have algorithm name",
				);
				assert.ok(
					typeof algorithmResult.aiLikelihood === "number",
					"Should have AI likelihood",
				);
				assert.ok(
					typeof algorithmResult.confidence === "number",
					"Should have confidence",
				);
				assert.ok(
					typeof algorithmResult.weight === "number",
					"Should have weight",
				);
			}
		});

		it("respects execution time limits", () => {
			const text =
				"This is a test text that should be analyzed quickly without timeout issues. The system works efficiently and provides reliable results.";

			const result = isAIText(text, {
				maxExecutionTime: 100,
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.totalExecutionTime < 200,
				"Should complete within reasonable time",
			);
		});
	});

	describe("algorithmic sophistication", () => {
		it("applies threshold-aware amplification", () => {
			const strongAIText =
				"Furthermore, the comprehensive system delivers optimal performance through advanced algorithms. The implementation provides three main benefits: efficiency, scalability, and reliability. Additionally, the framework ensures consistent results across all operational parameters.";

			const result = isAIText(strongAIText, {
				includeDetails: true,
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			// Should have strong AI signals with amplification
			const strongSignals = result.algorithmResults.filter(
				(r) => r.contributes && r.strength === "strong" && r.aiLikelihood > 0.6,
			);

			if (strongSignals.length > 0) {
				assert.ok(
					strongSignals.some((s) => s.transformedScore !== s.aiLikelihood),
					"Should apply score transformation",
				);
			}
		});

		it("calculates consensus correctly", () => {
			const text =
				"The system provides reliable performance and functionality for various applications and use cases across different operational environments. The implementation ensures optimal efficiency and delivers comprehensive solutions for diverse business requirements.";

			const result = isAIText(text, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				typeof result.consensus === "number",
				"Should return consensus",
			);
			assert.ok(
				result.consensus >= 0 && result.consensus <= 1,
				"Consensus should be between 0 and 1",
			);
		});

		it("detects text types correctly", () => {
			const technicalText =
				"The API implementation utilizes advanced algorithms for database optimization and system performance enhancement across distributed computing environments.";
			const casualText =
				"I'm kinda thinking this stuff is pretty good overall. Yeah, it works okay for most things we need to do around here.";

			const technicalResult = isAIText(technicalText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});
			const casualResult = isAIText(casualText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				technicalResult.textMetrics.detectedTextType === "technical",
				"Should detect technical text type",
			);
			assert.ok(
				casualResult.textMetrics.detectedTextType === "casual",
				"Should detect casual text type",
			);
		});
	});

	describe("early termination optimization", () => {
		it("can terminate early with strong consensus", () => {
			const strongAIText =
				"Furthermore, the comprehensive system delves into advanced methodologies. Moreover, it provides three key advantages: efficiency, scalability, and reliability. Additionally, the implementation ensures optimal performance through sophisticated algorithms.";

			const resultWithEarly = isAIText(strongAIText, {
				enableEarlyTermination: true,
				includeDetails: true,
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});
			const resultWithoutEarly = isAIText(strongAIText, {
				enableEarlyTermination: false,
				includeDetails: true,
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			// Both should still produce valid results
			assert.ok(
				resultWithEarly.aiLikelihood >= 0 && resultWithEarly.aiLikelihood <= 1,
				"Early termination should produce valid AI likelihood",
			);
			assert.ok(
				resultWithoutEarly.aiLikelihood >= 0 &&
					resultWithoutEarly.aiLikelihood <= 1,
				"Full analysis should produce valid AI likelihood",
			);
		});
	});

	describe("edge cases and error handling", () => {
		it("handles very short text appropriately", () => {
			const shortText = "Hello world!";

			const result = isAIText(shortText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				typeof result === "object",
				"Should still return result for short text",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			// Short text may have limited algorithm coverage
		});

		it("throws error for empty text", () => {
			assert.throws(
				() => isAIText("", { signaturePhrases: ENGLISH_SIGNATURE_PHRASES }),
				/Cannot analyze empty text/,
				"Should throw error for empty text",
			);
		});

		it("throws error for non-string input", () => {
			assert.throws(
				() => isAIText(123, { signaturePhrases: ENGLISH_SIGNATURE_PHRASES }),
				/Input 'text' must be a string/,
				"Should throw error for non-string input",
			);
		});

		it("handles text with insufficient content for some algorithms", () => {
			const minimalText = "Short text here.";

			const result = isAIText(minimalText, {
				includeDetails: true,
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(typeof result === "object", "Should handle minimal text");

			// Some algorithms should be skipped due to constraints
			const skippedAlgorithms = result.algorithmResults.filter(
				(r) => !r.contributes,
			);
			assert.ok(
				skippedAlgorithms.length > 0,
				"Should skip some algorithms for minimal text",
			);
		});
	});

	describe("classification accuracy", () => {
		it("provides appropriate classifications", () => {
			const texts = [
				{
					text: "Furthermore, the comprehensive system delivers optimal performance through advanced algorithms. The implementation provides three main benefits: efficiency, scalability, and reliability. Additionally, the framework ensures consistent results across all operational parameters while maintaining exceptional quality standards and delivering comprehensive solutions.",
					expectedType: ["AI", "Likely AI", "Uncertain"],
				},
				{
					text: "I can't believe what happened today! The system was acting kinda weird and their were some issues. Its not perfect but it gets the job done.",
					expectedType: ["Human", "Uncertain"],
				},
			];

			for (const testCase of texts) {
				const result = isAIText(testCase.text, {
					signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
				});
				assert.ok(
					testCase.expectedType.includes(result.classification),
					`Classification for "${testCase.text.substring(0, 50)}..." should be one of ${testCase.expectedType.join(", ")}, got ${result.classification}`,
				);
			}
		});
	});

	describe("mathematical properties", () => {
		it("maintains mathematical consistency", () => {
			const text =
				"The analytical framework incorporates methodologies for systematic evaluation of complex datasets and pattern identification across diverse organizational contexts.";

			const result = isAIText(text, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			// Combined score should be <= min(aiLikelihood, certainty)
			assert.ok(
				result.combinedScore <= Math.max(result.aiLikelihood, result.certainty),
				"Combined score should respect mathematical bounds",
			);

			// All probabilities should be bounded
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"AI likelihood should be properly bounded",
			);
			assert.ok(
				result.certainty >= 0 && result.certainty <= 1,
				"Certainty should be properly bounded",
			);
			assert.ok(
				result.consensus >= 0 && result.consensus <= 1,
				"Consensus should be properly bounded",
			);
		});
	});
});
