/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Environment variable handling for script mode bundling.
 *
 * Manages environment variable resolution from files, objects, or functions
 * and generates JavaScript code for embedding in executables.
 */

import { existsSync, readFileSync } from "node:fs";
import { parseEnvFile } from "./parse-env-file.js";

/**
 * Environment variable resolution and code generation
 */
export class Environment {
	/**
	 * Resolved environment variables
	 * @type {Record<string, string>}
	 */
	variables;

	/**
	 * Create Environment instance
	 * @param {Record<string, string>} variables - Environment variables object
	 */
	constructor(variables) {
		this.variables = variables || {};
	}

	/**
	 * Resolve various environment input formats
	 * @param {unknown} envInput - Environment configuration (string, object, function, or null)
	 * @returns {Promise<Environment>} Environment instance with resolved variables
	 *
	 * @example File input
	 * ```javascript
	 * const env = await Environment.resolve(".env.production");
	 * // Loads variables from .env file
	 * ```
	 *
	 * @example Object input
	 * ```javascript
	 * const env = await Environment.resolve({
	 *   NODE_ENV: "production",
	 *   API_KEY: process.env.API_KEY,
	 *   BUILD_TIME: new Date().toISOString()
	 * });
	 * ```
	 *
	 * @example Function input
	 * ```javascript
	 * const env = await Environment.resolve(async () => {
	 *   const secrets = await loadSecretsFromVault();
	 *   return {
	 *     NODE_ENV: "production",
	 *     DATABASE_URL: secrets.dbUrl,
	 *     API_KEY: secrets.apiKey
	 *   };
	 * });
	 * ```
	 */
	static async resolve(envInput) {
		if (!envInput) {
			return new Environment({});
		}

		// Handle function input - call and resolve result
		if (typeof envInput === "function") {
			const result = await envInput();
			return await Environment.resolve(result);
		}

		// Handle string input - treat as file path
		if (typeof envInput === "string") {
			const variables = loadEnvFile(envInput);
			return new Environment(variables);
		}

		// Handle object input - use directly
		if (
			typeof envInput === "object" &&
			envInput !== null &&
			!Array.isArray(envInput)
		) {
			// Convert all values to strings
			/** @type {Record<string, string>} */
			const variables = Object.create(null);
			const inputObject = /** @type {Record<string, unknown>} */ (envInput);
			for (const [key, value] of Object.entries(inputObject)) {
				if (typeof key === "string" && value != null) {
					variables[key] = String(value);
				}
			}
			return new Environment(variables);
		}

		throw new Error(
			"Environment configuration must be a string, object, function, or null",
		);
	}

	/**
	 * Get resolved environment variables
	 * @returns {Record<string, string>} Environment variables object
	 */
	getVariables() {
		return this.variables;
	}

	/**
	 * Check if any environment variables are configured
	 * @returns {boolean} True if variables exist
	 */
	hasVariables() {
		return Object.keys(this.variables).length > 0;
	}

	/**
	 * Generate JavaScript code for environment variable initialization
	 * @returns {string} JavaScript code to embed in executable
	 */
	generateGlobalCode() {
		if (!this.hasVariables()) {
			return "";
		}

		const lines = [];
		lines.push("// Environment variables");
		lines.push("globalThis.RavenJS = globalThis.RavenJS || {};");
		lines.push("globalThis.RavenJS.env = {");

		for (const [key, value] of Object.entries(this.variables)) {
			// Escape the value for safe embedding in JavaScript
			const escapedValue = JSON.stringify(value);
			lines.push(`  ${JSON.stringify(key)}: ${escapedValue},`);
		}

		lines.push("};");
		lines.push("");
		lines.push("// Merge with process.env");
		lines.push("Object.assign(process.env, globalThis.RavenJS.env);");
		lines.push("");

		return lines.join("\n");
	}
}

/**
 * Load environment variables from .env file
 * @param {string} envFilePath - Path to .env file
 * @returns {Record<string, string>} Parsed environment variables
 * @throws {Error} If file doesn't exist or parsing fails
 */
function loadEnvFile(envFilePath) {
	if (!existsSync(envFilePath)) {
		throw new Error(`Environment file not found: ${envFilePath}`);
	}

	try {
		const content = readFileSync(envFilePath, "utf8");
		return parseEnvFile(content);
	} catch (error) {
		throw new Error(
			`Failed to parse environment file ${envFilePath}: ${/** @type {Error} */ (error).message}`,
		);
	}
}
