/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file TextRank algorithm for keyword and phrase extraction.
 *
 * Graph-based ranking algorithm that builds co-occurrence networks and applies
 * iterative ranking (similar to PageRank) to identify important words and phrases.
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
 * Extract words from text applying filters and preprocessing.
 *
 * @param {string} text - Input text
 * @param {Set<string>} stopwords - Set of stopwords to filter
 * @param {number} minWordLength - Minimum word length
 * @returns {string[]} Array of filtered words
 * @private
 */
function extractWords(text, stopwords, minWordLength) {
	const words = tokenizeWords(text);
	return words.filter(
		(word) => word.length >= minWordLength && !stopwords.has(word),
	);
}

/**
 * Build co-occurrence graph from words using sliding window.
 *
 * @param {string[]} words - Array of words
 * @param {number} windowSize - Co-occurrence window size
 * @returns {{nodes: Set<string>, edges: Map<string, Map<string, number>>}} Graph representation
 * @private
 */
function buildCooccurrenceGraph(words, windowSize) {
	const nodes = new Set(words);
	const edges = new Map();

	// Initialize edges map for each word
	for (const word of nodes) {
		edges.set(word, new Map());
	}

	// Build co-occurrence edges using sliding window
	for (let i = 0; i < words.length; i++) {
		const currentWord = words[i];
		const windowStart = Math.max(0, i - windowSize);
		const windowEnd = Math.min(words.length, i + windowSize + 1);

		for (let j = windowStart; j < windowEnd; j++) {
			if (i !== j) {
				const cooccurWord = words[j];
				const currentEdges = edges.get(currentWord);

				// Increment edge weight (undirected graph)
				currentEdges.set(cooccurWord, (currentEdges.get(cooccurWord) || 0) + 1);

				const cooccurEdges = edges.get(cooccurWord);
				cooccurEdges.set(currentWord, (cooccurEdges.get(currentWord) || 0) + 1);
			}
		}
	}

	return { nodes, edges };
}

/**
 * Apply TextRank (PageRank) algorithm to rank graph nodes.
 *
 * @param {{nodes: Set<string>, edges: Map<string, Map<string, number>>}} graph - Graph representation
 * @param {number} maxIterations - Maximum iterations for convergence
 * @param {number} dampingFactor - Damping factor for PageRank algorithm
 * @param {number} tolerance - Convergence tolerance
 * @returns {Map<string, number>} Word scores
 * @private
 */
function calculateTextRankScores(
	graph,
	maxIterations,
	dampingFactor,
	tolerance,
) {
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
	for (let iteration = 0; iteration < maxIterations; iteration++) {
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
				(1 - dampingFactor) / nodeCount + dampingFactor * incomingScore;

			newScores.set(node, newScore);
			maxChange = Math.max(maxChange, Math.abs(newScore - scores.get(node)));
		}

		// Update scores for next iteration
		for (const [node, score] of newScores) {
			scores.set(node, score);
		}

		// Check convergence
		if (maxChange < tolerance) {
			break;
		}
	}

	return scores;
}

/**
 * Extract phrases from text by grouping adjacent scored words.
 *
 * @param {string} text - Input text
 * @param {Map<string, number>} wordScores - Individual word scores
 * @param {Set<string>} stopwords - Set of stopwords to filter
 * @param {number} minWordLength - Minimum word length
 * @returns {Map<string, number>} Phrase scores
 * @private
 */
function extractPhrases(text, wordScores, stopwords, minWordLength) {
	const allWords = tokenizeWords(text);
	const phraseScores = new Map();
	let currentPhrase = [];
	let currentScore = 0;

	for (const word of allWords) {
		// Check if word meets our filtering criteria and has a positive score
		const isValidWord = word.length >= minWordLength && !stopwords.has(word);
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
 * Extract keywords from text using the TextRank algorithm.
 *
 * TextRank is a graph-based ranking algorithm that builds co-occurrence networks
 * and applies iterative ranking (similar to PageRank) to identify important words
 * and phrases. It uses sliding window co-occurrence and power iteration.
 *
 * @param {string} text - Input text to extract keywords from
 * @param {Object} [options] - Configuration options
 * @param {Set<string>|string[]} [options.stopwords] - Stopwords to filter out (user must provide)
 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @param {number} [options.windowSize=4] - Co-occurrence window size
 * @param {number} [options.minWordLength=2] - Minimum word length for consideration
 * @param {number} [options.maxIterations=50] - Maximum iterations for convergence
 * @param {number} [options.dampingFactor=0.85] - Damping factor for PageRank algorithm
 * @param {number} [options.tolerance=1e-6] - Convergence tolerance
 * @param {number} [options.maxKeywords=10] - Maximum number of keywords to return
 * @param {number} [options.minScore=0] - Minimum score threshold
 * @param {boolean} [options.extractPhrases=true] - Extract phrases (true) or individual words (false)
 * @returns {string[]} Array of extracted keywords/phrases, sorted by relevance
 *
 * @example
 * // Basic usage (requires user to provide stopwords for tree-shaking)
 * import { ENGLISH_STOPWORDS } from '@raven-js/cortex/language/stopwords';
 * const keywords = extractKeywords('Natural language processing research', {
 *   stopwords: ENGLISH_STOPWORDS
 * });
 * console.log(keywords); // ['natural language processing', 'research']
 *
 * @example
 * // Custom configuration
 * const keywords = extractKeywords(text, {
 *   stopwords: new Set(['the', 'and', 'or']),
 *   maxKeywords: 5,
 *   windowSize: 6,
 *   extractPhrases: false  // Only individual words
 * });
 *
 * @example
 * // Works without stopwords (less effective but zero dependencies)
 * const keywords = extractKeywords('Machine learning algorithms are powerful');
 * // Returns individual words/phrases since no stopwords provided
 */
export function extractKeywords(text, options = {}) {
	const {
		stopwords = new Set(), // Empty set by default - user provides stopwords
		normalize = true,
		lowercase = true,
		windowSize = 4,
		minWordLength = 2,
		maxIterations = 50,
		dampingFactor = 0.85,
		tolerance = 1e-6,
		maxKeywords = 10,
		minScore = 0,
		extractPhrases: shouldExtractPhrases = true,
	} = options;

	if (typeof text !== "string") {
		throw new TypeError("Input text must be a string");
	}

	// Convert array to Set if needed
	const stopwordSet = stopwords instanceof Set ? stopwords : new Set(stopwords);

	// Step 1: Preprocess text
	const processedText = preprocessText(text, normalize, lowercase);

	// Step 2: Extract words
	const words = extractWords(processedText, stopwordSet, minWordLength);

	if (words.length === 0) {
		return [];
	}

	// Step 3: Build co-occurrence graph
	const graph = buildCooccurrenceGraph(words, windowSize);

	// Step 4: Calculate TextRank scores
	const wordScores = calculateTextRankScores(
		graph,
		maxIterations,
		dampingFactor,
		tolerance,
	);

	// Step 5: Extract phrases or use individual words
	let candidates;
	if (shouldExtractPhrases) {
		candidates = extractPhrases(
			processedText,
			wordScores,
			stopwordSet,
			minWordLength,
		);
	} else {
		candidates = wordScores;
	}

	// Step 6: Sort and filter results
	const sortedKeywords = Array.from(candidates.entries())
		.filter(([_phrase, score]) => score >= minScore)
		.sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
		.slice(0, maxKeywords)
		.map(([phrase]) => phrase);

	return sortedKeywords;
}
