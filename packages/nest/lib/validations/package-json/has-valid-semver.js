import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has a valid semantic version in its package.json
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid semver, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidSemver = (packagePath) => {
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

	if (!packageData.version) {
		throw new Error(
			`Missing version field in package.json at ${packageJsonPath}`,
		);
	}

	const version = packageData.version;
	if (typeof version !== "string") {
		throw new Error(
			`Version field must be a string, got ${typeof version} in package.json at ${packageJsonPath}`,
		);
	}

	// Validate semver format: major.minor.patch with numbers only
	const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
	const match = version.match(semverRegex);

	if (!match) {
		throw new Error(
			`Invalid semver format "${version}" in package.json at ${packageJsonPath}. Expected format: major.minor.patch (numbers only)`,
		);
	}

	return true;
};
