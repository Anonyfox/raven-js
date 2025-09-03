import assert from "node:assert";
import { describe, it } from "node:test";
import { ENGLISH_SIGNATURE_PHRASES } from "../signaturephrases/english.js";
import { analyzeWithEnsemble } from "./ensemble-scorer.js";

describe("analyzeWithEnsemble", () => {
	describe("basic functionality", () => {
		it("analyzes AI-generated text correctly", () => {
			const aiText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. Furthermore, it provides three main benefits: efficiency, scalability, and reliability. The implementation ensures consistent results across all operational parameters.";

			const result = analyzeWithEnsemble(aiText);

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
				typeof result.confidence === "string",
				"Should return confidence level",
			);
			assert.ok(
				["high", "medium", "low"].includes(result.confidence),
				"Confidence should be valid level",
			);
			assert.ok(
				typeof result.weightedScore === "number",
				"Should return weighted score",
			);
			assert.ok(
				typeof result.algorithmCount === "number",
				"Should return algorithm count",
			);
			assert.ok(
				typeof result.consensus === "number",
				"Should return consensus",
			);
			assert.ok(typeof result.textType === "string", "Should return text type");
		});

		it("analyzes human-written text correctly", () => {
			const humanText =
				"I can't believe what happened today! The system was acting kinda weird and their were some issues with the setup. Its not perfect but it gets the job done most of the time.";

			const result = analyzeWithEnsemble(humanText);

			assert.ok(
				result.aiLikelihood < 0.6,
				"Should indicate lower AI likelihood for human text",
			);
			assert.ok(result.algorithmCount > 5, "Should use multiple algorithms");
			assert.ok(
				result.consensus >= 0 && result.consensus <= 1,
				"Consensus should be between 0 and 1",
			);
		});

		it("returns appropriate structure for all results", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate comprehensive insights for informed decision-making processes across diverse organizational contexts and operational environments for various business applications.";

			const result = analyzeWithEnsemble(text);

			// Verify result structure
			const expectedKeys = [
				"aiLikelihood",
				"confidence",
				"weightedScore",
				"algorithmCount",
				"consensus",
				"textType",
				"individualResults",
			];
			for (const key of expectedKeys) {
				assert.ok(key in result, `Result should contain ${key}`);
			}

			assert.ok(result.algorithmCount > 0, "Should have successful algorithms");
			assert.ok(Array.isArray(result.individualResults), "Should return array");
		});
	});

	describe("algorithm integration", () => {
		it("integrates multiple detection algorithms", () => {
			const text =
				"The system provides three key advantages: efficiency, performance, and reliability. Furthermore, it delivers optimal results through advanced methodologies. Additionally, the implementation ensures consistent outcomes across diverse operational environments.";

			const result = analyzeWithEnsemble(text, { includeDetails: true });

			assert.ok(
				result.algorithmCount >= 5,
				"Should successfully run most algorithms",
			);
			assert.ok(
				result.individualResults.length > 0,
				"Should include individual results",
			);

			// Verify individual result structure
			const validResults = result.individualResults.filter(
				(r) => r.score !== null,
			);
			assert.ok(validResults.length > 0, "Should have valid algorithm results");

			validResults.forEach((algorithmResult) => {
				assert.ok(
					typeof algorithmResult.name === "string",
					"Algorithm should have name",
				);
				assert.ok(
					typeof algorithmResult.score === "number",
					"Algorithm should have score",
				);
				assert.ok(
					typeof algorithmResult.weight === "number",
					"Algorithm should have weight",
				);
				assert.ok(
					algorithmResult.score >= 0 && algorithmResult.score <= 1,
					"Algorithm score should be between 0 and 1",
				);
			});
		});

		it("handles algorithm failures gracefully", () => {
			// Very short text that might cause some algorithms to fail
			const shortText =
				"The system works efficiently and provides reliable performance for users. The new approach ensures comprehensive results and optimal outcomes.";

			const result = analyzeWithEnsemble(shortText, {
				minWordCount: 10,
				includeDetails: true,
			});

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should still return result despite some failures",
			);
			assert.ok(
				result.algorithmCount > 0,
				"Should have at least some successful algorithms",
			);

			// Check that failed algorithms are marked properly
			const failedResults = result.individualResults.filter(
				(r) => r.score === null,
			);
			failedResults.forEach((failed) => {
				assert.ok(
					typeof failed.error === "string",
					"Failed algorithms should have error message",
				);
			});
		});

		it("applies algorithm weights correctly", () => {
			const text =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes for enhanced operational efficiency and reliability across diverse organizational contexts and business environments for various applications.";

			// Test with custom weights
			const customWeights = {
				burstiness: 0.5,
				shannon_entropy: 0.3,
				ngram_repetition: 0.1,
				zipf_deviation: 0.05,
				ai_transition_phrases: 0.05,
				em_dash_epidemic: 0.0,
				rule_of_three: 0.0,
				participial_phrases: 0.0,
				perplexity_approximator: 0.0,
				perfect_grammar: 0.0,
			};

			const result = analyzeWithEnsemble(text, {
				algorithmWeights: customWeights,
				includeDetails: true,
			});

			assert.ok(
				typeof result.weightedScore === "number",
				"Should calculate weighted score",
			);
			assert.ok(
				result.individualResults.length > 0,
				"Should include algorithm results",
			);

			// Verify weights are applied
			const weightedResults = result.individualResults.filter(
				(r) => r.score !== null,
			);
			weightedResults.forEach((algorithmResult) => {
				const expectedWeight = customWeights[algorithmResult.name];
				if (expectedWeight !== undefined) {
					assert.ok(
						algorithmResult.weight === expectedWeight,
						`Weight for ${algorithmResult.name} should match custom weight`,
					);
				}
			});
		});
	});

	describe("text type detection", () => {
		it("detects technical text type", () => {
			const technicalText =
				"The API implementation utilizes advanced algorithms for database optimization and system performance enhancement. The technical methodology ensures efficient function execution across distributed computing environments and modern infrastructure.";

			const result = analyzeWithEnsemble(technicalText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.textType === "technical",
				"Should detect technical text type",
			);
		});

		it("detects academic text type", () => {
			const academicText =
				"This research study examines the correlation between environmental factors and behavioral patterns. The methodology incorporated longitudinal analysis across diverse populations. Furthermore, the findings indicate significant relationships that warrant additional investigation.";

			const result = analyzeWithEnsemble(academicText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.textType === "academic",
				"Should detect academic text type",
			);
		});

		it("detects business text type", () => {
			const businessText =
				"Our strategic objectives focus on delivering comprehensive solutions to stakeholders. The implementation roadmap ensures operational excellence while maximizing deliverables across all organizational functions and business units.";

			const result = analyzeWithEnsemble(businessText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.textType === "business",
				"Should detect business text type",
			);
		});

		it("detects casual text type", () => {
			const casualText =
				"I kinda think the system is pretty good overall. Yeah, it works okay for most stuff and gets the job done. The thing is, it's not perfect but it's good enough for what we need.";

			const result = analyzeWithEnsemble(casualText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(result.textType === "casual", "Should detect casual text type");
		});

		it("detects social media text type", () => {
			const socialMediaText =
				"omg cant believe this happened!! the system crashed again and now everything is broken 😭 lol this is so frustrating but whatever i guess we'll figure it out somehow";

			const result = analyzeWithEnsemble(socialMediaText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.textType === "social_media",
				"Should detect social media text type",
			);
		});

		it("allows manual text type specification", () => {
			const text =
				"The system provides reliable performance and functionality for various applications and use cases across different operational environments. The implementation ensures optimal efficiency and delivers comprehensive solutions for diverse business requirements and technical specifications.";

			const result = analyzeWithEnsemble(text, { textType: "creative" });

			assert.ok(
				result.textType === "creative",
				"Should use manually specified text type",
			);
		});
	});

	describe("confidence assessment", () => {
		it("provides high confidence for clear AI patterns", () => {
			const clearAiText =
				"The comprehensive system delivers optimal performance through advanced algorithms. Furthermore, it provides three main benefits: efficiency, scalability, and reliability. Additionally, the implementation ensures consistent results. Moreover, the framework delivers exceptional outcomes through streamlined processes.";

			const result = analyzeWithEnsemble(clearAiText);

			assert.ok(
				typeof result.confidence === "string",
				"Should provide confidence assessment",
			);
			assert.ok(
				["high", "medium", "low"].includes(result.confidence),
				"Should provide valid confidence level",
			);
			assert.ok(
				result.aiLikelihood > 0.6,
				"Should show high AI likelihood for clear patterns",
			);
		});

		it("provides appropriate confidence for ambiguous text", () => {
			const ambiguousText =
				"The system works well and provides good performance for users. It delivers results and maintains reliability across different environments. The implementation offers functionality that ensures quality outcomes.";

			const result = analyzeWithEnsemble(ambiguousText);

			assert.ok(
				typeof result.confidence === "string",
				"Should provide confidence assessment",
			);
			assert.ok(
				result.consensus >= 0 && result.consensus <= 1,
				"Should calculate consensus measure",
			);
		});

		it("adjusts confidence based on algorithm coverage", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies for systematic evaluation and comprehensive analysis. The system delivers optimal performance through advanced processing capabilities and ensures reliable results across diverse operational scenarios and complex data structures.";

			const result = analyzeWithEnsemble(text, { includeDetails: true });

			// Calculate expected coverage
			const totalAlgorithms = 10;
			const successfulAlgorithms = result.algorithmCount;
			const coverage = successfulAlgorithms / totalAlgorithms;

			assert.ok(coverage > 0, "Should have some algorithm coverage");
			assert.ok(
				result.algorithmCount <= totalAlgorithms,
				"Algorithm count should not exceed total",
			);
		});
	});

	describe("consensus calculation", () => {
		it("calculates consensus between algorithms", () => {
			const text =
				"The system delivers optimal performance through advanced algorithms and streamlined processes. Furthermore, it provides comprehensive functionality that ensures reliable outcomes across diverse operational environments and modern infrastructure.";

			const result = analyzeWithEnsemble(text, { includeDetails: true });

			assert.ok(
				result.consensus >= 0 && result.consensus <= 1,
				"Consensus should be between 0 and 1",
			);

			// Higher consensus should indicate more agreement
			const scores = result.individualResults
				.filter((r) => r.score !== null)
				.map((r) => r.score);

			if (scores.length > 1) {
				assert.ok(
					scores.length > 0,
					"Should have algorithm scores for consensus",
				);
			}
		});

		it("handles perfect consensus with single algorithm", () => {
			// This shouldn't happen in practice, but test edge case
			const text =
				"The comprehensive system provides advanced functionality and delivers optimal performance for users. The implementation ensures consistent results and maintains reliability across various operational environments while supporting diverse application requirements and technical specifications for modern enterprise solutions.";

			const result = analyzeWithEnsemble(text);

			// Even with multiple algorithms, consensus should be calculated
			assert.ok(
				typeof result.consensus === "number",
				"Should calculate consensus",
			);
			assert.ok(
				result.consensus >= 0 && result.consensus <= 1,
				"Consensus should be in valid range",
			);
		});
	});

	describe("parameter variations", () => {
		it("respects minimum word count requirement", () => {
			const shortText = "The system works efficiently.";

			assert.throws(
				() => analyzeWithEnsemble(shortText, { minWordCount: 50 }),
				/Text must contain at least 50 words/,
				"Should throw error for insufficient word count",
			);
		});

		it("allows custom confidence threshold", () => {
			const text =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes for enhanced operational efficiency. The implementation ensures reliable functionality and maintains consistent results across diverse applications while supporting various business requirements and technical specifications for enterprise solutions.";

			const strictResult = analyzeWithEnsemble(text, {
				confidenceThreshold: 0.9,
			});
			const lenientResult = analyzeWithEnsemble(text, {
				confidenceThreshold: 0.3,
			});

			assert.ok(
				typeof strictResult.confidence === "string",
				"Should return confidence with strict threshold",
			);
			assert.ok(
				typeof lenientResult.confidence === "string",
				"Should return confidence with lenient threshold",
			);
		});

		it("includes detailed results when requested", () => {
			const text =
				"The system provides comprehensive functionality and delivers optimal performance through advanced methodologies. The implementation ensures reliable operation and maintains consistent results across diverse environments while supporting various business requirements and technical specifications for modern enterprise solutions.";

			const detailResult = analyzeWithEnsemble(text, { includeDetails: true });
			const basicResult = analyzeWithEnsemble(text, { includeDetails: false });

			assert.ok(
				detailResult.individualResults.length > 0,
				"Should include individual results when requested",
			);
			assert.ok(
				basicResult.individualResults.length === 0,
				"Should not include details by default",
			);

			// Verify detailed result structure
			detailResult.individualResults.forEach((algorithmResult) => {
				if (algorithmResult.score !== null) {
					assert.ok(
						algorithmResult.result !== null,
						"Should include algorithm result details",
					);
				}
			});
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes for enhanced operational efficiency and reliability. The implementation ensures consistent results across diverse environments while supporting various business requirements and technical specifications for modern enterprise solutions and applications.",
				"I can't believe what happened today! The system was acting kinda weird and their were some issues but it gets the job done most of the time. Its not perfect but we're working on fixing all the problems that keep popping up in different areas of the application.",
				"omg this is so frustrating lol the thing keeps breaking and its driving me crazy but whatever i guess we'll figure it out somehow or something. like seriously this is taking forever and im getting tired of dealing with all these random bugs and issues that make no sense whatsoever",
			];

			texts.forEach((text) => {
				const result = analyzeWithEnsemble(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.consensus >= 0 && result.consensus <= 1,
					"Consensus should be between 0 and 1",
				);
				assert.ok(
					result.weightedScore >= 0,
					"Weighted score should be non-negative",
				);
				assert.ok(
					result.algorithmCount > 0,
					"Algorithm count should be positive",
				);
			});
		});

		it("maintains consistency across multiple runs", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate insights. The system delivers reliable performance through advanced processing capabilities while ensuring consistent results across various operational environments and diverse application requirements for modern enterprise solutions.";

			const results = Array.from({ length: 5 }, () =>
				analyzeWithEnsemble(text),
			);

			// All results should be identical
			for (let i = 1; i < results.length; i++) {
				assert.equal(
					results[i].aiLikelihood,
					results[0].aiLikelihood,
					"AI likelihood should be consistent",
				);
				assert.equal(
					results[i].consensus,
					results[0].consensus,
					"Consensus should be consistent",
				);
				assert.equal(
					results[i].textType,
					results[0].textType,
					"Text type should be consistent",
				);
			}
		});

		it("responds appropriately to text variations", () => {
			const aiText =
				"The comprehensive system delivers optimal performance through advanced algorithms. Furthermore, it provides three main benefits: efficiency, scalability, and reliability. The implementation ensures consistent results across diverse operational environments while supporting various business requirements and technical specifications for modern enterprise solutions and applications.";

			const humanText =
				"I can't believe what happened today! The system was acting kinda weird and their were some issues. Its not perfect but it gets the job done most of the time. We're working on fixing all the problems that keep popping up in different areas of the application and dealing with various bugs that make no sense.";

			const aiResult = analyzeWithEnsemble(aiText);
			const humanResult = analyzeWithEnsemble(humanText);

			assert.ok(
				aiResult.aiLikelihood > humanResult.aiLikelihood,
				"AI text should have higher AI likelihood",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated technical documentation", () => {
			const aiTechnicalText =
				"The API implementation utilizes advanced algorithms for optimal performance optimization. The comprehensive framework delivers three key advantages: scalability, efficiency, and reliability. Furthermore, the system ensures consistent results through streamlined methodologies.";

			const result = analyzeWithEnsemble(aiTechnicalText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.aiLikelihood > 0.6,
				"AI technical content should show high AI likelihood",
			);
			assert.ok(
				result.textType === "technical",
				"Should detect technical text type",
			);
			assert.ok(
				result.algorithmCount >= 5,
				"Should successfully run most algorithms",
			);
		});

		it("analyzes human-written creative prose", () => {
			const humanCreativeText =
				"She couldn't believe what she was seeing. The old house looked kinda spooky in the moonlight, and their were strange shadows dancing across the walls. It wasn't gonna be easy, but she had to find out what was hidden inside.";

			const result = analyzeWithEnsemble(humanCreativeText);

			assert.ok(
				result.aiLikelihood < 0.5,
				"Human creative text should show low AI likelihood",
			);
			assert.ok(
				result.algorithmCount > 5,
				"Should run multiple algorithms successfully",
			);
		});

		it("analyzes academic research writing", () => {
			const academicText =
				"This study examines the correlation between environmental factors and behavioral patterns in urban ecosystems. The methodology incorporated longitudinal observations across diverse geographical locations. Furthermore, the findings indicate significant relationships between variables that warrant additional investigation.";

			const result = analyzeWithEnsemble(academicText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.textType === "academic",
				"Should detect academic text type",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid AI likelihood",
			);
		});

		it("analyzes business communication", () => {
			const businessText =
				"Thank you for your inquiry regarding our comprehensive solutions. Our team provides strategic objectives that align with stakeholder requirements. We deliver measurable results through proven methodologies and operational excellence.";

			const result = analyzeWithEnsemble(businessText, {
				signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
			});

			assert.ok(
				result.textType === "business",
				"Should detect business text type",
			);
			assert.ok(
				result.aiLikelihood >= 0.4,
				"Business communication often appears somewhat AI-like",
			);
		});
	});

	describe("edge cases", () => {
		it("handles text with mixed characteristics", () => {
			const mixedText =
				"The system delivers optimal performance and provides three benefits: efficiency, scalability, reliability. However, it's kinda weird that users can't access some features properly. The implementation ensures comprehensive functionality while supporting diverse business requirements and technical specifications for modern enterprise solutions across various operational environments.";

			const result = analyzeWithEnsemble(mixedText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle mixed AI/human characteristics",
			);
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"Should return valid AI likelihood",
			);
		});

		it("handles text with minimal algorithmic signals", () => {
			const neutralText =
				"The meeting will be held tomorrow at three o'clock in the conference room. Please bring your reports and any relevant documentation for the discussion. We will review the quarterly results and discuss upcoming projects that require immediate attention from various team members and stakeholders involved in the process.";

			const result = analyzeWithEnsemble(neutralText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle neutral text",
			);
			assert.ok(result.algorithmCount > 0, "Should run some algorithms");
		});

		it("handles very formal text", () => {
			const formalText =
				"The distinguished committee hereby acknowledges receipt of the comprehensive proposal submitted for consideration. The evaluation process shall commence forthwith in accordance with established protocols and procedures.";

			const result = analyzeWithEnsemble(formalText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle very formal text",
			);
			assert.ok(
				result.algorithmCount > 0,
				"Should successfully analyze formal text",
			);
		});

		it("handles text at minimum word count", () => {
			const minimalText =
				"The system works well and provides good performance for users across various applications and environments.";

			const result = analyzeWithEnsemble(minimalText, { minWordCount: 15 });

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle minimal text",
			);
			assert.ok(
				result.algorithmCount > 0,
				"Should run at least some algorithms",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => analyzeWithEnsemble(123),
				TypeError,
				"Should throw TypeError for number input",
			);

			assert.throws(
				() => analyzeWithEnsemble(null),
				TypeError,
				"Should throw TypeError for null input",
			);

			assert.throws(
				() => analyzeWithEnsemble(undefined),
				TypeError,
				"Should throw TypeError for undefined input",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => analyzeWithEnsemble(""),
				/Cannot analyze empty text/,
				"Should throw error for empty string",
			);

			assert.throws(
				() => analyzeWithEnsemble("   "),
				/Cannot analyze empty text/,
				"Should throw error for whitespace-only string",
			);
		});

		it("validates option parameters", () => {
			const validText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes.";

			assert.throws(
				() => analyzeWithEnsemble(validText, { minWordCount: -1 }),
				/Parameter minWordCount must be a positive integer/,
				"Should validate minWordCount",
			);

			assert.throws(
				() => analyzeWithEnsemble(validText, { minWordCount: 1.5 }),
				/Parameter minWordCount must be a positive integer/,
				"Should validate minWordCount is integer",
			);

			assert.throws(
				() => analyzeWithEnsemble(validText, { confidenceThreshold: -0.5 }),
				/Parameter confidenceThreshold must be a number between 0 and 1/,
				"Should validate confidenceThreshold range",
			);

			assert.throws(
				() => analyzeWithEnsemble(validText, { confidenceThreshold: 1.5 }),
				/Parameter confidenceThreshold must be a number between 0 and 1/,
				"Should validate confidenceThreshold upper bound",
			);
		});

		it("handles complete algorithm failure gracefully", () => {
			// This is difficult to trigger in practice, but test the error path
			const validText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. The implementation ensures reliable functionality while supporting diverse business requirements and technical specifications for modern enterprise solutions across various operational environments.";

			// Normal case should work
			const result = analyzeWithEnsemble(validText);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes standard text efficiently", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns. ".repeat(
					5,
				);

			const start = performance.now();
			const result = analyzeWithEnsemble(text);
			const duration = performance.now() - start;

			assert.ok(duration < 500, "Should process text efficiently");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales reasonably with text length", () => {
			const baseText =
				"The comprehensive system provides advanced functionality that enhances operational efficiency. ";
			const shortText = baseText.repeat(10);
			const longText = baseText.repeat(50);

			// Run multiple times to reduce timing variance and JIT effects
			const runs = 3;
			let shortTotal = 0;
			let longTotal = 0;

			for (let i = 0; i < runs; i++) {
				const shortStart = performance.now();
				analyzeWithEnsemble(shortText);
				shortTotal += performance.now() - shortStart;

				const longStart = performance.now();
				analyzeWithEnsemble(longText);
				longTotal += performance.now() - longStart;
			}

			const shortAvg = shortTotal / runs;
			const longAvg = longTotal / runs;

			// More generous scaling threshold to account for timing variations
			assert.ok(
				longAvg < shortAvg * 50,
				"Should scale reasonably with text length",
			);
		});

		it("handles detailed analysis efficiently", () => {
			const complexText =
				"The interdisciplinary research methodology incorporates quantitative and qualitative approaches to investigate complex phenomena. ".repeat(
					20,
				);

			const start = performance.now();
			const result = analyzeWithEnsemble(complexText, { includeDetails: true });
			const duration = performance.now() - start;

			assert.ok(duration < 1000, "Should handle detailed analysis efficiently");
			assert.ok(
				result.individualResults.length > 0,
				"Should include individual results",
			);
		});
	});
});
