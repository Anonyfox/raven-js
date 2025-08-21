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

import { dirname, join, resolve } from "node:path";
import { buildDependencyMap, extractImports } from "./dependency-analyzer.js";
import { findReadmeFiles, scanJavaScriptFiles } from "./file-scanner.js";
import { extractEntryPoints, parsePackageJson } from "./package-metadata.js";

/**
 * Recursively scan entry points and their dependency tree (no tests)
 * @param {string} packagePath - Package directory path
 * @param {string[]} entryPoints - Entry point file paths from package.json
 * @returns {Promise<string[]>} Array of relevant file paths
 */
async function scanEntryPointDependencies(packagePath, entryPoints) {
	const relevantFiles = new Set();
	const visitedFiles = new Set();
	const { readFile } = await import("node:fs/promises");

	/**
	 * Recursively process a file and its dependencies
	 * @param {string} filePath - File path to process
	 */
	async function processFile(filePath) {
		if (visitedFiles.has(filePath)) {
			return;
		}
		visitedFiles.add(filePath);

		try {
			// Add this file to the relevant files
			relevantFiles.add(filePath);

			// Read and analyze the file
			const content = await readFile(filePath, "utf-8");
			const imports = extractImports(content, packagePath);

			// Process each import recursively
			for (const importPath of imports) {
				// Only include local imports (not node modules)
				if (importPath.startsWith("./") || importPath.startsWith("../")) {
					// Resolve path relative to the current file's directory
					const currentFileDir = dirname(filePath);
					const resolvedPath = resolve(
						currentFileDir,
						importPath.endsWith(".js") ? importPath : `${importPath}.js`,
					);
					await processFile(resolvedPath);
				}
			}
		} catch (error) {
			console.warn(`Could not analyze file ${filePath}:`, error.message);
		}
	}

	// Process each entry point recursively
	for (const entryPoint of entryPoints) {
		const fullPath = join(packagePath, entryPoint);
		await processFile(fullPath);
	}

	return Array.from(relevantFiles);
}

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

	// For packages with exports, only analyze entry points and their dependencies
	// For packages without exports, fall back to scanning all files
	let files;
	if (entryPoints.length > 0) {
		// Only analyze entry points and their dependency tree
		files = await scanEntryPointDependencies(absolutePath, entryPoints);
	} else {
		// Fallback: scan all JavaScript files recursively (excluding tests)
		files = await scanJavaScriptFiles(
			absolutePath,
			["node_modules", ".git", "dist", "build", "test", "tests", "__tests__"],
			true,
		);
		// Filter out test files if no explicit entry points
		files = files.filter(
			(file) =>
				!file.includes(".test.") &&
				!file.includes("test.js") &&
				!file.includes(".spec."),
		);
	}

	// Find README files (graceful for subdirectories, but throw on main directory missing)
	const readmes = await findReadmeFiles(absolutePath, true);

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
