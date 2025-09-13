/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language-agnostic em-dash epidemic detector.
 *
 * Provides a neutral fallback implementation that doesn't detect any specific
 * punctuation overuse patterns. Returns baseline metrics assuming no AI
 * punctuation patterns are present. Used when language-specific detection
 * is not available or desired.
 */

import { tokenizeWords } from "../../segmentation/index.js";

/**
 * Analyzes text for punctuation overuse patterns (language-agnostic fallback).
 *
 * This general implementation doesn't search for any specific punctuation patterns,
 * providing a neutral baseline that assumes no AI punctuation overuse is present.
 * All punctuation-related metrics return neutral values, making it suitable as a
 * fallback or when punctuation-based detection isn't needed.
 *
 * **Algorithm**: Tokenize text → return neutral baseline metrics with no punctuation analysis performed
 *
 * **Use cases**: Fallback for unsupported languages, baseline comparisons,
 * or when punctuation-based detection is not desired.
 *
 * **Performance**: O(n) time complexity dominated by tokenization.
 * Minimal memory usage with no punctuation pattern storage.
 *
 * @param {string} text - Input text to analyze
 * @param {Object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=20] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include punctuation details
 * @returns {{aiLikelihood: number, overallScore: number, punctuationDensity: number, totalPunctuation: number, wordCount: number, detectedOveruse: Array<object>}} Analysis results with neutral baseline metrics. aiLikelihood: Always 0.5 (neutral). overallScore: Always 0.5 (neutral). punctuationDensity: Always 50 (neutral). totalPunctuation: Always 0. wordCount: Actual word count. detectedOveruse: Always empty array.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Neutral baseline for unsupported languages
 * const unknownText = "Some text in an unsupported language with various punctuation marks and symbols.";
 * const analysis = detectEmDashEpidemic(text);
 * console.log(analysis.aiLikelihood); // 0.5 (neutral baseline)
 * console.log(analysis.totalPunctuation); // 0 (no overuse detected)
 */
export function detectEmDashEpidemic(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  const { minWordCount = 20 } = options;

  if (!Number.isInteger(minWordCount) || minWordCount < 1) {
    throw new Error("Parameter minWordCount must be a positive integer");
  }

  // Count total words using robust Unicode-aware tokenization
  const words = tokenizeWords(text);
  const wordCount = words.length;

  if (wordCount < minWordCount) {
    throw new Error(`Text must contain at least ${minWordCount} words for reliable analysis`);
  }

  // Language-agnostic: no punctuation pattern baselines to compare against, return neutral baseline
  return {
    aiLikelihood: 0.5, // Neutral baseline
    overallScore: 0.5, // Neutral baseline
    punctuationDensity: 50, // Neutral baseline (marks per 1000 words)
    totalPunctuation: 0, // No overuse detected
    wordCount,
    detectedOveruse: [], // No overuse to report
  };
}
