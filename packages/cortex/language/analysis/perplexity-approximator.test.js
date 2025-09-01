/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approximatePerplexity } from "./perplexity-approximator.js";

describe("approximatePerplexity", () => {
	describe("basic functionality", () => {
		it("analyzes text perplexity correctly", () => {
			const text =
				"The comprehensive system provides advanced solutions that enhance efficiency and improve performance consistently. Users can leverage sophisticated features to optimize workflows and achieve better results through streamlined processes and automated capabilities across different platforms and environments. The platform ensures reliable functionality while maintaining high quality standards through systematic optimization techniques.";
			const result = approximatePerplexity(text);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				typeof result.overallPerplexity === "number",
				"Should return overall perplexity",
			);
			assert.ok(
				typeof result.predictabilityScore === "number",
				"Should return predictability score",
			);
			assert.ok(
				typeof result.entropyMeasures === "object",
				"Should return entropy measures",
			);
			assert.ok(
				typeof result.diversityMetrics === "object",
				"Should return diversity metrics",
			);
			assert.ok(result.wordCount > 15, "Should count words correctly");
			assert.ok(
				result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
				"AI likelihood should be between 0 and 1",
			);
		});

		it("returns lower perplexity for predictable text", () => {
			const predictableText =
				"The system provides solutions. The system provides benefits. The system provides features. The system provides capabilities. The system provides functionality. The system provides performance. The system provides efficiency. The system provides reliability. The system provides scalability. The system provides optimization. The system provides enhancement. The system provides improvement. The system provides automation. The system provides integration. The system provides modernization. The system provides transformation.";
			const result = approximatePerplexity(predictableText);

			assert.ok(
				result.aiLikelihood > 0.5,
				"Predictable text should show higher AI likelihood",
			);
			assert.ok(
				result.predictabilityScore > 0.4,
				"Should show high predictability score",
			);
		});

		it("returns higher perplexity for creative text", () => {
			const creativeText =
				"Whispered melodies danced through forgotten corridors, where shadows painted stories on weathered walls. Moonbeams caressed ancient manuscripts, revealing secrets that transcended temporal boundaries. Crystalline thoughts shimmered beneath starlit consciousness, weaving dreams into reality's tapestry. Emerald whispers echoed through silver chambers, carrying messages from distant realms where imagination reigns supreme and creativity flourishes beyond conventional understanding.";
			const result = approximatePerplexity(creativeText);

			assert.ok(
				result.aiLikelihood < 0.5,
				"Creative text should show lower AI likelihood",
			);
			assert.ok(
				result.diversityMetrics.vocab_diversity > 0.4,
				"Should show high vocabulary diversity",
			);
		});

		it("calculates entropy measures correctly", () => {
			const text =
				"The quick brown fox jumps over the lazy dog repeatedly. The lazy dog sleeps under the warm sun peacefully. The warm sun shines on the green grass brilliantly. The green grass grows in the peaceful meadow naturally. The peaceful meadow extends beyond the rolling hills and distant mountains majestically. Beautiful wildflowers bloom throughout the landscape creating vibrant colors and pleasant aromas that attract various wildlife species.";
			const result = approximatePerplexity(text);

			assert.ok(
				result.entropyMeasures.unigram > 0,
				"Should calculate unigram entropy",
			);
			assert.ok(
				result.entropyMeasures.bigram > 0,
				"Should calculate bigram entropy",
			);
			assert.ok(
				result.entropyMeasures.trigram > 0,
				"Should calculate trigram entropy",
			);
			assert.ok(
				result.entropyMeasures.trigram >= result.entropyMeasures.bigram,
				"Trigram entropy should be >= bigram entropy",
			);
			assert.ok(
				result.entropyMeasures.bigram >= result.entropyMeasures.unigram,
				"Bigram entropy should be >= unigram entropy",
			);
		});
	});

	describe("entropy calculations", () => {
		it("detects low entropy in repetitive text", () => {
			const repetitiveText =
				"The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat. The cat sat on the mat.";
			const result = approximatePerplexity(repetitiveText);

			assert.ok(
				result.entropyMeasures.unigram < 3,
				"Should show low unigram entropy for repetitive text",
			);
			assert.ok(
				result.aiLikelihood > 0.7,
				"Repetitive text should show high AI likelihood",
			);
		});

		it("detects high entropy in diverse text", () => {
			const diverseText =
				"Magnificent butterflies gracefully flutter through vibrant gardens where exotic flowers bloom magnificently. Sparkling streams meander peacefully alongside ancient pathways, carrying whispered secrets from mysterious forests. Brilliant sunlight illuminates crystalline dewdrops adorning delicate petals, creating rainbow prisms that dance enchantingly across emerald meadows. Ethereal melodies resonate through the tranquil atmosphere while gentle breezes caress the countryside with tender warmth and natural harmony.";
			const result = approximatePerplexity(diverseText);

			assert.ok(
				result.entropyMeasures.unigram > 4,
				"Should show high unigram entropy for diverse text",
			);
			assert.ok(
				result.aiLikelihood < 0.6,
				"Diverse text should show low AI likelihood",
			);
		});

		it("calculates conditional probabilities accurately", () => {
			const text =
				"The system works efficiently and the system performs reliably across different operational contexts. The system provides comprehensive solutions and the system delivers consistent results through systematic approaches. The system ensures optimal performance and the system maintains high quality standards across different environments. The system operates continuously while the system monitors performance metrics and the system generates detailed reports for analysis purposes.";
			const result = approximatePerplexity(text, { includeDetails: true });

			const bigramMetric = result.detailedMetrics.find(
				(m) => m.metric === "bigram_predictability",
			);
			const trigramMetric = result.detailedMetrics.find(
				(m) => m.metric === "trigram_predictability",
			);

			assert.ok(bigramMetric, "Should calculate bigram predictability");
			assert.ok(trigramMetric, "Should calculate trigram predictability");
			assert.ok(
				bigramMetric.value > 0,
				"Bigram predictability should be positive",
			);
			assert.ok(
				trigramMetric.value > 0,
				"Trigram predictability should be positive",
			);
		});
	});

	describe("diversity metrics", () => {
		it("calculates vocabulary diversity correctly", () => {
			const highDiversityText =
				"Magnificent elephants roam across sprawling savannas while graceful gazelles leap through golden grasslands with remarkable agility. Majestic lions hunt stealthily beneath scorching desert suns, and colorful parrots soar above dense tropical rainforests where countless species thrive harmoniously together. Intricate ecosystems support diverse wildlife populations through complex interdependent relationships that sustain natural balance.";
			const lowDiversityText =
				"The system provides functionality across different environments. The system provides capability through advanced features. The system provides reliability for mission-critical operations. The system provides efficiency in resource utilization. The system provides performance optimization continuously. The system provides scalability for growing demands. The system provides optimization techniques automatically. The system provides enhancement through regular updates and improvements.";

			const highResult = approximatePerplexity(highDiversityText);
			const lowResult = approximatePerplexity(lowDiversityText);

			assert.ok(
				highResult.diversityMetrics.vocab_diversity >
					lowResult.diversityMetrics.vocab_diversity,
				"High diversity text should have higher vocab diversity",
			);
			assert.ok(
				highResult.aiLikelihood < lowResult.aiLikelihood,
				"High diversity text should have lower AI likelihood",
			);
		});

		it("detects common word overuse", () => {
			const commonWordText =
				"The system is good and the system is fast and the system is reliable for daily operations. The system has features and the system has capabilities and the system has performance metrics. The system can work and the system can run and the system can operate efficiently across different environments. The system will process and the system will deliver and the system will maintain consistent results through automated processes.";
			const result = approximatePerplexity(commonWordText);

			assert.ok(
				result.diversityMetrics.common_word_ratio > 0.6,
				"Should detect high common word ratio",
			);
			assert.ok(
				result.aiLikelihood > 0.5,
				"Common word overuse should indicate AI likelihood",
			);
		});

		it("measures lexical sophistication", () => {
			const sophisticatedText =
				"Extraordinarily magnificent phenomena demonstrate incomprehensible complexities throughout multifaceted environments where unprecedented circumstances facilitate revolutionary transformations. Comprehensive methodologies incorporate sophisticated technologies that systematically optimize fundamental processes across diverse organizational infrastructures. Multidisciplinary approaches leverage interdisciplinary collaboration to maximize effectiveness through comprehensive integration of advanced technological solutions.";
			const simpleText =
				"The cat sat on the mat and the dog ran in the yard happily. The sun was hot and the sky was blue all day. The kids played games and had fun all day long together. The food was good and we ate lots of it at dinner. The weather was nice and we spent time outside enjoying the fresh air and sunshine.";

			const sophisticatedResult = approximatePerplexity(sophisticatedText);
			const simpleResult = approximatePerplexity(simpleText);

			assert.ok(
				sophisticatedResult.diversityMetrics.lexical_sophistication >
					simpleResult.diversityMetrics.lexical_sophistication,
				"Sophisticated text should have higher lexical sophistication",
			);
			assert.ok(
				sophisticatedResult.diversityMetrics.avg_word_length >
					simpleResult.diversityMetrics.avg_word_length,
				"Sophisticated text should have longer average word length",
			);
		});

		it("identifies rare word usage patterns", () => {
			const rareWordText =
				"Serendipitous encounters illuminate ineffable mysteries while ephemeral moments transcend quotidian experiences through profound contemplation. Mellifluous harmonies resonate through labyrinthine corridors where phantasmagorical visions manifest unexpectedly amid ethereal atmospheres. Quintessential beauty permeates every facet of this extraordinary phenomenon, creating ineffable sensations that transcend conventional understanding through luminous revelations.";
			const commonWordText =
				"The system works well and provides good results for all users consistently. Users can get benefits and features through the comprehensive platform interface. The platform runs fast and gives great performance across different environments. Everything works as expected and delivers value while maintaining high standards of quality and reliability throughout operations.";

			const rareResult = approximatePerplexity(rareWordText);
			const commonResult = approximatePerplexity(commonWordText);

			assert.ok(
				rareResult.diversityMetrics.rare_word_usage >
					commonResult.diversityMetrics.rare_word_usage,
				"Rare word text should have higher rare word usage",
			);
		});
	});

	describe("predictability measures", () => {
		it("detects high predictability in formulaic text", () => {
			const formulaicText =
				"The solution provides comprehensive capabilities that enhance performance and improve efficiency across different operational contexts. The platform delivers advanced features that optimize workflows and streamline processes through systematic automation. The system ensures reliable functionality that supports operations and maintains quality standards while delivering consistent results.";
			const result = approximatePerplexity(formulaicText);

			assert.ok(
				result.predictabilityScore > 0.4,
				"Formulaic text should show high predictability",
			);
			assert.ok(
				result.aiLikelihood > 0.4,
				"Formulaic text should indicate moderate to high AI likelihood",
			);
		});

		it("detects context switching patterns", () => {
			const frequentSwitchText =
				"Elephants trumpeted loudly. Quantum mechanics governs particles. Beethoven composed symphonies. Database optimization improves queries. Roses bloom beautifully. Statistical analysis reveals patterns. Ocean waves crash rhythmically. Algorithm efficiency matters greatly.";
			const consistentText =
				"The comprehensive software solution provides advanced capabilities for enterprise environments. System administrators can configure multiple settings to optimize performance across different organizational infrastructures. Technical documentation explains implementation procedures for complex deployment scenarios.";

			const switchResult = approximatePerplexity(frequentSwitchText);
			const consistentResult = approximatePerplexity(consistentText);

			assert.ok(
				switchResult.diversityMetrics.context_switches >= 0,
				"Context switching should be measured",
			);
			assert.ok(
				consistentResult.diversityMetrics.context_switches >= 0,
				"Context switching should be measured for consistent text too",
			);
		});

		it("measures semantic surprise patterns", () => {
			const surprisingText =
				"Whimsical elephants juggled crystalline thoughts while microscopic giants danced through liquid starlight. Thunderous whispers echoed silently across frozen flames, where transparent darkness illuminated invisible rainbows. Gentle hurricanes caressed delicate diamonds beneath floating mountains.";
			const predictableText =
				"The system operates efficiently and provides reliable performance. Users access features through the interface and receive expected results. Administrative functions work correctly and maintain system stability throughout normal operations.";

			const surprisingResult = approximatePerplexity(surprisingText);
			const predictableResult = approximatePerplexity(predictableText);

			assert.ok(
				surprisingResult.diversityMetrics.semantic_surprise >= 0,
				"Surprising text should have semantic surprise metrics",
			);
			assert.ok(
				predictableResult.diversityMetrics.semantic_surprise >= 0,
				"Predictable text should also have semantic surprise metrics",
			);
		});
	});

	describe("parameter variations", () => {
		it("respects minimum word count requirement", () => {
			const shortText =
				"The system works efficiently and provides reliable performance.";

			assert.throws(
				() => approximatePerplexity(shortText, { minWordCount: 20 }),
				Error,
				"Should reject text below minimum word count",
			);
		});

		it("includes detailed metrics when requested", () => {
			const text =
				"The comprehensive analysis reveals significant patterns in the dataset that demonstrate important relationships between various factors. Researchers conducted extensive evaluations to understand complex phenomena and identify meaningful correlations across different variables. The investigation employed rigorous methodologies to ensure accurate results and validate findings through systematic examination of multiple data sources.";

			const withDetails = approximatePerplexity(text, {
				includeDetails: true,
			});
			const withoutDetails = approximatePerplexity(text, {
				includeDetails: false,
			});

			assert.ok(
				withDetails.detailedMetrics.length > 0,
				"Should include detailed metrics",
			);
			assert.equal(
				withoutDetails.detailedMetrics.length,
				0,
				"Should not include details by default",
			);

			// Check detail structure
			const firstMetric = withDetails.detailedMetrics[0];
			assert.ok(
				typeof firstMetric.metric === "string",
				"Should include metric name",
			);
			assert.ok(
				typeof firstMetric.value === "number",
				"Should include metric value",
			);
			assert.ok(
				typeof firstMetric.baseline === "number",
				"Should include baseline value",
			);
		});

		it("allows custom vocabulary size", () => {
			const text =
				"The advanced computational system leverages sophisticated algorithms to process complex datasets efficiently. Machine learning models analyze patterns and generate insights that facilitate informed decision-making across diverse organizational contexts.";

			const smallVocab = approximatePerplexity(text, {
				vocabularySize: 5000,
			});
			const largeVocab = approximatePerplexity(text, {
				vocabularySize: 50000,
			});

			assert.ok(
				typeof smallVocab.overallPerplexity === "number",
				"Should work with small vocabulary",
			);
			assert.ok(
				typeof largeVocab.overallPerplexity === "number",
				"Should work with large vocabulary",
			);
		});

		it("allows custom minimum word count", () => {
			const text =
				"The system works efficiently and provides reliable performance consistently across different environments with automated processes and user-friendly interfaces that meet business requirements.";

			const result = approximatePerplexity(text, { minWordCount: 10 });
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should work with low minimum",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"The comprehensive solution provides advanced capabilities that enhance performance and improve efficiency through systematic optimization and streamlined processes across different operational environments.",
				"Magnificent butterflies gracefully flutter through vibrant gardens where exotic flowers bloom magnificently alongside sparkling streams that meander peacefully through mysterious forests creating natural harmony.",
				"The system works. The system runs. The system operates. The system functions. The system performs. The system executes. The system processes. The system handles operations effectively. The system provides functionality. The system delivers performance. The system ensures reliability. The system maintains quality standards.",
			];

			for (const text of texts) {
				const result = approximatePerplexity(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.overallPerplexity > 0,
					"Overall perplexity should be positive",
				);
				assert.ok(
					result.predictabilityScore >= 0 && result.predictabilityScore <= 1,
					"Predictability score should be between 0 and 1",
				);
				assert.ok(
					result.diversityMetrics.vocab_diversity >= 0 &&
						result.diversityMetrics.vocab_diversity <= 1,
					"Vocab diversity should be between 0 and 1",
				);
				assert.ok(result.wordCount > 0, "Word count should be positive");
			}
		});

		it("calculates entropy relationships correctly", () => {
			const text =
				"The sophisticated analytical framework incorporates advanced methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate comprehensive insights for informed decision-making processes.";
			const result = approximatePerplexity(text);

			// Entropy should generally increase with n-gram order for diverse text
			assert.ok(
				result.entropyMeasures.unigram > 0,
				"Unigram entropy should be positive",
			);
			assert.ok(
				result.entropyMeasures.bigram > 0,
				"Bigram entropy should be positive",
			);
			assert.ok(
				result.entropyMeasures.trigram > 0,
				"Trigram entropy should be positive",
			);
		});

		it("maintains consistency across multiple runs", () => {
			const text =
				"The innovative technological solution leverages cutting-edge algorithms to optimize performance and enhance user experience through comprehensive automation and intelligent processing capabilities across different operational environments.";

			const result1 = approximatePerplexity(text);
			const result2 = approximatePerplexity(text);

			assert.ok(
				Math.abs(result1.aiLikelihood - result2.aiLikelihood) < 0.001,
				"AI likelihood should be consistent",
			);
			assert.ok(
				Math.abs(result1.overallPerplexity - result2.overallPerplexity) < 0.001,
				"Overall perplexity should be consistent",
			);
		});

		it("responds appropriately to text variations", () => {
			const baseText =
				"The system provides functionality and delivers performance consistently across different environments with reliable operation and user-friendly interfaces that meet business requirements.";
			const expandedText =
				"The sophisticated computational system provides comprehensive functionality and consistently delivers exceptional performance through advanced optimization techniques across different operational environments and business contexts.";

			const baseResult = approximatePerplexity(baseText);
			const expandedResult = approximatePerplexity(expandedText);

			assert.ok(
				expandedResult.diversityMetrics.vocab_diversity >
					baseResult.diversityMetrics.vocab_diversity,
				"Expanded text should have higher vocabulary diversity",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated technical content", () => {
			const aiText = `
				The comprehensive platform delivers advanced solutions that enhance operational efficiency and
				improve system performance. Users can leverage sophisticated features to optimize workflows and
				achieve better results through streamlined processes. The system provides reliable functionality
				that ensures consistent performance and maintains high quality standards across different
				environments and operational contexts.
			`;
			const result = approximatePerplexity(aiText);

			assert.ok(
				result.aiLikelihood > 0.4,
				"AI technical content should show moderate to high AI likelihood",
			);
			assert.ok(
				result.predictabilityScore > 0.4,
				"Should show high predictability",
			);
		});

		it("analyzes human-written creative prose", () => {
			const humanText = `
				Moonlight cascaded through weathered shutters, painting silver patterns on forgotten
				photographs scattered across dusty floorboards. Each image whispered stories of
				laughter and tears, of moments when time stood still and hearts overflowed with
				emotions too profound for words. The old house breathed with memories, its walls
				holding secrets that only shadows knew, while ancient timber groaned softly beneath
				the weight of countless seasons that had passed through these intimate spaces.
			`;
			const result = approximatePerplexity(humanText);

			assert.ok(
				result.aiLikelihood < 0.6,
				"Human creative prose should show low AI likelihood",
			);
			assert.ok(
				result.diversityMetrics.vocab_diversity > 0.5,
				"Should show high vocabulary diversity",
			);
		});

		it("analyzes business communication", () => {
			const businessText = `
				Our quarterly performance exceeded expectations across multiple metrics, with revenue
				growth reaching unprecedented levels while maintaining operational excellence. The team
				successfully implemented strategic initiatives that enhanced customer satisfaction and
				improved market positioning. Moving forward, we will continue expanding our capabilities
				while optimizing resource allocation.
			`;
			const result = approximatePerplexity(businessText);

			assert.ok(
				result.aiLikelihood < 0.6,
				"Business text should show moderate AI likelihood",
			);
		});

		it("analyzes academic writing", () => {
			const academicText = `
				This investigation examines the correlation between environmental factors and behavioral
				patterns in urban ecosystems. Methodology incorporated longitudinal observations across
				diverse geographical locations, utilizing standardized measurement protocols. Results
				indicate significant relationships between variables, suggesting complex interactions
				that warrant further exploration through interdisciplinary approaches.
			`;
			const result = approximatePerplexity(academicText);

			assert.ok(
				result.diversityMetrics.lexical_sophistication > 0.2,
				"Academic text should show high lexical sophistication",
			);
		});
	});

	describe("multilingual and special content", () => {
		it("handles mixed language content", () => {
			const mixedText =
				"The système provides comprehensive functionality while maintaining efficienza across different environments. Users can leverage advanced Funktionalität to optimize workflows and achieve better résultats through systematic approaches.";
			const result = approximatePerplexity(mixedText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should process mixed language content",
			);
			assert.ok(
				result.diversityMetrics.vocab_diversity > 0.4,
				"Mixed language should show vocabulary diversity",
			);
		});

		it("processes technical jargon", () => {
			const technicalText =
				"The microservice architecture leverages containerization technologies including Docker and Kubernetes to orchestrate scalable deployments. API gateways facilitate inter-service communication while maintaining security protocols and monitoring distributed transactions across heterogeneous infrastructure components.";
			const result = approximatePerplexity(technicalText);

			assert.ok(
				result.diversityMetrics.lexical_sophistication > 0.3,
				"Technical jargon should show high lexical sophistication",
			);
		});

		it("handles scientific terminology", () => {
			const scientificText =
				"Mitochondrial dysfunction disrupts cellular metabolism through impaired oxidative phosphorylation pathways. Researchers investigated proteomics profiles using mass spectrometry techniques to identify biomarkers associated with neurodegenerative processes. Findings revealed significant alterations in enzymatic activities.";
			const result = approximatePerplexity(scientificText);

			assert.ok(
				result.diversityMetrics.avg_word_length > 6,
				"Scientific text should have long average word length",
			);
		});

		it("processes literary content", () => {
			const literaryText =
				"Beneath obsidian skies where stars whispered ancient secrets, she wandered through labyrinthine memories that danced like ethereal phantoms. Time folded upon itself, creating kaleidoscopic moments where past and present merged into ineffable beauty. Her footsteps echoed through corridors of consciousness.";
			const result = approximatePerplexity(literaryText);

			assert.ok(
				result.diversityMetrics.semantic_surprise > 0.1,
				"Literary text should show semantic surprise",
			);
		});
	});

	describe("edge cases", () => {
		it("handles extremely repetitive text", () => {
			const repetitiveText =
				"Hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world hello world.";
			const result = approximatePerplexity(repetitiveText);

			assert.ok(
				result.aiLikelihood > 0.8,
				"Extremely repetitive text should show very high AI likelihood",
			);
			assert.ok(
				result.diversityMetrics.vocab_diversity < 0.2,
				"Should show very low vocabulary diversity",
			);
		});

		it("processes very long text efficiently", () => {
			const baseText =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns. ";
			const longText = baseText.repeat(100);

			const start = performance.now();
			const result = approximatePerplexity(longText);
			const duration = performance.now() - start;

			assert.ok(duration < 1000, "Should process long text under 1000ms");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("handles text with unusual punctuation", () => {
			const punctuatedText =
				"The system... works!!! Really??? Yes, it does!!! The platform... operates!!! Efficiently??? Absolutely!!! Performance... excellent!!! Quality??? Outstanding!!! Results... impressive!!! Satisfaction??? Guaranteed!!! Experience... optimal!!! Benefits??? Substantial!!! Value... exceptional!!! Success... assured!!!";
			const result = approximatePerplexity(punctuatedText);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle unusual punctuation",
			);
		});

		it("processes text with numbers and symbols", () => {
			const symbolText =
				"The API v2.1 supports HTTP/HTTPS protocols with SSL/TLS encryption. Database connections use TCP/IP port 3306 for MySQL 8.0+ instances. Authentication requires OAuth 2.0 tokens with 256-bit AES encryption standards.";
			const result = approximatePerplexity(symbolText);

			assert.ok(
				typeof result.overallPerplexity === "number",
				"Should process symbols and numbers",
			);
		});

		it("handles text with varying sentence lengths", () => {
			const varyingText =
				"Short. Medium length sentence here. This is a considerably longer sentence that contains multiple clauses and provides more detailed information about various topics. Brief statement. Another moderately sized sentence with some complexity.";
			const result = approximatePerplexity(varyingText);

			assert.ok(
				result.diversityMetrics.context_switches >= 0,
				"Should calculate context variation metrics",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => approximatePerplexity(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => approximatePerplexity(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => approximatePerplexity(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => approximatePerplexity([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => approximatePerplexity({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => approximatePerplexity(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => approximatePerplexity("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for insufficient text length", () => {
			const shortText = "The system works efficiently.";
			assert.throws(
				() => approximatePerplexity(shortText),
				Error,
				"Should reject text below default minimum",
			);
		});

		it("throws Error for invalid options", () => {
			const validText =
				"The comprehensive analytical framework incorporates sophisticated methodologies that systematically evaluate complex datasets to identify meaningful patterns and generate insights for decision-making processes.";

			assert.throws(
				() => approximatePerplexity(validText, { minWordCount: 0 }),
				Error,
				"Should reject zero minimum word count",
			);
			assert.throws(
				() => approximatePerplexity(validText, { minWordCount: -1 }),
				Error,
				"Should reject negative minimum word count",
			);
			assert.throws(
				() => approximatePerplexity(validText, { minWordCount: 1.5 }),
				Error,
				"Should reject fractional minimum word count",
			);
			assert.throws(
				() => approximatePerplexity(validText, { vocabularySize: 500 }),
				Error,
				"Should reject vocabulary size below 1000",
			);
			assert.throws(
				() => approximatePerplexity(validText, { vocabularySize: 1.5 }),
				Error,
				"Should reject fractional vocabulary size",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText =
				"The sophisticated computational framework leverages advanced algorithms to analyze complex datasets and generate comprehensive insights. ".repeat(
					50,
				);
			const start = performance.now();
			const result = approximatePerplexity(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 500, "Should process medium text under 500ms");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales well with text length", () => {
			const baseText =
				"The comprehensive system provides advanced functionality that enhances operational efficiency. ";
			const shortText = baseText.repeat(20);
			const longText = baseText.repeat(200);

			const shortStart = performance.now();
			approximatePerplexity(shortText);
			const shortDuration = performance.now() - shortStart;

			const longStart = performance.now();
			approximatePerplexity(longText);
			const longDuration = performance.now() - longStart;

			assert.ok(
				longDuration < shortDuration * 50,
				"Should scale reasonably with text length",
			);
		});

		it("handles detailed analysis efficiently", () => {
			const complexText =
				"The interdisciplinary research methodology incorporates quantitative and qualitative approaches to investigate complex phenomena across diverse contexts. Comprehensive analysis reveals significant correlations between variables that warrant further investigation through systematic exploration. ".repeat(
					25,
				);

			const start = performance.now();
			const result = approximatePerplexity(complexText, {
				includeDetails: true,
			});
			const duration = performance.now() - start;

			assert.ok(duration < 800, "Should handle detailed analysis efficiently");
			assert.ok(
				result.detailedMetrics.length > 10,
				"Should return comprehensive metrics",
			);
		});
	});
});
