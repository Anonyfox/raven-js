/**
 * @fileoverview Raven's development nest - Main module
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Nest CLI - Raven's development command center
 *
 * This module provides the core functionality for Raven's development tools.
 * It's designed to be efficient, reliable, and focused on getting the job done.
 *
 * @example
 * ```javascript
 * import { validatePackage, validateWorkspace } from '@raven-js/nest';
 *
 * // Validate a single package
 * const result = validatePackage('./packages/beak');
 *
 * // Validate all packages in workspace
 * const workspaceResult = validateWorkspace('.');
 * ```
 */

export * from "./docs/index.js";
export { Folder } from "./folder.js";
export { listPackages, listPublicPackages } from "./list-packages.js";
export {
	getPackageInfo,
	getWorkspacePackages,
	isValidPackage,
	readPackageJson,
	validatePackage,
	validateWorkspace,
} from "./package.js";
export * from "./semver/index.js";

/**
 * Get the current version of nest
 * @returns {string} The current version
 */
export function getVersion() {
	return "0.1.0";
}

/**
 * Check if nest is running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment() {
	return process.env.NODE_ENV === "development";
}

/**
 * Get the workspace root directory
 * @returns {string} Path to the workspace root
 */
export function getWorkspaceRoot() {
	// TODO: Implement workspace detection
	return process.cwd();
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
