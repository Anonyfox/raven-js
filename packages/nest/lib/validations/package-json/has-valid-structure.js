import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has the required file structure
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has valid structure, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidStructure = (packagePath) => {
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

	// Check for README.md
	const readmePath = join(packagePath, "README.md");
	if (!existsSync(readmePath)) {
		throw new Error(`Package must have a README.md file at ${packagePath}`);
	}

	// Check for main entry point if specified
	if (packageData.main) {
		const mainPath = join(packagePath, packageData.main);
		if (!existsSync(mainPath)) {
			throw new Error(
				`Main entry point "${packageData.main}" does not exist at ${packagePath}`,
			);
		}
	}

	return true;
};
