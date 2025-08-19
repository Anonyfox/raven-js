import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has the required repository configuration
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid repository, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidRepository = (packagePath) => {
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
		!packageData.repository ||
		typeof packageData.repository !== "object" ||
		packageData.repository === null
	) {
		throw new Error(
			`Repository field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const repository = packageData.repository;

	if (repository.type !== "git") {
		throw new Error(
			`Repository type must be "git" in package.json at ${packageJsonPath}`,
		);
	}

	if (repository.url !== "https://github.com/Anonyfox/raven-js.git") {
		throw new Error(
			`Repository url must be "https://github.com/Anonyfox/raven-js.git" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
