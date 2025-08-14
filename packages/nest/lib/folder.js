/**
 * @fileoverview Folder management with file listings
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Modern ECMAScript class for managing folders with file listings
 */
export class Folder {
	#rootPath = /** @type {string|null} */ (null);
	#listing = new Map();
	#gitignorePatterns = /** @type {string[]} */ ([]);

	/**
	 * Create a new Folder instance
	 * @param {string} [folderPath] - Path to the folder to load
	 */
	constructor(folderPath = undefined) {
		if (folderPath) {
			this.setRootPath(folderPath);
			this.loadFolder();
		}
	}

	/**
	 * Get the root path
	 * @returns {string|null} The root path or null if not set
	 */
	get rootPath() {
		return this.#rootPath;
	}

	/**
	 * Set the root path
	 * @param {string} path - The new root path
	 */
	setRootPath(path) {
		this.#rootPath = resolve(path);
		this.loadGitignore();
	}

	/**
	 * Get the file listing
	 * @returns {Object} Object with file paths as keys and content as values
	 */
	get listing() {
		return Object.fromEntries(this.#listing);
	}

	/**
	 * Add a file to the listing
	 * @param {string} filePath - Relative path to the file
	 * @param {string} content - File content
	 */
	addFile(filePath, content) {
		this.#listing.set(filePath, content);
	}

	/**
	 * Remove a file from the listing
	 * @param {string} filePath - Relative path to the file
	 * @returns {boolean} True if file was removed, false if not found
	 */
	removeFile(filePath) {
		return this.#listing.delete(filePath);
	}

	/**
	 * Get file content
	 * @param {string} filePath - Relative path to the file
	 * @returns {string|undefined} File content or undefined if not found
	 */
	getFile(filePath) {
		return this.#listing.get(filePath);
	}

	/**
	 * Check if file exists in listing
	 * @param {string} filePath - Relative path to the file
	 * @returns {boolean} True if file exists
	 */
	hasFile(filePath) {
		return this.#listing.has(filePath);
	}

	/**
	 * Get all file paths in the listing
	 * @returns {string[]} Array of file paths
	 */
	getFilePaths() {
		return Array.from(this.#listing.keys());
	}

	/**
	 * Clear all files from the listing
	 */
	clear() {
		this.#listing.clear();
	}

	/**
	 * Get the number of files in the listing
	 * @returns {number} Number of files
	 */
	get size() {
		return this.#listing.size;
	}

	/**
	 * Load .gitignore patterns from the root path
	 * @private
	 */
	loadGitignore() {
		if (!this.#rootPath) return;

		const gitignorePath = join(this.#rootPath, ".gitignore");
		if (!existsSync(gitignorePath)) return;

		try {
			const content = readFileSync(gitignorePath, "utf8");
			this.#gitignorePatterns = content
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line && !line.startsWith("#"));
		} catch {
			// Ignore gitignore loading errors
		}
	}

	/**
	 * Check if a path should be ignored based on .gitignore patterns
	 * @param {string} filePath - File path to check
	 * @returns {boolean} True if file should be ignored
	 * @private
	 */
	shouldIgnore(filePath) {
		if (!this.#gitignorePatterns.length) return false;

		return this.#gitignorePatterns.some((pattern) => {
			// Simple pattern matching - can be enhanced later
			if (pattern.includes("*")) {
				// Basic glob pattern support - need to handle end of string properly
				const regex = new RegExp(
					`${pattern
						.replace(/\./g, "\\.")
						.replace(/\*/g, ".*")
						.replace(/\?/g, ".")}$`, // Ensure pattern matches end of string
				);
				return regex.test(filePath);
			}
			// For exact matches, check if the file path ends with the pattern
			// or if the pattern is a directory and the file is in that directory
			return filePath === pattern || filePath.startsWith(`${pattern}/`);
		});
	}

	/**
	 * Load all files from the folder into the listing
	 * @private
	 */
	loadFolder() {
		if (!this.#rootPath || !existsSync(this.#rootPath)) return;

		this.#listing.clear();
		this.loadFilesRecursive(this.#rootPath, "");
	}

	/**
	 * Recursively load files from a directory
	 * @param {string} currentPath - Current directory path
	 * @param {string} relativePath - Relative path from root
	 * @private
	 */
	loadFilesRecursive(currentPath, relativePath) {
		try {
			const entries = readdirSync(currentPath, { withFileTypes: true });

			for (const entry of entries) {
				const entryPath = join(currentPath, entry.name);
				const entryRelativePath = relativePath
					? join(relativePath, entry.name)
					: entry.name;

				// Skip if should be ignored
				if (this.shouldIgnore(entryRelativePath)) continue;

				if (entry.isDirectory()) {
					// Recursively load subdirectories
					this.loadFilesRecursive(entryPath, entryRelativePath);
				} else if (entry.isFile()) {
					// Load file content
					try {
						const content = readFileSync(entryPath, "utf8");
						this.#listing.set(entryRelativePath, content);
					} catch {
						// Skip files that can't be read as text
					}
				}
			}
		} catch {
			// Ignore directory reading errors
		}
	}

	/**
	 * Reload the folder (useful after .gitignore changes)
	 */
	reload() {
		this.loadFolder();
	}

	/**
	 * Get files matching a pattern
	 * @param {string|RegExp} pattern - Pattern to match against file paths
	 * @returns {Object} Object with matching files
	 */
	getFilesMatching(pattern) {
		const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
		const matches = {};

		for (const [filePath, content] of this.#listing) {
			if (regex.test(filePath)) {
				/** @type {any} */ (matches)[filePath] = content;
			}
		}

		return matches;
	}

	/**
	 * Get files by extension
	 * @param {string} extension - File extension (with or without dot)
	 * @returns {Object} Object with matching files
	 */
	getFilesByExtension(extension) {
		const ext = extension.startsWith(".") ? extension : `.${extension}`;
		return this.getFilesMatching(new RegExp(`\\${ext}$`));
	}

	/**
	 * Convert to plain object for serialization
	 * @returns {Object} Plain object representation
	 */
	toJSON() {
		return {
			rootPath: this.#rootPath,
			listing: this.listing,
			size: this.size,
		};
	}
}
