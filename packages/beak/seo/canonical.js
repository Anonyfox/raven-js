import { html } from "../core/index.js";
import { absoluteUrl } from "./utils.js";

/**
 * @typedef {Object} CanonicalConfig
 * @property {string} domain - The domain of the website. Required to ensure absolute URLs.
 * @property {string} path - The relative path of the current page.
 * @property {string} [hreflang] - Optional. Language/locale for hreflang attribute.
 * @property {string} [media] - Optional. Media type for responsive canonical URLs.
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
 *
 * // Canonical with hreflang
 * const hreflangTags = canonical({
 *   domain: 'example.com',
 *   path: '/my-page',
 *   hreflang: 'en-US'
 * });
 *
 * // Canonical for mobile
 * const mobileTags = canonical({
 *   domain: 'example.com',
 *   path: '/my-page',
 *   media: 'only screen and (max-width: 640px)'
 * });
 */
export const canonical = ({ domain, path, hreflang, media }) => {
	const url = absoluteUrl(path, domain);
	const hreflangAttr = hreflang ? ` hreflang="${hreflang}"` : "";
	const mediaAttr = media ? ` media="${media}"` : "";

	return html`
		<link rel="canonical" href="${url}"${hreflangAttr}${mediaAttr} />
	`;
};
