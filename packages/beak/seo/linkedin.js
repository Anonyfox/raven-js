import { html } from "../core/index.js";
import { absoluteUrl } from "./utils.js";

/**
 * @typedef {Object} LinkedInConfig
 * @property {string} title - The title of the page.
 * @property {string} description - The description of the page.
 * @property {string} domain - The domain of the website. Required to ensure absolute URLs.
 * @property {string} path - The relative path of the current page.
 * @property {string} [imageUrl] - Optional. The relative path of the image to be used in LinkedIn sharing.
 * @property {string} [owner] - Optional. LinkedIn profile ID of the content owner.
 * @property {string} [company] - Optional. LinkedIn company page ID.
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
