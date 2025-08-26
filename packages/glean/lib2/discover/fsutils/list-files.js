/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Pure file listing with gitignore and node_modules filtering.
 *
 * Recursively scans a directory and returns a flat array of relative file paths,
 * respecting gitignore patterns and hardcoded exclusions like node_modules.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { glob } from "./glob.js";

/**
 * Lists all files in a directory recursively, respecting gitignore patterns.
 * important: all paths will be prefixed with "./" for relative path comparisons
 *
 * @param {string} targetPath - Directory path to scan
 * @returns {Set<string>} Set of relative file paths
 */
export function listFiles(targetPath) {
	if (!targetPath || typeof targetPath !== "string") {
		return new Set();
	}

	if (!existsSync(targetPath)) {
		return new Set();
	}

	const hardcodedIgnores = ["node_modules"];

	return new Set(
		scanDirectory(targetPath, "", hardcodedIgnores, targetPath, []).map(
			(path) => `./${path}`,
		),
	);
}

/**
 * Loads gitignore patterns from a specific directory only.
 *
 * @param {string} directoryPath - Directory path to check for .gitignore
 * @returns {string[]} Array of gitignore patterns from this directory only
 */
function loadLocalGitignorePatterns(directoryPath) {
	const gitignorePath = join(directoryPath, ".gitignore");

	if (!existsSync(gitignorePath)) {
		return [];
	}

	try {
		const content = readFileSync(gitignorePath, "utf-8");
		return content
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("#"));
	} catch {
		// Handle cases where .gitignore exists but isn't readable (e.g., is a directory)
		return [];
	}
}

/**
 * Recursively scans directory and collects file paths.
 *
 * @param {string} absolutePath - Current absolute directory path
 * @param {string} relativePath - Relative path from root
 * @param {string[]} hardcodedIgnores - Hard-coded patterns to ignore everywhere
 * @param {string} rootPath - Root path for relative gitignore loading
 * @param {string[]} inheritedPatterns - Gitignore patterns inherited from parent directories
 * @returns {string[]} Array of relative file paths
 */
function scanDirectory(
	absolutePath,
	relativePath,
	hardcodedIgnores,
	rootPath,
	inheritedPatterns,
) {
	const files = [];

	// Load local gitignore patterns for this directory
	const localGitignorePatterns = loadLocalGitignorePatterns(absolutePath);

	// Combine all patterns: hardcoded + inherited + local
	const allIgnorePatterns = [
		...hardcodedIgnores,
		...inheritedPatterns,
		...localGitignorePatterns,
	];

	// Patterns to pass to child directories (inherited + local, but not hardcoded)
	const patternsToInherit = [...inheritedPatterns, ...localGitignorePatterns];

	// Handle directory read errors gracefully
	let entries;
	try {
		entries = readdirSync(absolutePath, { withFileTypes: true });
	} catch {
		// Handle cases where path exists but isn't readable as directory
		return files;
	}

	for (const entry of entries) {
		const entryRelative = relativePath
			? join(relativePath, entry.name).replace(/\\/g, "/")
			: entry.name;

		// Skip if matches ignore patterns
		if (shouldIgnore(entryRelative, allIgnorePatterns)) {
			continue;
		}

		const entryAbsolute = join(absolutePath, entry.name);

		if (entry.isDirectory()) {
			// Recursively scan subdirectory with inherited patterns
			const subFiles = scanDirectory(
				entryAbsolute,
				entryRelative,
				hardcodedIgnores,
				rootPath,
				patternsToInherit, // Pass down all gitignore patterns
			);
			files.push(...subFiles);
		} else if (entry.isFile()) {
			// Add file to results
			files.push(entryRelative);
		}
	}

	return files;
}

/**
 * Checks if a path should be ignored based on patterns.
 *
 * @param {string} path - Relative path to check (e.g., "src/file.js")
 * @param {string[]} patterns - Ignore patterns
 * @returns {boolean} True if path should be ignored
 */
function shouldIgnore(path, patterns) {
	// For files in subdirectories, extract just the filename to test local patterns
	const filename = path.includes("/") ? path.split("/").pop() : path;

	return patterns.some((pattern) => {
		// Directory patterns (ending with /)
		if (pattern.endsWith("/")) {
			const dirPattern = pattern.slice(0, -1);
			return path === dirPattern || path.startsWith(`${dirPattern}/`);
		}

		// Glob patterns with wildcards
		if (pattern.includes("*") || pattern.includes("?")) {
			// Test both full path and just filename for local gitignore patterns
			return glob(pattern, path) || glob(pattern, filename);
		}

		// Exact match or directory prefix match
		return (
			path === pattern || path.startsWith(`${pattern}/`) || filename === pattern
		);
	});
}
