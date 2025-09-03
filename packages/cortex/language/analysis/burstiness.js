/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Sentence length variation analyzer for detecting artificial text patterns.
 *
 * Measures burstiness (sentence length variance) to distinguish human from AI-generated text.
 * Human writing naturally varies sentence lengths 40-60% more than AI-generated content,
 * providing a robust statistical fingerprint for content authenticity verification.
 * Uses robust cortex building blocks for accurate boundary detection.
 */

import { tokenizeSentences, tokenizeWords } from "../segmentation/index.js";

/**
 * Calculates text burstiness by measuring sentence length variation.
 *
 * Analyzes the standard deviation of sentence lengths (word counts) to detect
 * artificial writing patterns. Human authors naturally vary sentence structure
 * for emphasis and rhythm, while AI models generate more uniform patterns.
 * Higher burstiness values indicate more human-like variation.
 *
 * @param {string} text - Input text to analyze for sentence length patterns
 * @returns {number} Burstiness coefficient (0-∞, higher = more human-like)
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient sentences for analysis
 *
 * @example
 * // Human text typically shows higher burstiness
 * const humanText = "Hello! This is a longer sentence. Short. Very complex sentence structure.";
 * const humanBurstiness = calculateBurstiness(humanText);
 * console.log(humanBurstiness); // ~0.85 (high variation)
 *
 * @example
 * // AI text typically shows lower burstiness
 * const aiText = "This is a sentence. This is another sentence. This is yet another sentence.";
 * const aiBurstiness = calculateBurstiness(aiText);
 * console.log(aiBurstiness); // ~0.12 (low variation)
 *
 * @example
 * // Academic integrity checking
 * function checkEssayAuthenticity(essayText) {
 *   const burstiness = calculateBurstiness(essayText);
 *   return burstiness > 0.5 ? 'likely-human' : 'requires-review';
 * }
 *
 * @example
 * // Content moderation pipeline
 * function flagSyntheticContent(posts) {
 *   return posts.filter(post => calculateBurstiness(post.content) < 0.3);
 * }
 */
export function calculateBurstiness(text) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.trim().length === 0) {
		throw new Error("Cannot analyze empty text");
	}

	// Use robust sentence tokenization with abbreviation/decimal handling
	const sentences = tokenizeSentences(text);

	if (sentences.length < 2) {
		throw new Error(
			"Text must contain at least 2 sentences for variance analysis",
		);
	}

	// Count words in each sentence using robust Unicode-aware tokenization
	const sentenceLengths = sentences.map((sentence) => {
		const words = tokenizeWords(sentence);
		return words.length;
	});

	// Remove sentences with zero words (edge case)
	const validLengths = sentenceLengths.filter((length) => length > 0);

	if (validLengths.length < 2) {
		throw new Error("Text must contain at least 2 valid sentences with words");
	}

	// Calculate statistical measures
	const mean =
		validLengths.reduce((sum, length) => sum + length, 0) / validLengths.length;

	if (mean === 0) {
		throw new Error("Average sentence length cannot be zero");
	}

	// Calculate variance using the population formula
	const variance =
		validLengths.reduce((sum, length) => {
			const difference = length - mean;
			return sum + difference * difference;
		}, 0) / validLengths.length;

	const standardDeviation = Math.sqrt(variance);

	// Return coefficient of variation (normalized burstiness)
	// This makes the metric comparable across texts of different average sentence lengths
	return standardDeviation / mean;
}
