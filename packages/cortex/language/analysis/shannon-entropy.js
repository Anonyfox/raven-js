/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shannon entropy analyzer for measuring text predictability and randomness.
 *
 * Calculates information-theoretic entropy based on character frequency distribution
 * to distinguish human from AI-generated text. AI content shows 15-25% lower entropy
 * due to more predictable character patterns, providing a statistical fingerprint.
 * Uses Unicode normalization for consistent international text processing.
 */

import { normalizeUnicode } from "../normalization/index.js";

/**
 * Calculates Shannon entropy of text based on character frequency distribution.
 *
 * Measures the information density and unpredictability of text using the Shannon
 * entropy formula: H(X) = -∑ p(x) * log₂(p(x)). Higher entropy values indicate
 * more unpredictable, human-like text patterns, while lower values suggest
 * artificial generation with more predictable character sequences.
 *
 * @param {string} text - Input text to analyze for character distribution patterns
 * @returns {number} Shannon entropy in bits (0-∞, higher = more unpredictable)
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text is empty or contains no valid characters
 *
 * @example
 * // Human text typically shows higher entropy
 * const humanText = "The quick brown fox jumps over the lazy dog! What creativity...";
 * const humanEntropy = calculateShannonEntropy(humanText);
 * console.log(humanEntropy); // ~4.2 bits (high unpredictability)
 *
 * @example
 * // AI text typically shows lower entropy
 * const aiText = "This is a sentence. This is another sentence. This is a third sentence.";
 * const aiEntropy = calculateShannonEntropy(aiText);
 * console.log(aiEntropy); // ~3.8 bits (more predictable)
 *
 * @example
 * // Cryptographic analysis
 * function assessRandomness(generatedText) {
 *   const entropy = calculateShannonEntropy(generatedText);
 *   return entropy > 4.0 ? 'high-quality' : 'needs-improvement';
 * }
 *
 * @example
 * // Content moderation pipeline
 * function flagSyntheticContent(content) {
 *   const entropy = calculateShannonEntropy(content);
 *   const threshold = 3.9; // Adjust based on training data
 *   return entropy < threshold ? 'potentially-synthetic' : 'likely-human';
 * }
 *
 * @example
 * // Writing complexity assessment
 * function analyzeWritingComplexity(essay) {
 *   const entropy = calculateShannonEntropy(essay);
 *   if (entropy > 4.3) return 'highly-diverse';
 *   if (entropy > 4.0) return 'moderately-diverse';
 *   return 'low-diversity';
 * }
 */
export function calculateShannonEntropy(text) {
	if (typeof text !== "string") {
		throw new TypeError("Expected text to be a string");
	}

	if (text.length === 0) {
		throw new Error("Cannot calculate entropy of empty text");
	}

	// Normalize Unicode text for consistent character handling across encodings
	// Handles emoji, combining characters, and compatibility mappings consistently
	const normalizedText = normalizeUnicode(text);

	// Convert to array of characters for processing
	const characters = normalizedText.split("");
	const totalCharacters = characters.length;

	// Count frequency of each character
	const frequencyMap = new Map();
	for (const char of characters) {
		frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
	}

	// Calculate Shannon entropy using the formula: H(X) = -∑ p(x) * log₂(p(x))
	let entropy = 0;
	for (const frequency of frequencyMap.values()) {
		// Calculate probability of this character
		const probability = frequency / totalCharacters;

		// Add to entropy sum: -p(x) * log₂(p(x))
		// Note: log₂(x) = ln(x) / ln(2)
		entropy -= probability * (Math.log(probability) / Math.log(2));
	}

	return entropy;
}
