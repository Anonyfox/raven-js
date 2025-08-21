/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Discover the package and its modules.
 *
 * intended as a single pass over the package folder to collect all files and
 * modules and their dependencies - so the files to be processed later on are
 * already known, as well as basic package informations we care about.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { listFiles } from "./fsutils/list-files.js";
import { File } from "./models/file.js";
import { Module } from "./models/module.js";
import { Package } from "./models/package.js";
import { extractIdentifiers } from "./parser/extract-identifiers.js";

/**
 * Discover the package and its modules.
 *
 * intended as a single pass over the package folder to collect all files and
 * modules and their dependencies - so the files to be processed later on are
 * already known, as well as basic package informations we care about.
 *
 * minimizes actual disk access as good as possible and is the input for the
 * actual JSDoc extraction in the next phase.
 *
 * @param {string} packagePath - the path to the package root directory
 * @returns {Package} the package abstraction
 */
export const discover = (packagePath) => {
	// start with a single pass of listing all files in the package folder recursively
	const files = listFiles(packagePath);

	// construct the package abstraction - throw if not found explicitly
	const pkgJsonStr = readFileSync(join(packagePath, "package.json"), "utf-8");
	const pkg = new Package(pkgJsonStr, files);

	// read package README if it exists
	const packageReadmePath = join(packagePath, "README.md");
	if (existsSync(packageReadmePath)) {
		pkg.readme = readFileSync(packageReadmePath, "utf-8");
	}

	// for every entrypoint there will be a module in this package
	for (const [importPath, filePath] of Object.entries(pkg.entryPoints)) {
		const module = new Module(pkg, filePath, importPath);

		// read module README if it exists in the same directory as the entry file
		const moduleDir = dirname(join(packagePath, filePath));
		const moduleReadmePath = join(moduleDir, "README.md");
		if (existsSync(moduleReadmePath)) {
			module.readme = readFileSync(moduleReadmePath, "utf-8");
		}

		// add the initial file as a starting point for the module
		const file = new File(filePath, readFileSync(filePath, "utf-8"));
		file.identifiers = extractIdentifiers(file.text);
		module.addFile(file);
	}

	// now collect all identifiers from all files in the package that are publicly
	// exported so we know which files to include in the public API
	for (const mod of pkg.modules) {
		let unvisitedFilePaths = Array.from(mod.unvisitedFilePaths(files));
		while (unvisitedFilePaths.length > 0) {
			const filePath = unvisitedFilePaths.shift();

			// if the file is already known, add it to the module and continue
			const existingFile = pkg.getExistingFile(filePath);
			if (existingFile) {
				mod.addFile(existingFile);
			} else {
				const file = new File(filePath, readFileSync(filePath, "utf-8"));
				file.identifiers = extractIdentifiers(file.text);
				mod.addFile(file);
			}

			// update the unvisited file paths for the next iteration
			unvisitedFilePaths = Array.from(mod.unvisitedFilePaths(files));
		}
	}

	return pkg;
};
