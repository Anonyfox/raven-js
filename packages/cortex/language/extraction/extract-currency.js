/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Currency amount extraction from text using regex pattern matching.
 *
 * Identifies and extracts currency amounts with common currency symbols
 * including USD ($), EUR (€), GBP (£), JPY (¥), INR (₹), and RUB (₽).
 * Supports decimal amounts and optional whitespace.
 */

// Pre-compiled regex pattern for performance
const CURRENCY_PATTERN = /(?:\$|€|£|¥|₹|₽)\s*\d+(?:\.\d{2})?/g;

/**
 * Extracts currency amounts from text.
 *
 * Identifies currency amounts using regex matching, supporting major currency
 * symbols with decimal precision. Handles optional whitespace between symbol
 * and amount. Commonly used for financial text processing.
 *
 * @param {string} text - The text to extract currency amounts from
 * @param {boolean} usePlaceholders - Return text with <CURRENCY> placeholders instead of extracted amounts
 * @returns {string[]|string} Array of extracted currency amounts or text with placeholders
 *
 * @example
 * // Basic currency extraction
 * extractCurrency('The price is $19.99'); // ['$19.99']
 *
 * @example
 * // Multiple currencies with spacing
 * extractCurrency('Costs $50.00, € 45.50, or £ 40.00'); // ['$50.00', '€ 45.50', '£ 40.00']
 *
 * @example
 * // Placeholder replacement
 * extractCurrency('Total: $299.99', true); // 'Total: <CURRENCY>'
 */
export function extractCurrency(text, usePlaceholders = false) {
	if (usePlaceholders) {
		return text.replace(CURRENCY_PATTERN, "<CURRENCY>");
	}

	return text.match(CURRENCY_PATTERN) || [];
}
