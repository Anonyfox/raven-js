/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 *
 * Validates that a directory has the required package structure files
 */
export const HasValidStructure = (/** @type {string} */ directoryPath) => {
	if (typeof directoryPath !== "string" || directoryPath === "") {
		throw new Error("Directory path must be a non-empty string");
	}

	const missingFiles = [];

	// Check for README.md
	const readmePath = join(directoryPath, "README.md");
	if (!existsSync(readmePath)) {
		missingFiles.push("README.md");
	}

	// Check for LICENSE file (exactly "LICENSE", no extension)
	const licensePath = join(directoryPath, "LICENSE");
	if (!existsSync(licensePath)) {
		missingFiles.push("LICENSE");
	}

	// Check for main entry point if specified in package.json
	const packageJsonPath = join(directoryPath, "package.json");
	if (existsSync(packageJsonPath)) {
		try {
			const packageJsonContent = readFileSync(packageJsonPath, "utf8");
			const packageData = JSON.parse(packageJsonContent);

			if (packageData.main) {
				const mainPath = join(directoryPath, packageData.main);
				if (!existsSync(mainPath)) {
					missingFiles.push(packageData.main);
				}
			}
		} catch {
			// If package.json is invalid, we'll let package.json validation handle that
			// Just skip main entry point validation
		}
	}

	if (missingFiles.length > 0) {
		throw new Error(
			`Missing required files in ${directoryPath}: ${missingFiles.join(", ")}`,
		);
	}

	return true;
};
