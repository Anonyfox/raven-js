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
	const files = [];

	try {
		const entries = await readdir(dirPath);

		for (const entry of entries) {
			const fullPath = join(dirPath, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				// Skip excluded directories
				if (!excludeDirs.includes(entry)) {
					const subFiles = await scanJavaScriptFiles(
						fullPath,
						excludeDirs,
						throwOnMissing,
					);
					files.push(...subFiles);
				}
			} else if (stats.isFile()) {
				// Include JavaScript files
				const ext = extname(entry);
				if (ext === ".js" || ext === ".mjs") {
					files.push(fullPath);
				}
			}
		}
	} catch (error) {
		// Re-throw for critical errors like ENOENT (directory doesn't exist) - but only if explicitly requested
		if (error.code === "ENOENT" && throwOnMissing) {
			throw new Error(`Directory not found: ${dirPath}`);
		}
		// Gracefully handle permission errors or missing directories - ravens adapt to hostile territory
	}

	return files;
}

/**
 * Find README files in directory tree
 * @param {string} dirPath - Directory path to scan
 * @param {boolean} throwOnMissing - Whether to throw on missing directories
 * @returns {Promise<string[]>} Array of README file paths
 */
export async function findReadmeFiles(dirPath, throwOnMissing = false) {
	const readmes = [];

	try {
		const entries = await readdir(dirPath);

		for (const entry of entries) {
			const fullPath = join(dirPath, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				// Skip node_modules and other build directories
				if (!["node_modules", ".git", "dist", "build"].includes(entry)) {
					const subReadmes = await findReadmeFiles(fullPath, throwOnMissing);
					readmes.push(...subReadmes);
				}
			} else if (stats.isFile()) {
				// Look for README files (case insensitive)
				const lowerName = entry.toLowerCase();
				if (lowerName.startsWith("readme")) {
					readmes.push(fullPath);
				}
			}
		}
	} catch (error) {
		// Re-throw for critical errors like ENOENT (directory doesn't exist) - but only if explicitly requested
		if (error.code === "ENOENT" && throwOnMissing) {
			throw new Error(`Directory not found: ${dirPath}`);
		}
		// Graceful degradation - territory might be hostile
	}

	return readmes;
}
