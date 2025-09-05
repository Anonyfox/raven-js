/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shared configuration precedence logic for Fledge commands
 *
 * Eliminates code duplication across Static, Script, and Binary commands
 * by providing unified config loading with proper precedence handling.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Create configuration from multiple sources with proper precedence
 * @param {Object} options - Configuration options
 * @param {string|null} options.configPath - Path to config file
 * @param {string|null} options.stdinConfig - Config from piped input
 * @param {string|null} options.exportName - Named export to use
 * @param {Function} options.ConfigClass - Configuration class constructor
 * @param {Function} options.createFromFlags - Function to create config from CLI flags
 * @param {URLSearchParams} options.queryParams - CLI flags as query params
 * @param {string} options.mode - Command mode for error messages
 * @returns {Promise<any>} Validated configuration instance
 * @throws {Error} When configuration cannot be created
 */
export async function createConfigFromSources({
	configPath,
	stdinConfig,
	exportName,
	ConfigClass,
	createFromFlags,
	queryParams,
	mode,
}) {
	try {
		if (stdinConfig) {
			// Highest priority: piped input
			return await ConfigClass.fromString(stdinConfig, exportName);
		}

		if (configPath) {
			// Second priority: config file
			if (!existsSync(configPath)) {
				throw new Error(`Config file not found: ${configPath}`);
			}
			return await ConfigClass.fromFile(resolve(configPath), exportName);
		}

		// Third priority: CLI flags (mode-specific logic)
		if (createFromFlags) {
			const flagConfig = await createFromFlags(queryParams);
			if (flagConfig) {
				return flagConfig;
			}
		}

		throw new Error(
			`No configuration provided for ${mode}. Use piped input, config file, or CLI flags.`,
		);
	} catch (error) {
		throw new Error(
			`Configuration error: ${/** @type {Error} */ (error).message}`,
		);
	}
}

/**
 * Parse config file path with optional export syntax
 * @param {string|null} configArg - Config argument (may contain :exportName)
 * @param {string|null} exportFlag - Export flag value
 * @returns {{configPath: string|null, exportName: string|null}} Parsed values
 */
export function parseConfigArg(configArg, exportFlag) {
	if (!configArg) {
		return { configPath: null, exportName: exportFlag };
	}

	if (configArg.includes(":")) {
		const [configPath, exportFromArg] = configArg.split(":", 2);
		return {
			configPath: configPath || null,
			exportName: exportFromArg || exportFlag,
		};
	}

	return { configPath: configArg, exportName: exportFlag };
}
