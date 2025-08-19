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
 * @packageDocumentation
 *
 * Validates that a package has the required publishConfig configuration
 */
export const HasValidPublishConfig = (/** @type {string} */ packagePath) => {
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
		!packageData.publishConfig ||
		typeof packageData.publishConfig !== "object" ||
		packageData.publishConfig === null
	) {
		throw new Error(
			`PublishConfig field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const publishConfig = packageData.publishConfig;

	if (publishConfig.access !== "public") {
		throw new Error(
			`PublishConfig access must be "public" in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
