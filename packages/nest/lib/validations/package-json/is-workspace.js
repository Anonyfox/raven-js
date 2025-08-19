/**
 * @file Workspace detection and validation utilities
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Checks if a directory contains a workspace by examining the workspaces field in package.json
 * @param {string} directoryPath - The path to the directory to check
 * @returns {boolean} True if the directory contains a valid workspace, false otherwise
 */
export const IsWorkspace = (directoryPath) => {
	if (typeof directoryPath !== "string" || directoryPath === "") {
		return false;
	}

	const packageJsonPath = join(directoryPath, "package.json");

	let packageJsonContent;
	try {
		packageJsonContent = readFileSync(packageJsonPath, "utf8");
	} catch {
		return false; // No package.json file
	}

	let packageData;
	try {
		packageData = JSON.parse(packageJsonContent);
	} catch {
		return false; // Invalid JSON
	}

	// Check if this has a valid workspaces field
	if (
		!packageData.workspaces ||
		!Array.isArray(packageData.workspaces) ||
		packageData.workspaces.length === 0
	) {
		return false;
	}

	// Check if all workspace entries are valid strings
	return packageData.workspaces.every(
		/** @param {any} ws */ (ws) => typeof ws === "string" && ws.trim(),
	);
};
