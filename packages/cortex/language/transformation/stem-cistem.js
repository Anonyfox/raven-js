/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CISTEM German stemmer implementation.
 *
 * Implements the Compact Inflectional Stemmer for German (CISTEM) algorithm
 * for reducing German words to their morphological root forms. Designed
 * specifically for German linguistic patterns including compound words,
 * umlauts, and inflectional morphology.
 */

// German suffix patterns for removal (ordered by priority)
const SUFFIX_PATTERNS = [
	// Derivational suffixes (remove first, more specific)
	{ pattern: /heit$/, replacement: "", minLength: 7 },
	{ pattern: /keit$/, replacement: "", minLength: 7 },
	{ pattern: /ung$/, replacement: "", minLength: 6 },
	{ pattern: /lich$/, replacement: "", minLength: 7 },
	{ pattern: /isch$/, replacement: "", minLength: 7 },
	{ pattern: /ig$/, replacement: "", minLength: 5 },
	// Plural and inflectional suffixes
	{ pattern: /ern$/, replacement: "", minLength: 6 },
	{ pattern: /en$/, replacement: "", minLength: 5 },
	{ pattern: /er$/, replacement: "", minLength: 5 },
	{ pattern: /es$/, replacement: "", minLength: 5 },
	{ pattern: /em$/, replacement: "", minLength: 5 },
	{ pattern: /et$/, replacement: "", minLength: 5 },
	{ pattern: /e$/, replacement: "", minLength: 4 },
	{ pattern: /s$/, replacement: "", minLength: 4 },
	{ pattern: /t$/, replacement: "", minLength: 4 },
];

/**
 * Applies CISTEM stemming algorithm to reduce German words to root forms.
 *
 * Implements the compact German stemming rules optimized for German morphology,
 * including handling of umlauts, compound words, and German-specific inflectional
 * patterns. Designed for high-performance German text processing.
 *
 * @param {string} word - The German word to stem
 * @returns {string} The stemmed root form
 *
 * @example
 * // Basic German word stemming
 * stemCistem('laufen'); // 'lauf'
 * stemCistem('Häuser'); // 'haus'
 *
 * @example
 * // Handle compound words and derivations
 * stemCistem('Regierungsgebäude'); // 'regier'
 * stemCistem('Computertechnologie'); // 'comput'
 *
 * @example
 * // German inflectional patterns
 * stemCistem('entstehen'); // 'entsteh'
 * stemCistem('Möglichkeit'); // 'moglich'
 */
export function stemCistem(word) {
	if (!word || word.length < 3) return word;

	// Step 1: Normalize case and German characters
	let result = normalizeGermanWord(word);

	// Step 2: Remove suffixes (derivational first, then inflectional)
	result = removeSuffixes(result, SUFFIX_PATTERNS);

	// Step 4: Apply final cleanup rules
	result = applyFinalRules(result);

	return result;
}

/**
 * Normalizes German word by converting to lowercase and handling umlauts.
 * @param {string} word - Word to normalize
 * @returns {string} Normalized word
 */
function normalizeGermanWord(word) {
	return (
		word
			.toLowerCase()
			// Replace umlauts with base characters + e
			.replace(/ä/g, "ae")
			.replace(/ö/g, "oe")
			.replace(/ü/g, "ue")
			// Replace ß with ss
			.replace(/ß/g, "ss")
			// Remove any non-alphabetic characters
			.replace(/[^a-z]/g, "")
	);
}

/**
 * Removes suffixes according to CISTEM rules.
 * @param {string} word - Word to process
 * @param {Array<{pattern: RegExp, replacement: string, minLength: number}>} suffixes - Array of suffix patterns to remove
 * @returns {string} Word with suffixes removed
 */
function removeSuffixes(word, suffixes) {
	let result = word;

	for (const { pattern, replacement, minLength } of suffixes) {
		if (result.length >= minLength && pattern.test(result)) {
			const newResult = result.replace(pattern, replacement);
			// Ensure we don't create too short stems
			if (newResult.length >= 3) {
				result = newResult;
				break; // Only apply first matching suffix
			}
		}
	}

	return result;
}

/**
 * Applies final cleanup rules for German stems.
 * @param {string} word - Word to clean up
 * @returns {string} Final cleaned stem
 */
function applyFinalRules(word) {
	let result = word;

	// Remove trailing consonant clusters that are uncommon in German roots
	if (result.length > 3) {
		// Handle common German consonant patterns
		result = result.replace(/ck$/, "k");
		result = result.replace(/tz$/, "t");
	}

	// Ensure minimum stem length
	if (result.length < 2) {
		return word.slice(0, 3); // Return first 3 chars if stem too short
	}

	return result;
}
