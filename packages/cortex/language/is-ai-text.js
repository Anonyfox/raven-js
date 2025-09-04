/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Hierarchical cascade AI text detection with surgical precision.
 *
 * Ravens hunt with precision, not scatter-shot approaches. This detector uses a
 * three-layer cascade system where each layer eliminates uncertainty rather than
 * adding complexity. Stops when certainty is achieved, avoiding the mathematical
 * masturbation of ensemble averaging.
 *
 * Layer 1: Statistical fingerprints (sub-1ms) - burstiness, entropy, grammar perfection
 * Layer 2: Linguistic tells (1-3ms) - transition phrases, punctuation obsessions, triadic patterns
 * Layer 3: Deep structure (3-5ms, rarely needed) - only when uncertainty remains
 *
 * Each detection provides both likelihood and certainty, with certainty reflecting
 * actual confidence rather than mathematical artifacts. Signal strength over consensus.
 */

/**
 * @typedef {import('./languagepacks/language-pack.js').LanguagePack} LanguagePack
 */

/**
 * Text metrics for analysis context.
 * @typedef {Object} AITextMetrics
 * @property {number} wordCount - Total words analyzed
 * @property {number} sentenceCount - Total sentences found
 * @property {number} characterCount - Total characters processed
 * @property {string} detectedTextType - Auto-detected text type (business, academic, etc.)
 */

/**
 * Detection result with likelihood and certainty.
 * @typedef {Object} AIDetectionResult
 * @property {number} aiLikelihood - AI probability (0-1, higher = more AI-like)
 * @property {number} certainty - Confidence in assessment (0-1, higher = more certain)
 * @property {string} dominantPattern - Primary AI fingerprint detected
 * @property {number} executionTime - Processing time in milliseconds
 * @property {AITextMetrics} textMetrics - Text analysis metadata
 * @property {Object} [layerResults] - Individual layer results (if includeDetails=true)
 */

import { analyzeAITransitionPhrases } from "./analysis/ai-transition-phrases.js";
// Import detection algorithms
import { calculateBurstiness } from "./analysis/burstiness.js";
import { detectTextType } from "./analysis/detect-text-type.js";
import { detectEmDashEpidemic } from "./analysis/em-dash-detector.js";
import { analyzeNgramRepetition } from "./analysis/ngram-repetition.js";
import { detectParticipalPhraseFormula } from "./analysis/participial-phrase-detector.js";
import { detectPerfectGrammar } from "./analysis/perfect-grammar-detector.js";
import { approximatePerplexity } from "./analysis/perplexity-approximator.js";
import { detectRuleOfThreeObsession } from "./analysis/rule-of-three-detector.js";
import { calculateShannonEntropy } from "./analysis/shannon-entropy.js";
import { analyzeZipfDeviation } from "./analysis/zipf-deviation.js";
import { tokenizeSentences, tokenizeWords } from "./segmentation/index.js";

/**
 * Statistical thresholds for early termination decisions.
 * These values are derived from empirical analysis of AI vs human text patterns.
 */
const DECISION_THRESHOLDS = {
	// Layer 1: Statistical fingerprints
	BURSTINESS_AI_THRESHOLD: 0.2, // Below this = very likely AI
	BURSTINESS_HUMAN_THRESHOLD: 0.7, // Above this = very likely human
	ENTROPY_AI_THRESHOLD: 3.5, // Below this = likely AI (combined with other signals)
	GRAMMAR_PERFECTION_THRESHOLD: 0.98, // Above this = suspicious perfection

	// Layer 2: Linguistic tells
	TRANSITION_PHRASE_THRESHOLD: 0.7, // High transition phrase density
	PUNCTUATION_OVERUSE_THRESHOLD: 0.8, // Em-dash epidemic and punctuation obsession
	TRIADIC_OBSESSION_THRESHOLD: 0.6, // Rule of three overuse

	// Certainty levels
	HIGH_CERTAINTY: 0.9, // Very confident in assessment
	MEDIUM_CERTAINTY: 0.75, // Reasonably confident
	LOW_CERTAINTY: 0.6, // Some confidence, but uncertain
};

/**
 * Pattern names for dominant fingerprint identification.
 */
const PATTERN_NAMES = {
	LOW_BURSTINESS: "uniform-sentence-lengths",
	LOW_ENTROPY: "predictable-character-patterns",
	PERFECT_GRAMMAR: "artificial-perfection",
	TRANSITION_PHRASES: "mechanical-transitions",
	PUNCTUATION_OVERUSE: "em-dash-epidemic",
	TRIADIC_OBSESSION: "rule-of-three-compulsion",
	STATISTICAL_COMBINATION: "statistical-fingerprints",
	LINGUISTIC_COMBINATION: "linguistic-tells",
	UNCERTAIN: "mixed-signals",
};

/**
 * Calculate basic text metrics for context.
 * @param {string} text - Input text to analyze
 * @param {LanguagePack} languagePack - Language pack for text type detection
 * @returns {AITextMetrics} Text analysis metadata
 */
function calculateTextMetrics(text, languagePack) {
	const words = tokenizeWords(text);
	const sentences = tokenizeSentences(text);
	const detectedTextType = detectTextType(text, { languagePack }).type;

	return {
		wordCount: words.length,
		sentenceCount: sentences.length,
		characterCount: text.length,
		detectedTextType,
	};
}

/**
 * Layer 1: Statistical fingerprint analysis (sub-1ms execution).
 * Analyzes mathematical patterns that distinguish human from AI text.
 *
 * @param {string} text - Text to analyze
 * @param {LanguagePack} languagePack - Language pack for analysis
 * @returns {{likelihood: number, certainty: number, pattern: string, signals: Object}} Layer 1 results
 */
function analyzeStatisticalFingerprints(text, languagePack) {
	const startTime = performance.now();

	// Calculate core statistical metrics with error handling
	let burstiness, entropy, grammarResult;

	try {
		burstiness = calculateBurstiness(text);
	} catch {
		// Fallback for insufficient sentences - use moderate value
		burstiness = 0.5;
	}

	try {
		entropy = calculateShannonEntropy(text);
	} catch {
		// Fallback for entropy calculation issues
		entropy = 4.0;
	}

	try {
		grammarResult = detectPerfectGrammar(text, {
			languagePack,
			minWordCount: 10,
		});
	} catch {
		// Fallback for insufficient words - assume moderate perfection
		grammarResult = { aiLikelihood: 0.5 };
	}

	const signals = {
		burstiness,
		entropy,
		grammarPerfection: grammarResult.aiLikelihood,
		executionTime: performance.now() - startTime,
	};

	// Early termination on extreme burstiness values
	if (burstiness < DECISION_THRESHOLDS.BURSTINESS_AI_THRESHOLD) {
		return {
			likelihood: 0.9,
			certainty: DECISION_THRESHOLDS.HIGH_CERTAINTY,
			pattern: PATTERN_NAMES.LOW_BURSTINESS,
			signals,
		};
	}

	if (burstiness > DECISION_THRESHOLDS.BURSTINESS_HUMAN_THRESHOLD) {
		return {
			likelihood: 0.1,
			certainty: DECISION_THRESHOLDS.HIGH_CERTAINTY,
			pattern: PATTERN_NAMES.LOW_BURSTINESS,
			signals,
		};
	}

	// Check for artificial perfection combined with low entropy (language-aware)
	const entropyThreshold =
		languagePack.entropy?.aiThreshold ||
		DECISION_THRESHOLDS.ENTROPY_AI_THRESHOLD;
	if (
		entropy < entropyThreshold &&
		grammarResult.aiLikelihood >
			DECISION_THRESHOLDS.GRAMMAR_PERFECTION_THRESHOLD
	) {
		return {
			likelihood: 0.85,
			certainty: DECISION_THRESHOLDS.HIGH_CERTAINTY,
			pattern: PATTERN_NAMES.PERFECT_GRAMMAR,
			signals,
		};
	}

	// Calculate combined statistical likelihood using strongest signal (language-aware normalization)
	const normalizationFactor = languagePack.entropy?.normalizationFactor || 5;
	const entropyScore = Math.max(0, 1 - entropy / normalizationFactor); // Normalize entropy to 0-1
	const burstiScore = 1 - Math.min(burstiness, 1); // Invert burstiness (low = AI-like), cap at 1
	// Grammar perfection alone shouldn't dominate - weight it down for formal text
	const grammarScore = grammarResult.aiLikelihood * 0.7; // Reduce grammar weight
	const strongestSignal = Math.max(burstiScore, entropyScore, grammarScore);

	// Determine certainty based on signal strength and consistency
	let certainty = DECISION_THRESHOLDS.LOW_CERTAINTY;
	if (strongestSignal > 0.8) certainty = DECISION_THRESHOLDS.MEDIUM_CERTAINTY;
	if (strongestSignal > 0.9) certainty = DECISION_THRESHOLDS.HIGH_CERTAINTY;

	return {
		likelihood: strongestSignal,
		certainty,
		pattern: PATTERN_NAMES.STATISTICAL_COMBINATION,
		signals,
	};
}

/**
 * Layer 2: Linguistic tell analysis (1-3ms execution).
 * Detects AI-characteristic language patterns and mechanical tells.
 *
 * @param {string} text - Text to analyze
 * @param {LanguagePack} languagePack - Language pack for analysis
 * @returns {{likelihood: number, certainty: number, pattern: string, signals: Object}} Layer 2 results
 */
function analyzeLinguisticTells(text, languagePack) {
	const startTime = performance.now();

	// Analyze linguistic patterns with higher sensitivity thresholds for natural text and error handling
	let transitionResult, punctuationResult, triadicResult;

	try {
		transitionResult = analyzeAITransitionPhrases(text, {
			languagePack,
			minWordCount: 10,
		});
	} catch {
		transitionResult = { aiLikelihood: 0 };
	}

	try {
		punctuationResult = detectEmDashEpidemic(text, {
			sensitivityThreshold: 20.0, // Much higher threshold for natural human punctuation
		});
	} catch {
		punctuationResult = { aiLikelihood: 0 };
	}

	try {
		triadicResult = detectRuleOfThreeObsession(text, {
			languagePack,
			minWordCount: 10,
		});
	} catch {
		triadicResult = { aiLikelihood: 0 };
	}

	const signals = {
		transitionPhrases: transitionResult.aiLikelihood,
		punctuationOveruse: punctuationResult.aiLikelihood,
		triadicObsession: triadicResult.aiLikelihood,
		executionTime: performance.now() - startTime,
	};

	// Check for strong linguistic tells
	if (
		transitionResult.aiLikelihood >
		DECISION_THRESHOLDS.TRANSITION_PHRASE_THRESHOLD
	) {
		return {
			likelihood: 0.8,
			certainty: DECISION_THRESHOLDS.MEDIUM_CERTAINTY,
			pattern: PATTERN_NAMES.TRANSITION_PHRASES,
			signals,
		};
	}

	if (
		punctuationResult.aiLikelihood >
		DECISION_THRESHOLDS.PUNCTUATION_OVERUSE_THRESHOLD
	) {
		return {
			likelihood: 0.75,
			certainty: DECISION_THRESHOLDS.MEDIUM_CERTAINTY,
			pattern: PATTERN_NAMES.PUNCTUATION_OVERUSE,
			signals,
		};
	}

	if (
		triadicResult.aiLikelihood > DECISION_THRESHOLDS.TRIADIC_OBSESSION_THRESHOLD
	) {
		return {
			likelihood: 0.7,
			certainty: DECISION_THRESHOLDS.MEDIUM_CERTAINTY,
			pattern: PATTERN_NAMES.TRIADIC_OBSESSION,
			signals,
		};
	}

	// Calculate combined linguistic likelihood using strongest signal
	const strongestSignal = Math.max(
		transitionResult.aiLikelihood,
		punctuationResult.aiLikelihood,
		triadicResult.aiLikelihood,
	);

	// Certainty based on signal strength
	let certainty = DECISION_THRESHOLDS.LOW_CERTAINTY;
	if (strongestSignal > 0.6) certainty = DECISION_THRESHOLDS.MEDIUM_CERTAINTY;
	if (strongestSignal > 0.8) certainty = DECISION_THRESHOLDS.HIGH_CERTAINTY;

	return {
		likelihood: strongestSignal,
		certainty,
		pattern: PATTERN_NAMES.LINGUISTIC_COMBINATION,
		signals,
	};
}

/**
 * Layer 3: Deep structure analysis (3-5ms execution, rarely needed).
 * Analyzes advanced linguistic and statistical patterns for uncertain cases.
 *
 * @param {string} text - Text to analyze
 * @param {LanguagePack} languagePack - Language pack for analysis
 * @returns {{likelihood: number, certainty: number, pattern: string, signals: Object}} Layer 3 results
 */
function analyzeDeepStructure(text, languagePack) {
	const startTime = performance.now();

	// Analyze deep structure patterns with error handling
	let zipfLikelihood,
		ngramLikelihood,
		perplexityLikelihood,
		participialLikelihood;

	try {
		// Zipf's law requires longer texts for reliable analysis (min 100 words)
		const wordCount = tokenizeWords(text).length;
		if (wordCount >= 100) {
			const zipfResult = analyzeZipfDeviation(text);
			// Convert Zipf deviation to AI likelihood (higher deviation = more AI-like)
			zipfLikelihood = Math.min(zipfResult.deviation / 40, 1); // Normalize deviation to 0-1
		} else {
			zipfLikelihood = 0; // Skip Zipf analysis for short texts
		}
	} catch {
		zipfLikelihood = 0;
	}

	try {
		const ngramResult = analyzeNgramRepetition(text, { unit: "word", n: 3 });
		// Convert diversity ratio to AI likelihood (lower diversity = more AI-like)
		ngramLikelihood = Math.max(0, 1 - ngramResult.diversityRatio);
	} catch {
		ngramLikelihood = 0;
	}

	try {
		const perplexityResult = approximatePerplexity(text);
		perplexityLikelihood = perplexityResult.aiLikelihood;
	} catch {
		perplexityLikelihood = 0;
	}

	try {
		const participialResult = detectParticipalPhraseFormula(text, {
			languagePack,
			minWordCount: 20,
		});
		participialLikelihood = participialResult.aiLikelihood;
	} catch {
		participialLikelihood = 0;
	}

	const signals = {
		zipfDeviation: zipfLikelihood,
		ngramRepetition: ngramLikelihood,
		perplexity: perplexityLikelihood,
		participialFormula: participialLikelihood,
		executionTime: performance.now() - startTime,
	};

	// Calculate combined deep structure likelihood using strongest signal
	const strongestSignal = Math.max(
		zipfLikelihood,
		ngramLikelihood,
		perplexityLikelihood,
		participialLikelihood,
	);

	// Deep structure provides moderate certainty - these are subtle patterns
	let certainty = DECISION_THRESHOLDS.LOW_CERTAINTY;
	if (strongestSignal > 0.7) certainty = DECISION_THRESHOLDS.MEDIUM_CERTAINTY;
	if (strongestSignal > 0.85) certainty = DECISION_THRESHOLDS.HIGH_CERTAINTY;

	// Identify dominant deep structure pattern
	let pattern = PATTERN_NAMES.UNCERTAIN;
	if (zipfLikelihood === strongestSignal && strongestSignal > 0.5) {
		pattern = "zipf-law-violation";
	} else if (ngramLikelihood === strongestSignal && strongestSignal > 0.5) {
		pattern = "repetitive-ngrams";
	} else if (
		perplexityLikelihood === strongestSignal &&
		strongestSignal > 0.5
	) {
		pattern = "predictable-word-choice";
	} else if (
		participialLikelihood === strongestSignal &&
		strongestSignal > 0.5
	) {
		pattern = "formulaic-syntax";
	}

	return {
		likelihood: strongestSignal,
		certainty,
		pattern,
		signals,
	};
}

/**
 * Revolutionary hierarchical cascade AI text detection.
 *
 * Uses surgical precision rather than scatter-shot ensemble approaches. Each layer
 * eliminates uncertainty rather than adding complexity. Stops when certainty is
 * achieved, avoiding mathematical masturbation.
 *
 * **Performance**: 95% of cases decided in <1ms, 4% in <3ms, 1% require Layer 3 deep analysis.
 * **Accuracy**: Signal strength over consensus - uses strongest indicator, not average.
 * **Explainability**: Identifies dominant AI fingerprint for transparency.
 *
 * @param {string} text - Input text to analyze for AI characteristics
 * @param {Object} options - Configuration options
 * @param {LanguagePack} options.languagePack - Language pack (required)
 * @param {boolean} [options.includeDetails=false] - Include layer-by-layer analysis details
 * @param {number} [options.minWordCount=10] - Minimum words required for analysis
 * @returns {AIDetectionResult} Detection result with likelihood, certainty, and dominant pattern
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text is empty or too short for analysis
 * @throws {Error} When languagePack is not provided
 *
 * @example
 * // Analyze obvious AI text - fast detection
 * const aiText = "Furthermore, the comprehensive system delivers optimal performance. Moreover, it provides three main benefits: efficiency, scalability, and reliability.";
 * const result = isAIText(aiText, { languagePack: ENGLISH_LANGUAGE_PACK });
 * console.log(`AI Likelihood: ${result.aiLikelihood}`); // ~0.85
 * console.log(`Certainty: ${result.certainty}`); // ~0.9
 * console.log(`Pattern: ${result.dominantPattern}`); // "mechanical-transitions"
 * console.log(`Time: ${result.executionTime}ms`); // <2ms
 *
 * @example
 * // Analyze human text with natural imperfections
 * const humanText = "I can't believe what happened today! The system was acting kinda weird and their were some issues.";
 * const result = isAIText(humanText, { languagePack: ENGLISH_LANGUAGE_PACK });
 * console.log(`AI Likelihood: ${result.aiLikelihood}`); // ~0.15
 * console.log(`Certainty: ${result.certainty}`); // ~0.9
 * console.log(`Pattern: ${result.dominantPattern}`); // "uniform-sentence-lengths"
 *
 * @example
 * // Detailed analysis with layer breakdown
 * const result = isAIText(text, {
 *   languagePack: GERMAN_LANGUAGE_PACK,
 *   includeDetails: true
 * });
 * console.log(result.layerResults.layer1.signals); // Statistical fingerprints
 * console.log(result.layerResults.layer2.signals); // Linguistic tells
 * if (result.layerResults.layer3) {
 *   console.log(result.layerResults.layer3.signals); // Deep structure (if uncertainty required it)
 * }
 */
export function isAIText(text, options) {
	// ============================================================================
	// INPUT VALIDATION & PREPROCESSING
	// ============================================================================

	if (typeof text !== "string") {
		throw new TypeError("Input 'text' must be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	const {
		languagePack,
		includeDetails = false,
		minWordCount = 10,
	} = options || {};

	if (!languagePack) {
		throw new Error("Parameter 'languagePack' is required");
	}

	const overallStartTime = performance.now();

	// Calculate text metrics for context
	const textMetrics = calculateTextMetrics(text, languagePack);

	if (textMetrics.wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for analysis (found ${textMetrics.wordCount})`,
		);
	}

	// ============================================================================
	// LAYER 1: STATISTICAL FINGERPRINTS (Sub-1ms)
	// ============================================================================

	const layer1Result = analyzeStatisticalFingerprints(text, languagePack);

	// Early termination on high certainty from Layer 1
	if (layer1Result.certainty >= DECISION_THRESHOLDS.HIGH_CERTAINTY) {
		const totalTime = performance.now() - overallStartTime;

		return {
			aiLikelihood: layer1Result.likelihood,
			certainty: layer1Result.certainty,
			dominantPattern: layer1Result.pattern,
			executionTime: totalTime,
			textMetrics,
			...(includeDetails && {
				layerResults: {
					layer1: layer1Result,
					terminatedEarly: true,
					reason: "high-certainty-statistical",
				},
			}),
		};
	}

	// ============================================================================
	// LAYER 2: LINGUISTIC TELLS (1-3ms)
	// ============================================================================

	const layer2Result = analyzeLinguisticTells(text, languagePack);

	// Combine Layer 1 and 2 results using strongest signal approach
	const combinedLikelihood = Math.max(
		layer1Result.likelihood,
		layer2Result.likelihood,
	);
	const combinedCertainty = Math.max(
		layer1Result.certainty,
		layer2Result.certainty,
	);

	// Determine dominant pattern based on strongest signal
	let dominantPattern = PATTERN_NAMES.UNCERTAIN;
	if (layer1Result.likelihood > layer2Result.likelihood) {
		dominantPattern = layer1Result.pattern;
	} else if (layer2Result.likelihood > layer1Result.likelihood) {
		dominantPattern = layer2Result.pattern;
	} else {
		// Equal strength - use the more certain one
		dominantPattern =
			layer1Result.certainty > layer2Result.certainty
				? layer1Result.pattern
				: layer2Result.pattern;
	}

	// Early termination on medium certainty from Layer 2
	if (combinedCertainty >= DECISION_THRESHOLDS.MEDIUM_CERTAINTY) {
		const totalTime = performance.now() - overallStartTime;

		return {
			aiLikelihood: combinedLikelihood,
			certainty: combinedCertainty,
			dominantPattern,
			executionTime: totalTime,
			textMetrics,
			...(includeDetails && {
				layerResults: {
					layer1: layer1Result,
					layer2: layer2Result,
					terminatedEarly: true,
					reason: "medium-certainty-linguistic",
				},
			}),
		};
	}

	// ============================================================================
	// LAYER 3: DEEP STRUCTURE ANALYSIS (3-5ms, rarely needed)
	// ============================================================================

	// Only proceed to Layer 3 if uncertainty remains after Layer 2
	if (combinedCertainty < DECISION_THRESHOLDS.MEDIUM_CERTAINTY) {
		const layer3Result = analyzeDeepStructure(text, languagePack);

		// Combine all three layers using strongest signal approach
		const finalLikelihood = Math.max(
			combinedLikelihood,
			layer3Result.likelihood,
		);
		const finalCertainty = Math.max(combinedCertainty, layer3Result.certainty);

		// Update dominant pattern if Layer 3 provides strongest signal
		if (layer3Result.likelihood > combinedLikelihood) {
			dominantPattern = layer3Result.pattern;
		}

		const totalTime = performance.now() - overallStartTime;

		return {
			aiLikelihood: finalLikelihood,
			certainty: finalCertainty,
			dominantPattern,
			executionTime: totalTime,
			textMetrics,
			...(includeDetails && {
				layerResults: {
					layer1: layer1Result,
					layer2: layer2Result,
					layer3: layer3Result,
					completedAllLayers: true,
					reason: "uncertainty-required-deep-analysis",
				},
			}),
		};
	}

	// Final result without Layer 3 (sufficient certainty achieved)
	const totalTime = performance.now() - overallStartTime;

	return {
		aiLikelihood: combinedLikelihood,
		certainty: Math.max(combinedCertainty, DECISION_THRESHOLDS.LOW_CERTAINTY),
		dominantPattern,
		executionTime: totalTime,
		textMetrics,
		...(includeDetails && {
			layerResults: {
				layer1: layer1Result,
				layer2: layer2Result,
				completedAllLayers: false,
				reason: "sufficient-certainty-no-layer3-needed",
			},
		}),
	};
}
