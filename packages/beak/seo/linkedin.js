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
 * import { linkedin } from '@raven-js/beak/seo';
 *
 * const tags = linkedin({
 *   title: 'My Professional Article',
 *   description: 'A detailed analysis of industry trends',
 *   domain: 'example.com',
 *   path: '/article',
 *   imageUrl: '/article-image.jpg',
 *   owner: 'linkedin.com/in/johndoe',
 *   company: 'linkedin.com/company/mycompany'
 * });
 * // Output:
 * // <meta name="linkedin:title" property="linkedin:title" content="My Professional Article" />
 * // <meta name="linkedin:description" property="linkedin:description" content="A detailed analysis of industry trends" />
 * // <meta name="linkedin:url" property="linkedin:url" content="https://example.com/article" />
 * // <meta name="linkedin:image" property="linkedin:image" content="https://example.com/article-image.jpg" />
 * // <meta name="linkedin:owner" property="linkedin:owner" content="linkedin.com/in/johndoe" />
 * // <meta name="linkedin:company" property="linkedin:company" content="linkedin.com/company/mycompany" />
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
	const url = absoluteUrl(path, domain);
	const image = imageUrl ? absoluteUrl(imageUrl, domain) : undefined;

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
