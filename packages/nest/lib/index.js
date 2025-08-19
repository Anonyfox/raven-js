/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * Nest CLI - Raven's development command center
 * This module provides the core functionality for Raven's development tools.
 * It's designed to be efficient, reliable, and focused on getting the job done.
 * ```javascript
 * import { validate } from '@raven-js/nest/rules';
 * // Validate a single package or workspace (auto-detects)
 * validate('./packages/beak'); // throws on first error
 * // Validate workspace (validates all packages)
 * validate('.'); // throws on first error
 * ```
 */

export * from "./docs/index.js";
// Legacy exports - consider using the new rules/queries system instead
export * from "./semver/index.js";

/**
 * Get the current version of nest
 * @returns {string} The current version
 */
export function getVersion() {
	return "0.1.0";
}

/**
 * Display the nest banner
 */
export function showBanner() {
	console.log(`
🦅 Raven's Nest - Development CLI v${getVersion()}
   Building, publishing, and automating with Raven's precision
`);
}
