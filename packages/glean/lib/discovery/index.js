/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package discovery orchestration - coordinating reconnaissance missions.
 *
 * Ravens coordinate the hunt through surgical delegation. Orchestrate package
 * discovery by combining package metadata intelligence, file system reconnaissance,
 * and dependency relationship mapping into unified territorial awareness.
 */

import { resolve } from "node:path";
import { buildDependencyMap, extractImports } from "./dependency-analyzer.js";
import { findReadmeFiles, scanJavaScriptFiles } from "./file-scanner.js";
import { extractEntryPoints, parsePackageJson } from "./package-metadata.js";

/**
 * Discover all JavaScript files and documentation in a package
 * @param {string} packagePath - Path to the package directory
 * @returns {Promise<{files: string[], readmes: string[], packageJson: any|null, entryPoints: string[]}>}
 */
export async function discoverPackage(packagePath) {
	const absolutePath = resolve(packagePath);

	// Parse package.json to understand entry points
	const packageJson = await parsePackageJson(absolutePath);
	const entryPoints = packageJson ? extractEntryPoints(packageJson) : [];

	// Scan all JavaScript files recursively
	const files = await scanJavaScriptFiles(absolutePath);

	// Find README files
	const readmes = await findReadmeFiles(absolutePath);

	return {
		files,
		readmes,
		packageJson,
		entryPoints,
	};
}

// Re-export all functions to maintain identical public API
export {
	parsePackageJson,
	extractEntryPoints,
	scanJavaScriptFiles,
	findReadmeFiles,
	buildDependencyMap,
	extractImports,
};
