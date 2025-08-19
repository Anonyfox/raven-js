/**
 * @file Package.json scripts field validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has the required scripts configuration
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has valid scripts, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidScripts = (packagePath) => {
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

	if (
		!packageData.scripts ||
		typeof packageData.scripts !== "object" ||
		packageData.scripts === null
	) {
		throw new Error(
			`Scripts field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const scripts = packageData.scripts;

	// Required scripts with exact values
	const requiredScripts = {
		"nest:validate": "",
		"nest:docs": "",
		test: "npm run test:types && npm run test:style && npm run test:code",
		"test:code": "",
		"test:style": "",
		"test:types": "tsc --noEmit --project jsconfig.json",
	};

	for (const [scriptName, requiredValue] of Object.entries(requiredScripts)) {
		const scriptValue = scripts[scriptName];

		if (
			!scriptValue ||
			typeof scriptValue !== "string" ||
			!scriptValue.trim()
		) {
			throw new Error(
				`Script "${scriptName}" must be a non-empty string in package.json at ${packageJsonPath}`,
			);
		}

		// Check exact value if required (empty string means any non-empty value is allowed)
		if (requiredValue && scriptValue.trim() !== requiredValue) {
			throw new Error(
				`Script "${scriptName}" must be "${requiredValue}" in package.json at ${packageJsonPath}`,
			);
		}
	}

	return true;
};
