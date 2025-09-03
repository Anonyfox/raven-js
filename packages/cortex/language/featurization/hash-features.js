/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Feature hashing for fast text similarity and deduplication.
 *
 * Converts text to compact hash-based fingerprints using the "hashing trick"
 * with n-gram features and collision mitigation. Provides deterministic string
 * output suitable for similarity detection and deduplication tasks.
 */

import { fnv1a32 } from "../../primitives/index.js";
import { ngrams } from "./ngrams.js";

/**
 * Extract n-gram features from text using the specified strategy.
 *
 * @param {string} text - Input text
 * @param {string} featureType - Feature extraction strategy ('word', 'char', 'mixed')
 * @returns {string[]} Array of extracted features
 * @private
 */
function extractFeatures(text, featureType) {
	switch (featureType) {
		case "words":
			return /** @type {string[]} */ (ngrams(text, { type: "words", n: 1 }));
		case "chars":
			return /** @type {string[]} */ (ngrams(text, { type: "chars", n: 3 }));
		case "mixed": {
			const mixed = /** @type {{char: string[], word: string[]}} */ (
				ngrams(text, { type: "mixed", charN: 3, wordN: 1 })
			);
			return [...mixed.char, ...mixed.word];
		}
		default:
			throw new Error(`Unknown feature type: ${featureType}`);
	}
}

/**
 * Hash a feature string to bucket index with optional sign for collision mitigation.
 *
 * @param {string} feature - Feature string to hash
 * @param {number} numBuckets - Number of hash buckets
 * @param {boolean} useSignHash - Whether to use sign hashing
 * @returns {{index: number, sign: number}} Hash result
 * @private
 */
function hashFeature(feature, numBuckets, useSignHash) {
	const hash = fnv1a32(feature);
	const index = Math.abs(hash) % numBuckets;

	let sign = 1;
	if (useSignHash) {
		const signHash = fnv1a32(`sign_${feature}`);
		sign = signHash % 2 === 0 ? 1 : -1;
	}

	return { index, sign };
}

/**
 * Convert feature hash vector to compact hex string representation.
 *
 * @param {Map<number, number>} vector - Sparse feature vector
 * @param {number} numBuckets - Total number of buckets for padding
 * @returns {string} Hex string representation
 * @private
 */
function vectorToHex(vector, numBuckets) {
	// Create dense array from sparse vector
	const dense = new Array(numBuckets).fill(0);
	for (const [index, value] of vector) {
		dense[index] = value;
	}

	// Convert to compact binary representation, then hex
	const bytes = [];
	for (let i = 0; i < dense.length; i += 8) {
		let byte = 0;
		for (let j = 0; j < 8 && i + j < dense.length; j++) {
			if (dense[i + j] > 0) {
				byte |= 1 << j;
			}
		}
		bytes.push(byte);
	}

	return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate hash-based feature fingerprint from text.
 *
 * Converts text to a compact, deterministic hex string representation
 * using n-gram feature extraction and hash-based dimensionality reduction.
 * Perfect for text similarity detection, deduplication, and clustering.
 *
 * @param {string} text - Input text to fingerprint
 * @param {Object} [options] - Configuration options
 * @param {number} [options.numFeatures=512] - Number of hash buckets (affects precision)
 * @param {string} [options.featureType='mixed'] - Feature extraction ('word', 'char', 'mixed')
 * @param {boolean} [options.useSignHash=true] - Use sign hashing for collision mitigation
 * @returns {string} Hex string fingerprint
 *
 * @example
 * // Basic usage with sane defaults
 * const fingerprint = hashFeatures('Hello world, this is a test.');
 * console.log(fingerprint); // '4f2a1b8c...' (128 character hex string)
 *
 * @example
 * // Similar texts produce similar fingerprints
 * const text1 = 'The quick brown fox jumps over the lazy dog';
 * const text2 = 'A quick brown fox jumps over the lazy dog';
 * const hash1 = hashFeatures(text1);
 * const hash2 = hashFeatures(text2);
 * // Can compare hash1 vs hash2 for similarity
 *
 * @example
 * // Custom configuration
 * const fingerprint = hashFeatures('Technical document text', {
 *   numFeatures: 1024,    // Higher precision
 *   featureType: 'word',  // Word-only features
 *   useSignHash: false    // Disable collision mitigation
 * });
 */
export function hashFeatures(text, options = {}) {
	const {
		numFeatures = 512,
		featureType = "mixed",
		useSignHash = true,
	} = options;

	if (typeof text !== "string") {
		throw new TypeError("Input text must be a string");
	}

	// Extract features from text
	const features = extractFeatures(text, featureType);

	// Build sparse feature vector using hash trick
	const vector = new Map();
	for (const feature of features) {
		const { index, sign } = hashFeature(feature, numFeatures, useSignHash);
		vector.set(index, (vector.get(index) || 0) + sign);
	}

	// Convert to compact hex string
	return vectorToHex(vector, numFeatures);
}
