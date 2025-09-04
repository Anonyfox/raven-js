/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Script artifact implementation.
 *
 * Handles script files that require a runtime environment to execute.
 * Supports both shebang-based execution and explicit runtime specification.
 */

import { Base } from "./base.js";

/**
 * @typedef {Object} ScriptArtifactConfig
 * @property {'script'} type - Artifact type identifier
 * @property {string} path - Path to the script file
 * @property {string} [runtime] - Runtime command (e.g., 'node', 'python3', 'deno')
 * @property {string[]} [args] - Additional runtime arguments
 * @property {boolean} [hasShebang] - Whether script has executable shebang
 */

/**
 * Script artifact for runtime-dependent executables.
 * Represents script files that need a runtime environment to execute.
 *
 * **Characteristics:**
 * - Requires external runtime (Node.js, Python, etc.)
 * - Can have shebang for direct execution
 * - Platform-independent source code
 * - Executed via runtime or shebang (e.g., `node app.js` or `./app.js`)
 */
export class ScriptArtifact extends Base {
	/** @type {string|null} */
	#runtime;

	/** @type {string[]} */
	#args;

	/** @type {boolean} */
	#hasShebang;

	/**
	 * Creates a new script artifact instance.
	 *
	 * @param {ScriptArtifactConfig} config - Script artifact configuration
	 */
	constructor(config) {
		super(config.path);

		if (config.type !== "script") {
			throw new Error(
				"Artifact type must be 'script' for ScriptArtifact instances",
			);
		}

		this.#runtime = config.runtime ?? null;
		this.#args = config.args ?? [];
		this.#hasShebang = config.hasShebang ?? false;
	}

	/**
	 * Gets the runtime command.
	 *
	 * @returns {string|null} Runtime command
	 */
	getRuntime() {
		return this.#runtime;
	}

	/**
	 * Gets the runtime arguments.
	 *
	 * @returns {string[]} Runtime arguments
	 */
	getArgs() {
		return [...this.#args];
	}

	/**
	 * Gets whether the script has a shebang.
	 *
	 * @returns {boolean} True if script has executable shebang
	 */
	getHasShebang() {
		return this.#hasShebang;
	}

	/**
	 * Gets the artifact type identifier.
	 *
	 * @returns {string} Always returns 'script'
	 */
	getType() {
		return "script";
	}

	/**
	 * Validates the script artifact configuration.
	 *
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		const errors = [...super.validate()];

		// Must have either runtime or shebang
		if (!this.#runtime && !this.#hasShebang) {
			errors.push(
				new Error(
					"Script must specify either a runtime command or have a shebang",
				),
			);
		}

		// Validate runtime format (if provided)
		if (this.#runtime !== null) {
			if (
				typeof this.#runtime !== "string" ||
				this.#runtime.trim().length === 0
			) {
				errors.push(new Error("Runtime must be a non-empty string"));
			}
		}

		// Validate args format
		if (!Array.isArray(this.#args)) {
			errors.push(new Error("Runtime args must be an array"));
		} else {
			for (let i = 0; i < this.#args.length; i++) {
				if (typeof this.#args[i] !== "string") {
					errors.push(new Error(`Runtime arg at index ${i} must be a string`));
				}
			}
		}

		return errors;
	}

	/**
	 * Prepares the script artifact for deployment.
	 *
	 * @returns {Promise<object>} Deployment-ready artifact information
	 */
	async prepare() {
		const errors = this.validate();
		if (errors.length > 0) {
			throw new Error(
				`Script artifact validation failed: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		// Build execution command
		let command;
		if (this.#hasShebang) {
			command = [this.getPath()];
		} else if (this.#runtime) {
			command = [this.#runtime, ...this.#args, this.getPath()];
		} else {
			// This should be caught by validation, but just in case
			throw new Error("Cannot prepare script without runtime or shebang");
		}

		return {
			type: this.getType(),
			path: this.getPath(),
			runtime: this.#runtime,
			args: this.getArgs(),
			hasShebang: this.#hasShebang,
			executable: this.#hasShebang,
			command: command,
		};
	}
}
