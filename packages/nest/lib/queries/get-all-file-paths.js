/**
 * @file Recursive file path discovery utilities with gitignore support
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Gets all file paths in a directory recursively, respecting .gitignore files
 * @param {string} directoryPath - The path to the directory
 * @returns {string[]} Array of relative file paths
 * @throws {Error} Informative error message if validation fails
 */
export const GetAllFilePaths = (directoryPath) => {
	if (typeof directoryPath !== "string" || directoryPath === "") {
		throw new Error("Directory path must be a non-empty string");
	}

	const absolutePath = resolve(directoryPath);

	if (!existsSync(absolutePath)) {
		throw new Error(`Directory does not exist: ${directoryPath}`);
	}

	const gitignorePatterns = loadGitignorePatterns(absolutePath);
	return readDirectoryRecursive(absolutePath, "", gitignorePatterns);
};

/**
 * Load gitignore patterns from all parent directories up to the folder path
 * @param {string} folderPath - The absolute path to start loading from
 * @returns {string[]} Array of gitignore patterns
 */
function loadGitignorePatterns(folderPath) {
	const patterns = [];
	let currentPath = folderPath;

	while (currentPath && currentPath !== resolve(currentPath, "..")) {
		const gitignorePath = join(currentPath, ".gitignore");
		if (existsSync(gitignorePath)) {
			try {
				const content = readFileSync(gitignorePath, "utf8");
				const localPatterns = content
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line && !line.startsWith("#"));
				patterns.push(...localPatterns);
			} catch {
				// Ignore gitignore reading errors
			}
		}
		currentPath = resolve(currentPath, "..");
	}

	return patterns;
}

/**
 * Check if a relative path should be ignored based on gitignore patterns
 * @param {string} relativePath - Path relative to the folder root
 * @param {string[]} gitignorePatterns - Array of gitignore patterns
 * @returns {boolean} True if the path should be ignored
 */
function shouldIgnore(relativePath, gitignorePatterns) {
	if (!gitignorePatterns.length) return false;

	return gitignorePatterns.some((pattern) => {
		// Handle directory patterns (ending with /)
		if (pattern.endsWith("/")) {
			const dirPattern = pattern.slice(0, -1);
			return (
				relativePath === dirPattern || relativePath.startsWith(`${dirPattern}/`)
			);
		}

		// Handle glob patterns
		if (pattern.includes("*")) {
			const regexPattern = pattern
				.replace(/\./g, "\\.")
				.replace(/\*/g, ".*")
				.replace(/\?/g, ".");
			const regex = new RegExp(`^${regexPattern}$`);
			return regex.test(relativePath);
		}

		// Exact match or prefix match for directories
		return relativePath === pattern || relativePath.startsWith(`${pattern}/`);
	});
}

/**
 * Recursively read directory contents and collect file paths
 * @param {string} currentPath - Current absolute directory path
 * @param {string} relativePath - Relative path from the root directory
 * @param {string[]} gitignorePatterns - Array of gitignore patterns
 * @returns {string[]} Array of relative file paths
 */
function readDirectoryRecursive(currentPath, relativePath, gitignorePatterns) {
	const filePaths = [];

	try {
		const entries = readdirSync(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			const entryRelativePath = relativePath
				? join(relativePath, entry.name).replace(/\\/g, "/")
				: entry.name;

			// Skip if should be ignored according to gitignore patterns
			if (shouldIgnore(entryRelativePath, gitignorePatterns)) {
				continue;
			}

			if (entry.isDirectory()) {
				// Recursively process subdirectory
				const subDirPath = join(currentPath, entry.name);
				const subPaths = readDirectoryRecursive(
					subDirPath,
					entryRelativePath,
					gitignorePatterns,
				);
				filePaths.push(...subPaths);
			} else if (entry.isFile()) {
				// Add file path
				filePaths.push(entryRelativePath);
			}
		}
	} catch (error) {
		throw new Error(
			`Failed to read directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return filePaths;
}
