/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../html/index.js";

/**
 * @typedef {Object} RobotsConfig
 * @property {string|boolean} [index] - Index directive (index/noindex)
 * @property {string|boolean} [follow] - Follow directive (follow/nofollow)
 * @property {string} [archive] - Archive directive
 * @property {string} [snippet] - Snippet directive
 */

/**
 * Generates robots meta tags for search engine crawling control.
 *
 * Controls search engine indexing and link following behavior through
 * standard robots directives. Essential for SEO content management
 * and preventing unwanted page indexing.
 *
 * @param {RobotsConfig} config - Configuration object for robots tags
 * @returns {string} Generated robots meta tags as HTML string
 *
 * @example
 * // Basic usage
 * robots({ index: true, follow: true });
 * // → '<meta name="robots" content="index, follow" />'
 *
 * @example
 * // Edge case: block indexing and following
 * robots({ index: false, follow: false });
 * // → '<meta name="robots" content="noindex, nofollow" />'
 *
 * @example
 * // Edge case: default behavior
 * robots({});
 * // → '<meta name="robots" content="index, follow" />'
 */
export const robots = ({ index = true, follow = true }) => {
	const indexValue = index ? "index" : "noindex";
	const followValue = follow ? "follow" : "nofollow";
	const directives = [indexValue, followValue].join(", ");

	return html`<meta name="robots" content="${directives}" />`;
};
