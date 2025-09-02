/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SimHash for fast document deduplication and near-duplicate detection.
 *
 * SimHash creates compact binary fingerprints of documents that enable fast
 * similarity detection via Hamming distance. Documents with similar content
 * produce similar SimHash signatures, enabling efficient deduplication and
 * clustering of large document collections.
 */

import { fnv32 } from "../../primitives/index.js";
import {
	extractCharNgrams,
	extractWordNgrams,
} from "../featurization/ngrams.js";
import { foldCase, normalizeUnicode } from "../normalization/index.js";

// Hash function now imported from primitives module

/**
 * SimHash fingerprint generator for document deduplication.
 * Creates binary signatures that preserve document similarity through
 * Hamming distance, enabling fast near-duplicate detection.
 */
export class SimHasher {
	/**
	 * Creates a new SimHash fingerprint generator.
	 *
	 * @param {Object} options - Configuration options
	 * @param {number} [options.hashBits=64] - Number of bits in the hash signature
	 * @param {boolean} [options.useWordShingles=true] - Use word-level n-grams for features
	 * @param {number} [options.wordShingleSize=2] - Size of word n-grams
	 * @param {number} [options.charShingleSize=3] - Size of character n-grams
	 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
	 * @param {boolean} [options.lowercase=true] - Convert to lowercase
	 */
	constructor(options = {}) {
		const {
			hashBits = 64,
			useWordShingles = true,
			wordShingleSize = 2,
			charShingleSize = 3,
			normalize = true,
			lowercase = true,
		} = options;

		if (hashBits <= 0 || hashBits > 64) {
			throw new Error("Hash bits must be between 1 and 64");
		}

		this.hashBits = hashBits;
		this.useWordShingles = useWordShingles;
		this.wordShingleSize = wordShingleSize;
		this.charShingleSize = charShingleSize;
		this.normalize = normalize;
		this.lowercase = lowercase;

		// Pre-calculate bit masks for efficiency
		this.bitMask = hashBits === 64 ? -1n : (1n << BigInt(hashBits)) - 1n;
	}

	/**
	 * Extracts features from text for SimHash computation.
	 * Uses either word or character n-grams based on configuration.
	 *
	 * @param {string} text - Input text to extract features from
	 * @returns {Map<string, number>} Map of features to their frequencies
	 */
	extractFeatures(text) {
		if (typeof text !== "string") {
			throw new Error("Input must be a string");
		}

		// Normalize text if requested
		let processedText = text;
		if (this.normalize) {
			processedText = normalizeUnicode(processedText);
		}
		if (this.lowercase) {
			processedText = foldCase(processedText);
		}

		// Extract n-grams based on configuration
		let features;
		if (this.useWordShingles) {
			features = extractWordNgrams(
				processedText,
				this.wordShingleSize,
				1, // stride
				{
					normalize: false, // Already handled above
					lowercase: false, // Already handled above
				},
			);
		} else {
			features = extractCharNgrams(
				processedText,
				this.charShingleSize,
				1, // stride
				{
					normalize: false, // Already handled above
					lowercase: false, // Already handled above
				},
			);
		}

		// Count feature frequencies
		const featureMap = new Map();
		for (const feature of features) {
			featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
		}

		return featureMap;
	}

	/**
	 * Computes SimHash signature from a map of weighted features.
	 *
	 * @param {Map<string, number>} features - Map of features to their weights
	 * @returns {bigint} SimHash signature as a BigInt
	 */
	computeFromFeatures(features) {
		if (!(features instanceof Map)) {
			throw new Error("Features must be a Map");
		}

		// Initialize bit counters
		const bitCounts = new Array(this.hashBits).fill(0);

		// Process each feature
		for (const [feature, weight] of features) {
			if (typeof feature !== "string" || typeof weight !== "number") {
				continue; // Skip invalid entries
			}

			// Hash the feature using primitive FNV-1 hash
			const hash = fnv32(feature);

			// Update bit counters based on hash bits
			for (let bit = 0; bit < this.hashBits; bit++) {
				if (hash & (1 << (bit % 32))) {
					bitCounts[bit] += weight;
				} else {
					bitCounts[bit] -= weight;
				}
			}
		}

		// Generate final hash by checking bit counter signs
		let simhash = 0n;
		for (let bit = 0; bit < this.hashBits; bit++) {
			if (bitCounts[bit] >= 0) {
				simhash |= 1n << BigInt(bit);
			}
		}

		return simhash & this.bitMask;
	}

	/**
	 * Computes SimHash signature directly from text.
	 *
	 * @param {string} text - Input text to fingerprint
	 * @returns {bigint} SimHash signature as a BigInt
	 */
	computeFromText(text) {
		const features = this.extractFeatures(text);
		return this.computeFromFeatures(features);
	}

	/**
	 * Computes SimHash signatures for multiple texts in batch.
	 *
	 * @param {string[]} texts - Array of texts to fingerprint
	 * @returns {bigint[]} Array of SimHash signatures
	 */
	computeBatch(texts) {
		if (!Array.isArray(texts)) {
			throw new Error("Input must be an array of strings");
		}

		return texts.map((text) => {
			if (typeof text !== "string") {
				throw new Error("All inputs must be strings");
			}
			return this.computeFromText(text);
		});
	}

	/**
	 * Calculates Hamming distance between two SimHash signatures.
	 *
	 * @param {bigint} hash1 - First SimHash signature
	 * @param {bigint} hash2 - Second SimHash signature
	 * @returns {number} Hamming distance (number of differing bits)
	 */
	hammingDistance(hash1, hash2) {
		if (typeof hash1 !== "bigint" || typeof hash2 !== "bigint") {
			throw new Error("Hash values must be BigInt");
		}

		// XOR to find differing bits, then count them
		let xor = (hash1 ^ hash2) & this.bitMask;
		let distance = 0;

		// Count set bits using Brian Kernighan's algorithm
		while (xor > 0n) {
			distance++;
			xor &= xor - 1n; // Clear the lowest set bit
		}

		return distance;
	}

	/**
	 * Calculates similarity between two SimHash signatures.
	 * Returns a value between 0 and 1, where 1 means identical.
	 *
	 * @param {bigint} hash1 - First SimHash signature
	 * @param {bigint} hash2 - Second SimHash signature
	 * @returns {number} Similarity score between 0 and 1
	 */
	similarity(hash1, hash2) {
		const distance = this.hammingDistance(hash1, hash2);
		return 1 - distance / this.hashBits;
	}

	/**
	 * Finds similar signatures within a given Hamming distance threshold.
	 *
	 * @param {bigint} queryHash - Query SimHash signature
	 * @param {bigint[]} candidateHashes - Array of candidate signatures
	 * @param {Object} options - Search options
	 * @param {number} [options.maxDistance=3] - Maximum Hamming distance for matches
	 * @param {number} [options.maxResults=10] - Maximum number of results
	 * @returns {Array<{hash: bigint, distance: number, similarity: number, index: number}>} Similar signatures with scores
	 */
	findSimilar(queryHash, candidateHashes, options = {}) {
		const { maxDistance = 3, maxResults = 10 } = options;

		if (typeof queryHash !== "bigint") {
			throw new Error("Query hash must be BigInt");
		}
		if (!Array.isArray(candidateHashes)) {
			throw new Error("Candidate hashes must be an array");
		}

		const results = [];

		for (let i = 0; i < candidateHashes.length; i++) {
			const candidateHash = candidateHashes[i];
			if (typeof candidateHash !== "bigint") {
				continue; // Skip invalid entries
			}

			const distance = this.hammingDistance(queryHash, candidateHash);
			if (distance <= maxDistance) {
				results.push({
					hash: candidateHash,
					distance,
					similarity: this.similarity(queryHash, candidateHash),
					index: i,
				});
			}
		}

		// Sort by distance (ascending) and limit results
		results.sort((a, b) => a.distance - b.distance);
		return results.slice(0, maxResults);
	}

	/**
	 * Searches for similar documents using text comparison.
	 *
	 * @param {string} queryText - Query text
	 * @param {string[]} candidateTexts - Array of candidate texts
	 * @param {Object} options - Search options
	 * @param {number} [options.maxDistance=3] - Maximum Hamming distance for matches
	 * @param {number} [options.maxResults=10] - Maximum number of results
	 * @returns {Array<{text: string, hash: bigint, distance: number, similarity: number, index: number}>} Similar documents with scores
	 */
	findSimilarTexts(queryText, candidateTexts, options = {}) {
		if (typeof queryText !== "string") {
			throw new Error("Query text must be a string");
		}
		if (!Array.isArray(candidateTexts)) {
			throw new Error("Candidate texts must be an array");
		}

		// Compute SimHash signatures
		const queryHash = this.computeFromText(queryText);
		const candidateHashes = this.computeBatch(candidateTexts);

		// Find similar hashes
		const hashResults = this.findSimilar(queryHash, candidateHashes, options);

		// Map back to texts
		return hashResults.map((result) => ({
			text: candidateTexts[result.index],
			hash: result.hash,
			distance: result.distance,
			similarity: result.similarity,
			index: result.index,
		}));
	}

	/**
	 * Groups documents by similarity using single-linkage clustering.
	 * Documents within the specified Hamming distance are grouped together.
	 *
	 * @param {string[]} texts - Array of texts to group
	 * @param {Object} options - Clustering options
	 * @param {number} [options.maxDistance=2] - Maximum Hamming distance within groups
	 * @returns {Array<{representative: string, members: string[], hashes: bigint[]}>} Groups of similar documents
	 */
	clusterSimilar(texts, options = {}) {
		const { maxDistance = 2 } = options;

		if (!Array.isArray(texts)) {
			throw new Error("Texts must be an array");
		}

		// Compute all signatures
		const signatures = this.computeBatch(texts);
		const groups = [];
		const assigned = new Set();

		for (let i = 0; i < signatures.length; i++) {
			if (assigned.has(i)) continue;

			// Start a new group
			const group = {
				representative: texts[i],
				members: [texts[i]],
				hashes: [signatures[i]],
			};

			assigned.add(i);

			// Find all similar documents
			for (let j = i + 1; j < signatures.length; j++) {
				if (assigned.has(j)) continue;

				const distance = this.hammingDistance(signatures[i], signatures[j]);
				if (distance <= maxDistance) {
					group.members.push(texts[j]);
					group.hashes.push(signatures[j]);
					assigned.add(j);
				}
			}

			groups.push(group);
		}

		// Sort groups by size (largest first)
		groups.sort((a, b) => b.members.length - a.members.length);
		return groups;
	}

	/**
	 * Analyzes the distribution of Hamming distances in a set of signatures.
	 * Useful for understanding the diversity of a document collection.
	 *
	 * @param {bigint[]} signatures - Array of SimHash signatures
	 * @returns {Object} Analysis including distance distribution and statistics
	 */
	analyzeDistribution(signatures) {
		if (!Array.isArray(signatures)) {
			throw new Error("Signatures must be an array");
		}

		const distances = [];
		const distanceCounts = new Map();

		// Calculate pairwise distances
		for (let i = 0; i < signatures.length; i++) {
			for (let j = i + 1; j < signatures.length; j++) {
				const distance = this.hammingDistance(signatures[i], signatures[j]);
				distances.push(distance);
				distanceCounts.set(distance, (distanceCounts.get(distance) || 0) + 1);
			}
		}

		if (distances.length === 0) {
			return {
				totalPairs: 0,
				distanceDistribution: {},
				meanDistance: 0,
				medianDistance: 0,
				minDistance: 0,
				maxDistance: 0,
			};
		}

		// Calculate statistics
		distances.sort((a, b) => a - b);
		const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
		const median = distances[Math.floor(distances.length / 2)];

		// Convert Map to object for easier consumption
		/** @type {Object<number, number>} */
		const distribution = {};
		for (const [distance, count] of distanceCounts) {
			distribution[distance] = count;
		}

		return {
			totalPairs: distances.length,
			distanceDistribution: distribution,
			meanDistance: mean,
			medianDistance: median,
			minDistance: distances[0],
			maxDistance: distances[distances.length - 1],
			hashBits: this.hashBits,
		};
	}

	/**
	 * Converts SimHash signature to binary string representation.
	 * Useful for debugging and visualization.
	 *
	 * @param {bigint} hash - SimHash signature
	 * @returns {string} Binary string representation
	 */
	toBinaryString(hash) {
		if (typeof hash !== "bigint") {
			throw new Error("Hash must be BigInt");
		}

		return (hash & this.bitMask).toString(2).padStart(this.hashBits, "0");
	}

	/**
	 * Converts binary string back to SimHash signature.
	 * Inverse of toBinaryString().
	 *
	 * @param {string} binaryString - Binary string representation
	 * @returns {bigint} SimHash signature
	 */
	fromBinaryString(binaryString) {
		if (typeof binaryString !== "string") {
			throw new Error("Binary string must be a string");
		}

		if (!/^[01]+$/.test(binaryString)) {
			throw new Error("Binary string must contain only 0s and 1s");
		}

		if (binaryString.length !== this.hashBits) {
			throw new Error(
				`Binary string length ${binaryString.length} does not match hash bits ${this.hashBits}`,
			);
		}

		return BigInt(`0b${binaryString}`);
	}

	/**
	 * Converts SimHash signature to hexadecimal string representation.
	 * More compact than binary representation.
	 *
	 * @param {bigint} hash - SimHash signature
	 * @returns {string} Hexadecimal string representation
	 */
	toHexString(hash) {
		if (typeof hash !== "bigint") {
			throw new Error("Hash must be BigInt");
		}

		const hexLength = Math.ceil(this.hashBits / 4);
		return (hash & this.bitMask).toString(16).padStart(hexLength, "0");
	}

	/**
	 * Converts hexadecimal string back to SimHash signature.
	 * Inverse of toHexString().
	 *
	 * @param {string} hexString - Hexadecimal string representation
	 * @returns {bigint} SimHash signature
	 */
	fromHexString(hexString) {
		if (typeof hexString !== "string") {
			throw new Error("Hex string must be a string");
		}

		if (!/^[0-9a-fA-F]+$/.test(hexString)) {
			throw new Error("Hex string must contain only hexadecimal characters");
		}

		const hash = BigInt(`0x${hexString}`);
		if (hash >= 1n << BigInt(this.hashBits)) {
			throw new Error("Hex string represents value too large for hash bits");
		}

		return hash;
	}
}
