/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../html/index.js";
import { discord } from "./discord.js";
import { linkedin } from "./linkedin.js";
import { openGraph } from "./open-graph.js";
import { pinterest } from "./pinterest.js";
import { twitter } from "./twitter.js";

/**
 *
 */

/**
 * @typedef {Object} SocialConfig
 * @property {Object} twitter - Twitter configuration
 * @property {Object} openGraph - Open Graph configuration
 * @property {string} [image] - Default social image
 * @property {string} title - Social title (required)
 * @property {string} description - Social description (required)
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [imageUrl] - Image URL for social media
 * @property {string} [ogType] - Open Graph type
 * @property {string} [twitterCardType] - Twitter card type
 * @property {string} [pinterestSourceUrl] - Pinterest source URL
 * @property {string} [linkedinOwner] - LinkedIn owner
 * @property {string} [linkedinCompany] - LinkedIn company
 * @property {string} [discordInvite] - Discord invite URL
 */

/**
 * Generates combined social media meta tags for the HTML head section.
 *
 * This function combines Open Graph, Twitter Card, Pinterest, LinkedIn, and Discord tags
 * for maximum social media compatibility across all major platforms.
 *
 * @param {SocialConfig} config - Configuration object for social media tags
 * @returns {string} The generated social media meta tags as an HTML string
 *
 * @example
 * // Basic usage
 * social({
 *   title: 'My Page',
 *   description: 'Page description',
 *   domain: 'example.com',
 *   path: '/page'
 * });
 * // → Combined meta tags for all platforms
 *
 * @example
 * // Edge case: with image and platform specifics
 * social({
 *   title: 'Article',
 *   description: 'Content description',
 *   imageUrl: '/image.jpg',
 *   ogType: 'article',
 *   twitterCardType: 'summary_large_image'
 * });
 *
 * @example
 * // Complex configuration with all platforms
 * social({
 *   title: 'Full Page',
 *   description: 'Complete description',
 *   domain: 'site.com',
 *   path: '/post',
 *   imageUrl: '/social.jpg',
 *   ogType: 'article',
 *   twitterCardType: 'summary_large_image',
 *   linkedinOwner: 'linkedin.com/in/author',
 *   discordInvite: 'abc123'
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
	pinterestSourceUrl,
	linkedinOwner,
	linkedinCompany,
	discordInvite,
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
	const pinterestTags = pinterest({
		title,
		description,
		domain,
		imageUrl,
		sourceUrl: pinterestSourceUrl || path,
	});
	const linkedinTags = linkedin({
		title,
		description,
		domain,
		path,
		imageUrl,
		owner: linkedinOwner,
		company: linkedinCompany,
	});
	const discordTags = discord({
		title,
		description,
		domain,
		path,
		imageUrl,
		invite: discordInvite,
	});

	return html`
		${ogTags}
		${twitterTags}
		${pinterestTags}
		${linkedinTags}
		${discordTags}
	`;
};
