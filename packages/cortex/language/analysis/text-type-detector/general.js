/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language-agnostic text type detector.
 *
 * Provides a neutral fallback implementation that doesn't perform any specific
 * text type classification. Returns a default classification assuming no
 * specific text type patterns are present. Used when language-specific detection
 * is not available or desired.
 */

import { foldCase } from "../../normalization/index.js";

/**
 * Analyzes text for type classification (language-agnostic fallback).
 *
 * This general implementation doesn't search for any specific text type patterns,
 * providing a neutral default classification. All text is classified as "business"
 * with medium confidence, making it suitable as a fallback or when text type
 * detection isn't needed.
 *
 * **Algorithm**: Fold text case → return neutral default classification with medium confidence
 *
 * **Use cases**: Fallback for unsupported languages, baseline comparisons,
 * or when text type detection is not desired.
 *
 * **Performance**: O(n) time complexity dominated by case folding.
 * Minimal memory usage with no pattern storage.
 *
 * @param {string} text - Input text to analyze
 * @param {Object} [_options={}] - Analysis options
 * @returns {{type: string, confidence: number, scores: Record<string, number>}} Classification result with neutral default. type: Always "business". confidence: Always 0.5 (medium). scores: Empty object.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text is empty
 *
 * @example
 * // Neutral fallback classification
 * const unknownText = "Some text in an unsupported language with various content types.";
 * const analysis = detectTextType(text);
 * console.log(analysis.type); // "business"
 * console.log(analysis.confidence); // 0.5 (neutral confidence)
 */
export function detectTextType(text, _options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Input 'text' must be a string.");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Language-agnostic: no text type patterns to analyze, return neutral default
  // Fold case for consistency (even though we don't use it)
  foldCase(text);

  return {
    type: "business", // Neutral default type
    confidence: 0.5, // Neutral confidence
    scores: {}, // No category scores
  };
}
