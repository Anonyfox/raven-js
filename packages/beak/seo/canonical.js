/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../core/index.js";
import { absoluteUrl } from "./utils.js";

/**
 * @packageDocumentation
 *
 */

/**
 * @typedef {Object} CanonicalConfig
 * @property {string} url - Canonical URL for the page
 * @property {boolean} [hreflang] - Whether to include hreflang attributes
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [media] - Media query for canonical link
 */

/**
 * Generates canonical URL meta tags for the HTML head section.
 *
 * Canonical URLs help prevent duplicate content issues by telling search engines
 * which URL is the "official" version of a page. Also supports hreflang for
 * international SEO.
 *
 * @param {CanonicalConfig} config - Configuration object for canonical tags
 * @returns {string} The generated canonical meta tags as an HTML string
 *
 * @example
 * import { canonical } from '@raven-js/beak/seo';
 *
 * // Basic canonical URL
 * const tags = canonical({
 *   domain: 'example.com',
 *   path: '/my-page'
 * });
 * // Output:
 * // <link rel="canonical" href="https://example.com/my-page" />
 *
 * // Canonical with hreflang
 * const hreflangTags = canonical({
 *   domain: 'example.com',
 *   path: '/my-page',
 *   hreflang: 'en-US'
 * });
 * // Output:
 * // <link rel="canonical" href="https://example.com/my-page" hreflang="en-US" />
 *
 * // Canonical for mobile
 * const mobileTags = canonical({
 *   domain: 'example.com',
 *   path: '/my-page',
 *   media: 'only screen and (max-width: 640px)'
 * });
 * // Output:
 * // <link rel="canonical" href="https://example.com/my-page" media="only screen and (max-width: 640px)" />
 */
export const canonical = ({ domain, path, hreflang, media }) => {
	const url = absoluteUrl(path, domain);
	const hreflangAttr = hreflang ? ` hreflang="${hreflang}"` : "";
	const mediaAttr = media ? ` media="${media}"` : "";

	return html`
		<link rel="canonical" href="${url}"${hreflangAttr}${mediaAttr} />
	`;
};
