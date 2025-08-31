/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../html/index.js";
import { absoluteUrl } from "./utils.js";

/**
 * @typedef {Object} GeneralConfig
 * @property {string} title - Page title
 * @property {string} description - Page description
 * @property {string[]} [keywords] - Page keywords
 * @property {string} [robots] - Robots directive
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [suffix] - Title suffix
 */

/**
 * Generates essential SEO meta tags for page identity and search optimization.
 *
 * Creates fundamental SEO elements: title with optional suffix, description with
 * dual name/property attributes, and canonical URL when domain provided.
 * Core foundation for search engine optimization.
 *
 * @param {GeneralConfig} config - Configuration object for general SEO tags
 * @returns {string} Generated meta tags as HTML string
 *
 * @example
 * // Basic usage
 * general({
 *   title: 'My Page',
 *   description: 'Page description',
 *   domain: 'example.com',
 *   path: '/page'
 * });
 *
 * @example
 * // Edge case: with title suffix
 * general({ title: 'Article', description: 'Content', suffix: 'Blog' });
 * // → '<title>Article | Blog</title>...'
 *
 * @example
 * // Edge case: minimal configuration
 * general({ title: 'Simple', description: 'Basic page' });
 */
export const general = ({ title, description, domain, path, suffix }) => {
	const fullTitle = suffix ? `${title} | ${suffix}` : title;
	const url = domain && path ? absoluteUrl(path, domain) : path;

	return html`
		<title>${fullTitle}</title>
		<meta name="description" property="description" content="${description}" />
		<link rel="canonical" href="${url}" />
	`;
};
