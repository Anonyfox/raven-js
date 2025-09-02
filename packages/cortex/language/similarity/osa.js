/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Optimal String Alignment (OSA) distance algorithm implementation.
 *
 * The OSA distance allows insertions, deletions, substitutions, and adjacent
 * transpositions with the restriction that no substring can be edited more than once.
 * This is distinct from the unrestricted Damerau-Levenshtein distance.
 */

/**
 * Calculate the Optimal String Alignment (OSA) distance between two strings.
 *
 * OSA distance allows four edit operations:
 * - Insertion of a character
 * - Deletion of a character
 * - Substitution of a character
 * - Transposition of two adjacent characters
 *
 * The key restriction: no substring can be edited more than once, which means
 * the triangle inequality does not hold (unlike true Damerau-Levenshtein).
 *
 * Time complexity: O(m×n) where m and n are string lengths
 * Space complexity: O(m×n)
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{maxDistance?: number, caseSensitive?: boolean}} [options={}] - Configuration options
 * @returns {number} OSA distance between the strings
 *
 * @example
 * // Basic usage
 * osaDistance("kitten", "sitting"); // 3
 *
 * // Adjacent transposition (OSA allows this in 1 operation)
 * osaDistance("ab", "ba"); // 1
 *
 * // Case insensitive comparison
 * osaDistance("Hello", "hello", { caseSensitive: false }); // 0
 *
 * // Early termination with maximum distance
 * osaDistance("very long string", "completely different", { maxDistance: 5 }); // 5
 */
export function osaDistance(source, target, options = {}) {
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

	// Fill DP matrix with OSA recurrence relation
	for (let i = 1; i <= sourceLen; i++) {
		let minRowValue = Number.POSITIVE_INFINITY;

		for (let j = 1; j <= targetLen; j++) {
			// Cost of substitution (0 if characters match, 1 if different)
			const substitutionCost = sourceStr[i - 1] === targetStr[j - 1] ? 0 : 1;

			// Standard edit operations
			let distance = Math.min(
				matrix[i - 1][j] + 1, // Deletion
				matrix[i][j - 1] + 1, // Insertion
				matrix[i - 1][j - 1] + substitutionCost, // Substitution
			);

			// Adjacent transposition (OSA-specific operation)
			if (
				i > 1 &&
				j > 1 &&
				sourceStr[i - 1] === targetStr[j - 2] &&
				sourceStr[i - 2] === targetStr[j - 1]
			) {
				distance = Math.min(distance, matrix[i - 2][j - 2] + substitutionCost);
			}

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
 * Calculate OSA similarity score (normalized to 0-1 range).
 *
 * Similarity = 1 - (distance / max_possible_distance)
 * where max_possible_distance is the length of the longer string.
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{maxDistance?: number, caseSensitive?: boolean}} [options={}] - Configuration options (same as osaDistance)
 * @returns {number} Similarity score between 0 (completely different) and 1 (identical)
 *
 * @example
 * osaSimilarity("kitten", "sitting"); // 0.571... (1 - 3/7)
 * osaSimilarity("hello", "hello"); // 1.0 (identical)
 * osaSimilarity("abc", "xyz"); // 0.0 (completely different)
 */
export function osaSimilarity(source, target, options = {}) {
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
	const distance = osaDistance(source, target, options);

	return Math.max(0, 1 - distance / maxLength);
}
