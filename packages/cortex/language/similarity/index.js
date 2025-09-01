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

// Export Damerau-Levenshtein distance algorithms
export {
	damerauLevenshteinDistance,
	damerauLevenshteinSimilarity,
	osaDistance,
	osaSimilarity,
} from "./damerau-levenshtein.js";

// Export Jaro-Winkler similarity algorithms
export {
	findBestMatch,
	groupSimilarStrings,
	jaroDistance,
	jaroSimilarity,
	jaroWinklerDistance,
	jaroWinklerSimilarity,
} from "./jaro-winkler.js";
// Export LSH algorithms
export { LSHBuckets } from "./lsh.js";
// Export MinHash algorithms
export { MinHasher } from "./minhash.js";

// Export SimHash algorithms
export { SimHasher } from "./simhash.js";
