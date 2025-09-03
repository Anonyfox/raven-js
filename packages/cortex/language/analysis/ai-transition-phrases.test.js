/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENGLISH_LANGUAGE_PACK } from "../languagepacks/english.js";
import { analyzeAITransitionPhrases as baseAnalyzeAITransitionPhrases } from "./ai-transition-phrases.js";

// Inject default ENGLISH languagePack for all tests; callers can still override via options
const analyzeAITransitionPhrases = (text, options = {}) =>
	baseAnalyzeAITransitionPhrases(text, {
		languagePack: ENGLISH_LANGUAGE_PACK,
		...options,
	});

describe("analyzeAITransitionPhrases", () => {
	describe("basic functionality", () => {
		it("detects AI transition phrases correctly", () => {
			const text =
				"Furthermore, it's important to note that we must delve into the complexities of modern technology. Moreover, various implementations utilize comprehensive approaches to solve problems in today's digital landscape. Consequently, developers need to implement substantial solutions that leverage extensive methodologies and facilitate considerable improvements in system performance and user experience overall.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				typeof result.overallScore === "number",
				"Should return overall score",
			);
			assert.ok(
				typeof result.phrasesPerThousand === "number",
				"Should return phrases per thousand",
			);
			assert.ok(result.totalPhrases > 0, "Should detect AI phrases");
			assert.ok(result.wordCount > 20, "Should count words correctly");
			assert.ok(
				result.aiLikelihood > 0.5,
				"Should show high AI likelihood for AI-heavy text",
			);
		});

		it("returns low scores for human-like text", () => {
			const text =
				"The author carefully examines narrative techniques through detailed analysis. Creative writers often experiment with different approaches to storytelling. Each method offers unique advantages for character development. Writers explore themes that resonate with readers on emotional levels. Plot structure forms the backbone of compelling stories that capture attention. Dialogue brings characters to life through authentic conversations and realistic interactions. Setting establishes mood and atmosphere that enhances the overall reading experience.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Should show low AI likelihood for human-like text",
			);
			assert.ok(result.totalPhrases <= 2, "Should detect few or no AI phrases");
			assert.ok(result.overallScore < 2, "Should show low overall score");
		});

		it("handles text with no AI phrases", () => {
			const text =
				"The cat sat on the mat. Dogs love to play in the park. Children enjoy reading stories about adventure. Simple sentences convey clear meaning without complexity. Birds sing beautiful melodies in the morning. Flowers bloom in spring gardens across the countryside. Ocean waves crash against rocky shores during storms. Mountains stand tall against blue skies filled with white clouds. Rivers flow through valleys carrying fresh water to distant lakes.";
			const result = analyzeAITransitionPhrases(text);

			assert.equal(result.totalPhrases, 0, "Should detect no AI phrases");
			assert.equal(
				result.phrasesPerThousand,
				0,
				"Should have zero phrase density",
			);
			assert.ok(
				result.aiLikelihood < 0.1,
				"Should show very low AI likelihood",
			);
			assert.equal(result.overallScore, 0, "Should have zero overall score");
		});

		it("calculates word count correctly", () => {
			const text =
				"One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight twenty-nine thirty thirty-one thirty-two thirty-three thirty-four thirty-five thirty-six thirty-seven thirty-eight thirty-nine forty forty-one forty-two forty-three forty-four forty-five forty-six forty-seven forty-eight forty-nine fifty words total";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.wordCount >= 50,
				"Should count all words including hyphenated",
			);
		});
	});

	describe("phrase detection accuracy", () => {
		it("detects 'delve into' phrase", () => {
			const text =
				"We need to delve into the technical details of this implementation. The analysis should delve into complex algorithms and data structures used in modern software development. Engineers must understand how these systems work together to create efficient solutions. Performance optimization requires careful consideration of memory usage and processing speed. Database design affects application responsiveness and user satisfaction. Testing ensures code quality and reliability across different environments and use cases.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			const delvePhrase = result.detectedPhrases.find(
				(p) => p.phrase === "delve into",
			);
			assert.ok(delvePhrase, "Should detect 'delve into' phrase");
			assert.equal(delvePhrase.count, 2, "Should count both occurrences");
		});

		it("detects 'furthermore' and 'moreover'", () => {
			const text =
				"Furthermore, the system needs improvement. Moreover, additional features must be implemented. The development process requires careful planning and execution steps. Teams collaborate to ensure project success through effective communication and shared goals. Quality assurance testing validates functionality before release to production environments. User feedback helps identify areas for enhancement and optimization. Documentation provides guidance for future maintenance and development efforts.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			const furthermore = result.detectedPhrases.find(
				(p) => p.phrase === "furthermore",
			);
			const moreover = result.detectedPhrases.find(
				(p) => p.phrase === "moreover",
			);

			assert.ok(furthermore, "Should detect 'furthermore'");
			assert.ok(moreover, "Should detect 'moreover'");
			assert.equal(
				result.totalPhrases,
				2,
				"Should count both transition phrases",
			);
		});

		it("detects correlative conjunctions", () => {
			const text =
				"The solution addresses not only performance issues but also scalability concerns. Whether or not we implement this depends on various factors and considerations. Project requirements guide decision making throughout the development lifecycle. Resource allocation affects timeline and deliverable quality. Risk assessment helps teams prepare for potential challenges and obstacles. Stakeholder feedback shapes product direction and feature prioritization.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			const notOnly = result.detectedPhrases.find(
				(p) => p.phrase === "not only",
			);
			const butAlso = result.detectedPhrases.find(
				(p) => p.phrase === "but also",
			);
			const whetherOrNot = result.detectedPhrases.find(
				(p) => p.phrase === "whether or not",
			);

			assert.ok(notOnly, "Should detect 'not only'");
			assert.ok(butAlso, "Should detect 'but also'");
			assert.ok(whetherOrNot, "Should detect 'whether or not'");
		});

		it("detects magniloquent constructions", () => {
			const text =
				"In today's digital landscape, companies must navigate the complexities of modern technology. When it comes to implementation, various approaches are available. Organizations require strategic planning to achieve competitive advantages in evolving markets. Innovation drives business growth through improved products and services. Customer satisfaction remains the primary focus for successful enterprises. Market research provides insights into consumer preferences and buying patterns.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			const landscape = result.detectedPhrases.find(
				(p) => p.phrase === "in today's digital landscape",
			);
			const complexities = result.detectedPhrases.find(
				(p) => p.phrase === "navigate the complexities",
			);
			const whenItComes = result.detectedPhrases.find(
				(p) => p.phrase === "when it comes to",
			);

			assert.ok(landscape, "Should detect landscape phrase");
			assert.ok(complexities, "Should detect complexities phrase");
			assert.ok(whenItComes, "Should detect 'when it comes to'");
		});

		it("avoids partial word matches", () => {
			const text =
				"The comprehensive study utilized various methodologies. We implemented multiple algorithms for substantial improvements in performance and considerable efficiency gains. Research teams collected data from diverse sources to validate hypotheses and conclusions. Statistical analysis revealed patterns and trends that support evidence-based decision making. Peer review ensures scientific rigor and methodology accuracy. Publication allows knowledge sharing within academic and professional communities.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			// These should be detected as full words
			const comprehensive = result.detectedPhrases.find(
				(p) => p.phrase === "comprehensive",
			);
			const utilized = result.detectedPhrases.find(
				(p) => p.phrase === "utilize",
			);
			const various = result.detectedPhrases.find(
				(p) => p.phrase === "various",
			);

			assert.ok(comprehensive, "Should detect 'comprehensive'");
			assert.ok(!utilized, "Should not detect 'utilize' in 'utilized'");
			assert.ok(various, "Should detect 'various'");
		});
	});

	describe("parameter variations", () => {
		it("handles case sensitivity correctly", () => {
			const text =
				"Furthermore, the system works efficiently across environments. FURTHERMORE, it's reliable and maintainable. Moreover, performance is good in production. MOREOVER, scalability is excellent for large datasets.";

			const caseSensitive = analyzeAITransitionPhrases(text, {
				caseSensitive: true,
			});
			const caseInsensitive = analyzeAITransitionPhrases(text, {
				caseSensitive: false,
			});

			assert.ok(
				caseInsensitive.totalPhrases >= caseSensitive.totalPhrases,
				"Case insensitive should detect more or equal phrases",
			);
		});

		it("respects minimum word count requirement", () => {
			const shortText = "Furthermore, this text is short.";

			assert.throws(
				() => analyzeAITransitionPhrases(shortText, { minWordCount: 10 }),
				Error,
				"Should reject text below minimum word count",
			);
		});

		it("includes detailed phrase information when requested", () => {
			const text =
				"Furthermore, we must delve into the complexities of software development. Moreover, various implementations utilize comprehensive approaches to solve multiple problems efficiently across different systems.";

			const withDetails = analyzeAITransitionPhrases(text, {
				includeDetails: true,
			});
			const withoutDetails = analyzeAITransitionPhrases(text, {
				includeDetails: false,
			});

			assert.ok(
				withDetails.detectedPhrases.length > 0,
				"Should include phrase details",
			);
			assert.equal(
				withoutDetails.detectedPhrases.length,
				0,
				"Should not include details by default",
			);

			// Check detail structure
			const firstPhrase = withDetails.detectedPhrases[0];
			assert.ok(
				typeof firstPhrase.phrase === "string",
				"Should include phrase text",
			);
			assert.ok(typeof firstPhrase.count === "number", "Should include count");
			assert.ok(
				typeof firstPhrase.frequency === "number",
				"Should include frequency",
			);
			assert.ok(typeof firstPhrase.ratio === "number", "Should include ratio");
		});

		it("allows custom minimum word count", () => {
			const text = "Furthermore, short text.";

			const result = analyzeAITransitionPhrases(text, { minWordCount: 3 });
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should work with low minimum",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"Furthermore, it's important to note that we must delve into various comprehensive approaches for solving complex problems in modern software development.",
				"Simple text without any artificial markers or mechanical language patterns should work fine for testing purposes and validation across different environments.",
				"Moreover, numerous substantial implementations utilize extensive methodologies for considerable improvements in system performance and user experience across different platforms effectively.",
			];

			for (const text of texts) {
				const result = analyzeAITransitionPhrases(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.overallScore >= 0,
					"Overall score should be non-negative",
				);
				assert.ok(
					result.phrasesPerThousand >= 0,
					"Phrases per thousand should be non-negative",
				);
				assert.ok(
					result.totalPhrases >= 0,
					"Total phrases should be non-negative",
				);
				assert.ok(result.wordCount > 0, "Word count should be positive");
			}
		});

		it("calculates frequencies correctly", () => {
			const text =
				"Furthermore, this text contains exactly fifty words including various connecting words and phrases. Moreover, it's important to note that comprehensive analysis requires substantial effort and considerable attention to multiple details and numerous factors.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			// Verify frequency calculations
			for (const phrase of result.detectedPhrases) {
				const expectedFrequency = (phrase.count / result.wordCount) * 1000;
				assert.ok(
					Math.abs(phrase.frequency - expectedFrequency) < 0.01,
					"Frequency calculation should be accurate",
				);
			}
		});

		it("sorts phrases by ratio when details included", () => {
			const text =
				"Furthermore, we utilize various comprehensive approaches for development projects. Moreover, substantial implementations require considerable effort and numerous improvements across different systems.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			// Check that phrases are sorted by ratio (descending)
			for (let i = 1; i < result.detectedPhrases.length; i++) {
				assert.ok(
					result.detectedPhrases[i - 1].ratio >=
						result.detectedPhrases[i].ratio,
					"Phrases should be sorted by ratio descending",
				);
			}
		});

		it("handles high phrase density correctly", () => {
			const text =
				"Furthermore, moreover, consequently, thus, therefore, hence, notably, it's important to note that various numerous multiple comprehensive substantial significant considerable extensive implementations utilize leverage facilitate numerous approaches.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.aiLikelihood > 0.8,
				"High phrase density should result in high AI likelihood",
			);
			assert.ok(result.totalPhrases > 10, "Should detect many phrases");
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated academic text", () => {
			const aiText = `
				Furthermore, it's important to note that modern artificial intelligence systems utilize various
				comprehensive approaches to solve complex problems. Moreover, these implementations leverage
				substantial computational resources and extensive datasets. Consequently, the results demonstrate
				significant improvements in performance across multiple domains. Therefore, we can conclude that
				these methodologies facilitate considerable advancement in the field.
			`;
			const result = analyzeAITransitionPhrases(aiText);

			assert.ok(
				result.aiLikelihood > 0.7,
				"AI academic text should show high AI likelihood",
			);
			assert.ok(result.totalPhrases > 8, "Should detect many AI phrases");
			assert.ok(
				result.phrasesPerThousand > 50,
				"Should have high phrase density",
			);
		});

		it("analyzes human-written academic text", () => {
			const humanText = `
				Recent research in machine learning has shown promising results across different applications.
				Scientists have developed novel algorithms that improve accuracy while reducing computational
				costs. These advances open new possibilities for practical deployment in real-world scenarios.
				The findings suggest that continued research in this direction will yield valuable insights.
			`;
			const result = analyzeAITransitionPhrases(humanText);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Human academic text should show low AI likelihood",
			);
			assert.ok(result.totalPhrases <= 3, "Should detect few AI phrases");
		});

		it("analyzes business communication", () => {
			const businessText = `
				Our team has identified several opportunities for improvement in the current process.
				We recommend implementing changes that will enhance efficiency and reduce costs.
				The proposed solution addresses key challenges while maintaining quality standards.
				We believe these modifications will deliver measurable benefits to the organization.
			`;
			const result = analyzeAITransitionPhrases(businessText);

			assert.ok(
				result.aiLikelihood < 0.4,
				"Business text should show moderate AI likelihood",
			);
		});

		it("analyzes AI-generated marketing copy", () => {
			const marketingText = `
				Furthermore, our comprehensive solution leverages various cutting-edge technologies to
				facilitate substantial improvements in your business operations. Moreover, our extensive
				experience ensures considerable value delivery across multiple industries. Therefore,
				when it comes to digital transformation, our platform provides numerous benefits.
			`;
			const result = analyzeAITransitionPhrases(marketingText);

			assert.ok(
				result.aiLikelihood > 0.8,
				"AI marketing copy should show very high AI likelihood",
			);
			assert.ok(
				result.totalPhrases > 6,
				"Should detect many marketing AI phrases",
			);
		});
	});

	describe("multilingual and special content", () => {
		it("handles mixed language content", () => {
			const mixedText =
				"Furthermore, the système funktioniert correctly across different platforms. Moreover, различные approaches work well together in this multilingual environment for global applications.";
			const result = analyzeAITransitionPhrases(mixedText);

			assert.ok(
				result.aiLikelihood > 0.5,
				"Should detect English AI phrases in mixed content",
			);
			assert.ok(
				result.totalPhrases >= 2,
				"Should find English transition phrases",
			);
		});

		it("processes text with special characters", () => {
			const text =
				"Furthermore, the system (v2.0) processes data efficiently. Moreover, it's important to note that performance improved by 25% compared to previous versions.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.totalPhrases >= 3,
				"Should detect phrases despite special characters",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});

		it("handles text with URLs and emails", () => {
			const text =
				"Furthermore, visit https://example.com for more information and detailed documentation. Moreover, contact support@company.com if you need assistance with various technical issues and troubleshooting.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.totalPhrases >= 3,
				"Should detect phrases in technical text",
			);
		});

		it("processes code-mixed content", () => {
			const text =
				"Furthermore, the function calculateValue() utilizes various algorithms for processing. Moreover, the implementation leverages comprehensive data structures for substantial performance improvements and optimization.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.aiLikelihood > 0.6,
				"Should detect AI phrases in code-mixed content",
			);
		});
	});

	describe("edge cases", () => {
		it("handles repeated phrases correctly", () => {
			const text =
				"Furthermore, furthermore, furthermore, the system works well across different platforms. Moreover, moreover, moreover, it's efficient and reliable for production environments.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			const furthermore = result.detectedPhrases.find(
				(p) => p.phrase === "furthermore",
			);
			const moreover = result.detectedPhrases.find(
				(p) => p.phrase === "moreover",
			);

			assert.equal(furthermore.count, 3, "Should count repeated 'furthermore'");
			assert.equal(moreover.count, 3, "Should count repeated 'moreover'");
		});

		it("processes very long text efficiently", () => {
			const baseText =
				"Furthermore, it's important to note that comprehensive systems utilize various approaches. Moreover, substantial implementations leverage extensive methodologies. ";
			const longText = baseText.repeat(100);

			const start = performance.now();
			const result = analyzeAITransitionPhrases(longText);
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should process long text under 100ms");
			assert.ok(
				result.totalPhrases > 50,
				"Should detect many phrases in long text",
			);
		});

		it("handles text with only AI phrases", () => {
			const text =
				"Furthermore moreover consequently therefore thus hence notably it's important to note that various numerous multiple comprehensive substantial significant considerable extensive implementations utilize leverage facilitate.";
			const result = analyzeAITransitionPhrases(text);

			assert.ok(
				result.aiLikelihood > 0.9,
				"Text with only AI phrases should have very high likelihood",
			);
			assert.ok(
				result.phrasesPerThousand > 100,
				"Should have very high phrase density",
			);
		});

		it("processes text with phrase fragments", () => {
			const text =
				"The phrase 'further' appears in text often. Similarly 'more' exists in many contexts. These partial matches should not be detected as transition phrases when they don't form complete patterns.";
			const result = analyzeAITransitionPhrases(text);

			assert.equal(
				result.totalPhrases,
				0,
				"Should not detect partial phrase matches",
			);
		});

		it("handles case variations correctly", () => {
			const text =
				"FURTHERMORE, the system works efficiently. Furthermore, it's reliable and stable. furthermore, performance is good across different environments and platforms consistently.";
			const result = analyzeAITransitionPhrases(text, { includeDetails: true });

			const furthermore = result.detectedPhrases.find(
				(p) => p.phrase === "furthermore",
			);
			assert.equal(furthermore.count, 3, "Should detect all case variations");
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => analyzeAITransitionPhrases(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => analyzeAITransitionPhrases(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => analyzeAITransitionPhrases(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => analyzeAITransitionPhrases([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => analyzeAITransitionPhrases({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => analyzeAITransitionPhrases(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => analyzeAITransitionPhrases("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for insufficient text length", () => {
			const shortText = "Furthermore, short text.";
			assert.throws(
				() => analyzeAITransitionPhrases(shortText),
				Error,
				"Should reject text below default minimum",
			);
		});

		it("throws Error for invalid options", () => {
			const validText =
				"Furthermore, this text has enough words to meet the minimum requirements for analysis and should work properly with valid options.";

			assert.throws(
				() => analyzeAITransitionPhrases(validText, { minWordCount: 0 }),
				Error,
				"Should reject zero minimum word count",
			);
			assert.throws(
				() => analyzeAITransitionPhrases(validText, { minWordCount: -1 }),
				Error,
				"Should reject negative minimum word count",
			);
			assert.throws(
				() => analyzeAITransitionPhrases(validText, { minWordCount: 1.5 }),
				Error,
				"Should reject fractional minimum word count",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText =
				"Furthermore, it's important to note that various comprehensive systems utilize substantial approaches. ".repeat(
					50,
				);
			const start = performance.now();
			const result = analyzeAITransitionPhrases(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 50, "Should process medium text under 50ms");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales well with text length", () => {
			const baseText =
				"Furthermore, comprehensive analysis requires various substantial approaches and considerable effort. ";
			const shortText = baseText.repeat(10);
			const longText = baseText.repeat(100);

			// Run multiple times to reduce timing variance and JIT effects
			const runs = 3;
			let shortTotal = 0;
			let longTotal = 0;

			for (let i = 0; i < runs; i++) {
				const shortStart = performance.now();
				analyzeAITransitionPhrases(shortText);
				shortTotal += performance.now() - shortStart;

				const longStart = performance.now();
				analyzeAITransitionPhrases(longText);
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

		it("handles phrase-dense text efficiently", () => {
			const denseText = Object.keys({
				furthermore: 1,
				moreover: 1,
				consequently: 1,
				therefore: 1,
				thus: 1,
				hence: 1,
				notably: 1,
				various: 1,
				numerous: 1,
				multiple: 1,
				comprehensive: 1,
				substantial: 1,
				significant: 1,
				considerable: 1,
				extensive: 1,
			})
				.join(" ")
				.repeat(20);

			const start = performance.now();
			const result = analyzeAITransitionPhrases(denseText, {
				includeDetails: true,
			});
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should handle phrase-dense text efficiently");
			assert.ok(
				result.detectedPhrases.length > 10,
				"Should detect many phrases",
			);
		});
	});
});
