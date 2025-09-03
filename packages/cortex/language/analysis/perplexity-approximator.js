/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Perplexity approximator for identifying AI word choice patterns.
 *
 * Analyzes word choice predictability patterns that are characteristic of AI-generated
 * content. Research shows AI systematically produces text with lower perplexity (more
 * predictable word sequences) compared to human writing, which exhibits greater lexical
 * creativity and unexpected word choices. This implementation provides statistical
 * approximations without requiring full language model dependencies.
 * Uses robust cortex building blocks for enhanced tokenization accuracy.
 */

import { foldCase } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/index.js";

/**
 * Human baseline metrics for perplexity characteristics in natural writing.
 * These values represent typical predictability patterns in human-written content.
 */
const PERPLEXITY_BASELINES = {
	// Overall perplexity measures (lower = more predictable = more AI-like)
	unigram_entropy: 4.8, // Bits per word for single word frequency
	bigram_entropy: 6.2, // Bits per word for two-word sequences
	trigram_entropy: 7.1, // Bits per word for three-word sequences

	// Predictability ratios (higher = more predictable = more AI-like)
	common_word_ratio: 0.65, // Ratio of common words to total words
	rare_word_usage: 0.08, // Ratio of rare/unique words to total words
	vocab_diversity: 0.45, // Type-token ratio (unique words / total words)

	// Context predictability measures
	bigram_predictability: 0.42, // How often next word is highly predictable
	trigram_predictability: 0.35, // How often word is predictable from 2-word context
	context_switches: 0.25, // How often context changes unexpectedly

	// Word choice creativity measures
	synonym_variety: 0.18, // Usage of varied synonyms vs repeated words
	lexical_sophistication: 0.22, // Usage of sophisticated vs simple words
	semantic_surprise: 0.15, // Usage of semantically unexpected word choices
};

/**
 * Approximates text perplexity to identify AI-generated content patterns.
 *
 * Analyzes word choice predictability through statistical frequency models and conditional
 * probability approximations. Calculates entropy measures for different n-gram contexts,
 * evaluates vocabulary diversity and creativity patterns, and estimates overall perplexity
 * scores. Higher predictability scores indicate more AI-like mechanical word choices.
 *
 * @param {string} text - Input text to analyze for perplexity patterns
 * @param {Object} [options={}] - Configuration options for analysis
 * @param {number} [options.minWordCount=15] - Minimum word count for reliable analysis
 * @param {boolean} [options.includeDetails=false] - Whether to include metric-specific details
 * @param {number} [options.vocabularySize=10000] - Estimated vocabulary size for entropy calculations
 * @returns {{aiLikelihood: number, overallPerplexity: number, predictabilityScore: number, entropyMeasures: Object, diversityMetrics: Object, wordCount: number, detailedMetrics: Array<Object>}} Analysis results with AI detection metrics:
 *   - aiLikelihood: Overall AI probability score (0-1, higher = more AI-like)
 *   - overallPerplexity: Estimated perplexity score (lower = more predictable)
 *   - predictabilityScore: Word choice predictability vs human baseline
 *   - entropyMeasures: Entropy calculations for different n-gram levels
 *   - diversityMetrics: Vocabulary diversity and creativity measures
 *   - wordCount: Total words analyzed
 *   - detailedMetrics: Array of individual metric breakdowns (if includeDetails=true)
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 * @throws {Error} When options contain invalid values
 *
 * @example
 * // Human text typically shows higher perplexity (less predictable)
 * const humanText = "The manuscript revealed unexpected narrative techniques that challenged conventional storytelling approaches through innovative character development and unconventional plot structures.";
 * const humanAnalysis = approximatePerplexity(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability)
 *
 * @example
 * // AI text typically shows lower perplexity (more predictable)
 * const aiText = "The system provides comprehensive solutions that enhance efficiency and improve performance. Users can leverage advanced features to optimize workflows and achieve better results through streamlined processes.";
 * const aiAnalysis = approximatePerplexity(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.7-0.9 (high AI probability)
 *
 * @example
 * // Content analysis for authenticity
 * function assessTextAuthenticity(content) {
 *   const analysis = approximatePerplexity(content, { includeDetails: true });
 *   if (analysis.aiLikelihood > 0.6) {
 *     return {
 *       status: 'suspicious',
 *       perplexity: analysis.overallPerplexity,
 *       predictability: analysis.predictabilityScore
 *     };
 *   }
 *   return { status: 'likely-human', perplexity: analysis.overallPerplexity };
 * }
 *
 * @example
 * // Writing creativity assessment
 * function assessLexicalCreativity(text) {
 *   const analysis = approximatePerplexity(text);
 *   return {
 *     creativity: 1 - analysis.predictabilityScore,
 *     perplexity: analysis.overallPerplexity,
 *     vocabulary_diversity: analysis.diversityMetrics.vocab_diversity
 *   };
 * }
 */
export function approximatePerplexity(text, options = {}) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Extract and validate options
	const {
		minWordCount = 15,
		includeDetails = false,
		vocabularySize = 10000,
	} = options;

	if (!Number.isInteger(minWordCount) || minWordCount < 1) {
		throw new Error("Parameter minWordCount must be a positive integer");
	}

	if (!Number.isInteger(vocabularySize) || vocabularySize < 1000) {
		throw new Error("Parameter vocabularySize must be at least 1000");
	}

	// Tokenize and normalize text using robust building blocks
	// International-aware case folding and Unicode-aware word tokenization
	const normalizedText = foldCase(text);
	const words = tokenizeWords(normalizedText);

	const wordCount = words.length;

	if (wordCount < minWordCount) {
		throw new Error(
			`Text must contain at least ${minWordCount} words for reliable analysis`,
		);
	}

	// Build frequency models
	const unigramCounts = new Map();
	const bigramCounts = new Map();
	const trigramCounts = new Map();

	// Count unigrams
	for (const word of words) {
		unigramCounts.set(word, (unigramCounts.get(word) || 0) + 1);
	}

	// Count bigrams
	for (let i = 0; i < words.length - 1; i++) {
		const bigram = `${words[i]} ${words[i + 1]}`;
		bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
	}

	// Count trigrams
	for (let i = 0; i < words.length - 2; i++) {
		const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
		trigramCounts.set(trigram, (trigramCounts.get(trigram) || 0) + 1);
	}

	// Calculate entropy measures
	const unigramEntropy = calculateEntropy(unigramCounts, wordCount);
	const bigramEntropy = calculateEntropy(bigramCounts, words.length - 1);
	const trigramEntropy = calculateEntropy(trigramCounts, words.length - 2);

	// Calculate vocabulary diversity metrics
	const uniqueWords = unigramCounts.size;
	const vocabDiversity = uniqueWords / wordCount; // Type-token ratio

	// Calculate word frequency distributions
	const frequencies = Array.from(unigramCounts.values()).sort((a, b) => b - a);
	const commonWords = frequencies.slice(0, Math.min(10, frequencies.length));
	const commonWordRatio =
		commonWords.reduce((sum, freq) => sum + freq, 0) / wordCount;

	// Calculate rare word usage (words appearing only once)
	const rareWords = Array.from(unigramCounts.values()).filter(
		(count) => count === 1,
	);
	const rareWordUsage = rareWords.length / wordCount;

	// Calculate predictability measures
	const bigramPredictability = calculateBigramPredictability(
		words,
		bigramCounts,
		unigramCounts,
	);
	const trigramPredictability = calculateTrigramPredictability(
		words,
		trigramCounts,
		bigramCounts,
	);

	// Calculate context switching measure
	const contextSwitches = calculateContextSwitches(words, unigramCounts);

	// Calculate lexical sophistication (longer words indicate higher sophistication)
	const avgWordLength =
		words.reduce((sum, word) => sum + word.length, 0) / wordCount;
	const sophisticatedWords = words.filter((word) => word.length >= 7).length;
	const lexicalSophistication = sophisticatedWords / wordCount;

	// Calculate semantic surprise approximation (using word length and frequency variations)
	const semanticSurprise = calculateSemanticSurprise(words, unigramCounts);

	// Calculate synonym variety approximation
	const synonymVariety = calculateSynonymVariety(words);

	// Compile metrics
	const entropyMeasures = {
		unigram: unigramEntropy,
		bigram: bigramEntropy,
		trigram: trigramEntropy,
	};

	const diversityMetrics = {
		vocab_diversity: vocabDiversity,
		common_word_ratio: commonWordRatio,
		rare_word_usage: rareWordUsage,
		lexical_sophistication: lexicalSophistication,
		avg_word_length: avgWordLength,
	};

	const predictabilityMetrics = {
		bigram_predictability: bigramPredictability,
		trigram_predictability: trigramPredictability,
		context_switches: contextSwitches,
		semantic_surprise: semanticSurprise,
		synonym_variety: synonymVariety,
	};

	// Calculate overall perplexity approximation
	const overallPerplexity = Math.exp(
		(unigramEntropy + bigramEntropy + trigramEntropy) / 3,
	);

	// Calculate AI likelihood based on predictability patterns
	const entropyScore =
		1 - (unigramEntropy + bigramEntropy + trigramEntropy) / 3 / 8; // Normalize to 0-1
	const diversityScore =
		1 - (vocabDiversity + (1 - commonWordRatio) + rareWordUsage) / 3;
	const predictabilityScore =
		(bigramPredictability + trigramPredictability + (1 - contextSwitches)) / 3;
	const creativityScore =
		1 - (lexicalSophistication + semanticSurprise + synonymVariety) / 3;

	const aiLikelihood =
		entropyScore * 0.3 +
		diversityScore * 0.25 +
		predictabilityScore * 0.25 +
		creativityScore * 0.2;

	// Compile detailed metrics if requested
	const detailedMetrics = [];
	if (includeDetails) {
		detailedMetrics.push(
			{
				metric: "unigram_entropy",
				value: unigramEntropy,
				baseline: PERPLEXITY_BASELINES.unigram_entropy,
			},
			{
				metric: "bigram_entropy",
				value: bigramEntropy,
				baseline: PERPLEXITY_BASELINES.bigram_entropy,
			},
			{
				metric: "trigram_entropy",
				value: trigramEntropy,
				baseline: PERPLEXITY_BASELINES.trigram_entropy,
			},
			{
				metric: "vocab_diversity",
				value: vocabDiversity,
				baseline: PERPLEXITY_BASELINES.vocab_diversity,
			},
			{
				metric: "common_word_ratio",
				value: commonWordRatio,
				baseline: PERPLEXITY_BASELINES.common_word_ratio,
			},
			{
				metric: "rare_word_usage",
				value: rareWordUsage,
				baseline: PERPLEXITY_BASELINES.rare_word_usage,
			},
			{
				metric: "bigram_predictability",
				value: bigramPredictability,
				baseline: PERPLEXITY_BASELINES.bigram_predictability,
			},
			{
				metric: "trigram_predictability",
				value: trigramPredictability,
				baseline: PERPLEXITY_BASELINES.trigram_predictability,
			},
			{
				metric: "context_switches",
				value: contextSwitches,
				baseline: PERPLEXITY_BASELINES.context_switches,
			},
			{
				metric: "lexical_sophistication",
				value: lexicalSophistication,
				baseline: PERPLEXITY_BASELINES.lexical_sophistication,
			},
			{
				metric: "semantic_surprise",
				value: semanticSurprise,
				baseline: PERPLEXITY_BASELINES.semantic_surprise,
			},
			{
				metric: "synonym_variety",
				value: synonymVariety,
				baseline: PERPLEXITY_BASELINES.synonym_variety,
			},
		);
	}

	return {
		aiLikelihood: Math.max(0, Math.min(1, aiLikelihood)),
		overallPerplexity,
		predictabilityScore,
		entropyMeasures,
		diversityMetrics: {
			...diversityMetrics,
			...predictabilityMetrics,
		},
		wordCount,
		detailedMetrics,
	};
}

/**
 * Calculates entropy for a frequency distribution.
 *
 * @param {Map<string, number>} counts - Frequency counts
 * @param {number} total - Total count
 * @returns {number} Entropy in bits
 */
function calculateEntropy(counts, total) {
	let entropy = 0;
	for (const count of counts.values()) {
		const probability = count / total;
		entropy -= probability * Math.log2(probability);
	}
	return entropy;
}

/**
 * Calculates bigram predictability (how often the next word is highly predictable).
 *
 * @param {string[]} words - Array of words
 * @param {Map<string, number>} bigramCounts - Bigram frequency counts
 * @param {Map<string, number>} unigramCounts - Unigram frequency counts
 * @returns {number} Predictability score (0-1)
 */
function calculateBigramPredictability(words, bigramCounts, unigramCounts) {
	let totalPredictability = 0;
	let validPairs = 0;

	for (let i = 0; i < words.length - 1; i++) {
		const firstWord = words[i];
		const bigram = `${words[i]} ${words[i + 1]}`;

		const bigramCount = bigramCounts.get(bigram) || 0;
		const firstWordCount = unigramCounts.get(firstWord) || 0;

		if (firstWordCount > 0) {
			const conditionalProb = bigramCount / firstWordCount;
			totalPredictability += conditionalProb;
			validPairs++;
		}
	}

	return validPairs > 0 ? totalPredictability / validPairs : 0;
}

/**
 * Calculates trigram predictability (how often a word is predictable from 2-word context).
 *
 * @param {string[]} words - Array of words
 * @param {Map<string, number>} trigramCounts - Trigram frequency counts
 * @param {Map<string, number>} bigramCounts - Bigram frequency counts
 * @returns {number} Predictability score (0-1)
 */
function calculateTrigramPredictability(words, trigramCounts, bigramCounts) {
	let totalPredictability = 0;
	let validTriplets = 0;

	for (let i = 0; i < words.length - 2; i++) {
		const contextBigram = `${words[i]} ${words[i + 1]}`;
		const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;

		const trigramCount = trigramCounts.get(trigram) || 0;
		const bigramCount = bigramCounts.get(contextBigram) || 0;

		if (bigramCount > 0) {
			const conditionalProb = trigramCount / bigramCount;
			totalPredictability += conditionalProb;
			validTriplets++;
		}
	}

	return validTriplets > 0 ? totalPredictability / validTriplets : 0;
}

/**
 * Calculates context switching frequency (unexpected vocabulary changes).
 *
 * @param {string[]} words - Array of words
 * @param {Map<string, number>} unigramCounts - Unigram frequency counts
 * @returns {number} Context switch rate (0-1)
 */
function calculateContextSwitches(words, unigramCounts) {
	let contextSwitches = 0;
	const windowSize = 5; // Look at 5-word windows

	for (let i = 0; i < words.length - windowSize; i++) {
		const currentWindow = words.slice(i, i + windowSize);
		const nextWindow = words.slice(i + 1, i + 1 + windowSize);

		// Calculate frequency similarity between windows
		const currentFreqs = currentWindow.map(
			(word) => unigramCounts.get(word) || 0,
		);
		const nextFreqs = nextWindow.map((word) => unigramCounts.get(word) || 0);

		const avgCurrentFreq =
			currentFreqs.reduce((sum, freq) => sum + freq, 0) / windowSize;
		const avgNextFreq =
			nextFreqs.reduce((sum, freq) => sum + freq, 0) / windowSize;

		// If frequency patterns change significantly, it's a context switch
		if (
			Math.abs(avgCurrentFreq - avgNextFreq) /
				Math.max(avgCurrentFreq, avgNextFreq, 1) >
			0.5
		) {
			contextSwitches++;
		}
	}

	return words.length > windowSize
		? contextSwitches / (words.length - windowSize)
		: 0;
}

/**
 * Calculates semantic surprise approximation based on word patterns.
 *
 * @param {string[]} words - Array of words
 * @param {Map<string, number>} unigramCounts - Unigram frequency counts
 * @returns {number} Semantic surprise score (0-1)
 */
function calculateSemanticSurprise(words, unigramCounts) {
	let surpriseScore = 0;

	for (let i = 1; i < words.length; i++) {
		const currentWord = words[i];
		const prevWord = words[i - 1];

		const currentFreq = unigramCounts.get(currentWord) || 0;
		const prevFreq = unigramCounts.get(prevWord) || 0;

		// Calculate "surprise" based on frequency differences and word length patterns
		const freqDiff =
			Math.abs(currentFreq - prevFreq) / Math.max(currentFreq, prevFreq, 1);
		const lengthDiff =
			Math.abs(currentWord.length - prevWord.length) /
			Math.max(currentWord.length, prevWord.length);

		surpriseScore += (freqDiff + lengthDiff) / 2;
	}

	return words.length > 1 ? surpriseScore / (words.length - 1) : 0;
}

/**
 * Calculates synonym variety approximation (lexical diversity within semantic fields).
 *
 * @param {string[]} words - Array of words
 * @returns {number} Synonym variety score (0-1)
 */
function calculateSynonymVariety(words) {
	// Group words by similar patterns (length, ending, etc.) as a proxy for semantic similarity
	const wordGroups = new Map();

	for (const word of words) {
		// Create a simple grouping key based on word characteristics
		const groupKey = `${word.length}_${word.slice(-2)}`; // Length + last 2 characters

		if (!wordGroups.has(groupKey)) {
			wordGroups.set(groupKey, new Set());
		}
		wordGroups.get(groupKey).add(word);
	}

	// Calculate variety within each group
	let totalVariety = 0;
	let groupCount = 0;

	for (const [groupKey, wordSet] of wordGroups) {
		if (wordSet.size > 1) {
			// Only consider groups with multiple words
			const groupWords = Array.from(wordSet);
			const groupVariety =
				groupWords.length /
				words.filter((w) => {
					const wGroupKey = `${w.length}_${w.slice(-2)}`;
					return wGroupKey === groupKey;
				}).length;

			totalVariety += groupVariety;
			groupCount++;
		}
	}

	return groupCount > 0 ? totalVariety / groupCount : 0;
}
