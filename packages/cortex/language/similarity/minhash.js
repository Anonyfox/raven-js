/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file MinHash algorithm for fast Jaccard similarity estimation.
 *
 * MinHash provides probabilistic estimation of Jaccard similarity between sets
 * using hash signatures. Particularly effective for comparing documents represented
 * as sets of shingles (n-grams), enabling efficient similarity detection across
 * large collections with bounded memory usage.
 */

import {
	extractCharNgrams,
	extractWordNgrams,
} from "../featurization/ngrams.js";

/**
 * Simple hash function based on the classic Java String.hashCode() algorithm.
 * Provides reasonable distribution for MinHash purposes.
 *
 * @param {string} str - String to hash
 * @param {number} seed - Seed value for hash variation
 * @returns {number} Hash value
 */
function simpleHash(str, seed = 0) {
	let hash = seed;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

/**
 * Generate multiple hash functions with different seeds.
 *
 * @param {number} numHashes - Number of hash functions to generate
 * @returns {Function[]} Array of hash functions
 */
function generateHashFunctions(numHashes) {
	const hashFunctions = [];

	// Use prime numbers as seeds for better distribution
	const primes = [
		2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
		73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
		157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
		239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
	];

	for (let i = 0; i < numHashes; i++) {
		const seed =
			primes[i % primes.length] * (Math.floor(i / primes.length) + 1);
		hashFunctions.push(
			/** @param {string} str */ (str) => simpleHash(str, seed),
		);
	}

	return hashFunctions;
}

/**
 * MinHash signature generator for fast Jaccard similarity estimation.
 * Creates compact hash signatures that preserve similarity relationships
 * between sets, enabling efficient comparison without storing full sets.
 */
export class MinHasher {
	/**
	 * Creates a new MinHasher instance.
	 *
	 * @param {Object} options - Configuration options
	 * @param {number} [options.numHashes=128] - Number of hash functions (signature length)
	 * @param {number} [options.shingleSize=3] - Size of character shingles
	 * @param {boolean} [options.useWordShingles=false] - Use word n-grams instead of character n-grams
	 * @param {number} [options.wordShingleSize=2] - Size of word shingles when useWordShingles=true
	 * @param {boolean} [options.normalize=true] - Apply text normalization
	 * @param {boolean} [options.lowercase=true] - Convert to lowercase
	 */
	constructor(options = {}) {
		const {
			numHashes = 128,
			shingleSize = 3,
			useWordShingles = false,
			wordShingleSize = 2,
			normalize = true,
			lowercase = true,
		} = options;

		this.numHashes = numHashes;
		this.shingleSize = shingleSize;
		this.useWordShingles = useWordShingles;
		this.wordShingleSize = wordShingleSize;
		this.normalize = normalize;
		this.lowercase = lowercase;

		// Pre-generate hash functions for efficiency
		this.hashFunctions = generateHashFunctions(numHashes);
	}

	/**
	 * Extracts shingles from text based on configuration.
	 *
	 * @param {string} text - Input text
	 * @returns {Set<string>} Set of shingles
	 */
	extractShingles(text) {
		if (typeof text !== "string") {
			throw new Error("Input must be a string");
		}

		let processedText = text;
		if (this.lowercase) {
			processedText = processedText.toLowerCase();
		}

		if (this.useWordShingles) {
			const wordNgrams = extractWordNgrams(
				processedText,
				this.wordShingleSize,
				1, // stride
				{
					normalize: this.normalize,
					lowercase: false, // Already handled above
				},
			);
			return new Set(wordNgrams);
		}

		const charNgrams = extractCharNgrams(
			processedText,
			this.shingleSize,
			1, // stride
			{
				normalize: this.normalize,
				lowercase: false, // Already handled above
			},
		);
		return new Set(charNgrams);
	}

	/**
	 * Computes MinHash signature for a set of items.
	 *
	 * @param {Set<string>|string[]} items - Set of strings or array of strings
	 * @returns {number[]} MinHash signature array
	 */
	computeSignature(items) {
		if (!items || typeof items[Symbol.iterator] !== "function") {
			throw new Error("Items must be iterable (Set, Array, etc.)");
		}

		const signature = new Array(this.numHashes).fill(Number.POSITIVE_INFINITY);

		// Convert to Set if it's an array
		const itemSet = items instanceof Set ? items : new Set(items);

		// Compute minimum hash for each hash function
		for (const item of itemSet) {
			if (typeof item !== "string") {
				continue; // Skip non-string items
			}

			for (let i = 0; i < this.numHashes; i++) {
				const hash = this.hashFunctions[i](item);
				if (hash < signature[i]) {
					signature[i] = hash;
				}
			}
		}

		return signature;
	}

	/**
	 * Computes MinHash signature directly from text.
	 *
	 * @param {string} text - Input text
	 * @returns {number[]} MinHash signature array
	 */
	computeTextSignature(text) {
		const shingles = this.extractShingles(text);
		return this.computeSignature(shingles);
	}

	/**
	 * Estimates Jaccard similarity between two MinHash signatures.
	 *
	 * @param {number[]} signature1 - First signature
	 * @param {number[]} signature2 - Second signature
	 * @returns {number} Estimated Jaccard similarity (0-1)
	 */
	estimateSimilarity(signature1, signature2) {
		if (!Array.isArray(signature1) || !Array.isArray(signature2)) {
			throw new Error("Signatures must be arrays");
		}

		if (signature1.length !== signature2.length) {
			throw new Error("Signatures must have the same length");
		}

		if (signature1.length === 0) {
			return 0;
		}

		let matches = 0;
		for (let i = 0; i < signature1.length; i++) {
			if (signature1[i] === signature2[i]) {
				matches++;
			}
		}

		return matches / signature1.length;
	}

	/**
	 * Computes exact Jaccard similarity between two sets for comparison.
	 *
	 * @param {Set<string>|string[]} set1 - First set
	 * @param {Set<string>|string[]} set2 - Second set
	 * @returns {number} Exact Jaccard similarity (0-1)
	 */
	computeJaccardSimilarity(set1, set2) {
		const s1 = set1 instanceof Set ? set1 : new Set(set1);
		const s2 = set2 instanceof Set ? set2 : new Set(set2);

		if (s1.size === 0 && s2.size === 0) {
			return 1; // Both empty sets are identical
		}

		const intersection = new Set([...s1].filter((x) => s2.has(x)));
		const union = new Set([...s1, ...s2]);

		return intersection.size / union.size;
	}

	/**
	 * Estimates Jaccard similarity between two texts using MinHash.
	 *
	 * @param {string} text1 - First text
	 * @param {string} text2 - Second text
	 * @returns {number} Estimated Jaccard similarity (0-1)
	 */
	estimateTextSimilarity(text1, text2) {
		const signature1 = this.computeTextSignature(text1);
		const signature2 = this.computeTextSignature(text2);
		return this.estimateSimilarity(signature1, signature2);
	}

	/**
	 * Computes exact Jaccard similarity between two texts for comparison.
	 *
	 * @param {string} text1 - First text
	 * @param {string} text2 - Second text
	 * @returns {number} Exact Jaccard similarity (0-1)
	 */
	computeTextJaccardSimilarity(text1, text2) {
		const shingles1 = this.extractShingles(text1);
		const shingles2 = this.extractShingles(text2);
		return this.computeJaccardSimilarity(shingles1, shingles2);
	}

	/**
	 * Finds similar items from a collection based on MinHash signatures.
	 *
	 * @param {string} queryText - Text to find similar items for
	 * @param {string[]} documents - Collection of documents to search
	 * @param {Object} options - Search options
	 * @param {number} [options.threshold=0.5] - Minimum similarity threshold
	 * @param {number} [options.maxResults=10] - Maximum number of results
	 * @returns {Array<{document: string, similarity: number, index: number}>} Similar documents
	 */
	findSimilar(queryText, documents, options = {}) {
		const { threshold = 0.5, maxResults = 10 } = options;

		if (!Array.isArray(documents)) {
			throw new Error("Documents must be an array");
		}

		const querySignature = this.computeTextSignature(queryText);
		const results = [];

		for (let i = 0; i < documents.length; i++) {
			const doc = documents[i];
			if (typeof doc !== "string") {
				continue;
			}

			const docSignature = this.computeTextSignature(doc);
			const similarity = this.estimateSimilarity(querySignature, docSignature);

			if (similarity >= threshold) {
				results.push({
					document: doc,
					similarity,
					index: i,
				});
			}
		}

		// Sort by similarity descending and limit results
		results.sort((a, b) => b.similarity - a.similarity);
		return results.slice(0, maxResults);
	}

	/**
	 * Analyzes signature quality by comparing with exact Jaccard computation.
	 *
	 * @param {string} text1 - First text
	 * @param {string} text2 - Second text
	 * @returns {Object} Analysis including estimated vs exact similarity
	 */
	analyzeAccuracy(text1, text2) {
		const estimated = this.estimateTextSimilarity(text1, text2);
		const exact = this.computeTextJaccardSimilarity(text1, text2);
		const error = Math.abs(estimated - exact);
		const relativeError = exact > 0 ? error / exact : 0;

		return {
			estimated,
			exact,
			error,
			relativeError,
			signatureLength: this.numHashes,
			shingleSize: this.useWordShingles
				? this.wordShingleSize
				: this.shingleSize,
			shingleType: this.useWordShingles ? "word" : "character",
		};
	}
}
