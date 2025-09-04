/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Base class for all artifact types.
 *
 * Provides common functionality for artifact validation and path handling.
 * All artifact types share a path property and error collection mechanism.
 */

/**
 * Abstract base class for all artifact types.
 * Handles common path property and provides error collection framework.
 */
export class Base {
	/** @type {string} */
	#path;

	/**
	 * Creates a new artifact instance.
	 *
	 * @param {string} path - Path to the artifact (file or directory)
	 * @throws {Error} When path is invalid
	 */
	constructor(path) {
		if (typeof path !== "string") {
			throw new Error("Artifact path is required and must be a string");
		}

		if (path.trim().length === 0) {
			throw new Error("Artifact path cannot be empty");
		}

		this.#path = path.trim();
	}

	/**
	 * Gets the artifact path.
	 *
	 * @returns {string} Artifact path
	 */
	getPath() {
		return this.#path;
	}

	/**
	 * Validates the artifact configuration.
	 * Base implementation returns empty array - subclasses override.
	 *
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		return [];
	}

	/**
	 * Gets the artifact type identifier.
	 * Must be implemented by subclasses.
	 *
	 * @returns {string} Artifact type identifier
	 * @throws {Error} Always throws - must be implemented by subclasses
	 */
	getType() {
		throw new Error("getType() must be implemented by subclasses");
	}

	/**
	 * Gets deployment-ready artifact information.
	 * Must be implemented by subclasses.
	 *
	 * @returns {Promise<object>} Artifact deployment info
	 * @throws {Error} Always throws - must be implemented by subclasses
	 */
	async prepare() {
		throw new Error("prepare() must be implemented by subclasses");
	}
}
