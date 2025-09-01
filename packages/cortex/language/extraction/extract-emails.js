/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Email address extraction from text using regex pattern matching.
 *
 * Identifies and extracts email addresses from text content with support for
 * common email formats including international domains, subdomains, and
 * special characters in local parts.
 */

// Pre-compiled regex pattern for performance
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Extracts email addresses from text.
 *
 * Identifies email addresses using regex pattern matching, supporting common
 * email formats with various local part characters and international domains.
 * Does not perform email validation, only pattern matching.
 *
 * @param {string} text - The text to extract email addresses from
 * @param {boolean} usePlaceholders - Return text with <EMAIL> placeholders instead of extracted emails
 * @returns {string[]|string} Array of extracted email addresses or text with placeholders
 *
 * @example
 * // Basic email extraction
 * extractEmails('Contact us at info@example.com'); // ['info@example.com']
 *
 * @example
 * // Multiple emails with special characters
 * extractEmails('Email first.last+tag@sub.domain.co.uk or test_user@example-site.org');
 * // ['first.last+tag@sub.domain.co.uk', 'test_user@example-site.org']
 *
 * @example
 * // Placeholder replacement
 * extractEmails('Send to admin@example.com', true); // 'Send to <EMAIL>'
 */
export function extractEmails(text, usePlaceholders = false) {
	if (usePlaceholders) {
		return text.replace(EMAIL_PATTERN, "<EMAIL>");
	}

	return text.match(EMAIL_PATTERN) || [];
}
