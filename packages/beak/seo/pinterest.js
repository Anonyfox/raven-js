/**
 * @file Pinterest-specific social media meta tags
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../core/index.js";
import { absoluteUrl } from "./utils.js";

/**
 * @typedef {Object} PinterestConfig
 * @property {string} description - The description for rich pins.
 * @property {string} domain - The domain of the website. Required to ensure absolute URLs.
 * @property {string} [imageUrl] - Optional. The relative path of the image to be used in rich pins.
 * @property {string} [sourceUrl] - Optional. The source URL for rich pins (usually the same as the page URL).
 */

/**
 * Generates Pinterest meta tags for the HTML head section.
 *
 * Pinterest uses Open Graph tags as a fallback, but also has its own specific tags
 * for rich pins and better Pinterest integration.
 *
 * @param {PinterestConfig} config - Configuration object for Pinterest tags
 * @returns {string} The generated Pinterest meta tags as an HTML string
 *
 * @example
 * import { pinterest } from '@raven-js/beak/seo';
 *
 * const tags = pinterest({
 *   description: 'Check out this amazing content!',
 *   domain: 'example.com',
 *   imageUrl: '/my-image.jpg',
 *   sourceUrl: '/my-page'
 * });
 * // Output:
 * // <meta name="pinterest:description" property="pinterest:description" content="Check out this amazing content!" />
 * // <meta name="pinterest:media" property="pinterest:media" content="https://example.com/my-image.jpg" />
 * // <meta name="pinterest:source" property="pinterest:source" content="https://example.com/my-page" />
 */
export const pinterest = ({ description, domain, imageUrl, sourceUrl }) => {
	const image = imageUrl ? absoluteUrl(imageUrl, domain) : undefined;
	const source = sourceUrl ? absoluteUrl(sourceUrl, domain) : undefined;

	const imageTag = image
		? html`<meta name="pinterest:media" property="pinterest:media" content="${image}" />`
		: "";

	const sourceTag = source
		? html`<meta name="pinterest:source" property="pinterest:source" content="${source}" />`
		: "";

	return html`
		<meta name="pinterest:description" property="pinterest:description" content="${description}" />
		${imageTag}
		${sourceTag}
	`;
};
