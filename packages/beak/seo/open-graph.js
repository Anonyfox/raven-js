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
 * @typedef {Object} OpenGraphConfig
 * @property {string} title - Page title
 * @property {string} description - Page description
 * @property {string} [image] - Image URL
 * @property {string} [url] - Page URL
 * @property {string} [type] - Content type (website, article, etc.)
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [imageUrl] - Alternative image URL property
 */

/**
 * Generates Open Graph meta tags for the HTML head section.
 *
 * Since various social media platforms parse these tags differently,
 * every tag uses both `name` and `property` attributes for maximum compatibility.
 *
 * @param {OpenGraphConfig} config - Configuration object for Open Graph tags
 * @returns {string} The generated Open Graph meta tags as an HTML string
 *
 * @example
 * import { openGraph } from '@raven-js/beak/seo';
 *
 * const tags = openGraph({
 *   title: 'My Page',
 *   description: 'This is my page description',
 *   domain: 'example.com',
 *   path: '/my-page',
 *   imageUrl: '/my-image.jpg',
 *   type: 'article'
 * });
 * // Output:
 * // <meta name="og:type" property="og:type" content="article">
 * // <meta name="og:title" property="og:title" content="My Page" />
 * // <meta name="og:description" property="og:description" content="This is my page description" />
 * // <meta name="og:url" property="og:url" content="https://example.com/my-page" />
 * // <meta name="og:image" property="og:image" content="https://example.com/my-image.jpg" />
 */
export const openGraph = ({
	title,
	description,
	domain,
	path,
	imageUrl,
	type = "website",
}) => {
	const url = domain && path ? absoluteUrl(path, domain) : path;
	const image = imageUrl && domain ? absoluteUrl(imageUrl, domain) : imageUrl;

	return html`
		<meta name="og:type" property="og:type" content="${type}">
		<meta name="og:title" property="og:title" content="${title}" />
		<meta name="og:description" property="og:description" content="${description}" />
		<meta name="og:url" property="og:url" content="${url}" />
		${image ? html`<meta name="og:image" property="og:image" content="${image}" />` : ""}
	`;
};
