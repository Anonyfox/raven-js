/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 *
 * Recursively list all files in a directory with relative paths.
 * Returns paths in web format (forward slashes, starting with /).
 * This function scans a directory tree and returns all file paths in a format
 * suitable for web serving. It handles directory traversal gracefully and
 * normalizes paths to use forward slashes with leading slash for consistency.
 * ```javascript
 * // Directory structure:
 * // public/
 * //   ├── css/styles.css
 * //   ├── js/app.js
 * //   └── images/
 * //       └── logo.png
 * const files = await listFilesRecursive('./public');
 * console.log(files);
 * // ['/css/styles.css', '/js/app.js', '/images/logo.png']
 * ```
 * ```javascript
 * // If directory doesn't exist or can't be read
 * const files = await listFilesRecursive('./nonexistent');
 * console.log(files); // [] (empty array, no error thrown)
 * ```
 */
/**
 * @param {string} dirPath - Directory path to scan
 * @param {string} basePath - Base path for relative URLs
 * @returns {Promise<string[]>} Array of file paths
 */
export async function listFilesRecursive(
	/** @type {string} */ dirPath,
	/** @type {string} */ basePath = "",
) {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		const files = [];

		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			const relativePath = path.join(basePath, entry.name);

			if (entry.isDirectory()) {
				// Recurse into subdirectories
				/** @type {string[]} */
				const subFiles = await listFilesRecursive(fullPath, relativePath);
				files.push(...subFiles);
			} else {
				// Convert to web path format (forward slashes, leading /)
				const webPath = `/${relativePath.split(path.sep).join("/")}`;
				files.push(webPath);
			}
		}

		return files;
	} catch {
		// Directory doesn't exist or can't be read - return empty array
		return [];
	}
}
