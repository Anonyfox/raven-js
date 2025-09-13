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
 * Measures compliance with George Zipf's 1949 power-law distribution (f ∝ 1/r^s)
 * to distinguish human from AI-generated text. Natural language follows predictable
 * power-law patterns while AI content shows systematic deviations that create
 * statistical fingerprints for detection. Uses least squares regression for
 * optimal exponent fitting.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/index.js";

/**
 * Analyzes text for deviations from Zipf's Law word frequency distribution.
 *
 * Implements George Zipf's principle that word frequency follows a power-law
 * distribution: frequency(rank) ∝ 1/rank^s where s ≈ 1 for natural language.
 * Uses least squares regression on log-log transformed data to find optimal
 * exponent, then measures goodness-of-fit with multiple statistical metrics.
 *
 * **Algorithm**: Tokenize → count frequencies → sort by frequency → fit Zipf curve
 * via linear regression on log(frequency) vs log(rank) → calculate deviation metrics.
 *
 * **Why it works**: AI models produce more uniform or skewed frequency distributions
 * due to their statistical training objectives, while human language naturally
 * follows power-law patterns from diverse vocabulary usage and cognitive processes.
 *
 * **Performance**: O(n log n) time complexity dominated by sorting word frequencies,
 * where n is vocabulary size. Memory scales with unique words. Suitable for texts
 * up to 10K+ words with typical vocabulary sizes.
 *
 * @param {string} text - Input text to analyze for word frequency patterns (Unicode-aware)
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.caseSensitive=false] - Whether to preserve case (default: fold case for consistency)
 * @param {number} [options.minWordLength=1] - Minimum word length to include (default: 1, all words)
 * @param {number} [options.maxRanks=100] - Maximum word ranks to analyze (default: 100, top frequent words)
 * @returns {{deviation: number, rSquared: number, chiSquared: number, totalWords: number, uniqueWords: number, zipfExponent: number}} Analysis results. deviation: Average percentage deviation from fitted Zipf curve (0+, lower = more natural). rSquared: Coefficient of determination for power-law fit (0-1, higher = better Zipf compliance). chiSquared: Chi-squared goodness-of-fit statistic (0+, lower = better fit). totalWords: Total words analyzed after filtering. uniqueWords: Number of unique words in analysis. zipfExponent: Fitted Zipf exponent s (typically 0.5-2.0 for natural language).
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains < 10 valid words for statistical analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows low deviation, high R²
 * const humanText = "The creative author explored various fascinating narrative techniques with innovative approaches and remarkable insight.";
 * const humanAnalysis = analyzeZipfDeviation(humanText);
 * console.log(humanAnalysis.deviation); // ~15-25% (natural variation)
 * console.log(humanAnalysis.rSquared); // ~0.85-0.95 (good power-law fit)
 * console.log(humanAnalysis.zipfExponent); // ~0.8-1.2 (typical for natural language)
 *
 * @example
 * // AI text typically shows higher deviation, lower R²
 * const aiText = "The system processes the data. The system analyzes the data. The system outputs the data.";
 * const aiAnalysis = analyzeZipfDeviation(aiText);
 * console.log(aiAnalysis.deviation); // ~35-50% (unnatural pattern)
 * console.log(aiAnalysis.rSquared); // ~0.6-0.8 (poorer fit)
 *
 * @example
 * // Content authenticity assessment
 * function assessTextNaturalness(content) {
 *   const analysis = analyzeZipfDeviation(content);
 *   const authenticity = {
 *     score: analysis.rSquared * (1 - analysis.deviation/100),
 *     assessment: analysis.deviation < 25 && analysis.rSquared > 0.8 ? 'highly-natural' :
 *                analysis.deviation < 35 && analysis.rSquared > 0.7 ? 'moderately-natural' :
 *                analysis.deviation > 45 || analysis.rSquared < 0.6 ? 'suspicious' : 'unclear'
 *   };
 *   return authenticity;
 * }
 *
 * @example
 * // Linguistic analysis for vocabulary patterns
 * function analyzeVocabularyStructure(text) {
 *   const analysis = analyzeZipfDeviation(text, { minWordLength: 3, maxRanks: 50 });
 *   return {
 *     power_law_compliance: analysis.rSquared,
 *     vocabulary_efficiency: analysis.uniqueWords / analysis.totalWords,
 *     frequency_distribution: analysis.zipfExponent < 1 ? 'steep' : analysis.zipfExponent > 1.5 ? 'shallow' : 'typical',
 *     ai_probability: analysis.deviation > 30 ? 'high' : analysis.deviation > 20 ? 'moderate' : 'low'
 *   };
 * }
 *
 * @example
 * // Cross-language comparison (works with any tokenized language)
 * const englishText = "The quick brown fox jumps over the lazy dog with remarkable agility.";
 * const germanText = "Der schnelle braune Fuchs springt über den faulen Hund mit bemerkenswerter Geschicklichkeit.";
 * const enAnalysis = analyzeZipfDeviation(englishText);
 * const deAnalysis = analyzeZipfDeviation(germanText);
 * console.log('English exponent:', enAnalysis.zipfExponent); // Language-specific patterns
 * console.log('German exponent:', deAnalysis.zipfExponent);
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
  const sortedFrequencies = Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]);

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
    (sumLogRankLogFreq - (sumLogRank * sumLogFreq) / n) / (sumLogRankSquared - (sumLogRank * sumLogRank) / n);

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

  const meanFrequency = analyzedFrequencies.reduce((sum, [, freq]) => sum + freq, 0) / n;

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
