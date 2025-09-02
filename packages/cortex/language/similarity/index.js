/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file String similarity and distance algorithms.
 *
 * Comprehensive collection of similarity metrics for text comparison,
 * near-duplicate detection, and fuzzy matching. Includes edit distances,
 * probabilistic similarity estimation (MinHash), locality-sensitive hashing (LSH),
 * document fingerprinting (SimHash), and hash-based algorithms optimized for
 * different use cases from short name matching to large-scale document
 * deduplication and fast approximate search.
 */

// Export Hamming distance algorithms (equal-length substitution-only distance)
export {
	hammingDistance,
	hammingSimilarity,
} from "./hamming.js";
// Export Jaro-Winkler similarity algorithms
export {
	findBestMatch,
	groupSimilarStrings,
	jaroDistance,
	jaroSimilarity,
	jaroWinklerDistance,
	jaroWinklerSimilarity,
} from "./jaro-winkler.js";
// Export LCS algorithms (longest common subsequence)
export { lcsLength, lcsSimilarity, lcsString } from "./lcs.js";
// Export Levenshtein distance algorithms (classic 3-operation edit distance)
export {
	levenshteinDistance,
	levenshteinSimilarity,
} from "./levenshtein.js";
// Export LSH algorithms
export { LSHBuckets } from "./lsh.js";
// Export MinHash algorithms
export { MinHasher } from "./minhash.js";
// Export OSA distance algorithms (clean implementation)
export {
	osaDistance,
	osaSimilarity,
} from "./osa.js";

// Export SimHash algorithms
export { SimHasher } from "./simhash.js";
