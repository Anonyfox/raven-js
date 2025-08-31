/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { File } from "./file.js";
import { Package } from "./package.js";

/**
 * Module container for files under a specific import path with dependency tracking.
 *
 * Groups files that are exported together under a single import path, tracking
 * included files and their dependencies for module graph construction.
 *
 * @example
 * // Basic module creation
 * const module = new Module(package, './src/utils.js', 'my-package/utils');
 * module.addFile(file);
 * console.log(module.includedFilePaths());
 *
 * @example
 * // Dependency tracking
 * const imported = module.importedFilePaths(allFiles);
 * const unvisited = module.unvisitedFilePaths(allFiles);
 */
export class Module {
	/** @type {Package} */
	package = null;

	/**
	 * @type {string}
	 * The (relative) path to the file within the package.
	 */
	filePath = "";

	/**
	 * @type {string}
	 * The import path of the module.(used for import statements)
	 */
	importPath = "";

	/**
	 * @type {string}
	 * The content of the README.md file on the same level as the module file.
	 */
	readme = "";

	/**
	 * @type {Array<File>}
	 * The files that are part of the module.
	 */
	files = [];

	/**
	 * @type {Array<Object>}
	 * Image assets found in module README.
	 */
	imageAssets = [];

	/**
	 * Create a module for entities exported under a specific import path
	 *
	 * @param {Package} pkg - the package instance this module belongs to
	 * @param {string} filePath - the (relative) path to the file within the package
	 * @param {string} importPath - the import path of the module. (used for import statements)
	 */
	constructor(pkg, filePath, importPath) {
		this.filePath = filePath;
		this.package = pkg;
		this.importPath = importPath;

		this.package.modules.push(this);
	}

	/**
	 * Add a file to the module and its package.
	 *
	 * @param {File} file - the file to add
	 */
	addFile(file) {
		if (this.includedFilePaths().has(file.path)) {
			return;
		}

		this.files.push(file);
		this.package.files.push(file);
	}

	/**
	 * Returns the paths of all files that are (currently) included in the module.
	 *
	 * @returns {Set<string>} Set of unique file paths that are included in the module
	 */
	includedFilePaths() {
		return new Set(this.files.map((file) => file.path));
	}

	/**
	 * Returns the paths of all files that are imported identifiers in this modules' files.
	 *
	 * @param {Set<string>} files - the files in the package
	 * @returns {Set<string>} Set of unique file paths that are imported by the module
	 */
	importedFilePaths(files) {
		return this.files
			.map((f) => f.importedFilePaths(files))
			.reduce((acc, curr) => acc.union(curr), new Set());
	}

	/**
	 * Returns the paths of all files that are imported by the module but not yet included in the module.
	 *
	 * @param {Set<string>} files - the files in the package
	 * @returns {Set<string>} Set of unique file paths that are imported by the module but not yet included in the module
	 */
	unvisitedFilePaths(files) {
		const visitedFilePaths = this.includedFilePaths();
		const importedFilePaths = this.importedFilePaths(files);
		return importedFilePaths.difference(visitedFilePaths);
	}
}
