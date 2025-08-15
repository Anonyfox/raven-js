import { html } from "../core/index.js";
import { absoluteUrl } from "./utils.js";

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
 * // Output:
 * // <title>My Page | My Site</title>
 * // <meta name="description" property="description" content="This is my page description" />
 * // <link rel="canonical" href="https://example.com/my-page" />
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
