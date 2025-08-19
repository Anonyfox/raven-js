/**
 * @file Combined social media meta tag generation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../core/index.js";
import { discord } from "./discord.js";
import { linkedin } from "./linkedin.js";
import { openGraph } from "./open-graph.js";
import { pinterest } from "./pinterest.js";
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
 * @property {string} [pinterestSourceUrl] - Optional. The source URL for Pinterest rich pins.
 * @property {string} [linkedinOwner] - Optional. LinkedIn profile ID of the content owner.
 * @property {string} [linkedinCompany] - Optional. LinkedIn company page ID.
 * @property {string} [discordInvite] - Optional. Discord server invite code.
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
 * import { social } from '@raven-js/beak/seo';
 *
 * const tags = social({
 *   title: 'My Page',
 *   description: 'This is my page description',
 *   domain: 'example.com',
 *   path: '/my-page',
 *   imageUrl: '/my-image.jpg',
 *   ogType: 'article',
 *   twitterCardType: 'summary_large_image',
 *   pinterestSourceUrl: '/my-page',
 *   linkedinOwner: 'linkedin.com/in/johndoe',
 *   linkedinCompany: 'linkedin.com/company/mycompany',
 *   discordInvite: 'abc123'
 * });
 * // Output:
 * // <meta name="og:type" property="og:type" content="article">
 * // <meta name="og:title" property="og:title" content="My Page" />
 * // <meta name="og:description" property="og:description" content="This is my page description" />
 * // <meta name="og:url" property="og:url" content="https://example.com/my-page" />
 * // <meta name="og:image" property="og:image" content="https://example.com/my-image.jpg" />
 * // <meta name="twitter:card" property="twitter:card" content="summary_large_image" />
 * // <meta name="twitter:title" property="twitter:title" content="My Page" />
 * // <meta name="twitter:description" property="twitter:description" content="This is my page description" />
 * // <meta name="twitter:image" property="twitter:image" content="https://example.com/my-image.jpg" />
 * // <meta name="twitter:image:src" property="twitter:image:src" content="https://example.com/my-image.jpg">
 * // <meta name="twitter:image:alt" property="twitter:image:alt" content="Illustration of My Page">
 * // <meta name="pinterest:description" property="pinterest:description" content="This is my page description" />
 * // <meta name="pinterest:media" property="pinterest:media" content="https://example.com/my-image.jpg" />
 * // <meta name="pinterest:source" property="pinterest:source" content="https://example.com/my-page" />
 * // <meta name="linkedin:title" property="linkedin:title" content="My Page" />
 * // <meta name="linkedin:description" property="linkedin:description" content="This is my page description" />
 * // <meta name="linkedin:url" property="linkedin:url" content="https://example.com/my-page" />
 * // <meta name="linkedin:image" property="linkedin:image" content="https://example.com/my-image.jpg" />
 * // <meta name="linkedin:owner" property="linkedin:owner" content="linkedin.com/in/johndoe" />
 * // <meta name="linkedin:company" property="linkedin:company" content="linkedin.com/company/mycompany" />
 * // <meta name="discord:title" property="discord:title" content="My Page" />
 * // <meta name="discord:description" property="discord:description" content="This is my page description" />
 * // <meta name="discord:url" property="discord:url" content="https://example.com/my-page" />
 * // <meta name="discord:image" property="discord:image" content="https://example.com/my-image.jpg" />
 * // <meta name="discord:invite" property="discord:invite" content="abc123" />
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
