/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Web resource processor with attempt tracking.
 *
 * Handles HTTP fetching with comprehensive attempt tracking, content classification,
 * and URL extraction. Static factory pattern with incremental processing methods.
 */

import { normalizeUrl } from "../normalize-url.js";
import { Attempt } from "./attempt.js";
import { extractUrlsFromHtml } from "./extract-urls-from-html.js";

/**
 * Web resource processor with static fetch factory and attempt tracking
 */
export class Resource {
	/** @type {URL} Final resolved URL that was fetched */
	#url;

	/** @type {Response} Raw fetch Response object */
	#response;

	/** @type {ArrayBuffer} Binary content buffer */
	#buffer;

	/** @type {string | null} Cached string content (lazy-loaded) */
	#text = null;

	/** @type {Set<URL> | null} Cached URL extraction results */
	#extractedUrls = null;

	/** @type {URL} Base URL for resolving relative URLs and domain scope */
	#baseUrl;

	/** @type {Attempt[]} Request attempt chain in chronological order */
	#attempts = [];

	/**
	 * Create resource instance (use static fetch method instead)
	 * @param {URL} url - Final resolved URL
	 * @param {Response} response - Fetch response object
	 * @param {ArrayBuffer} buffer - Response content buffer
	 * @param {URL} baseUrl - Base URL for URL resolution
	 * @param {Attempt[]} attempts - Request attempt chain
	 */
	constructor(url, response, buffer, baseUrl, attempts = []) {
		this.#url = url;
		this.#response = response;
		this.#buffer = buffer;
		this.#baseUrl = baseUrl;
		this.#attempts = [...attempts];
	}

	/**
	 * Fetch resource with attempt tracking and sane defaults
	 * @param {string | URL} path - URL path to fetch (resolved against baseUrl if relative)
	 * @param {string | URL} baseUrl - Base URL for resolution and domain scope
	 * @param {object} [options] - Fetch options
	 * @param {number} [options.timeout=10000] - Request timeout in milliseconds
	 * @param {number} [options.maxRedirects=5] - Maximum number of redirects to follow
	 * @param {string} [options.userAgent] - User agent string
	 * @returns {Promise<Resource>} Resource instance with attempt tracking
	 * @throws {Error} If fetch fails or times out
	 */
	static async fetch(path, baseUrl, options = {}) {
		const {
			timeout = 10000,
			maxRedirects = 5,
			userAgent = "fledge/1.0 (RavenJS Static Site Generator)",
		} = options;

		// Resolve initial URL
		const resolvedBaseUrl = baseUrl instanceof URL ? baseUrl : new URL(baseUrl);
		const initialUrl = normalizeUrl(path, resolvedBaseUrl);

		const attempts = [];
		let currentUrl = initialUrl;
		let redirectCount = 0;

		while (redirectCount <= maxRedirects) {
			const startTime = Date.now();

			try {
				// Create abort controller for timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				const response = await fetch(currentUrl, {
					signal: controller.signal,
					redirect: "manual", // Handle redirects manually for tracking
					headers: {
						"User-Agent": userAgent,
					},
				});

				clearTimeout(timeoutId);
				const responseTime = Date.now() - startTime;

				// Track this attempt
				const attempt = Attempt.fromResponse(
					currentUrl,
					response,
					responseTime,
					startTime,
				);
				attempts.push(attempt);

				// Handle redirects
				if (response.status >= 300 && response.status < 400) {
					const location = response.headers.get("Location");
					if (!location) {
						throw new Error(
							`Redirect response missing Location header: ${response.status}`,
						);
					}

					redirectCount++;
					if (redirectCount > maxRedirects) {
						throw new Error(`Too many redirects (>${maxRedirects})`);
					}

					// Resolve redirect URL against current URL
					currentUrl = normalizeUrl(location, currentUrl);
					continue;
				}

				// Non-redirect response - we're done
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				// Read response body
				const buffer = await response.arrayBuffer();

				return new Resource(
					currentUrl,
					response,
					buffer,
					resolvedBaseUrl,
					attempts,
				);
			} catch (error) {
				const responseTime = Date.now() - startTime;
				const err = /** @type {any} */ (error);

				// Track failed attempt
				const statusCode = err.name === "AbortError" ? 408 : 0;
				const attempt = new Attempt(
					currentUrl,
					statusCode,
					responseTime,
					startTime,
				);
				attempts.push(attempt);

				// Re-throw with attempt context
				if (err.name === "AbortError") {
					throw new Error(`Request timeout (${timeout}ms): ${currentUrl.href}`);
				}
				throw new Error(`Fetch failed: ${currentUrl.href} - ${err.message}`);
			}
		}

		throw new Error(`Redirect loop detected: ${currentUrl.href}`);
	}

	/**
	 * Get final resolved URL
	 * @returns {URL} Final URL after redirects
	 */
	getUrl() {
		return this.#url;
	}

	/**
	 * Get response headers
	 * @returns {Headers} Response headers
	 */
	getHeaders() {
		return this.#response.headers;
	}

	/**
	 * Get content type from headers
	 * @returns {string | null} Content type or null if not present
	 */
	getContentType() {
		return this.#response.headers.get("Content-Type");
	}

	/**
	 * Check if resource is HTML content
	 * @returns {boolean} True if content type indicates HTML
	 */
	isHtml() {
		const contentType = this.getContentType();
		return contentType ? contentType.includes("text/html") : false;
	}

	/**
	 * Check if resource is an asset (non-HTML content)
	 * @returns {boolean} True if content is not HTML
	 */
	isAsset() {
		return !this.isHtml();
	}

	/**
	 * Get raw binary content buffer
	 * @returns {ArrayBuffer} Binary content
	 */
	getBuffer() {
		return this.#buffer;
	}

	/**
	 * Get string content (lazy-loaded, HTML only)
	 * @returns {string} String content
	 * @throws {Error} If resource is not HTML
	 */
	getContent() {
		if (!this.isHtml()) {
			throw new Error("Cannot get text content from non-HTML resource");
		}

		if (this.#text === null) {
			// Decode buffer to string (assumes UTF-8)
			const decoder = new TextDecoder("utf-8");
			this.#text = decoder.decode(this.#buffer);
		}

		return this.#text;
	}

	/**
	 * Extract all URLs from HTML content (cached)
	 * @returns {Set<URL>} Set of all discovered URLs
	 * @throws {Error} If resource is not HTML
	 */
	extractUrls() {
		if (!this.isHtml()) {
			throw new Error("Cannot extract URLs from non-HTML resource");
		}

		if (this.#extractedUrls === null) {
			const htmlContent = this.getContent();
			this.#extractedUrls = extractUrlsFromHtml(htmlContent, this.#url);
		}

		return this.#extractedUrls;
	}

	/**
	 * Get URLs that are relative to base URL (same origin for crawling)
	 * @returns {URL[]} Array of relative URLs
	 * @throws {Error} If resource is not HTML
	 */
	getRelativeUrls() {
		const allUrls = this.extractUrls();
		const relativeUrls = [];

		for (const url of allUrls) {
			if (url.origin === this.#baseUrl.origin) {
				relativeUrls.push(url);
			}
		}

		return relativeUrls;
	}

	/**
	 * Get URLs that are external to base URL (different origin)
	 * @returns {URL[]} Array of external URLs
	 * @throws {Error} If resource is not HTML
	 */
	getExternalUrls() {
		const allUrls = this.extractUrls();
		const externalUrls = [];

		for (const url of allUrls) {
			if (url.origin !== this.#baseUrl.origin) {
				externalUrls.push(url);
			}
		}

		return externalUrls;
	}

	/**
	 * Get all request attempts in chronological order
	 * @returns {Attempt[]} Array of attempts
	 */
	getAttempts() {
		return [...this.#attempts];
	}

	/**
	 * Get final successful attempt
	 * @returns {Attempt} Last attempt (should be successful)
	 * @throws {Error} If no attempts recorded
	 */
	getFinalAttempt() {
		if (this.#attempts.length === 0) {
			throw new Error("No attempts recorded");
		}
		return /** @type {Attempt} */ (this.#attempts[this.#attempts.length - 1]);
	}

	/**
	 * Get total response time across all attempts
	 * @returns {number} Total time in milliseconds
	 */
	getTotalResponseTime() {
		return this.#attempts.reduce(
			(total, attempt) => total + attempt.responseTime,
			0,
		);
	}

	/**
	 * Get number of redirects followed
	 * @returns {number} Redirect count
	 */
	getRedirectCount() {
		return Math.max(0, this.#attempts.length - 1);
	}

	/**
	 * Convert resource to JSON representation
	 * @returns {object} JSON representation
	 */
	toJSON() {
		return {
			url: this.#url.href,
			baseUrl: this.#baseUrl.href,
			contentType: this.getContentType(),
			isHtml: this.isHtml(),
			contentLength: this.#buffer.byteLength,
			attempts: this.#attempts.map((attempt) => attempt.toJSON()),
			totalResponseTime: this.getTotalResponseTime(),
			redirectCount: this.getRedirectCount(),
		};
	}
}
