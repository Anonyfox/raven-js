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
 * @typedef {Object} DiscordConfig
 * @property {string} title - Page title for Discord
 * @property {string} description - Page description for Discord
 * @property {string} [image] - Image URL for Discord embed
 * @property {string} [color] - Embed color in hex format
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [imageUrl] - Alternative image URL property
 * @property {string} [invite] - Discord invite URL
 */

/**
 * Generates Discord meta tags for the HTML head section.
 *
 * Discord primarily uses Open Graph tags for link previews, but also supports
 * some Discord-specific tags for better server integration.
 *
 * @param {DiscordConfig} config - Configuration object for Discord tags
 * @returns {string} The generated Discord meta tags as an HTML string
 *
 * @example
 * // Basic usage
 * discord({
 *   title: 'Join Community',
 *   description: 'Connect with developers',
 *   domain: 'example.com',
 *   path: '/community'
 * });
 * // → '<meta name="discord:title" property="discord:title" content="Join Community" />'
 *
 * @example
 * // Edge case: with invite and image
 * discord({
 *   title: 'Game Server',
 *   description: 'Play together',
 *   imageUrl: '/banner.jpg',
 *   invite: 'abc123'
 * });
 */
export const discord = ({
	title,
	description,
	domain,
	path,
	imageUrl,
	invite,
}) => {
	const url = domain && path ? absoluteUrl(path, domain) : path;
	const image = imageUrl && domain ? absoluteUrl(imageUrl, domain) : imageUrl;

	const inviteTag = invite
		? html`<meta name="discord:invite" property="discord:invite" content="${invite}" />`
		: "";

	const imageTag = image
		? html`<meta name="discord:image" property="discord:image" content="${image}" />`
		: "";

	return html`
		<meta name="discord:title" property="discord:title" content="${title}" />
		<meta name="discord:description" property="discord:description" content="${description}" />
		<meta name="discord:url" property="discord:url" content="${url}" />
		${imageTag}
		${inviteTag}
	`;
};
