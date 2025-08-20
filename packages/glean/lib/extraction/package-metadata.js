/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package metadata processing for documentation graphs.
 *
 * Extracts and normalizes package.json metadata with surgical precision.
 * Handles missing or malformed package data with graceful defaults.
 */

/**
 * Build package metadata from package.json
 * @param {any} packageJson - Parsed package.json
 * @returns {PackageMetadata} Package metadata object
 */
export function buildPackageMetadata(packageJson) {
	if (!packageJson) {
		return {
			name: "unknown",
			version: "0.0.0",
			description: "",
			exports: {},
			main: undefined,
			module: undefined,
		};
	}

	return {
		name: packageJson.name || "unknown",
		version: packageJson.version || "0.0.0",
		description: packageJson.description || "",
		exports: packageJson.exports || {},
		main: packageJson.main,
		module: packageJson.module,
	};
}

/**
 * @typedef {Object} PackageMetadata
 * @property {string} name - Package name
 * @property {string} version - Package version
 * @property {string} description - Package description
 * @property {any} exports - Package exports configuration
 * @property {string|undefined} main - Main entry point
 * @property {string|undefined} module - Module entry point
 */
