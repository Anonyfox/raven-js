/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Configuration import utilities for Soar deployment configurations.
 *
 * Pure functions for loading and validating deployment configuration from various
 * sources: files, strings, and objects. Handles ESM imports with named export selection.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Import configuration from JavaScript string (piped input).
 *
 * @param {string} configString - JavaScript configuration code
 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
 * @returns {Promise<Object>} Configuration object
 * @throws {Error} If string is empty, invalid JavaScript, or doesn't export object
 *
 * @example
 * ```javascript
 * const config = await importConfigFromString(`
 *   export default {
 *     resource: { name: 'my-app' },
 *     artifact: { type: 'static', path: './dist' },
 *     target: { provider: 'cloudflare', type: 'pages', config: {} }
 *   };
 * `);
 * ```
 */
export async function importConfigFromString(configString, exportName) {
	if (!configString || typeof configString !== "string") {
		throw new Error("Configuration string cannot be empty");
	}

	const trimmed = configString.trim();
	if (!trimmed) {
		throw new Error("Configuration string cannot be whitespace only");
	}

	try {
		// Create data URL from config string for dynamic import
		const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(trimmed)}`;
		const module = await import(dataUrl);

		let config;

		// Use named export if specified
		if (exportName) {
			if (!(exportName in module)) {
				throw new Error(
					`Export '${exportName}' not found in configuration string`,
				);
			}
			config = module[exportName];
		} else {
			// Use default export or throw error
			if (!("default" in module)) {
				throw new Error("Configuration must export a default object");
			}
			config = module.default;
		}

		if (!config || typeof config !== "object") {
			throw new Error("Configuration must export an object");
		}

		return config;
	} catch (error) {
		const err = /** @type {Error} */ (error);
		if (
			err.message.includes("Configuration must export") ||
			err.message.includes("Export ") ||
			err.message.includes("not found")
		) {
			throw error; // Re-throw our validation errors
		}
		throw new Error(`Failed to parse configuration string: ${err.message}`);
	}
}

/**
 * Import configuration from JavaScript file.
 *
 * @param {string} configPath - Path to configuration file
 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
 * @returns {Promise<Object>} Configuration object
 * @throws {Error} If file doesn't exist, invalid JavaScript, or doesn't export object
 *
 * @example
 * ```javascript
 * // soar.config.js:
 * // export default { resource: { name: 'my-app' }, ... };
 * // export const production = { resource: { name: 'my-app-prod' }, ... };
 *
 * const defaultConfig = await importConfigFromFile('./soar.config.js');
 * const prodConfig = await importConfigFromFile('./soar.config.js', 'production');
 * ```
 */
export async function importConfigFromFile(configPath, exportName) {
	if (!configPath || typeof configPath !== "string") {
		throw new Error("Configuration file path cannot be empty");
	}

	const trimmed = configPath.trim();
	if (!trimmed) {
		throw new Error("Configuration file path cannot be whitespace only");
	}

	try {
		// Convert to file URL for dynamic import
		const fileUrl = pathToFileURL(resolve(trimmed)).href;
		const module = await import(fileUrl);

		let config;

		// Use named export if specified
		if (exportName) {
			if (!(exportName in module)) {
				throw new Error(`Export '${exportName}' not found in ${configPath}`);
			}
			config = module[exportName];
		} else {
			// Use default export or throw error
			if (!("default" in module)) {
				throw new Error(`No default export found in ${configPath}`);
			}
			config = module.default;
		}

		if (!config || typeof config !== "object") {
			throw new Error("Configuration must export an object");
		}

		return config;
	} catch (error) {
		const err = /** @type {Error} */ (error);
		if (
			err.message.includes("ENOENT") ||
			err.message.includes("Cannot find module") ||
			/** @type {NodeJS.ErrnoException} */ (err).code === "ERR_MODULE_NOT_FOUND"
		) {
			throw new Error(`Configuration file not found: ${configPath}`);
		}
		if (
			err.message.includes("Configuration must export") ||
			err.message.includes("Export ") ||
			err.message.includes("No default export") ||
			err.message.includes("not found")
		) {
			throw error; // Re-throw our validation errors
		}
		throw new Error(`Failed to import configuration file: ${err.message}`);
	}
}

/**
 * Parse configuration input from various sources with precedence handling.
 *
 * Handles the Soar configuration precedence:
 * 1. Piped input (configString) - highest priority
 * 2. Configuration file - second priority
 * 3. Named export from file - third priority
 *
 * @param {string | Object | null} configInput - Configuration source (file path, object, or null for stdin)
 * @param {string} [exportName] - Optional named export to select
 * @returns {Promise<Object>} Configuration object
 * @throws {Error} When configuration cannot be loaded or parsed
 *
 * @example
 * ```javascript
 * // From file with named export
 * const config = await parseConfigInput('./soar.config.js', 'production');
 *
 * // From string (piped input)
 * const config = await parseConfigInput('export default {...}');
 *
 * // From object (direct usage)
 * const config = await parseConfigInput({ resource: {...}, artifact: {...} });
 * ```
 */
export async function parseConfigInput(configInput, exportName) {
	// Handle direct object input
	if (configInput && typeof configInput === "object") {
		return configInput;
	}

	// Handle string input (either file path or JavaScript code)
	if (typeof configInput === "string") {
		const trimmed = configInput.trim();

		// Detect if it's JavaScript code (contains export/import keywords)
		if (
			trimmed.includes("export") ||
			trimmed.includes("import") ||
			trimmed.includes("module.exports") ||
			trimmed.includes("const ") ||
			trimmed.includes("let ") ||
			trimmed.includes("var ")
		) {
			// Treat as JavaScript code string
			return await importConfigFromString(configInput, exportName);
		} else {
			// Treat as file path
			return await importConfigFromFile(configInput, exportName);
		}
	}

	throw new Error(
		"Configuration input must be a file path, JavaScript code string, or configuration object",
	);
}
