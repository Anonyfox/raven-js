/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Entry point resolution for ES modules with exports field support.
 *
 * Implements Node.js module resolution algorithm with comprehensive support
 * for modern package.json exports field, legacy main/module fields, and
 * conditional exports. Zero-dependency implementation for maximum reliability.
 *
 * Resolution strategy:
 * 1. Modern exports field (with conditions: import, require, browser, node)
 * 2. Legacy module field (for ESM)
 * 3. Legacy main field (fallback)
 * 4. Default file resolution (index.js)
 */

import { extname, join } from "node:path";
import { fileExists } from "./file-operations.js";

/**
 * Resolves package entry points using modern exports field and legacy fallbacks.
 *
 * Implements full Node.js module resolution with support for conditional exports,
 * subpath patterns, and legacy field resolution. Essential for generating
 * accurate import maps that work across different module systems.
 *
 * **Standards Compliance**: Follows Node.js ESM resolution specification
 * with proper condition handling and subpath resolution.
 *
 * @param {Object} packageJson - Parsed package.json content
 * @param {string} packagePath - Absolute path to package directory
 * @param {Object} [options={}] - Resolution options
 * @param {string} [options.subpath='.'] - Subpath to resolve (e.g., './utils')
 * @param {string[]} [options.conditions=['import', 'browser', 'default']] - Export conditions
 * @param {boolean} [options.preferESM=true] - Prefer ESM over CommonJS
 * @returns {Promise<{success: boolean, entryPoints?: Object, error?: string}>}
 *
 * @example
 * ```javascript
 * const result = await resolveEntryPoints(packageJson, '/node_modules/lodash');
 * if (result.success) {
 *   console.log('Main entry:', result.entryPoints.main);
 *   console.log('All exports:', result.entryPoints.exports);
 * }
 * ```
 */
export async function resolveEntryPoints(
	packageJson,
	packagePath,
	options = {},
) {
	const {
		subpath = ".",
		conditions = ["import", "browser", "default"],
		preferESM = true,
	} = options;

	try {
		const entryPoints = {
			main: null,
			module: null,
			exports: {},
			type: packageJson.type || "commonjs",
		};

		// Step 1: Resolve main entry point
		const mainEntry = await resolveMainEntry(
			packageJson,
			packagePath,
			conditions,
			preferESM,
		);
		if (mainEntry.success) {
			entryPoints.main = mainEntry.path;
			entryPoints.module = mainEntry.modulePath;
		}

		// Step 2: Resolve exports field if present
		if (packageJson.exports) {
			const exportsResult = await resolveExportsField(
				packageJson.exports,
				packagePath,
				subpath,
				conditions,
			);
			if (exportsResult.success) {
				entryPoints.exports = exportsResult.exports;
			}
		}

		// Step 3: If no exports field, create implicit exports from main/module
		if (!packageJson.exports && entryPoints.main) {
			entryPoints.exports["."] = entryPoints.main;
		}

		return {
			success: true,
			entryPoints,
		};
	} catch {
		return {
			success: false,
			error: "Entry point resolution failed",
		};
	}
}

/**
 * Resolves the main entry point using exports, module, and main fields.
 *
 * Implements priority-based resolution with proper condition matching
 * for different module systems. Handles both modern exports and legacy
 * field resolution with appropriate fallback mechanisms.
 *
 * **Algorithm**: Follows Node.js resolution priority with ESM preference
 * and proper condition evaluation for browser/node environments.
 *
 * @param {Object} packageJson - Parsed package.json content
 * @param {string} packagePath - Package directory path
 * @param {string[]} conditions - Export conditions to match
 * @param {boolean} preferESM - Whether to prefer ESM over CommonJS
 * @returns {Promise<{success: boolean, path?: string, modulePath?: string}>}
 *
 * @example
 * ```javascript
 * const result = await resolveMainEntry(packageJson, '/node_modules/react');
 * // Returns: { success: true, path: '/node_modules/react/index.js', modulePath: '/node_modules/react/esm/index.js' }
 * ```
 */
export async function resolveMainEntry(
	packageJson,
	packagePath,
	conditions,
	preferESM,
) {
	try {
		let mainPath = null;
		let modulePath = null;

		// Step 1: Try exports field with "." subpath
		if (packageJson.exports) {
			const exportsResult = await resolveExportsSubpath(
				packageJson.exports,
				packagePath,
				".",
				conditions,
			);
			if (exportsResult.success) {
				mainPath = exportsResult.path;
			}
		}

		// Step 2: Try module field (ESM preference)
		if (!mainPath && packageJson.module) {
			const moduleFile = join(packagePath, packageJson.module);
			if (await fileExists(moduleFile)) {
				modulePath = moduleFile;
				if (preferESM) {
					mainPath = moduleFile;
				}
			}
		}

		// Step 3: Try main field
		if (!mainPath && packageJson.main) {
			const mainFile = join(packagePath, packageJson.main);
			if (await fileExists(mainFile)) {
				mainPath = mainFile;
			}
		}

		// Step 4: Default file resolution
		if (!mainPath) {
			const defaultEntry = await resolveDefaultEntry(packagePath);
			if (defaultEntry.success) {
				mainPath = defaultEntry.path;
			}
		}

		return {
			success: !!mainPath,
			path: mainPath,
			modulePath: modulePath || mainPath,
		};
	} catch {
		return {
			success: false,
		};
	}
}

/**
 * Resolves the exports field with comprehensive subpath and condition support.
 *
 * Implements full exports field resolution including conditional exports,
 * subpath patterns, wildcards, and nested object structures. Critical for
 * modern package compatibility and proper ESM import map generation.
 *
 * **Specification**: Follows Node.js package exports specification with
 * support for all defined patterns and condition types.
 *
 * @param {Object|string} exports - Package exports field value
 * @param {string} packagePath - Package directory path
 * @param {string} subpath - Requested subpath (e.g., '.' or './utils')
 * @param {string[]} conditions - Export conditions to match
 * @returns {Promise<{success: boolean, exports?: Object}>}
 *
 * @example
 * ```javascript
 * const exports = {
 *   ".": {
 *     "import": "./esm/index.js",
 *     "require": "./cjs/index.js"
 *   },
 *   "./utils": "./utils/index.js"
 * };
 * const result = await resolveExportsField(exports, packagePath, '.', ['import']);
 * ```
 */
export async function resolveExportsField(
	exports,
	packagePath,
	subpath,
	conditions,
) {
	try {
		const resolvedExports = {};

		if (typeof exports === "string") {
			// Simple string export
			const resolvedPath = join(packagePath, exports);
			if (await fileExists(resolvedPath)) {
				resolvedExports["."] = resolvedPath;
			}
		} else if (Array.isArray(exports)) {
			// Array of exports (fallback mechanism)
			for (const exportItem of exports) {
				const result = await resolveExportsField(
					exportItem,
					packagePath,
					subpath,
					conditions,
				);
				if (result.success) {
					Object.assign(resolvedExports, result.exports);
					break; // Use first successful resolution
				}
			}
		} else if (exports && typeof exports === "object") {
			// Object exports with subpaths and conditions
			for (const [key, value] of Object.entries(exports)) {
				if (key.startsWith(".")) {
					// Subpath export
					const resolvedSubpath = await resolveExportsSubpath(
						{ [key]: value },
						packagePath,
						key,
						conditions,
					);
					if (resolvedSubpath.success) {
						resolvedExports[key] = resolvedSubpath.path;
					}
				} else {
					// Conditional export at root level
					const resolved = await resolveConditionalExport(
						value,
						packagePath,
						conditions,
					);
					if (resolved.success) {
						resolvedExports["."] = resolved.path;
					}
				}
			}
		}

		return {
			success: Object.keys(resolvedExports).length > 0,
			exports: resolvedExports,
		};
	} catch {
		return {
			success: false,
			exports: {},
		};
	}
}

/**
 * Resolves a specific subpath from the exports field.
 *
 * Handles subpath resolution with pattern matching, wildcard support,
 * and proper condition evaluation. Essential for resolving deep imports
 * and package submodules in ESM import maps.
 *
 * **Pattern Matching**: Supports wildcard patterns like './lib/*' with
 * proper substitution and validation of resolved paths.
 *
 * @param {Object} exports - Exports object
 * @param {string} packagePath - Package directory path
 * @param {string} subpath - Subpath to resolve
 * @param {string[]} conditions - Export conditions
 * @returns {Promise<{success: boolean, path?: string}>}
 *
 * @example
 * ```javascript
 * const exports = { "./utils/*": "./lib/utils/*.js" };
 * const result = await resolveExportsSubpath(exports, packagePath, './utils/format', ['import']);
 * // Resolves to: packagePath + '/lib/utils/format.js'
 * ```
 */
export async function resolveExportsSubpath(
	exports,
	packagePath,
	subpath,
	conditions,
) {
	try {
		// Step 1: Direct subpath match
		if (exports[subpath]) {
			const resolved = await resolveConditionalExport(
				exports[subpath],
				packagePath,
				conditions,
			);
			if (resolved.success) {
				return resolved;
			}
		}

		// Step 2: Pattern matching for wildcard subpaths
		for (const [exportPath, exportValue] of Object.entries(exports)) {
			if (exportPath.includes("*")) {
				const match = matchWildcardPattern(exportPath, subpath);
				if (match.matches) {
					const resolvedValue = await resolveWildcardExport(
						exportValue,
						packagePath,
						match.captured,
						conditions,
					);
					if (resolvedValue.success) {
						return resolvedValue;
					}
				}
			}
		}

		return {
			success: false,
		};
	} catch {
		return {
			success: false,
		};
	}
}

/**
 * Resolves conditional exports based on environment conditions.
 *
 * Implements condition-based export resolution for different environments
 * (import/require, browser/node, etc.). Critical for proper module format
 * selection in diverse runtime environments.
 *
 * **Condition Priority**: Evaluates conditions in order of preference
 * with proper fallback to 'default' condition when specific conditions
 * are not available.
 *
 * @param {Object|string} exportValue - Export value with conditions
 * @param {string} packagePath - Package directory path
 * @param {string[]} conditions - Ordered list of conditions to match
 * @returns {Promise<{success: boolean, path?: string}>}
 *
 * @example
 * ```javascript
 * const exportValue = {
 *   "import": "./esm/index.js",
 *   "require": "./cjs/index.js",
 *   "default": "./index.js"
 * };
 * const result = await resolveConditionalExport(exportValue, packagePath, ['import', 'default']);
 * ```
 */
export async function resolveConditionalExport(
	exportValue,
	packagePath,
	conditions,
) {
	try {
		if (typeof exportValue === "string") {
			// Simple string value
			const resolvedPath = join(packagePath, exportValue);
			if (await fileExists(resolvedPath)) {
				return {
					success: true,
					path: resolvedPath,
				};
			}
		} else if (Array.isArray(exportValue)) {
			// Array of fallback values
			for (const item of exportValue) {
				const result = await resolveConditionalExport(
					item,
					packagePath,
					conditions,
				);
				if (result.success) {
					return result;
				}
			}
		} else if (exportValue && typeof exportValue === "object") {
			// Conditional object
			for (const condition of conditions) {
				if (exportValue[condition]) {
					const result = await resolveConditionalExport(
						exportValue[condition],
						packagePath,
						conditions,
					);
					if (result.success) {
						return result;
					}
				}
			}

			// Try 'default' condition as fallback
			if (exportValue.default) {
				const result = await resolveConditionalExport(
					exportValue.default,
					packagePath,
					conditions,
				);
				if (result.success) {
					return result;
				}
			}
		}

		return {
			success: false,
		};
	} catch {
		return {
			success: false,
		};
	}
}

/**
 * Resolves default entry points when no explicit main field is specified.
 *
 * Implements standard Node.js file resolution algorithm with extension
 * inference and index file resolution. Provides fallback behavior for
 * packages without explicit entry point configuration.
 *
 * **Resolution Order**: index.js, index.mjs, index.cjs, package.json
 * with proper extension inference and directory traversal.
 *
 * @param {string} packagePath - Package directory path
 * @returns {Promise<{success: boolean, path?: string}>}
 *
 * @example
 * ```javascript
 * const result = await resolveDefaultEntry('/node_modules/some-package');
 * // Checks: index.js, index.mjs, index.cjs in order
 * ```
 */
export async function resolveDefaultEntry(packagePath) {
	const candidates = [
		"index.js",
		"index.mjs",
		"index.cjs",
		"index.jsx",
		"index.ts", // For development scenarios
		"index.tsx", // For development scenarios
	];

	for (const candidate of candidates) {
		const candidatePath = join(packagePath, candidate);
		if (await fileExists(candidatePath)) {
			return {
				success: true,
				path: candidatePath,
			};
		}
	}

	return {
		success: false,
	};
}

/**
 * Validates that a resolved entry point file actually exists and is accessible.
 *
 * Performs comprehensive validation of resolved entry points including
 * file existence, accessibility, and basic format validation. Essential
 * for ensuring import map reliability in production environments.
 *
 * **Security**: Validates file paths and prevents serving of invalid
 * or potentially dangerous file types through the ESM resolver.
 *
 * @param {string} entryPath - Resolved entry point file path
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.requireJSExtension=true] - Require .js/.mjs/.cjs extension
 * @returns {Promise<{valid: boolean, error?: string}>}
 *
 * @example
 * ```javascript
 * const result = await validateEntryPoint('/node_modules/lodash/index.js');
 * if (result.valid) {
 *   console.log('Entry point is valid');
 * }
 * ```
 */
export async function validateEntryPoint(entryPath, options = {}) {
	const { requireJSExtension = true } = options;

	try {
		// Step 1: Validate input type
		if (typeof entryPath !== "string" || entryPath.length === 0) {
			return {
				valid: false,
				error: "Entry point validation failed",
			};
		}

		// Step 2: Basic path validation (before file operations)
		if (entryPath.includes("..") || entryPath.includes("\x00")) {
			return {
				valid: false,
				error: "Invalid entry point path",
			};
		}

		// Step 3: Check file existence
		if (!(await fileExists(entryPath))) {
			return {
				valid: false,
				error: "Entry point file does not exist",
			};
		}

		// Step 4: Validate file extension if required
		if (requireJSExtension) {
			const ext = extname(entryPath).toLowerCase();
			const validExtensions = [".js", ".mjs", ".cjs", ".jsx"];
			if (!validExtensions.includes(ext)) {
				return {
					valid: false,
					error: "Invalid entry point file extension",
				};
			}
		}

		return {
			valid: true,
		};
	} catch {
		return {
			valid: false,
			error: "Entry point validation failed",
		};
	}
}

/**
 * Creates standardized entry point metadata for import map generation.
 *
 * Normalizes entry point information into a consistent format for
 * import map builders. Includes path resolution, format detection,
 * and metadata extraction for reliable module serving.
 *
 * **Standardization**: Ensures consistent entry point representation
 * regardless of package.json format or resolution method used.
 *
 * @param {string} packageName - Package name
 * @param {string} entryPath - Resolved entry point path
 * @param {Object} [metadata={}] - Additional metadata
 * @returns {Object} Standardized entry point metadata
 *
 * @example
 * ```javascript
 * const entry = createEntryPointMetadata('lodash', '/node_modules/lodash/index.js', {
 *   type: 'module',
 *   subpath: '.'
 * });
 * // Returns: { packageName: 'lodash', path: '...', subpath: '.', ... }
 * ```
 */
export function createEntryPointMetadata(
	packageName,
	entryPath,
	metadata = {},
) {
	const extension = extname(entryPath).toLowerCase();
	const isESM = extension === ".mjs" || metadata.type === "module";

	return {
		packageName,
		path: entryPath,
		subpath: metadata.subpath || ".",
		extension,
		isESM,
		format: isESM ? "esm" : "cjs",
		type: metadata.type || "commonjs",
		browser: metadata.browser || false,
		conditions: metadata.conditions || [],
		...metadata,
	};
}

// Helper Functions

/**
 * Matches a wildcard pattern against a subpath.
 *
 * @param {string} pattern - Pattern with wildcards (e.g., './lib/*')
 * @param {string} subpath - Subpath to match
 * @returns {{matches: boolean, captured?: string}} Match result
 */
function matchWildcardPattern(pattern, subpath) {
	// Convert pattern to regex, escaping special chars except *
	const escapedPattern = pattern
		.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, "(.*)");

	const regex = new RegExp(`^${escapedPattern}$`);
	const match = subpath.match(regex);

	if (match) {
		return {
			matches: true,
			captured: match[1] || "",
		};
	}

	return {
		matches: false,
	};
}

/**
 * Resolves a wildcard export by substituting captured patterns.
 *
 * @param {string|Object} exportValue - Export value with wildcards
 * @param {string} packagePath - Package directory path
 * @param {string} captured - Captured wildcard content
 * @param {string[]} conditions - Export conditions
 * @returns {Promise<{success: boolean, path?: string}>}
 */
async function resolveWildcardExport(
	exportValue,
	packagePath,
	captured,
	conditions,
) {
	try {
		if (typeof exportValue === "string") {
			// Substitute wildcard in string
			const resolvedValue = exportValue.replace(/\*/g, captured);
			const resolvedPath = join(packagePath, resolvedValue);

			if (await fileExists(resolvedPath)) {
				return {
					success: true,
					path: resolvedPath,
				};
			}
		} else if (exportValue && typeof exportValue === "object") {
			// Substitute wildcards in conditional object
			const substitutedValue = {};
			for (const [key, value] of Object.entries(exportValue)) {
				if (typeof value === "string") {
					substitutedValue[key] = value.replace(/\*/g, captured);
				} else {
					substitutedValue[key] = value;
				}
			}

			return await resolveConditionalExport(
				substitutedValue,
				packagePath,
				conditions,
			);
		}

		return {
			success: false,
		};
	} catch {
		return {
			success: false,
		};
	}
}

/**
 * Extracts all possible subpaths from an exports field.
 *
 * @param {Object} exports - Package exports field
 * @returns {string[]} Array of available subpaths
 */
export function extractExportSubpaths(exports) {
	const subpaths = [];

	if (typeof exports === "string") {
		subpaths.push(".");
	} else if (exports && typeof exports === "object") {
		for (const key of Object.keys(exports)) {
			if (key.startsWith(".")) {
				subpaths.push(key);
			}
		}
	}

	return subpaths;
}
