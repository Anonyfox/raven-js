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

import { glob } from "../fsutils/glob.js";
import { pickEntrypointFile } from "../fsutils/pick-entrypoint-file.js";

/**
 * Extracts and validates entry points from a package.json object, resolving
 * wildcards and validating against actual files.
 *
 * **Design Intent**: Entry points define how external code can import from a package.
 * This function REQUIRES file validation to ensure only real, existing files are
 * included in the results. This prevents broken imports and ensures the module
 * graph accurately reflects the package's public API.
 *
 * **Mandatory Validation**: The availableFiles parameter is REQUIRED (not optional).
 * This enforces that entry points are always validated against actual files,
 * preventing theoretical or non-existent entry points from being returned.
 *
 * **Critical Rule**: Only returns entry points that correspond to actual files.
 * If a package.json declares an entry point but the file doesn't exist, it's excluded
 * from the results. This ensures consumers can reliably import from the returned paths.
 *
 * @param {{exports?: any, main?: string, [key: string]: any}} packageJson - The parsed package.json object
 * @param {Set<string>} availableFiles - MANDATORY set of available file paths for validation (throws if missing)
 * @returns {Record<string, string>} Map of import paths to actual validated file paths
 * @throws {TypeError} If availableFiles is not provided or not a Set
 * @example
 * // Given package.json with "main": "./lib/index.js"
 * // and availableFiles containing "./lib/index.js"
 * // Returns: { ".": "./lib/index.js" }
 * //
 * // If the file doesn't exist, returns: {}
 */
export function extractEntryPoints(packageJson, availableFiles) {
	if (!packageJson || typeof packageJson !== "object") {
		return {};
	}

	if (!availableFiles || !(availableFiles instanceof Set)) {
		throw new TypeError("availableFiles parameter must be a Set");
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

	// Resolve and validate entry points against available files
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
		// Only handle import condition - eliminate default fallback complexity
		if (target.import) {
			return resolveExportTarget(target.import);
		}
		// Skip all other conditional exports - not worth the complexity
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
	// Simplified path validation - eliminate edge cases
	return (
		typeof path === "string" &&
		path.length > 0 &&
		!path.startsWith("/") &&
		!path.includes("../") &&
		!path.includes("node_modules")
	);
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
	// Simplified pattern replacement - assume normalized inputs
	const cleanPattern = pattern.slice(2); // Assume pattern starts with "./"
	const cleanFile = file.slice(2); // Assume file starts with "./"

	const asteriskIndex = cleanPattern.indexOf("*");
	const prefix = cleanPattern.slice(0, asteriskIndex);
	const suffix = cleanPattern.slice(asteriskIndex + 1);

	// Extract the part that replaces the asterisk (assume valid inputs)
	return cleanFile.slice(prefix.length, cleanFile.length - suffix.length);
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
