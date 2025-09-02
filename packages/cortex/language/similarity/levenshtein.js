/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Levenshtein distance algorithm implementation.
 *
 * The classic Levenshtein distance allows exactly three edit operations:
 * insertions, deletions, and substitutions. Unlike OSA or Damerau-Levenshtein,
 * it does not support transpositions, making it a true metric space.
 */

/**
 * Calculate the Levenshtein distance between two strings.
 *
 * Levenshtein distance allows exactly three edit operations:
 * - Insertion of a character
 * - Deletion of a character
 * - Substitution of a character
 *
 * This is the classic edit distance algorithm that forms a true metric space,
 * satisfying all metric properties including the triangle inequality.
 * No transpositions are allowed, making it distinct from OSA and Damerau-Levenshtein.
 *
 * Time complexity: O(m×n) where m and n are string lengths
 * Space complexity: O(m×n)
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{maxDistance?: number, caseSensitive?: boolean}} [options={}] - Configuration options
 * @returns {number} Levenshtein distance between the strings
 *
 * @example
 * // Basic usage
 * levenshteinDistance("kitten", "sitting"); // 3
 *
 * // Case insensitive comparison
 * levenshteinDistance("Hello", "hello", { caseSensitive: false }); // 0
 *
 * // Early termination with maximum distance
 * levenshteinDistance("very long string", "completely different", { maxDistance: 5 }); // 5
 *
 * // Unlike OSA, transpositions require 2 operations
 * levenshteinDistance("ab", "ba"); // 2 (delete 'a', insert 'a' at end)
 */
export function levenshteinDistance(source, target, options = {}) {
	// Input validation with consistent error patterns
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Extract options with defaults
	const { maxDistance = Number.POSITIVE_INFINITY, caseSensitive = true } =
		options;

	if (
		typeof maxDistance !== "number" ||
		maxDistance < 0 ||
		Number.isNaN(maxDistance)
	) {
		throw new Error("maxDistance must be a non-negative finite number");
	}

	// Apply case folding if needed (following fold-case.js pattern)
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	const sourceLen = sourceStr.length;
	const targetLen = targetStr.length;

	// Early termination optimizations
	if (sourceLen === 0) return Math.min(targetLen, maxDistance);
	if (targetLen === 0) return Math.min(sourceLen, maxDistance);

	// If length difference exceeds maxDistance, impossible to achieve
	if (Math.abs(sourceLen - targetLen) >= maxDistance) return maxDistance;

	// Initialize DP matrix - using native Arrays for V8 optimization
	const matrix = Array.from({ length: sourceLen + 1 }, () =>
		Array(targetLen + 1).fill(0),
	);

	// Initialize first row and column (base cases)
	for (let i = 0; i <= sourceLen; i++) {
		matrix[i][0] = i;
	}
	for (let j = 0; j <= targetLen; j++) {
		matrix[0][j] = j;
	}

	// Fill DP matrix with Levenshtein recurrence relation
	for (let i = 1; i <= sourceLen; i++) {
		let minRowValue = Number.POSITIVE_INFINITY;

		for (let j = 1; j <= targetLen; j++) {
			// Cost of substitution (0 if characters match, 1 if different)
			const substitutionCost = sourceStr[i - 1] === targetStr[j - 1] ? 0 : 1;

			// Classic Levenshtein recurrence: only 3 operations
			const distance = Math.min(
				matrix[i - 1][j] + 1, // Deletion
				matrix[i][j - 1] + 1, // Insertion
				matrix[i - 1][j - 1] + substitutionCost, // Substitution
			);

			// Note: No transposition operation (unlike OSA/Damerau-Levenshtein)
			// This makes Levenshtein a true metric space

			matrix[i][j] = distance;
			minRowValue = Math.min(minRowValue, distance);
		}

		// Early termination: if entire row exceeds maxDistance, no solution within limit
		if (minRowValue >= maxDistance) {
			return maxDistance;
		}
	}

	// Return final distance, capped by maxDistance
	const finalDistance = matrix[sourceLen][targetLen];
	return Math.min(finalDistance, maxDistance);
}

/**
 * Calculate Levenshtein similarity score (normalized to 0-1 range).
 *
 * Similarity = 1 - (distance / max_possible_distance)
 * where max_possible_distance is the length of the longer string.
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{maxDistance?: number, caseSensitive?: boolean}} [options={}] - Configuration options (same as levenshteinDistance)
 * @returns {number} Similarity score between 0 (completely different) and 1 (identical)
 *
 * @example
 * levenshteinSimilarity("kitten", "sitting"); // 0.571... (1 - 3/7)
 * levenshteinSimilarity("hello", "hello"); // 1.0 (identical)
 * levenshteinSimilarity("abc", "xyz"); // 0.0 (completely different)
 */
export function levenshteinSimilarity(source, target, options = {}) {
	// Input validation
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Handle identical strings efficiently
	const caseSensitive = options.caseSensitive !== false;
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	if (sourceStr === targetStr) return 1.0;

	// Handle empty strings (one or both empty)
	if (sourceStr.length === 0 || targetStr.length === 0) return 0.0;

	const maxLength = Math.max(sourceStr.length, targetStr.length);
	const distance = levenshteinDistance(source, target, options);

	return Math.max(0, 1 - distance / maxLength);
}
