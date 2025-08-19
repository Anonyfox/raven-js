/**
 * @file Package discovery utilities for public npm packages
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ListWorkspacePackages } from "./list-workspace-packages.js";

/**
 * Lists all public (non-private) workspace packages from a workspace root directory
 * @param {string} workspaceRoot - The path to the workspace root directory
 * @returns {string[]} Array of public package paths relative to workspace root
 * @throws {Error} If the directory is not a valid workspace or cannot be read
 */
export const ListPublicPackages = (workspaceRoot) => {
	if (typeof workspaceRoot !== "string" || workspaceRoot === "") {
		throw new Error("Workspace root path must be a non-empty string");
	}

	// Get all workspace packages first
	const allPackages = ListWorkspacePackages(workspaceRoot);
	const publicPackages = [];

	// Filter out private packages
	for (const packagePath of allPackages) {
		const packageJsonPath = join(workspaceRoot, packagePath, "package.json");

		let packageJsonContent;
		try {
			packageJsonContent = readFileSync(packageJsonPath, "utf8");
		} catch {
			// Skip packages without readable package.json
			continue;
		}

		let packageData;
		try {
			packageData = JSON.parse(packageJsonContent);
		} catch {
			// Skip packages with invalid package.json
			continue;
		}

		// Include package if it's not explicitly marked as private
		if (!packageData.private) {
			publicPackages.push(packagePath);
		}
	}

	return publicPackages;
};
