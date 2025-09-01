/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Porter2 English stemmer implementation.
 *
 * Implements the Porter2 (Snowball English) stemming algorithm for reducing
 * English words to their morphological root forms. Uses the official Porter2
 * rules with optimized performance for high-throughput text processing.
 */

// Vowels pattern for R1/R2 region calculation
const VOWELS = /[aeiouy]/;
const NON_VOWELS = /[^aeiouy]/;

// Special word endings that should be preserved
const SPECIAL_WORDS = new Map([
	["skis", "ski"],
	["skies", "sky"],
	["dying", "die"],
	["lying", "lie"],
	["tying", "tie"],
	["idly", "idl"],
	["gently", "gentl"],
	["ugly", "ugli"],
	["early", "earli"],
	["only", "onli"],
	["singly", "singl"],
	["sky", "sky"],
	["news", "news"],
	["howe", "howe"],
	["atlas", "atlas"],
	["cosmos", "cosmos"],
	["bias", "bias"],
	["andes", "andes"],
]);

/**
 * Applies Porter2 stemming algorithm to reduce English words to root forms.
 *
 * Implements the complete Porter2 specification with R1/R2 region detection,
 * suffix removal rules, and special case handling. Designed for high-performance
 * text processing with minimal memory allocation.
 *
 * @param {string} word - The English word to stem
 * @returns {string} The stemmed root form
 *
 * @example
 * // Common word stemming
 * stemPorter2('running'); // 'run'
 * stemPorter2('flies'); // 'fli'
 *
 * @example
 * // Preserve root meaning
 * stemPorter2('dogs'); // 'dog'
 * stemPorter2('churches'); // 'church'
 *
 * @example
 * // Handle complex suffixes
 * stemPorter2('nationalism'); // 'nation'
 * stemPorter2('rationalization'); // 'ration'
 */

export function stemPorter2(word) {
	if (!word || word.length < 3) return word;

	// Convert to lowercase for processing
	word = word.toLowerCase();

	// Check special words first
	if (SPECIAL_WORDS.has(word)) {
		return SPECIAL_WORDS.get(word);
	}

	// Step 0: Remove possessives
	word = step0(word);

	// Calculate R1 and R2 regions
	const r1 = calculateR1(word);
	const r2 = calculateR2(word);

	// Step 1a: Remove plural suffixes
	word = step1a(word);

	// Step 1b: Remove past tense and gerund suffixes
	word = step1b(word, r1);

	// Step 1c: Replace y/Y with i
	word = step1c(word);

	// Step 2: Remove derivational suffixes
	word = step2(word, r1);

	// Step 3: Remove additional suffixes
	word = step3(word, r1, r2);

	// Step 4: Remove common word endings
	word = step4(word, r2);

	// Step 5: Remove final e and double letters
	word = step5(word, r1, r2);

	return word;
}

/**
 * Step 0: Remove possessive suffixes ('s, 's, s')
 * @param {string} word - Word to process
 * @returns {string} Word with possessive suffixes removed
 */
function step0(word) {
	if (word.endsWith("'s'")) {
		return word.slice(0, -3);
	}
	if (word.endsWith("'s")) {
		return word.slice(0, -2);
	}
	if (word.endsWith("'")) {
		return word.slice(0, -1);
	}
	return word;
}

/**
 * Step 1a: Remove plural suffixes
 * @param {string} word - Word to process
 * @returns {string} Word with plural suffixes removed
 */
function step1a(word) {
	if (word.endsWith("sses")) {
		return word.slice(0, -2); // sses -> ss
	}
	if (word.endsWith("ied") || word.endsWith("ies")) {
		// ies/ied -> i if stem has more than one letter, otherwise -> ie
		const suffix = word.endsWith("ies") ? "ies" : "ied";
		const stem = word.slice(0, -suffix.length);
		return stem.length > 1 ? `${stem}i` : `${stem}ie`;
	}
	if (word.endsWith("us") || word.endsWith("ss")) {
		return word; // unchanged
	}
	if (word.endsWith("s") && word.length > 2) {
		// Remove s if stem contains a vowel (not just immediately before)
		const beforeS = word.slice(0, -1);
		if (containsVowel(beforeS)) {
			return beforeS;
		}
	}
	return word;
}

/**
 * Step 1b: Remove past tense and gerund suffixes
 * @param {string} word - Word to process
 * @param {number} r1 - R1 region start index
 * @returns {string} Word with past tense suffixes removed
 */
function step1b(word, r1) {
	if (word.endsWith("eedly")) {
		return r1 <= word.length - 5 ? word.slice(0, -3) : word;
	}
	if (word.endsWith("eed")) {
		return r1 <= word.length - 3 ? word.slice(0, -1) : word;
	}

	// Handle ed/edly/ing/ingly if stem contains vowel
	const suffixes = ["ingly", "edly", "ing", "ed"];
	for (const suffix of suffixes) {
		if (word.endsWith(suffix)) {
			const stem = word.slice(0, -suffix.length);
			if (containsVowel(stem)) {
				// Apply post-removal rules
				if (stem.endsWith("at") || stem.endsWith("bl") || stem.endsWith("iz")) {
					return `${stem}e`;
				}
				if (isDoubleConsonant(stem) && !stem.match(/[lsz]$/)) {
					return stem.slice(0, -1);
				}
				if (isShortWord(stem)) {
					return `${stem}e`;
				}
				return stem;
			}
		}
	}
	return word;
}

/**
 * Step 1c: Replace y/Y with i if preceded by consonant
 * @param {string} word - Word to process
 * @returns {string} Word with y/Y replaced
 */
function step1c(word) {
	if ((word.endsWith("y") || word.endsWith("Y")) && word.length > 2) {
		if (NON_VOWELS.test(word[word.length - 2])) {
			return `${word.slice(0, -1)}i`;
		}
	}
	return word;
}

/**
 * Step 2: Remove derivational suffixes
 * @param {string} word - Word to process
 * @param {number} r1 - R1 region start index
 * @returns {string} Word with derivational suffixes removed
 */
function step2(word, r1) {
	const suffixMap = {
		ization: "ize",
		ational: "ate",
		fulness: "ful",
		ousness: "ous",
		iveness: "ive",
		tional: "tion",
		biliti: "ble",
		lessli: "less",
		entli: "ent",
		ation: "ate",
		alism: "al",
		aliti: "al",
		ousli: "ous",
		iviti: "ive",
		fulli: "ful",
		enci: "ence",
		anci: "ance",
		abli: "able",
		izer: "ize",
		ator: "ate",
		alli: "al",
		bli: "ble",
	};

	for (const [suffix, replacement] of Object.entries(suffixMap)) {
		if (word.endsWith(suffix) && r1 <= word.length - suffix.length) {
			return word.slice(0, -suffix.length) + replacement;
		}
	}

	// Special cases
	if (word.endsWith("li") && word.length > 2) {
		const precedingChar = word[word.length - 3];
		if ("cdeghkmnrt".includes(precedingChar) && r1 <= word.length - 2) {
			return word.slice(0, -2);
		}
	}

	return word;
}

/**
 * Step 3: Remove additional suffixes
 * @param {string} word - Word to process
 * @param {number} r1 - R1 region start index
 * @param {number} r2 - R2 region start index
 * @returns {string} Word with additional suffixes removed
 */
function step3(word, r1, r2) {
	const suffixMap = {
		ational: "ate",
		tional: "tion",
		alize: "al",
		icate: "ic",
		iciti: "ic",
		ical: "ic",
		ful: "",
		ness: "",
	};

	for (const [suffix, replacement] of Object.entries(suffixMap)) {
		if (word.endsWith(suffix)) {
			const requiredR = suffix === "ful" || suffix === "ness" ? r2 : r1;
			if (requiredR <= word.length - suffix.length) {
				return word.slice(0, -suffix.length) + replacement;
			}
		}
	}

	if (word.endsWith("ative") && r2 <= word.length - 5) {
		return word.slice(0, -5);
	}

	return word;
}

/**
 * Step 4: Remove common word endings
 * @param {string} word - Word to process
 * @param {number} r2 - R2 region start index
 * @returns {string} Word with common endings removed
 */
function step4(word, r2) {
	const suffixes = [
		"al",
		"ance",
		"ence",
		"er",
		"ic",
		"able",
		"ible",
		"ant",
		"ement",
		"ment",
		"ent",
		"ion",
		"ou",
		"ism",
		"ate",
		"iti",
		"ous",
		"ive",
		"ize",
	];

	for (const suffix of suffixes) {
		if (word.endsWith(suffix) && r2 <= word.length - suffix.length) {
			// Special handling for ion
			if (suffix === "ion" && word.length > 3) {
				const precedingChar = word[word.length - 4];
				if ("st".includes(precedingChar)) {
					return word.slice(0, -3);
				}
			} else {
				return word.slice(0, -suffix.length);
			}
		}
	}

	return word;
}

/**
 * Step 5: Remove final e and handle double letters
 * @param {string} word - Word to process
 * @param {number} r1 - R1 region start index
 * @param {number} r2 - R2 region start index
 * @returns {string} Word with final processing applied
 */
function step5(word, r1, r2) {
	// Step 5a: Remove e
	if (word.endsWith("e")) {
		if (r2 <= word.length - 1) {
			return word.slice(0, -1);
		}
		if (r1 <= word.length - 1 && !isShortSyllable(word.slice(0, -1))) {
			return word.slice(0, -1);
		}
	}

	// Step 5b: Remove double l
	if (word.endsWith("ll") && r2 <= word.length - 1) {
		return word.slice(0, -1);
	}

	return word;
}

/**
 * Calculate R1 region (first non-vowel after first vowel)
 * @param {string} word - Word to analyze
 * @returns {number} R1 region start index
 */
function calculateR1(word) {
	// Special cases
	if (
		word.startsWith("gener") ||
		word.startsWith("commun") ||
		word.startsWith("arsen")
	) {
		return 5;
	}

	for (let i = 1; i < word.length; i++) {
		if (VOWELS.test(word[i - 1]) && NON_VOWELS.test(word[i])) {
			return i + 1;
		}
	}
	return word.length;
}

/**
 * Calculate R2 region (first non-vowel after first vowel in R1)
 * @param {string} word - Word to analyze
 * @returns {number} R2 region start index
 */
function calculateR2(word) {
	const r1 = calculateR1(word);
	for (let i = r1 + 1; i < word.length; i++) {
		if (VOWELS.test(word[i - 1]) && NON_VOWELS.test(word[i])) {
			return i + 1;
		}
	}
	return word.length;
}

/**
 * Check if word contains a vowel
 * @param {string} word - Word to check
 * @returns {boolean} True if word contains vowel
 */
function containsVowel(word) {
	return VOWELS.test(word);
}

/**
 * Check if word ends with double consonant
 * @param {string} word - Word to check
 * @returns {boolean} True if word ends with double consonant
 */
function isDoubleConsonant(word) {
	if (word.length < 2) return false;
	const last = word[word.length - 1];
	const secondLast = word[word.length - 2];
	return last === secondLast && NON_VOWELS.test(last);
}

/**
 * Check if word is a short word (ends with short syllable and R1 is empty)
 * @param {string} word - Word to check
 * @returns {boolean} True if word is short
 */
function isShortWord(word) {
	return calculateR1(word) >= word.length && isShortSyllable(word);
}

/**
 * Check if word ends with short syllable
 * @param {string} word - Word to check
 * @returns {boolean} True if word ends with short syllable
 */
function isShortSyllable(word) {
	if (word.length < 2) return false;

	// Short syllable: consonant + vowel + consonant (not w, x, Y)
	if (word.length >= 3) {
		const chars = word.slice(-3);
		return (
			NON_VOWELS.test(chars[0]) &&
			VOWELS.test(chars[1]) &&
			NON_VOWELS.test(chars[2]) &&
			!"wxy".includes(chars[2])
		);
	}

	// Two-letter case: vowel + consonant
	const chars = word.slice(-2);
	return VOWELS.test(chars[0]) && NON_VOWELS.test(chars[1]);
}
