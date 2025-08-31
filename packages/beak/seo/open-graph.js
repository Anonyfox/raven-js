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
 * Generates Open Graph meta tags for social media sharing optimization.
 *
 * Creates comprehensive Open Graph meta tags with dual name/property attributes
 * for maximum platform compatibility. Automatically constructs absolute URLs
 * when domain provided.
 *
 * @param {OpenGraphConfig} config - Configuration object for Open Graph tags
 * @returns {string} Generated Open Graph meta tags as HTML string
 *
 * @example
 * // Basic usage
 * openGraph({
 *   title: 'My Page',
 *   description: 'Page description',
 *   domain: 'example.com',
 *   path: '/my-page',
 *   imageUrl: '/og-image.jpg'
 * });
 *
 * @example
 * // Edge case: article type with full configuration
 * openGraph({
 *   title: 'Blog Post',
 *   description: 'Detailed article',
 *   type: 'article',
 *   domain: 'blog.com',
 *   path: '/posts/123',
 *   imageUrl: '/images/post.jpg'
 * });
 *
 * @example
 * // Edge case: minimal configuration
 * openGraph({
 *   title: 'Simple Page',
 *   description: 'Basic description'
 * });
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
