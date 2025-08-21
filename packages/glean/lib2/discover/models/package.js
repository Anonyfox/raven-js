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
 * Aggregation of relevant project information from the package root directory.
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

	/** @type {Set<File>} the files in the package */
	files = new Set();

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

		if (files !== undefined && !Array.isArray(files)) {
			throw new Error("Files parameter must be an array of file paths");
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

		// Extract entry points - only validate against files if explicitly provided
		this.entryPoints =
			files !== undefined
				? extractEntryPoints(json, files)
				: extractEntryPoints(json);
	}

	/**
	 * Get an existing file from the package.
	 *
	 * @param {string} filePath - the path to the file
	 * @returns {File|undefined} the file if it exists
	 */
	getExistingFile(filePath) {
		for (const file of this.files) {
			if (file.path === filePath) {
				return file;
			}
		}
		return undefined;
	}
}
