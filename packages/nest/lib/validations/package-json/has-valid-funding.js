/**
 * @file Validates that a package has proper funding configuration for GitHub sponsors
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has a valid funding object in its package.json
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid funding object, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidFunding = (packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		throw new Error("Package path must be a non-empty string");
	}

	const packageJsonPath = join(packagePath, "package.json");

	let packageJsonContent;
	try {
		packageJsonContent = readFileSync(packageJsonPath, "utf8");
	} catch (error) {
		throw new Error(
			`Cannot read package.json at ${packageJsonPath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	let packageData;
	try {
		packageData = JSON.parse(packageJsonContent);
	} catch (error) {
		throw new Error(
			`Invalid JSON in package.json at ${packageJsonPath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	// Skip validation for private packages
	if (packageData.private === true) {
		return true;
	}

	if (!packageData.funding) {
		throw new Error(
			`Missing funding field in package.json at ${packageJsonPath}`,
		);
	}

	// Funding must be an object (not string format)
	if (typeof packageData.funding !== "object" || packageData.funding === null) {
		throw new Error(
			`Funding field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const funding = packageData.funding;

	// Validate required type field
	if (funding.type !== "github") {
		throw new Error(
			`Funding type must be "github" in package.json at ${packageJsonPath}`,
		);
	}

	// Validate required url field
	if (funding.url !== "https://github.com/sponsors/Anonyfox") {
		throw new Error(
			`Funding url must be "https://github.com/sponsors/Anonyfox" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
