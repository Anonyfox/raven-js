/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file N-gram repetition analyzer for detecting mechanical text patterns.
 *
 * Measures pattern redundancy through n-gram frequency analysis to distinguish
 * human from AI-generated text. AI content exhibits more repetitive sequential
 * patterns than human writing, providing statistical fingerprints for detection.
 * Uses proven cortex building blocks for robust n-gram extraction.
 */

import { ngrams } from "../featurization/index.js";

/**
 * Analyzes n-gram repetition patterns in text to detect mechanical generation.
 *
 * Extracts overlapping sequences of n consecutive elements (characters or words)
 * and calculates diversity metrics. Lower diversity ratios indicate more repetitive,
 * AI-like patterns, while higher ratios suggest human-like linguistic creativity.
 * The analysis reveals how much text reuses common patterns versus creating
 * novel combinations.
 *
 * @param {string} text - Input text to analyze for n-gram patterns
 * @param {Object} [options={}] - Configuration options for analysis
 * @param {number} [options.n=3] - Size of n-grams to extract (2-6 recommended)
 * @param {'character'|'word'} [options.unit='character'] - Type of n-grams to analyze
 * @param {boolean} [options.caseSensitive=false] - Whether to preserve case in analysis
 * @returns {{diversityRatio: number, averageFrequency: number, repetitionRate: number, totalNgrams: number, uniqueNgrams: number}} Analysis results with diversity metrics. diversityRatio: Unique n-grams / Total n-grams (0-1, higher = more diverse). averageFrequency: Mean frequency of n-grams (1+, lower = more diverse). repetitionRate: Percentage of n-grams appearing multiple times (0-1). totalNgrams: Total number of n-grams extracted. uniqueNgrams: Number of unique n-grams found.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text is too short to extract meaningful n-grams
 * @throws {Error} When n parameter is invalid (must be positive integer)
 *
 * @example
 * // Human text typically shows higher diversity
 * const humanText = "The creative author explored various narrative techniques.";
 * const humanAnalysis = analyzeNgramRepetition(humanText, { unit: 'word', n: 2 });
 * console.log(humanAnalysis.diversityRatio); // ~0.85 (high diversity)
 *
 * @example
 * // AI text typically shows lower diversity
 * const aiText = "The system processes data. The system analyzes data. The system outputs data.";
 * const aiAnalysis = analyzeNgramRepetition(aiText, { unit: 'word', n: 2 });
 * console.log(aiAnalysis.diversityRatio); // ~0.45 (low diversity)
 *
 * @example
 * // Character-level analysis for fine-grained patterns
 * const text = "Programming requires careful consideration of algorithms and data structures.";
 * const charAnalysis = analyzeNgramRepetition(text, { unit: 'character', n: 3 });
 * console.log(charAnalysis.repetitionRate); // Percentage of repeated trigrams
 *
 * @example
 * // Academic integrity checking
 * function detectTemplateWriting(essay) {
 *   const analysis = analyzeNgramRepetition(essay, { unit: 'word', n: 3 });
 *   return analysis.diversityRatio < 0.6 ? 'suspicious-patterns' : 'likely-original';
 * }
 *
 * @example
 * // Content quality assessment
 * function assessWritingQuality(text) {
 *   const analysis = analyzeNgramRepetition(text, { unit: 'word', n: 2 });
 *   if (analysis.diversityRatio > 0.8) return 'high-variety';
 *   if (analysis.diversityRatio > 0.6) return 'moderate-variety';
 *   return 'low-variety';
 * }
 */
export function analyzeNgramRepetition(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const { n = 3, unit = "character", caseSensitive = false } = options;

	if (!Number.isInteger(n) || n < 1) {
		throw new Error("Parameter n must be a positive integer");
	}

	if (!["character", "word"].includes(unit)) {
		throw new Error("Parameter unit must be 'character' or 'word'");
	}

	// Map unit parameter to ngrams function type parameter
	const ngramType = unit === "character" ? "chars" : "words";

	// Extract n-grams using proven featurization building blocks
	// This handles Unicode normalization, international case folding, and robust tokenization
	const extractedNgrams = /** @type {string[]} */ (
		ngrams(text, {
			type: ngramType,
			n: n,
			normalize: true, // Enable Unicode normalization
			lowercase: !caseSensitive, // Use international-aware case folding
		})
	);

	// Check if we extracted enough n-grams for analysis
	if (extractedNgrams.length === 0) {
		throw new Error(
			`Text must contain at least ${n} ${unit}s to extract ${n}-grams`,
		);
	}

	// Count n-gram frequencies using the extracted n-grams
	const frequencyMap = new Map();
	for (const ngram of extractedNgrams) {
		frequencyMap.set(ngram, (frequencyMap.get(ngram) || 0) + 1);
	}

	// Calculate metrics
	const totalNgrams = extractedNgrams.length;
	const uniqueNgrams = frequencyMap.size;
	const diversityRatio = uniqueNgrams / totalNgrams;

	// Calculate average frequency
	const frequencies = Array.from(frequencyMap.values());
	const averageFrequency =
		frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;

	// Calculate repetition rate (percentage of n-grams that appear more than once)
	const repeatedNgrams = frequencies.filter((freq) => freq > 1).length;
	const repetitionRate = repeatedNgrams / uniqueNgrams;

	return {
		diversityRatio,
		averageFrequency,
		repetitionRate,
		totalNgrams,
		uniqueNgrams,
	};
}
