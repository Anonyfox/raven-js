/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package entity model - predatory package intelligence.
 *
 * Ravens analyze package.json metadata with surgical precision.
 * Normalizes package configuration, validates semantic versioning,
 * and provides comprehensive package information for documentation.
 */

import { html } from "@raven-js/beak";

/**
 * Package entity implementation
 *
 * **Represents:** Complete package.json metadata with validation and normalization
 *
 * **Core Functionality:**
 * - Package.json parsing and validation
 * - Semantic version validation
 * - Export configuration analysis
 * - Dependency tracking (optional)
 * - Entry point resolution
 *
 * **Serialization:** Clean JSON output for documentation graphs
 */
export class PackageEntity {
	/**
	 * Create package entity instance
	 * @param {any} packageJson - Parsed package.json object
	 */
	constructor(packageJson = {}) {
		// Package identification
		this.name = packageJson.name || "unknown";
		this.version = packageJson.version || "0.0.0";
		this.description = packageJson.description || "";

		// Entry points
		this.main = packageJson.main;
		this.module = packageJson.module;
		this.exports = packageJson.exports || {};

		// Metadata
		this.keywords = packageJson.keywords || [];
		this.author = packageJson.author || "";
		this.license = packageJson.license || "";
		this.homepage = packageJson.homepage || "";
		this.repository = packageJson.repository || {};
		this.bugs = packageJson.bugs || {};

		// Dependencies (optional for documentation)
		this.dependencies = packageJson.dependencies || {};
		this.devDependencies = packageJson.devDependencies || {};
		this.peerDependencies = packageJson.peerDependencies || {};

		// Validation state
		this.isValidated = false;
		/** @type {Array<{type: string, message: string}>} */
		this.validationIssues = [];
	}

	/**
	 * Get package identifier
	 * @returns {string} Package name (unique identifier)
	 */
	getId() {
		return this.name;
	}

	/**
	 * Validate package configuration
	 */
	validate() {
		this.validationIssues = [];

		// Validate required fields
		if (!this.name || this.name === "unknown") {
			this.validationIssues.push({
				type: "missing_name",
				message: "Package name is missing or invalid",
			});
		}

		// Validate semantic versioning
		if (!this.isValidSemver(this.version)) {
			this.validationIssues.push({
				type: "invalid_version",
				message: `Invalid semantic version: ${this.version}`,
			});
		}

		// Validate export configuration
		if (this.exports && typeof this.exports === "object") {
			this.validateExports();
		}

		this.isValidated = this.validationIssues.length === 0;
	}

	/**
	 * Check if version follows semantic versioning
	 * @param {string} version - Version string to validate
	 * @returns {boolean} True if valid semver
	 */
	isValidSemver(version) {
		const semverRegex =
			/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
		return semverRegex.test(version);
	}

	/**
	 * Validate export configuration
	 */
	validateExports() {
		// Basic export validation - check for circular references or invalid paths
		try {
			JSON.stringify(this.exports);
		} catch {
			this.validationIssues.push({
				type: "invalid_exports",
				message: "Package exports configuration contains circular references",
			});
		}
	}

	/**
	 * Check if package is valid
	 * @returns {boolean} True if package is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Get all entry points from package configuration
	 * @returns {Array<{type: string, path: string}>} Array of entry points
	 */
	getEntryPoints() {
		const entryPoints = [];

		if (this.main) {
			entryPoints.push({ type: "main", path: this.main });
		}

		if (this.module) {
			entryPoints.push({ type: "module", path: this.module });
		}

		// Extract entry points from exports
		if (this.exports && typeof this.exports === "object") {
			this.extractExportEntryPoints(this.exports, entryPoints);
		}

		return entryPoints;
	}

	/**
	 * Extract entry points from exports configuration
	 * @param {any} exports - Exports configuration
	 * @param {Array<{type: string, path: string}>} entryPoints - Entry points array to populate
	 */
	extractExportEntryPoints(exports, entryPoints) {
		for (const [key, value] of Object.entries(exports)) {
			if (typeof value === "string") {
				entryPoints.push({ type: "export", path: value, key });
			} else if (typeof value === "object" && value !== null) {
				// Handle conditional exports
				if (value.import) {
					entryPoints.push({ type: "import", path: value.import, key });
				}
				if (value.require) {
					entryPoints.push({ type: "require", path: value.require, key });
				}
				if (value.default) {
					entryPoints.push({ type: "default", path: value.default, key });
				}
			}
		}
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Package-specific serializable data
	 */
	getSerializableData() {
		return {
			name: this.name,
			version: this.version,
			description: this.description,
			main: this.main,
			module: this.module,
			exports: this.exports,
			keywords: this.keywords,
			author: this.author,
			license: this.license,
			homepage: this.homepage,
			repository: this.repository,
			bugs: this.bugs,
			dependencies: this.dependencies,
			devDependencies: this.devDependencies,
			peerDependencies: this.peerDependencies,
			entryPoints: this.getEntryPoints(),
			validationIssues: this.validationIssues,
		};
	}

	/**
	 * Serialize package to JSON format
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			__type: "package",
			__data: this.getSerializableData(),
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for package information
	 */
	toHTML() {
		const entryPoints = this.getEntryPoints();

		return html`
			<div class="package-entity">
				<h2>${this.name}</h2>
				<div class="package-meta">
					<span class="package-version">v${this.version}</span>
					${this.license ? html`<span class="package-license">${this.license}</span>` : ""}
				</div>
				${this.description ? html`<p class="package-description">${this.description}</p>` : ""}
				${
					entryPoints.length > 0
						? html`
					<div class="entry-points">
						<h3>Entry Points</h3>
						<ul class="entry-point-list">
							${entryPoints
								.map(
									(ep) => html`
								<li><strong>${ep.type}:</strong> <code>${ep.path}</code></li>
							`,
								)
								.join("\n")}
						</ul>
					</div>
				`
						: ""
				}
				${
					this.keywords.length > 0
						? html`
					<div class="package-keywords">
						<h3>Keywords</h3>
						${this.keywords.map((keyword) => html`<span class="keyword">${keyword}</span>`).join(" ")}
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for package information
	 */
	toMarkdown() {
		let output = `# ${this.name}\n\n`;
		output += `**Version:** ${this.version}\n`;

		if (this.license) {
			output += `**License:** ${this.license}\n`;
		}

		if (this.description) {
			output += `\n${this.description}\n`;
		}

		const entryPoints = this.getEntryPoints();
		if (entryPoints.length > 0) {
			output += `\n## Entry Points\n\n`;
			for (const ep of entryPoints) {
				output += `- **${ep.type}:** \`${ep.path}\`\n`;
			}
		}

		if (this.keywords.length > 0) {
			output += `\n**Keywords:** ${this.keywords.join(", ")}\n`;
		}

		return output;
	}
}
