/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Locality-Sensitive Hashing (LSH) for fast approximate similarity search.
 *
 * LSH enables sub-linear time approximate nearest neighbor search by grouping
 * similar items into the same buckets with high probability. Works with MinHash
 * signatures to provide efficient similarity search across large document collections.
 */

/**
 * LSH bucket system for fast approximate similarity search.
 * Groups similar MinHash signatures into buckets, enabling O(1) candidate
 * retrieval for similarity queries instead of O(n) brute force comparison.
 */
export class LSHBuckets {
	/**
	 * Creates a new LSH bucket system.
	 *
	 * @param {Object} options - Configuration options
	 * @param {number} [options.numBands=16] - Number of bands to split signature into
	 * @param {number} [options.signatureLength=128] - Expected length of MinHash signatures
	 * @param {number} [options.threshold=0.5] - Approximate similarity threshold for bucketing
	 */
	constructor(options = {}) {
		const { numBands = 16, signatureLength = 128, threshold = 0.5 } = options;

		this.numBands = numBands;
		this.signatureLength = signatureLength;
		this.threshold = threshold;

		// Calculate rows per band
		this.rowsPerBand = Math.floor(signatureLength / numBands);
		this.actualSignatureLength = this.rowsPerBand * numBands;

		if (this.rowsPerBand < 1) {
			throw new Error(
				"Number of bands too large for signature length. Need at least 1 row per band.",
			);
		}

		// Storage for buckets: Map<bandIndex, Map<bucketHash, Set<itemId>>>
		this.buckets = new Map();
		for (let i = 0; i < numBands; i++) {
			this.buckets.set(i, new Map());
		}

		// Storage for signatures: Map<itemId, signature>
		this.signatures = new Map();

		// Storage for original items: Map<itemId, item>
		this.items = new Map();

		// Counter for generating item IDs
		this.nextItemId = 0;
	}

	/**
	 * Hash function for bucket assignment.
	 * Simple hash based on signature band content.
	 *
	 * @param {number[]} bandSignature - Portion of signature for this band
	 * @returns {string} Hash string for bucket assignment
	 */
	hashBand(bandSignature) {
		let hash = 0;
		for (let i = 0; i < bandSignature.length; i++) {
			hash = ((hash << 5) - hash + bandSignature[i]) | 0;
		}
		return String(Math.abs(hash));
	}

	/**
	 * Adds an item with its MinHash signature to the LSH index.
	 *
	 * @param {*} item - Item to index (can be any type)
	 * @param {number[]} signature - MinHash signature for the item
	 * @returns {number} Generated item ID
	 */
	add(item, signature) {
		if (!Array.isArray(signature)) {
			throw new Error("Signature must be an array");
		}

		if (signature.length !== this.signatureLength) {
			throw new Error(
				`Signature length ${signature.length} does not match expected length ${this.signatureLength}`,
			);
		}

		const itemId = this.nextItemId++;

		// Store the item and signature
		this.items.set(itemId, item);
		this.signatures.set(itemId, signature);

		// Add to LSH buckets
		for (let bandIdx = 0; bandIdx < this.numBands; bandIdx++) {
			const startIdx = bandIdx * this.rowsPerBand;
			const endIdx = startIdx + this.rowsPerBand;
			const bandSignature = signature.slice(startIdx, endIdx);

			const bucketHash = this.hashBand(bandSignature);
			const bandBuckets = this.buckets.get(bandIdx);

			if (!bandBuckets.has(bucketHash)) {
				bandBuckets.set(bucketHash, new Set());
			}

			bandBuckets.get(bucketHash).add(itemId);
		}

		return itemId;
	}

	/**
	 * Adds multiple items with their signatures in batch.
	 *
	 * @param {Array<{item: *, signature: number[]}>} itemsWithSignatures - Array of item-signature pairs
	 * @returns {number[]} Array of generated item IDs
	 */
	addBatch(itemsWithSignatures) {
		if (!Array.isArray(itemsWithSignatures)) {
			throw new Error("Input must be an array");
		}

		const itemIds = [];
		for (const { item, signature } of itemsWithSignatures) {
			itemIds.push(this.add(item, signature));
		}

		return itemIds;
	}

	/**
	 * Finds candidate items similar to the query signature.
	 * Returns items that share at least one bucket with the query.
	 *
	 * @param {number[]} querySignature - MinHash signature to search for
	 * @returns {Set<number>} Set of candidate item IDs
	 */
	getCandidates(querySignature) {
		if (!Array.isArray(querySignature)) {
			throw new Error("Query signature must be an array");
		}

		if (querySignature.length !== this.signatureLength) {
			throw new Error(
				`Query signature length ${querySignature.length} does not match expected length ${this.signatureLength}`,
			);
		}

		const candidates = new Set();

		// Check each band for bucket matches
		for (let bandIdx = 0; bandIdx < this.numBands; bandIdx++) {
			const startIdx = bandIdx * this.rowsPerBand;
			const endIdx = startIdx + this.rowsPerBand;
			const bandSignature = querySignature.slice(startIdx, endIdx);

			const bucketHash = this.hashBand(bandSignature);
			const bandBuckets = this.buckets.get(bandIdx);

			if (bandBuckets.has(bucketHash)) {
				for (const itemId of bandBuckets.get(bucketHash)) {
					candidates.add(itemId);
				}
			}
		}

		return candidates;
	}

	/**
	 * Estimates MinHash similarity between two signatures.
	 * Helper function for similarity computation.
	 *
	 * @param {number[]} sig1 - First signature
	 * @param {number[]} sig2 - Second signature
	 * @returns {number} Estimated Jaccard similarity
	 */
	estimateSimilarity(sig1, sig2) {
		if (sig1.length !== sig2.length) {
			return 0;
		}

		let matches = 0;
		for (let i = 0; i < sig1.length; i++) {
			if (sig1[i] === sig2[i]) {
				matches++;
			}
		}

		return matches / sig1.length;
	}

	/**
	 * Searches for similar items using LSH candidate generation + exact similarity filtering.
	 *
	 * @param {number[]} querySignature - MinHash signature to search for
	 * @param {Object} options - Search options
	 * @param {number} [options.threshold=0.5] - Minimum similarity threshold
	 * @param {number} [options.maxResults=10] - Maximum number of results
	 * @returns {Array<{item: *, similarity: number, itemId: number}>} Similar items with scores
	 */
	search(querySignature, options = {}) {
		const { threshold = this.threshold, maxResults = 10 } = options;

		// Get candidate items from LSH buckets
		const candidateIds = this.getCandidates(querySignature);

		const results = [];

		// Compute exact similarities for candidates
		for (const itemId of candidateIds) {
			const candidateSignature = this.signatures.get(itemId);
			const similarity = this.estimateSimilarity(
				querySignature,
				candidateSignature,
			);

			if (similarity >= threshold) {
				results.push({
					item: this.items.get(itemId),
					similarity,
					itemId,
				});
			}
		}

		// Sort by similarity descending and limit results
		results.sort((a, b) => b.similarity - a.similarity);
		return results.slice(0, maxResults);
	}

	/**
	 * Removes an item from the LSH index.
	 *
	 * @param {number} itemId - ID of item to remove
	 * @returns {boolean} True if item was removed, false if not found
	 */
	remove(itemId) {
		if (!this.signatures.has(itemId)) {
			return false;
		}

		const signature = this.signatures.get(itemId);

		// Remove from all buckets
		for (let bandIdx = 0; bandIdx < this.numBands; bandIdx++) {
			const startIdx = bandIdx * this.rowsPerBand;
			const endIdx = startIdx + this.rowsPerBand;
			const bandSignature = signature.slice(startIdx, endIdx);

			const bucketHash = this.hashBand(bandSignature);
			const bandBuckets = this.buckets.get(bandIdx);

			if (bandBuckets.has(bucketHash)) {
				bandBuckets.get(bucketHash).delete(itemId);

				// Clean up empty buckets
				if (bandBuckets.get(bucketHash).size === 0) {
					bandBuckets.delete(bucketHash);
				}
			}
		}

		// Remove from storage
		this.signatures.delete(itemId);
		this.items.delete(itemId);

		return true;
	}

	/**
	 * Clears all items from the LSH index.
	 */
	clear() {
		this.signatures.clear();
		this.items.clear();
		this.nextItemId = 0;

		for (let i = 0; i < this.numBands; i++) {
			this.buckets.get(i).clear();
		}
	}

	/**
	 * Gets statistics about the LSH index.
	 *
	 * @returns {Object} Statistics including item count, bucket distribution, etc.
	 */
	getStats() {
		const totalItems = this.signatures.size;
		const totalBuckets = this.numBands;
		let usedBuckets = 0;
		let totalBucketSize = 0;
		let maxBucketSize = 0;
		let minBucketSize = Number.POSITIVE_INFINITY;

		const bucketSizes = [];

		for (let bandIdx = 0; bandIdx < this.numBands; bandIdx++) {
			const bandBuckets = this.buckets.get(bandIdx);
			usedBuckets += bandBuckets.size;

			for (const [, bucket] of bandBuckets) {
				const size = bucket.size;
				bucketSizes.push(size);
				totalBucketSize += size;
				maxBucketSize = Math.max(maxBucketSize, size);
				minBucketSize = Math.min(minBucketSize, size);
			}
		}

		const avgBucketSize =
			bucketSizes.length > 0 ? totalBucketSize / bucketSizes.length : 0;

		// Calculate load factor and collision rate
		const loadFactor = totalItems > 0 ? usedBuckets / totalBuckets : 0;
		const avgItemsPerBucket =
			totalItems > 0 ? totalBucketSize / usedBuckets : 0;

		return {
			totalItems,
			totalBands: totalBuckets,
			usedBuckets,
			avgBucketSize,
			maxBucketSize: bucketSizes.length > 0 ? maxBucketSize : 0,
			minBucketSize: bucketSizes.length > 0 ? minBucketSize : 0,
			loadFactor,
			avgItemsPerBucket,
			rowsPerBand: this.rowsPerBand,
			signatureLength: this.signatureLength,
			threshold: this.threshold,
		};
	}

	/**
	 * Estimates the probability that two items with given Jaccard similarity
	 * will be placed in the same bucket (collision probability).
	 *
	 * @param {number} jaccardSimilarity - Jaccard similarity between 0 and 1
	 * @returns {number} Probability of collision
	 */
	estimateCollisionProbability(jaccardSimilarity) {
		if (jaccardSimilarity < 0 || jaccardSimilarity > 1) {
			throw new Error("Jaccard similarity must be between 0 and 1");
		}

		// Probability that a band matches: s^r where s = similarity, r = rows per band
		const bandMatchProb = jaccardSimilarity ** this.rowsPerBand;

		// Probability that at least one band matches: 1 - (1 - s^r)^b
		const collisionProb = 1 - (1 - bandMatchProb) ** this.numBands;

		return collisionProb;
	}

	/**
	 * Finds the optimal number of bands for a given similarity threshold.
	 * Uses the LSH theory to balance false positives and false negatives.
	 *
	 * @param {number} threshold - Target similarity threshold
	 * @param {number} signatureLength - Length of MinHash signatures
	 * @returns {{numBands: number, rowsPerBand: number, signatureLength: number, collisionProbability: number}} Recommended configuration
	 */
	static findOptimalBands(threshold, signatureLength = 128) {
		if (threshold <= 0 || threshold >= 1) {
			throw new Error("Threshold must be between 0 and 1");
		}

		let bestBands = 1;
		let bestScore = Number.POSITIVE_INFINITY;

		// Try different number of bands
		for (let bands = 1; bands <= signatureLength; bands++) {
			const rows = Math.floor(signatureLength / bands);
			if (rows < 1) continue;

			// Calculate collision probability at the threshold
			const bandMatchProb = threshold ** rows;
			const collisionProb = 1 - (1 - bandMatchProb) ** bands;

			// Score based on how close we are to 0.5 probability at threshold
			// (good balance between false positives and negatives)
			const score = Math.abs(collisionProb - 0.5);

			if (score < bestScore) {
				bestScore = score;
				bestBands = bands;
			}
		}

		const bestRows = Math.floor(signatureLength / bestBands);
		const actualSignatureLength = bestRows * bestBands;

		return {
			numBands: bestBands,
			rowsPerBand: bestRows,
			signatureLength: actualSignatureLength,
			collisionProbability: 1 - (1 - threshold ** bestRows) ** bestBands,
		};
	}

	/**
	 * Creates an LSH bucket system with optimal parameters for given threshold.
	 *
	 * @param {number} threshold - Target similarity threshold
	 * @param {number} signatureLength - Expected MinHash signature length
	 * @returns {LSHBuckets} Optimally configured LSH bucket system
	 */
	static createOptimal(threshold = 0.5, signatureLength = 128) {
		const optimal = LSHBuckets.findOptimalBands(threshold, signatureLength);
		return new LSHBuckets({
			numBands: optimal.numBands,
			signatureLength: optimal.signatureLength,
			threshold,
		});
	}
}
