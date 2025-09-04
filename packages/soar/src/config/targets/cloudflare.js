/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Cloudflare provider base class with HTTP client and authentication.
 *
 * Provides shared HTTP client using Node.js fetch() for all Cloudflare services.
 * Handles authentication, error formatting, and request/response processing.
 * Configuration lives in concrete product classes.
 */

import { Base } from "./base.js";

/**
 * @typedef {Object} CloudflareApiResponse
 * @property {boolean} success - Whether the API call succeeded
 * @property {*} [result] - API response data (when success is true)
 * @property {Array<{code: number, message: string}>} [errors] - Error details (when success is false)
 * @property {string[]} [messages] - Additional messages
 * @property {*} [error] - Legacy error field
 */

/**
 * Abstract base class for all Cloudflare services.
 * Provides shared HTTP client and authentication for all Cloudflare services.
 * Configuration and credentials are handled by concrete product classes.
 */
export class Cloudflare extends Base {
	/** @type {string} */
	#baseURL = "https://api.cloudflare.com/client/v4";

	/**
	 * Makes an authenticated HTTP request to the Cloudflare API.
	 *
	 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
	 * @param {string} path - API endpoint path (e.g., '/accounts/123/workers/scripts')
	 * @param {string} apiToken - Cloudflare API token
	 * @param {Object|FormData|null} [body] - Request body
	 * @param {HeadersInit} [additionalHeaders] - Additional headers
	 * @returns {Promise<CloudflareApiResponse>} API response
	 * @throws {Error} When request fails or returns error response
	 */
	async request(method, path, apiToken, body = null, additionalHeaders = {}) {
		if (!apiToken || typeof apiToken !== "string") {
			throw new Error("Cloudflare API token is required");
		}

		const url = `${this.#baseURL}${path}`;
		const headers = new Headers(additionalHeaders);

		// Set Authorization header
		headers.set("Authorization", `Bearer ${apiToken}`);

		// Set Content-Type for JSON bodies (FormData sets its own Content-Type)
		if (body && !(body instanceof FormData)) {
			headers.set("Content-Type", "application/json");
		}

		try {
			const response = await fetch(url, {
				method,
				headers,
				body:
					body instanceof FormData ? body : body ? JSON.stringify(body) : null,
			});

			/** @type {CloudflareApiResponse} */
			const responseData = await response.json();

			// Cloudflare API returns success: true/false in response
			if (!response.ok || !responseData.success) {
				const errorMessage = this.#formatCloudflareError(responseData);
				throw new Error(
					`Cloudflare API error (${response.status}): ${errorMessage}`,
				);
			}

			return responseData;
		} catch (error) {
			if (error instanceof TypeError && error.message.includes("fetch")) {
				throw new Error(`Network error: ${error.message}`);
			}
			throw error;
		}
	}

	/**
	 * Validates Cloudflare API credentials by making a test request.
	 *
	 * @param {string} apiToken - Cloudflare API token to validate
	 * @returns {Promise<boolean>} True if credentials are valid
	 * @throws {Error} When credentials are invalid or request fails
	 */
	async authenticate(apiToken) {
		try {
			await this.request("GET", "/user/tokens/verify", apiToken);
			return true;
		} catch (error) {
			throw new Error(`Cloudflare authentication failed: ${error.message}`);
		}
	}

	/**
	 * Gets Cloudflare credentials.
	 * Must be implemented by concrete product classes.
	 *
	 * @returns {Promise<object>} Cloudflare credentials
	 * @throws {Error} Always throws - must be implemented by product classes
	 */
	async getCredentials() {
		throw new Error(
			"getCredentials() must be implemented by concrete product classes",
		);
	}

	/**
	 * Formats Cloudflare API error response into a readable message.
	 *
	 * @param {CloudflareApiResponse} responseData - Cloudflare API error response
	 * @returns {string} Formatted error message
	 */
	#formatCloudflareError(responseData) {
		if (responseData.errors && Array.isArray(responseData.errors)) {
			return responseData.errors
				.map(/** @param {any} err */ (err) => `${err.code}: ${err.message}`)
				.join(", ");
		}

		if (responseData.messages && Array.isArray(responseData.messages)) {
			return responseData.messages.join(", ");
		}

		return responseData.error || "Unknown Cloudflare API error";
	}
}
