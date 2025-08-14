/**
 * @fileoverview Update package versions in a workspace
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Folder } from "../folder.js";
import { listPackages } from "../list-packages.js";

/**
 * Update version in all package.json files in a workspace
 * @param {string} workspacePath - Path to the workspace root
 * @param {string} newVersion - New version to set
 * @returns {Object} Result object with updated packages and any errors
 */
export function updatePackageVersions(workspacePath, newVersion) {
	const result = {
		updated: [],
		errors: [],
		skipped: [],
	};

	try {
		// Create a Folder instance for the workspace
		const folder = new Folder(workspacePath);

		// Get all packages in the workspace
		const packages = listPackages(folder);
		if (!packages) {
			result.errors.push("Not a valid workspace - no packages found");
			return result;
		}

		// Update root package.json
		try {
			const rootPackagePath = join(workspacePath, "package.json");
			const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf8"));
			rootPackage.version = newVersion;
			writeFileSync(
				rootPackagePath,
				`${JSON.stringify(rootPackage, null, 2)}\n`,
			);
			result.updated.push("package.json (root)");
		} catch (error) {
			result.errors.push(
				`Failed to update root package.json: ${error.message}`,
			);
		}

		// Update all workspace packages
		for (const packagePath of packages) {
			try {
				const packageJsonPath = join(
					workspacePath,
					packagePath,
					"package.json",
				);
				const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

				// Skip private packages
				if (packageJson.private) {
					result.skipped.push(packagePath);
					continue;
				}

				packageJson.version = newVersion;
				writeFileSync(
					packageJsonPath,
					`${JSON.stringify(packageJson, null, 2)}\n`,
				);
				result.updated.push(packagePath);
			} catch (error) {
				result.errors.push(`Failed to update ${packagePath}: ${error.message}`);
			}
		}

		return result;
	} catch (error) {
		result.errors.push(`Workspace error: ${error.message}`);
		return result;
	}
}
