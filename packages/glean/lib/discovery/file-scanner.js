/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file File system reconnaissance - surgical scanning for JavaScript assets and documentation.
 *
 * Ravens patrol hostile territory with predatory precision. Scan directory trees
 * for JavaScript files and README documentation, adapting to permission
 * restrictions with graceful degradation.
 */

import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";

/**
 * Recursively scan for JavaScript files in a directory
 * @param {string} dirPath - Directory path to scan
 * @param {string[]} excludeDirs - Directory names to exclude
 * @param {boolean} throwOnMissing - Whether to throw on missing directories
 * @returns {Promise<string[]>} Array of JavaScript file paths
 */
export async function scanJavaScriptFiles(
	dirPath,
	excludeDirs = ["node_modules", ".git", "dist", "build"],
	throwOnMissing = false,
) {
	// Convert to Set for O(1) lookups - V8 optimization
	const excludeSet = new Set(excludeDirs);

	try {
		const entries = await readdir(dirPath);

		// Parallelize filesystem operations for predatory speed
		const entryPromises = entries.map(async (entry) => {
			const fullPath = join(dirPath, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				// Skip excluded directories with O(1) lookup
				if (!excludeSet.has(entry)) {
					return scanJavaScriptFiles(fullPath, excludeDirs, throwOnMissing);
				}
				return [];
			} else if (stats.isFile()) {
				// Include JavaScript files - optimized for JIT inline caching
				const ext = extname(entry);
				if (ext === ".js" || ext === ".mjs") {
					return [fullPath];
				}
			}
			return [];
		});

		// Resolve all filesystem operations in parallel
		const results = await Promise.all(entryPromises);

		// Flatten results with native performance
		return results.flat();
	} catch (error) {
		// Re-throw for critical errors like ENOENT (directory doesn't exist) - but only if explicitly requested
		if (error.code === "ENOENT" && throwOnMissing) {
			throw new Error(`Directory not found: ${dirPath}`);
		}
		// Gracefully handle permission errors or missing directories - ravens adapt to hostile territory
	}

	return [];
}

/**
 * Find README files in directory tree
 * @param {string} dirPath - Directory path to scan
 * @param {boolean} throwOnMissing - Whether to throw on missing directories
 * @returns {Promise<string[]>} Array of README file paths
 */
export async function findReadmeFiles(dirPath, throwOnMissing = false) {
	// V8-optimized exclusion set
	const excludeSet = new Set(["node_modules", ".git", "dist", "build"]);

	try {
		const entries = await readdir(dirPath);

		// Parallelize filesystem operations for predatory efficiency
		const entryPromises = entries.map(async (entry) => {
			const fullPath = join(dirPath, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				// Skip excluded directories with O(1) lookup
				if (!excludeSet.has(entry)) {
					return findReadmeFiles(fullPath, throwOnMissing);
				}
				return [];
			} else if (stats.isFile()) {
				// Look for README files (case insensitive) - JIT-optimized
				const lowerName = entry.toLowerCase();
				if (lowerName.startsWith("readme")) {
					return [fullPath];
				}
			}
			return [];
		});

		// Resolve all operations in parallel
		const results = await Promise.all(entryPromises);

		// Flatten with native performance
		return results.flat();
	} catch (error) {
		// Re-throw for critical errors like ENOENT (directory doesn't exist) - but only if explicitly requested
		if (error.code === "ENOENT" && throwOnMissing) {
			throw new Error(`Directory not found: ${dirPath}`);
		}
		// Graceful degradation - territory might be hostile
	}

	return [];
}
