/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Hamming distance algorithm implementation.
 *
 * The Hamming distance is the number of positions at which corresponding
 * characters differ between two equal-length strings. It's the simplest
 * edit distance metric, requiring only substitutions (no insertions or deletions).
 */

/**
 * Calculate the Hamming distance between two equal-length strings.
 *
 * Hamming distance counts the number of character positions where two
 * equal-length strings differ. It only allows substitution operations,
 * making it the simplest edit distance metric.
 *
 * This forms a true metric space, satisfying all metric properties including
 * the triangle inequality. It's commonly used for:
 * - Error detection and correction codes
 * - DNA sequence analysis
 * - Fixed-length string comparison
 * - Binary data comparison
 *
 * Time complexity: O(n) where n is string length
 * Space complexity: O(1)
 *
 * @param {string} source - Source string
 * @param {string} target - Target string (must be same length as source)
 * @param {{caseSensitive?: boolean}} [options={}] - Configuration options
 * @returns {number} Hamming distance between the strings
 *
 * @example
 * // Basic usage
 * hammingDistance("karolin", "kathrin"); // 3
 * hammingDistance("1011101", "1001001"); // 2
 *
 * // Case insensitive comparison
 * hammingDistance("Hello", "HELLO", { caseSensitive: false }); // 0
 *
 * // DNA sequence comparison
 * hammingDistance("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"); // 7
 *
 * // Binary strings
 * hammingDistance("101010", "010101"); // 6 (all positions differ)
 *
 * @throws {Error} If strings are not equal length or not strings
 */
export function hammingDistance(source, target, options = {}) {
	// Input validation with consistent error patterns
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Hamming distance requires equal-length strings
	if (source.length !== target.length) {
		throw new Error("Hamming distance requires equal-length strings");
	}

	// Extract options with defaults
	const { caseSensitive = true } = options;

	// Apply case folding if needed (following fold-case.js pattern)
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	// Early termination for identical strings
	if (sourceStr === targetStr) return 0;

	// Count differing positions - simple O(n) scan
	let distance = 0;
	const length = sourceStr.length;

	for (let i = 0; i < length; i++) {
		if (sourceStr[i] !== targetStr[i]) {
			distance++;
		}
	}

	return distance;
}

/**
 * Calculate Hamming similarity score (normalized to 0-1 range).
 *
 * Similarity = 1 - (distance / string_length)
 * where string_length is the length of the equal-length strings.
 *
 * @param {string} source - Source string
 * @param {string} target - Target string (must be same length as source)
 * @param {{caseSensitive?: boolean}} [options={}] - Configuration options (same as hammingDistance)
 * @returns {number} Similarity score between 0 (completely different) and 1 (identical)
 *
 * @example
 * hammingSimilarity("karolin", "kathrin"); // 0.571... (1 - 3/7)
 * hammingSimilarity("hello", "hello"); // 1.0 (identical)
 * hammingSimilarity("abc", "xyz"); // 0.0 (completely different)
 * hammingSimilarity("1010", "0101"); // 0.0 (all positions differ)
 *
 * @throws {Error} If strings are not equal length or not strings
 */
export function hammingSimilarity(source, target, options = {}) {
	// Input validation
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Hamming similarity requires equal-length strings
	if (source.length !== target.length) {
		throw new Error("Hamming similarity requires equal-length strings");
	}

	// Handle identical strings efficiently
	const caseSensitive = options.caseSensitive !== false;
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	if (sourceStr === targetStr) return 1.0;

	const stringLength = sourceStr.length;
	const distance = hammingDistance(source, target, options);

	return 1 - distance / stringLength;
}
