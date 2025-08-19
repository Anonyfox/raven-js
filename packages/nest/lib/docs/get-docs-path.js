/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * @packageDocumentation
 *
 * Find workspace root by walking up directory tree
 */
function findWorkspaceRoot(/** @type {string} */ startPath) {
	let currentPath = resolve(startPath);

	while (currentPath !== dirname(currentPath)) {
		const packageJsonPath = join(currentPath, "package.json");

		if (existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

				// Check if this is a workspace root
				if (
					packageJson.workspaces &&
					Array.isArray(packageJson.workspaces) &&
					packageJson.workspaces.length > 0
				) {
					return currentPath;
				}
			} catch {
				// Ignore invalid package.json files
			}
		}

		currentPath = dirname(currentPath);
	}

	throw new Error(
		"Workspace root not found. No package.json with 'workspaces' array found in parent directories.",
	);
}

/**
 * Get the docs folder path from workspace root
 * @param {string} [startPath="."] - Starting path to search from (defaults to current directory)
 * @returns {string} Absolute path to the docs folder
 * @throws {Error} If workspace root cannot be found
 */
export function getDocsPath(startPath = ".") {
	const workspaceRoot = findWorkspaceRoot(startPath);
	const docsPath = join(workspaceRoot, "docs");

	return docsPath;
}

/**
 * Get the workspace root path
 * @param {string} [startPath="."] - Starting path to search from (defaults to current directory)
 * @returns {string} Absolute path to the workspace root
 * @throws {Error} If workspace root cannot be found
 */
export function getWorkspaceRoot(startPath = ".") {
	return findWorkspaceRoot(startPath);
}
