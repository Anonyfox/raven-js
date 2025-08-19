/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Environment detection for asset serving modes.
 *
 * Detects available asset sources through environment capability probing.
 * Critical for transparent mode selection without configuration overhead.
 */

/**
 * Check if we're running in a Single Executable Application.
 *
 * Uses runtime capability detection to determine SEA availability without
 * breaking in environments where node:sea is unavailable. Essential for
 * transparent deployment across different Node.js configurations.
 *
 * @returns {boolean} True when SEA environment detected and functional
 *
 * @example SEA Detection
 * ```javascript
 * // In SEA-bundled application
 * console.log(isSEAEnvironment()); // → true
 *
 * // In standard Node.js
 * console.log(isSEAEnvironment()); // → false
 * ```
 *
 * @example Error Safety
 * ```javascript
 * // Never throws, even in incompatible environments
 * const isSEA = isSEAEnvironment(); // Safe to call anywhere
 * ```
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
 *
 * Validates globalThis.RavenJS.assets structure for proper asset serving.
 * Ensures object is valid dictionary suitable for asset lookup operations.
 *
 * @returns {boolean} True when global assets object is valid and accessible
 *
 * @example Valid Global Assets
 * ```javascript
 * globalThis.RavenJS = {
 *   assets: {
 *     '/css/app.css': 'body { margin: 0; }',
 *     '/js/app.js': 'console.log("app");'
 *   }
 * };
 * console.log(isGlobalAssetsAvailable()); // → true
 * ```
 *
 * @example Invalid Structures
 * ```javascript
 * globalThis.RavenJS = { assets: [] };        // → false (array)
 * globalThis.RavenJS = { assets: null };      // → false (null)
 * globalThis.RavenJS = {};                    // → false (missing)
 * delete globalThis.RavenJS;                  // → false (undefined)
 * ```
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
