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
 * Generates Twitter Card meta tags for the HTML head section.
 *
 * Since various social media platforms parse these tags differently,
 * every tag uses both `name` and `property` attributes for maximum compatibility.
 *
 * @param {TwitterConfig} config - Configuration object for Twitter Card tags
 * @returns {string} The generated Twitter Card meta tags as an HTML string
 *
 * @example
 * import { twitter } from '@raven-js/beak/seo';
 *
 * const tags = twitter({
 *   title: 'My Page',
 *   description: 'This is my page description',
 *   imageUrl: '/my-image.jpg',
 *   cardType: 'summary_large_image'
 * });
 * // Output:
 * // <meta name="twitter:card" property="twitter:card" content="summary_large_image" />
 * // <meta name="twitter:title" property="twitter:title" content="My Page" />
 * // <meta name="twitter:description" property="twitter:description" content="This is my page description" />
 * // <meta name="twitter:image" property="twitter:image" content="https://example.com/my-image.jpg" />
 * // <meta name="twitter:image:src" property="twitter:image:src" content="https://example.com/my-image.jpg">
 * // <meta name="twitter:image:alt" property="twitter:image:alt" content="Illustration of My Page">
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
