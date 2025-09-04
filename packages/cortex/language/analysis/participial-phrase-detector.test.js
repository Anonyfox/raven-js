/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectParticipalPhraseFormula } from "./participial-phrase-detector.js";

describe("detectParticipalPhraseFormula", () => {
	describe("basic functionality", () => {
		it("detects participial phrase patterns correctly", () => {
			const text =
				"Optimized for performance, the system delivers exceptional results efficiently. Designed with scalability in mind, the architecture supports growing demands. Implemented using best practices, the solution ensures reliability across different platforms and environments.";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				typeof result.overallScore === "number",
				"Should return overall score",
			);
			assert.ok(
				typeof result.participialDensity === "number",
				"Should return participial density",
			);
			assert.ok(result.totalPatterns > 0, "Should detect participial patterns");
			assert.ok(result.wordCount > 25, "Should count words correctly");
			assert.ok(
				result.aiLikelihood > 0.3,
				"Should show moderate to high AI likelihood for participial text",
			);
		});

		it("returns low scores for natural syntax", () => {
			const text =
				"The author carefully examines narrative techniques in modern literature. Creative writers often experiment with different approaches to storytelling that enhance reader engagement. Each method offers unique advantages for character development and plot advancement.";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Should show low AI likelihood for natural syntax",
			);
			assert.ok(
				result.totalPatterns <= 1,
				"Should detect few or no participial patterns",
			);
			assert.ok(result.overallScore < 2, "Should show low overall score");
		});

		it("handles text with no participial patterns", () => {
			const text =
				"The research methodology involves careful analysis of multiple variables. Data collection spans several months with consistent sampling protocols. Results indicate significant patterns in user behavior that warrant further investigation through additional studies.";
			const result = detectParticipalPhraseFormula(text);

			assert.equal(
				result.totalPatterns,
				0,
				"Should detect no participial patterns",
			);
			assert.equal(
				result.participialDensity,
				0,
				"Should have zero participial density",
			);
			assert.ok(
				result.aiLikelihood < 0.1,
				"Should show very low AI likelihood",
			);
			assert.equal(result.overallScore, 0, "Should have zero overall score");
		});

		it("calculates word count correctly", () => {
			const text =
				"One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five words total here";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				result.wordCount >= 25,
				"Should count all words including hyphenated",
			);
		});
	});

	describe("pattern detection accuracy", () => {
		it("detects sentence-initial participial phrases", () => {
			const text =
				"Running the comprehensive analysis, the system processes multiple data streams. Working through complex algorithms, the application delivers optimal results. Processing large datasets efficiently, the framework maintains consistent performance across different platforms and environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const ingPattern = result.detectedPatterns.find(
				(p) => p.pattern === "sentence_initial_ing",
			);
			assert.ok(ingPattern, "Should detect sentence-initial -ing patterns");
			assert.ok(
				ingPattern.count >= 2,
				"Should count multiple -ing occurrences",
			);
		});

		it("detects mechanical construction phrases", () => {
			const text =
				"Optimized for maximum efficiency, the system delivers exceptional performance. Designed with scalability in mind, the architecture supports growing demands. Built to handle complex workflows, the platform ensures reliable operation across different environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const optimizedPattern = result.detectedPatterns.find(
				(p) => p.pattern === "optimized_constructed",
			);
			const designedPattern = result.detectedPatterns.find(
				(p) => p.pattern === "designed_built",
			);

			assert.ok(
				optimizedPattern || designedPattern,
				"Should detect mechanical construction patterns",
			);
		});

		it("detects technical participial phrases", () => {
			const text =
				"Leveraging advanced algorithms, the system optimizes performance automatically. Utilizing machine learning techniques, the platform adapts to changing requirements. Implementing best practices, the solution ensures robust operation across different environments and platforms.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const technicalPattern = result.detectedPatterns.find(
				(p) => p.pattern === "technical_participles",
			);
			assert.ok(
				technicalPattern,
				"Should detect technical participial patterns",
			);
		});

		it("detects having and being constructions", () => {
			const text =
				"Having completed the comprehensive analysis, the team presents findings. Being careful to maintain accuracy, researchers validate all results. Having evaluated multiple approaches, the experts recommend optimal solutions for different environments and platforms.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const havingPattern = result.detectedPatterns.find(
				(p) => p.pattern === "having_constructions",
			);
			const beingPattern = result.detectedPatterns.find(
				(p) => p.pattern === "being_constructions",
			);

			assert.ok(
				havingPattern || beingPattern,
				"Should detect having/being constructions",
			);
		});

		it("detects past participle constructions", () => {
			const text =
				"Completed by the development team, the project meets all requirements. Created using modern frameworks, the application ensures scalability. Written by experienced developers, the code maintains high quality standards across different modules and components.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const passivePattern = result.detectedPatterns.find(
				(p) => p.pattern === "past_participle_passive",
			);
			assert.ok(
				passivePattern,
				"Should detect past participle passive patterns",
			);
		});

		it("detects repeated participial forms", () => {
			const text =
				"Processing data efficiently, the system maintains performance. Processing multiple requests simultaneously, the server handles load effectively. Processing complex algorithms continuously, the application delivers results. Testing shows processing capabilities across different environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const repeatedPattern = result.detectedPatterns.find(
				(p) => p.pattern === "repeated_participle_forms",
			);
			assert.ok(
				repeatedPattern,
				"Should detect repeated participial form usage",
			);
		});

		it("detects mechanical participial sequences", () => {
			const text =
				"Optimized for performance, the system delivers results. Designed for scalability, the architecture supports growth. Built for reliability, the platform ensures stability. Configured for efficiency, the solution maximizes throughput across different environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const sequencePattern = result.detectedPatterns.find(
				(p) => p.pattern === "mechanical_participle_sequences",
			);
			assert.ok(
				sequencePattern,
				"Should detect mechanical participial sequences",
			);
		});

		it("detects academic and business participles", () => {
			const text =
				"Examining the comprehensive data reveals significant trends. Streamlining operations improves efficiency dramatically. Investigating multiple variables provides deeper insights. Optimizing processes enhances overall performance across different business units and operational environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const academicPattern = result.detectedPatterns.find(
				(p) => p.pattern === "academic_participles",
			);
			const businessPattern = result.detectedPatterns.find(
				(p) => p.pattern === "business_participles",
			);

			assert.ok(
				academicPattern || businessPattern,
				"Should detect academic/business participial patterns",
			);
		});
	});

	describe("parameter variations", () => {
		it("respects minimum word count requirement", () => {
			const shortText = "Optimized for speed, running efficiently.";

			assert.throws(
				() => detectParticipalPhraseFormula(shortText, { minWordCount: 15 }),
				Error,
				"Should reject text below minimum word count",
			);
		});

		it("includes detailed pattern information when requested", () => {
			const text =
				"Optimized for maximum performance, the system delivers exceptional results. Designed with advanced architecture, the platform supports complex operations. Implemented using best practices, the solution ensures reliable functionality across different environments.";

			const withDetails = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});
			const withoutDetails = detectParticipalPhraseFormula(text, {
				includeDetails: false,
			});

			assert.ok(
				withDetails.detectedPatterns.length > 0,
				"Should include pattern details",
			);
			assert.equal(
				withoutDetails.detectedPatterns.length,
				0,
				"Should not include details by default",
			);

			// Check detail structure
			const firstPattern = withDetails.detectedPatterns[0];
			assert.ok(
				typeof firstPattern.pattern === "string",
				"Should include pattern name",
			);
			assert.ok(typeof firstPattern.count === "number", "Should include count");
			assert.ok(
				typeof firstPattern.frequency === "number",
				"Should include frequency",
			);
			assert.ok(typeof firstPattern.ratio === "number", "Should include ratio");
			assert.ok(
				typeof firstPattern.overuseLevel === "string",
				"Should include overuse level",
			);
			assert.ok(
				typeof firstPattern.description === "string",
				"Should include description",
			);
		});

		it("allows custom sensitivity threshold", () => {
			const text =
				"Optimized for performance, the system operates efficiently. Processing data continuously, the application maintains responsiveness. Working through complex algorithms, the platform delivers consistent results across different environments and operational scenarios.";

			const sensitive = detectParticipalPhraseFormula(text, {
				sensitivityThreshold: 1.5,
			});
			const normal = detectParticipalPhraseFormula(text, {
				sensitivityThreshold: 2.0,
			});
			const tolerant = detectParticipalPhraseFormula(text, {
				sensitivityThreshold: 3.0,
			});

			assert.ok(
				sensitive.totalPatterns >= normal.totalPatterns,
				"Lower threshold should detect more patterns",
			);
			assert.ok(
				normal.totalPatterns >= tolerant.totalPatterns,
				"Higher threshold should detect fewer patterns",
			);
		});

		it("allows custom minimum word count", () => {
			const text = "Optimized for speed, running efficiently.";

			const result = detectParticipalPhraseFormula(text, { minWordCount: 5 });
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should work with low minimum",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"Optimized for performance, the system delivers results efficiently. Designed for efficiency, the platform supports operations effectively. Built for reliability, the solution ensures stability across different environments and platforms.",
				"Natural writing flows organically without mechanical patterns that force artificial syntax into predetermined structures that may not serve the content effectively or enhance reader comprehension and engagement.",
				"Running comprehensive tests, the system validates functionality consistently. Processing multiple datasets, the application maintains performance. Analyzing complex algorithms, the platform delivers insights across different operational environments and platforms.",
			];

			for (const text of texts) {
				const result = detectParticipalPhraseFormula(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.overallScore >= 0,
					"Overall score should be non-negative",
				);
				assert.ok(
					result.participialDensity >= 0,
					"Participial density should be non-negative",
				);
				assert.ok(
					result.totalPatterns >= 0,
					"Total patterns should be non-negative",
				);
				assert.ok(result.wordCount > 0, "Word count should be positive");
			}
		});

		it("calculates frequencies correctly", () => {
			const text =
				"Optimized for maximum performance, the system delivers exceptional results efficiently. Designed with scalability in mind, the architecture supports growing demands across different platforms and environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			// Verify frequency calculations
			for (const pattern of result.detectedPatterns) {
				const expectedFrequency = (pattern.count / result.wordCount) * 1000;
				assert.ok(
					Math.abs(pattern.frequency - expectedFrequency) < 0.01,
					"Frequency calculation should be accurate",
				);
			}
		});

		it("sorts patterns by ratio when details included", () => {
			const text =
				"Optimized for performance, the system operates efficiently. Designed for scalability, the architecture handles growth. Built for reliability, the platform ensures stability. Implemented using best practices across different environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			// Check that patterns are sorted by ratio (descending)
			for (let i = 1; i < result.detectedPatterns.length; i++) {
				assert.ok(
					result.detectedPatterns[i - 1].ratio >=
						result.detectedPatterns[i].ratio,
					"Patterns should be sorted by ratio descending",
				);
			}
		});

		it("assigns appropriate overuse levels", () => {
			const text =
				"Optimized for maximum efficiency, the system delivers results. Designed with advanced features, the platform supports operations. Built using modern techniques, the solution ensures reliability. Implemented with best practices across different environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			const hasOveruseLevels = result.detectedPatterns.some(
				(p) =>
					p.overuseLevel === "moderate" ||
					p.overuseLevel === "high" ||
					p.overuseLevel === "severe",
			);
			assert.ok(
				hasOveruseLevels,
				"Should assign appropriate overuse level categories",
			);
		});

		it("handles high participial density correctly", () => {
			const text =
				"Optimized for performance, the system operates efficiently. Designed for scalability, the platform handles growth. Built for reliability, the solution ensures stability. Configured for efficiency, the application maximizes throughput. Implemented using best practices across environments.";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				result.aiLikelihood > 0.7,
				"High participial density should result in high AI likelihood",
			);
			assert.ok(
				result.totalPatterns > 4,
				"Should detect many participial patterns",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated technical documentation", () => {
			const aiText = `
				Optimized for maximum performance, the system delivers exceptional results across different platforms.
				Designed with scalability in mind, the architecture supports growing demands effectively. Implemented
				using industry best practices, the solution ensures reliable operation. Leveraging advanced algorithms,
				the platform processes data efficiently while maintaining high throughput rates.
			`;
			const result = detectParticipalPhraseFormula(aiText);

			assert.ok(
				result.aiLikelihood > 0.6,
				"AI technical documentation should show high AI likelihood",
			);
			assert.ok(
				result.totalPatterns > 3,
				"Should detect multiple participial patterns",
			);
			assert.ok(
				result.participialDensity > 6,
				"Should have high participial density",
			);
		});

		it("analyzes human-written creative prose", () => {
			const humanText = `
				The protagonist wandered through unfamiliar streets, observing the interplay between
				architecture and human behavior. Some buildings stood as monuments to past ambitions,
				while others reflected contemporary values. The narrative structure shifts between
				present observations and fragmented memories, creating a complex temporal landscape
				that mirrors the character's evolving understanding of place and identity.
			`;
			const result = detectParticipalPhraseFormula(humanText);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Human creative prose should show low AI likelihood",
			);
			assert.ok(
				result.totalPatterns <= 1,
				"Should detect few or no participial patterns",
			);
		});

		it("analyzes business communication", () => {
			const businessText = `
				Our quarterly review indicates strong performance across multiple metrics and operational areas.
				Revenue growth exceeded expectations while maintaining operational efficiency throughout the period.
				Customer satisfaction surveys reveal positive trends in service delivery and product quality.
				The management team recommends continuing current strategies while exploring new market opportunities
				that align with corporate objectives and stakeholder expectations.
			`;
			const result = detectParticipalPhraseFormula(businessText);

			assert.ok(
				result.aiLikelihood < 0.6,
				"Business text should show low to moderate AI likelihood",
			);
		});

		it("analyzes AI-generated marketing content", () => {
			const marketingText = `
				Designed to revolutionize your workflow, our platform delivers unprecedented efficiency gains.
				Built with cutting-edge technology, the solution transforms how businesses operate daily.
				Optimized for maximum performance, the system provides seamless integration capabilities.
				Leveraging artificial intelligence, the platform automates complex processes while ensuring
				reliability and scalability across different organizational environments.
			`;
			const result = detectParticipalPhraseFormula(marketingText);

			assert.ok(
				result.aiLikelihood > 0.8,
				"AI marketing content should show very high AI likelihood",
			);
			assert.ok(
				result.totalPatterns > 4,
				"Should detect many participial marketing patterns",
			);
		});
	});

	describe("multilingual and special content", () => {
		it("handles mixed language content", () => {
			const mixedText =
				"Optimized for performance, the système delivers results efficiently. Designed with Geschwindigkeit in mind, the platform supports operations. Built for надежность, the solution ensures stability across different международные environments.";
			const result = detectParticipalPhraseFormula(mixedText);

			assert.ok(
				result.aiLikelihood > 0.4,
				"Should detect participial patterns in mixed content",
			);
			assert.ok(
				result.totalPatterns >= 1,
				"Should find participial organizational patterns",
			);
		});

		it("processes text with technical jargon", () => {
			const text =
				"Configured with advanced parameters, the algorithm optimizes performance automatically. Implemented using microservices architecture, the system scales horizontally. Deployed across multiple data centers, the application ensures high availability and fault tolerance.";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				result.totalPatterns >= 2,
				"Should detect patterns in technical jargon",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});

		it("handles text with code-related terminology", () => {
			const text =
				"Implemented using modern frameworks, the application ensures scalability. Deployed with containerization, the system supports cloud environments. Configured for high availability, the infrastructure handles traffic spikes across different geographical regions.";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				result.totalPatterns >= 2,
				"Should detect patterns in code-related text",
			);
		});

		it("processes academic writing styles", () => {
			const academicText =
				"Examining the comprehensive dataset reveals significant patterns. Analyzing multiple variables provides deeper insights. Investigating various methodologies ensures robust conclusions. Considering alternative approaches enhances research validity across different academic disciplines and research contexts.";
			const result = detectParticipalPhraseFormula(academicText);

			assert.ok(result.wordCount > 25, "Should process academic text");
			assert.ok(
				result.totalPatterns > 0,
				"Should detect academic participial patterns",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});
	});

	describe("edge cases", () => {
		it("handles text with complex participial constructions", () => {
			const text =
				"Having been optimized for performance while maintaining compatibility, the system delivers results. Being simultaneously designed for scalability and reliability, the architecture supports various operational demands across different platforms and environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			assert.ok(
				result.totalPatterns > 0,
				"Should handle complex participial constructions",
			);
		});

		it("processes very long text efficiently", () => {
			const baseText =
				"Optimized for performance, the system operates efficiently. Designed for scalability, the platform handles growth. Built for reliability, the solution ensures stability. ";
			const longText = baseText.repeat(50);

			const start = performance.now();
			const result = detectParticipalPhraseFormula(longText);
			const duration = performance.now() - start;

			assert.ok(duration < 400, "Should process long text under 400ms");
			assert.ok(
				result.totalPatterns > 10,
				"Should detect many patterns in long text",
			);
		});

		it("handles text with only participial patterns", () => {
			const text =
				"Optimized for speed, running efficiently. Designed for performance, operating smoothly. Built for reliability, functioning consistently. Configured for efficiency, executing perfectly. Implemented for scalability, supporting growth across different operational environments.";
			const result = detectParticipalPhraseFormula(text);

			assert.ok(
				result.aiLikelihood > 0.8,
				"Text with only participial patterns should have very high likelihood",
			);
			assert.ok(
				result.participialDensity > 12,
				"Should have very high participial density",
			);
		});

		it("processes text with minimal participial patterns", () => {
			const text =
				"The research explores various methodologies for data analysis across multiple domains. Investigation reveals complex relationships between variables that influence outcomes. Findings suggest nuanced approaches may yield better results than simplified models for comprehensive understanding.";
			const result = detectParticipalPhraseFormula(text);

			assert.equal(
				result.totalPatterns,
				0,
				"Should not detect patterns in non-participial text",
			);
		});

		it("handles text with irregular participial forms", () => {
			const text =
				"Built to handle complex workflows, the system ensures reliability. Made from robust components, the architecture supports scalability. Done with precision, the implementation guarantees performance. Written by experts, the code maintains high quality across different environments.";
			const result = detectParticipalPhraseFormula(text, {
				includeDetails: true,
			});

			assert.ok(
				result.totalPatterns >= 1,
				"Should detect irregular participial patterns",
			);
		});

		it("processes text with false positive potential", () => {
			const text =
				"The running water flowed through the designed landscape. The finished product met all requirements effectively. The established protocol ensures consistent results. The implemented solution provides reliable functionality across different operational environments.";
			const result = detectParticipalPhraseFormula(text);

			// Should distinguish between participial and adjectival uses
			assert.ok(
				result.aiLikelihood < 0.7,
				"Should avoid excessive false positives for adjectival uses",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => detectParticipalPhraseFormula(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => detectParticipalPhraseFormula(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => detectParticipalPhraseFormula(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => detectParticipalPhraseFormula([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => detectParticipalPhraseFormula({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => detectParticipalPhraseFormula(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => detectParticipalPhraseFormula("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for insufficient text length", () => {
			const shortText = "Optimized for speed.";
			assert.throws(
				() => detectParticipalPhraseFormula(shortText),
				Error,
				"Should reject text below default minimum",
			);
		});

		it("throws Error for invalid options", () => {
			const validText =
				"Optimized for maximum performance, the system delivers exceptional results efficiently. Designed with scalability in mind, the architecture supports growing demands across different platforms and environments.";

			assert.throws(
				() => detectParticipalPhraseFormula(validText, { minWordCount: 0 }),
				Error,
				"Should reject zero minimum word count",
			);
			assert.throws(
				() => detectParticipalPhraseFormula(validText, { minWordCount: -1 }),
				Error,
				"Should reject negative minimum word count",
			);
			assert.throws(
				() => detectParticipalPhraseFormula(validText, { minWordCount: 1.5 }),
				Error,
				"Should reject fractional minimum word count",
			);
			assert.throws(
				() =>
					detectParticipalPhraseFormula(validText, {
						sensitivityThreshold: 0,
					}),
				Error,
				"Should reject zero sensitivity threshold",
			);
			assert.throws(
				() =>
					detectParticipalPhraseFormula(validText, {
						sensitivityThreshold: -1,
					}),
				Error,
				"Should reject negative sensitivity threshold",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText =
				"Optimized for performance, the system delivers results efficiently. Designed for scalability, the architecture supports growth effectively. Built for reliability, the solution ensures stability. ".repeat(
					25,
				);
			const start = performance.now();
			const result = detectParticipalPhraseFormula(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should process medium text under 100ms");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales well with text length", () => {
			const baseText =
				"Optimized for performance, the system operates efficiently. Designed for scalability, maintaining high performance standards. ";
			const shortText = baseText.repeat(5);
			const longText = baseText.repeat(50);

			// Run multiple times to reduce timing variance and JIT effects
			const runs = 3;
			let shortTotal = 0;
			let longTotal = 0;

			for (let i = 0; i < runs; i++) {
				const shortStart = performance.now();
				detectParticipalPhraseFormula(shortText);
				shortTotal += performance.now() - shortStart;

				const longStart = performance.now();
				detectParticipalPhraseFormula(longText);
				longTotal += performance.now() - longStart;
			}

			const shortAvg = shortTotal / runs;
			const longAvg = longTotal / runs;

			// More generous scaling threshold to account for timing variations
			assert.ok(
				longAvg < shortAvg * 60,
				"Should scale reasonably with text length",
			);
		});

		it("handles pattern-dense text efficiently", () => {
			const denseText =
				"Optimized for performance, running efficiently. Designed for scalability, handling growth. Built for reliability, ensuring stability. Configured for efficiency, maximizing throughput. ".repeat(
					15,
				);

			const start = performance.now();
			const result = detectParticipalPhraseFormula(denseText, {
				includeDetails: true,
			});
			const duration = performance.now() - start;

			assert.ok(duration < 150, "Should handle pattern-dense text efficiently");
			assert.ok(
				result.detectedPatterns.length > 0,
				"Should detect many pattern types",
			);
		});
	});
});
