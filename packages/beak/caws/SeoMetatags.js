import { html } from "../core/index.js";

/**
 * Generates meta tags for the HTML head section.
 *
 * Includes common best-practices for general SeoMetatags as well as Open Graph and
 * Twitter card markup. Focuses on page-specific content, not general elements you'd
 * put directly in the website-wide layout.
 *
 * An image is optional but strongly recommended, as it adds significant value.
 *
 * @param {Object} params - The parameters for the meta tags.
 * @param {string} params.title - The title of the page. Ideal: ~65 characters. Perfect: exactly the same as your `<h1 />` text.
 * @param {string} [params.suffix] - Optional. If set, will add `| {suffix}` to titles where appropriate.
 * @param {string} params.description - The description of the page. Ideal: ~130 characters.
 * @param {string} params.domain - The domain of the website. Required to ensure absolute URLs.
 * @param {string} params.path - The relative path of the current page.
 * @param {string} [params.imageUrl] - Optional. The relative path of the image to be used in social sharing.
 * @returns {string} The generated meta tags as an HTML string.
 *
 * **Note**: the tags have `property` *and* `name` attributes to ensure
 * compatibility with various social media platforms and crawlers out there.
 *
 * @example
 * import { SeoMetatags } from '@raven-js/beak/caws';
 *
 * const metaTags = SeoMetatags({
 *   title: 'Test Page',
 *   suffix: 'Test Suffix',
 *   description: 'This is a test description.',
 *   domain: 'example.com',
 *   path: '/test-path',
 *   imageUrl: '/test-image.png'
 * });
 *
 * // Result:
 * // <title>Test Page | Test Suffix</title>
 * // <meta name="description" property="description" content="This is a test description." />
 * // <link rel="canonical" href="https://example.com/test-path" />
 * // <meta name="og:type" property="og:type" content="website">
 * // <meta name="og:title" property="og:title" content="Test Page" />
 * // <meta name="og:description" property="og:description" content="This is a test description." />
 * // <meta name="og:url" property="og:url" content="https://example.com/test-path" />
 * // <meta name="og:image" property="og:image" content="https://example.com/test-image.png" />
 * // <meta name="twitter:card" property="twitter:card" content="summary_large_image" />
 * // <meta name="twitter:title" property="twitter:title" content="Test Page" />
 * // <meta name="twitter:description" property="twitter:description" content="This is a test description." />
 * // <meta name="twitter:image" property="twitter:image" content="https://example.com/test-image.png" />
 */
export const SeoMetatags = ({
	title,
	suffix,
	description,
	domain,
	path,
	imageUrl,
}) => {
	const url = absoluteUrl(path, domain);
	const image = imageUrl ? absoluteUrl(imageUrl, domain) : undefined;
	return html`
    ${SeoMetatagsGeneral(suffix ? `${title} | ${suffix}` : title, description, url)}
    ${SeoMetatagsOpengraph(title, description, url, image)}
    ${SeoMetatagsTwittercard(title, description, image)}
  `;
};

/**
 * Generates general meta tags for the HTML head section.
 *
 * @param {string} title - The title of the page.
 * @param {string} description - The description of the page.
 * @param {string} url - The absolute (!) canonical URL of the page.
 * @returns {string} The generated meta tags as an HTML string.
 */
const SeoMetatagsGeneral = (title, description, url) => html`
  <title>${title}</title>
  <meta name="description" property="description" content="${description}" />
  <link rel="canonical" href="${url}" />
`;

/**
 * Generates Open Graph meta tags for the HTML head section.
 *
 * If the image doesn't show up on platforms properly, in most cases because of
 * the image url not being a correct absolute one.
 *
 * Since various social media platforms parse the these SeoMetatags (and not identically),
 * plus lots of private crawlers, every single tag uses *both*: `name` and `property`.
 *
 * @param {string} title - The title of the page.
 * @param {string} description - The description of the page.
 * @param {string} url - The absolute (!) URL of the page.
 * @param {string} [imageUrl] - The optional absolute (!) URL of the image to be used in social sharing.
 * @returns {string} The generated Open Graph meta tags as an HTML string.
 */
const SeoMetatagsOpengraph = (title, description, url, imageUrl) => html`
  <meta name="og:type" property="og:type" content="website">
  <meta name="og:title" property="og:title" content="${title}" />
  <meta name="og:description" property="og:description" content="${description}" />
  <meta name="og:url" property="og:url" content="${url}" />
  ${imageUrl ? html`<meta name="og:image" property="og:image" content="${imageUrl}" />` : ""}
`;

/**
 * Generates Twitter Card meta tags for the HTML head section.
 *
 * If the image doesn't show up on platforms properly, in most cases because of
 * the image url not being a correct absolute one.
 *
 * Since various social media platforms parse the these SeoMetatags (and not identically),
 * plus lots of private crawlers, every single tag uses *both*: `name` and `property`.
 *
 * @param {string} title - The title of the page.
 * @param {string} description - The description of the page.
 * @param {string} [imageUrl] - The optional absolute (!) URL of the image to be used in the Twitter card.
 * @returns {string} The generated Twitter Card meta tags as an HTML string.
 */
const SeoMetatagsTwittercard = (title, description, imageUrl) => {
	const imageTags = !imageUrl
		? ""
		: html`
  <meta name="twitter:image" property="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:src" property="twitter:image:src" content="${imageUrl}">
  <meta name="twitter:image:alt" property="twitter:image:alt" content="Illustration of ${title}">
  `;

	return html`
  <meta name="twitter:card" property="twitter:card" content="summary" />
  <meta name="twitter:title" property="twitter:title" content="${title}" />
  <meta name="twitter:description" property="twitter:description" content="${description}" />
  ${imageTags}
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
