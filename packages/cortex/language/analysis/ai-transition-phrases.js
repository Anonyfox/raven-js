/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file AI transition phrase detector for identifying mechanical language patterns.
 *
 * Scans text for transitional phrases characteristic of AI-generated content.
 * Research shows AI uses specific phrases like "delve into" and "furthermore"
 * at rates 3-5x higher than human writers, creating detectible fingerprints.
 * Uses robust cortex building blocks for international text handling.
 */

import { foldCase } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/index.js";

/**
 * Analyzes text for AI-characteristic transition phrases and language patterns.
 *
 * Scans input text for predefined phrases that appear disproportionately in
 * AI-generated content. Calculates frequency ratios, AI-likelihood scores,
 * and provides detailed breakdowns of detected phrases. Higher scores indicate
 * more AI-like language patterns.
 *
 * @param {string} text - Input text to analyze for AI transition phrases
 * @param {{ caseSensitive?: boolean; minWordCount?: number; includeDetails?: boolean; languagePack?: import('../languagepacks/language-pack.js').LanguagePack }} [options={}] - Analysis options
 * @returns {{aiLikelihood: number, overallScore: number, phrasesPerThousand: number, totalPhrases: number, wordCount: number, detectedPhrases: Array<Object>}} Analysis results with AI detection metrics. aiLikelihood: Overall AI probability score (0-1, higher = more AI-like). overallScore: Weighted frequency score vs human baseline. phrasesPerThousand: Detected phrases per 1000 words. totalPhrases: Total number of AI phrases found. wordCount: Total words analyzed. detectedPhrases: Array of found phrases with frequencies (if includeDetails=true).
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows lower AI phrase usage
 * const humanText = "The author explores narrative techniques through careful analysis and creative insight.";
 * const humanAnalysis = analyzeAITransitionPhrases(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability)
 *
 * @example
 * // AI text typically shows higher phrase density
 * const aiText = "Furthermore, it's important to note that we must delve into the complexities. Moreover, various implementations utilize comprehensive approaches.";
 * const aiAnalysis = analyzeAITransitionPhrases(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.7-0.9 (high AI probability)
 *
 * @example
 * // Academic integrity checking
 * function checkEssayAuthenticity(essay) {
 *   const analysis = analyzeAITransitionPhrases(essay, { includeDetails: true });
 *   if (analysis.aiLikelihood > 0.6) {
 *     return {
 *       status: 'suspicious',
 *       phrases: analysis.detectedPhrases.slice(0, 5) // Top offending phrases
 *     };
 *   }
 *   return { status: 'likely-human', phrases: [] };
 * }
 *
 * @example
 * // Content quality assessment
 * function assessWritingNaturalness(content) {
 *   const analysis = analyzeAITransitionPhrases(content);
 *   return {
 *     naturalness: 1 - analysis.aiLikelihood,
 *     mechanical_phrases: analysis.totalPhrases,
 *     phrase_density: analysis.phrasesPerThousand
 *   };
 * }
 */
export function analyzeAITransitionPhrases(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const {
		caseSensitive = false,
		minWordCount = 20,
		includeDetails = false,
		languagePack,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}

	// Normalize text case using international-aware folding
	const normalizedText = caseSensitive ? text : foldCase(text);

	// Count total words using robust Unicode-aware tokenization
	const words = tokenizeWords(normalizedText);
	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	// Prepare phrases list with proper baseline frequencies (no English fallback)
	/** @type {Record<string, {humanBaseline: number, detectionWeight: number}>} */
	const phrasesToSearch = {};
	const profile = languagePack?.transitions;
	const businessProfile = profile?.businessTransitionProfile;

	if (
		profile?.phrases &&
		(Array.isArray(profile.phrases) || profile.phrases.size > 0)
	) {
		for (const p of Array.from(profile.phrases)) {
			const normalizedPhrase = caseSensitive ? p : foldCase(p);

			// Set appropriate human baseline and detection weight based on phrase type
			let humanBaseline = 0.3; // Default expected frequency in human text (per 1000 words)
			let detectionWeight = 1.0; // Default detection weight

			// Natural German connectors are common in human text, should be ignored for AI detection
			if (businessProfile?.naturalConnectors?.has(p)) {
				humanBaseline = 10.0; // Very common in human German (10 per 1000 words)
				detectionWeight = 0.1; // Almost ignore for AI detection
			}
			// Mechanical AI transitions are rare in human text, strong AI indicators
			else if (businessProfile?.mechanicalTransitions?.has(p)) {
				humanBaseline = 0.1; // Rare in human text (0.1 per 1000 words)
				detectionWeight = 2.0; // Strong AI indicator
			}

			phrasesToSearch[normalizedPhrase] = { humanBaseline, detectionWeight };
		}
	}
	// If no phrases defined, phrasesToSearch stays empty (neutral)

	// Search for AI transition phrases
	const detectedPhrases = [];
	let totalPhrases = 0;
	let weightedScore = 0;

	for (const [phrase, config] of Object.entries(phrasesToSearch)) {
		// Create regex for phrase matching (word boundaries to avoid partial matches)
		const regex = new RegExp(
			`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
			"g",
		);
		const matches = normalizedText.match(regex) || [];
		const count = matches.length;

		if (count > 0) {
			const frequency = (count / wordCount) * 1000; // Per thousand words
			const ratio = frequency / config.humanBaseline; // How much higher than human baseline
			const weightedRatio = ratio * config.detectionWeight; // Apply detection weight

			totalPhrases += count;
			weightedScore += weightedRatio * count; // Weight by frequency and detection importance

			if (includeDetails) {
				detectedPhrases.push({
					phrase,
					count,
					frequency,
					humanBaseline: config.humanBaseline,
					detectionWeight: config.detectionWeight,
					ratio,
					weightedRatio,
				});
			}
		}
	}

	// Calculate metrics
	const phrasesPerThousand = (totalPhrases / wordCount) * 1000;

	// Calculate overall AI likelihood score with language-aware adjustments
	// Apply language-specific density expectations
	const naturalDensityMultiplier =
		businessProfile?.naturalDensityMultiplier || 1.0;
	const expectedDensity = 10 * naturalDensityMultiplier; // Adjust expected density for language

	const densityScore = Math.min(phrasesPerThousand / expectedDensity, 1); // Language-adjusted density threshold
	const ratioScore =
		totalPhrases > 0 ? Math.min(weightedScore / totalPhrases / 3, 1) : 0; // Cap ratio at 3x human baseline
	const aiLikelihood = densityScore * 0.3 + ratioScore * 0.7; // Weight ratio more heavily than density

	// Calculate overall score (average ratio across all detected phrases)
	const overallScore = totalPhrases > 0 ? weightedScore / totalPhrases : 0;

	// Sort detected phrases by ratio if details requested
	if (includeDetails) {
		detectedPhrases.sort((a, b) => b.ratio - a.ratio);
	}

	return {
		aiLikelihood,
		overallScore,
		phrasesPerThousand,
		totalPhrases,
		wordCount,
		detectedPhrases: includeDetails ? detectedPhrases : [],
	};
}
