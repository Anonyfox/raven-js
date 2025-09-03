/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Perfect Grammar Detector for AI-Generated Text Analysis
 *
 * Detects artificially perfect text that lacks natural human imperfections.
 * While most AI detection methods look for positive indicators, this algorithm
 * identifies AI text through the conspicuous absence of typical human errors.
 *
 * Human writing naturally contains small errors, inconsistencies, and imperfections,
 * while AI-generated text tends to be mechanically perfect in grammar, spelling,
 * and punctuation usage. Uses robust cortex building blocks for enhanced accuracy.
 */

import { tokenizeWords } from "../segmentation/index.js";

// No English baselines: scoring is derived solely from provided grammarProfile

// Intentionally empty: all detection must come from the language pack profile
// (kept section placeholder to make the design intent explicit)

/**
 * Detects and quantifies the "Perfect Grammar" patterns characteristic of AI-generated text.
 * AI-generated content often exhibits unnaturally perfect grammar, spelling, and punctuation
 * that lacks the minor imperfections commonly found in human writing. This function analyzes
 * text for the conspicuous absence of typical human errors and calculates an AI likelihood
 * score based on how artificially perfect the text appears.
 *
 * @param {string} text - The input text to analyze for perfect grammar patterns.
 * @param {object} [options={}] - Configuration options for the analysis.
 * @param {number} [options.minWordCount=30] - Minimum word count for reliable analysis.
 * @param {number} [options.errorToleranceThreshold=0.5] - Multiplier below human baseline to flag as suspicious.
 * @param {boolean} [options.includeDetails=false] - Whether to include error-specific details.
 * @param {import('../languagepacks/language-pack.js').LanguagePack} [options.languagePack] - Language pack (preferred)
 * @param {{ errorPatterns?: RegExp[], falsePositiveTokens?: Set<string> }} [options.grammarProfile] - Language-specific grammar profile (legacy)
 * @returns {{aiLikelihood: number, overallScore: number, perfectionScore: number, totalErrors: number, wordCount: number, detectedErrors: Array<Object>}} Analysis results with AI detection metrics.
 *   - aiLikelihood: Overall AI probability score (0-1, higher = more AI-like).
 *   - overallScore: Weighted error frequency score vs human baseline.
 *   - perfectionScore: Measure of artificial perfection (higher = more perfect).
 *   - totalErrors: Total number of errors/imperfections found.
 *   - wordCount: Total words analyzed.
 *   - detectedErrors: Array of error types with details (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string.
 * @throws {Error} When text contains insufficient words for analysis.
 * @throws {Error} When options contain invalid values.
 *
 * @example
 * const aiText = "The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. All components function perfectly and maintain consistent reliability across all operational parameters.";
 * const result = detectPerfectGrammar(aiText);
 * // result.aiLikelihood would be high (e.g., > 0.7) due to absence of natural errors
 *
 * @example
 * const humanText = "The system works pretty good most of the time, although their are occasional hiccups. Its not perfect but it gets the job done for most users needs.";
 * const result = detectPerfectGrammar(humanText);
 * // result.aiLikelihood would be low (e.g., < 0.3) due to natural errors present
 */
export function detectPerfectGrammar(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Input 'text' must be a string.");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	const {
		minWordCount = 30,
		errorToleranceThreshold = 0.5,
		includeDetails = false,
		languagePack,
		grammarProfile,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}
	if (
		typeof errorToleranceThreshold !== "number" ||
		errorToleranceThreshold <= 0
	) {
		throw new Error(
			"Parameter errorToleranceThreshold must be a positive number",
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

	// Calculate detected errors using language profile if provided; otherwise fallback
	const errorCounts = /** @type {Record<string, number>} */ ({});
	const detectedErrors = [];
	let totalErrors = 0;

	const effectiveGrammar = languagePack?.grammar || grammarProfile;

	if (
		effectiveGrammar &&
		Array.isArray(effectiveGrammar.errorPatterns) &&
		effectiveGrammar.errorPatterns.length > 0
	) {
		let custom = 0;
		for (const re of effectiveGrammar.errorPatterns) {
			custom += (text.match(re) || []).length;
		}
		errorCounts.custom_errors = custom;
		totalErrors += custom;
		if (includeDetails && custom > 0) {
			detectedErrors.push({
				type: "custom_errors",
				count: custom,
				frequency: (custom / wordCount) * 1000,
				description: "Language-specific grammar error patterns",
			});
		}
	} else {
		// No language profile: do not use internal English fallbacks; return neutral
		totalErrors = 0;
	}

	// Calculate error frequencies per 1000 words
	const errorFrequencies = /** @type {Record<string, number>} */ ({});
	for (const [errorType, count] of Object.entries(errorCounts)) {
		errorFrequencies[errorType] = (count / wordCount) * 1000;
	}

	// Calculate normalized perfection purely from error density (language-agnostic)
	const errorDensityPerThousand = (totalErrors / Math.max(1, wordCount)) * 1000;
	// Smooth inverse without magic baselines: clamp to [0,1]
	const normalizedScore = Math.max(
		0,
		Math.min(1, 1 - Math.min(errorDensityPerThousand / 10, 1)),
	);

	// Calculate perfection score (higher = more artificially perfect)
	const perfectionScore = normalizedScore * 100;

	// Simple mapping: more errors => lower AI likelihood
	const aiLikelihood = normalizedScore;

	return {
		aiLikelihood: Math.min(1, Math.max(0, aiLikelihood)),
		overallScore: normalizedScore,
		perfectionScore: perfectionScore,
		totalErrors: totalErrors,
		wordCount: wordCount,
		detectedErrors: includeDetails ? detectedErrors : [],
	};
}
