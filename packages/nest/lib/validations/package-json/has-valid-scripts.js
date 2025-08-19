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

	// Check if this is the nest package itself
	const isNestPackage = packageData.name === "@raven-js/nest";

	// Required scripts with exact values
	/** @type {Record<string, string>} */
	const requiredScripts = {
		test: isNestPackage
			? "npm run test:types && npm run test:style && npm run test:code"
			: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
		"test:types": "tsc --noEmit --project jsconfig.json",
	};

	// Add nest-specific scripts for non-nest packages
	if (!isNestPackage) {
		requiredScripts["nest:validate"] = "";
		requiredScripts["nest:docs"] = "";
	}

	// Check required scripts with exact values
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

	// Validate test:code script format (must use dot reporter, no coverage)
	const testCodeScript = scripts["test:code"];
	if (!testCodeScript) {
		throw new Error(
			`Script "test:code" is required in package.json at ${packageJsonPath}`,
		);
	}
	if (!testCodeScript.includes("--test-reporter=dot")) {
		throw new Error(
			`Script "test:code" must use --test-reporter=dot in package.json at ${packageJsonPath}`,
		);
	}
	if (testCodeScript.includes("--experimental-test-coverage")) {
		throw new Error(
			`Script "test:code" must not include coverage options in package.json at ${packageJsonPath}`,
		);
	}

	// Validate test:coverage script exists and has coverage options
	const testCoverageScript = scripts["test:coverage"];
	if (!testCoverageScript) {
		throw new Error(
			`Script "test:coverage" is required in package.json at ${packageJsonPath}`,
		);
	}
	if (!testCoverageScript.includes("--experimental-test-coverage")) {
		throw new Error(
			`Script "test:coverage" must include --experimental-test-coverage in package.json at ${packageJsonPath}`,
		);
	}

	// Validate test:style script exists
	const testStyleScript = scripts["test:style"];
	if (!testStyleScript) {
		throw new Error(
			`Script "test:style" is required in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
