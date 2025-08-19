/**
 * @file Workspace package discovery and enumeration utilities
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Lists all workspace packages from a workspace root directory
 * @param {string} workspaceRoot - The path to the workspace root directory
 * @returns {string[]} Array of package paths relative to workspace root
 * @throws {Error} If the directory is not a valid workspace or cannot be read
 */
export const ListWorkspacePackages = (workspaceRoot) => {
	if (typeof workspaceRoot !== "string" || workspaceRoot === "") {
		throw new Error("Workspace root path must be a non-empty string");
	}

	const packageJsonPath = join(workspaceRoot, "package.json");

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

	// Check if this is a workspace root
	if (
		!packageData.workspaces ||
		!Array.isArray(packageData.workspaces) ||
		packageData.workspaces.length === 0
	) {
		throw new Error(
			`Directory ${workspaceRoot} does not contain a valid workspace (missing or invalid workspaces field)`,
		);
	}

	const packagePaths = [];

	// Process each workspace pattern
	for (const workspacePattern of packageData.workspaces) {
		if (typeof workspacePattern !== "string" || !workspacePattern.trim()) {
			continue; // Skip invalid patterns
		}

		// Handle different workspace pattern formats
		if (workspacePattern.includes("*")) {
			// Glob pattern - find matching directories
			// For pattern like "packages/*", we want to find directories inside "packages"
			const baseDir = workspacePattern.split("/")[0];
			const baseDirPath = join(workspaceRoot, baseDir);

			if (!existsSync(baseDirPath)) {
				continue; // Skip if base directory doesn't exist
			}

			try {
				const entries = readdirSync(baseDirPath);
				for (const entry of entries) {
					const entryPath = join(baseDirPath, entry);
					if (statSync(entryPath).isDirectory()) {
						const relativePath = `${baseDir}/${entry}`;
						if (isValidPackageDirectory(workspaceRoot, relativePath)) {
							packagePaths.push(relativePath);
						}
					}
				}
			} catch {
				// Skip if we can't read the directory
			}
		} else {
			// Direct path pattern
			if (isValidPackageDirectory(workspaceRoot, workspacePattern)) {
				packagePaths.push(workspacePattern);
			}
		}
	}

	return packagePaths;
};

/**
 * Check if a directory contains a valid package
 * @param {string} workspaceRoot - The workspace root path
 * @param {string} relativePath - Relative path from workspace root to check
 * @returns {boolean} True if directory contains a valid package
 * @private
 */
function isValidPackageDirectory(workspaceRoot, relativePath) {
	const packageJsonPath = join(workspaceRoot, relativePath, "package.json");
	return existsSync(packageJsonPath);
}
