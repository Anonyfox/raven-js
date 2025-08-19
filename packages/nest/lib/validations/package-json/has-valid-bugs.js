/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 *
 * Validates that a package has the required bugs configuration
 */
export const HasValidBugs = (/** @type {string} */ packagePath) => {
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
		!packageData.bugs ||
		typeof packageData.bugs !== "object" ||
		packageData.bugs === null
	) {
		throw new Error(
			`Bugs field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const bugs = packageData.bugs;

	if (bugs.url !== "https://github.com/Anonyfox/raven-js/issues") {
		throw new Error(
			`Bugs url must be "https://github.com/Anonyfox/raven-js/issues" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
