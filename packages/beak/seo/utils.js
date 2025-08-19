/**
 * @file URL utility functions for SEO meta tag generation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Constructs an absolute URL given a relative URL and a domain.
 *
 * @param {string} url - The relative or absolute URL.
 * @param {string} domain - The domain to prepend if the URL is relative.
 * @returns {string} The absolute URL.
 *
 * @example
 * import { absoluteUrl } from '@raven-js/beak/seo/utils';
 *
 * absoluteUrl('/path', 'example.com'); // 'https://example.com/path'
 * absoluteUrl('https://other.com/path', 'example.com'); // 'https://other.com/path'
 * absoluteUrl('', 'example.com'); // 'https://example.com'
 * absoluteUrl('path', 'example.com'); // 'https://example.com/path'
 */
export const absoluteUrl = (url, domain) => {
	if (url.startsWith("http")) {
		return url;
	}
	// Handle empty paths
	if (!url) {
		return `https://${domain}`;
	}
	// Ensure there's a slash between domain and path
	const separator = url.startsWith("/") ? "" : "/";
	return `https://${domain}${separator}${url}`;
};
