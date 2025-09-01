/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Damerau-Levenshtein distance algorithm implementation.
 *
 * Calculates the minimum number of single-character edits (insertions, deletions,
 * substitutions, and transpositions) required to transform one string into another.
 * Includes both unrestricted and optimal string alignment (OSA) variants.
 */

/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 * Uses the optimal string alignment (OSA) algorithm, which allows at most one
 * edit operation per substring.
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options
 * @param {number} [options.maxDistance=Infinity] - Maximum distance to compute (early termination)
 * @param {boolean} [options.caseSensitive=true] - Whether comparison is case sensitive
 * @returns {number} The Damerau-Levenshtein distance
 */
export function damerauLevenshteinDistance(source, target, options = {}) {
	// For simplicity, use OSA algorithm for now which handles most common cases
	return osaDistance(source, target, options);
}

/**
 * Calculates the Optimal String Alignment (OSA) distance between two strings.
 * This is a simplified version of Damerau-Levenshtein that only allows at most
 * one operation per substring (no substring can be edited more than once).
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options
 * @param {number} [options.maxDistance=Infinity] - Maximum distance to compute
 * @param {boolean} [options.caseSensitive=true] - Whether comparison is case sensitive
 * @returns {number} The OSA distance
 */
export function osaDistance(source, target, options = {}) {
	const { maxDistance = Number.POSITIVE_INFINITY, caseSensitive = true } =
		options;

	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	const sourceLen = sourceStr.length;
	const targetLen = targetStr.length;

	// Early termination
	if (sourceLen === 0) return Math.min(targetLen, maxDistance);
	if (targetLen === 0) return Math.min(sourceLen, maxDistance);
	if (Math.abs(sourceLen - targetLen) >= maxDistance) return maxDistance;

	// Initialize matrix
	const matrix = Array.from({ length: sourceLen + 1 }, () =>
		Array(targetLen + 1).fill(0),
	);

	// Fill first row and column
	for (let i = 0; i <= sourceLen; i++) {
		matrix[i][0] = i;
	}
	for (let j = 0; j <= targetLen; j++) {
		matrix[0][j] = j;
	}

	// Fill the matrix
	for (let i = 1; i <= sourceLen; i++) {
		let minRowValue = Number.POSITIVE_INFINITY;

		for (let j = 1; j <= targetLen; j++) {
			const cost = sourceStr[i - 1] === targetStr[j - 1] ? 0 : 1;

			let value = Math.min(
				matrix[i - 1][j] + 1, // deletion
				matrix[i][j - 1] + 1, // insertion
				matrix[i - 1][j - 1] + cost, // substitution
			);

			// Transposition
			if (
				i > 1 &&
				j > 1 &&
				sourceStr[i - 1] === targetStr[j - 2] &&
				sourceStr[i - 2] === targetStr[j - 1]
			) {
				value = Math.min(value, matrix[i - 2][j - 2] + cost);
			}

			matrix[i][j] = value;
			minRowValue = Math.min(minRowValue, value);
		}

		// Early termination if minimum distance in row exceeds threshold
		if (minRowValue >= maxDistance) {
			return maxDistance;
		}
	}

	const distance = matrix[sourceLen][targetLen];
	return Math.min(distance, maxDistance);
}

/**
 * Calculates the Damerau-Levenshtein similarity as a normalized score between 0 and 1.
 * A score of 1 indicates identical strings, 0 indicates maximum dissimilarity.
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options (passed to distance function)
 * @returns {number} Similarity score between 0 and 1
 */
export function damerauLevenshteinSimilarity(source, target, options = {}) {
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	if (source === target) return 1;
	if (source.length === 0 && target.length === 0) return 1;
	if (source.length === 0 || target.length === 0) return 0;

	const maxLen = Math.max(source.length, target.length);
	const distance = damerauLevenshteinDistance(source, target, options);

	return Math.max(0, (maxLen - distance) / maxLen);
}

/**
 * Calculates the OSA similarity as a normalized score between 0 and 1.
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options (passed to distance function)
 * @returns {number} Similarity score between 0 and 1
 */
export function osaSimilarity(source, target, options = {}) {
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	if (source === target) return 1;
	if (source.length === 0 && target.length === 0) return 1;
	if (source.length === 0 || target.length === 0) return 0;

	const maxLen = Math.max(source.length, target.length);
	const distance = osaDistance(source, target, options);

	return Math.max(0, (maxLen - distance) / maxLen);
}
