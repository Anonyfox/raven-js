/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Metadata handling for script banner generation.
 *
 * Manages package.json metadata extraction and banner generation with
 * override capabilities for deployment-specific branding.
 */

import { extractMetadata, readPackageJson } from "./import-package-json.js";

/**
 * Metadata management for executable banner generation
 */
export class Metadata {
	/**
	 * Application name
	 * @type {string}
	 */
	name;

	/**
	 * Version string
	 * @type {string}
	 */
	version;

	/**
	 * Description text
	 * @type {string}
	 */
	description;

	/**
	 * Author information
	 * @type {string}
	 */
	author;

	/**
	 * Build URL for reference
	 * @type {string}
	 */
	buildUrl;

	/**
	 * Enable banner generation
	 * @type {boolean}
	 */
	banner;

	/**
	 * Create Metadata instance
	 * @param {Object} metadata - Metadata configuration
	 * @param {string} [metadata.name] - Application name
	 * @param {string} [metadata.version] - Version string
	 * @param {string} [metadata.description] - Description text
	 * @param {string} [metadata.author] - Author information
	 * @param {string} [metadata.buildUrl="https://ravenjs.dev"] - Build URL
	 * @param {boolean} [metadata.banner=true] - Enable banner generation
	 */
	constructor(metadata) {
		this.name = metadata.name || "";
		this.version = metadata.version || "";
		this.description = metadata.description || "";
		this.author = metadata.author || "";
		this.buildUrl = metadata.buildUrl || "https://ravenjs.dev";
		this.banner = metadata.banner !== false; // Default to true
	}

	/**
	 * Create metadata from package.json with optional overrides
	 * @param {Object} [overrides={}] - Override values
	 * @param {string} [overrides.name] - Override application name
	 * @param {string} [overrides.version] - Override version string
	 * @param {string} [overrides.description] - Override description
	 * @param {string} [overrides.author] - Override author information
	 * @param {string} [overrides.buildUrl] - Override build URL
	 * @param {boolean} [overrides.banner] - Override banner generation flag
	 * @returns {Metadata} Metadata instance with package.json + overrides
	 */
	static fromPackageJson(overrides = {}) {
		try {
			const packageJson = readPackageJson();
			const packageMetadata = extractMetadata(packageJson);

			// Merge package.json metadata with overrides
			const metadata = {
				name: overrides.name || packageMetadata.name,
				version: overrides.version || packageMetadata.version,
				description: overrides.description || packageMetadata.description,
				author: overrides.author || packageMetadata.author,
				buildUrl: overrides.buildUrl || "https://ravenjs.dev",
				banner: overrides.banner !== false, // Default to true
			};

			return new Metadata(metadata);
		} catch {
			// Fallback to override-only metadata if package.json issues
			const metadata = {
				name: overrides.name || "Unknown Application",
				version: overrides.version || "0.0.0",
				description: overrides.description || "",
				author: overrides.author || "Unknown Author",
				buildUrl: overrides.buildUrl || "https://ravenjs.dev",
				banner: overrides.banner !== false,
			};

			return new Metadata(metadata);
		}
	}

	/**
	 * Generate banner comment block for executable
	 * @returns {string} Multi-line banner comment
	 */
	generateBanner() {
		if (!this.banner) {
			return "";
		}

		const lines = [
			"*".repeat(60),
			`${this.name} v${this.version}`,
			"",
			this.description || "No description",
			"",
			`- by ${this.author}, built with ${this.buildUrl}`,
			"",
			`build timestamp: ${new Date().toISOString()}`,
			"*".repeat(60),
		];

		return lines.map((line) => `// ${line}`).join("\n");
	}

	/**
	 * Get application name
	 * @returns {string} Application name
	 */
	getName() {
		return this.name;
	}

	/**
	 * Get version string
	 * @returns {string} Version string
	 */
	getVersion() {
		return this.version;
	}

	/**
	 * Get description
	 * @returns {string} Description text
	 */
	getDescription() {
		return this.description;
	}

	/**
	 * Get author information
	 * @returns {string} Author string
	 */
	getAuthor() {
		return this.author;
	}

	/**
	 * Get build URL
	 * @returns {string} Build URL
	 */
	getBuildUrl() {
		return this.buildUrl;
	}

	/**
	 * Check if banner generation is enabled
	 * @returns {boolean} Banner enabled flag
	 */
	isBannerEnabled() {
		return this.banner;
	}
}
