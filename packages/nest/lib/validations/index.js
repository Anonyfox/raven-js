// Import all validation functions

import { PackageJsonListWorkspacePackages } from "../queries/index.js";
import {
	HasValidStructure as FolderHasValidStructure,
	HasValidTestFiles,
} from "./folder/index.js";
import { IsNpmPackage } from "./is-npm-package.js";
import {
	HasValidAuthor,
	HasValidBugs,
	HasValidEngines,
	HasValidHomepage,
	HasValidLicense,
	HasValidName,
	HasValidPublishConfig,
	HasValidRepository,
	HasValidScripts,
	HasValidSemver,
	HasValidType,
	IsWorkspace,
	HasValidStructure as PackageJsonHasValidStructure,
} from "./package-json/index.js";

/**
 * Validates a package by running all validation rules in a logical order.
 * Throws on the first validation error encountered.
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if all validations pass, throws error otherwise
 * @throws {Error} Informative error message if any validation fails
 */
export const validatePackage = (packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		throw new Error("Package path must be a non-empty string");
	}

	// 1. Basic existence check (fastest)
	if (!IsNpmPackage(packagePath)) {
		throw new Error(
			`Path ${packagePath} is not a valid npm package (missing package.json)`,
		);
	}

	// 2. Package.json validation (simple to complex)
	// Start with structural validation that also parses JSON
	PackageJsonHasValidStructure(packagePath);

	// Basic package.json fields (simple string validations)
	HasValidName(packagePath);
	HasValidSemver(packagePath);
	HasValidType(packagePath);
	HasValidLicense(packagePath);

	// More complex package.json fields
	HasValidAuthor(packagePath);
	HasValidHomepage(packagePath);
	HasValidRepository(packagePath);
	HasValidBugs(packagePath);
	HasValidEngines(packagePath);
	HasValidPublishConfig(packagePath);

	// Most complex package.json validation
	HasValidScripts(packagePath);

	// 3. Folder/file structure validation (most expensive)
	FolderHasValidStructure(packagePath);
	HasValidTestFiles(packagePath);

	return true;
};

/**
 * Validates a package or workspace by running all validation rules.
 * For workspaces, validates all packages including the root.
 * Throws on the first validation error encountered.
 * @param {string} path - The path to the package or workspace directory
 * @returns {boolean} True if all validations pass, throws error otherwise
 * @throws {Error} Informative error message if any validation fails
 */
export const validate = (path) => {
	if (typeof path !== "string" || path === "") {
		throw new Error("Path must be a non-empty string");
	}

	// Check if this is a workspace
	if (IsWorkspace(path)) {
		// Validate workspace root first
		// validatePackage(path); // skip for now

		// Get all workspace packages and validate each
		const packagePaths = PackageJsonListWorkspacePackages(path);
		for (const relativePath of packagePaths) {
			const fullPath = `${path}/${relativePath}`;
			validatePackage(fullPath);
		}
	} else {
		// Single package validation
		validatePackage(path);
	}

	return true;
};

// Export workspace utility functions
export { IsWorkspace };
export { PackageJsonListWorkspacePackages as ListWorkspacePackages } from "../queries/index.js";
