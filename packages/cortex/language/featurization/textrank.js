/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file TextRank implementation for keyword and key phrase extraction.
 *
 * Graph-based ranking algorithm that builds co-occurrence networks and applies
 * iterative ranking (similar to PageRank) to identify important words and phrases.
 * Reuses existing text processing functions for consistent normalization and tokenization.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/tokenize-words.js";
import { getStopwords } from "../stopwords/index.js";

/**
 * TextRank implementation for extracting keywords and key phrases.
 * Uses graph-based ranking with iterative power iteration algorithm.
 */
export class TextRankExtractor {
	/**
	 * Creates a new TextRank extractor.
	 *
	 * @param {Object} options - Configuration options
	 * @param {Set<string>|string[]} [options.stopwords] - Custom stopwords list
	 * @param {string} [options.language='en'] - Language for default stopwords ('en', 'de')
	 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
	 * @param {boolean} [options.lowercase=true] - Convert to lowercase
	 * @param {number} [options.windowSize=4] - Co-occurrence window size
	 * @param {number} [options.minWordLength=2] - Minimum word length for consideration
	 * @param {number} [options.maxIterations=50] - Maximum iterations for convergence
	 * @param {number} [options.dampingFactor=0.85] - Damping factor for PageRank algorithm
	 * @param {number} [options.tolerance=1e-6] - Convergence tolerance
	 */
	constructor(options = {}) {
		const {
			stopwords,
			language = "en",
			normalize = true,
			lowercase = true,
			windowSize = 4,
			minWordLength = 2,
			maxIterations = 50,
			dampingFactor = 0.85,
			tolerance = 1e-6,
		} = options;

		// Set up stopwords
		if (stopwords) {
			this.stopwords =
				stopwords instanceof Set ? stopwords : new Set(stopwords);
		} else {
			try {
				this.stopwords = getStopwords(language);
			} catch {
				// Fallback to English if language not supported
				this.stopwords = getStopwords("en");
			}
		}

		this.options = {
			language,
			normalize,
			lowercase,
			windowSize,
			minWordLength,
			maxIterations,
			dampingFactor,
			tolerance,
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
	 * Extracts and filters words from text.
	 *
	 * @param {string} text - Input text
	 * @returns {string[]} Array of filtered words
	 */
	extractWords(text) {
		const processed = this.preprocessText(text);
		const words = tokenizeWords(processed);

		return words.filter(
			(word) =>
				word.length >= this.options.minWordLength && !this.stopwords.has(word),
		);
	}

	/**
	 * Builds co-occurrence graph from words using sliding window.
	 *
	 * @param {string[]} words - Array of words
	 * @returns {{nodes: Set<string>, edges: Map<string, Map<string, number>>}} Graph representation
	 */
	buildCooccurrenceGraph(words) {
		const nodes = new Set(words);
		const edges = new Map();

		// Initialize edges map for each word
		for (const word of nodes) {
			edges.set(word, new Map());
		}

		// Build co-occurrence edges using sliding window
		for (let i = 0; i < words.length; i++) {
			const currentWord = words[i];
			const windowStart = Math.max(0, i - this.options.windowSize);
			const windowEnd = Math.min(words.length, i + this.options.windowSize + 1);

			for (let j = windowStart; j < windowEnd; j++) {
				if (i !== j) {
					const cooccurWord = words[j];
					const currentEdges = edges.get(currentWord);

					// Increment edge weight (undirected graph)
					currentEdges.set(
						cooccurWord,
						(currentEdges.get(cooccurWord) || 0) + 1,
					);

					const cooccurEdges = edges.get(cooccurWord);
					cooccurEdges.set(
						currentWord,
						(cooccurEdges.get(currentWord) || 0) + 1,
					);
				}
			}
		}

		return { nodes, edges };
	}

	/**
	 * Applies TextRank (PageRank) algorithm to rank nodes.
	 *
	 * @param {{nodes: Set<string>, edges: Map<string, Map<string, number>>}} graph - Graph representation
	 * @returns {Map<string, number>} Word scores
	 */
	calculateTextRankScores(graph) {
		const { nodes, edges } = graph;
		const nodeCount = nodes.size;

		if (nodeCount === 0) {
			return new Map();
		}

		// Initialize scores uniformly
		const scores = new Map();
		const newScores = new Map();
		const initialScore = 1.0 / nodeCount;

		for (const node of nodes) {
			scores.set(node, initialScore);
			newScores.set(node, initialScore);
		}

		// Calculate out-degree for each node (sum of edge weights)
		const outDegrees = new Map();
		for (const [node, nodeEdges] of edges) {
			const outDegree = Array.from(nodeEdges.values()).reduce(
				(sum, weight) => sum + weight,
				0,
			);
			outDegrees.set(node, outDegree || 1); // Avoid division by zero
		}

		// Iterative PageRank computation
		for (
			let iteration = 0;
			iteration < this.options.maxIterations;
			iteration++
		) {
			let maxChange = 0;

			for (const node of nodes) {
				// Calculate new score based on incoming edges
				let incomingScore = 0;
				const nodeEdges = edges.get(node);

				for (const [neighbor, weight] of nodeEdges) {
					const neighborOutDegree = outDegrees.get(neighbor);
					incomingScore += (scores.get(neighbor) * weight) / neighborOutDegree;
				}

				// Apply damping factor and random walk probability
				const newScore =
					(1 - this.options.dampingFactor) / nodeCount +
					this.options.dampingFactor * incomingScore;

				newScores.set(node, newScore);

				// Track convergence
				const change = Math.abs(newScore - scores.get(node));
				maxChange = Math.max(maxChange, change);
			}

			// Update scores for next iteration
			for (const [node, score] of newScores) {
				scores.set(node, score);
			}

			// Check convergence
			if (maxChange < this.options.tolerance) {
				break;
			}
		}

		return scores;
	}

	/**
	 * Extracts candidate phrases by combining adjacent high-scoring words.
	 *
	 * @param {string} text - Original text
	 * @param {Map<string, number>} wordScores - Individual word scores
	 * @returns {Map<string, number>} Phrase scores
	 */
	extractPhrases(text, wordScores) {
		// Process original text to preserve word boundaries and stopwords
		const processed = this.preprocessText(text);
		const allWords = tokenizeWords(processed);
		const phraseScores = new Map();
		let currentPhrase = [];
		let currentScore = 0;

		for (const word of allWords) {
			// Check if word meets our filtering criteria and has a positive score
			const isValidWord =
				word.length >= this.options.minWordLength && !this.stopwords.has(word);

			const wordScore = wordScores.get(word) || 0;

			if (isValidWord && wordScore > 0) {
				// Word is significant, add to current phrase
				currentPhrase.push(word);
				currentScore += wordScore;
			} else {
				// Word is stopword, too short, or not scored - end current phrase
				if (currentPhrase.length > 0) {
					const phrase = currentPhrase.join(" ");
					const avgScore = currentScore / currentPhrase.length;
					phraseScores.set(phrase, avgScore);
				}
				currentPhrase = [];
				currentScore = 0;
			}
		}

		// Handle final phrase
		if (currentPhrase.length > 0) {
			const phrase = currentPhrase.join(" ");
			const avgScore = currentScore / currentPhrase.length;
			phraseScores.set(phrase, avgScore);
		}

		return phraseScores;
	}

	/**
	 * Extracts keywords and phrases from text using TextRank algorithm.
	 *
	 * @param {string} text - Input text
	 * @param {Object} options - Extraction options
	 * @param {number} [options.maxKeywords=10] - Maximum number of keywords to return
	 * @param {boolean} [options.includeScores=false] - Include scores in results
	 * @param {number} [options.minScore=0] - Minimum score threshold
	 * @param {boolean} [options.extractPhrases=true] - Extract phrases in addition to words
	 * @returns {string[]|Array<{phrase: string, score: number}>} Array of keywords/phrases
	 */
	extract(text, options = {}) {
		const {
			maxKeywords = 10,
			includeScores = false,
			minScore = 0,
			extractPhrases = true,
		} = options;

		// Step 1: Extract words
		const words = this.extractWords(text);

		if (words.length === 0) {
			return [];
		}

		// Step 2: Build co-occurrence graph
		const graph = this.buildCooccurrenceGraph(words);

		// Step 3: Calculate TextRank scores
		const wordScores = this.calculateTextRankScores(graph);

		// Step 4: Extract phrases or use individual words
		let candidates;
		if (extractPhrases) {
			candidates = this.extractPhrases(text, wordScores);
		} else {
			candidates = wordScores;
		}

		// Step 5: Sort and filter results
		const sortedResults = Array.from(candidates.entries())
			.filter(([_phrase, score]) => score >= minScore)
			.sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
			.slice(0, maxKeywords);

		// Return results with or without scores
		if (includeScores) {
			return sortedResults.map(([phrase, score]) => ({
				phrase,
				score,
			}));
		}

		return sortedResults.map(([phrase]) => phrase);
	}

	/**
	 * Gets detailed analysis of the TextRank process.
	 *
	 * @param {string} text - Input text
	 * @returns {Object} Detailed analysis statistics
	 */
	analyzeText(text) {
		const words = this.extractWords(text);

		if (words.length === 0) {
			return {
				totalWords: 0,
				uniqueWords: 0,
				cooccurrenceEdges: 0,
				avgScore: 0,
				wordScores: {},
				phraseScores: {},
			};
		}

		const graph = this.buildCooccurrenceGraph(words);
		const wordScores = this.calculateTextRankScores(graph);
		const phraseScores = this.extractPhrases(text, wordScores);

		// Calculate statistics
		const totalEdges = Array.from(graph.edges.values()).reduce(
			(sum, edges) => sum + edges.size,
			0,
		);

		const scoreValues = Array.from(wordScores.values());
		const avgScore =
			scoreValues.length > 0
				? scoreValues.reduce((sum, score) => sum + score, 0) /
					scoreValues.length
				: 0;

		return {
			totalWords: words.length,
			uniqueWords: graph.nodes.size,
			cooccurrenceEdges: totalEdges / 2, // Undirected graph, so divide by 2
			avgScore,
			wordScores: Object.fromEntries(wordScores),
			phraseScores: Object.fromEntries(phraseScores),
		};
	}

	/**
	 * Extracts only individual words (no phrase construction).
	 *
	 * @param {string} text - Input text
	 * @param {Object} options - Extraction options
	 * @returns {string[]|Array<{phrase: string, score: number}>} Array of individual words
	 */
	extractWordsOnly(text, options = {}) {
		return this.extract(text, { ...options, extractPhrases: false });
	}

	/**
	 * Gets the co-occurrence graph for visualization or analysis.
	 *
	 * @param {string} text - Input text
	 * @returns {{nodes: Array<{word: string, score: number}>, edges: Array<{source: string, target: string, weight: number}>}} Graph data
	 */
	getGraph(text) {
		const words = this.extractWords(text);

		if (words.length === 0) {
			return { nodes: [], edges: [] };
		}

		const graph = this.buildCooccurrenceGraph(words);
		const wordScores = this.calculateTextRankScores(graph);

		// Format nodes
		const nodes = Array.from(graph.nodes).map((word) => ({
			word,
			score: wordScores.get(word) || 0,
		}));

		// Format edges (avoid duplicates in undirected graph)
		const edges = [];
		const processedPairs = new Set();

		for (const [source, sourceEdges] of graph.edges) {
			for (const [target, weight] of sourceEdges) {
				const pair = [source, target].sort().join(":");
				if (!processedPairs.has(pair)) {
					edges.push({ source, target, weight });
					processedPairs.add(pair);
				}
			}
		}

		return { nodes, edges };
	}
}
