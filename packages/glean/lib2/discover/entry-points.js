/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Entry point extraction from package.json according to Node.js specification.
 *
 * Extracts entry points following the Node.js module resolution algorithm:
 * - "exports" field takes precedence over "main"
 * - Handles conditional exports, wildcard patterns, and path validation
 * - Returns normalized import paths to relative file paths
 */

import { glob } from "./glob.js";
import { pickEntrypointFile } from "./pick-entrypoint-file.js";

/**
 * Extracts and validates entry points from a package.json object, resolving
 * wildcards and validating against actual files.
 *
 * @param {{exports?: any, main?: string, [key: string]: any}} packageJson - The parsed package.json object
 * @param {...(Set<string>)} rest - Optional array of available file paths
 * @returns {Record<string, string>} Map of import paths to actual file paths
 */
export function extractEntryPoints(packageJson, ...rest) {
	if (!packageJson || typeof packageJson !== "object") {
		return {};
	}

	// Get theoretical entry points
	/** @type {Record<string, string>} */
	let entryPoints = {};

	// exports field takes precedence over main
	if (packageJson.exports !== undefined) {
		entryPoints = extractFromExports(packageJson.exports);
	} else if (packageJson.main) {
		entryPoints = {
			".": normalizePath(packageJson.main),
		};
	}

	// Handle different validation modes:
	// - No availableFiles provided: return theoretical entry points (backwards compatibility)
	// - Empty availableFiles array: return empty (no files to validate against)
	// - Available files provided: resolve and validate
	if (rest.length === 0) {
		// No availableFiles parameter provided - backwards compatibility mode
		return entryPoints;
	}

	// availableFiles parameter provided - use validation mode
	const availableFiles = rest[0] || new Set();
	return resolveEntryPoints(entryPoints, availableFiles);
}

/**
 * Extracts entry points from the exports field.
 *
 * @param {string|Record<string, any>} exports - The exports field value
 * @returns {Record<string, string>} Map of import paths to relative file paths
 */
function extractFromExports(exports) {
	if (typeof exports === "string") {
		// Sugar syntax: "exports": "./index.js"
		return {
			".": normalizePath(exports),
		};
	}

	if (typeof exports === "object" && exports !== null) {
		/** @type {Record<string, string>} */
		const result = {};

		for (const [importPath, target] of Object.entries(exports)) {
			const resolvedTarget = resolveExportTarget(target);

			if (resolvedTarget && isValidPath(resolvedTarget)) {
				result[importPath] = normalizePath(resolvedTarget);
			}
		}

		return result;
	}

	return {};
}

/**
 * Resolves export target, handling conditional exports.
 *
 * @param {string|Record<string, any>|null} target - The export target
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
		// Handle conditional exports with priority order
		const conditions = ["import", "default"];

		for (const condition of conditions) {
			if (target[condition]) {
				return resolveExportTarget(target[condition]);
			}
		}

		// If no preferred conditions found, use the first available
		const firstKey = Object.keys(target)[0];
		if (firstKey) {
			return resolveExportTarget(target[firstKey]);
		}
	}

	return null;
}

/**
 * Validates that a path is safe and follows Node.js export rules.
 *
 * @param {string} path - The path to validate
 * @returns {boolean} True if path is valid
 */
function isValidPath(path) {
	if (typeof path !== "string" || path.length === 0) {
		return false;
	}

	// Must not be an absolute path
	if (path.startsWith("/")) {
		return false;
	}

	// Must not contain path traversal
	if (path.includes("../") || path === ".." || path.includes("/..")) {
		return false;
	}

	// Split path and check segments (skip first empty segment from "./" prefix)
	const segments = path.split("/").filter((segment) => segment !== "");
	for (const segment of segments) {
		if (segment === ".." || segment === "node_modules") {
			return false;
		}
		// Allow "." as first segment only (for "./" prefix)
		if (segment === "." && segments[0] !== ".") {
			return false;
		}
	}

	return true;
}

/**
 * Resolves theoretical entry points against actual files, handling wildcards
 * and validating existence.
 *
 * @param {Record<string, string>} entryPoints - Theoretical entry points
 * @param {Set<string>} availableFiles - Available file paths
 * @returns {Record<string, string>} Resolved and validated entry points
 */
function resolveEntryPoints(entryPoints, availableFiles) {
	/** @type {Record<string, string>} */
	const resolved = {};

	for (const [importPath, targetPath] of Object.entries(entryPoints)) {
		if (targetPath.includes("*")) {
			// Handle wildcard patterns
			const matchedFiles = resolveWildcardPattern(targetPath, availableFiles);
			for (const file of matchedFiles) {
				// Create import path by replacing pattern with filename without extension
				const replacement = getPatternReplacement(targetPath, file);
				const cleanReplacement = replacement.replace(/\.(js|mjs|jsx)$/, "");
				const actualImportPath = importPath.replace("*", cleanReplacement);
				resolved[actualImportPath] = file;
			}
		} else {
			// Handle specific file or directory
			const resolvedFile = pickEntrypointFile(availableFiles, targetPath);
			if (resolvedFile) {
				resolved[importPath] = resolvedFile;
			}
		}
	}

	return resolved;
}

/**
 * Resolves wildcard patterns to actual JavaScript files.
 *
 * @param {string} pattern - Wildcard pattern like "./lib/*.js" or "./utils/*"
 * @param {Set<string>} availableFiles - Available file paths
 * @returns {Set<string>} Matching JavaScript files
 */
function resolveWildcardPattern(pattern, availableFiles) {
	return new Set(
		availableFiles
			.values()
			.filter((file) => {
				const matches = glob(pattern, file);
				if (matches) {
					// If pattern has extension, require exact match
					// If pattern is generic (no extension), filter to JavaScript files only
					if (
						pattern.includes(".js") ||
						pattern.includes(".mjs") ||
						pattern.includes(".jsx")
					) {
						return true;
					} else {
						return isJavaScriptFile(file);
					}
				}
				return false;
			})
			.map((file) => `./${file}`),
	);
}

/**
 * Extracts the replacement part from a wildcard match.
 *
 * @param {string} pattern - Original pattern
 * @param {string} file - Matched file
 * @returns {string} Replacement string for the wildcard
 */
function getPatternReplacement(pattern, file) {
	// Remove leading "./" for consistent matching
	const cleanPattern = pattern.startsWith("./") ? pattern.slice(2) : pattern;
	const cleanFile = file.startsWith("./") ? file.slice(2) : file;

	// Find the asterisk position and extract the corresponding part from file
	const asteriskIndex = cleanPattern.indexOf("*");
	if (asteriskIndex === -1) {
		return "";
	}

	const prefix = cleanPattern.slice(0, asteriskIndex);
	const suffix = cleanPattern.slice(asteriskIndex + 1);

	// Extract the part that replaces the asterisk
	if (cleanFile.startsWith(prefix) && cleanFile.endsWith(suffix)) {
		return cleanFile.slice(prefix.length, cleanFile.length - suffix.length);
	}

	return "";
}

/**
 * Checks if a file is a JavaScript file.
 *
 * @param {string} filePath - File path to check
 * @returns {boolean} True if it's a JavaScript file
 */
function isJavaScriptFile(filePath) {
	return /\.(js|mjs|jsx)$/.test(filePath);
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
