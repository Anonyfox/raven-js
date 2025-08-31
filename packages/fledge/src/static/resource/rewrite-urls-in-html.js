/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTML URL rewriting with basePath support.
 *
 * Rewrites internal URLs in HTML content to include a basePath prefix for
 * static site deployment to subdirectories. Uses shared patterns from url-patterns.js
 * to ensure consistency with URL extraction logic.
 */

import { URL_PATTERNS } from "./url-patterns.js";

/**
 * Check if URL should be rewritten (internal to same origin)
 * @param {string} urlString - URL string to check
 * @param {string | URL} currentUrl - Current page URL for context
 * @returns {boolean} True if URL should be rewritten
 */
export function shouldRewriteUrl(urlString, currentUrl) {
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
			return false;
		}

		// For rewriting, we need to preserve query params and hash, so use native URL
		// instead of normalizeUrl which strips them
		const url = new URL(urlString, currentUrl);
		const current = new URL(currentUrl);

		// Only rewrite URLs from same origin (internal URLs)
		return url.origin === current.origin;
	} catch {
		// If URL parsing fails, don't rewrite
		return false;
	}
}

/**
 * Apply basePath to internal URL
 * @param {string} urlString - Original URL string
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend (e.g., "/my-app")
 * @returns {string} Rewritten URL with basePath
 */
export function applyBasePath(urlString, currentUrl, basePath) {
	try {
		// Use native URL to preserve query params and hash (unlike normalizeUrl)
		const url = new URL(urlString, currentUrl);

		// Ensure basePath starts with / and doesn't end with /
		const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
		const normalizedBasePath = cleanBasePath.endsWith("/")
			? cleanBasePath.slice(0, -1)
			: cleanBasePath;

		// If basePath is just "/", don't modify the URL
		if (normalizedBasePath === "") {
			return url.pathname + url.search + url.hash;
		}

		// Prepend basePath to pathname
		const newPathname = normalizedBasePath + url.pathname;

		// Return full relative URL with preserved query params and hash
		return newPathname + url.search + url.hash;
	} catch {
		// If rewriting fails, return original URL
		return urlString;
	}
}

/**
 * Rewrite URLs in HTML using a specific pattern
 * @param {string} htmlString - HTML content to process
 * @param {import("./url-patterns.js").UrlPattern} pattern - URL pattern to use
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten URLs
 */
export function rewriteUrlsInPattern(
	htmlString,
	pattern,
	currentUrl,
	basePath,
) {
	const regex = pattern.getRegex();

	return htmlString.replace(regex, (fullMatch, ...groups) => {
		// Extract the URL using the pattern's logic
		const mockMatch = /** @type {RegExpMatchArray} */ ([fullMatch, ...groups]);
		const originalUrl = pattern.extractUrlFromMatch(mockMatch);

		if (!originalUrl || !shouldRewriteUrl(originalUrl, currentUrl)) {
			return fullMatch; // Return unchanged
		}

		// Apply basePath transformation
		const rewrittenUrl = applyBasePath(originalUrl, currentUrl, basePath);

		// Replace the original URL in the match with the rewritten one
		return fullMatch.replace(originalUrl, rewrittenUrl);
	});
}

/**
 * Rewrite URLs in anchor tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten anchor URLs
 */
export function rewriteLinkUrls(htmlString, currentUrl, basePath) {
	return rewriteUrlsInPattern(
		htmlString,
		URL_PATTERNS.LINKS,
		currentUrl,
		basePath,
	);
}

/**
 * Rewrite URLs in image tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten image URLs
 */
export function rewriteImageUrls(htmlString, currentUrl, basePath) {
	return rewriteUrlsInPattern(
		htmlString,
		URL_PATTERNS.IMAGES,
		currentUrl,
		basePath,
	);
}

/**
 * Rewrite URLs in script tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten script URLs
 */
export function rewriteScriptUrls(htmlString, currentUrl, basePath) {
	return rewriteUrlsInPattern(
		htmlString,
		URL_PATTERNS.SCRIPTS,
		currentUrl,
		basePath,
	);
}

/**
 * Rewrite URLs in stylesheet link tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten stylesheet URLs
 */
export function rewriteStylesheetUrls(htmlString, currentUrl, basePath) {
	return rewriteUrlsInPattern(
		htmlString,
		URL_PATTERNS.STYLESHEETS,
		currentUrl,
		basePath,
	);
}

/**
 * Rewrite URLs in iframe tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten iframe URLs
 */
export function rewriteIframeUrls(htmlString, currentUrl, basePath) {
	return rewriteUrlsInPattern(
		htmlString,
		URL_PATTERNS.IFRAMES,
		currentUrl,
		basePath,
	);
}

/**
 * Rewrite URLs in media elements (video, audio, source, track)
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten media URLs
 */
export function rewriteMediaUrls(htmlString, currentUrl, basePath) {
	let rewritten = htmlString;

	// Apply each media pattern
	rewritten = rewriteUrlsInPattern(
		rewritten,
		URL_PATTERNS.MEDIA_SRC,
		currentUrl,
		basePath,
	);
	rewritten = rewriteUrlsInPattern(
		rewritten,
		URL_PATTERNS.SOURCE,
		currentUrl,
		basePath,
	);
	rewritten = rewriteUrlsInPattern(
		rewritten,
		URL_PATTERNS.TRACK,
		currentUrl,
		basePath,
	);

	return rewritten;
}

/**
 * Rewrite URLs in embed and object tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten embed/object URLs
 */
export function rewriteEmbedUrls(htmlString, currentUrl, basePath) {
	let rewritten = htmlString;

	// Apply each embed pattern
	rewritten = rewriteUrlsInPattern(
		rewritten,
		URL_PATTERNS.EMBED,
		currentUrl,
		basePath,
	);
	rewritten = rewriteUrlsInPattern(
		rewritten,
		URL_PATTERNS.OBJECT,
		currentUrl,
		basePath,
	);

	return rewritten;
}

/**
 * Rewrite URLs in CSS content (style tags and inline styles)
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten CSS URLs
 */
export function rewriteCssUrls(htmlString, currentUrl, basePath) {
	let rewritten = htmlString;

	// Rewrite URLs in <style> tags content
	const styleRegex = URL_PATTERNS.STYLE_TAGS.getRegex();
	rewritten = rewritten.replace(styleRegex, (fullMatch, cssContent) => {
		if (!cssContent) return fullMatch;

		// Rewrite CSS url() functions in the style content
		const rewrittenCss = rewriteUrlsInPattern(
			cssContent,
			URL_PATTERNS.CSS_URLS,
			currentUrl,
			basePath,
		);
		return fullMatch.replace(cssContent, rewrittenCss);
	});

	// Rewrite URLs in inline style attributes
	const inlineStyleRegex = URL_PATTERNS.INLINE_STYLES.getRegex();
	rewritten = rewritten.replace(
		inlineStyleRegex,
		(fullMatch, styleContent1, styleContent2) => {
			const styleContent = styleContent1 || styleContent2;
			if (!styleContent) return fullMatch;

			// Rewrite CSS url() functions in the inline style
			const rewrittenCss = rewriteUrlsInPattern(
				styleContent,
				URL_PATTERNS.CSS_URLS,
				currentUrl,
				basePath,
			);
			return fullMatch.replace(styleContent, rewrittenCss);
		},
	);

	return rewritten;
}

/**
 * Rewrite URLs in meta refresh tags
 * @param {string} htmlString - HTML content
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend
 * @returns {string} HTML with rewritten meta refresh URLs
 */
export function rewriteMetaUrls(htmlString, currentUrl, basePath) {
	const metaRegex = URL_PATTERNS.META_REFRESH.getRegex();

	return htmlString.replace(metaRegex, (fullMatch, content) => {
		if (!content) return fullMatch;

		// Extract URL from content="5;url=https://example.com"
		const urlMatch = URL_PATTERNS.META_REFRESH_URL.getRegex().exec(content);
		if (!urlMatch?.[1]) return fullMatch;

		const originalUrl = urlMatch[1].trim();
		if (!shouldRewriteUrl(originalUrl, currentUrl)) {
			return fullMatch;
		}

		// Apply basePath and reconstruct the content
		const rewrittenUrl = applyBasePath(originalUrl, currentUrl, basePath);
		const rewrittenContent = content.replace(originalUrl, rewrittenUrl);

		return fullMatch.replace(content, rewrittenContent);
	});
}

/**
 * Rewrite all internal URLs in HTML content with basePath prefix
 * @param {string} htmlString - HTML content to process
 * @param {string | URL} currentUrl - Current page URL for context
 * @param {string} basePath - Base path to prepend (e.g., "/my-app")
 * @returns {string} HTML with all internal URLs rewritten
 */
export function rewriteHtmlUrls(htmlString, currentUrl, basePath) {
	// Early return if no basePath or basePath is root
	if (!basePath || basePath === "/" || basePath === "") {
		return htmlString;
	}

	let rewritten = htmlString;

	// Apply all URL rewriters in sequence
	rewritten = rewriteLinkUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteImageUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteScriptUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteStylesheetUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteIframeUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteMediaUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteEmbedUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteCssUrls(rewritten, currentUrl, basePath);
	rewritten = rewriteMetaUrls(rewritten, currentUrl, basePath);

	return rewritten;
}
