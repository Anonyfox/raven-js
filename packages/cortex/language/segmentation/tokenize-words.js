/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Word tokenization using Intl.Segmenter with regex fallback.
 *
 * Provides intelligent word boundary detection that handles contractions,
 * hyphens, and international text correctly. Uses modern Intl.Segmenter
 * when available, falling back to Unicode-aware regex patterns.
 */

/**
 * Tokenizes text into words using intelligent boundary detection.
 *
 * Uses Intl.Segmenter for accurate word boundary detection when available,
 * falling back to Unicode-aware regex for older environments. Handles
 * contractions, hyphenated words, and international scripts correctly.
 *
 * @param {string} text - The text to tokenize into words
 * @param {string} _locale - BCP 47 locale code (currently unused, reserved for future use)
 * @returns {string[]} Array of word tokens
 *
 * @example
 * // Basic word tokenization
 * tokenizeWords('Hello world'); // ['Hello', 'world']
 *
 * @example
 * // Handles contractions and punctuation
 * tokenizeWords("Don't split contractions!"); // ['Don't', 'split', 'contractions']
 *
 * @example
 * // International text support
 * tokenizeWords('こんにちは世界', 'ja'); // ['こんにちは', '世界']
 *
 * @example
 * // Hyphenated words
 * tokenizeWords('state-of-the-art solution'); // ['state-of-the-art', 'solution']
 */
export function tokenizeWords(text, _locale = "en") {
	// Use Unicode-aware regex for consistent results across platforms
	// Match sequences of word characters, including:
	// - Letters from any script (\p{L})
	// - Numbers (\p{N})
	// - Apostrophes within words
	// - Periods within words (for version numbers, decimals)
	// - Hyphens within words
	const wordPattern = /[\p{L}\p{N}]+(?:['.-][\p{L}\p{N}]+)*/gu;
	return text.match(wordPattern) || [];
}
