/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTTP request attempt tracking.
 *
 * Tracks individual HTTP request attempts with timing, status codes, and URLs.
 * Used by Resource class to maintain request chain history.
 */

/**
 * HTTP request attempt with timing and status tracking
 */
export class Attempt {
	/**
	 * Create attempt instance
	 * @param {string | URL} url - URL that was requested
	 * @param {number} statusCode - HTTP status code received
	 * @param {number} responseTime - Request duration in milliseconds
	 * @param {number} [startTime] - Request start timestamp (Date.now())
	 */
	constructor(url, statusCode, responseTime, startTime = Date.now()) {
		/** @type {URL} URL that was requested */
		this.url = url instanceof URL ? url : new URL(url);

		/** @type {number} HTTP status code */
		this.statusCode = statusCode;

		/** @type {number} Response time in milliseconds */
		this.responseTime = responseTime;

		/** @type {number} Request start timestamp */
		this.startTime = startTime;

		/** @type {number} Request end timestamp */
		this.endTime = startTime + responseTime;
	}

	/**
	 * Check if attempt was successful (2xx status)
	 * @returns {boolean} True if status indicates success
	 */
	isSuccess() {
		return this.statusCode >= 200 && this.statusCode < 300;
	}

	/**
	 * Check if attempt was a redirect (3xx status)
	 * @returns {boolean} True if status indicates redirect
	 */
	isRedirect() {
		return this.statusCode >= 300 && this.statusCode < 400;
	}

	/**
	 * Check if attempt failed (4xx or 5xx status)
	 * @returns {boolean} True if status indicates failure
	 */
	isError() {
		return this.statusCode >= 400;
	}

	/**
	 * Get human-readable status description
	 * @returns {string} Status description
	 */
	getStatusText() {
		if (this.isSuccess()) return "Success";
		if (this.isRedirect()) return "Redirect";
		if (this.statusCode >= 400 && this.statusCode < 500) return "Client Error";
		if (this.statusCode >= 500) return "Server Error";
		return "Unknown";
	}

	/**
	 * Create attempt from fetch Response with timing
	 * @param {string | URL} url - URL that was requested
	 * @param {Response} response - Fetch response object
	 * @param {number} responseTime - Request duration in milliseconds
	 * @param {number} [startTime] - Request start timestamp
	 * @returns {Attempt} New attempt instance
	 */
	static fromResponse(url, response, responseTime, startTime = Date.now()) {
		return new Attempt(url, response.status, responseTime, startTime);
	}

	/**
	 * Convert attempt to JSON representation
	 * @returns {object} JSON representation
	 */
	toJSON() {
		return {
			url: this.url.href,
			statusCode: this.statusCode,
			statusText: this.getStatusText(),
			responseTime: this.responseTime,
			startTime: this.startTime,
			endTime: this.endTime,
		};
	}
}
