/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectRuleOfThreeObsession } from "./rule-of-three-detector.js";

describe("detectRuleOfThreeObsession", () => {
	describe("basic functionality", () => {
		it("detects triadic patterns correctly", () => {
			const text =
				"There are three main benefits to this approach: efficiency, scalability, and reliability. First, the system improves performance through advanced algorithms. Second, it reduces operational costs significantly. Third, it enhances user experience across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				typeof result.overallScore === "number",
				"Should return overall score",
			);
			assert.ok(
				typeof result.triadicDensity === "number",
				"Should return triadic density",
			);
			assert.ok(result.totalPatterns > 0, "Should detect triadic patterns");
			assert.ok(result.wordCount > 30, "Should count words correctly");
			assert.ok(
				result.aiLikelihood > 0.3,
				"Should show moderate to high AI likelihood for triadic text",
			);
		});

		it("returns low scores for natural organization", () => {
			const text =
				"The author explores different narrative techniques in modern literature. Some writers prefer chronological structure while others experiment with non-linear approaches that challenge reader expectations. Character development varies significantly between authors, with some focusing on psychological depth and others emphasizing plot-driven storytelling that maintains reader engagement.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Should show low AI likelihood for natural organization",
			);
			assert.ok(
				result.totalPatterns <= 1,
				"Should detect few or no triadic patterns",
			);
			assert.ok(result.overallScore < 2, "Should show low overall score");
		});

		it("handles text with no triadic patterns", () => {
			const text =
				"The research methodology involves careful analysis of multiple variables. Data collection spans several months with consistent sampling protocols. Results indicate significant patterns in user behavior that warrant further investigation through additional studies and comprehensive analysis of emerging trends.";
			const result = detectRuleOfThreeObsession(text);

			assert.equal(
				result.totalPatterns,
				0,
				"Should detect no triadic patterns",
			);
			assert.equal(
				result.triadicDensity,
				0,
				"Should have zero triadic density",
			);
			assert.ok(
				result.aiLikelihood < 0.1,
				"Should show very low AI likelihood",
			);
			assert.equal(result.overallScore, 0, "Should have zero overall score");
		});

		it("calculates word count correctly", () => {
			const text =
				"One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight twenty-nine thirty thirty-one thirty-two words total";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.wordCount >= 30,
				"Should count all words including hyphenated",
			);
		});
	});

	describe("pattern detection accuracy", () => {
		it("detects three-item list patterns", () => {
			const text =
				"The system offers efficiency, scalability, and reliability for modern applications. Users benefit from speed, accuracy, and convenience in their daily workflows. Performance improvements include faster processing, reduced memory usage, and enhanced security across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const listPattern = result.detectedPatterns.find(
				(p) => p.pattern === "three_item_lists",
			);
			assert.ok(listPattern, "Should detect three-item list pattern");
			assert.ok(
				listPattern.count >= 2,
				"Should count multiple list occurrences",
			);
		});

		it("detects numbered list patterns", () => {
			const text =
				"The process involves three steps for optimal results. First, analyze the requirements thoroughly. Second, implement the solution using best practices. Third, test the system across different environments to ensure reliability and performance across various platforms and configurations.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const numberedPattern = result.detectedPatterns.find(
				(p) =>
					p.pattern === "numbered_three_lists" ||
					p.pattern === "first_second_third",
			);
			assert.ok(numberedPattern, "Should detect numbered sequence pattern");
		});

		it("detects explicit three mentions", () => {
			const text =
				"There are three benefits to this approach for modern applications. The solution provides three ways to solve complex problems efficiently. Analysis reveals three types of user behavior patterns that impact system performance and user experience across different platforms.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const benefitsPattern = result.detectedPatterns.find(
				(p) => p.pattern === "three_benefits",
			);
			const waysPattern = result.detectedPatterns.find(
				(p) => p.pattern === "three_ways",
			);
			const typesPattern = result.detectedPatterns.find(
				(p) => p.pattern === "three_types",
			);

			assert.ok(benefitsPattern, "Should detect 'three benefits' pattern");
			assert.ok(waysPattern, "Should detect 'three ways' pattern");
			assert.ok(typesPattern, "Should detect 'three types' pattern");
		});

		it("detects adjective groupings", () => {
			const text =
				"The solution is fast, efficient, and reliable for enterprise applications. The interface design is clean, intuitive, and responsive across different devices. System performance remains stable, consistent, and predictable under various load conditions and user scenarios.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const adjectivePattern = result.detectedPatterns.find(
				(p) => p.pattern === "three_adjectives",
			);
			assert.ok(adjectivePattern, "Should detect three-adjective pattern");
			assert.ok(
				adjectivePattern.count >= 2,
				"Should count multiple adjective groups",
			);
		});

		it("detects sequential transition patterns", () => {
			const text =
				"Initially, the system performs basic validation checks on user input. Then, it processes the data through multiple algorithms for optimization. Finally, the results are formatted and delivered to the user interface for display across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const sequentialPattern = result.detectedPatterns.find(
				(p) => p.pattern === "initially_then_finally",
			);
			assert.ok(
				sequentialPattern,
				"Should detect sequential transition pattern",
			);
		});

		it("detects example groupings", () => {
			const text =
				"The framework supports multiple languages, for example, JavaScript, Python, and Java for comprehensive development. Modern applications utilize various technologies such as React, Angular, and Vue for frontend development across different platforms and user scenarios.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const examplePattern = result.detectedPatterns.find(
				(p) => p.pattern === "for_example_three",
			);
			const suchAsPattern = result.detectedPatterns.find(
				(p) => p.pattern === "such_as_three",
			);

			assert.ok(
				examplePattern || suchAsPattern,
				"Should detect example grouping patterns",
			);
		});

		it("detects sentence structure patterns", () => {
			const text =
				"The system processes user input, validates data integrity, and generates appropriate responses for optimal performance. Performance monitoring tracks response times, analyzes error rates, and identifies bottlenecks for system optimization. Quality assurance involves testing functionality, verifying security measures, and ensuring compatibility across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			const clausePattern = result.detectedPatterns.find(
				(p) =>
					p.pattern === "three_clause_sentences" ||
					p.pattern === "three_phrase_sentences",
			);
			assert.ok(clausePattern, "Should detect sentence structure patterns");
		});
	});

	describe("parameter variations", () => {
		it("respects minimum word count requirement", () => {
			const shortText = "Three benefits: speed, efficiency, reliability.";

			assert.throws(
				() => detectRuleOfThreeObsession(shortText, { minWordCount: 15 }),
				Error,
				"Should reject text below minimum word count",
			);
		});

		it("includes detailed pattern information when requested", () => {
			const text =
				"There are three main advantages to this systematic approach for modern applications. First, efficiency improves through optimized algorithms. Second, scalability increases with modular architecture. Third, reliability enhances through comprehensive testing and validation processes.";

			const withDetails = detectRuleOfThreeObsession(text, {
				includeDetails: true,
			});
			const withoutDetails = detectRuleOfThreeObsession(text, {
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
				"The system provides efficiency, accuracy, and speed for optimal performance across different environments. Analysis shows three types of user behavior patterns that impact system functionality. These patterns include navigation preferences, interaction styles, and engagement levels with comprehensive testing and validation processes.";

			const sensitive = detectRuleOfThreeObsession(text, {
				sensitivityThreshold: 1.5,
			});
			const normal = detectRuleOfThreeObsession(text, {
				sensitivityThreshold: 2.0,
			});
			const tolerant = detectRuleOfThreeObsession(text, {
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
			const text =
				"Three benefits: speed, efficiency, and reliability for optimal performance.";

			const result = detectRuleOfThreeObsession(text, { minWordCount: 5 });
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should work with low minimum",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"There are three main benefits to this comprehensive approach: efficiency, scalability, and reliability. First, the system improves performance significantly. Second, it reduces operational costs. Third, it enhances user experience across different platforms and environments.",
				"Natural writing flows organically without mechanical patterns that force artificial organization into predetermined structures that may not serve the content effectively or enhance reader comprehension and engagement through thoughtful presentation.",
				"Multiple advantages include first improved performance, second reduced complexity, and third enhanced usability. Three types of optimization provide efficiency, speed, and accuracy for comprehensive system benefits across different environments and platforms.",
			];

			for (const text of texts) {
				const result = detectRuleOfThreeObsession(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.overallScore >= 0,
					"Overall score should be non-negative",
				);
				assert.ok(
					result.triadicDensity >= 0,
					"Triadic density should be non-negative",
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
				"There are three benefits to this systematic approach for modern applications: efficiency, scalability, and reliability. The solution provides three ways to optimize performance through comprehensive testing and validation processes across different environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

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
				"Three benefits include efficiency, speed, and accuracy for optimal performance. First, systems improve through optimization. Second, users benefit from enhanced functionality. Third, costs reduce through automation across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

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
				"Three types of optimization include first performance enhancement, second memory efficiency, and third processing speed. Three benefits provide efficiency, scalability, and reliability. Three ways to improve include optimization, automation, and integration across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

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

		it("handles high triadic density correctly", () => {
			const text =
				"Three benefits include efficiency, speed, and accuracy. First, systems optimize performance. Second, users gain functionality. Third, costs reduce significantly. Three types provide scalability, reliability, and maintainability. Three ways include automation, optimization, and integration across platforms.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.aiLikelihood > 0.7,
				"High triadic density should result in high AI likelihood",
			);
			assert.ok(
				result.totalPatterns > 4,
				"Should detect many triadic patterns",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated instructional text", () => {
			const aiText = `
				To improve system performance, follow these three steps for optimal results. First, analyze
				current bottlenecks through comprehensive monitoring. Second, implement optimization strategies
				using best practices. Third, validate improvements through rigorous testing. This approach
				provides three main benefits: efficiency, scalability, and reliability across different platforms.
			`;
			const result = detectRuleOfThreeObsession(aiText);

			assert.ok(
				result.aiLikelihood > 0.6,
				"AI instructional text should show high AI likelihood",
			);
			assert.ok(
				result.totalPatterns > 2,
				"Should detect multiple triadic patterns",
			);
			assert.ok(result.triadicDensity > 8, "Should have high triadic density");
		});

		it("analyzes human-written narrative text", () => {
			const humanText = `
				The protagonist wandered through unfamiliar streets, observing the interplay between
				architecture and human behavior. Some buildings stood as monuments to past ambitions,
				while others reflected contemporary values. The narrative structure shifts between
				present observations and fragmented memories, creating a complex temporal landscape
				that mirrors the character's internal state and evolving understanding of place.
			`;
			const result = detectRuleOfThreeObsession(humanText);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Human narrative text should show low AI likelihood",
			);
			assert.ok(
				result.totalPatterns <= 1,
				"Should detect few or no triadic patterns",
			);
		});

		it("analyzes business communication", () => {
			const businessText = `
				Our quarterly review indicates strong performance across multiple metrics. Revenue
				growth exceeded expectations while maintaining operational efficiency. Customer
				satisfaction surveys reveal positive trends in service delivery and product quality.
				The management team recommends continuing current strategies while exploring new
				market opportunities that align with corporate objectives and stakeholder expectations.
			`;
			const result = detectRuleOfThreeObsession(businessText);

			assert.ok(
				result.aiLikelihood < 0.4,
				"Business text should show low to moderate AI likelihood",
			);
		});

		it("analyzes AI-generated marketing copy", () => {
			const marketingText = `
				Our platform delivers three key advantages for modern businesses: efficiency,
				scalability, and innovation. First, streamline operations through automation.
				Second, expand capacity without increasing overhead. Third, leverage cutting-edge
				technology for competitive advantage. Experience three types of transformation:
				operational excellence, cost reduction, and market leadership across different industries.
			`;
			const result = detectRuleOfThreeObsession(marketingText);

			assert.ok(
				result.aiLikelihood > 0.8,
				"AI marketing copy should show very high AI likelihood",
			);
			assert.ok(
				result.totalPatterns > 3,
				"Should detect many triadic marketing patterns",
			);
		});
	});

	describe("multilingual and special content", () => {
		it("handles mixed language content", () => {
			const mixedText =
				"The système provides three benefits: efficiency, Geschwindigkeit, and надежность for global applications. First, performance improves across different платформы. Second, users gain functionality. Third, costs reduce effectively across various международные markets and environments.";
			const result = detectRuleOfThreeObsession(mixedText);

			assert.ok(
				result.aiLikelihood > 0.4,
				"Should detect triadic patterns in mixed content",
			);
			assert.ok(
				result.totalPatterns >= 1,
				"Should find triadic organizational patterns",
			);
		});

		it("processes text with technical terminology", () => {
			const text =
				"The algorithm optimizes three parameters: latency, throughput, and memory utilization for enhanced performance. Implementation involves first initializing data structures, second processing input efficiently, and third generating optimized output across different computational environments and platforms.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.totalPatterns >= 2,
				"Should detect patterns in technical text",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});

		it("handles text with code examples", () => {
			const text =
				"The function accepts three parameters: input, options, and callback for flexible operation. Programming involves three phases: first design the algorithm, second implement the solution, and third test the functionality across different environments and platforms with comprehensive validation.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.totalPatterns >= 2,
				"Should detect patterns in code-related text",
			);
		});

		it("processes academic writing styles", () => {
			const academicText =
				"Research methodology encompasses three approaches: quantitative analysis, qualitative assessment, and mixed methods for comprehensive investigation. The study examines three variables: performance metrics, user satisfaction, and system reliability across different academic institutions and research environments.";
			const result = detectRuleOfThreeObsession(academicText);

			assert.ok(result.wordCount > 25, "Should process academic text");
			assert.ok(
				result.totalPatterns > 0,
				"Should detect triadic academic patterns",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});
	});

	describe("edge cases", () => {
		it("handles text with nested triadic patterns", () => {
			const text =
				"The framework provides three categories of benefits: first performance improvements including speed, efficiency, and reliability, second cost reductions through automation, optimization, and resource management, and third user experience enhancements via interface design, functionality expansion, and accessibility improvements across different platforms.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			assert.ok(
				result.totalPatterns > 0,
				"Should handle nested triadic patterns",
			);
		});

		it("processes very long text efficiently", () => {
			const baseText =
				"Three benefits include efficiency, speed, and accuracy for optimal performance. First, systems improve through optimization. Second, users benefit from enhanced functionality. Third, costs reduce through automation. ";
			const longText = baseText.repeat(50);

			const start = performance.now();
			const result = detectRuleOfThreeObsession(longText);
			const duration = performance.now() - start;

			assert.ok(duration < 200, "Should process long text under 200ms");
			assert.ok(
				result.totalPatterns > 10,
				"Should detect many patterns in long text",
			);
		});

		it("handles text with only triadic patterns", () => {
			const text =
				"Three benefits include efficiency, speed, and accuracy for optimal performance. First improvement involves enhanced performance optimization. Second advantage provides significant cost reduction. Third benefit ensures user satisfaction. Three types include automation, optimization, and integration across different platforms and computational environments.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.aiLikelihood > 0.8,
				"Text with only triadic patterns should have very high likelihood",
			);
			assert.ok(
				result.triadicDensity > 15,
				"Should have very high triadic density",
			);
		});

		it("processes text with minimal triadic patterns", () => {
			const text =
				"The research explores various methodologies for data analysis across multiple domains. Investigation reveals complex relationships between variables that influence outcomes. Findings suggest nuanced approaches may yield better results than simplified models for comprehensive understanding and practical applications.";
			const result = detectRuleOfThreeObsession(text);

			assert.equal(
				result.totalPatterns,
				0,
				"Should not detect patterns in non-triadic text",
			);
		});

		it("handles text with partial triadic patterns", () => {
			const text =
				"The system offers efficiency and reliability for modern applications across different environments. Two main approaches include automation and optimization for enhanced performance. System performance improves through careful analysis and systematic implementation across different platforms and environments with comprehensive testing.";
			const result = detectRuleOfThreeObsession(text);

			assert.ok(
				result.totalPatterns <= 1,
				"Should not detect incomplete triadic patterns",
			);
		});

		it("processes text with alternative numbering", () => {
			const text =
				"The approach involves multiple phases: a) initial analysis, b) implementation planning, c) execution and validation. Alternative methods include first systematic review, second design optimization, and third comprehensive testing across different platforms and environments.";
			const result = detectRuleOfThreeObsession(text, { includeDetails: true });

			assert.ok(
				result.totalPatterns >= 1,
				"Should detect alternative numbering patterns",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => detectRuleOfThreeObsession(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => detectRuleOfThreeObsession(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => detectRuleOfThreeObsession(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => detectRuleOfThreeObsession([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => detectRuleOfThreeObsession({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => detectRuleOfThreeObsession(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => detectRuleOfThreeObsession("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for insufficient text length", () => {
			const shortText = "Three benefits: speed, efficiency, reliability.";
			assert.throws(
				() => detectRuleOfThreeObsession(shortText),
				Error,
				"Should reject text below default minimum",
			);
		});

		it("throws Error for invalid options", () => {
			const validText =
				"There are three main benefits to this comprehensive approach for modern applications: efficiency, scalability, and reliability. The system provides optimal performance through systematic optimization and comprehensive testing.";

			assert.throws(
				() => detectRuleOfThreeObsession(validText, { minWordCount: 0 }),
				Error,
				"Should reject zero minimum word count",
			);
			assert.throws(
				() => detectRuleOfThreeObsession(validText, { minWordCount: -1 }),
				Error,
				"Should reject negative minimum word count",
			);
			assert.throws(
				() => detectRuleOfThreeObsession(validText, { minWordCount: 1.5 }),
				Error,
				"Should reject fractional minimum word count",
			);
			assert.throws(
				() =>
					detectRuleOfThreeObsession(validText, { sensitivityThreshold: 0 }),
				Error,
				"Should reject zero sensitivity threshold",
			);
			assert.throws(
				() =>
					detectRuleOfThreeObsession(validText, { sensitivityThreshold: -1 }),
				Error,
				"Should reject negative sensitivity threshold",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText =
				"There are three main benefits to this systematic approach: efficiency, scalability, and reliability. First, the system improves performance. Second, it reduces costs. Third, it enhances user experience. ".repeat(
					25,
				);
			const start = performance.now();
			const result = detectRuleOfThreeObsession(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should process medium text under 100ms");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales well with text length", () => {
			const baseText =
				"Three benefits include efficiency, speed, and accuracy for optimal performance. First, systems improve through comprehensive optimization and testing. ";
			const shortText = baseText.repeat(5);
			const longText = baseText.repeat(50);

			const shortStart = performance.now();
			detectRuleOfThreeObsession(shortText);
			const shortDuration = performance.now() - shortStart;

			const longStart = performance.now();
			detectRuleOfThreeObsession(longText);
			const longDuration = performance.now() - longStart;

			assert.ok(
				longDuration < shortDuration * 30,
				"Should scale reasonably with text length",
			);
		});

		it("handles pattern-dense text efficiently", () => {
			const denseText =
				"Three benefits: efficiency, speed, accuracy. First advantage: performance. Second benefit: cost reduction. Third improvement: user satisfaction. Three types: automation, optimization, integration. ".repeat(
					15,
				);

			const start = performance.now();
			const result = detectRuleOfThreeObsession(denseText, {
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
