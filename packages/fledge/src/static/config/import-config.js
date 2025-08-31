/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dynamic configuration import - loads JavaScript config modules with export selection.
 *
 * Uses platform-native dynamic import() to load configuration files as executable JavaScript.
 * Supports both default exports and named exports with clean error handling.
 */

/**
 * Import configuration object from JavaScript module
 * @param {string} filePath - Path to the JavaScript config file
 * @param {string} [exportName] - Optional named export to select (uses default if not specified)
 * @returns {Promise<object>} Configuration object
 * @throws {Error} Clean error if import or export selection fails
 */
export async function importConfig(filePath, exportName) {
	try {
		const module = await import(filePath);

		if (exportName) {
			if (!(exportName in module)) {
				throw new Error(`Export '${exportName}' not found in ${filePath}`);
			}
			return module[exportName];
		}

		// Use default export or throw if not available
		if ("default" in module) {
			return module.default;
		}

		throw new Error(`No default export found in ${filePath}`);
	} catch (error) {
		const err = /** @type {any} */ (error);
		if (err.code === "ERR_MODULE_NOT_FOUND") {
			throw new Error(`Config file not found: ${filePath}`);
		}

		if (
			err.message.includes("Export ") ||
			err.message.includes("No default export")
		) {
			throw error; // Re-throw our clean export errors
		}

		throw new Error(`Failed to import config from ${filePath}: ${err.message}`);
	}
}
