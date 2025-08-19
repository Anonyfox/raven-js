/**
 * @file Environment Detection - Asset source environment detection utilities
 *
 * Provides utilities for detecting available asset sources in different execution environments.
 * Supports Single Executable Applications (SEA) and global variable-based asset embedding
 * with graceful fallback handling for environments where features are not available.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Check if we're running in a Single Executable Application.
 * Uses dynamic import to avoid errors in environments where node:sea is not available.
 *
 * @returns {boolean} True if running in SEA mode
 */
export function isSEAEnvironment() {
	try {
		// Dynamic import to handle environments where node:sea might not be available
		const sea = require("node:sea");
		return !!(sea && typeof sea.isSea === "function" && sea.isSea());
	} catch {
		return false;
	}
}

/**
 * Check if global asset variables are available.
 * Validates the structure to ensure it's a proper asset object.
 *
 * @returns {boolean} True if global assets are available
 */
export function isGlobalAssetsAvailable() {
	try {
		const global = /** @type {any} */ (globalThis);
		const ravenJS = global.RavenJS;
		return !!(
			ravenJS &&
			typeof ravenJS.assets === "object" &&
			ravenJS.assets !== null &&
			!Array.isArray(ravenJS.assets)
		);
	} catch {
		return false;
	}
}
