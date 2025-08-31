/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { dirname, join } from "node:path";
import { pickEntrypointFile } from "../fsutils/pick-entrypoint-file.js";
import { extractIdentifiers } from "../parser/extract-identifiers.js";
import { Identifier } from "./identifier.js";

/**
 * File abstraction with public API tracking and immutable content.
 *
 * Represents a single file tracking publicly exported identifiers for dependency resolution.
 * Immutable after construction - only tracks re-exported symbols, not internal imports.
 *
 * @example
 * // Basic file with export tracking
 * const file = new File('./src/utils.js', 'export { helper } from "./core.js";');
 * console.log(file.path, file.importedFilePaths(availableFiles));
 *
 * @example
 * // Re-export dependency tracking
 * const dependencies = file.importedFilePaths(new Set(['./src/core.js']));
 * // Only includes files that contribute to public API
 */
export class File {
	/** @type {string} - Relative path to the file within the project (immutable after construction) */
	#path = "";

	/** @type {string} - File content as string (immutable after construction) */
	#text = "";

	/**
	 * @type {Array<Identifier>} - Publicly exported identifiers extracted from file content
	 *
	 * **Design Intent**: Contains ONLY identifiers that are publicly exported by this file.
	 * For re-exports, includes the source path for dependency tracking. Used internally
	 * for module graph construction and will be used for a future helper method that
	 * returns all identifiers as a flat array of strings.
	 *
	 * **Private by Design**: External code should not directly access this. Use the provided
	 * methods like importedFilePaths() instead.
	 */
	#identifiers = [];

	/**
	 * Creates a new File instance with immutable content and parsed identifiers.
	 *
	 * @param {string} path - The RELATIVE path to the file within the project (must be relative)
	 * @param {string} text - The file's content as a string (will be parsed for exports)
	 */
	constructor(path, text) {
		this.#path = path;
		this.#text = text;
		this.#identifiers = extractIdentifiers(text);
	}

	/**
	 * Get the file path (readonly)
	 * @returns {string} The relative file path within the project
	 */
	get path() {
		return this.#path;
	}

	/**
	 * Get the file text content (readonly)
	 * @returns {string} The complete file content as a string
	 */
	get text() {
		return this.#text;
	}

	/**
	 * Returns file paths that contribute to this file's public API through re-exports.
	 *
	 * ONLY tracks public dependencies - files whose symbols are re-exported. Regular imports
	 * that are not re-exported are ignored. Uses pickEntrypointFile for path resolution.
	 *
	 * @param {Set<string>} availableFilePaths - Set of available file paths for resolution
	 * @returns {Set<string>} Set of unique file paths that contribute to this file's public API
	 *
	 * @example
	 * // Given file content:
	 * // import { helper } from './utils.js';
	 * // import { unused } from './other.js';  // ← NOT tracked (not re-exported)
	 * // export { helper };                    // ← Creates dependency on './utils.js'
	 * //
	 * // Returns: Set(['src/utils.js']) - only the re-exported dependency
	 */
	importedFilePaths(availableFilePaths) {
		// Extract unique import paths from re-exported identifiers only
		const importPaths = new Set(
			this.#identifiers.map((i) => i.sourcePath).filter((p) => p !== null),
		);
		const resolvedPaths = new Set();
		const currentDir = dirname(this.#path);

		for (const importPath of importPaths) {
			// Skip non-relative imports (npm packages, absolute paths)
			if (!importPath.startsWith(".")) {
				continue;
			}

			// Resolve relative import path from current file's directory
			const resolvedImportPath = join(currentDir, importPath);

			// Use pickEntrypointFile to find the actual target file
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
