/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RAKE (Rapid Automatic Keyword Extraction) algorithm for keyword extraction.
 *
 * Extracts keywords and key phrases by analyzing word co-occurrence patterns.
 * Uses pure functional approach with no external stopword dependencies for
 * optimal tree-shaking and performance.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/tokenize-words.js";

/**
 * Preprocess text by normalizing and converting to lowercase.
 *
 * @param {string} text - Input text
 * @param {boolean} normalize - Apply Unicode normalization
 * @param {boolean} lowercase - Convert to lowercase
 * @returns {string} Processed text
 * @private
 */
function preprocessText(text, normalize, lowercase) {
	let processed = text;

	if (normalize) {
		processed = normalizeUnicode(processed);
	}
	if (lowercase) {
		processed = foldCase(processed);
	}

	return processed;
}

/**
 * Extract candidate phrases by splitting on stopwords and punctuation.
 *
 * @param {string} text - Input text
 * @param {Set<string>} stopwords - Set of stopwords to filter
 * @param {RegExp} punctuationPattern - Pattern for splitting phrases
 * @param {number} minWordLength - Minimum word length
 * @param {number} maxPhraseLength - Maximum phrase length in words
 * @returns {string[]} Array of candidate phrases
 * @private
 */
function extractCandidatePhrases(
	text,
	stopwords,
	punctuationPattern,
	minWordLength,
	maxPhraseLength,
) {
	// Split by punctuation first
	const sentences = text
		.split(punctuationPattern)
		.filter((s) => s.trim().length > 0);

	const phrases = [];

	for (const sentence of sentences) {
		const words = tokenizeWords(sentence);
		let currentPhrase = [];

		for (const word of words) {
			// Skip if stopword or too short
			if (stopwords.has(word) || word.length < minWordLength) {
				// Save current phrase if it exists
				if (currentPhrase.length > 0) {
					if (currentPhrase.length <= maxPhraseLength) {
						phrases.push(currentPhrase.join(" "));
					}
					currentPhrase = [];
				}
			} else {
				currentPhrase.push(word);
			}
		}

		// Add final phrase if it exists
		if (currentPhrase.length > 0) {
			if (currentPhrase.length <= maxPhraseLength) {
				phrases.push(currentPhrase.join(" "));
			}
		}
	}

	return phrases.filter((phrase) => phrase.trim().length > 0);
}

/**
 * Build word co-occurrence graph from candidate phrases.
 *
 * @param {string[]} phrases - Array of candidate phrases
 * @returns {{wordFrequency: Map<string, number>, wordDegree: Map<string, number>}} Co-occurrence statistics
 * @private
 */
function buildCooccurrenceGraph(phrases) {
	const wordFrequency = new Map();
	const wordDegree = new Map();

	// Process each phrase
	for (const phrase of phrases) {
		const words = tokenizeWords(phrase);

		// Count word frequencies
		for (const word of words) {
			wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
		}

		// Calculate word degrees (co-occurrence count)
		for (let i = 0; i < words.length; i++) {
			const word1 = words[i];

			for (let j = 0; j < words.length; j++) {
				if (i !== j) {
					wordDegree.set(word1, (wordDegree.get(word1) || 0) + 1);
				}
			}
		}
	}

	return { wordFrequency, wordDegree };
}

/**
 * Calculate RAKE word scores using degree/frequency ratio.
 *
 * @param {{wordFrequency: Map<string, number>, wordDegree: Map<string, number>}} graph - Co-occurrence data
 * @returns {Map<string, number>} Word scores
 * @private
 */
function calculateWordScores(graph) {
	const { wordFrequency, wordDegree } = graph;
	const wordScores = new Map();

	for (const [word, frequency] of wordFrequency) {
		const degree = wordDegree.get(word) || frequency;
		// RAKE score = degree / frequency
		const score = degree / frequency;
		wordScores.set(word, score);
	}

	return wordScores;
}

/**
 * Score phrases by summing constituent word scores.
 *
 * @param {string[]} phrases - Candidate phrases
 * @param {Map<string, number>} wordScores - Individual word scores
 * @returns {Map<string, number>} Phrase scores
 * @private
 */
function scorePhrases(phrases, wordScores) {
	const phraseScores = new Map();

	for (const phrase of phrases) {
		const words = tokenizeWords(phrase);
		let totalScore = 0;

		for (const word of words) {
			totalScore += wordScores.get(word) || 0;
		}

		phraseScores.set(phrase, totalScore);
	}

	return phraseScores;
}

/**
 * Extract keywords from text using the RAKE algorithm.
 *
 * RAKE (Rapid Automatic Keyword Extraction) analyzes word co-occurrence patterns
 * to identify important keywords and phrases. Works by splitting text into candidate
 * phrases using stopwords and punctuation, then scoring based on word frequency
 * and co-occurrence statistics.
 *
 * @param {string} text - Input text to extract keywords from
 * @param {Object} [options] - Configuration options
 * @param {Set<string>|string[]} [options.stopwords] - Stopwords to filter out (user must provide)
 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @param {number} [options.minWordLength=2] - Minimum word length for consideration
 * @param {number} [options.maxPhraseLength=3] - Maximum phrase length in words
 * @param {RegExp} [options.punctuationPattern] - Pattern for splitting phrases
 * @param {number} [options.maxKeywords=10] - Maximum number of keywords to return
 * @param {number} [options.minScore=0] - Minimum score threshold
 * @returns {string[]} Array of extracted keywords/phrases, sorted by relevance
 *
 * @example
 * // Basic usage (requires user to provide stopwords for tree-shaking)
 * import { ENGLISH_STOPWORDS } from '@raven-js/cortex/language/stopwords';
 * const keywords = extractKeywords('Natural language processing is fascinating.', {
 *   stopwords: ENGLISH_STOPWORDS
 * });
 * console.log(keywords); // ['natural language processing', 'fascinating']
 *
 * @example
 * // Custom configuration
 * const keywords = extractKeywords(text, {
 *   stopwords: new Set(['the', 'and', 'or']),
 *   maxKeywords: 5,
 *   maxPhraseLength: 2,
 *   minScore: 1.0
 * });
 *
 * @example
 * // Works without stopwords (less effective but zero dependencies)
 * const keywords = extractKeywords('Machine learning algorithms are powerful');
 * // Returns all candidate phrases since no stopwords provided
 */
export function rake(text, options = {}) {
	const {
		stopwords = new Set(), // Empty set by default - user provides stopwords
		normalize = true,
		lowercase = true,
		minWordLength = 2,
		maxPhraseLength = 3,
		punctuationPattern = /[.!?;,:()[\]{}'"]/,
		maxKeywords = 10,
		minScore = 0,
	} = options;

	if (typeof text !== "string") {
		throw new TypeError("Input text must be a string");
	}

	// Convert array to Set if needed
	const stopwordSet = stopwords instanceof Set ? stopwords : new Set(stopwords);

	// Step 1: Preprocess text
	const processedText = preprocessText(text, normalize, lowercase);

	// Step 2: Extract candidate phrases
	const phrases = extractCandidatePhrases(
		processedText,
		stopwordSet,
		punctuationPattern,
		minWordLength,
		maxPhraseLength,
	);

	if (phrases.length === 0) {
		return [];
	}

	// Step 3: Build co-occurrence graph
	const graph = buildCooccurrenceGraph(phrases);

	// Step 4: Calculate word scores
	const wordScores = calculateWordScores(graph);

	// Step 5: Score phrases
	const phraseScores = scorePhrases(phrases, wordScores);

	// Step 6: Sort and filter results
	const sortedKeywords = Array.from(phraseScores.entries())
		.filter(([_phrase, score]) => score >= minScore)
		.sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
		.slice(0, maxKeywords)
		.map(([phrase]) => phrase);

	return sortedKeywords;
}
