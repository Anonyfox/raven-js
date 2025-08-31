/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shared URL pattern definitions for HTML processing.
 *
 * Single source of truth for all HTML URL regex patterns used in both
 * URL extraction and URL rewriting operations. Patterns handle various
 * quote styles and HTML contexts comprehensively.
 */

/**
 * URL pattern definition with regex and metadata
 */
export class UrlPattern {
	/** @type {RegExp} The regex pattern for matching URLs */
	#regex;

	/** @type {string} Human-readable description of what this pattern matches */
	#description;

	/** @type {number[]} Array of capture group indices that contain URLs */
	#captureGroups;

	/**
	 * Create a URL pattern
	 * @param {RegExp} regex - The regex pattern for matching URLs
	 * @param {string} description - Human-readable description
	 * @param {number[]} captureGroups - Capture group indices that contain URLs
	 */
	constructor(regex, description, captureGroups) {
		this.#regex = regex;
		this.#description = description;
		this.#captureGroups = [...captureGroups]; // Copy array
	}

	/**
	 * Get the regex pattern
	 * @returns {RegExp} The regex pattern
	 */
	getRegex() {
		return this.#regex;
	}

	/**
	 * Get pattern description
	 * @returns {string} Pattern description
	 */
	getDescription() {
		return this.#description;
	}

	/**
	 * Get capture group indices
	 * @returns {number[]} Array of capture group indices
	 */
	getCaptureGroups() {
		return [...this.#captureGroups]; // Return copy
	}

	/**
	 * Extract URL from regex match result
	 * @param {RegExpMatchArray | null} match - Regex match result
	 * @returns {string | null} Extracted URL string or null
	 */
	extractUrlFromMatch(match) {
		if (!match) {
			return null;
		}

		for (const groupIndex of this.#captureGroups) {
			const url = match[groupIndex];
			if (url) {
				return url.trim();
			}
		}
		return null;
	}

	/**
	 * Test if pattern matches content
	 * @param {string} content - Content to test
	 * @returns {boolean} True if pattern matches
	 */
	test(content) {
		// Reset regex state
		this.#regex.lastIndex = 0;
		return this.#regex.test(content);
	}

	/**
	 * Execute pattern against content and return match
	 * @param {string} content - Content to match against
	 * @returns {RegExpMatchArray | null} Match result or null
	 */
	exec(content) {
		return this.#regex.exec(content);
	}

	/**
	 * Reset regex state (important for global regexes)
	 */
	reset() {
		this.#regex.lastIndex = 0;
	}

	/**
	 * Convert to JSON representation
	 * @returns {object} JSON representation
	 */
	toJSON() {
		return {
			regex: this.#regex.source,
			flags: this.#regex.flags,
			description: this.#description,
			captureGroups: [...this.#captureGroups],
		};
	}
}

/**
 * Comprehensive URL patterns for HTML elements and attributes
 * Each pattern handles double quotes, single quotes, and unquoted attributes
 */
export const URL_PATTERNS = {
	/**
	 * Anchor tag href attributes: <a href="url">
	 */
	LINKS: new UrlPattern(
		/<a[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Anchor tag href attributes",
		[1, 2, 3],
	),

	/**
	 * Image src attributes: <img src="url">
	 */
	IMAGES: new UrlPattern(
		/<img[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Image src attributes",
		[1, 2, 3],
	),

	/**
	 * Script src attributes: <script src="url">
	 */
	SCRIPTS: new UrlPattern(
		/<script[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Script src attributes",
		[1, 2, 3],
	),

	/**
	 * Link href attributes: <link href="url"> (stylesheets, icons, etc.)
	 */
	STYLESHEETS: new UrlPattern(
		/<link[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Link href attributes (CSS, icons, etc.)",
		[1, 2, 3],
	),

	/**
	 * Iframe src attributes: <iframe src="url">
	 */
	IFRAMES: new UrlPattern(
		/<iframe[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Iframe src attributes",
		[1, 2, 3],
	),

	/**
	 * Media element src attributes: <video src="url">, <audio src="url">
	 */
	MEDIA_SRC: new UrlPattern(
		/<(?:video|audio)[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Video and audio src attributes",
		[1, 2, 3],
	),

	/**
	 * Source element src attributes: <source src="url">
	 */
	SOURCE: new UrlPattern(
		/<source[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Source element src attributes",
		[1, 2, 3],
	),

	/**
	 * Track element src attributes: <track src="url">
	 */
	TRACK: new UrlPattern(
		/<track[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Track element src attributes",
		[1, 2, 3],
	),

	/**
	 * Embed element src attributes: <embed src="url">
	 */
	EMBED: new UrlPattern(
		/<embed[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Embed element src attributes",
		[1, 2, 3],
	),

	/**
	 * Object element data attributes: <object data="url">
	 */
	OBJECT: new UrlPattern(
		/<object[^>]+data\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
		"Object element data attributes",
		[1, 2, 3],
	),

	/**
	 * CSS url() functions: url("path"), url('path'), url(path)
	 */
	CSS_URLS: new UrlPattern(
		/url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]+))\s*\)/gi,
		"CSS url() functions",
		[1, 2, 3],
	),

	/**
	 * Style tag content extraction: <style>...</style>
	 */
	STYLE_TAGS: new UrlPattern(
		/<style[^>]*>([\s\S]*?)<\/style>/gi,
		"Style tag content extraction",
		[1],
	),

	/**
	 * Inline style attribute extraction: style="..."
	 */
	INLINE_STYLES: new UrlPattern(
		/style\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
		"Inline style attribute extraction",
		[1, 2],
	),

	/**
	 * Meta refresh redirect: <meta http-equiv="refresh" content="delay;url=...">
	 */
	META_REFRESH: new UrlPattern(
		/<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]+content\s*=\s*["']([^"']*)["']/gi,
		"Meta refresh redirect content",
		[1],
	),

	/**
	 * URL extraction from meta refresh content: "5;url=https://example.com"
	 */
	META_REFRESH_URL: new UrlPattern(
		/url\s*=\s*(.+)/i,
		"URL extraction from meta refresh content",
		[1],
	),
};

/**
 * Get all URL extraction patterns (excludes meta patterns and content extractors)
 * @returns {UrlPattern[]} Array of URL patterns for direct URL extraction
 */
export function getDirectUrlPatterns() {
	return [
		URL_PATTERNS.LINKS,
		URL_PATTERNS.IMAGES,
		URL_PATTERNS.SCRIPTS,
		URL_PATTERNS.STYLESHEETS,
		URL_PATTERNS.IFRAMES,
		URL_PATTERNS.MEDIA_SRC,
		URL_PATTERNS.SOURCE,
		URL_PATTERNS.TRACK,
		URL_PATTERNS.EMBED,
		URL_PATTERNS.OBJECT,
	];
}

/**
 * Get all CSS-related patterns for CSS URL processing
 * @returns {UrlPattern[]} Array of CSS-specific patterns
 */
export function getCssPatterns() {
	return [
		URL_PATTERNS.CSS_URLS,
		URL_PATTERNS.STYLE_TAGS,
		URL_PATTERNS.INLINE_STYLES,
	];
}

/**
 * Get meta-related patterns for meta tag processing
 * @returns {UrlPattern[]} Array of meta-specific patterns
 */
export function getMetaPatterns() {
	return [URL_PATTERNS.META_REFRESH, URL_PATTERNS.META_REFRESH_URL];
}

/**
 * Get all patterns that directly extract URLs from attributes
 * @returns {UrlPattern[]} Array of all direct URL extraction patterns
 */
export function getAllDirectPatterns() {
	return [
		...getDirectUrlPatterns(),
		URL_PATTERNS.CSS_URLS, // CSS urls can be directly extracted too
	];
}
