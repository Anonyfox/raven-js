/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Rule-of-three obsession detector for identifying AI organizational patterns.
 *
 * Analyzes triadic grouping patterns that are characteristic of AI-generated content.
 * Research shows AI systematically organizes information in groups of three (lists,
 * examples, explanations) at rates 3-5x higher than human writers, creating detectible
 * "rule of three" obsessions in content structure and organization.
 * Uses robust cortex building blocks for enhanced text processing accuracy.
 */

import { tokenizeSentences, tokenizeWords } from "../segmentation/index.js";

/**
 * Human baseline frequencies for triadic patterns per 1000 words in natural writing.
 * These values represent typical usage rates in human-written content.
 */
const TRIADIC_BASELINES = {
	// List patterns with exactly three items
	three_item_lists: 0.8, // Lists like "A, B, and C" or "1. X 2. Y 3. Z"
	numbered_three_lists: 0.3, // Explicitly numbered 1, 2, 3 lists
	bullet_three_lists: 0.2, // Bullet lists with exactly three items

	// Three-part explanations and transitions
	first_second_third: 0.1, // "First...second...third" patterns
	initially_then_finally: 0.05, // Sequential explanation patterns
	abc_patterns: 0.1, // "A) B) C)" or "a) b) c)" patterns

	// Three examples or instances
	for_example_three: 0.15, // "For example, X, Y, and Z"
	such_as_three: 0.2, // "Such as A, B, and C"
	including_three: 0.25, // "Including X, Y, and Z"

	// Three adjectives or descriptors
	three_adjectives: 1.2, // "big, fast, and efficient" patterns
	three_adverbs: 0.4, // "quickly, efficiently, and effectively"
	three_nouns: 0.8, // "speed, accuracy, and reliability"

	// Three-part sentence structures
	three_clause_sentences: 0.6, // Sentences with exactly three clauses
	three_phrase_sentences: 0.9, // Sentences with three distinct phrases

	// Specific triadic markers
	three_benefits: 0.1, // "three benefits", "three advantages"
	three_ways: 0.08, // "three ways", "three methods"
	three_types: 0.12, // "three types", "three kinds"
	three_steps: 0.06, // "three steps", "three stages"
	three_factors: 0.05, // "three factors", "three elements"
	three_aspects: 0.04, // "three aspects", "three components"

	// Mechanical triadic phrases
	firstly_secondly_thirdly: 0.02, // "Firstly...secondly...thirdly"
	one_two_three: 0.03, // "One...two...three" enumerations
	beginning_middle_end: 0.01, // "Beginning...middle...end" structures
};

/**
 * Analyzes text for rule-of-three obsession patterns characteristic of AI-generated content.
 *
 * Scans input text for triadic organizational patterns that appear disproportionately in
 * AI-generated content compared to human writing. Calculates frequency ratios, AI-likelihood
 * scores, and provides detailed breakdowns of detected organizational patterns. Higher scores
 * indicate more AI-like triadic organization obsessions.
 *
 * @param {string} text - Input text to analyze for rule-of-three patterns
 * @param {object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=30] - Minimum word count for reliable analysis
 * @param {boolean} [options.includeDetails=false] - Include pattern details
 * @param {number} [options.sensitivityThreshold=2.0] - Overuse threshold multiplier
 * @param {import('../languagepacks/language-pack.js').LanguagePack} [options.languagePack] - Language pack
 * @returns {{aiLikelihood: number, overallScore: number, triadicDensity: number, totalPatterns: number, wordCount: number, detectedPatterns: Array<Object>}} Analysis results with AI detection metrics. aiLikelihood: Overall AI probability score (0-1, higher = more AI-like). overallScore: Weighted frequency score vs human baseline. triadicDensity: Total triadic patterns per 1000 words. totalPatterns: Total number of flagged triadic patterns found. wordCount: Total words analyzed. detectedPatterns: Array of detected patterns with frequencies (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows natural variety in organization
 * const humanText = "The author explores different narrative techniques. Some writers prefer chronological structure while others experiment with non-linear approaches.";
 * const humanAnalysis = detectRuleOfThreeObsession(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability)
 *
 * @example
 * // AI text typically shows systematic triadic organization
 * const aiText = "There are three main benefits to this approach: efficiency, scalability, and reliability. First, the system improves performance. Second, it reduces costs. Third, it enhances user experience.";
 * const aiAnalysis = detectRuleOfThreeObsession(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.7-0.9 (high AI probability)
 *
 * @example
 * // Academic integrity checking
 * function checkOrganizationalAuthenticity(essay) {
 *   const analysis = detectRuleOfThreeObsession(essay, { includeDetails: true });
 *   if (analysis.aiLikelihood > 0.6) {
 *     return {
 *       status: 'suspicious',
 *       triadicPatterns: analysis.detectedPatterns.slice(0, 3)
 *     };
 *   }
 *   return { status: 'likely-human', triadicPatterns: [] };
 * }
 *
 * @example
 * // Writing style assessment
 * function assessOrganizationalNaturalness(content) {
 *   const analysis = detectRuleOfThreeObsession(content);
 *   return {
 *     naturalness: 1 - analysis.aiLikelihood,
 *     triadic_density: analysis.triadicDensity,
 *     organizational_uniformity: analysis.overallScore
 *   };
 * }
 */
export function detectRuleOfThreeObsession(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const {
		minWordCount = 30,
		includeDetails = false,
		sensitivityThreshold = 2.0,
		languagePack,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}

	if (typeof sensitivityThreshold !== "number" || sensitivityThreshold <= 0) {
		throw new Error("Parameter sensitivityThreshold must be a positive number");
	}

	// Count total words using robust Unicode-aware tokenization
	const words = tokenizeWords(text);
	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	// Analyze triadic patterns
	const detectedPatterns = [];
	let totalPatterns = 0;
	let weightedScore = 0;

	const profile = languagePack?.ruleOfThree;

	// Pattern detection functions
	const patterns = {
		// Three-item list patterns
		three_item_lists: (/** @type {string} */ text) => {
			const conj = profile?.conjunctions || new Set(["and", "or"]);
			const seps = profile?.separators || [/[,;]/g];
			const minLen = profile?.minItemLength ?? 3;
			let count = 0;
			// Simple split heuristic: find sequences with two separators and a known conjunction
			const sentences = tokenizeSentences(text);
			for (const s of sentences) {
				const hasConj = Array.from(conj).some((c) =>
					new RegExp(`\\b${c}\\b`, "i").test(s),
				);
				if (!hasConj) continue;
				const sepHits = seps.reduce(
					(/** @type {number} */ sum, /** @type {RegExp} */ re) =>
						sum + (s.match(re) || []).length,
					0,
				);
				if (sepHits < 1) continue;
				// Rough item candidates by comma/semicolon
				const parts = s
					.split(/[;,]/)
					.map((p) => p.trim())
					.filter((p) => p.length >= minLen);
				if (parts.length >= 3) count++;
			}
			return count;
		},

		numbered_three_lists: (/** @type {string} */ text) => {
			const patterns = [
				/(?:^|\n)\s*1[.)].*?(?:\n\s*2[.)].*?(?:\n\s*3[.)].*?))/gims,
				/\b(?:first|1st).*?(?:second|2nd).*?(?:third|3rd)\b/gi,
			];
			let count = 0;
			for (const pattern of patterns) {
				const matches = text.match(pattern) || [];
				count += matches.length;
			}
			return count;
		},

		bullet_three_lists: (/** @type {string} */ text) => {
			const bulletPattern =
				/(?:^|\n)\s*[-•*]\s+.*?(?:\n\s*[-•*]\s+.*?(?:\n\s*[-•*]\s+.*?))/gims;
			const matches = text.match(bulletPattern) || [];
			return matches.length;
		},

		first_second_third: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:first|firstly).*?(?:second|secondly).*?(?:third|thirdly)\b/gi;
			return (text.match(pattern) || []).length;
		},

		initially_then_finally: (/** @type {string} */ text) => {
			const patterns = [
				/\b(?:initially|first).*?(?:then|next).*?(?:finally|lastly)\b/gi,
				/\b(?:beginning|start).*?(?:middle|during).*?(?:end|conclusion)\b/gi,
			];
			let count = 0;
			for (const pattern of patterns) {
				count += (text.match(pattern) || []).length;
			}
			return count;
		},

		abc_patterns: (/** @type {string} */ text) => {
			const patterns = [
				/\b[a-c]\).*?\b[a-c]\).*?\b[a-c]\)/gi,
				/\b[A-C]\).*?\b[A-C]\).*?\b[A-C]\)/gi,
			];
			let count = 0;
			for (const pattern of patterns) {
				count += (text.match(pattern) || []).length;
			}
			return count;
		},

		for_example_three: (/** @type {string} */ text) => {
			const pattern = /\b(?:for example|e\.?g\.?).*?\w+,\s+\w+,?\s+and\s+\w+/gi;
			return (text.match(pattern) || []).length;
		},

		such_as_three: (/** @type {string} */ text) => {
			const pattern = /\bsuch as\b.*?\w+,\s+\w+,?\s+and\s+\w+/gi;
			return (text.match(pattern) || []).length;
		},

		including_three: (/** @type {string} */ text) => {
			const pattern = /\bincluding\b.*?\w+,\s+\w+,?\s+and\s+\w+/gi;
			return (text.match(pattern) || []).length;
		},

		three_adjectives: (/** @type {string} */ text) => {
			// Match patterns like "fast, efficient, and reliable"
			const pattern =
				/\b(?:[a-z]+ly\s+)?[a-z]+,\s+(?:[a-z]+ly\s+)?[a-z]+,?\s+and\s+(?:[a-z]+ly\s+)?[a-z]+\b/gi;
			const matches = text.match(pattern) || [];
			// Filter to likely adjective patterns
			return matches.filter((/** @type {string} */ match) => match.length < 60)
				.length;
		},

		three_adverbs: (/** @type {string} */ text) => {
			const pattern = /\b[a-z]+ly,\s+[a-z]+ly,?\s+and\s+[a-z]+ly\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_nouns: (/** @type {string} */ text) => {
			// Simple noun pattern detection (imperfect but functional)
			const pattern =
				/\b[a-z]+(?:tion|ness|ment|ity|ance|ence|ing|ure|ism),\s+[a-z]+(?:tion|ness|ment|ity|ance|ence|ing|ure|ism),?\s+and\s+[a-z]+(?:tion|ness|ment|ity|ance|ence|ing|ure|ism)\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_clause_sentences: (/** @type {string} */ text) => {
			// Sentences with exactly three major clauses (simplified detection)
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const clauses = sentence
					.split(/[;,]/)
					.filter((/** @type {string} */ c) => c.trim().length > 5);
				if (clauses.length === 3) count++;
			}
			return count;
		},

		three_phrase_sentences: (/** @type {string} */ text) => {
			// Sentences with three distinct phrases separated by commas
			const sentences = tokenizeSentences(text);
			let count = 0;
			for (const sentence of sentences) {
				const phrases = sentence
					.split(",")
					.filter((/** @type {string} */ p) => p.trim().length > 3);
				if (phrases.length === 3) count++;
			}
			return count;
		},

		three_benefits: (/** @type {string} */ text) => {
			const pattern =
				/\bthree\s+(?:benefits|advantages|pros|positives|strengths)\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_ways: (/** @type {string} */ text) => {
			const pattern =
				/\bthree\s+(?:ways|methods|approaches|techniques|strategies)\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_types: (/** @type {string} */ text) => {
			const pattern =
				/\bthree\s+(?:types|kinds|categories|forms|varieties)\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_steps: (/** @type {string} */ text) => {
			const pattern =
				/\bthree\s+(?:steps|stages|phases|processes|procedures)\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_factors: (/** @type {string} */ text) => {
			const pattern =
				/\bthree\s+(?:factors|elements|components|aspects|features)\b/gi;
			return (text.match(pattern) || []).length;
		},

		three_aspects: (/** @type {string} */ text) => {
			const pattern =
				/\bthree\s+(?:aspects|components|dimensions|facets|characteristics)\b/gi;
			return (text.match(pattern) || []).length;
		},

		firstly_secondly_thirdly: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:firstly|first).*?(?:secondly|second).*?(?:thirdly|third)\b/gi;
			return (text.match(pattern) || []).length;
		},

		one_two_three: (/** @type {string} */ text) => {
			const patterns = [
				/\bone\b.*?\btwo\b.*?\bthree\b/gi,
				/\b1\b.*?\b2\b.*?\b3\b/gi,
			];
			let count = 0;
			for (const pattern of patterns) {
				count += (text.match(pattern) || []).length;
			}
			return count;
		},

		beginning_middle_end: (/** @type {string} */ text) => {
			const pattern =
				/\b(?:beginning|start).*?(?:middle|center).*?(?:end|conclusion|finish)\b/gi;
			return (text.match(pattern) || []).length;
		},
	};

	// Analyze each pattern type
	for (const [patternName, humanBaseline] of Object.entries(
		TRIADIC_BASELINES,
	)) {
		const patternFunction =
			/** @type {((text: string) => number) | undefined} */ (
				patterns[/** @type {keyof typeof patterns} */ (patternName)]
			);
		if (patternFunction) {
			const count = patternFunction(text);

			if (count > 0) {
				const frequency = (count / wordCount) * 1000; // Per thousand words
				const ratio = frequency / humanBaseline; // How much higher than human baseline

				// Check if this pattern is overused beyond sensitivity threshold
				if (ratio >= sensitivityThreshold) {
					totalPatterns += count;
					weightedScore += ratio * count; // Weight by frequency

					if (includeDetails) {
						detectedPatterns.push({
							pattern: patternName,
							count,
							frequency,
							humanBaseline,
							ratio,
							overuseLevel:
								ratio >= 4.0 ? "severe" : ratio >= 3.0 ? "high" : "moderate",
							description: getPatternDescription(patternName),
						});
					}
				}
			}
		}
	}

	// Calculate metrics
	const triadicDensity = (totalPatterns / wordCount) * 1000;

	// Calculate overall AI likelihood score
	// Higher triadic density and ratios indicate more AI-like content
	const densityScore = Math.min(triadicDensity / 10, 1); // Cap at 10 patterns per 1000 words
	const ratioScore =
		totalPatterns > 0 ? Math.min(weightedScore / totalPatterns / 4, 1) : 0; // Cap ratio at 4x human baseline
	const aiLikelihood = densityScore * 0.6 + ratioScore * 0.4; // Weight density more heavily

	// Calculate overall score (average ratio across all detected patterns)
	const overallScore = totalPatterns > 0 ? weightedScore / totalPatterns : 0;

	// Sort detected patterns by ratio if details requested
	if (includeDetails) {
		detectedPatterns.sort((a, b) => b.ratio - a.ratio);
	}

	return {
		aiLikelihood,
		overallScore,
		triadicDensity,
		totalPatterns,
		wordCount,
		detectedPatterns: includeDetails ? detectedPatterns : [],
	};
}

/**
 * Returns a human-readable description for a triadic pattern type.
 *
 * @param {string} patternName - The pattern name to describe
 * @returns {string} Human-readable description of the pattern
 */
function getPatternDescription(patternName) {
	/** @type {Record<string, string>} */
	const descriptions = {
		three_item_lists: "Lists with exactly three items (A, B, and C)",
		numbered_three_lists: "Numbered lists with three items (1, 2, 3)",
		bullet_three_lists: "Bullet lists with exactly three points",
		first_second_third: "Sequential first-second-third explanations",
		initially_then_finally: "Initial-then-final transition patterns",
		abc_patterns: "A, B, C enumeration structures",
		for_example_three: "Examples given in groups of three",
		such_as_three: "'Such as' followed by three items",
		including_three: "'Including' followed by three items",
		three_adjectives: "Three adjectives in sequence",
		three_adverbs: "Three adverbs in sequence",
		three_nouns: "Three nouns in sequence",
		three_clause_sentences: "Sentences with exactly three clauses",
		three_phrase_sentences: "Sentences with exactly three phrases",
		three_benefits: "Explicit mention of 'three benefits'",
		three_ways: "Explicit mention of 'three ways'",
		three_types: "Explicit mention of 'three types'",
		three_steps: "Explicit mention of 'three steps'",
		three_factors: "Explicit mention of 'three factors'",
		three_aspects: "Explicit mention of 'three aspects'",
		firstly_secondly_thirdly: "Firstly-secondly-thirdly structures",
		one_two_three: "One-two-three counting patterns",
		beginning_middle_end: "Beginning-middle-end structures",
	};

	return descriptions[patternName] || "Unknown triadic pattern";
}
