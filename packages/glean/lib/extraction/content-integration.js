/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Content integration for README and documentation files.
 *
 * Surgical extraction of README content with asset reference tracking
 * and directory mapping for comprehensive documentation coverage.
 */

import { readFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

/**
 * Extract README data and content
 * @param {string} readmePath - Path to README file
 * @param {string} packagePath - Package root path
 * @returns {Promise<ReadmeData>} README data
 */
export async function extractReadmeData(readmePath, packagePath) {
	const content = await readFile(readmePath, "utf-8");
	const relativePath = relative(packagePath, readmePath);
	const dirPath = dirname(relativePath);

	return {
		path: relativePath,
		content,
		assets: [], // TODO: Extract asset references in future enhancement
		directory: dirPath,
	};
}

/**
 * @typedef {Object} ReadmeData
 * @property {string} path - Relative path to README
 * @property {string} content - README content
 * @property {string[]} assets - Referenced asset IDs
 * @property {string} directory - Directory containing README
 */
