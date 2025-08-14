/**
 * @fileoverview Package filtering utilities for scripts
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Get all packages in the workspace
 * @param {string} [root] - Workspace root directory
 * @returns {Promise<Array<{name: string, path: string, private: boolean, packageJson: Object}>>}
 */
export async function getPackages(root = process.cwd()) {
	const packagesDir = join(root, "packages");

	try {
		const entries = await readdir(packagesDir, { withFileTypes: true });
		const packages = [];

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const packagePath = join(packagesDir, entry.name);
				const packageJsonPath = join(packagePath, "package.json");

				try {
					const packageJson = JSON.parse(
						await readFile(packageJsonPath, "utf8"),
					);

					packages.push({
						name: packageJson.name,
						path: packagePath,
						private: packageJson.private || false,
						packageJson,
					});
				} catch (error) {
					// Skip packages without valid package.json
					console.warn(`⚠️  Skipping ${entry.name}: invalid package.json`);
				}
			}
		}

		return packages;
	} catch (error) {
		console.error("❌ Error reading packages directory:", error.message);
		return [];
	}
}

/**
 * Get public packages (non-private)
 * @param {string} [root] - Workspace root directory
 * @returns {Promise<Array<{name: string, path: string, private: boolean, packageJson: Object}>>}
 */
export async function getPublicPackages(root = process.cwd()) {
	const packages = await getPackages(root);
	return packages.filter((pkg) => !pkg.private);
}

/**
 * Get private packages
 * @param {string} [root] - Workspace root directory
 * @returns {Promise<Array<{name: string, path: string, private: boolean, packageJson: Object}>>}
 */
export async function getPrivatePackages(root = process.cwd()) {
	const packages = await getPackages(root);
	return packages.filter((pkg) => pkg.private);
}

/**
 * Get package paths for npm workspaces commands
 * @param {Array<{path: string}>} packages - Array of package objects
 * @returns {Array<string>} Array of package paths
 */
export function getPackagePaths(packages) {
	return packages.map((pkg) => pkg.path);
}

/**
 * Get package names for display/logging
 * @param {Array<{name: string}>} packages - Array of package objects
 * @returns {Array<string>} Array of package names
 */
export function getPackageNames(packages) {
	return packages.map((pkg) => pkg.name);
}

/**
 * Log package information for debugging
 * @param {Array<{name: string, private: boolean}>} packages - Array of package objects
 * @param {string} [prefix] - Prefix for log messages
 */
export function logPackages(packages, prefix = "Packages") {
	console.log(`📦 ${prefix}:`);
	for (const pkg of packages) {
		const status = pkg.private ? "🔒 private" : "🌐 public";
		console.log(`   ${pkg.name} (${status})`);
	}
}
