/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language-agnostic rule-of-three obsession detector.
 *
 * Provides a neutral fallback implementation that doesn't detect any specific
 * triadic organizational patterns. Returns baseline metrics assuming no AI
 * organizational patterns are present. Used when language-specific detection
 * is not available or desired.
 */

import { tokenizeWords } from "../../segmentation/index.js";

/**
 * Analyzes text for rule-of-three obsession patterns (language-agnostic fallback).
 *
 * This general implementation doesn't search for any specific triadic structures,
 * providing a neutral baseline that assumes no AI organizational patterns are present.
 * All triadic-related metrics return zero values, making it suitable as a fallback
 * or when triadic-based detection isn't needed.
 *
 * **Algorithm**: Tokenize text → return neutral baseline metrics with no pattern detection
 * performed.
 *
 * **Use cases**: Fallback for unsupported languages, baseline comparisons,
 * or when triadic-based detection is not desired.
 *
 * **Performance**: O(n) time complexity dominated by tokenization.
 * Minimal memory usage with no pattern storage.
 *
 * @param {string} text - Input text to analyze
 * @param {Object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=30] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include pattern details
 * @returns {{aiLikelihood: number, overallScore: number, triadicDensity: number, totalPatterns: number, wordCount: number, detectedPatterns: Array<object>}} Analysis results with neutral baseline metrics. aiLikelihood: Always 0.5 (neutral). overallScore: Always 0 (no patterns detected). triadicDensity: Always 0. totalPatterns: Always 0. wordCount: Actual word count. detectedPatterns: Always empty array.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Neutral baseline for unsupported languages
 * const unknownText = "Some text in an unsupported language with various organizational patterns.";
 * const analysis = detectRuleOfThreeObsession(text);
 * console.log(analysis.aiLikelihood); // 0.5 (neutral baseline)
 * console.log(analysis.totalPatterns); // 0 (no patterns detected)
 */
export function detectRuleOfThreeObsession(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Extract and validate options
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

  // Language-agnostic: no triadic patterns to search, return neutral baseline
  return {
    aiLikelihood: 0.5, // Neutral baseline
    overallScore: 0, // No patterns detected
    triadicDensity: 0, // No triadic patterns found
    totalPatterns: 0, // No patterns detected
    wordCount,
    detectedPatterns: [], // No patterns to report
  };
}
