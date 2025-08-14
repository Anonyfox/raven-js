/**
 * @fileoverview List packages in a workspace
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { join } from "node:path";

/**
 * Check if a folder is in a workspace root and return package paths
 * @param {import('./folder.js').Folder} folder - Folder instance containing workspace files
 * @returns {string[]|null} Array of package paths relative to workspace root, or null if not a workspace
 */
export function listPackages(folder) {
	// Get package.json content from folder
	const packageJsonContent = folder.getFile("package.json");
	if (!packageJsonContent) {
		return null; // Not a workspace if no package.json
	}

	let packageJson;
	try {
		packageJson = JSON.parse(packageJsonContent);
	} catch {
		return null; // Not a workspace if invalid package.json
	}

	// Check if this is a workspace root
	if (
		!packageJson.workspaces ||
		!Array.isArray(packageJson.workspaces) ||
		packageJson.workspaces.length === 0
	) {
		return null; // Not a workspace
	}

	const packagePaths = [];

	// Process each workspace pattern
	for (const workspacePattern of packageJson.workspaces) {
		if (typeof workspacePattern !== "string") {
			continue; // Skip invalid patterns
		}

		// Handle different workspace pattern formats
		if (workspacePattern.includes("*")) {
			// Glob pattern - find matching directories
			// For pattern like "packages/*", we want to find directories inside "packages"
			const baseDir = workspacePattern.split("/")[0];
			const allFiles = folder.getFilePaths();
			const directories = new Set();

			for (const filePath of allFiles) {
				const parts = filePath.split("/");
				if (parts.length > 1 && parts[0] === baseDir) {
					// This is a file inside the base directory
					const subDir = parts[1];
					if (subDir && !directories.has(subDir)) {
						directories.add(subDir);
					}
				}
			}

			// Add valid package directories
			for (const subDir of directories) {
				const fullPath = `${baseDir}/${subDir}`;
				if (isValidPackageDirectory(folder, fullPath)) {
					packagePaths.push(fullPath);
				}
			}
		} else {
			// Direct path pattern
			if (isValidPackageDirectory(folder, workspacePattern)) {
				packagePaths.push(workspacePattern);
			}
		}
	}

	return packagePaths.length > 0 ? packagePaths : null;
}

/**
 * Check if a directory contains a valid package
 * @param {import('./folder.js').Folder} folder - Folder instance
 * @param {string} dirName - Directory name to check
 * @returns {boolean} True if directory contains a valid package
 * @private
 */
function isValidPackageDirectory(folder, dirName) {
	// Check if the directory has a package.json file
	const packageJsonPath = join(dirName, "package.json");
	return folder.hasFile(packageJsonPath);
}
