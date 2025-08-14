/**
 * @fileoverview Type definitions for package validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * @typedef {Object} PackageAuthor
 * @property {string} name - Author name
 * @property {string} email - Author email
 * @property {string} url - Author URL
 */

/**
 * @typedef {Object} PackageRepository
 * @property {string} type - Repository type (usually "git")
 * @property {string} url - Repository URL
 * @property {string} [directory] - Subdirectory within the repository
 */

/**
 * @typedef {Object} PackageBugs
 * @property {string} url - Bugs URL
 */

/**
 * @typedef {Object} PackageExports
 * @property {string|Object} [main] - Main export
 * @property {Object} [import] - ESM import
 * @property {Object} [require] - CommonJS require
 */

/**
 * @typedef {Object} PackageJson
 * @property {string} name - Package name
 * @property {string} version - Package version
 * @property {string} [description] - Package description
 * @property {boolean} [private] - Whether package is private
 * @property {string} [type] - Module type ("module" or "commonjs")
 * @property {string} [main] - Main entry point
 * @property {PackageExports} [exports] - Package exports
 * @property {string[]} [keywords] - Package keywords
 * @property {PackageAuthor} [author] - Package author
 * @property {string} [license] - Package license
 * @property {PackageRepository} [repository] - Package repository
 * @property {PackageBugs} [bugs] - Package bugs
 * @property {string} [homepage] - Package homepage
 * @property {Object} [engines] - Node/npm version requirements
 * @property {Object} [dependencies] - Package dependencies
 * @property {Object} [devDependencies] - Development dependencies
 * @property {Object} [scripts] - Package scripts
 */

/**
 * @typedef {Object} PackageValidationError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} [field] - Field that caused the error
 */

/**
 * @typedef {Object} PackageValidationResult
 * @property {boolean} valid - Whether the package is valid
 * @property {PackageValidationError[]} errors - Validation errors
 * @property {PackageJson} packageJson - The parsed package.json
 * @property {string} path - Package path
 */

/**
 * @typedef {Object} PackageInfo
 * @property {string} name - Package name
 * @property {string} path - Package path
 * @property {boolean} private - Whether package is private
 * @property {PackageJson} packageJson - Parsed package.json
 */

/**
 * @typedef {Object} WorkspaceValidationResult
 * @property {boolean} valid - Whether all packages are valid
 * @property {PackageValidationResult[]} results - Individual package results
 * @property {PackageInfo[]} packages - All packages in workspace
 */

/**
 * @typedef {Object} ContextObject
 * @property {string} name - Package name
 * @property {string} version - Package version
 * @property {Object|string|undefined} exports - Package exports or main entry point
 * @property {string} readme - README.md content
 */

/**
 * @typedef {Object} TypeDocConfig
 * @property {string[]} entryPoints - Array of entry point paths
 * @property {string} out - Output directory path
 * @property {boolean} skipErrorChecking - Skip TypeScript error checking
 * @property {string} customFooterHtml - Custom footer HTML
 * @property {string} name - Package name for TypeDoc
 * @property {string} tsconfig - TypeScript config path
 */

/**
 * @typedef {Object} BundleContent
 * @property {string} code - Bundle code content
 * @property {string} map - Source map content
 */

/**
 * @typedef {Object} BundleResult
 * @property {string} packageName - Name of the package
 * @property {BundleContent|null} cjs - CommonJS bundle content
 * @property {BundleContent|null} cjsMin - CommonJS bundle content (minified)
 * @property {BundleContent|null} esm - ESM bundle content (development)
 * @property {BundleContent|null} esmMin - ESM bundle content (production)
 */

// Export an empty object to make this a module
export {};
