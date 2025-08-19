/**
 * @file Package.json type field validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has the required module type
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid type, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidType = (packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		throw new Error("Package path must be a non-empty string");
	}

	const packageJsonPath = join(packagePath, "package.json");

	let packageJsonContent;
	try {
		packageJsonContent = readFileSync(packageJsonPath, "utf8");
	} catch (error) {
		throw new Error(
			`Cannot read package.json at ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	let packageData;
	try {
		packageData = JSON.parse(packageJsonContent);
	} catch (error) {
		throw new Error(
			`Invalid JSON in package.json at ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	if (
		!packageData.type ||
		typeof packageData.type !== "string" ||
		packageData.type.trim() !== "module"
	) {
		throw new Error(
			`Type must be "module" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
