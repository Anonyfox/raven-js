/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../core/index.js";

/**
 * @packageDocumentation
 *
 */

/**
 * @typedef {Object} AuthorConfig
 * @property {string} name - Author's full name
 * @property {string} [url] - URL to author's profile or website
 * @property {string} [email] - Author's email address
 */

/**
 * Generates author meta tags for the HTML head section.
 *
 * Provides basic author information for search engines.
 *
 * @param {AuthorConfig} config - Configuration object for author tags
 * @returns {string} The generated author meta tags as an HTML string
 *
 * @example
 * import { author } from '@raven-js/beak/seo';
 *
 * // Basic author information
 * const tags = author({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * // Output:
 * // <meta name="author" content="John Doe" />
 * // <meta name="reply-to" content="john@example.com" />
 */
export const author = ({ name, email }) => {
	return html`
		<meta name="author" content="${name}" />
		${email ? html`<meta name="reply-to" content="${email}" />` : ""}
	`;
};
