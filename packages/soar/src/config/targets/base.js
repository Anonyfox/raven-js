/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Base class for all deployment targets.
 *
 * Provides minimal abstract interface for deployment targets.
 * All configurable properties live in concrete product classes.
 */

/**
 * Abstract base class for all deployment targets.
 * Provides minimal interface - no configurable properties.
 * All configuration lives in concrete product classes.
 */
export class Base {
	/**
	 * Validates the target configuration.
	 * Base implementation returns empty array - subclasses override.
	 *
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		return [];
	}

	/**
	 * Gets credentials for this target.
	 * Must be implemented by subclasses.
	 *
	 * @returns {Promise<object>} Target credentials
	 * @throws {Error} Always throws - must be implemented by subclasses
	 */
	async getCredentials() {
		throw new Error("getCredentials() must be implemented by subclasses");
	}

	/**
	 * Deploys an artifact to this target.
	 * Must be implemented by subclasses.
	 *
	 * @param {object} _artifact - Artifact to deploy
	 * @returns {Promise<object>} Deployment result
	 * @throws {Error} Always throws - must be implemented by subclasses
	 */
	async deploy(_artifact) {
		throw new Error("deploy() must be implemented by subclasses");
	}

	/**
	 * Gets supported artifact types for this target.
	 * Must be implemented by subclasses.
	 *
	 * @returns {string[]} Supported artifact types
	 * @throws {Error} Always throws - must be implemented by subclasses
	 */
	static getSupportedArtifactTypes() {
		throw new Error(
			"getSupportedArtifactTypes() must be implemented by subclasses",
		);
	}

	/**
	 * Gets supported transport methods for this target.
	 * Must be implemented by subclasses.
	 *
	 * @returns {string[]} Supported transport methods
	 * @throws {Error} Always throws - must be implemented by subclasses
	 */
	static getSupportedTransports() {
		throw new Error(
			"getSupportedTransports() must be implemented by subclasses",
		);
	}
}
