/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { extractEntryPoints } from "../parser/entry-points.js";
import { File } from "./file.js";
import { Module } from "./module.js";

/**
 * Package aggregation with validated entry points and module organization.
 *
 * Aggregates project information from package.json with file discovery and
 * entry point validation for module graph construction.
 *
 * @example
 * // Basic package creation
 * const files = new Set(['./src/index.js', './src/utils.js']);
 * const pkg = new Package(jsonString, files);
 * console.log(pkg.name, pkg.entryPoints);
 *
 * @example
 * // File management
 * const file = pkg.getExistingFile('./src/index.js');
 * pkg.modules.forEach(module => console.log(module.importPath));
 */
export class Package {
	/** @type {string} the package name from package.json */
	name = "";

	/** @type {string} the package version from package.json */
	version = "";

	/** @type {string} the package description from package.json */
	description = "";

	/** @type {Object<string, string>} validated entry points with file resolution */
	entryPoints = {};

	/** @type {string} the package root directory's README.md content */
	readme = "";

	/** @type {Array<Module>} the modules in the package */
	modules = [];

	/** @type {Array<File>} the files in the package */
	files = [];

	/** @type {Array<Object>} image assets found in package README */
	imageAssets = [];

	/**
	 * @param {string} jsonString - the package.json content as a string
	 * @param {Set<string>} [files] - the (recursive) list of files in the package
	 */
	constructor(jsonString, files) {
		// Validate inputs
		if (typeof jsonString !== "string") {
			throw new Error("Package constructor requires a valid JSON string");
		}

		if (jsonString.trim() === "") {
			throw new Error("Package JSON string cannot be empty");
		}

		if (files !== undefined && !(files instanceof Set)) {
			throw new Error("Files parameter must be a Set of file paths");
		}

		// Parse JSON safely
		let json;
		try {
			json = JSON.parse(jsonString);
		} catch (error) {
			throw new Error(`Invalid package.json format: ${error.message}`);
		}

		// Validate that parsed JSON is an object
		if (!json || typeof json !== "object" || Array.isArray(json)) {
			throw new Error("Package JSON must be a valid object");
		}

		// Extract and validate required fields with safe defaults
		this.name = typeof json.name === "string" ? json.name : "";
		this.version = typeof json.version === "string" ? json.version : "";
		this.description =
			typeof json.description === "string" ? json.description : "";

		// Store complete package.json data for attribution
		this.packageJsonData = json;

		// Extract entry points - always validate against provided files or empty set
		this.entryPoints = extractEntryPoints(json, files || new Set());
	}

	/**
	 * Get an existing file from the package.
	 *
	 * @param {string} filePath - the path to the file
	 * @returns {File|undefined} the file if it exists
	 */
	getExistingFile(filePath) {
		return this.files.find((file) => file.path === filePath);
	}
}
