/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language-agnostic perfect grammar detector.
 *
 * Provides a neutral fallback implementation that doesn't detect any specific
 * grammar errors. Returns baseline metrics assuming no AI perfection patterns
 * are present. Used when language-specific detection is not available or desired.
 */

import { tokenizeWords } from "../../segmentation/index.js";

/**
 * Analyzes text for perfect grammar patterns (language-agnostic fallback).
 *
 * This general implementation doesn't search for any specific grammar errors,
 * providing a neutral baseline that assumes no AI perfection patterns are present.
 * All error-related metrics return zero values, making it suitable as a fallback
 * or when grammar-based detection isn't needed.
 *
 * **Algorithm**: Tokenize text → return neutral baseline metrics with no error detection
 * performed.
 *
 * **Use cases**: Fallback for unsupported languages, baseline comparisons,
 * or when grammar-based detection is not desired.
 *
 * **Performance**: O(n) time complexity dominated by tokenization.
 * Minimal memory usage with no error pattern storage.
 *
 * @param {string} text - Input text to analyze
 * @param {Object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=30] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include error details
 * @returns {{aiLikelihood: number, overallScore: number, perfectionScore: number, totalErrors: number, wordCount: number, detectedErrors: Array<object>}} Analysis results with neutral baseline metrics. aiLikelihood: Always 0.5 (neutral). overallScore: Always 0.5 (neutral). perfectionScore: Always 50 (neutral). totalErrors: Always 0. wordCount: Actual word count. detectedErrors: Always empty array.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Neutral baseline for unsupported languages
 * const unknownText = "Some text in an unsupported language with various grammatical structures.";
 * const analysis = detectPerfectGrammar(text);
 * console.log(analysis.aiLikelihood); // 0.5 (neutral baseline)
 * console.log(analysis.totalErrors); // 0 (no errors detected)
 */
export function detectPerfectGrammar(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Input 'text' must be a string.");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  const { minWordCount = 30 } = options;

  if (!Number.isInteger(minWordCount) || minWordCount < 1) {
    throw new Error("Parameter minWordCount must be a positive integer");
  }

  // Count total words using robust Unicode-aware tokenization
  const words = tokenizeWords(text);
  const wordCount = words.length;

  if (wordCount < minWordCount) {
    throw new Error(`Text must contain at least ${minWordCount} words for reliable analysis`);
  }

  // Language-agnostic: no grammar error patterns to search, return neutral baseline
  return {
    aiLikelihood: 0.5, // Neutral baseline
    overallScore: 0.5, // Neutral baseline
    perfectionScore: 50, // Neutral baseline (0-100 scale)
    totalErrors: 0, // No errors detected
    wordCount,
    detectedErrors: [], // No errors to report
  };
}
