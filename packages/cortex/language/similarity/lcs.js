/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Longest Common Subsequence (LCS) algorithm implementation.
 *
 * The LCS algorithm finds the longest subsequence common to two sequences.
 * A subsequence maintains relative order but doesn't need to be contiguous.
 * This is distinct from longest common substring (which must be contiguous).
 */

/**
 * Calculate the length of the Longest Common Subsequence (LCS) between two strings.
 *
 * LCS finds the longest subsequence (not necessarily contiguous) that appears
 * in both strings while maintaining the relative order of characters.
 *
 * This algorithm is fundamental in:
 * - Diff algorithms (version control systems)
 * - Bioinformatics (DNA sequence analysis)
 * - Text similarity measurement
 * - Edit distance calculations
 *
 * Time complexity: O(m×n) where m and n are string lengths
 * Space complexity: O(m×n) for the DP table
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{caseSensitive?: boolean}} [options={}] - Configuration options
 * @returns {number} Length of the longest common subsequence
 *
 * @example
 * // Basic usage
 * lcsLength("ABCDGH", "AEDFHR"); // 3 (subsequence: "ADH")
 * lcsLength("AGGTAB", "GXTXAYB"); // 4 (subsequence: "GTAB")
 *
 * // Case insensitive comparison
 * lcsLength("Hello", "hello", { caseSensitive: false }); // 5 (identical)
 *
 * // DNA sequences
 * lcsLength("ATCGATCG", "TCGATGAC"); // 6
 *
 * // Empty strings
 * lcsLength("abc", ""); // 0
 * lcsLength("", "def"); // 0
 */
export function lcsLength(source, target, options = {}) {
	// Input validation with consistent error patterns
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Extract options with defaults
	const { caseSensitive = true } = options;

	// Apply case folding if needed (following fold-case.js pattern)
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	const sourceLen = sourceStr.length;
	const targetLen = targetStr.length;

	// Early termination optimizations
	if (sourceLen === 0 || targetLen === 0) return 0;

	// Early termination for identical strings
	if (sourceStr === targetStr) return sourceLen;

	// Initialize DP matrix - using native Arrays for V8 optimization
	const dp = Array.from({ length: sourceLen + 1 }, () =>
		Array(targetLen + 1).fill(0),
	);

	// Fill DP matrix with LCS recurrence relation
	// dp[i][j] = length of LCS of source[0..i-1] and target[0..j-1]
	for (let i = 1; i <= sourceLen; i++) {
		for (let j = 1; j <= targetLen; j++) {
			if (sourceStr[i - 1] === targetStr[j - 1]) {
				// Characters match - extend LCS by 1
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				// Characters don't match - take maximum of excluding one character
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Return the length of LCS
	return dp[sourceLen][targetLen];
}

/**
 * Calculate the actual Longest Common Subsequence (LCS) between two strings.
 *
 * Returns the actual subsequence string, not just its length.
 * Uses backtracking through the DP table to reconstruct the LCS.
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{caseSensitive?: boolean}} [options={}] - Configuration options
 * @returns {string} The longest common subsequence
 *
 * @example
 * lcsString("ABCDGH", "AEDFHR"); // "ADH"
 * lcsString("AGGTAB", "GXTXAYB"); // "GTAB"
 * lcsString("programming", "program"); // "program"
 */
export function lcsString(source, target, options = {}) {
	// Input validation with consistent error patterns
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Extract options with defaults
	const { caseSensitive = true } = options;

	// Apply case folding if needed
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	const sourceLen = sourceStr.length;
	const targetLen = targetStr.length;

	// Early termination optimizations
	if (sourceLen === 0 || targetLen === 0) return "";

	// Early termination for identical strings
	if (sourceStr === targetStr) return sourceStr;

	// Build the DP matrix
	const dp = Array.from({ length: sourceLen + 1 }, () =>
		Array(targetLen + 1).fill(0),
	);

	// Fill DP matrix
	for (let i = 1; i <= sourceLen; i++) {
		for (let j = 1; j <= targetLen; j++) {
			if (sourceStr[i - 1] === targetStr[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Backtrack to reconstruct the LCS
	const lcs = [];
	let i = sourceLen;
	let j = targetLen;

	while (i > 0 && j > 0) {
		if (sourceStr[i - 1] === targetStr[j - 1]) {
			// Character is part of LCS
			lcs.unshift(sourceStr[i - 1]);
			i--;
			j--;
		} else if (dp[i - 1][j] > dp[i][j - 1]) {
			// Move up in the matrix
			i--;
		} else {
			// Move left in the matrix
			j--;
		}
	}

	return lcs.join("");
}

/**
 * Calculate LCS similarity score (normalized to 0-1 range).
 *
 * Similarity = (2 * LCS_length) / (source_length + target_length)
 *
 * This metric gives higher scores when strings share longer common subsequences
 * relative to their total length. A score of 1.0 means one string is entirely
 * a subsequence of the other.
 *
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @param {{caseSensitive?: boolean}} [options={}] - Configuration options
 * @returns {number} Similarity score between 0 (no common subsequence) and 1 (one is subsequence of other)
 *
 * @example
 * lcsSimilarity("ABCDGH", "AEDFHR"); // 0.5 (LCS=3, lengths=6+6, sim=2*3/12)
 * lcsSimilarity("programming", "program"); // 0.875 (LCS=7, lengths=11+7, sim=2*7/18)
 * lcsSimilarity("abc", "xyz"); // 0.0 (no common subsequence)
 * lcsSimilarity("hello", "hello"); // 1.0 (identical)
 */
export function lcsSimilarity(source, target, options = {}) {
	// Input validation
	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Handle identical strings efficiently
	const caseSensitive = options.caseSensitive !== false;
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	if (sourceStr === targetStr) return 1.0;

	// Handle empty strings
	if (sourceStr.length === 0 || targetStr.length === 0) return 0.0;

	const totalLength = sourceStr.length + targetStr.length;
	const lcsLen = lcsLength(source, target, options);

	return (2 * lcsLen) / totalLength;
}
