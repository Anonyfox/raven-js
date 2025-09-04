/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static artifact implementation.
 *
 * Handles directories containing static files (HTML, CSS, JS, images, etc.)
 * that are served directly without server-side processing.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { Base } from "./base.js";

/**
 * @typedef {Object} StaticArtifactConfig
 * @property {'static'} type - Artifact type identifier
 * @property {string} path - Path to the static files directory
 * @property {string} [indexFile] - Default index file (e.g., 'index.html')
 * @property {string[]} [excludePatterns] - Glob patterns for files to exclude
 */

/**
 * @typedef {Object} FileMetadata
 * @property {string} checksum - SHA-256 hash of file content
 * @property {number} size - File size in bytes
 * @property {string} mimeType - MIME type of the file
 * @property {Date} lastModified - File last modified timestamp
 */

/**
 * @typedef {Object} FileManifest
 * @property {Record<string, FileMetadata>} files - Map of relative file paths to metadata
 * @property {number} totalSize - Total size of all files in bytes
 * @property {number} fileCount - Number of files
 * @property {Date} scannedAt - When the scan was performed
 */

/**
 * Static artifact for static file directories.
 * Represents directories of static files that are served directly.
 *
 * **Characteristics:**
 * - Directory of static files (HTML, CSS, JS, images, etc.)
 * - No server-side processing required
 * - Platform-independent
 * - Served directly by web servers or CDNs
 */
export class StaticArtifact extends Base {
	/** @type {string} */
	#indexFile;

	/** @type {string[]} */
	#excludePatterns;

	/** @type {FileManifest|null} */
	#manifest;

	/**
	 * Creates a new static artifact instance.
	 *
	 * @param {StaticArtifactConfig} config - Static artifact configuration
	 */
	constructor(config) {
		super(config.path);

		if (config.type !== "static") {
			throw new Error(
				"Artifact type must be 'static' for StaticArtifact instances",
			);
		}

		this.#indexFile = config.indexFile ?? "index.html";
		this.#excludePatterns = config.excludePatterns ?? [];
		this.#manifest = null;
	}

	/**
	 * Gets the default index file.
	 *
	 * @returns {string} Index file name
	 */
	getIndexFile() {
		return this.#indexFile;
	}

	/**
	 * Gets the exclude patterns.
	 *
	 * @returns {string[]} Array of glob patterns to exclude
	 */
	getExcludePatterns() {
		return [...this.#excludePatterns];
	}

	/**
	 * Gets the artifact type identifier.
	 *
	 * @returns {string} Always returns 'static'
	 */
	getType() {
		return "static";
	}

	/**
	 * Validates the static artifact configuration.
	 *
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		const errors = [...super.validate()];

		// Validate index file format
		if (
			typeof this.#indexFile !== "string" ||
			this.#indexFile.trim().length === 0
		) {
			errors.push(new Error("Index file must be a non-empty string"));
		}

		// Validate exclude patterns format
		if (!Array.isArray(this.#excludePatterns)) {
			errors.push(new Error("Exclude patterns must be an array"));
		} else {
			for (let i = 0; i < this.#excludePatterns.length; i++) {
				if (typeof this.#excludePatterns[i] !== "string") {
					errors.push(
						new Error(`Exclude pattern at index ${i} must be a string`),
					);
				}
			}
		}

		return errors;
	}

	/**
	 * Scans the directory and builds a file manifest with checksums.
	 * Generic method that works for any deployment target.
	 *
	 * @returns {Promise<FileManifest>} File manifest with metadata
	 */
	async scan() {
		/** @type {Record<string, FileMetadata>} */
		const files = {};
		let totalSize = 0;
		let fileCount = 0;

		/**
		 * @param {string} dirPath
		 * @param {string} basePath
		 */
		const scanDirectory = async (dirPath, basePath = "") => {
			const entries = await readdir(dirPath, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name);
				const relativePath = join(basePath, entry.name).replace(/\\/g, "/");

				if (entry.isDirectory()) {
					await scanDirectory(fullPath, relativePath);
				} else if (entry.isFile()) {
					// Skip files matching exclude patterns
					if (this.#shouldExcludeFile(relativePath)) {
						continue;
					}

					const fileStats = await stat(fullPath);
					const content = await readFile(fullPath);
					const checksum = createHash("sha256").update(content).digest("hex");
					const mimeType = this.#getMimeType(relativePath);

					files[`/${relativePath}`] = {
						checksum,
						size: fileStats.size,
						mimeType,
						lastModified: fileStats.mtime,
					};

					totalSize += fileStats.size;
					fileCount++;
				}
			}
		};

		await scanDirectory(this.getPath());

		this.#manifest = {
			files,
			totalSize,
			fileCount,
			scannedAt: new Date(),
		};

		return this.#manifest;
	}

	/**
	 * Gets the file manifest. Scans if not already done.
	 *
	 * @returns {Promise<FileManifest>} File manifest
	 */
	async getManifest() {
		if (!this.#manifest) {
			await this.scan();
		}
		return /** @type {FileManifest} */ (this.#manifest);
	}

	/**
	 * Gets the list of file paths.
	 *
	 * @returns {Promise<string[]>} Array of relative file paths
	 */
	async getFilePaths() {
		const manifest = await this.getManifest();
		return Object.keys(manifest.files);
	}

	/**
	 * Gets the total size of all files.
	 *
	 * @returns {Promise<number>} Total size in bytes
	 */
	async getTotalSize() {
		const manifest = await this.getManifest();
		return manifest.totalSize;
	}

	/**
	 * Gets the number of files.
	 *
	 * @returns {Promise<number>} File count
	 */
	async getFileCount() {
		const manifest = await this.getManifest();
		return manifest.fileCount;
	}

	/**
	 * Gets the most recent file modification time.
	 *
	 * @returns {Promise<Date>} Most recent modification date
	 */
	async getLastModified() {
		const manifest = await this.getManifest();
		let latest = new Date(0);

		for (const fileMetadata of Object.values(manifest.files)) {
			if (fileMetadata.lastModified > latest) {
				latest = fileMetadata.lastModified;
			}
		}

		return latest;
	}

	/**
	 * Checks if a file should be excluded based on patterns.
	 *
	 * @param {string} filePath - Relative file path
	 * @returns {boolean} True if file should be excluded
	 */
	#shouldExcludeFile(filePath) {
		// Simple pattern matching for now (could be enhanced with glob library)
		for (const pattern of this.#excludePatterns) {
			// Handle wildcard patterns like *.tmp
			if (pattern.startsWith("*.")) {
				const extension = pattern.slice(1); // Remove the *
				if (filePath.endsWith(extension)) {
					return true;
				}
			}
			// Handle directory patterns and exact matches
			else if (filePath.includes(pattern) || filePath.endsWith(pattern)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Gets MIME type for a file based on extension.
	 * Generic implementation covering common web file types.
	 *
	 * @param {string} filePath - File path
	 * @returns {string} MIME type
	 */
	#getMimeType(filePath) {
		const ext = extname(filePath).toLowerCase();
		/** @type {Record<string, string>} */
		const mimeTypes = {
			".html": "text/html",
			".htm": "text/html",
			".css": "text/css",
			".js": "application/javascript",
			".mjs": "application/javascript",
			".json": "application/json",
			".xml": "application/xml",
			".txt": "text/plain",
			".md": "text/markdown",
			".png": "image/png",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".gif": "image/gif",
			".svg": "image/svg+xml",
			".ico": "image/x-icon",
			".webp": "image/webp",
			".avif": "image/avif",
			".woff": "font/woff",
			".woff2": "font/woff2",
			".ttf": "font/ttf",
			".otf": "font/otf",
			".pdf": "application/pdf",
			".zip": "application/zip",
		};
		return mimeTypes[ext] || "application/octet-stream";
	}

	/**
	 * Prepares the static artifact for deployment.
	 *
	 * @returns {Promise<object>} Deployment-ready artifact information
	 */
	async prepare() {
		const errors = this.validate();
		if (errors.length > 0) {
			throw new Error(
				`Static artifact validation failed: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		// Ensure manifest is built
		const manifest = await this.getManifest();

		return {
			type: this.getType(),
			path: this.getPath(),
			indexFile: this.#indexFile,
			excludePatterns: this.getExcludePatterns(),
			manifest: manifest.files,
			totalSize: manifest.totalSize,
			fileCount: manifest.fileCount,
			executable: false,
			runtime: null, // Static files don't need runtime
		};
	}
}
