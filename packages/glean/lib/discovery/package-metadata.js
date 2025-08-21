/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package metadata intelligence - surgical parsing of package.json exports.
 *
 * Ravens understand territory by reading the signs left by previous inhabitants.
 * Parse package declarations with predatory precision to identify entry points
 * and export patterns without external dependencies.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Parse package.json from a directory
 * @param {string} packagePath - Absolute path to package directory
 * @returns {Promise<any|null>} Parsed package.json or null if not found
 */
export async function parsePackageJson(packagePath) {
	try {
		const packageJsonPath = join(packagePath, "package.json");
		const content = await readFile(packageJsonPath, "utf-8");
		return JSON.parse(content);
	} catch (_error) {
		// Gracefully handle missing or malformed package.json
		return null;
	}
}

/**
 * Extract entry points from package.json exports field
 * @param {any} packageJson - Parsed package.json content (can be null)
 * @returns {string[]} Array of entry point file paths
 */
export function extractEntryPoints(packageJson) {
	const entryPoints = [];

	// Handle null/missing package.json
	if (!packageJson) {
		return ["index.js"]; // Default fallback
	}

	// Handle main field
	if (packageJson.main) {
		entryPoints.push(packageJson.main);
	}

	// Handle module field
	if (packageJson.module) {
		entryPoints.push(packageJson.module);
	}

	// Handle exports field (modern packages)
	if (packageJson.exports) {
		const exports = packageJson.exports;

		if (typeof exports === "string") {
			entryPoints.push(exports);
		} else if (typeof exports === "object") {
			extractExportsRecursively(exports, entryPoints);
		}
	}

	// Default fallback for packages with explicit structure
	if (entryPoints.length === 0) {
		entryPoints.push("index.js");
	}

	// Remove duplicates and filter out TypeScript definition files
	return [...new Set(entryPoints)].filter((path) => !path.endsWith(".d.ts"));
}

/**
 * Recursively extract file paths from exports object
 * @param {any} exports - Exports object from package.json
 * @param {string[]} entryPoints - Array to collect entry points
 */
export function extractExportsRecursively(exports, entryPoints) {
	for (const [_key, value] of Object.entries(exports)) {
		if (typeof value === "string") {
			entryPoints.push(value);
		} else if (typeof value === "object" && value !== null) {
			// Handle conditional exports like { "import": "./index.js", "require": "./index.cjs" }
			if (value.import) entryPoints.push(value.import);
			if (value.require) entryPoints.push(value.require);
			if (value.default) entryPoints.push(value.default);

			// Recurse for nested exports
			extractExportsRecursively(value, entryPoints);
		}
	}
}
