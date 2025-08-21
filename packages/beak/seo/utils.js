/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * Constructs an absolute URL given a relative URL and a domain.
 * import { absoluteUrl } from '@raven-js/beak/seo/utils';
 * absoluteUrl('/path', 'example.com'); // 'https://example.com/path'
 * absoluteUrl('https://other.com/path', 'example.com'); // 'https://other.com/path'
 * absoluteUrl('', 'example.com'); // 'https://example.com'
 * absoluteUrl('path', 'example.com'); // 'https://example.com/path'
 */
export const absoluteUrl = (
	/** @type {string} */ url,
	/** @type {string} */ domain,
) => {
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
