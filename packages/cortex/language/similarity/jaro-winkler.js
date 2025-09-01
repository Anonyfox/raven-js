/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Jaro and Jaro-Winkler distance algorithms implementation.
 *
 * Specialized for comparing short strings, particularly effective for names
 * and addresses. The Jaro-Winkler variant gives higher scores to strings
 * with common prefixes, making it ideal for record linkage and fuzzy matching.
 */

/**
 * Calculates the Jaro similarity between two strings.
 * The Jaro distance measures the similarity between two strings based on
 * the number of matching characters and transpositions.
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options
 * @param {boolean} [options.caseSensitive=true] - Whether comparison is case sensitive
 * @returns {number} Jaro similarity score between 0 and 1
 */
export function jaroSimilarity(source, target, options = {}) {
	const { caseSensitive = true } = options;

	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	const sourceLen = sourceStr.length;
	const targetLen = targetStr.length;

	// Handle edge cases
	if (sourceLen === 0 && targetLen === 0) return 1;
	if (sourceLen === 0 || targetLen === 0) return 0;
	if (sourceStr === targetStr) return 1;

	// Calculate the maximum allowed distance for matching characters
	const matchWindow = Math.max(
		0,
		Math.floor(Math.max(sourceLen, targetLen) / 2) - 1,
	);

	// Arrays to track matches
	const sourceMatches = Array(sourceLen).fill(false);
	const targetMatches = Array(targetLen).fill(false);

	let matches = 0;

	// Find matches
	for (let i = 0; i < sourceLen; i++) {
		const start = Math.max(0, i - matchWindow);
		const end = Math.min(i + matchWindow + 1, targetLen);

		for (let j = start; j < end; j++) {
			if (targetMatches[j] || sourceStr[i] !== targetStr[j]) {
				continue;
			}

			sourceMatches[i] = true;
			targetMatches[j] = true;
			matches++;
			break;
		}
	}

	// No matches found
	if (matches === 0) return 0;

	// Find transpositions
	let transpositions = 0;
	let k = 0;

	for (let i = 0; i < sourceLen; i++) {
		if (!sourceMatches[i]) continue;

		// Find the next match in target
		while (!targetMatches[k]) k++;

		if (sourceStr[i] !== targetStr[k]) {
			transpositions++;
		}
		k++;
	}

	// Calculate Jaro similarity
	const jaroSim =
		(matches / sourceLen +
			matches / targetLen +
			(matches - transpositions / 2) / matches) /
		3;

	return jaroSim;
}

/**
 * Calculates the Jaro distance (1 - Jaro similarity).
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options
 * @returns {number} Jaro distance between 0 and 1
 */
export function jaroDistance(source, target, options = {}) {
	return 1 - jaroSimilarity(source, target, options);
}

/**
 * Calculates the Jaro-Winkler similarity between two strings.
 * The Jaro-Winkler distance gives more favorable ratings to strings with
 * common prefixes up to a maximum of 4 characters.
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options
 * @param {boolean} [options.caseSensitive=true] - Whether comparison is case sensitive
 * @param {number} [options.threshold=0.7] - Minimum Jaro similarity for applying prefix bonus
 * @param {number} [options.prefixScale=0.1] - Scaling factor for common prefix bonus
 * @param {number} [options.maxPrefixLength=4] - Maximum length of common prefix to consider
 * @returns {number} Jaro-Winkler similarity score between 0 and 1
 */
export function jaroWinklerSimilarity(source, target, options = {}) {
	const {
		caseSensitive = true,
		threshold = 0.7,
		prefixScale = 0.1,
		maxPrefixLength = 4,
	} = options;

	if (typeof source !== "string" || typeof target !== "string") {
		throw new Error("Both arguments must be strings");
	}

	// Calculate base Jaro similarity
	const jaroSim = jaroSimilarity(source, target, { caseSensitive });

	// If Jaro similarity is below threshold, return it without prefix bonus
	if (jaroSim < threshold) {
		return jaroSim;
	}

	// Find common prefix length
	const sourceStr = caseSensitive ? source : source.toLowerCase();
	const targetStr = caseSensitive ? target : target.toLowerCase();

	let prefixLength = 0;
	const maxLen = Math.min(sourceStr.length, targetStr.length, maxPrefixLength);

	for (let i = 0; i < maxLen; i++) {
		if (sourceStr[i] === targetStr[i]) {
			prefixLength++;
		} else {
			break;
		}
	}

	// Apply prefix scaling
	return jaroSim + prefixLength * prefixScale * (1 - jaroSim);
}

/**
 * Calculates the Jaro-Winkler distance (1 - Jaro-Winkler similarity).
 *
 * @param {string} source - The source string
 * @param {string} target - The target string
 * @param {Object} options - Configuration options
 * @returns {number} Jaro-Winkler distance between 0 and 1
 */
export function jaroWinklerDistance(source, target, options = {}) {
	return 1 - jaroWinklerSimilarity(source, target, options);
}

/**
 * Finds the best match for a query string from a list of candidates using Jaro-Winkler.
 *
 * @param {string} query - The query string to match
 * @param {string[]} candidates - Array of candidate strings
 * @param {Object} options - Configuration options
 * @param {number} [options.minSimilarity=0.8] - Minimum similarity threshold
 * @param {boolean} [options.returnAll=false] - Return all matches above threshold
 * @param {boolean} [options.caseSensitive=true] - Whether comparison is case sensitive
 * @returns {Object|Object[]|null} Best match object or array of matches, or null if none found
 */
export function findBestMatch(query, candidates, options = {}) {
	const {
		minSimilarity = 0.8,
		returnAll = false,
		caseSensitive = true,
	} = options;

	if (typeof query !== "string") {
		throw new Error("Query must be a string");
	}

	if (!Array.isArray(candidates) || candidates.length === 0) {
		return returnAll ? [] : null;
	}

	const matches = candidates
		.map((candidate, index) => {
			if (typeof candidate !== "string") {
				return null;
			}

			const similarity = jaroWinklerSimilarity(query, candidate, {
				caseSensitive,
			});

			return {
				candidate,
				similarity,
				index,
			};
		})
		.filter((match) => match !== null && match.similarity >= minSimilarity)
		.sort((a, b) => b.similarity - a.similarity);

	if (matches.length === 0) {
		return returnAll ? [] : null;
	}

	return returnAll ? matches : matches[0];
}

/**
 * Groups similar strings using Jaro-Winkler similarity.
 *
 * @param {string[]} strings - Array of strings to group
 * @param {Object} options - Configuration options
 * @param {number} [options.threshold=0.8] - Similarity threshold for grouping
 * @param {boolean} [options.caseSensitive=true] - Whether comparison is case sensitive
 * @returns {string[][]} Array of groups, each containing similar strings
 */
export function groupSimilarStrings(strings, options = {}) {
	const { threshold = 0.8, caseSensitive = true } = options;

	if (!Array.isArray(strings)) {
		throw new Error("Input must be an array of strings");
	}

	const validStrings = strings.filter((s) => typeof s === "string");
	const groups = [];
	const used = new Set();

	for (let i = 0; i < validStrings.length; i++) {
		if (used.has(i)) continue;

		const group = [validStrings[i]];
		used.add(i);

		for (let j = i + 1; j < validStrings.length; j++) {
			if (used.has(j)) continue;

			const similarity = jaroWinklerSimilarity(
				validStrings[i],
				validStrings[j],
				{ caseSensitive },
			);

			if (similarity >= threshold) {
				group.push(validStrings[j]);
				used.add(j);
			}
		}

		groups.push(group);
	}

	return groups;
}
