/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file URL normalization for crawling consistency.
 *
 * Handles common URL normalization traps: hash fragments, relative URLs,
 * missing protocols, case sensitivity, and query parameter ordering.
 */

/**
 * Normalize URL for consistent crawling and storage
 * @param {string | URL} url - URL string or URL object to normalize
 * @param {string | URL | null} [baseUrl] - Base URL for resolving relative URLs
 * @returns {URL} Normalized URL object
 * @throws {Error} If URL is invalid or has no domain
 */
export function normalizeUrl(url, baseUrl = null) {
	// Convert URL object to string for processing
	let urlString = url instanceof URL ? url.href : url;

	// Convert baseUrl to string if provided
	const baseUrlString = baseUrl instanceof URL ? baseUrl.href : baseUrl;

	let resolved;
	try {
		if (baseUrlString) {
			// Resolve relative URLs against base
			resolved = new URL(urlString, baseUrlString);
		} else {
			// Add http:// protocol if missing
			if (!urlString.includes("://")) {
				// Handle cases like "example.com" or "www.example.com"
				if (
					urlString.includes(".") &&
					!urlString.startsWith("/") &&
					!urlString.startsWith(".")
				) {
					urlString = `http://${urlString}`;
				}
			}
			resolved = new URL(urlString);
		}
	} catch (error) {
		const err = /** @type {any} */ (error);
		throw new Error(`Invalid URL: ${urlString} - ${err.message}`);
	}

	// Validate has domain part
	if (!resolved.hostname) {
		throw new Error(`URL must have domain: ${urlString}`);
	}

	// Apply normalizations for consistent storage

	// 1. Strip hash fragments (client-side only)
	resolved.hash = "";

	// 2. Normalize domain casing (domains are case-insensitive)
	resolved.hostname = resolved.hostname.toLowerCase();

	// 3. Strip default ports for cleaner URLs
	if (
		(resolved.protocol === "http:" && resolved.port === "80") ||
		(resolved.protocol === "https:" && resolved.port === "443")
	) {
		resolved.port = "";
	}

	// 4. Sort query parameters for consistent ordering
	if (resolved.search) {
		const params = new URLSearchParams(resolved.search);
		params.sort();
		resolved.search = params.toString();
	}

	// 5. Normalize pathname (remove double slashes, but preserve trailing slash semantics)
	if (resolved.pathname) {
		// Remove double slashes but keep single trailing slash
		resolved.pathname = resolved.pathname.replace(/\/+/g, "/");
	}

	return resolved;
}
