import { html } from "../core/index.js";

/**
 * @typedef {Object} GeneralConfig
 * @property {string} title - The title of the page. Ideal: ~65 characters. Perfect: exactly the same as your `<h1 />` text.
 * @property {string} description - The description of the page. Ideal: ~130 characters.
 * @property {string} domain - The domain of the website. Required to ensure absolute URLs.
 * @property {string} path - The relative path of the current page.
 * @property {string} [suffix] - Optional. If set, will add `| {suffix}` to titles where appropriate.
 */

/**
 * Generates general SEO meta tags for the HTML head section.
 *
 * @param {GeneralConfig} config - Configuration object for general SEO tags
 * @returns {string} The generated meta tags as an HTML string
 *
 * @example
 * import { general } from '@raven-js/beak/seo';
 *
 * const tags = general({
 *   title: 'My Page',
 *   description: 'This is my page description',
 *   domain: 'example.com',
 *   path: '/my-page',
 *   suffix: 'My Site'
 * });
 */
export const general = ({ title, description, domain, path, suffix }) => {
	const fullTitle = suffix ? `${title} | ${suffix}` : title;
	const url = absoluteUrl(path, domain);

	return html`
		<title>${fullTitle}</title>
		<meta name="description" property="description" content="${description}" />
		<link rel="canonical" href="${url}" />
	`;
};

/**
 * Helper: Constructs an absolute URL given a relative URL and a domain.
 *
 * @param {string} url - The relative or absolute URL.
 * @param {string} domain - The domain to prepend if the URL is relative.
 * @returns {string} The absolute URL.
 */
const absoluteUrl = (url, domain) => {
	if (url.startsWith("http")) {
		return url;
	}
	return `https://${domain}${url}`;
};
