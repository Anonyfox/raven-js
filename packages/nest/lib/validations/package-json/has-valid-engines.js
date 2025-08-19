import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has the required engines configuration
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid engines field, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidEngines = (packagePath) => {
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
		!packageData.engines ||
		typeof packageData.engines !== "object" ||
		packageData.engines === null
	) {
		throw new Error(
			`Engines field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const engines = packageData.engines;

	if (engines.node !== ">=22.5.0") {
		throw new Error(
			`Engines node must be ">=22.5.0" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
