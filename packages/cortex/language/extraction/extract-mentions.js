/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Social media mention extraction from text using regex pattern matching.
 *
 * Identifies and extracts @mention patterns commonly used in social media
 * platforms like Twitter, Discord, and GitHub. Supports alphanumeric
 * usernames with underscores.
 */

// Pre-compiled regex pattern for performance
const MENTION_PATTERN = /@[\w]+/g;

/**
 * Extracts social media mentions from text.
 *
 * Identifies @mention patterns using regex matching, supporting alphanumeric
 * usernames with underscores. Commonly used in social media, chat platforms,
 * and version control systems.
 *
 * @param {string} text - The text to extract mentions from
 * @param {boolean} usePlaceholders - Return text with <MENTION> placeholders instead of extracted mentions
 * @returns {string[]|string} Array of extracted mentions or text with placeholders
 *
 * @example
 * // Basic mention extraction
 * extractMentions('Thanks @user for the help'); // ['@user']
 *
 * @example
 * // Multiple mentions with underscores
 * extractMentions('CC @admin_user and @developer_123'); // ['@admin_user', '@developer_123']
 *
 * @example
 * // Placeholder replacement
 * extractMentions('Follow @user for updates', true); // 'Follow <MENTION> for updates'
 */
export function extractMentions(text, usePlaceholders = false) {
	if (usePlaceholders) {
		return text.replace(MENTION_PATTERN, "<MENTION>");
	}

	return text.match(MENTION_PATTERN) || [];
}
