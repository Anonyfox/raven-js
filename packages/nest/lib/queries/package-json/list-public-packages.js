/**
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
 * @packageDocumentation
 *
 * Lists all public (non-private) workspace packages from a workspace root directory
 */
export const ListPublicPackages = (/** @type {string} */ workspaceRoot) => {
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
