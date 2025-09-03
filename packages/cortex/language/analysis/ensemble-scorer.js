/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Ensemble Scorer for Comprehensive AI Text Detection
 *
 * Combines multiple AI detection algorithms into a unified, weighted scoring system
 * that provides the most accurate and robust assessment of whether text is AI-generated.
 * This meta-algorithm leverages the collective intelligence of all individual detectors
 * to minimize false positives and maximize detection accuracy across diverse text types.
 *
 * The ensemble approach addresses the limitations of single-metric detection by
 * combining statistical, linguistic, stylistic, and structural analysis methods.
 * Uses robust cortex building blocks for accurate word counting and international text support.
 */

import { foldCase } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/index.js";

import { analyzeAITransitionPhrases } from "./ai-transition-phrases.js";
// Import all detection algorithms
import { calculateBurstiness } from "./burstiness.js";
import { detectEmDashEpidemic } from "./em-dash-detector.js";
import { analyzeNgramRepetition } from "./ngram-repetition.js";
import { detectParticipalPhraseFormula } from "./participial-phrase-detector.js";
import { detectPerfectGrammar } from "./perfect-grammar-detector.js";
import { approximatePerplexity } from "./perplexity-approximator.js";
import { detectRuleOfThreeObsession } from "./rule-of-three-detector.js";
import { calculateShannonEntropy } from "./shannon-entropy.js";
import { analyzeZipfDeviation } from "./zipf-deviation.js";

/**
 * Algorithm weights based on empirical effectiveness and reliability.
 * Higher weights indicate more reliable indicators of AI-generated content.
 */
const ALGORITHM_WEIGHTS = {
	burstiness: 0.12, // Sentence length variation (strong statistical indicator)
	shannon_entropy: 0.1, // Text predictability (fundamental linguistic measure)
	ngram_repetition: 0.08, // Pattern redundancy (catches mechanical repetition)
	zipf_deviation: 0.07, // Word frequency distribution (statistical foundation)
	ai_transition_phrases: 0.15, // Mechanical phrases (very specific to AI)
	em_dash_epidemic: 0.06, // Punctuation overuse (style indicator)
	rule_of_three: 0.13, // Triadic obsession (strong AI pattern)
	participial_phrases: 0.11, // Mechanical sentence structures (formulaic patterns)
	perplexity_approximator: 0.09, // Word choice predictability (creativity measure)
	perfect_grammar: 0.09, // Error absence (inverse indicator)
};

/**
 * Confidence thresholds for ensemble predictions.
 * Higher agreement between algorithms increases confidence.
 */
const CONFIDENCE_LEVELS = {
	high: 0.8, // Strong consensus across algorithms
	medium: 0.6, // Moderate agreement
	low: 0.4, // Weak consensus
};

/**
 * Text type adjustments for different content categories.
 * Some text types are naturally more AI-like (technical) or human-like (casual).
 */
const TEXT_TYPE_ADJUSTMENTS = {
	technical: 0.05, // Technical writing appears more AI-like
	academic: 0.03, // Academic writing is more formal
	business: 0.04, // Business communication is structured
	creative: -0.02, // Creative writing is more human-like
	casual: -0.08, // Casual text has more human imperfections
	social_media: -0.1, // Social media is very informal
};

/**
 * Analyzes text using the complete ensemble of AI detection algorithms and provides
 * a comprehensive, weighted assessment of AI likelihood. This meta-algorithm combines
 * statistical, linguistic, stylistic, and structural analysis methods to minimize
 * false positives and maximize detection accuracy across diverse text types.
 *
 * The ensemble approach leverages collective intelligence from 10 specialized algorithms:
 * burstiness, Shannon entropy, n-gram repetition, Zipf deviation, AI transition phrases,
 * em-dash epidemic, rule-of-three obsession, participial phrase formula, perplexity
 * approximation, and perfect grammar detection.
 *
 * @param {string} text - The input text to analyze for AI generation patterns.
 * @param {object} [options={}] - Configuration options for the ensemble analysis.
 * @param {number} [options.minWordCount=25] - Minimum word count for reliable analysis.
 * @param {boolean} [options.includeDetails=false] - Whether to include individual algorithm results.
 * @param {string} [options.textType='auto'] - Text type hint ('technical', 'academic', 'business', 'creative', 'casual', 'social_media', 'auto').
 * @param {number} [options.confidenceThreshold=0.6] - Minimum confidence for high-confidence predictions.
 * @param {object} [options.algorithmWeights] - Custom weights for individual algorithms (optional override).
 * @returns {{aiLikelihood: number, confidence: string, weightedScore: number, algorithmCount: number, consensus: number, textType: string, individualResults: Array<Object>}} Comprehensive analysis results.
 *   - aiLikelihood: Overall AI probability score (0-1, higher = more AI-like).
 *   - confidence: Confidence level of the prediction ('high', 'medium', 'low').
 *   - weightedScore: Raw weighted score before normalization.
 *   - algorithmCount: Number of algorithms that could analyze the text.
 *   - consensus: Measure of agreement between algorithms (0-1).
 *   - textType: Detected or specified text type.
 *   - individualResults: Array of results from each algorithm (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string.
 * @throws {Error} When text contains insufficient words for analysis.
 * @throws {Error} When options contain invalid values.
 *
 * @example
 * const aiText = "The comprehensive system delivers optimal performance through advanced algorithms. Furthermore, it provides three main benefits: efficiency, scalability, and reliability. The implementation ensures consistent results across all operational parameters.";
 * const result = analyzeWithEnsemble(aiText);
 * // result.aiLikelihood would be high (e.g., > 0.7) with high confidence
 *
 * @example
 * const humanText = "I can't believe what happened today! The system was acting kinda weird and their were some issues with the setup. Its not perfect but it gets the job done most of the time.";
 * const result = analyzeWithEnsemble(humanText, { textType: 'casual' });
 * // result.aiLikelihood would be low (e.g., < 0.3) with medium-high confidence
 */
export function analyzeWithEnsemble(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Input 'text' must be a string.");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	const {
		minWordCount = 25,
		includeDetails = false,
		textType = "auto",
		confidenceThreshold = 0.6,
		algorithmWeights = ALGORITHM_WEIGHTS,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}
	if (
		typeof confidenceThreshold !== "number" ||
		confidenceThreshold <= 0 ||
		confidenceThreshold > 1
	) {
		throw new Error(
			"Parameter confidenceThreshold must be a number between 0 and 1",
		);
	}

	// Count total words using robust Unicode-aware tokenization
	const words = tokenizeWords(text);
	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	// Detect text type if set to auto
	const detectedTextType =
		textType === "auto" ? detectTextType(text) : textType;

	// Run all algorithms and collect results
	const algorithmResults = [];
	let totalWeightedScore = 0;
	let totalWeight = 0;
	let successfulAlgorithms = 0;

	// Algorithm configurations for consistent analysis
	const algorithmConfigs = {
		minWordCount: Math.max(15, Math.min(minWordCount, 30)), // Adaptive minimum based on algorithm requirements
		includeDetails: false, // We only need scores for ensemble
	};

	// Type-safe algorithm weights
	const weights = /** @type {Record<string, number>} */ (algorithmWeights);

	// Run each algorithm and handle failures gracefully
	const algorithms = [
		{
			name: "burstiness",
			fn: calculateBurstiness,
			weight:
				weights.burstiness !== undefined
					? weights.burstiness
					: ALGORITHM_WEIGHTS.burstiness,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "shannon_entropy",
			fn: calculateShannonEntropy,
			weight:
				weights.shannon_entropy !== undefined
					? weights.shannon_entropy
					: ALGORITHM_WEIGHTS.shannon_entropy,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "ngram_repetition",
			fn: analyzeNgramRepetition,
			weight:
				weights.ngram_repetition !== undefined
					? weights.ngram_repetition
					: ALGORITHM_WEIGHTS.ngram_repetition,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "zipf_deviation",
			fn: analyzeZipfDeviation,
			weight:
				weights.zipf_deviation !== undefined
					? weights.zipf_deviation
					: ALGORITHM_WEIGHTS.zipf_deviation,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "ai_transition_phrases",
			fn: analyzeAITransitionPhrases,
			weight:
				weights.ai_transition_phrases !== undefined
					? weights.ai_transition_phrases
					: ALGORITHM_WEIGHTS.ai_transition_phrases,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "em_dash_epidemic",
			fn: detectEmDashEpidemic,
			weight:
				weights.em_dash_epidemic !== undefined
					? weights.em_dash_epidemic
					: ALGORITHM_WEIGHTS.em_dash_epidemic,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "rule_of_three",
			fn: detectRuleOfThreeObsession,
			weight:
				weights.rule_of_three !== undefined
					? weights.rule_of_three
					: ALGORITHM_WEIGHTS.rule_of_three,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "participial_phrases",
			fn: detectParticipalPhraseFormula,
			weight:
				weights.participial_phrases !== undefined
					? weights.participial_phrases
					: ALGORITHM_WEIGHTS.participial_phrases,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "perplexity_approximator",
			fn: approximatePerplexity,
			weight:
				weights.perplexity_approximator !== undefined
					? weights.perplexity_approximator
					: ALGORITHM_WEIGHTS.perplexity_approximator,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
		{
			name: "perfect_grammar",
			fn: detectPerfectGrammar,
			weight:
				weights.perfect_grammar !== undefined
					? weights.perfect_grammar
					: ALGORITHM_WEIGHTS.perfect_grammar,
			getScore: /** @type {(result: any) => number} */ (result) =>
				result.aiLikelihood,
		},
	];

	// Execute each algorithm and collect results
	for (const algorithm of algorithms) {
		try {
			// Call algorithm function - use type assertion to handle varying signatures
			const algorithmFn = /** @type {(text: string, options?: any) => any} */ (
				algorithm.fn
			);
			const result = algorithmFn(text, algorithmConfigs);
			const score = algorithm.getScore(result);

			if (typeof score === "number" && !Number.isNaN(score)) {
				algorithmResults.push({
					name: algorithm.name,
					score: score,
					weight: algorithm.weight,
					result: includeDetails ? result : null,
				});

				totalWeightedScore += score * algorithm.weight;
				totalWeight += algorithm.weight;
				successfulAlgorithms++;
			}
		} catch (error) {
			// Algorithm failed - skip it but don't fail the ensemble
			if (includeDetails) {
				algorithmResults.push({
					name: algorithm.name,
					score: null,
					weight: algorithm.weight,
					error: error.message,
					result: null,
				});
			}
		}
	}

	if (successfulAlgorithms === 0) {
		throw new Error(
			"No algorithms could successfully analyze the text - text may be too short or invalid",
		);
	}

	// Calculate weighted average
	const rawScore = totalWeightedScore / totalWeight;

	// Apply text type adjustment
	const typeAdjustment =
		/** @type {Record<string, number>} */ (TEXT_TYPE_ADJUSTMENTS)[
			detectedTextType
		] || 0;
	const adjustedScore = Math.max(0, Math.min(1, rawScore + typeAdjustment));

	// Calculate consensus (agreement between algorithms)
	const scores = algorithmResults
		.filter((r) => r.score !== null)
		.map((r) => r.score);
	const consensus = calculateConsensus(scores);

	// Determine confidence level
	const confidence = determineConfidence(
		consensus,
		successfulAlgorithms,
		algorithms.length,
		confidenceThreshold,
	);

	return {
		aiLikelihood: adjustedScore,
		confidence: confidence,
		weightedScore: rawScore,
		algorithmCount: successfulAlgorithms,
		consensus: consensus,
		textType: detectedTextType,
		individualResults: includeDetails ? algorithmResults : [],
	};
}

/**
 * Detects the likely text type based on content analysis using international-aware case folding
 * @param {string} text - Input text to analyze
 * @returns {string} Detected text type
 */
function detectTextType(text) {
	const lowerText = foldCase(text);

	// Social media indicators (check first - very specific patterns)
	if (
		/\b(omg|lol|tbh|imo|cant|dont|wont|ur|u\b)\b/.test(lowerText) ||
		/[!]{2,}/.test(text) ||
		/😭|😊|😂|❤️|🔥/.test(text)
	) {
		return "social_media";
	}

	// Casual indicators (check early - informal patterns)
	if (
		/\b(kinda|gonna|wanna|yeah|okay|stuff|thing|pretty good|not bad)\b/.test(
			lowerText,
		)
	) {
		return "casual";
	}

	// Academic indicators (check before technical to avoid confusion)
	if (
		/\b(research|study|hypothesis|findings|conclusion|longitudinal|correlation|populations|investigation)\b/.test(
			lowerText,
		) ||
		(/\b(analysis|methodology)\b/.test(lowerText) &&
			/\b(research|study|findings)\b/.test(lowerText))
	) {
		return "academic";
	}

	// Technical indicators (check first for strong technical signals)
	if (
		/\b(api|algorithm|database|function|optimization|performance|technical|framework)\b/.test(
			lowerText,
		) ||
		(/\b(implementation|system)\b/.test(lowerText) &&
			/\b(api|algorithm|performance|optimization|technical|framework)\b/.test(
				lowerText,
			))
	) {
		return "technical";
	}

	// Business indicators
	if (
		/\b(stakeholders|objectives|deliverables|strategic|operational|comprehensive|solutions|organizational|roadmap|excellence)\b/.test(
			lowerText,
		) ||
		(/\b(implementation)\b/.test(lowerText) &&
			/\b(strategic|objectives|stakeholders|business|organizational)\b/.test(
				lowerText,
			))
	) {
		return "business";
	}

	// Creative indicators
	if (
		/\b(suddenly|whispered|gazed|dreamed|imagined|beautiful|mysterious|magical)\b/.test(
			lowerText,
		) ||
		text.includes('"') ||
		text.includes("'")
	) {
		return "creative";
	}

	// Default to business if no clear indicators
	return "business";
}

/**
 * Calculates consensus between algorithm scores
 * @param {number[]} scores - Array of algorithm scores
 * @returns {number} Consensus measure (0-1)
 */
function calculateConsensus(scores) {
	if (scores.length < 2) return 1; // Perfect consensus if only one score

	// Calculate standard deviation normalized by mean
	const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
	const variance =
		scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
	const stdDev = Math.sqrt(variance);

	// Convert to consensus measure (lower variance = higher consensus)
	const consensus = Math.max(0, 1 - stdDev / 0.5); // Normalize to 0-1 range

	return consensus;
}

/**
 * Determines confidence level based on consensus and coverage
 * @param {number} consensus - Agreement between algorithms
 * @param {number} successfulAlgorithms - Number of successful algorithms
 * @param {number} totalAlgorithms - Total number of algorithms
 * @param {number} _threshold - Confidence threshold (unused but kept for API compatibility)
 * @returns {string} Confidence level
 */
function determineConfidence(
	consensus,
	successfulAlgorithms,
	totalAlgorithms,
	_threshold,
) {
	const coverage = successfulAlgorithms / totalAlgorithms;

	// Combine consensus and coverage for overall confidence
	const combinedConfidence = consensus * 0.7 + coverage * 0.3;

	if (combinedConfidence >= CONFIDENCE_LEVELS.high) {
		return "high";
	}
	if (combinedConfidence >= CONFIDENCE_LEVELS.medium) {
		return "medium";
	}
	return "low";
}
