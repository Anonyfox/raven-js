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
 * Implements Node.js resolution algorithm to find packages in node_modules
 * hierarchy and extract their entry points using exports field parsing.
 *
 * @param {string} rootPath - Root directory to start resolution from
 * @returns {Promise<object>} Import map object with bare specifier mappings
 */
export async function generateImportMap(rootPath) {
	// V8 optimization: Object.create(null) for cleaner object shapes
	const importMap = Object.create(null);
	importMap.imports = Object.create(null);

	try {
		const packageJson = await parsePackageJson(rootPath);
		if (!packageJson) {
			return importMap;
		}

		// Process dependencies and devDependencies
		const dependencies = Object.create(null);
		Object.assign(dependencies, packageJson.dependencies || {});
		Object.assign(dependencies, packageJson.devDependencies || {});

		// Resolve each dependency through Node.js algorithm
		for (const packageName of Object.keys(dependencies)) {
			const packagePath = await resolvePackage(packageName, rootPath);
			if (packagePath) {
				const entryPoint = await resolvePackageEntryPoint(packagePath);
				if (entryPoint) {
					// Convert file path to URL path for import map, removing ./ prefix
					const cleanEntryPoint = entryPoint.startsWith("./")
						? entryPoint.slice(2)
						: entryPoint;
					const urlPath = `/node_modules/${packageName}/${cleanEntryPoint}`;
					importMap.imports[packageName] = urlPath;
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
 * Parse package.json from a directory (adapted from glean).
 *
 * @param {string} packagePath - Absolute path to package directory
 * @returns {Promise<any|null>} Parsed package.json or null if not found
 */
async function parsePackageJson(packagePath) {
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
 * Resolves package entry point using exports field or fallbacks.
 *
 * Adapted from glean's extractEntryPoints with simplified logic for
 * import map generation focusing on main entry point only.
 *
 * @param {string} packagePath - Absolute path to package directory
 * @returns {Promise<string|null>} Relative entry point path or null
 */
async function resolvePackageEntryPoint(packagePath) {
	const packageJson = await parsePackageJson(packagePath);
	if (!packageJson) {
		return null;
	}

	// Handle exports field (modern packages)
	if (packageJson.exports) {
		const entryPoint = extractMainFromExports(packageJson.exports);
		if (entryPoint) {
			return normalizePath(entryPoint);
		}
	}

	// Fallback to module field (ESM)
	if (packageJson.module) {
		return normalizePath(packageJson.module);
	}

	// Fallback to main field
	if (packageJson.main) {
		return normalizePath(packageJson.main);
	}

	// Default fallback
	return "index.js";
}

/**
 * Extracts main entry point from exports field.
 *
 * Simplified version of glean's exports parsing focusing on main "." export
 * and ESM conditional exports for import map generation.
 *
 * @param {any} exports - Exports field from package.json
 * @returns {string|null} Main entry point or null
 */
function extractMainFromExports(exports) {
	if (typeof exports === "string") {
		// Sugar syntax: "exports": "./index.js"
		return exports;
	}

	if (typeof exports === "object" && exports !== null) {
		// Use bracket notation to avoid linter issues with Object.create(null)
		const exportsObj = /** @type {Record<string, any>} */ (exports);

		// Check for main export "."
		if (exportsObj["."] !== undefined) {
			return resolveExportTarget(exportsObj["."]);
		}

		// Check for default export if no main
		if (Object.keys(exportsObj).length === 1) {
			const [, value] = Object.entries(exportsObj)[0];
			return resolveExportTarget(value);
		}
	}

	return null;
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
