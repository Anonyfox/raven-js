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
 * Validates that a package has a valid name following RavenJS naming conventions
 */
export const HasValidName = (/** @type {string} */ packagePath) => {
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
		!packageData.name ||
		typeof packageData.name !== "string" ||
		!packageData.name.trim()
	) {
		throw new Error(
			`Missing or invalid name field in package.json at ${packageJsonPath}`,
		);
	}

	const name = packageData.name.trim();

	// Must be "raven-js" or start with "@raven-js/"
	if (name !== "raven-js" && !name.startsWith("@raven-js/")) {
		throw new Error(
			`Package name must be "raven-js" or start with "@raven-js/" in package.json at ${packageJsonPath}`,
		);
	}

	// If scoped, validate format
	if (name.startsWith("@raven-js/")) {
		const parts = name.split("/");
		if (parts.length !== 2 || parts[0] !== "@raven-js" || !parts[1]) {
			throw new Error(
				`Scoped package name must be in format @raven-js/package-name in package.json at ${packageJsonPath}`,
			);
		}
	}

	return true;
};
