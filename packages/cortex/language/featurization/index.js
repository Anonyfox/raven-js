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
 * Provides n-gram extraction, feature hashing, TF-IDF computation, and keyword
 * extraction capabilities (RAKE and TextRank). All functions are designed for
 * efficiency and compatibility with existing language processing pipeline functions.
 */

export { FeatureHasher } from "./hash-features.js";
export {
	extractCharNgrams,
	extractMixedNgrams,
	extractWordNgrams,
} from "./ngrams.js";
export { RakeExtractor } from "./rake.js";
export { TextRankExtractor } from "./textrank.js";
export { TfIdfVectorizer } from "./tfidf.js";
