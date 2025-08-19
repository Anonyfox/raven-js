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
 * @file Filesystem operations for asset discovery.
 *
 * Provides recursive directory scanning with web-compatible path normalization.
 * Essential for filesystem mode asset list generation.
 */

/**
 * Recursively list all files in a directory with relative paths.
 *
 * Scans directory tree and normalizes paths for web serving compatibility.
 * Critical for filesystem mode initialization - converts OS-specific paths
 * to web-standard format with forward slashes and leading slash.
 *
 * @param {string} dirPath - Directory path to scan recursively
 * @param {string} [basePath=''] - Base path for relative URL construction
 * @returns {Promise<string[]>} Array of web-normalized file paths
 *
 * @example Directory Scanning
 * ```javascript
 * // Directory structure:
 * // public/
 * //   ├── css/styles.css
 * //   ├── js/app.js
 * //   └── images/logo.png
 *
 * const files = await listFilesRecursive('./public');
 * console.log(files);
 * // → ['/css/styles.css', '/js/app.js', '/images/logo.png']
 * ```
 *
 * @example Error Resilience
 * ```javascript
 * // Graceful handling of missing directories
 * const files = await listFilesRecursive('./nonexistent');
 * console.log(files); // → [] (no error thrown)
 *
 * // Permission errors also return empty array
 * const restricted = await listFilesRecursive('/root/.ssh');
 * console.log(restricted); // → [] (safe fallback)
 * ```
 *
 * @example Path Normalization
 * ```javascript
 * // Windows paths converted to web format
 * // Input: 'css\\style.css' → Output: '/css/style.css'
 * // Always uses forward slashes regardless of OS
 * ```
 */
export async function listFilesRecursive(dirPath, basePath = "") {
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
