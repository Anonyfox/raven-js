/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Crawl frontier for URL state management.
 *
 * Tracks URL discovery and crawling states with atomic operations.
 * Race-condition free design with private Sets and explicit state transitions.
 */

import { normalizeUrl } from "./normalize-url.js";

/**
 * URL crawling frontier with atomic state management
 */
export class Frontier {
	/** @type {Set<string>} URL hrefs found via link extraction */
	#discovered = new Set();

	/** @type {Set<string>} URL hrefs successfully crawled */
	#crawled = new Set();

	/** @type {Set<string>} URL hrefs that failed during crawling */
	#failed = new Set();

	/** @type {URL | null} Base URL for resolving relative URLs */
	#baseUrl = null;

	/**
	 * Create frontier instance
	 * @param {string | URL | null} [baseUrl] - Base URL for resolving relative URLs
	 */
	constructor(baseUrl = null) {
		if (baseUrl) {
			this.#baseUrl = typeof baseUrl === "string" ? new URL(baseUrl) : baseUrl;
		}
	}

	/**
	 * Add URL to discovered set
	 * @param {string | URL} url - URL to discover
	 * @throws {Error} If URL is invalid
	 */
	discover(url) {
		const normalizedUrl = normalizeUrl(url, this.#baseUrl);
		this.#discovered.add(normalizedUrl.href);
	}

	/**
	 * Mark URL as successfully crawled
	 * @param {string | URL} url - URL that was crawled
	 * @throws {Error} If URL is invalid or not in discovered set
	 */
	markCrawled(url) {
		const normalizedUrl = normalizeUrl(url, this.#baseUrl);
		const href = normalizedUrl.href;

		if (!this.#discovered.has(href)) {
			throw new Error(`URL not in discovered set: ${href}`);
		}

		this.#discovered.delete(href);
		this.#crawled.add(href);
	}

	/**
	 * Mark URL as failed during crawling
	 * @param {string | URL} url - URL that failed
	 * @throws {Error} If URL is invalid or not in discovered set
	 */
	markFailed(url) {
		const normalizedUrl = normalizeUrl(url, this.#baseUrl);
		const href = normalizedUrl.href;

		if (!this.#discovered.has(href)) {
			throw new Error(`URL not in discovered set: ${href}`);
		}

		this.#discovered.delete(href);
		this.#failed.add(href);
	}

	/**
	 * Move URL from failed back to discovered (for retries)
	 * @param {string | URL} url - URL to retry
	 * @throws {Error} If URL is invalid or not in failed set
	 */
	rediscover(url) {
		const normalizedUrl = normalizeUrl(url, this.#baseUrl);
		const href = normalizedUrl.href;

		if (!this.#failed.has(href)) {
			throw new Error(`URL not in failed set: ${href}`);
		}

		this.#failed.delete(href);
		this.#discovered.add(href);
	}

	/**
	 * Check if URL is pending (discovered but not crawled or failed)
	 * @param {string | URL} url - URL to check
	 * @returns {boolean} True if URL is pending
	 */
	isPending(url) {
		try {
			const normalizedUrl = normalizeUrl(url, this.#baseUrl);
			return this.#discovered.has(normalizedUrl.href);
		} catch {
			return false;
		}
	}

	/**
	 * Check if URL has been successfully crawled
	 * @param {string | URL} url - URL to check
	 * @returns {boolean} True if URL is crawled
	 */
	isCrawled(url) {
		try {
			const normalizedUrl = normalizeUrl(url, this.#baseUrl);
			return this.#crawled.has(normalizedUrl.href);
		} catch {
			return false;
		}
	}

	/**
	 * Check if URL failed during crawling
	 * @param {string | URL} url - URL to check
	 * @returns {boolean} True if URL failed
	 */
	isFailed(url) {
		try {
			const normalizedUrl = normalizeUrl(url, this.#baseUrl);
			return this.#failed.has(normalizedUrl.href);
		} catch {
			return false;
		}
	}

	/**
	 * Check if any URLs are pending
	 * @returns {boolean} True if pending URLs exist
	 */
	hasPending() {
		return this.#discovered.size > 0;
	}

	/**
	 * Get count of pending URLs
	 * @returns {number} Number of pending URLs
	 */
	getPendingCount() {
		return this.#discovered.size;
	}

	/**
	 * Get next pending URL for processing
	 * @returns {URL | null} Next URL to crawl or null if none pending
	 */
	getNextPending() {
		if (this.#discovered.size === 0) {
			return null;
		}

		// Get first URL from set (insertion order in modern JS)
		const iterator = this.#discovered.values();
		const firstHref = iterator.next().value;
		return new URL(/** @type {string} */ (firstHref));
	}

	/**
	 * Get all pending URLs
	 * @returns {URL[]} Array of pending URLs
	 */
	getPendingUrls() {
		return Array.from(this.#discovered, (href) => new URL(href));
	}

	/**
	 * Get all known URLs (discovered + crawled + failed)
	 * @returns {URL[]} Array of all URLs
	 */
	getAllUrls() {
		const allHrefs = this.#discovered.union(this.#crawled).union(this.#failed);
		return Array.from(allHrefs, (href) => new URL(href));
	}

	/**
	 * Get crawled URLs
	 * @returns {URL[]} Array of successfully crawled URLs
	 */
	getCrawledUrls() {
		return Array.from(this.#crawled, (href) => new URL(href));
	}

	/**
	 * Get failed URLs
	 * @returns {URL[]} Array of failed URLs
	 */
	getFailedUrls() {
		return Array.from(this.#failed, (href) => new URL(href));
	}

	/**
	 * Get statistics about frontier state
	 * @returns {{discovered: number, crawled: number, failed: number, total: number}} Stats object
	 */
	getStats() {
		return {
			discovered: this.#discovered.size,
			crawled: this.#crawled.size,
			failed: this.#failed.size,
			total: this.#discovered.size + this.#crawled.size + this.#failed.size,
		};
	}
}
