/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTML URL extraction with comprehensive pattern matching.
 *
 * Extracts URLs from HTML content using specialized regex patterns for different
 * HTML elements and attributes. All URLs are normalized against a base URL.
 */

import { normalizeUrl } from "../normalize-url.js";

/**
 * Safely normalize URL with error handling
 * @param {string} urlString - URL string to normalize
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {URL | null} Normalized URL or null if invalid
 */
export function safeNormalizeUrl(urlString, baseUrl) {
	try {
		// Skip empty URLs and special schemes
		if (
			!urlString ||
			urlString.trim() === "" ||
			urlString.startsWith("data:") ||
			urlString.startsWith("javascript:") ||
			urlString.startsWith("mailto:") ||
			urlString.startsWith("tel:") ||
			urlString === "#" ||
			urlString.startsWith("#")
		) {
			return null;
		}

		return normalizeUrl(urlString, baseUrl);
	} catch {
		return null;
	}
}

/**
 * Extract URLs using regex pattern with attribute matching
 * @param {string} htmlString - HTML content to search
 * @param {RegExp} regex - Regex pattern to match
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of normalized URLs
 */
export function extractUrlsFromPattern(htmlString, regex, baseUrl) {
	const urls = new Set();
	let match;

	match = regex.exec(htmlString);
	while (match !== null) {
		// Support multiple capture groups - find first non-empty one
		const urlString = match[1] || match[2] || match[3];
		if (urlString) {
			const normalizedUrl = safeNormalizeUrl(urlString.trim(), baseUrl);
			if (normalizedUrl) {
				urls.add(normalizedUrl);
			}
		}
		match = regex.exec(htmlString);
	}

	return urls;
}

/**
 * Extract URLs from anchor tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from href attributes
 */
export function extractLinkUrls(htmlString, baseUrl) {
	// Match <a href="url"> with various quote styles
	const regex = /<a[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	return extractUrlsFromPattern(htmlString, regex, baseUrl);
}

/**
 * Extract URLs from image tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from src attributes
 */
export function extractImageUrls(htmlString, baseUrl) {
	// Match <img src="url"> with various quote styles
	const regex = /<img[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	return extractUrlsFromPattern(htmlString, regex, baseUrl);
}

/**
 * Extract URLs from script tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from src attributes
 */
export function extractScriptUrls(htmlString, baseUrl) {
	// Match <script src="url"> with various quote styles
	const regex = /<script[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	return extractUrlsFromPattern(htmlString, regex, baseUrl);
}

/**
 * Extract URLs from stylesheet link tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from href attributes
 */
export function extractStylesheetUrls(htmlString, baseUrl) {
	// Match <link href="url"> - includes stylesheets, icons, etc.
	const regex = /<link[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	return extractUrlsFromPattern(htmlString, regex, baseUrl);
}

/**
 * Extract URLs from iframe tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from src attributes
 */
export function extractIframeUrls(htmlString, baseUrl) {
	// Match <iframe src="url"> with various quote styles
	const regex = /<iframe[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	return extractUrlsFromPattern(htmlString, regex, baseUrl);
}

/**
 * Extract URLs from media elements
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from media src attributes
 */
export function extractMediaUrls(htmlString, baseUrl) {
	const urls = new Set();

	// Video and audio src attributes
	const mediaSrcRegex =
		/<(?:video|audio)[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	const mediaSrcUrls = extractUrlsFromPattern(
		htmlString,
		mediaSrcRegex,
		baseUrl,
	);

	// Source elements within video/audio
	const sourceRegex =
		/<source[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	const sourceUrls = extractUrlsFromPattern(htmlString, sourceRegex, baseUrl);

	// Track elements
	const trackRegex = /<track[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	const trackUrls = extractUrlsFromPattern(htmlString, trackRegex, baseUrl);

	// Union all media URLs using href strings for deduplication
	const allHrefs = new Set();
	for (const url of mediaSrcUrls) allHrefs.add(url.href);
	for (const url of sourceUrls) allHrefs.add(url.href);
	for (const url of trackUrls) allHrefs.add(url.href);

	// Convert back to URL objects
	for (const href of allHrefs) {
		urls.add(new URL(href));
	}

	return urls;
}

/**
 * Extract URLs from embed and object tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from embed/object attributes
 */
export function extractEmbedUrls(htmlString, baseUrl) {
	const urls = new Set();

	// Embed src
	const embedRegex = /<embed[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	const embedUrls = extractUrlsFromPattern(htmlString, embedRegex, baseUrl);

	// Object data
	const objectRegex =
		/<object[^>]+data\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi;
	const objectUrls = extractUrlsFromPattern(htmlString, objectRegex, baseUrl);

	// Union embed URLs using href strings for deduplication
	const allHrefs = new Set();
	for (const url of embedUrls) allHrefs.add(url.href);
	for (const url of objectUrls) allHrefs.add(url.href);

	// Convert back to URL objects
	for (const href of allHrefs) {
		urls.add(new URL(href));
	}

	return urls;
}

/**
 * Extract URLs from CSS content (style tags and inline styles)
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from CSS url() functions
 */
export function extractCssUrls(htmlString, baseUrl) {
	const urls = new Set();

	// Extract content from <style> tags
	const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
	let styleMatch;

	styleMatch = styleRegex.exec(htmlString);
	while (styleMatch !== null) {
		const cssContent = styleMatch[1];
		if (cssContent) {
			const cssUrls = extractCssUrlsFromContent(cssContent, baseUrl);
			for (const url of cssUrls) urls.add(url);
		}
		styleMatch = styleRegex.exec(htmlString);
	}

	// Extract from inline style attributes
	const inlineStyleRegex = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
	let inlineMatch;

	inlineMatch = inlineStyleRegex.exec(htmlString);
	while (inlineMatch !== null) {
		const styleContent = inlineMatch[1] || inlineMatch[2];
		if (styleContent) {
			const cssUrls = extractCssUrlsFromContent(styleContent, baseUrl);
			for (const url of cssUrls) urls.add(url);
		}
		inlineMatch = inlineStyleRegex.exec(htmlString);
	}

	return urls;
}

/**
 * Extract URLs from CSS content using url() function patterns
 * @param {string} cssContent - CSS content to search
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from CSS url() functions
 */
function extractCssUrlsFromContent(cssContent, baseUrl) {
	// Match url("..."), url('...'), and url(...) patterns
	const urlRegex = /url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]+))\s*\)/gi;
	return extractUrlsFromPattern(cssContent, urlRegex, baseUrl);
}

/**
 * Extract URLs from meta refresh tags
 * @param {string} htmlString - HTML content
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of URLs from meta refresh redirects
 */
export function extractMetaUrls(htmlString, baseUrl) {
	const urls = new Set();

	// Match <meta http-equiv="refresh" content="delay;url=...">
	const metaRegex =
		/<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]+content\s*=\s*["']([^"']*)["']/gi;
	let match;

	match = metaRegex.exec(htmlString);
	while (match !== null) {
		const content = match[1];
		if (content) {
			// Extract URL from content="5;url=https://example.com"
			const urlMatch = /url\s*=\s*(.+)/i.exec(content);
			if (urlMatch?.[1]) {
				const urlString = urlMatch[1].trim();
				const normalizedUrl = safeNormalizeUrl(urlString, baseUrl);
				if (normalizedUrl) {
					urls.add(normalizedUrl);
				}
			}
		}
		match = metaRegex.exec(htmlString);
	}

	return urls;
}

/**
 * Extract all URLs from HTML content
 * @param {string} htmlString - HTML content to search
 * @param {string | URL | null} baseUrl - Base URL for resolution
 * @returns {Set<URL>} Set of all discovered URLs
 */
export function extractUrlsFromHtml(htmlString, baseUrl) {
	// Use href strings for deduplication, then convert to URL objects
	const allHrefs = new Set();

	// Extract from all sources
	const extractors = [
		extractLinkUrls,
		extractImageUrls,
		extractScriptUrls,
		extractStylesheetUrls,
		extractIframeUrls,
		extractMediaUrls,
		extractEmbedUrls,
		extractCssUrls,
		extractMetaUrls,
	];

	for (const extractor of extractors) {
		const urls = extractor(htmlString, baseUrl);
		for (const url of urls) {
			allHrefs.add(url.href);
		}
	}

	// Convert back to URL objects
	const allUrls = new Set();
	for (const href of allHrefs) {
		allUrls.add(new URL(href));
	}

	return allUrls;
}
