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
 * @param {{ caseSensitive?: boolean; minWordCount?: number; includeDetails?: boolean; signaturePhrases?: import('../signaturephrases/signature-phrase.js').SignaturePhraseProfile, transitionsProfile?: { phrases?: string[], regex?: RegExp[], weight?: number, caseInsensitive?: boolean } }} [options={}] - Analysis options
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
		signaturePhrases,
		transitionsProfile,
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

	// Prepare phrases list strictly from language profile (no English fallback)
	/** @type {Record<string, number>} */
	const phrasesToSearch = {};
	const profile = signaturePhrases?.transitions || transitionsProfile;
	if (
		profile?.phrases &&
		(Array.isArray(profile.phrases) || profile.phrases.size > 0)
	) {
		for (const p of Array.from(profile.phrases)) {
			phrasesToSearch[caseSensitive ? p : foldCase(p)] = 0.3;
		}
	}
	// If no phrases defined, phrasesToSearch stays empty (neutral)

	// Search for AI transition phrases
	const detectedPhrases = [];
	let totalPhrases = 0;
	let weightedScore = 0;

	for (const [phrase, humanBaseline] of Object.entries(phrasesToSearch)) {
		// Create regex for phrase matching (word boundaries to avoid partial matches)
		const regex = new RegExp(
			`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
			"g",
		);
		const matches = normalizedText.match(regex) || [];
		const count = matches.length;

		if (count > 0) {
			const frequency = (count / wordCount) * 1000; // Per thousand words
			const ratio = frequency / humanBaseline; // How much higher than human baseline

			totalPhrases += count;
			weightedScore += ratio * count; // Weight by frequency

			if (includeDetails) {
				detectedPhrases.push({
					phrase,
					count,
					frequency,
					humanBaseline,
					ratio,
				});
			}
		}
	}

	// Calculate metrics
	const phrasesPerThousand = (totalPhrases / wordCount) * 1000;

	// Calculate overall AI likelihood score
	// Higher phrase density and ratios indicate more AI-like content
	const densityScore = Math.min(phrasesPerThousand / 10, 1); // Cap at 10 phrases per 1000 words
	const ratioScore =
		totalPhrases > 0 ? Math.min(weightedScore / totalPhrases / 3, 1) : 0; // Cap ratio at 3x human baseline
	const aiLikelihood = densityScore * 0.6 + ratioScore * 0.4; // Weight density more heavily

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
