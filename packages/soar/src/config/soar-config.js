/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Simplified Soar configuration class.
 *
 * Provides a lean configuration object with direct properties for
 * artifact and target - no unnecessary nesting.
 */

import { selectArtifact } from "./artifacts/select.js";
import {
	importConfigFromFile,
	importConfigFromString,
} from "./import-config.js";
import { selectTarget } from "./targets/select.js";

/**
 * @typedef {Object} SoarConfigObject
 * @property {Object} artifact - Artifact configuration object
 * @property {Object} target - Target configuration object with 'name' property
 */

/**
 * Simplified Soar configuration class.
 * Holds artifact and target as direct properties.
 *
 * @example
 * ```javascript
 * const config = new SoarConfig({
 *   artifact: { path: './dist' },
 *   target: { name: 'cloudflare-pages', projectName: 'my-app' }
 * });
 *
 * console.log(config.artifact);   // { path: './dist' }
 * console.log(config.target);     // { name: 'cloudflare-pages', projectName: 'my-app' }
 * ```
 */
export class SoarConfig {
	/** @type {Object|undefined} */
	artifact;

	/** @type {Object|undefined} */
	target;

	/**
	 * Creates a new SoarConfig instance.
	 *
	 * @param {SoarConfigObject} config - Configuration object
	 */
	constructor(config) {
		if (config && typeof config === "object") {
			this.artifact = config.artifact;
			this.target = config.target;
		}
	}

	/**
	 * Gets the artifact configuration.
	 *
	 * @returns {Object|undefined} Artifact configuration
	 */
	getArtifact() {
		return this.artifact;
	}

	/**
	 * Gets the target configuration.
	 *
	 * @returns {Object|undefined} Target configuration
	 */
	getTarget() {
		return this.target;
	}

	/**
	 * Validates the configuration by checking child components.
	 *
	 * @returns {string[]} Array of error messages (empty if valid)
	 */
	validate() {
		const errors = [];

		// Check if artifact exists and validate it
		if (!this.artifact) {
			errors.push("Artifact configuration is required");
		} else {
			try {
				const artifactInstance = selectArtifact(
					/** @type {any} */ (this.artifact),
				);
				artifactInstance.validate();
				// Artifact errors are Error instances in an array
				const artifactErrors = /** @type {any} */ (artifactInstance).errors;
				if (artifactErrors && artifactErrors.length > 0) {
					errors.push(
						...artifactErrors.map(
							/** @param {Error} err */ (err) => `Artifact: ${err.message}`,
						),
					);
				}
			} catch (error) {
				errors.push(`Artifact: ${/** @type {Error} */ (error).message}`);
			}
		}

		// Check if target exists and validate it
		if (!this.target) {
			errors.push("Target configuration is required");
		} else {
			try {
				const targetInstance = selectTarget(/** @type {any} */ (this.target));
				targetInstance.validate();
				// Target errors are Error instances in an array
				const targetErrors = /** @type {any} */ (targetInstance).errors;
				if (targetErrors && targetErrors.length > 0) {
					errors.push(
						...targetErrors.map(
							/** @param {Error} err */ (err) => `Target: ${err.message}`,
						),
					);
				}
			} catch (error) {
				errors.push(`Target: ${/** @type {Error} */ (error).message}`);
			}
		}

		return errors;
	}

	/**
	 * Validates the configuration and formats errors nicely.
	 *
	 * @returns {string|null} Formatted error message or null if valid
	 */
	validateAndFormat() {
		const errors = this.validate();
		if (errors.length === 0) {
			return null;
		}

		return `Configuration validation failed:\n${errors.map((err) => `  - ${err}`).join("\n")}`;
	}

	/**
	 * Creates a SoarConfig from a JavaScript file.
	 *
	 * @param {string} filePath - Path to JavaScript config file
	 * @param {string} [exportName] - Named export to use (defaults to 'default')
	 * @returns {Promise<SoarConfig>} New SoarConfig instance
	 * @throws {Error} When file cannot be loaded or is invalid
	 */
	static async fromFile(filePath, exportName) {
		const config = await importConfigFromFile(filePath, exportName);
		return new SoarConfig(/** @type {SoarConfigObject} */ (config));
	}

	/**
	 * Creates a SoarConfig from JavaScript code string.
	 *
	 * @param {string} codeString - JavaScript code that exports a config object
	 * @param {string} [exportName] - Named export to use (defaults to 'default')
	 * @returns {Promise<SoarConfig>} New SoarConfig instance
	 * @throws {Error} When code cannot be evaluated or is invalid
	 */
	static async fromString(codeString, exportName) {
		const config = await importConfigFromString(codeString, exportName);
		return new SoarConfig(/** @type {SoarConfigObject} */ (config));
	}
}
