/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * @packageDocumentation
 *
 * Checks if a given path contains an npm package by verifying the existence of package.json
 */
export const IsNpmPackage = (/** @type {string} */ packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		return false;
	}

	const packageJsonPath = join(packagePath, "package.json");
	return existsSync(packageJsonPath);
};
