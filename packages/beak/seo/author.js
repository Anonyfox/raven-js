/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../html/index.js";

/**
 * @typedef {Object} AuthorConfig
 * @property {string} name - Author's full name
 * @property {string} [url] - URL to author's profile or website
 * @property {string} [email] - Author's email address
 */

/**
 * Generates author meta tags for search engine attribution and contact information.
 *
 * Creates standard author meta tag with optional email reply-to tag. Essential
 * for content attribution and providing search engines with author contact details.
 *
 * @param {AuthorConfig} config - Configuration object for author tags
 * @returns {string} Generated author meta tags as HTML string
 *
 * @example
 * // Basic usage
 * author({ name: 'John Doe', email: 'john@example.com' });
 * // → '<meta name="author" content="John Doe" /><meta name="reply-to" content="john@example.com" />'
 *
 * @example
 * // Edge case: name only
 * author({ name: 'Jane Smith' });
 * // → '<meta name="author" content="Jane Smith" />'
 */
export const author = ({ name, email }) => {
	return html`
		<meta name="author" content="${name}" />
		${email ? html`<meta name="reply-to" content="${email}" />` : ""}
	`;
};
