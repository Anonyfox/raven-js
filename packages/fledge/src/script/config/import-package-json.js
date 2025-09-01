/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package.json import utilities for metadata extraction.
 *
 * Pure functions for reading, parsing, and extracting metadata from package.json
 * files. Handles path resolution and field validation for banner generation.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * @typedef {Object} PackageMetadata
 * @property {string} name - Package name
 * @property {string} version - Package version
 * @property {string} description - Package description
 * @property {string} author - Package author
 */

/**
 * Read and parse package.json from current working directory
 * @param {string} [startPath] - Directory to start searching from (default: cwd)
 * @returns {Object} Parsed package.json object
 * @throws {Error} If package.json not found or invalid JSON
 *
 * @example
 * ```javascript
 * const pkg = readPackageJson();
 * console.log(pkg.name); // → "my-app"
 * console.log(pkg.version); // → "1.0.0"
 * ```
 */
export function readPackageJson(startPath = process.cwd()) {
	const packagePath = resolvePackageJsonPath(startPath);

	try {
		const content = readFileSync(packagePath, "utf8");
		const packageJson = JSON.parse(content);

		if (!packageJson || typeof packageJson !== "object") {
			throw new Error("package.json must contain an object");
		}

		return packageJson;
	} catch (error) {
		if (/** @type {any} */ (error).code === "ENOENT") {
			throw new Error(`package.json not found starting from: ${startPath}`);
		}

		if (error instanceof SyntaxError) {
			throw new Error(`Invalid JSON in package.json: ${error.message}`);
		}

		throw new Error(
			`Failed to read package.json: ${/** @type {Error} */ (error).message}`,
		);
	}
}

/**
 * Find package.json by walking up directory tree
 * @param {string} startPath - Directory to start searching from
 * @returns {string} Absolute path to package.json file
 * @throws {Error} If package.json not found in any parent directory
 *
 * @example
 * ```javascript
 * const pkgPath = resolvePackageJsonPath('./src/components');
 * console.log(pkgPath); // → "/project/package.json"
 * ```
 */
export function resolvePackageJsonPath(startPath) {
	let currentPath = resolve(startPath);
	const root = resolve("/");

	while (currentPath !== root) {
		const packagePath = resolve(currentPath, "package.json");

		if (existsSync(packagePath)) {
			return packagePath;
		}

		// Move up one directory
		currentPath = dirname(currentPath);
	}

	throw new Error("package.json not found in any parent directory");
}

/**
 * Extract metadata fields from package.json object
 * @param {Object} packageJson - Parsed package.json object
 * @returns {PackageMetadata} Extracted metadata with defaults
 *
 * @example
 * ```javascript
 * const pkg = { name: "my-app", version: "1.0.0", author: "John Doe" };
 * const metadata = extractMetadata(pkg);
 * console.log(metadata);
 * // → { name: "my-app", version: "1.0.0", description: "", author: "John Doe" }
 * ```
 */
export function extractMetadata(packageJson) {
	if (!packageJson || typeof packageJson !== "object") {
		throw new Error("Package.json must be an object");
	}

	/** @type {any} */
	const pkg = packageJson;

	return {
		name: normalizeString(pkg.name) || "Unknown Application",
		version: normalizeString(pkg.version) || "0.0.0",
		description: normalizeString(pkg.description) || "",
		author: normalizeAuthor(pkg.author) || "Unknown Author",
	};
}

/**
 * Normalize string field from package.json
 * @param {unknown} value - Value to normalize
 * @returns {string} Normalized string or empty string
 *
 * @example
 * ```javascript
 * normalizeString("hello"); // → "hello"
 * normalizeString("  "); // → ""
 * normalizeString(null); // → ""
 * normalizeString(123); // → ""
 * ```
 */
function normalizeString(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || "";
	}
	return "";
}

/**
 * Normalize author field from package.json (handles object or string format)
 * @param {unknown} author - Author field value
 * @returns {string} Normalized author string
 *
 * @example
 * ```javascript
 * normalizeAuthor("John Doe"); // → "John Doe"
 * normalizeAuthor({ name: "John", email: "john@example.com" }); // → "John <john@example.com>"
 * normalizeAuthor({ name: "John" }); // → "John"
 * normalizeAuthor(null); // → ""
 * ```
 */
function normalizeAuthor(author) {
	if (typeof author === "string") {
		return normalizeString(author);
	}

	if (author && typeof author === "object") {
		/** @type {any} */
		const authorObj = author;
		const name = normalizeString(authorObj.name);
		const email = normalizeString(authorObj.email);

		if (name && email) {
			return `${name} <${email}>`;
		}

		return name || email || "";
	}

	return "";
}
