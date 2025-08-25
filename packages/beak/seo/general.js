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
 *
 */

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
 * Generates general SEO meta tags for the HTML head section.
 *
 * @param {GeneralConfig} config - Configuration object for general SEO tags
 * @returns {string} The generated meta tags as an HTML string
 *
 * @example
 * import { general } from '@raven-js/beak/seo';
 *
 * const tags = general({
 *   title: 'My Page',
 *   description: 'This is my page description',
 *   domain: 'example.com',
 *   path: '/my-page',
 *   suffix: 'My Site'
 * });
 * // Output:
 * // <title>My Page | My Site</title>
 * // <meta name="description" property="description" content="This is my page description" />
 * // <link rel="canonical" href="https://example.com/my-page" />
 */
export const general = ({ title, description, domain, path, suffix }) => {
	const fullTitle = suffix ? `${title} | ${suffix}` : title;
	const url = absoluteUrl(path, domain);

	return html`
		<title>${fullTitle}</title>
		<meta name="description" property="description" content="${description}" />
		<link rel="canonical" href="${url}" />
	`;
};
