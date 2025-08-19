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
 * @packageDocumentation
 *
 * Validates that a package has the required MIT license
 */
export const HasValidLicense = (/** @type {string} */ packagePath) => {
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
		!packageData.license ||
		typeof packageData.license !== "string" ||
		packageData.license.trim() !== "MIT"
	) {
		throw new Error(
			`License must be "MIT" in package.json at ${packageJsonPath}`,
		);
	}

	// Check for LICENSE file (exactly "LICENSE", no extension)
	const licenseFilePath = join(packagePath, "LICENSE");
	if (!existsSync(licenseFilePath)) {
		throw new Error(
			`Package must have a LICENSE file in the root directory at ${packagePath}`,
		);
	}

	return true;
};
