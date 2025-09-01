/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file N-gram feature extraction for character and word level analysis.
 *
 * Provides efficient n-gram generation with configurable window size and stride.
 * Reuses battle-tested segmentation functions for consistent tokenization across
 * the language processing pipeline.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/tokenize-words.js";

/**
 * Generates character-level n-grams from text.
 *
 * @param {string} text - Input text to extract n-grams from
 * @param {number} n - Size of each n-gram (default: 3)
 * @param {number} stride - Step size between n-grams (default: 1)
 * @param {Object} options - Configuration options
 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @returns {string[]} Array of character n-grams
 */
export function extractCharNgrams(text, n = 3, stride = 1, options = {}) {
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

	const ngrams = [];

	// Extract n-grams with configurable stride
	for (let i = 0; i <= processedText.length - n; i += stride) {
		ngrams.push(processedText.slice(i, i + n));
	}

	return ngrams;
}

/**
 * Generates word-level n-grams from text.
 *
 * @param {string} text - Input text to extract n-grams from
 * @param {number} n - Size of each n-gram (default: 2)
 * @param {number} stride - Step size between n-grams (default: 1)
 * @param {Object} options - Configuration options
 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @param {string} [options.separator=' '] - Separator for joining word n-grams
 * @returns {string[]} Array of word n-grams
 */
export function extractWordNgrams(text, n = 2, stride = 1, options = {}) {
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

	const ngrams = [];

	// Extract word n-grams with configurable stride
	for (let i = 0; i <= words.length - n; i += stride) {
		const ngram = words.slice(i, i + n).join(separator);
		ngrams.push(ngram);
	}

	return ngrams;
}

/**
 * Generates both character and word n-grams in a single pass.
 *
 * @param {string} text - Input text to extract n-grams from
 * @param {Object} config - Configuration for both char and word n-grams
 * @param {number} [config.charN=3] - Character n-gram size
 * @param {number} [config.wordN=2] - Word n-gram size
 * @param {number} [config.stride=1] - Stride for both types
 * @param {Object} [config.options={}] - Options applied to both extractions
 * @returns {Object} Object with char and word n-grams
 */
export function extractMixedNgrams(text, config = {}) {
	const { charN = 3, wordN = 2, stride = 1, options = {} } = config;

	return {
		char: extractCharNgrams(text, charN, stride, options),
		word: extractWordNgrams(text, wordN, stride, options),
	};
}
