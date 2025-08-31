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
 * @typedef {Object} CanonicalConfig
 * @property {string} url - Canonical URL for the page
 * @property {boolean} [hreflang] - Whether to include hreflang attributes
 * @property {string} domain - Domain for URL construction (required)
 * @property {string} path - Path for URL construction (required)
 * @property {string} [media] - Media query for canonical link
 */

/**
 * Generates canonical URL links to prevent duplicate content penalties.
 *
 * Creates canonical link tags to indicate the preferred URL version for search engines.
 * Prevents SEO penalties from duplicate content across multiple URL variations.
 * Optional support for hreflang and media attributes.
 *
 * @param {CanonicalConfig} config - Configuration object for canonical tags
 * @returns {string} Generated canonical link tags as HTML string
 *
 * @example
 * // Basic usage
 * canonical({ domain: 'example.com', path: '/my-page' });
 * // → '<link rel="canonical" href="https://example.com/my-page" />'
 *
 * @example
 * // Edge case: with hreflang attribute
 * canonical({ domain: 'example.com', path: '/page', hreflang: 'en-US' });
 *
 * @example
 * // Edge case: with media query
 * canonical({ domain: 'example.com', path: '/mobile', media: 'screen and (max-width: 640px)' });
 */
export const canonical = ({ domain, path, hreflang, media }) => {
	const url = absoluteUrl(path, domain);
	const hreflangAttr = hreflang ? ` hreflang="${hreflang}"` : "";
	const mediaAttr = media ? ` media="${media}"` : "";

	return html`
		<link rel="canonical" href="${url}"${hreflangAttr}${mediaAttr} />
	`;
};
