/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language-agnostic participial phrase detector.
 *
 * Provides a neutral fallback implementation that doesn't detect any specific
 * participial phrase patterns. Returns baseline metrics assuming no AI
 * syntactic patterns are present. Used when language-specific detection
 * is not available or desired.
 */

import { tokenizeWords } from "../../segmentation/index.js";

/**
 * Analyzes text for participial phrase formula patterns (language-agnostic fallback).
 *
 * This general implementation doesn't search for any specific participial constructions,
 * providing a neutral baseline that assumes no AI syntactic patterns are present.
 * All participial-related metrics return zero values, making it suitable as a fallback
 * or when participial-based detection isn't needed.
 *
 * **Algorithm**: Tokenize text → return neutral baseline metrics with no pattern detection
 * performed.
 *
 * **Use cases**: Fallback for unsupported languages, baseline comparisons,
 * or when participial-based detection is not desired.
 *
 * **Performance**: O(n) time complexity dominated by tokenization.
 * Minimal memory usage with no pattern storage.
 *
 * @param {string} text - Input text to analyze
 * @param {Object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=25] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include pattern details
 * @returns {{aiLikelihood: number, overallScore: number, participialDensity: number, totalPatterns: number, wordCount: number, detectedPatterns: Array<Object>}} Analysis results with neutral baseline metrics. aiLikelihood: Always 0.5 (neutral). overallScore: Always 0 (no patterns detected). participialDensity: Always 0. totalPatterns: Always 0. wordCount: Actual word count. detectedPatterns: Always empty array.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Neutral baseline for unsupported languages
 * const unknownText = "Some text in an unsupported language with various words.";
 * const analysis = detectParticipalPhraseFormula(text);
 * console.log(analysis.aiLikelihood); // 0.5 (neutral baseline)
 * console.log(analysis.totalPatterns); // 0 (no patterns detected)
 */
export function detectParticipalPhraseFormula(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Extract and validate options
  const { minWordCount = 25 } = options;

  if (!Number.isInteger(minWordCount) || minWordCount < 1) {
    throw new Error("Parameter minWordCount must be a positive integer");
  }

  // Count total words using robust Unicode-aware tokenization
  const words = tokenizeWords(text);
  const wordCount = words.length;

  if (wordCount < minWordCount) {
    throw new Error(`Text must contain at least ${minWordCount} words for reliable analysis`);
  }

  // Language-agnostic: no participial patterns to search, return neutral baseline
  return {
    aiLikelihood: 0.5, // Neutral baseline
    overallScore: 0, // No patterns detected
    participialDensity: 0, // No participial patterns found
    totalPatterns: 0, // No patterns detected
    wordCount,
    detectedPatterns: [], // No patterns to report
  };
}
