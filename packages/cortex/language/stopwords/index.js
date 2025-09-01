/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Stopwords collection for multiple languages.
 *
 * Provides standardized stopword lists for various languages, optimized for
 * text processing algorithms like RAKE, TF-IDF, and keyword extraction.
 */

import { ENGLISH_STOPWORDS } from "./english.js";
import { GERMAN_STOPWORDS } from "./german.js";

export { ENGLISH_STOPWORDS } from "./english.js";
export { GERMAN_STOPWORDS } from "./german.js";

/**
 * Gets stopwords for a specific language.
 *
 * @param {string} language - Language code ('en', 'de')
 * @returns {Set<string>} Stopwords set for the specified language
 * @throws {Error} If language is not supported
 */
export function getStopwords(language) {
	switch (language.toLowerCase()) {
		case "en":
		case "english":
			return ENGLISH_STOPWORDS;
		case "de":
		case "german":
		case "deutsch":
			return GERMAN_STOPWORDS;
		default:
			throw new Error(`Unsupported language: ${language}. Available: en, de`);
	}
}

/**
 * Gets list of supported language codes.
 *
 * @returns {string[]} Array of supported language codes
 */
export function getSupportedLanguages() {
	return ["en", "de"];
}
