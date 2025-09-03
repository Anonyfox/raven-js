/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Feature extraction algorithms for machine learning and text analysis.
 *
 * Provides n-gram extraction, feature hashing, and keyword extraction capabilities
 * (RAKE and TextRank). All functions are designed for efficiency and compatibility
 * with existing language processing pipeline functions.
 *
 * Note: TF-IDF is now a dedicated machine learning model in cortex/learning.
 */

export { hashFeatures } from "./hash-features.js";
export {
	extractCharNgrams,
	extractMixedNgrams,
	extractWordNgrams,
} from "./ngrams.js";
export { extractKeywords } from "./rake.js";
export { extractKeywords as extractKeywordsTextRank } from "./textrank.js";
