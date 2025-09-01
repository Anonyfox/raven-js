/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Feature hashing for dimensionality reduction with collision mitigation.
 *
 * Implements the "hashing trick" using FNV-1a hash functions to map arbitrary
 * features to fixed-size vectors. Reuses existing n-gram extraction and text
 * processing functions for consistent feature generation.
 */

import {
	extractCharNgrams,
	extractMixedNgrams,
	extractWordNgrams,
} from "./ngrams.js";

/**
 * FNV-1a hash function implementation (32-bit variant).
 * Fast, simple hash with good distribution properties.
 *
 * @param {string} str - String to hash
 * @returns {number} 32-bit hash value
 */
function fnv1a32(str) {
	let hash = 0x811c9dc5; // FNV offset basis (32-bit)

	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		// FNV prime (32-bit): 0x01000193
		hash = Math.imul(hash, 0x01000193);
	}

	return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * FNV-1a hash function implementation (64-bit variant using BigInt).
 * More collision-resistant than 32-bit version.
 *
 * @param {string} str - String to hash
 * @returns {bigint} 64-bit hash value
 */
function fnv1a64(str) {
	let hash = 0xcbf29ce484222325n; // FNV offset basis (64-bit)
	const prime = 0x100000001b3n; // FNV prime (64-bit)

	for (let i = 0; i < str.length; i++) {
		hash ^= BigInt(str.charCodeAt(i));
		hash *= prime;
	}

	return hash;
}

/**
 * Feature hasher for converting arbitrary features to fixed-size vectors.
 * Uses the hashing trick with collision mitigation via sign hashing.
 */
export class FeatureHasher {
	/**
	 * Creates a new feature hasher.
	 *
	 * @param {Object} options - Configuration options
	 * @param {number} [options.numFeatures=1000] - Number of hash buckets (vector dimension)
	 * @param {boolean} [options.useBigInt=false] - Use 64-bit hashing with BigInt
	 * @param {boolean} [options.useSignHash=true] - Use sign hashing to reduce collisions
	 * @param {string} [options.featureType='mixed'] - Type of features to extract ('word', 'char', 'mixed')
	 * @param {Object} [options.ngramOptions] - Options passed to n-gram extraction
	 */
	constructor(options = {}) {
		const {
			numFeatures = 1000,
			useBigInt = false,
			useSignHash = true,
			featureType = "mixed",
			ngramOptions = {},
		} = options;

		this.numFeatures = numFeatures;
		this.useBigInt = useBigInt;
		this.useSignHash = useSignHash;
		this.featureType = featureType;
		this.ngramOptions = ngramOptions;

		// Choose hash function based on BigInt preference
		this.hashFunction = useBigInt ? fnv1a64 : fnv1a32;
	}

	/**
	 * Extracts features from text using configured n-gram extraction.
	 *
	 * @param {string} text - Input text
	 * @returns {string[]} Array of features
	 */
	extractFeatures(text) {
		switch (this.featureType) {
			case "word":
				return extractWordNgrams(text, 1, 1, this.ngramOptions);
			case "char":
				return extractCharNgrams(text, 3, 1, this.ngramOptions);
			case "mixed": {
				const mixed = extractMixedNgrams(text, {
					charN: 3,
					wordN: 1,
					stride: 1,
					options: this.ngramOptions,
				});
				// @ts-expect-error - mixed has char and word properties from extractMixedNgrams
				return [...mixed.char, ...mixed.word];
			}
			default:
				throw new Error(`Unknown feature type: ${this.featureType}`);
		}
	}

	/**
	 * Hashes a single feature to get bucket index and optional sign.
	 *
	 * @param {string} feature - Feature string to hash
	 * @returns {{index: number, sign: number}} Hash result with index and sign
	 */
	hashFeature(feature) {
		const hash = this.hashFunction(feature);
		const index = this.useBigInt
			? Number(/** @type {bigint} */ (hash) % BigInt(this.numFeatures))
			: Math.abs(/** @type {number} */ (hash)) % this.numFeatures;

		let sign = 1;
		if (this.useSignHash) {
			// Use a different hash for sign to reduce correlation
			const signHash = this.hashFunction(`sign_${feature}`);
			sign = this.useBigInt
				? Number(/** @type {bigint} */ (signHash) % 2n) === 0
					? 1
					: -1
				: /** @type {number} */ (signHash) % 2 === 0
					? 1
					: -1;
		}

		return { index, sign };
	}

	/**
	 * Transforms text into a sparse feature vector representation.
	 *
	 * @param {string} text - Input text
	 * @param {boolean} [normalize=false] - Normalize vector by feature count
	 * @returns {Map<number, number>} Sparse vector as Map(index -> value)
	 */
	transform(text, normalize = false) {
		const features = this.extractFeatures(text);
		const vector = new Map();

		for (const feature of features) {
			const { index, sign } = this.hashFeature(feature);
			vector.set(index, (vector.get(index) || 0) + sign);
		}

		// Optional normalization
		if (normalize && vector.size > 0) {
			const norm = Math.sqrt(
				Array.from(vector.values()).reduce((sum, val) => sum + val * val, 0),
			);
			if (norm > 0) {
				for (const [index, value] of vector) {
					vector.set(index, value / norm);
				}
			}
		}

		return vector;
	}

	/**
	 * Transforms text into a dense feature vector (array).
	 *
	 * @param {string} text - Input text
	 * @param {boolean} [normalize=false] - Normalize vector by feature count
	 * @returns {number[]} Dense vector of length numFeatures
	 */
	transformDense(text, normalize = false) {
		const sparseVector = this.transform(text, normalize);
		const denseVector = new Array(this.numFeatures).fill(0);

		for (const [index, value] of sparseVector) {
			denseVector[index] = value;
		}

		return denseVector;
	}

	/**
	 * Transforms multiple texts into sparse vectors.
	 *
	 * @param {string[]} texts - Array of input texts
	 * @param {boolean} [normalize=false] - Normalize vectors
	 * @returns {Map<number, number>[]} Array of sparse vectors
	 */
	transformBatch(texts, normalize = false) {
		return texts.map((text) => this.transform(text, normalize));
	}

	/**
	 * Transforms multiple texts into dense matrix.
	 *
	 * @param {string[]} texts - Array of input texts
	 * @param {boolean} [normalize=false] - Normalize vectors
	 * @returns {number[][]} Matrix where each row is a dense vector
	 */
	transformBatchDense(texts, normalize = false) {
		return texts.map((text) => this.transformDense(text, normalize));
	}

	/**
	 * Computes cosine similarity between two sparse vectors.
	 *
	 * @param {Map<number, number>} vector1 - First sparse vector
	 * @param {Map<number, number>} vector2 - Second sparse vector
	 * @returns {number} Cosine similarity (-1 to 1)
	 */
	cosineSimilarity(vector1, vector2) {
		let dotProduct = 0;
		let norm1 = 0;
		let norm2 = 0;

		// Calculate dot product and norms
		for (const [index, value1] of vector1) {
			norm1 += value1 * value1;
			const value2 = vector2.get(index) || 0;
			dotProduct += value1 * value2;
		}

		for (const value2 of vector2.values()) {
			norm2 += value2 * value2;
		}

		const denominator = Math.sqrt(norm1 * norm2);
		return denominator === 0 ? 0 : dotProduct / denominator;
	}

	/**
	 * Computes similarity between two texts using their hashed features.
	 *
	 * @param {string} text1 - First text
	 * @param {string} text2 - Second text
	 * @returns {number} Cosine similarity between texts
	 */
	similarity(text1, text2) {
		const vector1 = this.transform(text1);
		const vector2 = this.transform(text2);
		return this.cosineSimilarity(vector1, vector2);
	}

	/**
	 * Gets information about hash collisions for debugging.
	 *
	 * @param {string[]} features - Array of features to analyze
	 * @returns {Object} Collision statistics
	 */
	analyzeCollisions(features) {
		const hashToFeatures = new Map();
		const indexToFeatures = new Map();

		for (const feature of features) {
			const hash = this.hashFunction(feature);
			const { index } = this.hashFeature(feature);

			// Track hash collisions
			if (!hashToFeatures.has(hash)) {
				hashToFeatures.set(hash, []);
			}
			hashToFeatures.get(hash).push(feature);

			// Track index collisions
			if (!indexToFeatures.has(index)) {
				indexToFeatures.set(index, []);
			}
			indexToFeatures.get(index).push(feature);
		}

		const hashCollisions = Array.from(hashToFeatures.values()).filter(
			(group) => group.length > 1,
		).length;
		const indexCollisions = Array.from(indexToFeatures.values()).filter(
			(group) => group.length > 1,
		).length;

		return {
			totalFeatures: features.length,
			uniqueHashes: hashToFeatures.size,
			uniqueIndices: indexToFeatures.size,
			hashCollisions,
			indexCollisions,
			loadFactor: indexToFeatures.size / this.numFeatures,
		};
	}
}
