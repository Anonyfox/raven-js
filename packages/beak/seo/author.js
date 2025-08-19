/**
 * @file Author meta tag generation for content attribution
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../core/index.js";

/**
 * @typedef {Object} AuthorConfig
 * @property {string} name - The name of the content author.
 * @property {string} [email] - Optional. The email address of the author.
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
