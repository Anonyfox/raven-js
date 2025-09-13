/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Word tokenization using Unicode-aware regex patterns.
 *
 * Provides intelligent word boundary detection that handles contractions,
 * hyphens, and international text correctly. Uses Unicode-aware regex
 * for consistent cross-platform results.
 */

// Pre-compiled regex for V8 optimization - avoids regex compilation on every call
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['.-][\p{L}\p{N}]+)*/gu;
// Trailing sentence-final punctuation to optionally trim when not part of token
const TRAILING_PUNCT = /[.!?]+$/u;

// Minimal abbreviation set to preserve trailing period (fallback behavior)
const ABBREVIATIONS = new Set([
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Prof.",
  "Sr.",
  "Jr.",
  "St.",
  "vs.",
  "etc.",
  "No.",
  "Fig.",
  "Eq.",
  "Dept.",
  "Inc.",
  "Ltd.",
]);

/**
 * Tokenizes text into words using Unicode-aware regex patterns.
 *
 * Provides consistent word boundary detection across platforms. Handles
 * contractions, hyphenated words, decimals, and international scripts correctly.
 * Preserves internal apostrophes, hyphens, and periods within words.
 *
 * @param {string} text - The text to tokenize into words
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
 * tokenizeWords('café naïve résumé'); // ['café', 'naïve', 'résumé']
 *
 * @example
 * // Hyphenated words and decimals
 * tokenizeWords('state-of-the-art version 2.0'); // ['state-of-the-art', 'version', '2.0']
 */
export function tokenizeWords(text) {
  // Handle edge cases - return early for invalid inputs
  if (!text) return [];

  // Use pre-compiled Unicode-aware regex for consistent results across platforms
  // Matches sequences of word characters including:
  // - Letters from any script (\p{L})
  // - Numbers (\p{N})
  // - Internal apostrophes, periods, and hyphens
  const raw = text.match(WORD_PATTERN) || [];
  // Post-process to strip trailing sentence-final punctuation when it's not part of a decimal or abbreviation
  // Preserve tokens like '2.0' and known abbreviations (best-effort minimal list)
  return raw.map((token) => {
    if (ABBREVIATIONS.has(token)) return token;
    // Preserve decimals: number.number
    if (/^\d+\.\d+$/.test(token)) return token;
    // If token ends with sentence punctuation and there are letters/numbers before it, trim the punctuation
    if (TRAILING_PUNCT.test(token)) {
      return token.replace(TRAILING_PUNCT, "");
    }
    return token;
  });
}
