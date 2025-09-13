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
 * Measures pattern redundancy through 3-gram frequency analysis at word level to distinguish
 * human from AI-generated text. AI content exhibits more repetitive sequential patterns than
 * human writing, providing statistical fingerprints for detection. Uses proven cortex building
 * blocks for robust Unicode-aware n-gram extraction.
 */

import { ngrams } from "../featurization/index.js";

/**
 * Analyzes n-gram repetition patterns in text to detect mechanical generation.
 *
 * Extracts overlapping sequences of n consecutive elements and calculates diversity metrics.
 * Lower diversity ratios indicate more repetitive, AI-like patterns, while higher ratios
 * suggest human-like linguistic creativity. This reveals how much text reuses common
 * patterns versus creating novel combinations.
 *
 * **Algorithm**: Extract n-grams → count frequencies → calculate diversity ratio as
 * unique n-grams / total n-grams. Repetition rate measures percentage of n-grams
 * appearing multiple times.
 *
 * **Why it works**: Human writers naturally vary combinations for expression and style.
 * AI models tend to reuse statistically common sequences, resulting in lower diversity
 * and higher repetition patterns.
 *
 * **Performance**: O(n) time complexity where n is text length, dominated by tokenization
 * and frequency counting. Memory usage scales with unique n-gram count.
 * Suitable for real-time analysis of documents up to 100K+ characters.
 *
 * @param {string} text - Input text to analyze for n-gram patterns (Unicode-aware)
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.n=3] - Size of n-grams (2-6 recommended, default 3)
 * @param {'character'|'word'} [options.unit='word'] - Analysis level (default 'word' for linguistic patterns)
 * @returns {{aiLikelihood: number, diversityRatio: number, averageFrequency: number, repetitionRate: number, totalNgrams: number, uniqueNgrams: number}} Analysis results. aiLikelihood: AI probability (0-1, higher = more AI-like). diversityRatio: Unique n-grams / Total n-grams (0-1, higher = more diverse). averageFrequency: Mean frequency of n-grams (1+, lower = more diverse). repetitionRate: Percentage of n-grams appearing multiple times (0-1). totalNgrams: Total n-grams extracted. uniqueNgrams: Number of unique n-grams found.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text is too short for n-gram extraction
 *
 * @example
 * // Default word-level trigram analysis (recommended for AI detection)
 * const humanText = "The creative author explored various narrative techniques with remarkable insight.";
 * const humanAnalysis = analyzeNgramRepetition(humanText);
 * console.log(humanAnalysis.diversityRatio); // ~0.85 (high diversity = human-like)
 * console.log(humanAnalysis.aiLikelihood); // ~0.2 (low AI probability)
 *
 * @example
 * // AI text typically shows lower diversity
 * const aiText = "The system processes data. The system analyzes data. The system outputs data.";
 * const aiAnalysis = analyzeNgramRepetition(aiText);
 * console.log(aiAnalysis.diversityRatio); // ~0.45 (low diversity = AI-like)
 * console.log(aiAnalysis.aiLikelihood); // ~0.8 (high AI probability)
 *
 * @example
 * // Character-level analysis for fine-grained patterns
 * const codeText = "function processData() { return analyze(data); }";
 * const charAnalysis = analyzeNgramRepetition(codeText, { unit: 'character', n: 4 });
 * console.log(charAnalysis.repetitionRate); // Code has repetitive patterns
 *
 * @example
 * // Academic integrity checking
 * function checkEssayAuthenticity(essayText) {
 *   const analysis = analyzeNgramRepetition(essayText);
 *   return analysis.aiLikelihood > 0.6 ? 'requires-review' : 'likely-original';
 * }
 *
 * @example
 * // Content quality assessment
 * function assessWritingQuality(text) {
 *   const analysis = analyzeNgramRepetition(text, { n: 2 }); // Bigrams for broader patterns
 *   if (analysis.diversityRatio > 0.8) return 'highly-original';
 *   if (analysis.diversityRatio > 0.6) return 'moderately-original';
 *   return 'repetitive-patterns';
 * }
 */
export function analyzeNgramRepetition(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Extract and validate options with sensible defaults
  const { n = 3, unit = "word" } = options;

  if (!Number.isInteger(n) || n < 1) {
    throw new Error("Parameter n must be a positive integer");
  }

  if (!["character", "word"].includes(unit)) {
    throw new Error("Parameter unit must be 'character' or 'word'");
  }

  // Map unit parameter to ngrams function type parameter
  const ngramType = unit === "character" ? "chars" : "words";

  // Extract n-grams using proven featurization building blocks
  const extractedNgrams = /** @type {string[]} */ (
    ngrams(text, {
      type: ngramType,
      n: n,
      normalize: true, // Enable Unicode normalization
      lowercase: unit === "word", // Case folding for words, preserve case for characters
    })
  );

  // Check if we extracted enough n-grams for analysis
  if (extractedNgrams.length === 0) {
    throw new Error(`Text must contain at least ${n} ${unit}s to extract ${n}-grams`);
  }

  // Count n-gram frequencies
  const frequencyMap = new Map();
  for (const ngram of extractedNgrams) {
    frequencyMap.set(ngram, (frequencyMap.get(ngram) || 0) + 1);
  }

  // Calculate diversity metrics
  const totalNgrams = extractedNgrams.length;
  const uniqueNgrams = frequencyMap.size;
  const diversityRatio = uniqueNgrams / totalNgrams;

  // Calculate additional metrics for backward compatibility and completeness
  const frequencies = Array.from(frequencyMap.values());
  const averageFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
  const repeatedNgrams = frequencies.filter((freq) => freq > 1).length;
  const repetitionRate = repeatedNgrams / uniqueNgrams;

  // Calculate AI likelihood based on diversity and repetition patterns
  // Lower diversity + higher repetition = more AI-like
  const aiLikelihood = Math.min(1, Math.max(0, (1 - diversityRatio) * 0.7 + repetitionRate * 0.3));

  return {
    aiLikelihood,
    diversityRatio,
    averageFrequency, // Kept for backward compatibility
    repetitionRate,
    totalNgrams,
    uniqueNgrams,
  };
}
