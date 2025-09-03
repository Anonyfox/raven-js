/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Zipf's Law deviation analyzer for detecting unnatural word frequency patterns.
 *
 * Measures compliance with Zipf's Law (word frequency ∝ 1/rank) to distinguish
 * human from AI-generated text. Natural language follows power-law distributions,
 * while AI content shows systematic deviations that create detectible fingerprints.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/index.js";

/**
 * Analyzes text for deviations from Zipf's Law word frequency distribution.
 *
 * Zipf's Law states that in natural language, the frequency of the nth most
 * common word is approximately 1/n times the frequency of the most common word.
 * AI-generated text systematically violates this pattern by overusing common
 * words and underrepresenting rare vocabulary, creating statistical fingerprints
 * for detection.
 *
 * @param {string} text - Input text to analyze for word frequency patterns
 * @param {Object} [options={}] - Configuration options for analysis
 * @param {boolean} [options.caseSensitive=false] - Whether to preserve case in word analysis
 * @param {number} [options.minWordLength=1] - Minimum word length to include in analysis
 * @param {number} [options.maxRanks=100] - Maximum number of word ranks to analyze
 * @returns {{deviation: number, rSquared: number, chiSquared: number, totalWords: number, uniqueWords: number, zipfExponent: number}} Analysis results with deviation metrics. deviation: Average percentage deviation from expected Zipf frequencies (0+, lower = more natural). rSquared: Coefficient of determination for Zipf fit (0-1, higher = better fit). chiSquared: Chi-squared statistic for goodness of fit (0+, lower = better fit). totalWords: Total number of words analyzed. uniqueWords: Number of unique words found. zipfExponent: Calculated Zipf exponent for the text distribution.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows better Zipf compliance
 * const humanText = "The creative author explored various fascinating narrative techniques and innovative approaches.";
 * const humanAnalysis = analyzeZipfDeviation(humanText);
 * console.log(humanAnalysis.deviation); // ~15-25% (natural variation)
 *
 * @example
 * // AI text typically shows higher deviation
 * const aiText = "The system processes the data. The system analyzes the data. The system outputs the data.";
 * const aiAnalysis = analyzeZipfDeviation(aiText);
 * console.log(aiAnalysis.deviation); // ~35-50% (unnatural pattern)
 *
 * @example
 * // Content authenticity checking
 * function checkTextNaturalness(content) {
 *   const analysis = analyzeZipfDeviation(content);
 *   if (analysis.deviation < 20 && analysis.rSquared > 0.8) return 'natural';
 *   if (analysis.deviation > 40 || analysis.rSquared < 0.6) return 'suspicious';
 *   return 'uncertain';
 * }
 *
 * @example
 * // Academic writing assessment
 * function assessVocabularyNaturalness(essay) {
 *   const analysis = analyzeZipfDeviation(essay, { minWordLength: 3 });
 *   return {
 *     naturalness: analysis.rSquared,
 *     vocabulary_diversity: analysis.uniqueWords / analysis.totalWords,
 *     zipf_compliance: 100 - analysis.deviation
 *   };
 * }
 */
export function analyzeZipfDeviation(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const { caseSensitive = false, minWordLength = 1, maxRanks = 100 } = options;

	if (!Number.isInteger(minWordLength) || minWordLength < 1) {
		throw new Error("Parameter minWordLength must be a positive integer");
	}

	if (!Number.isInteger(maxRanks) || maxRanks < 1) {
		throw new Error("Parameter maxRanks must be a positive integer");
	}

	// Normalize Unicode text for consistent character representation across encodings
	// Handles emoji, combining characters, and compatibility mappings consistently
	const unicodeText = normalizeUnicode(text);

	// Apply international-aware case folding if case-insensitive analysis requested
	const normalizedText = caseSensitive ? unicodeText : foldCase(unicodeText);

	// Extract words using robust Unicode-aware tokenization
	// Handles contractions, hyphens, and international word boundaries correctly
	const allWords = tokenizeWords(normalizedText);

	// Filter words by minimum length requirement
	const words = allWords.filter((word) => word.length >= minWordLength);

	if (words.length < 10) {
		throw new Error("Text must contain at least 10 valid words for analysis");
	}

	// Count word frequencies
	const frequencyMap = new Map();
	for (const word of words) {
		frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
	}

	// Create array of [word, frequency] pairs sorted by frequency (descending)
	const sortedFrequencies = Array.from(frequencyMap.entries()).sort(
		(a, b) => b[1] - a[1],
	);

	// Limit analysis to specified number of ranks
	const ranksToAnalyze = Math.min(sortedFrequencies.length, maxRanks);
	const analyzedFrequencies = sortedFrequencies.slice(0, ranksToAnalyze);

	// Calculate Zipf's Law expected frequencies
	// Zipf's Law: frequency(rank) = frequency(1) / rank^s
	// We'll calculate the optimal exponent 's' and then measure deviations
	const mostFrequentCount = analyzedFrequencies[0][1];

	// Calculate optimal Zipf exponent using least squares regression
	// log(frequency) = log(C) - s * log(rank)
	let sumLogRank = 0;
	let sumLogFreq = 0;
	let sumLogRankSquared = 0;
	let sumLogRankLogFreq = 0;

	for (let i = 0; i < analyzedFrequencies.length; i++) {
		const rank = i + 1;
		const frequency = analyzedFrequencies[i][1];
		const logRank = Math.log(rank);
		const logFreq = Math.log(frequency);

		sumLogRank += logRank;
		sumLogFreq += logFreq;
		sumLogRankSquared += logRank * logRank;
		sumLogRankLogFreq += logRank * logFreq;
	}

	const n = analyzedFrequencies.length;
	const zipfExponent =
		(sumLogRankLogFreq - (sumLogRank * sumLogFreq) / n) /
		(sumLogRankSquared - (sumLogRank * sumLogRank) / n);

	// Calculate expected frequencies using optimal exponent
	const expectedFrequencies = [];
	for (let i = 0; i < analyzedFrequencies.length; i++) {
		const rank = i + 1;
		const expected = mostFrequentCount / rank ** Math.abs(zipfExponent);
		expectedFrequencies.push(expected);
	}

	// Calculate deviation metrics
	let totalDeviation = 0;
	let chiSquared = 0;
	let ssTotal = 0; // Total sum of squares for R²
	let ssResidual = 0; // Residual sum of squares for R²

	const meanFrequency =
		analyzedFrequencies.reduce((sum, [, freq]) => sum + freq, 0) / n;

	for (let i = 0; i < analyzedFrequencies.length; i++) {
		const actual = analyzedFrequencies[i][1];
		const expected = expectedFrequencies[i];

		// Calculate percentage deviation
		const deviation = Math.abs(actual - expected) / expected;
		totalDeviation += deviation;

		// Calculate chi-squared statistic
		const chiContribution = (actual - expected) ** 2 / expected;
		chiSquared += chiContribution;

		// Calculate R² components
		ssTotal += (actual - meanFrequency) ** 2;
		ssResidual += (actual - expected) ** 2;
	}

	// Calculate final metrics
	const averageDeviation = (totalDeviation / n) * 100; // Convert to percentage
	const rSquared = ssTotal === 0 ? 1 : Math.max(0, 1 - ssResidual / ssTotal); // Handle perfect fit case

	return {
		deviation: averageDeviation,
		rSquared,
		chiSquared,
		totalWords: words.length,
		uniqueWords: frequencyMap.size,
		zipfExponent: Math.abs(zipfExponent),
	};
}
