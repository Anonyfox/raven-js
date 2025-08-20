/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ID generation utilities for documentation entities.
 *
 * Surgical ID generation for modules and README files in documentation graphs.
 * Creates deterministic, unique identifiers following RavenJS conventions.
 */

import { dirname, relative } from "node:path";

/**
 * Generate module ID from file path
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @returns {string} Module ID
 */
export function generateModuleId(filePath, packagePath) {
	const relativePath = relative(packagePath, filePath);
	return relativePath.replace(/\.(js|mjs)$/, "").replace(/[/\\]/g, "/");
}

/**
 * Generate README ID from file path
 * @param {string} readmePath - Absolute README path
 * @param {string} packagePath - Package root path
 * @returns {string} README ID
 */
export function generateReadmeId(readmePath, packagePath) {
	const relativePath = relative(packagePath, readmePath);
	const dirPath = dirname(relativePath);
	return dirPath === "." ? "root" : dirPath;
}
