/**
 * @file Package.json homepage field validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has the required homepage URL
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid homepage, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidHomepage = (packagePath) => {
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
		!packageData.homepage ||
		typeof packageData.homepage !== "string" ||
		packageData.homepage.trim() !== "https://ravenjs.dev"
	) {
		throw new Error(
			`Homepage must be "https://ravenjs.dev" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
