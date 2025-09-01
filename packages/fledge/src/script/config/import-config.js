/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Configuration import utilities for script mode.
 *
 * Pure functions for loading and validating script configuration from various
 * sources: files, strings, and objects. Handles ESM imports and validation.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Import configuration from JavaScript string (piped input)
 * @param {string} configString - JavaScript configuration code
 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
 * @returns {Promise<Object>} Configuration object
 * @throws {Error} If string is empty, invalid JavaScript, or doesn't export object
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
		const base64Config = btoa(trimmed);
		const dataUrl = `data:text/javascript;base64,${base64Config}`;

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
 * Import configuration from JavaScript file
 * @param {string} configPath - Path to configuration file
 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
 * @returns {Promise<Object>} Configuration object
 * @throws {Error} If file doesn't exist, invalid JavaScript, or doesn't export object
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
			err.message.includes("ENOENT") ||
			err.message.includes("Cannot find module")
		) {
			throw new Error(`Configuration file not found: ${configPath}`);
		}
		if (
			err.message.includes("Configuration must export") ||
			err.message.includes("Export ") ||
			err.message.includes("not found")
		) {
			throw error; // Re-throw our validation errors
		}
		throw new Error(`Failed to import configuration file: ${err.message}`);
	}
}

/**
 * Validate configuration object structure
 * @param {unknown} config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfigObject(config) {
	if (!config || typeof config !== "object" || Array.isArray(config)) {
		throw new Error("Configuration must be an object");
	}

	const cfg = /** @type {any} */ (config);

	// Required fields
	if (typeof cfg.entry !== "string") {
		throw new Error("Configuration must specify 'entry' as a string");
	}

	if (typeof cfg.output !== "string") {
		throw new Error("Configuration must specify 'output' as a string");
	}

	// Optional field validation
	if (cfg.format && cfg.format !== "cjs" && cfg.format !== "esm") {
		throw new Error("Configuration 'format' must be 'cjs' or 'esm'");
	}

	if (cfg.nodeFlags && !Array.isArray(cfg.nodeFlags)) {
		throw new Error("Configuration 'nodeFlags' must be an array");
	}

	if (
		cfg.nodeFlags?.some(
			(/** @type {unknown} */ flag) => typeof flag !== "string",
		)
	) {
		throw new Error("Configuration 'nodeFlags' must contain only strings");
	}

	if (
		cfg.bundles &&
		(typeof cfg.bundles !== "object" || Array.isArray(cfg.bundles))
	) {
		throw new Error("Configuration 'bundles' must be an object");
	}

	if (cfg.bundles) {
		for (const [key, value] of Object.entries(cfg.bundles)) {
			if (typeof key !== "string" || typeof value !== "string") {
				throw new Error("Configuration 'bundles' must map strings to strings");
			}
		}
	}

	if (
		cfg.metadata &&
		(typeof cfg.metadata !== "object" || Array.isArray(cfg.metadata))
	) {
		throw new Error("Configuration 'metadata' must be an object");
	}
}
