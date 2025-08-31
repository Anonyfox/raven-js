/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Import map generation from package.json dependencies.
 *
 * Generates import maps by scanning package.json dependencies and resolving
 * entry points through Node.js resolution algorithm. Uses existing glean
 * logic for robust package resolution with modern exports field support.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Generates import map from package.json dependencies.
 *
 * @param {string} cwd - Project root directory (where package.json is located)
 * @returns {Promise<object>} Import map object with bare specifier mappings
 *
 * @example
 * // Generate import map from project dependencies
 * const map = await generateImportMap(process.cwd());
 * // { imports: { "lodash": "/node_modules/lodash/index.js" } }
 */
export async function generateImportMap(cwd) {
	// V8 optimization: Object.create(null) for cleaner object shapes
	const importMap = Object.create(null);
	importMap.imports = Object.create(null);

	try {
		const packageJson = await parsePackageJsonDirect(cwd);
		if (!packageJson) {
			return importMap;
		}

		// Process dependencies and devDependencies
		const dependencies = Object.create(null);
		Object.assign(dependencies, packageJson.dependencies || {});
		Object.assign(dependencies, packageJson.devDependencies || {});

		// Resolve each dependency through Node.js algorithm
		for (const packageName of Object.keys(dependencies)) {
			const packagePath = await resolvePackage(packageName, cwd);
			if (packagePath) {
				const packageExports = await resolvePackageExports(packagePath);

				// Process all exports (main + subpaths)
				for (const [specifier, entryPoint] of Object.entries(packageExports)) {
					if (entryPoint) {
						// Convert file path to URL path for import map, removing ./ prefix
						const cleanEntryPoint = entryPoint.startsWith("./")
							? entryPoint.slice(2)
							: entryPoint;
						const urlPath = `/node_modules/${packageName}/${cleanEntryPoint}`;

						// Generate import map entry
						if (specifier === ".") {
							// Main export: @package/name
							importMap.imports[packageName] = urlPath;
						} else {
							// Subpath export: @package/name/subpath
							const subpath = specifier.startsWith("./")
								? specifier.slice(2)
								: specifier;
							importMap.imports[`${packageName}/${subpath}`] = urlPath;
						}
					}
				}
			}
		}

		return importMap;
	} catch (_error) {
		// Return empty import map on error, let calling code handle
		return importMap;
	}
}

/**
 * Parse package.json from a specific directory.
 *
 * Used for parsing package.json from known directories (project root or node_modules packages).
 *
 * @param {string} packagePath - Absolute path to directory containing package.json
 * @returns {Promise<any|null>} Parsed package.json or null if not found
 */
async function parsePackageJsonDirect(packagePath) {
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
 * Resolves a package using Node.js resolution algorithm.
 *
 * Traverses up directory tree looking for node_modules/packageName,
 * supporting npm workspace configurations with hoisted dependencies.
 *
 * @param {string} packageName - Name of package to resolve
 * @param {string} startPath - Directory to start resolution from
 * @returns {Promise<string|null>} Absolute path to package or null if not found
 */
async function resolvePackage(packageName, startPath) {
	let currentPath = startPath;

	// Traverse up directory tree until root
	while (currentPath !== dirname(currentPath)) {
		const nodeModulesPath = join(currentPath, "node_modules", packageName);

		if (existsSync(nodeModulesPath)) {
			// Verify it's actually a package directory
			const packageJsonPath = join(nodeModulesPath, "package.json");
			if (existsSync(packageJsonPath)) {
				return nodeModulesPath;
			}
		}

		// Move up one directory level
		currentPath = dirname(currentPath);
	}

	return null;
}

/**
 * Extracts all exports from exports field.
 *
 * Processes both main "." export and subpath exports like "./html", "./css"
 * for complete import map generation with subpath support.
 *
 * @param {any} exports - Exports field from package.json
 * @returns {Record<string, string>} Map of export specifiers to entry points
 */
function extractAllExports(exports) {
	const exportMap = Object.create(null);

	if (typeof exports === "string") {
		// Sugar syntax: "exports": "./index.js"
		exportMap["."] = exports;
		return exportMap;
	}

	if (typeof exports === "object" && exports !== null) {
		// Use bracket notation to avoid linter issues with Object.create(null)
		const exportsObj = /** @type {Record<string, any>} */ (exports);

		// Process all export specifiers
		for (const [specifier, target] of Object.entries(exportsObj)) {
			const resolvedTarget = resolveExportTarget(target);
			if (resolvedTarget) {
				exportMap[specifier] = resolvedTarget;
			}
		}
	}

	return exportMap;
}

/**
 * Resolves all package export entries for import map generation.
 *
 * Extracts main export and all subpath exports from modern packages
 * with exports field, with fallback to legacy fields for compatibility.
 *
 * @param {string} packagePath - Absolute path to package directory
 * @returns {Promise<Record<string, string>>} Map of specifiers to entry points
 */
async function resolvePackageExports(packagePath) {
	const packageJson = await parsePackageJsonDirect(packagePath);
	if (!packageJson) {
		return Object.create(null);
	}

	// Handle exports field (modern packages) - includes main + subpaths
	if (packageJson.exports) {
		const allExports = extractAllExports(packageJson.exports);
		const normalizedExports = Object.create(null);

		for (const [specifier, entryPoint] of Object.entries(allExports)) {
			normalizedExports[specifier] = normalizePath(entryPoint);
		}

		// If main export is missing/null but we have a main field, use it as fallback
		if (!normalizedExports["."] && packageJson.main) {
			normalizedExports["."] = normalizePath(packageJson.main);
		}

		return normalizedExports;
	}

	// Fallback for legacy packages - only main export
	const exports = Object.create(null);
	let entryPoint = null;

	// Fallback to module field (ESM)
	if (packageJson.module) {
		entryPoint = normalizePath(packageJson.module);
	}
	// Fallback to main field
	else if (packageJson.main) {
		entryPoint = normalizePath(packageJson.main);
	}
	// Default fallback
	else {
		entryPoint = "index.js";
	}

	exports["."] = entryPoint;
	return exports;
}

/**
 * Resolves export target, handling conditional exports.
 *
 * Focuses on ESM ("import") condition for browser import maps.
 *
 * @param {string|object|null} target - The export target
 * @returns {string|null} Resolved file path or null
 */
function resolveExportTarget(target) {
	if (target === null) {
		return null;
	}

	if (typeof target === "string") {
		return target;
	}

	if (typeof target === "object" && target !== null) {
		// Handle conditional exports with priority for ESM
		const targetObj = /** @type {Record<string, any>} */ (target);
		const conditions = ["import", "default"];

		for (const condition of conditions) {
			if (targetObj[condition]) {
				return resolveExportTarget(targetObj[condition]);
			}
		}
	}

	return null;
}

/**
 * Normalizes a path to ensure it starts with "./".
 *
 * @param {string} path - The path to normalize
 * @returns {string} Normalized path starting with "./"
 */
function normalizePath(path) {
	if (typeof path !== "string") {
		return "";
	}

	// Already normalized
	if (path.startsWith("./")) {
		return path;
	}

	// Add leading ./
	return `./${path}`;
}
