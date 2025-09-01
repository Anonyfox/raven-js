/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unicode text normalization using NFKC with optional diacritic stripping.
 *
 * Provides canonical Unicode normalization to eliminate visual ambiguity
 * and enable reliable text comparison. Uses platform-native normalization
 * with optional mark/diacritic removal for search applications.
 */

/**
 * Normalizes Unicode text using NFKC normalization with optional diacritic stripping.
 *
 * NFKC (Normalization Form KC) performs canonical decomposition followed by
 * canonical composition, also applying compatibility mappings. This eliminates
 * visual ambiguity between equivalent character representations.
 *
 * @param {string} text - The text to normalize
 * @param {boolean} stripDiacritics - Whether to remove diacritical marks (combining characters)
 * @returns {string} The normalized text
 *
 * @example
 * // Basic normalization
 * normalizeUnicode('café'); // 'café' (composed form)
 *
 * @example
 * // Diacritic stripping for search
 * normalizeUnicode('café', true); // 'cafe'
 * normalizeUnicode('naïve', true); // 'naive'
 *
 * @example
 * // Compatibility mappings
 * normalizeUnicode('ﬀ'); // 'ff' (ligature to separate characters)
 */
export function normalizeUnicode(text, stripDiacritics = false) {
	const normalized = text.normalize("NFKC");
	if (stripDiacritics) {
		// First decompose to separate base characters from combining marks, then strip marks
		return normalized.normalize("NFD").replace(/\p{M}/gu, "");
	}
	return normalized;
}
