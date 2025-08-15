import { html } from "../core/index.js";
import { openGraph } from "./open-graph.js";
import { twitter } from "./twitter.js";

/**
 * @typedef {Object} SocialConfig
 * @property {string} title - The title of the page.
 * @property {string} description - The description of the page.
 * @property {string} domain - The domain of the website. Required to ensure absolute URLs.
 * @property {string} path - The relative path of the current page.
 * @property {string} [imageUrl] - Optional. The relative path of the image to be used in social sharing.
 * @property {string} [ogType] - Optional. The Open Graph type. Defaults to "website".
 * @property {string} [twitterCardType] - Optional. The Twitter card type. Defaults to "summary".
 */

/**
 * Generates combined social media meta tags (Open Graph + Twitter Card) for the HTML head section.
 *
 * This function combines Open Graph and Twitter Card tags for maximum social media compatibility.
 *
 * @param {SocialConfig} config - Configuration object for social media tags
 * @returns {string} The generated social media meta tags as an HTML string
 *
 * @example
 * import { social } from '@raven-js/beak/seo';
 *
 * const tags = social({
 *   title: 'My Page',
 *   description: 'This is my page description',
 *   domain: 'example.com',
 *   path: '/my-page',
 *   imageUrl: '/my-image.jpg',
 *   ogType: 'article',
 *   twitterCardType: 'summary_large_image'
 * });
 */
export const social = ({
	title,
	description,
	domain,
	path,
	imageUrl,
	ogType,
	twitterCardType,
}) => {
	const ogTags = openGraph({
		title,
		description,
		domain,
		path,
		imageUrl,
		type: ogType,
	});
	const twitterTags = twitter({
		title,
		description,
		domain,
		imageUrl,
		cardType: twitterCardType,
	});

	return html`
		${ogTags}
		${twitterTags}
	`;
};
