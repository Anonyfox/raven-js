/**
 * @fileoverview Generate context files for packages
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Generate a context file for a package
 * @param {string} packagePath - Path to the package directory
 * @returns {import('../types.js').ContextObject|null} Context object or null if generation fails
 */
export function generateContext(packagePath) {
	try {
		// Get package.json content
		const packageJsonPath = join(packagePath, "package.json");
		if (!existsSync(packageJsonPath)) {
			return null;
		}

		const packageJsonContent = readFileSync(packageJsonPath, "utf8");
		const packageJson = JSON.parse(packageJsonContent);

		// Get README.md content
		const readmePath = join(packagePath, "README.md");
		if (!existsSync(readmePath)) {
			return null;
		}

		const readmeContent = readFileSync(readmePath, "utf8");

		const ctx = {
			name: packageJson.name,
			version: packageJson.version,
			exports: packageJson.exports ? packageJson.exports : packageJson.main,
			readme: readmeContent,
		};

		return ctx;
	} catch {
		return null;
	}
}

/**
 * Generate context file content as JSON string
 * @param {string} packagePath - Path to the package directory
 * @returns {string|null} JSON string or null if generation fails
 */
export function generateContextJson(packagePath) {
	const ctx = generateContext(packagePath);
	return ctx ? JSON.stringify(ctx, null, 2) : null;
}
