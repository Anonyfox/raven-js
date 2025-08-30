/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Validates package.json exports field has valid import/types paths
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * @typedef {Object} PackageJsonData
 * @property {Record<string, ExportEntry>} [exports] - Exports field object
 */

/**
 * @typedef {Object} ExportEntry
 * @property {string} [import] - Import path for ESM
 * @property {string} [types] - Types path for TypeScript
 */

/**
 * Validates that package.json has valid exports with existing import/types paths
 * @param {string} packagePath - Path to the package directory
 * @throws {Error} If package.json is missing, invalid, or exports are broken
 */
export function HasValidExports(packagePath) {
	if (!packagePath || typeof packagePath !== "string") {
		throw new Error("Package path must be a non-empty string");
	}

	const packageJsonPath = join(packagePath, "package.json");

	if (!existsSync(packageJsonPath)) {
		throw new Error(`package.json not found at: ${packageJsonPath}`);
	}

	let packageData;
	try {
		const content = readFileSync(packageJsonPath, "utf-8");
		packageData = JSON.parse(content);
	} catch (error) {
		throw new Error(`Failed to parse package.json: ${error.message}`);
	}

	// Skip validation for private packages (like nest itself)
	if (packageData.private === true) {
		return;
	}

	// Skip if no exports field
	if (!packageData.exports) {
		return;
	}

	// Validate exports field structure and file existence
	const violations = validateExportsField(packageData.exports, packagePath);

	if (violations.length > 0) {
		throw new Error(
			`package.json exports field violations:\n${violations.join("\n")}`,
		);
	}
}

/**
 * Validates exports field entries and file existence
 * @param {Record<string, ExportEntry>} exportsField - Exports field from package.json
 * @param {string} packagePath - Path to the package directory
 * @returns {string[]} Array of violation messages
 */
function validateExportsField(exportsField, packagePath) {
	const violations = [];

	// Check each export entry
	for (const [exportKey, exportValue] of Object.entries(exportsField)) {
		if (!exportValue || typeof exportValue !== "object") {
			violations.push(`  "${exportKey}": export entry must be an object`);
			continue;
		}

		const exportEntry = /** @type {ExportEntry} */ (exportValue);

		// Check that both import and types are present
		if (!exportEntry.import) {
			violations.push(`  "${exportKey}": missing "import" field`);
		}

		if (!exportEntry.types) {
			violations.push(`  "${exportKey}": missing "types" field`);
		}

		// Check that import file exists
		if (exportEntry.import) {
			const importPath = join(packagePath, exportEntry.import);
			if (!existsSync(importPath)) {
				violations.push(
					`  "${exportKey}": import file does not exist: ${exportEntry.import}`,
				);
			}
		}

		// Check that types file exists
		if (exportEntry.types) {
			const typesPath = join(packagePath, exportEntry.types);
			if (!existsSync(typesPath)) {
				violations.push(
					`  "${exportKey}": types file does not exist: ${exportEntry.types}`,
				);
			}
		}

		// Check for suspicious patterns
		if (exportEntry.import?.startsWith("/")) {
			violations.push(
				`  "${exportKey}": import path should be relative, not absolute: ${exportEntry.import}`,
			);
		}

		if (exportEntry.types?.startsWith("/")) {
			violations.push(
				`  "${exportKey}": types path should be relative, not absolute: ${exportEntry.types}`,
			);
		}
	}

	return violations;
}
