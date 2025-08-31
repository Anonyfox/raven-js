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
 * @typedef {Object} TwitterConfig
 * @property {string} title - Page title for Twitter
 * @property {string} description - Page description for Twitter
 * @property {string} [image] - Image URL for Twitter Card
 * @property {string} [card] - Twitter Card type
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [imageUrl] - Alternative image URL property
 * @property {string} [cardType] - Twitter card type alternative
 */

/**
 * Generates Twitter Card meta tags for enhanced tweet sharing presentation.
 *
 * Creates Twitter Card meta tags with dual name/property attributes for
 * platform compatibility. Automatically constructs absolute image URLs
 * when domain provided, includes alt text generation.
 *
 * @param {TwitterConfig} config - Configuration object for Twitter Card tags
 * @returns {string} Generated Twitter Card meta tags as HTML string
 *
 * @example
 * // Basic usage
 * twitter({
 *   title: 'My Page',
 *   description: 'Page description',
 *   imageUrl: '/image.jpg',
 *   cardType: 'summary_large_image'
 * });
 *
 * @example
 * // Edge case: with domain for absolute URLs
 * twitter({
 *   title: 'Blog Post',
 *   description: 'Detailed article',
 *   domain: 'blog.com',
 *   imageUrl: '/images/post.jpg',
 *   cardType: 'summary'
 * });
 *
 * @example
 * // Edge case: minimal configuration
 * twitter({
 *   title: 'Simple Tweet',
 *   description: 'Basic description'
 * });
 */
export const twitter = ({
	title,
	description,
	domain,
	imageUrl,
	cardType = "summary",
}) => {
	const image = imageUrl && domain ? absoluteUrl(imageUrl, domain) : imageUrl;

	const imageTags = !image
		? ""
		: html`
			<meta name="twitter:image" property="twitter:image" content="${image}" />
			<meta name="twitter:image:src" property="twitter:image:src" content="${image}">
			<meta name="twitter:image:alt" property="twitter:image:alt" content="Illustration of ${title}">
		`;

	return html`
		<meta name="twitter:card" property="twitter:card" content="${cardType}" />
		<meta name="twitter:title" property="twitter:title" content="${title}" />
		<meta name="twitter:description" property="twitter:description" content="${description}" />
		${imageTags}
	`;
};
