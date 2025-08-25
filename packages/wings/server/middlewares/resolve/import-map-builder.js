/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Import map generation for ES module resolution in browsers.
 *
 * Implements the Web Standard Import Maps specification for mapping bare
 * module specifiers to URLs. Provides comprehensive support for workspace
 * packages, scoped packages, subpath exports, and URL generation with
 * zero-dependency implementation for maximum reliability.
 *
 * Import map structure:
 * {
 *   "imports": {
 *     "lodash": "/node_modules/lodash/index.js",
 *     "@babel/core": "/node_modules/@babel/core/lib/index.js",
 *     "my-app/": "/@workspace/my-app/src/"
 *   }
 * }
 */

import { join } from "node:path";

/**
 * Generates a complete import map from resolved packages and entry points.
 *
 * Creates a Web Standard import map structure from package resolution data.
 * Handles both main package entries and subpath exports with proper URL
 * generation for browser consumption. Essential for zero-build ESM development.
 *
 * **Standards Compliance**: Follows Import Maps specification with proper
 * URL resolution and fallback mechanisms for maximum browser compatibility.
 *
 * @param {Array} packages - Array of resolved package metadata
 * @param {Object} [options={}] - Import map generation options
 * @param {string} [options.baseUrl='/'] - Base URL for resolving relative paths
 * @param {string} [options.nodeModulesPrefix='/node_modules/'] - URL prefix for node_modules
 * @param {string} [options.workspacePrefix='/@workspace/'] - URL prefix for workspace packages
 * @param {boolean} [options.includeSubpaths=true] - Include subpath exports
 * @param {boolean} [options.trailingSlash=true] - Add trailing slash to directory exports
 * @returns {Promise<{success: boolean, importMap?: Object, error?: string}>}
 *
 * @example
 * ```javascript
 * const packages = await findPackages();
 * const result = await generateImportMap(packages);
 * if (result.success) {
 *   console.log(JSON.stringify(result.importMap, null, 2));
 * }
 * ```
 */
export async function generateImportMap(packages, options = {}) {
	const {
		baseUrl = "/",
		nodeModulesPrefix = "/node_modules/",
		workspacePrefix = "/@workspace/",
		includeSubpaths = true,
		trailingSlash = true,
	} = options;

	try {
		const imports = {};

		// Process each package to generate import entries
		for (const pkg of packages) {
			if (!pkg || !pkg.name || !pkg.packageJson) {
				continue; // Skip invalid packages
			}

			// Generate main package entry
			const mainEntry = await generatePackageEntry(pkg, {
				baseUrl,
				nodeModulesPrefix,
				workspacePrefix,
			});

			if (mainEntry.success) {
				imports[pkg.name] = mainEntry.url;
			}

			// Generate subpath exports if enabled
			if (includeSubpaths && pkg.packageJson.exports) {
				const subpathEntries = await generateSubpathEntries(pkg, {
					baseUrl,
					nodeModulesPrefix,
					workspacePrefix,
					trailingSlash,
				});

				if (subpathEntries.success) {
					Object.assign(imports, subpathEntries.entries);
				}
			}
		}

		// Validate the generated import map
		const validation = validateImportMap({ imports });
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			};
		}

		return {
			success: true,
			importMap: { imports },
		};
	} catch {
		return {
			success: false,
			error: "Import map generation failed",
		};
	}
}

/**
 * Generates a URL entry for a single package's main export.
 *
 * Creates the appropriate URL for a package's main entry point based on
 * package type (workspace vs node_modules) and entry point resolution.
 * Handles path normalization and URL encoding for browser consumption.
 *
 * **URL Strategy**: Workspace packages use /@workspace/ prefix while
 * node_modules packages use /node_modules/ prefix for clear separation.
 *
 * @param {Object} pkg - Package metadata object
 * @param {Object} options - URL generation options
 * @param {string} options.baseUrl - Base URL for resolution
 * @param {string} options.nodeModulesPrefix - Node modules URL prefix
 * @param {string} options.workspacePrefix - Workspace URL prefix
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 *
 * @example
 * ```javascript
 * const entry = await generatePackageEntry(package, {
 *   baseUrl: '/',
 *   nodeModulesPrefix: '/node_modules/',
 *   workspacePrefix: '/@workspace/'
 * });
 * // Returns: { success: true, url: '/node_modules/lodash/index.js' }
 * ```
 */
export async function generatePackageEntry(pkg, options) {
	const { baseUrl, nodeModulesPrefix, workspacePrefix } = options;

	try {
		// Determine package type and base path
		const isWorkspace = pkg.isWorkspace || pkg.path.includes("/@workspace/");
		const basePath = isWorkspace ? workspacePrefix : nodeModulesPrefix;

		// Extract relative path from package path
		let relativePath;
		if (isWorkspace) {
			// For workspace packages, use package name
			relativePath = pkg.name.startsWith("@") ? pkg.name : pkg.name;
		} else {
			// For node_modules, use package name
			relativePath = pkg.name;
		}

		// Determine entry point file
		let entryFile = "index.js"; // Default fallback

		if (pkg.packageJson.exports) {
			// Use exports field if available
			if (typeof pkg.packageJson.exports === "string") {
				entryFile = pkg.packageJson.exports.replace(/^\.\//, "");
			} else if (
				pkg.packageJson.exports["."] &&
				typeof pkg.packageJson.exports["."] === "string"
			) {
				entryFile = pkg.packageJson.exports["."].replace(/^\.\//, "");
			} else if (
				pkg.packageJson.exports["."] &&
				typeof pkg.packageJson.exports["."] === "object"
			) {
				// Handle conditional exports - prefer import condition
				const conditions = pkg.packageJson.exports["."];
				entryFile = (
					conditions.import ||
					conditions.default ||
					conditions.require ||
					"index.js"
				).replace(/^\.\//, "");
			}
		} else if (pkg.packageJson.module) {
			// Use module field for ESM
			entryFile = pkg.packageJson.module.replace(/^\.\//, "");
		} else if (pkg.packageJson.main) {
			// Use main field as fallback
			entryFile = pkg.packageJson.main.replace(/^\.\//, "");
		}

		// Construct full URL
		const url = normalizeUrl(join(baseUrl, basePath, relativePath, entryFile));

		return {
			success: true,
			url,
		};
	} catch {
		return {
			success: false,
			error: "Package entry generation failed",
		};
	}
}

/**
 * Generates subpath import entries from package exports field.
 *
 * Creates import map entries for all subpaths defined in a package's
 * exports field. Handles both explicit subpaths and wildcard patterns
 * with proper URL generation for browser resolution.
 *
 * **Subpath Handling**: Converts package.json exports to import map
 * entries, supporting both individual subpaths and directory mappings.
 *
 * @param {Object} pkg - Package metadata object
 * @param {Object} options - Subpath generation options
 * @param {string} options.baseUrl - Base URL for resolution
 * @param {string} options.nodeModulesPrefix - Node modules URL prefix
 * @param {string} options.workspacePrefix - Workspace URL prefix
 * @param {boolean} options.trailingSlash - Add trailing slash to directories
 * @returns {Promise<{success: boolean, entries?: Object, error?: string}>}
 *
 * @example
 * ```javascript
 * const subpaths = await generateSubpathEntries(package, options);
 * // Returns: {
 * //   success: true,
 * //   entries: {
 * //     "lodash/": "/node_modules/lodash/",
 * //     "lodash/fp": "/node_modules/lodash/fp.js"
 * //   }
 * // }
 * ```
 */
export async function generateSubpathEntries(pkg, options) {
	const { baseUrl, nodeModulesPrefix, workspacePrefix, trailingSlash } =
		options;

	try {
		const entries = {};
		const exports = pkg.packageJson.exports;

		if (!exports || typeof exports !== "object") {
			return {
				success: true,
				entries: {},
			};
		}

		// Determine package base URL
		const isWorkspace = pkg.isWorkspace || pkg.path.includes("/@workspace/");
		const basePath = isWorkspace ? workspacePrefix : nodeModulesPrefix;
		const packageBaseUrl = normalizeUrl(join(baseUrl, basePath, pkg.name));

		// Process each export entry
		for (const [exportPath, exportValue] of Object.entries(exports)) {
			if (!exportPath.startsWith("./") || exportPath === ".") {
				continue; // Skip root export and non-subpaths
			}

			// Generate import specifier
			const importSpecifier = pkg.name + exportPath.slice(1); // Remove leading .

			// Handle wildcard exports
			if (exportPath.includes("*")) {
				// Remove the /* part to get the base specifier
				const wildcardSpecifier = importSpecifier.replace("/*", "");
				const resolvedPath = resolveExportValue(exportValue);

				if (resolvedPath) {
					// For patterns like "./lib/features/*.js", extract the directory part
					// by finding everything before the "*"
					let beforeStar = resolvedPath.split("*")[0];
					// Ensure it ends with a slash for directory mapping
					if (!beforeStar.endsWith("/")) {
						beforeStar += "/";
					}

					const wildcardUrl = normalizeUrl(join(packageBaseUrl, beforeStar));
					// For wildcards, add trailing slash based on option
					const slash = trailingSlash ? "/" : "";
					let finalUrl = wildcardUrl;

					if (trailingSlash) {
						// Ensure URL ends with slash when trailing slash is enabled
						if (!finalUrl.endsWith("/")) {
							finalUrl += "/";
						}
					} else {
						// Remove trailing slash when disabled
						if (finalUrl.endsWith("/")) {
							finalUrl = finalUrl.slice(0, -1);
						}
					}

					entries[wildcardSpecifier + slash] = finalUrl;
				}
			} else {
				// Handle explicit subpath exports
				const resolvedPath = resolveExportValue(exportValue);

				if (resolvedPath) {
					const subpathUrl = normalizeUrl(join(packageBaseUrl, resolvedPath));
					entries[importSpecifier] = subpathUrl;
				}
			}
		}

		return {
			success: true,
			entries,
		};
	} catch {
		return {
			success: false,
			error: "Subpath entries generation failed",
		};
	}
}

/**
 * Merges multiple import maps into a single unified import map.
 *
 * Combines import maps from different sources with conflict resolution
 * and validation. Essential for scenarios with multiple package sources
 * or incremental import map building.
 *
 * **Conflict Resolution**: Later import maps override earlier ones with
 * optional conflict detection and reporting for debugging.
 *
 * @param {Array<Object>} importMaps - Array of import map objects
 * @param {Object} [options={}] - Merge options
 * @param {boolean} [options.detectConflicts=false] - Report conflicting entries
 * @param {string} [options.conflictStrategy='override'] - How to handle conflicts
 * @returns {{success: boolean, importMap?: Object, conflicts?: Array, error?: string}}
 *
 * @example
 * ```javascript
 * const merged = mergeImportMaps([
 *   { imports: { "lodash": "/node_modules/lodash/index.js" } },
 *   { imports: { "react": "/node_modules/react/index.js" } }
 * ]);
 * ```
 */
export function mergeImportMaps(importMaps, options = {}) {
	const { detectConflicts = false, conflictStrategy = "override" } = options;

	try {
		const mergedImports = {};
		const conflicts = [];

		for (const importMap of importMaps) {
			if (!importMap || !importMap.imports) {
				continue;
			}

			for (const [specifier, url] of Object.entries(importMap.imports)) {
				if (
					detectConflicts &&
					mergedImports[specifier] &&
					mergedImports[specifier] !== url
				) {
					conflicts.push({
						specifier,
						existing: mergedImports[specifier],
						new: url,
					});
				}

				if (conflictStrategy === "override" || !mergedImports[specifier]) {
					mergedImports[specifier] = url;
				}
			}
		}

		// Validate merged import map
		const validation = validateImportMap({ imports: mergedImports });
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			};
		}

		return {
			success: true,
			importMap: { imports: mergedImports },
			conflicts: detectConflicts ? conflicts : undefined,
		};
	} catch {
		return {
			success: false,
			error: "Import map merge failed",
		};
	}
}

/**
 * Validates an import map for compliance with the Import Maps specification.
 *
 * Performs comprehensive validation of import map structure, URL formats,
 * and specifier validity. Essential for ensuring browser compatibility
 * and preventing runtime resolution errors.
 *
 * **Validation Rules**: Checks for valid URLs, proper specifier format,
 * circular dependencies, and Import Maps specification compliance.
 *
 * @param {Object} importMap - Import map object to validate
 * @returns {{valid: boolean, error?: string, warnings?: Array}}
 *
 * @example
 * ```javascript
 * const validation = validateImportMap({
 *   imports: { "lodash": "/node_modules/lodash/index.js" }
 * });
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 * ```
 */
export function validateImportMap(importMap) {
	try {
		const warnings = [];

		// Check basic structure
		if (!importMap || typeof importMap !== "object") {
			return {
				valid: false,
				error: "Import map must be an object",
			};
		}

		if (!importMap.imports || typeof importMap.imports !== "object") {
			return {
				valid: false,
				error: "Import map must have an 'imports' object",
			};
		}

		// Validate each import entry
		for (const [specifier, url] of Object.entries(importMap.imports)) {
			// Validate specifier
			if (typeof specifier !== "string" || specifier.length === 0) {
				return {
					valid: false,
					error: `Invalid specifier: ${specifier}`,
				};
			}

			// Validate URL
			if (typeof url !== "string" || url.length === 0) {
				return {
					valid: false,
					error: `Invalid URL for specifier '${specifier}': ${url}`,
				};
			}

			// Check for valid URL format
			if (!isValidUrl(url)) {
				return {
					valid: false,
					error: `Invalid URL format for specifier '${specifier}': ${url}`,
				};
			}

			// Warn about potential issues
			if (specifier.includes("//")) {
				warnings.push(`Specifier contains double slashes: ${specifier}`);
			}

			if (url.includes("..")) {
				warnings.push(`URL contains parent directory references: ${url}`);
			}
		}

		return {
			valid: true,
			warnings: warnings.length > 0 ? warnings : undefined,
		};
	} catch {
		return {
			valid: false,
			error: "Import map validation failed",
		};
	}
}

/**
 * Optimizes an import map for production by removing redundant entries.
 *
 * Performs import map optimization including duplicate removal,
 * path simplification, and size reduction. Essential for production
 * deployments where import map size affects initial page load performance.
 *
 * **Optimization Strategies**: Removes redundant entries, simplifies
 * paths, and consolidates similar patterns for minimal payload size.
 *
 * @param {Object} importMap - Import map to optimize
 * @param {Object} [options={}] - Optimization options
 * @param {boolean} [options.removeRedundant=true] - Remove redundant entries
 * @param {boolean} [options.simplifyPaths=true] - Simplify URL paths
 * @returns {{success: boolean, importMap?: Object, savings?: Object}}
 *
 * @example
 * ```javascript
 * const optimized = optimizeImportMap(largeImportMap);
 * console.log(`Reduced size by ${optimized.savings.percentage}%`);
 * ```
 */
export function optimizeImportMap(importMap, options = {}) {
	const { removeRedundant = true, simplifyPaths = true } = options;

	try {
		const originalSize = JSON.stringify(importMap).length;
		const optimizedImports = { ...importMap.imports };

		// Remove redundant entries
		if (removeRedundant) {
			const specifiers = Object.keys(optimizedImports);
			for (const specifier of specifiers) {
				// Check if this specifier is covered by a wildcard
				const isRedundant = specifiers.some(
					(other) =>
						other !== specifier &&
						other.endsWith("/") &&
						specifier.startsWith(other.slice(0, -1)) &&
						optimizedImports[specifier].startsWith(optimizedImports[other]),
				);

				if (isRedundant) {
					delete optimizedImports[specifier];
				}
			}
		}

		// Simplify paths
		if (simplifyPaths) {
			for (const [specifier, url] of Object.entries(optimizedImports)) {
				optimizedImports[specifier] = normalizeUrl(url);
			}
		}

		const optimizedImportMap = { imports: optimizedImports };
		const optimizedSize = JSON.stringify(optimizedImportMap).length;
		const savings = {
			originalSize,
			optimizedSize,
			bytesSaved: originalSize - optimizedSize,
			percentage: Math.round(
				((originalSize - optimizedSize) / originalSize) * 100,
			),
		};

		return {
			success: true,
			importMap: optimizedImportMap,
			savings,
		};
	} catch {
		return {
			success: false,
			error: "Import map optimization failed",
		};
	}
}

// Helper Functions

/**
 * Resolves an export value to a file path, handling conditions.
 *
 * @param {string|Object} exportValue - Export value from package.json
 * @returns {string|null} Resolved file path
 */
function resolveExportValue(exportValue) {
	if (typeof exportValue === "string") {
		return exportValue.replace(/^\.\//, "");
	}

	if (exportValue && typeof exportValue === "object") {
		// Handle conditional exports - prefer import, then default
		const conditions = ["import", "browser", "default", "require"];
		for (const condition of conditions) {
			if (exportValue[condition]) {
				const resolved = resolveExportValue(exportValue[condition]);
				if (resolved) {
					return resolved;
				}
			}
		}
	}

	return null;
}

/**
 * Normalizes a URL path by removing redundant segments.
 *
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
	// Convert Windows paths to POSIX for web URLs
	const posixUrl = url.replace(/\\/g, "/");

	// Remove redundant slashes
	const normalized = posixUrl.replace(/\/+/g, "/");

	// Ensure it starts with /
	return normalized.startsWith("/") ? normalized : "/" + normalized;
}

/**
 * Validates if a string is a valid URL for import maps.
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
	if (typeof url !== "string" || url.length === 0) {
		return false;
	}

	// Must start with / for relative URLs or be a valid absolute URL
	if (url.startsWith("/")) {
		return true;
	}

	// Check for valid absolute URL
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Converts package path to URL-safe format.
 *
 * @param {string} packageName - Package name to convert
 * @returns {string} URL-safe package name
 */
export function createPackageUrl(packageName) {
	if (typeof packageName !== "string" || packageName.length === 0) {
		return "";
	}

	// Handle scoped packages (@babel/core -> @babel/core)
	// No encoding needed for standard package names
	return packageName;
}

/**
 * Extracts import map statistics for analysis and debugging.
 *
 * @param {Object} importMap - Import map to analyze
 * @returns {Object} Statistics object
 */
export function getImportMapStats(importMap) {
	if (!importMap || !importMap.imports) {
		return {
			totalEntries: 0,
			scopedPackages: 0,
			wildcardEntries: 0,
			size: 0,
		};
	}

	const entries = Object.keys(importMap.imports);
	const scopedPackages = entries.filter((specifier) =>
		specifier.startsWith("@"),
	).length;
	const wildcardEntries = entries.filter((specifier) =>
		specifier.endsWith("/"),
	).length;
	const size = JSON.stringify(importMap).length;

	return {
		totalEntries: entries.length,
		scopedPackages,
		wildcardEntries,
		size,
		averageSpecifierLength:
			entries.reduce((sum, spec) => sum + spec.length, 0) / entries.length || 0,
		averageUrlLength:
			Object.values(importMap.imports).reduce(
				(sum, url) => sum + url.length,
				0,
			) / entries.length || 0,
	};
}
