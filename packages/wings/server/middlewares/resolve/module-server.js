/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JavaScript module file serving with security validation.
 *
 * Serves JavaScript files from configurable source folder using Wings
 * response helpers and string pool constants. Includes security validation
 * to prevent path traversal and unauthorized file access.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";

/**
 * Serves JavaScript module from the configured source folder.
 *
 * @param {import('../../../core/context.js').Context} ctx - Wings context instance
 * @param {string} filePath - Requested file path relative to source folder
 * @param {string} sourceFolder - Root folder to serve files from
 * @returns {Promise<boolean>} True if file was served, false if not found
 * @throws {Error} For malformed requests or security violations
 *
 * @example
 * // Serve module file with security validation
 * const served = await serveModule(ctx, "utils/helper.js", "./src");
 * // true if served, false if not found
 */
export async function serveModule(ctx, filePath, sourceFolder) {
	// Validate file path for security
	if (!isValidModulePath(filePath)) {
		throw new Error(`Invalid module path: ${filePath}`);
	}

	// Normalize and resolve the file path
	const normalizedPath = normalize(filePath);
	const fullPath = resolve(join(sourceFolder, normalizedPath));
	const sourceRoot = resolve(sourceFolder);

	// Security check: ensure file is within source folder
	if (!fullPath.startsWith(sourceRoot)) {
		throw new Error(`Path traversal attempt: ${filePath}`);
	}

	// Check if file exists and is a JavaScript module
	if (!existsSync(fullPath)) {
		return false; // File not found, let other middleware handle
	}

	try {
		// Read and serve the JavaScript file
		const content = await readFile(fullPath, "utf-8");
		ctx.js(content);
		return true;
	} catch (_error) {
		// File read error (permissions, etc.)
		throw new Error(`Failed to read module: ${filePath}`);
	}
}

/**
 * Validates if a file path is allowed for module serving.
 *
 * Implements security checks to prevent unauthorized file access:
 * - Must be JavaScript file (.js or .mjs)
 * - No path traversal attempts
 * - No hidden files or system files
 *
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if path is valid and safe
 */
function isValidModulePath(filePath) {
	if (!filePath || typeof filePath !== "string") {
		return false;
	}

	// Must end with .js or .mjs extension
	if (!/\.(js|mjs)$/i.test(filePath)) {
		return false;
	}

	// No path traversal patterns
	if (filePath.includes("../") || filePath.includes("..\\")) {
		return false;
	}

	// No absolute paths
	if (filePath.startsWith("/") || /^[a-zA-Z]:/.test(filePath)) {
		return false;
	}

	// Check path segments for security issues
	const pathSegments = filePath.split(/[/\\]/);
	for (const segment of pathSegments) {
		// No ".." segments (path traversal)
		if (segment === "..") {
			return false;
		}
		// No hidden files/directories (starting with .) except current dir "."
		if (segment.startsWith(".") && segment !== ".") {
			return false;
		}
	}

	// No empty segments (double slashes)
	if (pathSegments.some((segment) => segment === "")) {
		return false;
	}

	return true;
}
