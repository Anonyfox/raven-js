/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Binary artifact implementation.
 *
 * Handles self-contained executable binaries that run directly
 * with "./app" commands and don't require external runtimes.
 */

import { Base } from "./base.js";

/**
 * @typedef {Object} BinaryArtifactConfig
 * @property {'binary'} type - Artifact type identifier
 * @property {string} path - Path to the binary executable
 * @property {string} [architecture] - Target architecture (e.g., 'x64', 'arm64')
 * @property {string} [platform] - Target platform (e.g., 'linux', 'darwin', 'win32')
 */

/**
 * Binary artifact for self-contained executables.
 * Represents compiled binaries that can run directly without external runtimes.
 *
 * **Characteristics:**
 * - Self-contained executable files
 * - No external runtime dependencies
 * - Platform/architecture specific
 * - Executed directly (e.g., `./myapp`)
 */
export class BinaryArtifact extends Base {
	/** @type {string|null} */
	#architecture;

	/** @type {string|null} */
	#platform;

	/**
	 * Creates a new binary artifact instance.
	 *
	 * @param {BinaryArtifactConfig} config - Binary artifact configuration
	 */
	constructor(config) {
		super(config.path);

		if (config.type !== "binary") {
			throw new Error(
				"Artifact type must be 'binary' for BinaryArtifact instances",
			);
		}

		this.#architecture = config.architecture ?? null;
		this.#platform = config.platform ?? null;
	}

	/**
	 * Gets the target architecture.
	 *
	 * @returns {string|null} Target architecture
	 */
	getArchitecture() {
		return this.#architecture;
	}

	/**
	 * Gets the target platform.
	 *
	 * @returns {string|null} Target platform
	 */
	getPlatform() {
		return this.#platform;
	}

	/**
	 * Gets the artifact type identifier.
	 *
	 * @returns {string} Always returns 'binary'
	 */
	getType() {
		return "binary";
	}

	/**
	 * Validates the binary artifact configuration.
	 *
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		const errors = [...super.validate()];

		// Validate architecture format (if provided)
		if (this.#architecture !== null) {
			const validArchitectures = [
				"x64",
				"arm64",
				"ia32",
				"arm",
				"s390x",
				"ppc64",
			];
			if (!validArchitectures.includes(this.#architecture)) {
				errors.push(
					new Error(
						`Invalid architecture '${this.#architecture}'. Valid options: ${validArchitectures.join(", ")}`,
					),
				);
			}
		}

		// Validate platform format (if provided)
		if (this.#platform !== null) {
			const validPlatforms = ["linux", "darwin", "win32", "freebsd", "openbsd"];
			if (!validPlatforms.includes(this.#platform)) {
				errors.push(
					new Error(
						`Invalid platform '${this.#platform}'. Valid options: ${validPlatforms.join(", ")}`,
					),
				);
			}
		}

		return errors;
	}

	/**
	 * Prepares the binary artifact for deployment.
	 *
	 * @returns {Promise<object>} Deployment-ready artifact information
	 */
	async prepare() {
		const errors = this.validate();
		if (errors.length > 0) {
			throw new Error(
				`Binary artifact validation failed: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		return {
			type: this.getType(),
			path: this.getPath(),
			architecture: this.#architecture,
			platform: this.#platform,
			executable: true,
			runtime: null, // Self-contained, no runtime needed
		};
	}
}
