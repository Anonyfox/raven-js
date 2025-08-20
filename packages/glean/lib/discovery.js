/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package discovery and file scanning for documentation archaeology.
 *
 * Surgical reconnaissance of JavaScript packages - mapping entry points,
 * dependencies, and documentation targets with predatory precision.
 * No external dependencies, pure Node.js intelligence.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

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

/**
 * Parse package.json from a directory
 * @param {string} packagePath - Absolute path to package directory
 * @returns {Promise<any|null>} Parsed package.json or null if not found
 */
export async function parsePackageJson(packagePath) {
	try {
		const packageJsonPath = join(packagePath, "package.json");
		const content = await readFile(packageJsonPath, "utf-8");
		return JSON.parse(content);
	} catch (_error) {
		// Gracefully handle missing or malformed package.json
		return null;
	}
}

/**
 * Extract entry points from package.json exports field
 * @param {any} packageJson - Parsed package.json content
 * @returns {string[]} Array of entry point file paths
 */
export function extractEntryPoints(packageJson) {
	const entryPoints = [];

	// Handle main field
	if (packageJson.main) {
		entryPoints.push(packageJson.main);
	}

	// Handle module field
	if (packageJson.module) {
		entryPoints.push(packageJson.module);
	}

	// Handle exports field (modern packages)
	if (packageJson.exports) {
		const exports = packageJson.exports;

		if (typeof exports === "string") {
			entryPoints.push(exports);
		} else if (typeof exports === "object") {
			extractExportsRecursively(exports, entryPoints);
		}
	}

	// Default fallback
	if (entryPoints.length === 0) {
		entryPoints.push("index.js");
	}

	return [...new Set(entryPoints)]; // Remove duplicates
}

/**
 * Recursively extract file paths from exports object
 * @param {any} exports - Exports object from package.json
 * @param {string[]} entryPoints - Array to collect entry points
 */
function extractExportsRecursively(exports, entryPoints) {
	for (const [_key, value] of Object.entries(exports)) {
		if (typeof value === "string") {
			entryPoints.push(value);
		} else if (typeof value === "object" && value !== null) {
			// Handle conditional exports like { "import": "./index.js", "require": "./index.cjs" }
			if (value.import) entryPoints.push(value.import);
			if (value.require) entryPoints.push(value.require);
			if (value.default) entryPoints.push(value.default);

			// Recurse for nested exports
			extractExportsRecursively(value, entryPoints);
		}
	}
}

/**
 * Recursively scan for JavaScript files in a directory
 * @param {string} dirPath - Directory path to scan
 * @param {string[]} excludeDirs - Directory names to exclude
 * @returns {Promise<string[]>} Array of JavaScript file paths
 */
export async function scanJavaScriptFiles(
	dirPath,
	excludeDirs = ["node_modules", ".git", "dist", "build"],
) {
	const files = [];

	try {
		const entries = await readdir(dirPath);

		for (const entry of entries) {
			const fullPath = join(dirPath, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				// Skip excluded directories
				if (!excludeDirs.includes(entry)) {
					const subFiles = await scanJavaScriptFiles(fullPath, excludeDirs);
					files.push(...subFiles);
				}
			} else if (stats.isFile()) {
				// Include JavaScript files
				const ext = extname(entry);
				if (ext === ".js" || ext === ".mjs") {
					files.push(fullPath);
				}
			}
		}
	} catch (_error) {
		// Gracefully handle permission errors or missing directories
		// Return empty array - ravens adapt to hostile territory
	}

	return files;
}

/**
 * Find README files in directory tree
 * @param {string} dirPath - Directory path to scan
 * @returns {Promise<string[]>} Array of README file paths
 */
export async function findReadmeFiles(dirPath) {
	const readmes = [];

	try {
		const entries = await readdir(dirPath);

		for (const entry of entries) {
			const fullPath = join(dirPath, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				// Skip node_modules and other build directories
				if (!["node_modules", ".git", "dist", "build"].includes(entry)) {
					const subReadmes = await findReadmeFiles(fullPath);
					readmes.push(...subReadmes);
				}
			} else if (stats.isFile()) {
				// Look for README files (case insensitive)
				const lowerName = entry.toLowerCase();
				if (lowerName.startsWith("readme")) {
					readmes.push(fullPath);
				}
			}
		}
	} catch (_error) {
		// Graceful degradation - territory might be hostile
	}

	return readmes;
}

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
