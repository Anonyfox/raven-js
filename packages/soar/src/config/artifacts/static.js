/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static artifact implementation.
 *
 * Handles directories containing static files (HTML, CSS, JS, images, etc.)
 * that are served directly without server-side processing.
 */

import { Base } from "./base.js";

/**
 * @typedef {Object} StaticArtifactConfig
 * @property {'static'} type - Artifact type identifier
 * @property {string} path - Path to the static files directory
 * @property {string} [indexFile] - Default index file (e.g., 'index.html')
 * @property {string[]} [excludePatterns] - Glob patterns for files to exclude
 */

/**
 * Static artifact for static file directories.
 * Represents directories of static files that are served directly.
 *
 * **Characteristics:**
 * - Directory of static files (HTML, CSS, JS, images, etc.)
 * - No server-side processing required
 * - Platform-independent
 * - Served directly by web servers or CDNs
 */
export class StaticArtifact extends Base {
	/** @type {string} */
	#indexFile;

	/** @type {string[]} */
	#excludePatterns;

	/**
	 * Creates a new static artifact instance.
	 *
	 * @param {StaticArtifactConfig} config - Static artifact configuration
	 */
	constructor(config) {
		super(config.path);

		if (config.type !== "static") {
			throw new Error(
				"Artifact type must be 'static' for StaticArtifact instances",
			);
		}

		this.#indexFile = config.indexFile ?? "index.html";
		this.#excludePatterns = config.excludePatterns ?? [];
	}

	/**
	 * Gets the default index file.
	 *
	 * @returns {string} Index file name
	 */
	getIndexFile() {
		return this.#indexFile;
	}

	/**
	 * Gets the exclude patterns.
	 *
	 * @returns {string[]} Array of glob patterns to exclude
	 */
	getExcludePatterns() {
		return [...this.#excludePatterns];
	}

	/**
	 * Gets the artifact type identifier.
	 *
	 * @returns {string} Always returns 'static'
	 */
	getType() {
		return "static";
	}

	/**
	 * Validates the static artifact configuration.
	 *
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		const errors = [...super.validate()];

		// Validate index file format
		if (
			typeof this.#indexFile !== "string" ||
			this.#indexFile.trim().length === 0
		) {
			errors.push(new Error("Index file must be a non-empty string"));
		}

		// Validate exclude patterns format
		if (!Array.isArray(this.#excludePatterns)) {
			errors.push(new Error("Exclude patterns must be an array"));
		} else {
			for (let i = 0; i < this.#excludePatterns.length; i++) {
				if (typeof this.#excludePatterns[i] !== "string") {
					errors.push(
						new Error(`Exclude pattern at index ${i} must be a string`),
					);
				}
			}
		}

		return errors;
	}

	/**
	 * Prepares the static artifact for deployment.
	 *
	 * @returns {Promise<object>} Deployment-ready artifact information
	 */
	async prepare() {
		const errors = this.validate();
		if (errors.length > 0) {
			throw new Error(
				`Static artifact validation failed: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		return {
			type: this.getType(),
			path: this.getPath(),
			indexFile: this.#indexFile,
			excludePatterns: this.getExcludePatterns(),
			executable: false,
			runtime: null, // Static files don't need runtime
		};
	}
}
