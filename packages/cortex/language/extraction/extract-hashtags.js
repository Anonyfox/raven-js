/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Hashtag extraction from text using regex pattern matching.
 *
 * Identifies and extracts #hashtag patterns commonly used in social media
 * platforms for categorization and discoverability. Supports alphanumeric
 * hashtags with underscores.
 */

// Pre-compiled regex pattern for performance
const HASHTAG_PATTERN = /#[\w]+/g;

/**
 * Extracts hashtags from text.
 *
 * Identifies #hashtag patterns using regex matching, supporting alphanumeric
 * hashtags with underscores. Commonly used in social media platforms for
 * content categorization and discovery.
 *
 * @param {string} text - The text to extract hashtags from
 * @param {boolean} usePlaceholders - Return text with <HASHTAG> placeholders instead of extracted hashtags
 * @returns {string[]|string} Array of extracted hashtags or text with placeholders
 *
 * @example
 * // Basic hashtag extraction
 * extractHashtags('Love #coding and #javascript'); // ['#coding', '#javascript']
 *
 * @example
 * // Hashtags with underscores and numbers
 * extractHashtags('Check out #web_dev and #js2024'); // ['#web_dev', '#js2024']
 *
 * @example
 * // Placeholder replacement
 * extractHashtags('Great #tutorial for beginners', true); // 'Great <HASHTAG> for beginners'
 */
export function extractHashtags(text, usePlaceholders = false) {
	if (usePlaceholders) {
		return text.replace(HASHTAG_PATTERN, "<HASHTAG>");
	}

	return text.match(HASHTAG_PATTERN) || [];
}
