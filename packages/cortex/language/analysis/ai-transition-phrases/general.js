/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language-agnostic AI transition phrase detector.
 *
 * Provides a neutral fallback implementation that doesn't detect any AI-specific
 * transition phrases. Returns baseline metrics assuming no AI patterns are present.
 * Used when language-specific phrase detection is not available or desired.
 */

import { foldCase } from "../../normalization/index.js";
import { tokenizeWords } from "../../segmentation/index.js";

/**
 * Analyzes text for AI-characteristic transition phrases (language-agnostic fallback).
 *
 * This general implementation doesn't search for any specific phrases, providing
 * a neutral baseline that assumes no AI transition patterns are present. All
 * phrase-related metrics return zero values, making it suitable as a fallback
 * or when language-specific detection isn't needed.
 *
 * **Algorithm**: Tokenize and normalize text → return neutral baseline metrics
 * with no phrase detection performed.
 *
 * **Use cases**: Fallback for unsupported languages, baseline comparisons,
 * or when phrase-based detection is not desired.
 *
 * **Performance**: O(n) time complexity dominated by tokenization.
 * Minimal memory usage with no phrase storage.
 *
 * @param {string} text - Input text to analyze
 * @param {Object} [options={}] - Analysis options
 * @param {boolean} [options.caseSensitive=false] - Whether to preserve case
 * @param {number} [options.minWordCount=20] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include phrase details
 * @returns {{aiLikelihood: number, overallScore: number, phrasesPerThousand: number, totalPhrases: number, wordCount: number, detectedPhrases: Array<Object>}} Analysis results with neutral baseline metrics. aiLikelihood: Always 0.5 (neutral). overallScore: Always 0 (no phrases detected). phrasesPerThousand: Always 0. totalPhrases: Always 0. wordCount: Actual word count. detectedPhrases: Always empty array.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Neutral baseline for unsupported languages
 * const unknownText = "Some text in an unsupported language.";
 * const analysis = analyzeAITransitionPhrases(text);
 * console.log(analysis.aiLikelihood); // 0.5 (neutral baseline)
 * console.log(analysis.totalPhrases); // 0 (no phrases detected)
 */
export function analyzeAITransitionPhrases(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Extract and validate options
  const { caseSensitive = false, minWordCount = 20 } = options;

  if (!Number.isInteger(minWordCount) || minWordCount < 1) {
    throw new Error("Parameter minWordCount must be a positive integer");
  }

  // Normalize text case using international-aware folding
  const normalizedText = caseSensitive ? text : foldCase(text);

  // Count total words using robust Unicode-aware tokenization
  const words = tokenizeWords(normalizedText);
  const wordCount = words.length;

  if (wordCount < minWordCount) {
    throw new Error(`Text must contain at least ${minWordCount} words for reliable analysis`);
  }

  // Language-agnostic: no phrases to search, return neutral baseline
  return {
    aiLikelihood: 0.5, // Neutral baseline
    overallScore: 0, // No phrases detected
    phrasesPerThousand: 0, // No phrases found
    totalPhrases: 0, // No phrases detected
    wordCount,
    detectedPhrases: [], // No phrases to report
  };
}
