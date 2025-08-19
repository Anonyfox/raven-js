import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Checks if a given path contains an npm package by verifying the existence of package.json
 * @param {string} packagePath - The path to check for an npm package
 * @returns {boolean} True if the path contains a package.json file, false otherwise
 */
export const IsNpmPackage = (packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		return false;
	}

	const packageJsonPath = join(packagePath, "package.json");
	return existsSync(packageJsonPath);
};
