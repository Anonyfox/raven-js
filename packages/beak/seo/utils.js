/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Constructs absolute HTTPS URLs from relative paths and domain names.
 *
 * @param {string} url - URL path or full URL to process
 * @param {string} domain - Domain name without protocol
 * @returns {string} Absolute HTTPS URL
 */
export const absoluteUrl = (
	/** @type {string} */ url,
	/** @type {string} */ domain,
) => {
	if (url?.startsWith("http")) {
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
