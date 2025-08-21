/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { dirname, join } from "node:path";
import { Identifier } from "./identifier.js";
import { pickEntrypointFile } from "./pick-entrypoint-file.js";

/**
 * Abstraction over a file in the file system.
 *
 * primitive to speed up subsequent algorithms and make testing easier instead
 * of always having to touch disk over and over again.
 */
export class File {
	/** @type {string} */
	path = "";

	/** @type {string} */
	text = "";

	/** @type {Array<Identifier>} */
	identifiers = [];

	/**
	 * @param {string} path the RELATIVE path to the file within the project
	 * @param {string} text the file's content as a string
	 */
	constructor(path, text) {
		this.path = path;
		this.text = text;
	}

	/**
	 * Returns unique file paths that match import statements in this file.
	 *
	 * Iterates over the identifiers array, extracts import paths, resolves them
	 * using Node.js path helpers, and matches them against the provided file list
	 * using the pickEntrypointFile function.
	 *
	 * @param {Set<string>} availableFilePaths - Set of available file paths
	 * @returns {Set<string>} Array of unique file paths that match imports
	 */
	importedFilePaths(availableFilePaths) {
		// Extract unique import paths from identifiers
		const importPaths = new Set();

		for (const identifier of this.identifiers) {
			// Only process identifiers that come from imports (have sourcePath)
			if (identifier.sourcePath !== null) {
				importPaths.add(identifier.sourcePath);
			}
		}

		const resolvedPaths = new Set();
		const currentDir = dirname(this.path);

		for (const importPath of importPaths) {
			// Skip non-relative imports (npm packages, absolute paths)
			if (!importPath.startsWith(".")) {
				continue;
			}

			// Resolve relative import path from current file's directory
			const resolvedImportPath = join(currentDir, importPath);

			// Use pickEntrypointFile to find the actual file
			const actualFile = pickEntrypointFile(
				availableFilePaths,
				resolvedImportPath,
			);

			if (actualFile !== null) {
				resolvedPaths.add(actualFile);
			}
		}

		return resolvedPaths;
	}
}
