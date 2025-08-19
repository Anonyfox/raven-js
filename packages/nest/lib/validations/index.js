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
 * Validates a workspace root by running validation rules appropriate for workspace roots.
 * Throws on the first validation error encountered.
 * @param {string} workspacePath - The path to the workspace root directory
 * @returns {boolean} True if all validations pass, throws error otherwise
 * @throws {Error} Informative error message if any validation fails
 */
export const validateWorkspaceRoot = (workspacePath) => {
	if (typeof workspacePath !== "string" || workspacePath === "") {
		throw new Error("Workspace path must be a non-empty string");
	}

	// 1. Basic existence check (fastest)
	if (!IsNpmPackage(workspacePath)) {
		throw new Error(
			`Path ${workspacePath} is not a valid npm package (missing package.json)`,
		);
	}

	// 2. Package.json validation (simple to complex)
	// Start with structural validation that also parses JSON
	PackageJsonHasValidStructure(workspacePath);

	// Basic package.json fields (simple string validations)
	HasValidName(workspacePath);
	HasValidSemver(workspacePath);
	HasValidType(workspacePath);
	HasValidLicense(workspacePath);

	// More complex package.json fields
	HasValidAuthor(workspacePath);
	HasValidHomepage(workspacePath);
	HasValidRepository(workspacePath);
	HasValidBugs(workspacePath);
	HasValidEngines(workspacePath);

	// Skip HasValidPublishConfig - workspace roots are typically not published
	// Skip HasValidScripts - workspace roots have different script requirements

	// 3. Folder/file structure validation (README.md, LICENSE, main entry point)
	FolderHasValidStructure(workspacePath);

	// Skip HasValidTestFiles - workspace roots don't have the same test requirements

	return true;
};

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
		validateWorkspaceRoot(path);

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
