/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset resolution for script mode bundling.
 *
 * Handles various asset input formats (strings, arrays, functions) and
 * resolves them to file paths for embedding in executables.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Asset collection and resolution for script bundling
 */
export class Assets {
	/**
	 * Resolved asset file paths
	 * @type {string[]}
	 */
	files;

	/**
	 * Create Assets instance
	 * @param {string[]} files - Array of resolved file paths
	 */
	constructor(files) {
		this.files = files || [];
	}

	/**
	 * Resolve various asset input formats to file paths
	 * @param {unknown} assetInput - Asset configuration (string, array, function, or null)
	 * @returns {Promise<Assets>} Assets instance with resolved files
	 *
	 * @example String input
	 * ```javascript
	 * const assets = await Assets.resolve("./public");
	 * // Resolves all files in ./public directory
	 * ```
	 *
	 * @example Array input
	 * ```javascript
	 * const assets = await Assets.resolve([
	 *   "./public",
	 *   "./config.json",
	 *   "./templates/*.html"
	 * ]);
	 * // Resolves directories, files, and glob patterns
	 * ```
	 *
	 * @example Function input
	 * ```javascript
	 * const assets = await Assets.resolve(async () => {
	 *   const templates = await loadTemplateList();
	 *   return ["./public", ...templates.map(t => `./templates/${t.file}`)];
	 * });
	 * ```
	 */
	static async resolve(assetInput) {
		if (!assetInput) {
			return new Assets([]);
		}

		// Handle function input - call and resolve result
		if (typeof assetInput === "function") {
			const result = await assetInput();
			return await Assets.resolve(result);
		}

		// Handle string input - convert to array
		if (typeof assetInput === "string") {
			const files = await resolveAssetPath(assetInput);
			return new Assets(files);
		}

		// Handle array input - resolve each entry
		if (Array.isArray(assetInput)) {
			const allFiles = [];
			for (const entry of assetInput) {
				if (typeof entry === "string") {
					const files = await resolveAssetPath(entry);
					allFiles.push(...files);
				}
			}
			// Remove duplicates and sort
			const uniqueFiles = [...new Set(allFiles)].sort();
			return new Assets(uniqueFiles);
		}

		throw new Error(
			"Assets configuration must be a string, array, function, or null",
		);
	}

	/**
	 * Get all resolved asset files
	 * @returns {string[]} Array of file paths
	 */
	getFiles() {
		return this.files;
	}

	/**
	 * Check if any assets are configured
	 * @returns {boolean} True if assets exist
	 */
	hasAssets() {
		return this.files.length > 0;
	}

	/**
	 * Validate that all asset files exist
	 * @throws {Error} If any asset file doesn't exist
	 */
	validate() {
		for (const file of this.files) {
			if (!existsSync(file)) {
				throw new Error(`Asset file not found: ${file}`);
			}
		}
	}
}

/**
 * Resolve single asset path (file, directory, or glob pattern)
 * @param {string} assetPath - Path to resolve
 * @returns {Promise<string[]>} Array of resolved file paths
 */
async function resolveAssetPath(assetPath) {
	if (!existsSync(assetPath)) {
		throw new Error(`Asset path not found: ${assetPath}`);
	}

	const stat = statSync(assetPath);

	if (stat.isFile()) {
		return [assetPath];
	}

	if (stat.isDirectory()) {
		// Recursively find all files in directory
		return listFilesRecursively(assetPath);
	}

	return [];
}

/**
 * Recursively list all files in a directory
 * @param {string} dirPath - Directory path to scan
 * @returns {string[]} Array of file paths
 */
function listFilesRecursively(dirPath) {
	/** @type {string[]} */
	const files = [];

	/**
	 * @param {string} currentPath
	 */
	function scanDirectory(currentPath) {
		try {
			const entries = readdirSync(currentPath, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(currentPath, entry.name);

				if (entry.isFile()) {
					files.push(fullPath);
				} else if (entry.isDirectory()) {
					scanDirectory(fullPath);
				}
			}
		} catch {
			// Skip directories that can't be read
		}
	}

	scanDirectory(dirPath);
	return files.sort();
}
