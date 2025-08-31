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
 * @typedef {Object} LinkedInConfig
 * @property {string} title - Page title for LinkedIn
 * @property {string} description - Page description for LinkedIn
 * @property {string} [image] - Image URL for LinkedIn
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [imageUrl] - Alternative image URL property
 * @property {string} [owner] - LinkedIn page owner
 * @property {string} [company] - Company name
 */

/**
 * Generates LinkedIn meta tags for the HTML head section.
 *
 * LinkedIn primarily uses Open Graph tags, but also has some LinkedIn-specific tags
 * for better integration with the platform.
 *
 * @param {LinkedInConfig} config - Configuration object for LinkedIn tags
 * @returns {string} The generated LinkedIn meta tags as an HTML string
 *
 * @example
 * // Basic usage
 * linkedin({
 *   title: 'Professional Article',
 *   description: 'Industry analysis',
 *   domain: 'example.com',
 *   path: '/article'
 * });
 * // → '<meta name="linkedin:title" property="linkedin:title" content="Professional Article" />'
 *
 * @example
 * // Edge case: with image and owner
 * linkedin({
 *   title: 'Company Update',
 *   description: 'Latest news',
 *   imageUrl: '/news.jpg',
 *   owner: 'linkedin.com/in/johndoe'
 * });
 *
 * @example
 * // Complex configuration with all options
 * linkedin({
 *   title: 'Full Article',
 *   description: 'Complete description',
 *   domain: 'site.com',
 *   path: '/post',
 *   imageUrl: '/image.jpg',
 *   owner: 'linkedin.com/in/author',
 *   company: 'linkedin.com/company/brand'
 * });
 */
export const linkedin = ({
	title,
	description,
	domain,
	path,
	imageUrl,
	owner,
	company,
}) => {
	const url = domain && path ? absoluteUrl(path, domain) : path;
	const image = imageUrl && domain ? absoluteUrl(imageUrl, domain) : imageUrl;

	const ownerTag = owner
		? html`<meta name="linkedin:owner" property="linkedin:owner" content="${owner}" />`
		: "";

	const companyTag = company
		? html`<meta name="linkedin:company" property="linkedin:company" content="${company}" />`
		: "";

	const imageTag = image
		? html`<meta name="linkedin:image" property="linkedin:image" content="${image}" />`
		: "";

	return html`
		<meta name="linkedin:title" property="linkedin:title" content="${title}" />
		<meta name="linkedin:description" property="linkedin:description" content="${description}" />
		<meta name="linkedin:url" property="linkedin:url" content="${url}" />
		${imageTag}
		${ownerTag}
		${companyTag}
	`;
};
