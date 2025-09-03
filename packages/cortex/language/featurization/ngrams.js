/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unified N-gram feature extraction for character and word level analysis.
 *
 * Provides a single ngrams() function that can extract character n-grams, word n-grams,
 * or both based on configuration. Defaults to word n-grams as most commonly used.
 * Reuses battle-tested segmentation functions for consistent tokenization.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/tokenize-words.js";

/**
 * Unified n-gram extraction function with configurable algorithm selection.
 *
 * Extracts character n-grams, word n-grams, or both based on configuration.
 * Provides a clean single-function API with smart defaults for common usage.
 *
 * @param {string} text - Input text to extract n-grams from
 * @param {Object} [options] - Configuration options
 * @param {string} [options.type="words"] - Type of n-grams: "chars", "words", or "mixed"
 * @param {number} [options.n] - N-gram size (auto-detected: chars=3, words=2)
 * @param {number} [options.stride=1] - Step size between n-grams
 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @param {string} [options.separator=" "] - Separator for word n-grams (words only)
 * @param {number} [options.charN=3] - Character n-gram size (mixed only)
 * @param {number} [options.wordN=2] - Word n-gram size (mixed only)
 * @returns {string[]|Object} Array of n-grams or object with char/word arrays for mixed type
 *
 * @example
 * // Default: word n-grams (most common)
 * const wordBigrams = ngrams("machine learning algorithms");
 * console.log(wordBigrams); // ["machine learning", "learning algorithms"]
 *
 * @example
 * // Character n-grams
 * const charTrigrams = ngrams("hello", { type: "chars" });
 * console.log(charTrigrams); // ["hel", "ell", "llo"]
 *
 * @example
 * // Mixed: both character and word n-grams
 * const mixed = ngrams("hello world", { type: "mixed" });
 * console.log(mixed); // { char: ["hel", "ell", ...], word: ["hello world"] }
 *
 * @example
 * // Custom configuration
 * const trigrams = ngrams("natural language processing", {
 *   type: "words",
 *   n: 3,
 *   lowercase: false
 * });
 * console.log(trigrams); // ["natural language processing"]
 */
export function ngrams(text, options = {}) {
	const {
		type = "words",
		n = type === "chars" ? 3 : 2, // Smart default based on type
		stride = 1,
		normalize = true,
		lowercase = true,
		separator = " ",
		charN = 3,
		wordN = 2,
	} = options;

	// Delegate to appropriate internal function
	switch (type) {
		case "chars":
			return extractCharNgrams(text, n, stride, { normalize, lowercase });

		case "words":
			return extractWordNgrams(text, n, stride, {
				normalize,
				lowercase,
				separator,
			});

		case "mixed":
			return extractMixedNgrams(text, {
				charN, // Always use the provided charN parameter
				wordN, // Always use the provided wordN parameter
				stride,
				options: { normalize, lowercase, separator },
			});

		default:
			throw new Error(
				`Unknown n-gram type: "${type}". Must be "chars", "words", or "mixed"`,
			);
	}
}

// Keep internal functions for the unified API
/**
 * @param {string} text
 * @param {number} n
 * @param {number} stride
 * @param {{normalize?: boolean, lowercase?: boolean}} options
 * @returns {string[]}
 */
function extractCharNgrams(text, n = 3, stride = 1, options = {}) {
	const { normalize = true, lowercase = true } = options;

	if (typeof text !== "string" || text.length === 0) {
		return [];
	}

	if (n < 1 || stride < 1) {
		throw new Error("N-gram size and stride must be positive integers");
	}

	let processedText = text;

	// Apply normalization if requested
	if (normalize) {
		processedText = normalizeUnicode(processedText);
	}

	// Apply case folding if requested
	if (lowercase) {
		processedText = foldCase(processedText);
	}

	const ngramsList = [];

	// Extract n-grams with configurable stride
	for (let i = 0; i <= processedText.length - n; i += stride) {
		ngramsList.push(processedText.slice(i, i + n));
	}

	return ngramsList;
}

/**
 * @param {string} text
 * @param {number} n
 * @param {number} stride
 * @param {{normalize?: boolean, lowercase?: boolean, separator?: string}} options
 * @returns {string[]}
 */
function extractWordNgrams(text, n = 2, stride = 1, options = {}) {
	const { normalize = true, lowercase = true, separator = " " } = options;

	if (typeof text !== "string" || text.length === 0) {
		return [];
	}

	if (n < 1 || stride < 1) {
		throw new Error("N-gram size and stride must be positive integers");
	}

	let processedText = text;

	// Apply normalization if requested
	if (normalize) {
		processedText = normalizeUnicode(processedText);
	}

	// Apply case folding if requested
	if (lowercase) {
		processedText = foldCase(processedText);
	}

	// Use our hardened tokenizeWords function
	const words = tokenizeWords(processedText);

	if (words.length < n) {
		return [];
	}

	const ngramsList = [];

	// Extract word n-grams with configurable stride
	for (let i = 0; i <= words.length - n; i += stride) {
		const ngram = words.slice(i, i + n).join(separator);
		ngramsList.push(ngram);
	}

	return ngramsList;
}

/**
 * @param {string} text
 * @param {{charN?: number, wordN?: number, stride?: number, options?: object}} config
 * @returns {{char: string[], word: string[]}}
 */
function extractMixedNgrams(text, config = {}) {
	const { charN = 3, wordN = 2, stride = 1, options = {} } = config;

	return {
		char: extractCharNgrams(text, charN, stride, options),
		word: extractWordNgrams(text, wordN, stride, options),
	};
}
