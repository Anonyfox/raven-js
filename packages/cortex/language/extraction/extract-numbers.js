/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Number extraction from text using regex pattern matching.
 *
 * Identifies and extracts numeric values from text including integers,
 * decimals, and floating-point numbers. Useful for data extraction
 * and numerical analysis of text content.
 */

// Pre-compiled regex pattern for performance
const NUMBER_PATTERN = /\b\d+(?:\.\d+)?\b/g;

/**
 * Extracts numeric values from text.
 *
 * Identifies numbers using regex matching, supporting both integers and
 * decimal numbers with fractional parts. Does not handle scientific notation,
 * negative numbers with explicit signs, or thousand separators.
 *
 * @param {string} text - The text to extract numbers from
 * @param {boolean} usePlaceholders - Return text with <NUMBER> placeholders instead of extracted numbers
 * @returns {string[]|string} Array of extracted numbers or text with placeholders
 *
 * @example
 * // Basic number extraction
 * extractNumbers('You have 42 messages'); // ['42']
 *
 * @example
 * // Decimal numbers
 * extractNumbers('Temperature is 23.5 degrees and humidity 87.2%'); // ['23.5', '87.2']
 *
 * @example
 * // Placeholder replacement
 * extractNumbers('Score: 95 out of 100', true); // 'Score: <NUMBER> out of <NUMBER>'
 */
export function extractNumbers(text, usePlaceholders = false) {
	if (usePlaceholders) {
		return text.replace(NUMBER_PATTERN, "<NUMBER>");
	}

	return text.match(NUMBER_PATTERN) || [];
}
