/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package and module discovery with dependency tracking.
 *
 * Single pass over the package folder to collect files, modules, and dependencies
 * for downstream JSDoc extraction processing.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { extractImageAssets } from "../assets/extractor.js";
import { listFiles } from "./fsutils/list-files.js";
import { File } from "./models/file.js";
import { Module } from "./models/module.js";
import { Package } from "./models/package.js";

/**
 * Discover package and modules with dependency tracking for JSDoc extraction.
 *
 * Single pass collection of files, modules, and dependencies from package folder,
 * minimizing disk access for downstream processing.
 *
 * @param {string} packagePath - the path to the package root directory
 * @returns {Package} the package abstraction with modules and dependency graph
 *
 * @example
 * // Basic package discovery
 * const pkg = discover('./my-package');
 * console.log(pkg.name, pkg.modules.length);
 *
 * @example
 * // Module inspection
 * pkg.modules.forEach(module => {
 *   console.log(module.importPath, module.files.length);
 * });
 */
export const discover = (packagePath) => {
	// start with a single pass of listing all files in the package folder recursively
	const files = listFiles(packagePath);

	// normalize file paths by removing ./ prefix for entry point resolution
	const normalizedFiles = new Set(
		Array.from(files).map((path) => path.slice(2)), // Assume all paths start with "./"
	);

	// construct the package abstraction - throw if not found explicitly
	const pkgJsonStr = readFileSync(join(packagePath, "package.json"), "utf-8");
	const pkg = new Package(pkgJsonStr, normalizedFiles);

	// read package README if it exists
	const packageReadmePath = join(packagePath, "README.md");
	if (existsSync(packageReadmePath)) {
		pkg.readme = readFileSync(packageReadmePath, "utf-8");
		// extract image assets from package README
		pkg.imageAssets = extractImageAssets(pkg.readme, packagePath);
	}

	// for every entrypoint there will be a module in this package
	for (const [importPath, filePath] of Object.entries(pkg.entryPoints)) {
		// Convert relative import path to full package import path
		const fullImportPath =
			importPath === "." ? pkg.name : `${pkg.name}${importPath.slice(1)}`;
		const module = new Module(pkg, filePath, fullImportPath);

		// read module README if it exists in the same directory as the entry file
		const moduleDir = dirname(join(packagePath, filePath));
		const moduleReadmePath = join(moduleDir, "README.md");
		if (existsSync(moduleReadmePath)) {
			module.readme = readFileSync(moduleReadmePath, "utf-8");
			// extract image assets from module README
			module.imageAssets = extractImageAssets(module.readme, moduleDir);
		}

		// add the initial file as a starting point for the module
		module.addFile(
			new File(filePath, readFileSync(join(packagePath, filePath), "utf-8")),
		);
	}

	// now collect all identifiers from all files in the package that are publicly
	// exported so we know which files to include in the public API
	for (const mod of pkg.modules) {
		let unvisitedFilePaths = Array.from(
			mod.unvisitedFilePaths(normalizedFiles),
		);
		while (unvisitedFilePaths.length > 0) {
			const filePath = unvisitedFilePaths.shift();

			// if the file is already known, add it to the module and continue
			const existingFile = pkg.getExistingFile(filePath);
			if (existingFile) {
				mod.addFile(existingFile);
			} else {
				mod.addFile(
					new File(
						filePath,
						readFileSync(join(packagePath, filePath), "utf-8"),
					),
				);
			}

			// update the unvisited file paths for the next iteration
			unvisitedFilePaths = Array.from(mod.unvisitedFilePaths(normalizedFiles));
		}
	}

	return pkg;
};
