/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dependency relationship mapping - surgical analysis of import/export connections.
 *
 * Ravens understand territory through relationship networks. Parse import statements
 * with predatory precision to map file dependencies without external parsers,
 * targeting modern ESM patterns exclusively.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

/**
 * Build file dependency map from import/export statements
 * @param {string[]} files - Array of JavaScript file paths
 * @returns {Promise<Map<string, string[]>>} Map of file to its dependencies
 */
export async function buildDependencyMap(files) {
	const dependencyMap = new Map();

	for (const file of files) {
		try {
			const content = await readFile(file, "utf-8");
			const dependencies = extractImports(content, dirname(file));
			dependencyMap.set(file, dependencies);
		} catch (_error) {
			// Handle files that can't be read
			dependencyMap.set(file, []);
		}
	}

	return dependencyMap;
}

/**
 * Extract import paths from JavaScript file content
 * @param {string} content - JavaScript file content
 * @param {string} basePath - Base directory for resolving relative imports
 * @returns {string[]} Array of imported file paths
 */
export function extractImports(content, basePath) {
	const imports = [];

	// Match ES6 imports: import ... from "path"
	const importRegex = /import\s+.*?\s+from\s+["']([^"']+)["']/g;
	let match;

	match = importRegex.exec(content);
	while (match !== null) {
		const importPath = match[1];

		// Only process relative imports (starting with . or ..)
		if (importPath.startsWith(".")) {
			const resolvedPath = resolve(basePath, importPath);
			imports.push(resolvedPath);
		}

		match = importRegex.exec(content);
	}

	// Match dynamic imports: import("path")
	const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

	match = dynamicImportRegex.exec(content);
	while (match !== null) {
		const importPath = match[1];

		if (importPath.startsWith(".")) {
			const resolvedPath = resolve(basePath, importPath);
			imports.push(resolvedPath);
		}

		match = dynamicImportRegex.exec(content);
	}

	return imports;
}
