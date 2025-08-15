import { html } from "../core/index.js";

/**
 * @typedef {Object} RobotsConfig
 * @property {boolean} [index] - Optional. Whether search engines should index this page. Defaults to true.
 * @property {boolean} [follow] - Optional. Whether search engines should follow links on this page. Defaults to true.
 */

/**
 * Generates robots meta tags for the HTML head section.
 *
 * Controls how search engines crawl and index your pages.
 * Supports both traditional robots directives and modern Google-specific directives.
 *
 * @param {RobotsConfig} config - Configuration object for robots tags
 * @returns {string} The generated robots meta tags as an HTML string
 *
 * @example
 * import { robots } from '@raven-js/beak/seo';
 *
 * // Basic robots tag
 * const tags = robots({
 *   index: true,
 *   follow: true
 * });
 * // Output:
 * // <meta name="robots" content="index, follow" />
 *
 * // Prevent indexing
 * const noIndexTags = robots({
 *   index: false,
 *   follow: false
 * });
 * // Output:
 * // <meta name="robots" content="noindex, nofollow" />
 */
export const robots = ({ index = true, follow = true }) => {
	const indexValue = index ? "index" : "noindex";
	const followValue = follow ? "follow" : "nofollow";
	const directives = [indexValue, followValue].join(", ");

	return html`<meta name="robots" content="${directives}" />`;
};
