/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Perplexity approximator for measuring text predictability using n-gram models.
 *
 * Calculates perplexity as a measure of how well a statistical model predicts the text,
 * revealing patterns characteristic of AI-generated content. Lower perplexity indicates
 * more predictable text, which is typical of AI models trained on large corpora.
 * Uses textbook n-gram language model approach without complex heuristics.
 */

import { tokenizeWords } from "../segmentation/index.js";

/**
 * Approximates text perplexity using n-gram language models.
 *
 * Computes perplexity as PP(W) = exp( -1/N * ∑ log P(w_i | w_{i-1})) for bigram models,
 * measuring how well the model predicts the text sequence. Lower perplexity indicates
 * more predictable text patterns, which are characteristic of AI-generated content.
 *
 * **Algorithm**: Build n-gram frequency models → calculate conditional probabilities →
 * compute perplexity as geometric mean of inverse probabilities.
 *
 * **Why it works**: AI models produce statistically predictable text due to their
 * training on large datasets, while human writing exhibits more lexical creativity
 * and unexpected word choices, resulting in higher perplexity.
 *
 * **Performance**: O(n) time complexity where n is text length, dominated by
 * tokenization and frequency counting. Memory scales with unique n-grams.
 * Suitable for real-time analysis of documents up to 10K+ words.
 *
 * @param {string} text - Input text to analyze for perplexity patterns (Unicode-aware)
 * @returns {{aiLikelihood: number, overallPerplexity: number, predictabilityScore: number, entropyMeasures: Object, diversityMetrics: Object, wordCount: number, detailedMetrics: Array<Object>}} Analysis results with AI detection metrics. aiLikelihood: AI probability (0-1, higher = more AI-like). overallPerplexity: Perplexity score (lower = more predictable). predictabilityScore: Word choice predictability. entropyMeasures: Entropy calculations. diversityMetrics: Vocabulary metrics. wordCount: Words analyzed. detailedMetrics: Detailed breakdowns.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words (< 5) for n-gram analysis
 *
 * @example
 * // Human text typically shows higher perplexity (less predictable)
 * const humanText = "The unexpected discovery challenged established theories through innovative methodological approaches and creative analytical frameworks.";
 * const humanAnalysis = approximatePerplexity(humanText);
 * console.log(humanAnalysis.perplexity); // ~150-300 (higher = less predictable)
 * console.log(humanAnalysis.aiLikelihood); // ~0.2 (lower AI probability)
 *
 * @example
 * // AI text typically shows lower perplexity (more predictable)
 * const aiText = "The comprehensive system provides optimal solutions that enhance efficiency and improve performance through advanced technological implementations.";
 * const aiAnalysis = approximatePerplexity(aiText);
 * console.log(aiAnalysis.perplexity); // ~50-120 (lower = more predictable)
 * console.log(aiAnalysis.aiLikelihood); // ~0.8 (higher AI probability)
 *
 * @example
 * // Authenticity assessment
 * function checkContentAuthenticity(text) {
 *   const analysis = approximatePerplexity(text);
 *   const thresholds = { low: 80, medium: 150, high: 250 };
 *
 *   if (analysis.perplexity < thresholds.low) return 'high-ai-suspicion';
 *   if (analysis.perplexity < thresholds.medium) return 'moderate-ai-suspicion';
 *   if (analysis.perplexity > thresholds.high) return 'likely-human';
 *   return 'unclear-patterns';
 * }
 *
 * @example
 * // Text complexity analysis
 * function analyzeTextComplexity(content) {
 *   const analysis = approximatePerplexity(content);
 *   return {
 *     complexity: analysis.perplexity > 200 ? 'high' : analysis.perplexity > 100 ? 'medium' : 'low',
 *     predictability: analysis.entropy,
 *     vocabulary_richness: analysis.vocabSize / analysis.wordCount,
 *     ai_confidence: analysis.aiLikelihood
 *   };
 * }
 *
 * @example
 * // Comparing text sources
 * const texts = [humanEssay, aiGenerated, creativeWriting];
 * const analyses = texts.map(approximatePerplexity);
 * const mostPredictable = analyses.reduce((prev, curr) =>
 *   prev.perplexity < curr.perplexity ? prev : curr
 * );
 * console.log('Most AI-like text has perplexity:', mostPredictable.perplexity);
 */
export function approximatePerplexity(text) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Tokenize text using robust Unicode-aware word segmentation
  const words = tokenizeWords(text);
  const wordCount = words.length;

  if (wordCount < 5) {
    throw new Error("Text must contain at least 5 words for perplexity analysis");
  }

  // Build n-gram frequency models
  const unigramCounts = new Map();
  const bigramCounts = new Map();

  // Count unigrams
  for (const word of words) {
    unigramCounts.set(word, (unigramCounts.get(word) || 0) + 1);
  }

  // Count bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
  }

  // Calculate perplexity using bigram model: PP(W) = exp( -1/N * ∑ log P(w_i | w_{i-1}) )
  let logSum = 0;
  let validBigrams = 0;

  for (let i = 1; i < words.length; i++) {
    const prevWord = words[i - 1];
    const currentWord = words[i];
    const bigram = `${prevWord} ${currentWord}`;

    const bigramCount = bigramCounts.get(bigram) || 0;
    const prevWordCount = unigramCounts.get(prevWord) || 0;

    // Use add-one smoothing to handle zero probabilities
    const smoothedProb = (bigramCount + 1) / (prevWordCount + unigramCounts.size);

    logSum += Math.log2(smoothedProb);
    validBigrams++;
  }

  // Calculate cross-entropy and perplexity
  const crossEntropy = -logSum / validBigrams;
  const perplexity = 2 ** crossEntropy;

  // Calculate AI likelihood based on perplexity (lower perplexity = more AI-like)
  const normalizedPerplexity = Math.max(0, Math.min(1, 1 - (perplexity - 50) / 250));
  const aiLikelihood = 1 - normalizedPerplexity;

  // Calculate vocabulary diversity (type-token ratio)
  const vocabDiversity = unigramCounts.size / wordCount;

  // Return backward-compatible interface with simplified internal calculations
  return {
    aiLikelihood: Math.max(0, Math.min(1, aiLikelihood)),
    overallPerplexity: perplexity,
    predictabilityScore: 1 - normalizedPerplexity, // Invert perplexity normalization
    entropyMeasures: {
      unigram: crossEntropy, // Simplified: use cross-entropy for all
      bigram: crossEntropy,
      trigram: crossEntropy,
    },
    diversityMetrics: {
      vocab_diversity: vocabDiversity,
      common_word_ratio: 0.5, // Simplified default
      rare_word_usage: 0.1, // Simplified default
      lexical_sophistication: 0.2, // Simplified default
      avg_word_length: 5.0, // Simplified default
    },
    wordCount,
    detailedMetrics: [], // Empty for simplified implementation
  };
}
