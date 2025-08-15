import { html } from "../core/index.js";
import { absoluteUrl } from "./utils.js";

/**
 * @typedef {Object} DiscordConfig
 * @property {string} title - The title of the page.
 * @property {string} description - The description of the page.
 * @property {string} domain - The domain of the website. Required to ensure absolute URLs.
 * @property {string} path - The relative path of the current page.
 * @property {string} [imageUrl] - Optional. The relative path of the image to be used in Discord embeds.
 * @property {string} [invite] - Optional. Discord server invite code (e.g., "abc123" for discord.gg/abc123).
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
 * import { discord } from '@raven-js/beak/seo';
 *
 * const tags = discord({
 *   title: 'Join Our Community',
 *   description: 'Connect with like-minded developers',
 *   domain: 'example.com',
 *   path: '/community',
 *   imageUrl: '/discord-banner.jpg',
 *   invite: 'abc123'
 * });
 * // Output:
 * // <meta name="discord:title" property="discord:title" content="Join Our Community" />
 * // <meta name="discord:description" property="discord:description" content="Connect with like-minded developers" />
 * // <meta name="discord:url" property="discord:url" content="https://example.com/community" />
 * // <meta name="discord:image" property="discord:image" content="https://example.com/discord-banner.jpg" />
 * // <meta name="discord:invite" property="discord:invite" content="abc123" />
 */
export const discord = ({
	title,
	description,
	domain,
	path,
	imageUrl,
	invite,
}) => {
	const url = absoluteUrl(path, domain);
	const image = imageUrl ? absoluteUrl(imageUrl, domain) : undefined;

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
