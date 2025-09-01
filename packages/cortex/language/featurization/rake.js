/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RAKE (Rapid Automatic Keyword Extraction) implementation.
 *
 * Extracts keywords and key phrases by analyzing word co-occurrence patterns
 * and filtering out stopwords. Reuses existing text processing functions for
 * consistent normalization and tokenization.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/tokenize-words.js";
import { ENGLISH_STOPWORDS, GERMAN_STOPWORDS } from "../stopwords/index.js";

/**
 * RAKE (Rapid Automatic Keyword Extraction) implementation.
 * Extracts keywords by analyzing word co-occurrence patterns and phrase scoring.
 */
export class RakeExtractor {
	/**
	 * Creates a new RAKE extractor.
	 *
	 * @param {Object} options - Configuration options
	 * @param {Set<string>|string[]} [options.stopwords] - Custom stopwords list
	 * @param {string} [options.language='en'] - Language for default stopwords ('en', 'de')
	 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
	 * @param {boolean} [options.lowercase=true] - Convert to lowercase
	 * @param {number} [options.minWordLength=1] - Minimum word length for consideration
	 * @param {number} [options.maxPhraseLength=5] - Maximum phrase length in words
	 * @param {RegExp} [options.punctuationPattern] - Pattern for splitting phrases
	 */
	constructor(options = {}) {
		const {
			stopwords,
			language = "en",
			normalize = true,
			lowercase = true,
			minWordLength = 1,
			maxPhraseLength = 5,
			punctuationPattern = /[.!?;,:()[\]{}'"]/,
		} = options;

		// Set up stopwords
		if (stopwords) {
			this.stopwords =
				stopwords instanceof Set ? stopwords : new Set(stopwords);
		} else {
			this.stopwords = language === "de" ? GERMAN_STOPWORDS : ENGLISH_STOPWORDS;
		}

		this.options = {
			language,
			normalize,
			lowercase,
			minWordLength,
			maxPhraseLength,
			punctuationPattern,
		};
	}

	/**
	 * Preprocesses text using configured normalization options.
	 *
	 * @param {string} text - Input text
	 * @returns {string} Preprocessed text
	 */
	preprocessText(text) {
		if (typeof text !== "string") {
			throw new Error("Input must be a string");
		}

		let processed = text;

		if (this.options.normalize) {
			processed = normalizeUnicode(processed);
		}

		if (this.options.lowercase) {
			processed = foldCase(processed);
		}

		return processed;
	}

	/**
	 * Splits text into candidate phrases by removing stopwords and punctuation.
	 *
	 * @param {string} text - Input text
	 * @returns {string[]} Array of candidate phrases
	 */
	extractCandidatePhrases(text) {
		const processed = this.preprocessText(text);

		// Split by punctuation first
		const sentences = processed
			.split(this.options.punctuationPattern)
			.filter((s) => s.trim().length > 0);

		const phrases = [];

		for (const sentence of sentences) {
			// Tokenize sentence into words
			const words = tokenizeWords(sentence);

			// Split by stopwords to create candidate phrases
			let currentPhrase = [];

			for (const word of words) {
				if (
					this.stopwords.has(word) ||
					word.length < this.options.minWordLength
				) {
					// End current phrase if it exists
					if (currentPhrase.length > 0) {
						if (currentPhrase.length <= this.options.maxPhraseLength) {
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
				if (currentPhrase.length <= this.options.maxPhraseLength) {
					phrases.push(currentPhrase.join(" "));
				}
			}
		}

		return phrases.filter((phrase) => phrase.trim().length > 0);
	}

	/**
	 * Builds word co-occurrence graph from candidate phrases.
	 *
	 * @param {string[]} phrases - Array of candidate phrases
	 * @returns {{wordFrequency: Map<string, number>, wordCooccurrence: Map<string, Map<string, number>>, wordDegree: Map<string, number>}} Co-occurrence statistics
	 */
	buildCooccurrenceGraph(phrases) {
		const wordFrequency = new Map();
		const wordCooccurrence = new Map();
		const wordDegree = new Map();

		// Process each phrase
		for (const phrase of phrases) {
			const words = tokenizeWords(phrase);

			// Count word frequencies
			for (const word of words) {
				wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
			}

			// Build co-occurrence matrix
			for (let i = 0; i < words.length; i++) {
				const word1 = words[i];

				if (!wordCooccurrence.has(word1)) {
					wordCooccurrence.set(word1, new Map());
				}

				for (let j = 0; j < words.length; j++) {
					if (i !== j) {
						const word2 = words[j];
						const cooccurMap = wordCooccurrence.get(word1);
						cooccurMap.set(word2, (cooccurMap.get(word2) || 0) + 1);
					}
				}
			}
		}

		// Calculate word degrees (sum of co-occurrences)
		for (const [word, cooccurMap] of wordCooccurrence) {
			const degree = Array.from(cooccurMap.values()).reduce(
				(sum, count) => sum + count,
				0,
			);
			wordDegree.set(word, degree);
		}

		return {
			wordFrequency,
			wordCooccurrence,
			wordDegree,
		};
	}

	/**
	 * Calculates RAKE scores for words based on co-occurrence patterns.
	 *
	 * @param {{wordFrequency: Map<string, number>, wordDegree: Map<string, number>}} graph - Co-occurrence graph data
	 * @returns {Map<string, number>} Word scores
	 */
	calculateWordScores(graph) {
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
	 * Scores phrases by summing constituent word scores.
	 *
	 * @param {string[]} phrases - Candidate phrases
	 * @param {Map<string, number>} wordScores - Individual word scores
	 * @returns {Map<string, number>} Phrase scores
	 */
	scorePhrases(phrases, wordScores) {
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
	 * Extracts keywords from text using RAKE algorithm.
	 *
	 * @param {string} text - Input text
	 * @param {Object} options - Extraction options
	 * @param {number} [options.maxKeywords=10] - Maximum number of keywords to return
	 * @param {boolean} [options.includeScores=false] - Include scores in results
	 * @param {number} [options.minScore=0] - Minimum score threshold
	 * @returns {string[]|Array<{phrase: string, score: number}>} Array of keywords (strings or objects with scores)
	 */
	extract(text, options = {}) {
		const { maxKeywords = 10, includeScores = false, minScore = 0 } = options;

		// Step 1: Extract candidate phrases
		const phrases = this.extractCandidatePhrases(text);

		if (phrases.length === 0) {
			return [];
		}

		// Step 2: Build co-occurrence graph
		const graph = this.buildCooccurrenceGraph(phrases);

		// Step 3: Calculate word scores
		const wordScores = this.calculateWordScores(graph);

		// Step 4: Score phrases
		const phraseScores = this.scorePhrases(phrases, wordScores);

		// Step 5: Sort and filter results
		const sortedPhrases = Array.from(phraseScores.entries())
			.filter(([_phrase, score]) => score >= minScore)
			.sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
			.slice(0, maxKeywords);

		// Return results with or without scores
		if (includeScores) {
			return sortedPhrases.map(([phrase, score]) => ({
				phrase,
				score,
			}));
		}

		return sortedPhrases.map(([phrase]) => phrase);
	}

	/**
	 * Gets co-occurrence statistics for debugging and analysis.
	 *
	 * @param {string} text - Input text
	 * @returns {Object} Detailed statistics
	 */
	analyzeText(text) {
		const phrases = this.extractCandidatePhrases(text);
		const graph = this.buildCooccurrenceGraph(phrases);
		const wordScores = this.calculateWordScores(graph);
		const phraseScores = this.scorePhrases(phrases, wordScores);

		return {
			candidatePhrases: phrases,
			totalWords: graph.wordFrequency.size,
			totalPhrases: phrases.length,
			avgWordsPerPhrase:
				phrases.length > 0
					? phrases.reduce(
							(sum, phrase) => sum + tokenizeWords(phrase).length,
							0,
						) / phrases.length
					: 0,
			wordFrequencies: Object.fromEntries(graph.wordFrequency),
			wordScores: Object.fromEntries(wordScores),
			phraseScores: Object.fromEntries(phraseScores),
		};
	}
}
