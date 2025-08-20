/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc since tag model - version tracking documentation.
 *
 * Ravens track temporal territories with chronological precision.
 * Parses since declarations that specify version introduction, feature
 * addition timing, and historical evolution tracking for code elements.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc since tag implementation
 *
 * **Official JSDoc Tag:** Documents the version when a feature, function, or element was introduced.
 * **Purpose:** Provides version tracking, feature evolution history, and API introduction timeline.
 *
 * **Syntax:**
 * - Semantic version: `1.0.0`, `2.1.3`, `v3.0.0-beta` - Standard semantic versioning
 * - Date version: `2024-01-15`, `2024.01.15` - Date-based version tracking
 * - Named version: `Legacy`, `Initial`, `Release` - Named version identifiers
 * - Version with description: `1.2.0 Added new parameter support` - Version with change notes
 * - Complex versioning: `1.0.0-alpha.1+build.123` - Complex version metadata
 *
 * **Version Tracking Types:**
 * - Feature introduction: When new functionality was added to the codebase
 * - API evolution: When methods, parameters, or interfaces were introduced
 * - Deprecation tracking: Historical context for deprecated features
 * - Breaking changes: When significant API changes were introduced
 * - Enhancement tracking: When improvements or optimizations were added
 * - Bug fix introduction: When fixes or patches were applied
 *
 * **Usage Status:** Common in library and framework development for API
 * evolution tracking and backward compatibility documentation.
 *
 * **Primary Use Cases:**
 * - Library API version tracking and evolution documentation
 * - Feature introduction timeline and historical context
 * - Deprecation warning and migration path documentation
 * - Breaking change identification and version correlation
 * - Development milestone and release tracking
 * - Backward compatibility and support timeline documentation
 *
 * **Best Practices:**
 * - Use consistent version format across the entire project
 * - Follow semantic versioning principles when applicable
 * - Include meaningful descriptions for significant version changes
 * - Update version information when features are modified or enhanced
 * - Maintain accurate version tracking for API evolution documentation
 * - Consider using version ranges for features spanning multiple releases
 * - Document breaking changes with clear version boundaries
 */
export class JSDocSinceTag extends JSDocTagBase {
	/**
	 * Create since tag instance
	 * @param {string} rawContent - Raw since tag content
	 */
	constructor(rawContent) {
		super("since", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "since";
	}

	/**
	 * Parse since tag content
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			this.version = "";
			this.description = "";
			this.versionType = "unknown";
			return;
		}

		const content = this.rawContent.trim();

		// Try to extract version and description
		// Look for version-like patterns at the start
		const versionMatch = content.match(/^([^\s]+)(?:\s+(.+))?$/);

		if (versionMatch) {
			this.version = versionMatch[1];
			this.description = versionMatch[2]?.trim() || "";

			// Determine version type
			this.versionType = this.detectVersionType(this.version);
		} else {
			// Fallback: treat entire content as version
			this.version = content;
			this.description = "";
			this.versionType = this.detectVersionType(this.version);
		}
	}

	/**
	 * Detect version type based on format
	 * @param {string} version - Version string to analyze
	 * @returns {string} Version type
	 */
	detectVersionType(version) {
		if (!version) return "unknown";

		// Date pattern (YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD) - check first
		if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(version)) {
			return "date";
		}

		// Semantic versioning pattern (exactly X.Y.Z with optional prerelease/build, no extra numeric parts)
		if (/^v?\d+\.\d+\.\d+(?:[-+].*)?$/.test(version)) {
			return "semver";
		}

		// Simple numeric version (any number of dot-separated numeric parts)
		if (/^\d+(\.\d+)*$/.test(version)) {
			return "numeric";
		}

		// Named version
		return "named";
	}

	/**
	 * Validate since tag structure
	 */
	validate() {
		// Since tag should have version content
		this.isValidated = Boolean(this.version?.trim());
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			version: this.version || "",
			description: this.description || "",
			versionType: this.versionType || "unknown",
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="since-info"><strong class="since-label">Since:</strong> <code class="since-version">${this.version}</code> - ${this.description}</div>`;
		}
		return html`<div class="since-info"><strong class="since-label">Since:</strong> <code class="since-version">${this.version}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.description) {
			return `**Since:** \`${this.version}\` - ${this.description}`;
		}
		return `**Since:** \`${this.version}\``;
	}
}
