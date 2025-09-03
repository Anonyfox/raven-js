import assert from "node:assert";
import { describe, it } from "node:test";
import { detectPerfectGrammar } from "./perfect-grammar-detector.js";

describe("detectPerfectGrammar", () => {
	describe("basic functionality", () => {
		it("analyzes text with perfect grammar correctly", () => {
			const perfectText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters. The implementation provides seamless integration and ensures maximum efficiency.";

			const result = detectPerfectGrammar(perfectText);

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
				typeof result.overallScore === "number",
				"Should return overall score",
			);
			assert.ok(
				typeof result.perfectionScore === "number",
				"Should return perfection score",
			);
			assert.ok(
				typeof result.totalErrors === "number",
				"Should return total errors",
			);
			assert.ok(
				typeof result.wordCount === "number",
				"Should return word count",
			);
			assert.ok(
				Array.isArray(result.detectedErrors),
				"Should return detected errors array",
			);
		});

		it("analyzes text with human errors correctly", () => {
			const humanText =
				"The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs. Sometimes it can be slow and there might be minor issues but overall its okay for most applications and use cases.";

			const result = detectPerfectGrammar(humanText);

			assert.ok(
				result.aiLikelihood < 0.8,
				"Should indicate lower AI likelihood for text with errors",
			);
			assert.ok(
				result.totalErrors > 0,
				"Should detect some errors in human-like text",
			);
			assert.ok(
				result.perfectionScore < 90,
				"Should have lower perfection score",
			);
		});

		it("returns appropriate structure for all results", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate comprehensive insights for informed decision-making processes across diverse organizational contexts and operational environments.";

			const result = detectPerfectGrammar(text);

			// Verify result structure
			const expectedKeys = [
				"aiLikelihood",
				"overallScore",
				"perfectionScore",
				"totalErrors",
				"wordCount",
				"detectedErrors",
			];
			for (const key of expectedKeys) {
				assert.ok(key in result, `Result should contain ${key}`);
			}

			assert.ok(result.wordCount > 0, "Should count words correctly");
			assert.ok(
				result.perfectionScore >= 0,
				"Perfection score should be non-negative",
			);
		});
	});

	describe("error pattern detection", () => {
		it("detects spelling errors", () => {
			const textWithSpellingErrors =
				"The comprehensive system recieve optimal performance through advanced algorithms. The maintainance procedures ensure that all components function correctly and the experiance is seamless for users. The recomendation is to definately use this approach for optimal results.";

			const result = detectPerfectGrammar(textWithSpellingErrors, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors > 0, "Should detect spelling errors");
			assert.ok(
				result.aiLikelihood < 0.7,
				"Should indicate lower AI likelihood",
			);

			const spellingErrors = result.detectedErrors.find(
				(error) => error.type === "spelling_errors",
			);
			assert.ok(
				spellingErrors && spellingErrors.count > 0,
				"Should detect specific spelling errors",
			);
		});

		it("detects typos and transpositions", () => {
			const textWithTypos =
				"The comprehensive system provides optimal performance. Users can acess the features that are available and teh system works well for most applications. This approach is recomended for yuor specific needs and requirements in this context.";

			const result = detectPerfectGrammar(textWithTypos, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors > 0, "Should detect typos");
			assert.ok(result.aiLikelihood < 0.7, "Should indicate human-like text");

			const typoErrors = result.detectedErrors.find(
				(error) => error.type === "typos",
			);
			assert.ok(
				typoErrors && typoErrors.count > 0,
				"Should detect specific typos",
			);
		});

		it("detects homophone errors", () => {
			const textWithHomophones =
				"Your welcome to use this system for your needs. Their going to implement new features soon. Its important to understand that there house has new equipment and the system works well for basic applications.";

			const result = detectPerfectGrammar(textWithHomophones, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors > 0, "Should detect homophone errors");
			assert.ok(
				result.aiLikelihood < 0.6,
				"Should indicate human-like patterns",
			);

			const homophoneErrors = result.detectedErrors.find(
				(error) => error.type === "homophone_errors",
			);
			assert.ok(
				homophoneErrors && homophoneErrors.count > 0,
				"Should detect specific homophone errors",
			);
		});

		it("detects punctuation and grammar errors", () => {
			const textWithGrammarErrors =
				"The data is important for analysis however the results shows interesting patterns. The team are working on improvements and everyone are contributing to the project. Its important to maintain quality and the systems works effectively for most users needs.";

			const result = detectPerfectGrammar(textWithGrammarErrors, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors > 0, "Should detect grammar errors");
			assert.ok(
				result.aiLikelihood < 0.6,
				"Should indicate human-like writing",
			);
		});

		it("detects redundancy and informal constructions", () => {
			const textWithRedundancy =
				"The system kinda works okay for most users. In order to achieve optimal performance, you gonna need to configure the settings properly. Yeah, it works pretty good and the thing is that users generally find it useful stuff for their needs.";

			const result = detectPerfectGrammar(textWithRedundancy, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors > 0, "Should detect informal constructions");
			assert.ok(
				result.aiLikelihood < 0.7,
				"Should indicate human-like informal writing",
			);

			const informalErrors = result.detectedErrors.find(
				(error) => error.type === "informal_constructions",
			);
			assert.ok(
				informalErrors && informalErrors.count > 0,
				"Should detect informal language",
			);
		});
	});

	describe("parameter variations", () => {
		it("respects minimum word count requirement", () => {
			const shortText =
				"The system works efficiently and provides reliable performance.";

			assert.throws(
				() => detectPerfectGrammar(shortText, { minWordCount: 50 }),
				/Text must contain at least 50 words/,
				"Should throw error for insufficient word count",
			);
		});

		it("allows custom error tolerance threshold", () => {
			const perfectText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters. The implementation provides seamless integration and maximum efficiency.";

			const strictResult = detectPerfectGrammar(perfectText, {
				errorToleranceThreshold: 0.1,
			});
			const lenientResult = detectPerfectGrammar(perfectText, {
				errorToleranceThreshold: 0.8,
			});

			assert.ok(
				strictResult.aiLikelihood >= lenientResult.aiLikelihood,
				"Stricter threshold should yield higher AI likelihood",
			);
		});

		it("includes detailed error information when requested", () => {
			const textWithErrors =
				"The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs. The maintainance procedures ensure optimal performance.";

			const detailResult = detectPerfectGrammar(textWithErrors, {
				includeDetails: true,
			});
			const basicResult = detectPerfectGrammar(textWithErrors, {
				includeDetails: false,
			});

			assert.ok(
				detailResult.detectedErrors.length > 0,
				"Should include error details when requested",
			);
			assert.ok(
				basicResult.detectedErrors.length === 0,
				"Should not include details by default",
			);

			// Verify error detail structure
			detailResult.detectedErrors.forEach((error) => {
				assert.ok(typeof error.type === "string", "Error should have type");
				assert.ok(typeof error.count === "number", "Error should have count");
				assert.ok(
					typeof error.frequency === "number",
					"Error should have frequency",
				);
				assert.ok(
					typeof error.description === "string",
					"Error should have description",
				);
			});
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters for various applications and business requirements across different organizational contexts.",
				"The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs and requirements in various contexts and applications for business purposes.",
				"Dis sistem iz relly gud an workz wel 4 most userz. Itz knda slow sumtimez but overal iz okei fr basicc aplications an stuf lyk dat an ppl seem 2 b satisfied wit da results fr most use cases.",
			];

			texts.forEach((text) => {
				const result = detectPerfectGrammar(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.overallScore >= 0,
					"Overall score should be non-negative",
				);
				assert.ok(
					result.perfectionScore >= 0,
					"Perfection score should be non-negative",
				);
				assert.ok(
					result.totalErrors >= 0,
					"Total errors should be non-negative",
				);
				assert.ok(result.wordCount > 0, "Word count should be positive");
			});
		});

		it("maintains consistency across multiple runs", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate comprehensive insights for informed decision-making processes across diverse organizational contexts and operational environments.";

			const results = Array.from({ length: 5 }, () =>
				detectPerfectGrammar(text),
			);

			// All results should be identical
			for (let i = 1; i < results.length; i++) {
				assert.equal(
					results[i].aiLikelihood,
					results[0].aiLikelihood,
					"AI likelihood should be consistent",
				);
				assert.equal(
					results[i].totalErrors,
					results[0].totalErrors,
					"Total errors should be consistent",
				);
				assert.equal(
					results[i].perfectionScore,
					results[0].perfectionScore,
					"Perfection score should be consistent",
				);
			}
		});

		it("responds appropriately to text variations", () => {
			const perfectText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters for various applications and business requirements.";

			const errorText =
				"The sistem works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs and basic requirements across different organizational contexts.";

			const perfectResult = detectPerfectGrammar(perfectText);
			const errorResult = detectPerfectGrammar(errorText);

			assert.ok(
				perfectResult.aiLikelihood > errorResult.aiLikelihood,
				"Perfect text should have higher AI likelihood",
			);
			assert.ok(
				perfectResult.totalErrors < errorResult.totalErrors,
				"Perfect text should have fewer errors",
			);
			assert.ok(
				perfectResult.perfectionScore > errorResult.perfectionScore,
				"Perfect text should have higher perfection score",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated technical content", () => {
			const aiTechnicalText =
				"The advanced machine learning algorithm implements sophisticated neural network architectures to optimize performance metrics across diverse computational environments. The system maintains consistent reliability through comprehensive error handling mechanisms and delivers exceptional results through streamlined processing methodologies.";

			const result = detectPerfectGrammar(aiTechnicalText);

			assert.ok(
				result.aiLikelihood > 0.6,
				"AI technical content should show high AI likelihood",
			);
			assert.ok(
				result.totalErrors <= 2,
				"AI content should have very few errors",
			);
			assert.ok(
				result.perfectionScore > 70,
				"AI content should have high perfection score",
			);
		});

		it("analyzes human-written narrative text", () => {
			const humanNarrativeText =
				"She couldn't believe what she was seeing. The old house looked kinda spooky in the moonlight, and their were strange shadows dancing across the walls. Its windows seemed to watch her as she approached, and she realized that this wasn't gonna be as easy as she'd thought.";

			const result = detectPerfectGrammar(humanNarrativeText);

			assert.ok(
				result.aiLikelihood < 0.6,
				"Human narrative should show low AI likelihood",
			);
			assert.ok(
				result.totalErrors >= 2,
				"Human text should contain multiple natural errors",
			);
		});

		it("analyzes business communication", () => {
			const businessText =
				"Thank you for your inquiry regarding our services. We appreciate your interest and would like to schedule a meeting to discuss your requirements. Our team can provide comprehensive solutions that align with your business objectives and deliver measurable results through proven methodologies.";

			const result = detectPerfectGrammar(businessText);

			assert.ok(
				result.aiLikelihood > 0.5,
				"Formal business communication often appears AI-like",
			);
			assert.ok(
				result.totalErrors <= 1,
				"Business communication typically has few errors",
			);
		});

		it("analyzes casual social media content", () => {
			const socialMediaText =
				"omg cant believe what happened today!! went to the store and they were out of everything i needed 😭 its so frustrating when u plan ur whole trip and then nothing works out the way you wanted it too. anyone else having these kind of problems lately??";

			const result = detectPerfectGrammar(socialMediaText);

			assert.ok(
				result.aiLikelihood < 0.5,
				"Casual social media should show very low AI likelihood",
			);
			assert.ok(
				result.totalErrors >= 5,
				"Casual text should contain many informal elements",
			);
		});
	});

	describe("multilingual and special content", () => {
		it("handles German text appropriately", () => {
			const germanText =
				"Das umfassende System liefert optimale Leistung durch fortschrittliche Algorithmen und rationalisierte Prozesse. Alle Komponenten funktionieren perfekt und gewährleisten konsistente Zuverlässigkeit über alle Betriebsparameter hinweg. Die Implementierung bietet nahtlose Integration und maximale Effizienz für verschiedene Anwendungsbereiche.";

			const result = detectPerfectGrammar(germanText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should analyze German text",
			);
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"Should return valid AI likelihood",
			);
			assert.ok(result.wordCount > 30, "Should count German words correctly");
		});

		it("handles text with mixed punctuation styles", () => {
			const mixedPunctuationText =
				"The system works well, however it 'sometimes' has issues. Users said \"it's pretty good\" but noted that performance varies. The team's working on improvements - they're committed to excellence and want to ensure optimal results for all users.";

			const result = detectPerfectGrammar(mixedPunctuationText, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors >= 0, "Should handle mixed punctuation");

			const quotationErrors = result.detectedErrors.find(
				(error) => error.type === "quotation_inconsistencies",
			);
			if (quotationErrors) {
				assert.ok(
					quotationErrors.count > 0,
					"Should detect quotation inconsistencies",
				);
			}
		});

		it("handles technical jargon and acronyms", () => {
			const technicalText =
				"The API endpoints utilize REST principles and JSON data formats. The database implements ACID transactions with optimized SQL queries. Performance metrics indicate 99.9% uptime across distributed servers with load balancing algorithms that ensure optimal resource utilization.";

			const result = detectPerfectGrammar(technicalText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should analyze technical jargon",
			);
			assert.ok(result.wordCount > 0, "Should count technical terms correctly");
		});

		it("processes text with numbers and special characters", () => {
			const numbersText =
				"The system processes 1,000+ requests per second with 99.9% accuracy. Performance improved by 25% after optimization. The server handles 10GB of data efficiently and maintains stable operations across 24/7 monitoring cycles.";

			const result = detectPerfectGrammar(numbersText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle numbers and special characters",
			);
			assert.ok(result.wordCount > 20, "Should count mixed content correctly");
		});
	});

	describe("edge cases", () => {
		it("handles text with no errors gracefully", () => {
			const perfectText =
				"The comprehensive analytical framework systematically evaluates complex datasets through sophisticated methodologies. Advanced algorithms process information efficiently while maintaining optimal performance standards across diverse operational environments for various business applications and organizational requirements.";

			const result = detectPerfectGrammar(perfectText);

			assert.ok(
				result.totalErrors === 0,
				"Should correctly identify zero errors",
			);
			assert.ok(
				result.aiLikelihood > 0.7,
				"Should indicate high AI likelihood for perfect text",
			);
			assert.ok(
				result.perfectionScore > 80,
				"Should show high perfection score",
			);
		});

		it("handles text with maximum errors appropriately", () => {
			const errorText =
				"dis sistem iz relly gud an workz wel 4 most userz needs an stuf. itz knda slow sumtimez but overal iz okei fr basicc aplications. the team iz workng on improovments an their gonna maek it bettr soon fr evry1.";

			const result = detectPerfectGrammar(errorText);

			assert.ok(result.totalErrors > 2, "Should detect multiple errors");
			assert.ok(
				result.aiLikelihood < 0.5,
				"Should indicate very low AI likelihood",
			);
		});

		it("handles repetitive content patterns", () => {
			const repetitiveText =
				"The system works well and the system provides good performance. The system delivers results and the system maintains reliability. The system offers functionality and the system ensures quality for users across various applications.";

			const result = detectPerfectGrammar(repetitiveText, {
				includeDetails: true,
			});

			assert.ok(result.totalErrors >= 0, "Should handle repetitive patterns");

			const redundancyErrors = result.detectedErrors.find(
				(error) => error.type === "redundancy",
			);
			if (redundancyErrors) {
				assert.ok(
					redundancyErrors.count > 0,
					"Should detect redundancy in repetitive text",
				);
			}
		});

		it("handles single sentence input", () => {
			const singleSentence =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate comprehensive insights for informed decision-making processes across diverse organizational contexts and operational environments for various business applications.";

			const result = detectPerfectGrammar(singleSentence);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle single sentence",
			);
			assert.ok(result.wordCount > 25, "Should meet minimum word count");
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => detectPerfectGrammar(123),
				TypeError,
				"Should throw TypeError for number input",
			);

			assert.throws(
				() => detectPerfectGrammar(null),
				TypeError,
				"Should throw TypeError for null input",
			);

			assert.throws(
				() => detectPerfectGrammar(undefined),
				TypeError,
				"Should throw TypeError for undefined input",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => detectPerfectGrammar(""),
				/Cannot analyze empty text/,
				"Should throw error for empty string",
			);

			assert.throws(
				() => detectPerfectGrammar("   "),
				/Cannot analyze empty text/,
				"Should throw error for whitespace-only string",
			);
		});

		it("validates option parameters", () => {
			const validText =
				"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes for various applications.";

			assert.throws(
				() => detectPerfectGrammar(validText, { minWordCount: -1 }),
				/Parameter minWordCount must be a positive integer/,
				"Should validate minWordCount",
			);

			assert.throws(
				() => detectPerfectGrammar(validText, { minWordCount: 1.5 }),
				/Parameter minWordCount must be a positive integer/,
				"Should validate minWordCount is integer",
			);

			assert.throws(
				() =>
					detectPerfectGrammar(validText, { errorToleranceThreshold: -0.5 }),
				/Parameter errorToleranceThreshold must be a positive number/,
				"Should validate errorToleranceThreshold",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes standard text efficiently", () => {
			const text =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns. ".repeat(
					10,
				);

			const start = performance.now();
			const result = detectPerfectGrammar(text);
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should process text quickly");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales well with text length", () => {
			const baseText =
				"The comprehensive system provides advanced functionality that enhances operational efficiency. ";
			const shortText = baseText.repeat(30);
			const longText = baseText.repeat(300);

			// Run multiple times to reduce timing variance and JIT effects
			const runs = 3;
			let shortTotal = 0;
			let longTotal = 0;

			for (let i = 0; i < runs; i++) {
				const shortStart = performance.now();
				detectPerfectGrammar(shortText);
				shortTotal += performance.now() - shortStart;

				const longStart = performance.now();
				detectPerfectGrammar(longText);
				longTotal += performance.now() - longStart;
			}

			const shortAvg = shortTotal / runs;
			const longAvg = longTotal / runs;

			// More generous scaling threshold to account for timing variations
			assert.ok(
				longAvg < shortAvg * 100,
				"Should scale reasonably with text length",
			);
		});

		it("handles detailed analysis efficiently", () => {
			const complexText =
				"The interdisciplinary research methodology incorporates quantitative and qualitative approaches to investigate complex phenomena. ".repeat(
					25,
				);

			const start = performance.now();
			const result = detectPerfectGrammar(complexText, {
				includeDetails: true,
			});
			const duration = performance.now() - start;

			assert.ok(duration < 200, "Should handle detailed analysis efficiently");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});
	});
});
