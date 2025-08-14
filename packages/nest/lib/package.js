/**
 * @fileoverview Package validation and management
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Folder } from "./folder.js";
import {
	validateAuthor,
	validateLicense,
	validatePackageName,
	validatePackageStructure,
	validateScripts,
	validateVersion,
} from "./validations/index.js";

/**
 * Read and parse package.json from a directory
 * @param {string} packagePath - Path to the package directory
 * @returns {import('./types.js').PackageJson} Parsed package.json
 * @throws {Error} If package.json doesn't exist or is invalid JSON
 */
export function readPackageJson(packagePath) {
	const packageJsonPath = join(packagePath, "package.json");

	if (!existsSync(packageJsonPath)) {
		throw new Error(`package.json not found at ${packageJsonPath}`);
	}

	try {
		const content = readFileSync(packageJsonPath, "utf8");
		return JSON.parse(content);
	} catch (/** @type {unknown} */ error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid package.json at ${packageJsonPath}: ${message}`);
	}
}

/**
 * Check if a directory is a valid package
 * @param {string} packagePath - Path to the package directory
 * @returns {boolean} True if directory contains a valid package.json
 */
export function isValidPackage(packagePath) {
	const packageJsonPath = join(packagePath, "package.json");
	return existsSync(packageJsonPath) && statSync(packageJsonPath).isFile();
}

/**
 * Get package information from a directory
 * @param {string} packagePath - Path to the package directory
 * @returns {import('./types.js').PackageInfo} Package information
 * @throws {Error} If package.json is invalid or missing
 */
export function getPackageInfo(packagePath) {
	const packageJson = readPackageJson(packagePath);

	return {
		name: packageJson.name,
		path: packagePath,
		private: packageJson.private || false,
		packageJson,
	};
}

/**
 * Validate a single package
 * @param {string} packagePath - Path to the package directory
 * @returns {import('./types.js').PackageValidationResult} Validation result
 */
export function validatePackage(packagePath) {
	const errors = [];

	try {
		const packageJson = readPackageJson(packagePath);
		const folder = new Folder(packagePath);

		// Run all validation checks
		errors.push(...validatePackageName(folder));
		errors.push(...validateVersion(folder));
		errors.push(...validateAuthor(folder));
		errors.push(...validateLicense(folder));
		errors.push(...validatePackageStructure(folder));
		errors.push(...validateScripts(folder));

		return {
			valid: errors.length === 0,
			errors,
			packageJson,
			path: packagePath,
		};
	} catch (/** @type {unknown} */ error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			valid: false,
			errors: [
				{
					code: "PACKAGE_READ_ERROR",
					message,
					field: "package.json",
				},
			],
			packageJson: /** @type {any} */ (null),
			path: packagePath,
		};
	}
}

/**
 * Get all packages in a workspace
 * @param {string} workspaceRoot - Path to workspace root
 * @returns {import('./types.js').PackageInfo[]} Array of package information
 */
export function getWorkspacePackages(workspaceRoot) {
	const packagesDir = join(workspaceRoot, "packages");

	if (!existsSync(packagesDir) || !statSync(packagesDir).isDirectory()) {
		return [];
	}

	const packages = [];
	const entries = readdirSync(packagesDir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			const packagePath = join(packagesDir, entry.name);
			if (isValidPackage(packagePath)) {
				try {
					packages.push(getPackageInfo(packagePath));
				} catch (/** @type {unknown} */ error) {
					// Skip invalid packages
					const message =
						error instanceof Error ? error.message : String(error);
					console.warn(`⚠️  Skipping ${entry.name}: ${message}`);
				}
			}
		}
	}

	return packages;
}

/**
 * Validate all packages in a workspace
 * @param {string} workspaceRoot - Path to workspace root
 * @returns {import('./types.js').WorkspaceValidationResult} Workspace validation result
 */
export function validateWorkspace(workspaceRoot) {
	const packages = getWorkspacePackages(workspaceRoot);
	const results = packages.map((pkg) => validatePackage(pkg.path));

	const valid = results.every((result) => result.valid);

	return {
		valid,
		results,
		packages,
	};
}
