/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CLI command routing class with lifecycle hooks, flag validation, and terminal integration.
 *
 * CommandRoute extends Wings Route for CLI-specific functionality including automatic flag validation,
 * lifecycle management, stdin mapping, and positional argument handling. Provides clean abstraction
 * for building CLI commands with zero boilerplate.
 */

import { Route } from "../core/route.js";

/**
 * Flag configuration for CLI command validation.
 *
 * @typedef {Object} FlagConfig
 * @property {'string'|'number'|'boolean'} [type='string'] - Expected value type
 * @property {boolean} [required=false] - Whether flag is required
 * @property {boolean} [multiple=false] - Allow multiple values
 * @property {string[]} [choices] - Valid values (enum validation)
 * @property {string|number|boolean} [default] - Default value if not provided
 * @property {string} [description] - Help text description
 */

/**
 * Validation error for CLI flag issues.
 */
export class ValidationError extends Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "ValidationError";
	}
}

/**
 * CLI command route with lifecycle hooks and automatic flag validation.
 *
 * Extends Route to provide CLI-specific functionality while maintaining compatibility
 * with Wings router. Maps stdin to request body, handles positional arguments,
 * validates flags, and provides lifecycle hooks for clean command implementation.
 *
 * @example
 * // Basic command
 * class DeployCommand extends CommandRoute {
 *   constructor() {
 *     super('/deploy', 'Deploy artifacts to target');
 *     this.flag('env', { type: 'string', required: true });
 *     this.flag('verbose', { type: 'boolean' });
 *   }
 *
 *   async execute(ctx) {
 *     const env = ctx.queryParams.get('env');
 *     const verbose = ctx.queryParams.get('verbose') === 'true';
 *     // Deploy logic...
 *   }
 * }
 *
 * @example
 * // Command with lifecycle hooks
 * class BuildCommand extends CommandRoute {
 *   constructor() {
 *     super('/build/:target', 'Build project for target');
 *     this.flag('watch', { type: 'boolean' });
 *   }
 *
 *   async beforeExecute(ctx) {
 *     console.log('Initializing build...');
 *     ctx.buildConfig = await this.loadConfig();
 *   }
 *
 *   async execute(ctx) {
 *     const target = ctx.pathParams.target;
 *     await buildProject(ctx.buildConfig, target);
 *   }
 *
 *   async afterExecute(ctx) {
 *     console.log('Build completed successfully');
 *   }
 *
 *   async onError(error, ctx) {
 *     console.error(`Build failed: ${error.message}`);
 *   }
 * }
 */
export class CommandRoute extends Route {
	/**
	 * HTTP method for this route (always COMMAND for CLI routes).
	 * @override
	 * @type {import('../core/http-methods.js').HttpMethod}
	 */
	method = "COMMAND";

	/**
	 * Internal storage for flag configurations.
	 * @type {Map<string, FlagConfig>}
	 */
	#flags = new Map();

	/**
	 * Create CLI command route with automatic COMMAND method.
	 *
	 * @param {string} path - URL path pattern (supports :params)
	 * @param {string} [description=''] - Command description for help generation
	 */
	constructor(path, description = "") {
		super();
		this.path = path;
		this.description = description;
		this.handler = this.#createHandler();
	}

	/**
	 * Declare a CLI flag with validation rules.
	 *
	 * @param {string} name - Flag name (without -- prefix)
	 * @param {FlagConfig} [config={}] - Flag configuration
	 * @returns {CommandRoute} This instance for method chaining
	 *
	 * @example
	 * // String flag with choices
	 * this.flag('env', {
	 *   type: 'string',
	 *   required: true,
	 *   choices: ['dev', 'staging', 'prod']
	 * });
	 *
	 * @example
	 * // Multiple values flag
	 * this.flag('files', {
	 *   type: 'string',
	 *   multiple: true,
	 *   description: 'Files to process'
	 * });
	 */
	flag(name, config = {}) {
		if (typeof name !== "string" || !name.trim()) {
			throw new Error("Flag name must be a non-empty string");
		}

		this.#flags.set(name, {
			type: "string",
			required: false,
			multiple: false,
			...config,
		});

		return this;
	}

	/**
	 * Get positional arguments from context as string array.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 * @returns {string[]} Array of positional arguments
	 *
	 * @example
	 * // Command: myapp deploy file1.js file2.js --env prod
	 * // Path: /deploy, positional: ['file1.js', 'file2.js']
	 * const files = this.getPositionalArgs(ctx); // ['file1.js', 'file2.js']
	 */
	getPositionalArgs(ctx) {
		return ctx.queryParams.getAll("positional") || [];
	}

	/**
	 * Get declared flags configuration map.
	 *
	 * @returns {Map<string, FlagConfig>} Map of flag names to configurations
	 */
	getFlags() {
		return new Map(this.#flags);
	}

	/**
	 * Create internal handler with lifecycle management.
	 *
	 * @returns {import('../core/middleware.js').Handler} Handler function
	 */
	#createHandler() {
		return async (ctx) => {
			try {
				// Validate flags before execution
				await this.#validateFlags(ctx);

				// Execute lifecycle hooks
				if (this.beforeExecute) {
					await this.beforeExecute(ctx);
				}

				// Main execution - must be implemented by subclass
				if (this.execute) {
					await this.execute(ctx);
				}

				// Success lifecycle
				if (this.afterExecute) {
					await this.afterExecute(ctx);
				}
			} catch (error) {
				// Error lifecycle
				if (this.onError && this.onError !== CommandRoute.prototype.onError) {
					await this.onError(error, ctx);
				} else {
					// Default error handling
					await ctx.error(`Error: ${error.message}`);
				}
			}
		};
	}

	/**
	 * Validate flags against declared configuration.
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 * @throws {ValidationError} When validation fails
	 */
	async #validateFlags(ctx) {
		for (const [name, config] of this.#flags) {
			const value = ctx.queryParams.get(name);
			const values = ctx.queryParams.getAll(name);

			// Required check
			if (config.required && !value) {
				throw new ValidationError(`Missing required flag: --${name}`);
			}

			// Skip further validation if no value provided
			if (!value && values.length === 0) {
				continue;
			}

			// Multiple values check
			if (!config.multiple && values.length > 1) {
				throw new ValidationError(
					`Flag --${name} cannot be specified multiple times`,
				);
			}

			// Type validation
			if (value) {
				await this.#validateFlagType(name, value, config);
			}

			// Validate all values if multiple allowed
			if (config.multiple) {
				for (const val of values) {
					await this.#validateFlagType(name, val, config);
				}
			}
		}
	}

	/**
	 * Validate individual flag value against type and constraints.
	 *
	 * @param {string} name - Flag name
	 * @param {string} value - Flag value
	 * @param {FlagConfig} config - Flag configuration
	 * @throws {ValidationError} When validation fails
	 */
	async #validateFlagType(name, value, config) {
		// Type validation
		switch (config.type) {
			case "number":
				if (Number.isNaN(Number(value))) {
					throw new ValidationError(
						`Flag --${name} must be a number, got: ${value}`,
					);
				}
				break;
			case "boolean":
				if (!["true", "false"].includes(value)) {
					throw new ValidationError(
						`Flag --${name} must be true or false, got: ${value}`,
					);
				}
				break;
			// 'string' type requires no validation
		}

		// Choices validation
		if (config.choices && !config.choices.includes(value)) {
			throw new ValidationError(
				`Flag --${name} must be one of: ${config.choices.join(", ")}, got: ${value}`,
			);
		}
	}

	/**
	 * Lifecycle hook called before main execution.
	 * Override in subclasses for setup logic.
	 *
	 * @param {import('../core/context.js').Context} _ctx - Request context
	 * @returns {Promise<void>}
	 */
	async beforeExecute(_ctx) {
		// Override in subclasses
	}

	/**
	 * Main command execution logic.
	 * Must be implemented by subclasses.
	 *
	 * @param {import('../core/context.js').Context} _ctx - Request context
	 * @returns {Promise<void>}
	 */
	async execute(_ctx) {
		// Must be implemented by subclasses
		throw new Error("execute() method must be implemented by subclass");
	}

	/**
	 * Lifecycle hook called after successful execution.
	 * Override in subclasses for cleanup logic.
	 *
	 * @param {import('../core/context.js').Context} _ctx - Request context
	 * @returns {Promise<void>}
	 */
	async afterExecute(_ctx) {
		// Override in subclasses
	}

	/**
	 * Lifecycle hook called when execution throws an error.
	 * Override in subclasses for custom error handling.
	 *
	 * @param {Error} _error - The error that occurred
	 * @param {import('../core/context.js').Context} _ctx - Request context
	 * @returns {Promise<void>}
	 */
	async onError(_error, _ctx) {
		// Override in subclasses
	}
}
