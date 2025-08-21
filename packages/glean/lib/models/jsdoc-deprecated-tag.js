/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc deprecated tag model - deprecation notice documentation.
 *
 * Ravens mark obsolete territories with warning precision.
 * Parses deprecated declarations that specify outdated functionality,
 * replacement guidance, and migration paths for legacy code elements.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc deprecated tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as deprecated and should not be used in new code.
 * **Purpose:** Provides deprecation warnings, migration guidance, and timeline information for obsolete functionality.
 *
 * **Syntax:**
 * - Simple deprecation: No additional content (just the tag itself)
 * - Migration guidance: `Use newFunction() instead` - Replacement recommendations
 * - Version deprecation: `since version 2.0.0` - Deprecation timeline information
 * - Detailed notice: `Will be removed in v3.0. Use alternative approach` - Comprehensive deprecation guidance
 * - Reason explanation: `Replaced by more secure implementation` - Deprecation reasoning
 *
 * **Deprecation Information Types:**
 * - Simple notices: Basic deprecation marking without additional context
 * - Migration paths: Specific guidance on replacement functions or approaches
 * - Version timelines: When deprecation occurred and removal expectations
 * - Security notices: Deprecation due to security vulnerabilities or concerns
 * - Performance notices: Deprecation due to performance issues or better alternatives
 * - API evolution: Deprecation as part of API modernization and improvement
 *
 * **Usage Status:** Common in library and framework development for managing
 * API evolution and providing backward compatibility warnings.
 *
 * **Primary Use Cases:**
 * - Library API evolution and backward compatibility management
 * - Security vulnerability mitigation and replacement guidance
 * - Performance optimization and modernization notices
 * - Breaking change preparation and migration assistance
 * - Code cleanup and technical debt reduction
 * - User experience improvement through better API design
 *
 * **Best Practices:**
 * - Always provide clear migration guidance when possible
 * - Include version information for deprecation timeline context
 * - Explain the reasoning behind deprecation when not obvious
 * - Provide working alternatives and replacement recommendations
 * - Use consistent deprecation notice format across project
 * - Consider gradual deprecation with warning periods before removal
 * - Document any breaking changes that will accompany removal
 */
export class JSDocDeprecatedTag extends JSDocTagBase {
	/**
	 * Create deprecated tag instance
	 * @param {string} rawContent - Raw deprecated tag content
	 */
	constructor(rawContent) {
		super("deprecated", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "deprecated";
	}

	/**
	 * Parse deprecated tag content
	 */
	parseContent() {
		// Deprecated tag content is typically a description or migration guide
		this.reason = this.rawContent?.trim() || "";

		// Try to extract version information if present
		const versionMatch = this.reason.match(
			/(?:since|from|in)\s+(?:version\s+)?([v]?\d+\.\d+(?:\.\d+)?)/i,
		);
		if (versionMatch) {
			this.deprecatedSince = versionMatch[1];
		} else {
			this.deprecatedSince = "";
		}

		// Check if migration guidance is provided
		this.hasMigrationGuidance =
			/(?:use|try|replace|instead|alternative|migrate)/i.test(this.reason);
	}

	/**
	 * Validate deprecated tag structure
	 */
	validate() {
		// Deprecated tag is always valid - it's a marker tag that can be standalone
		this.isValidated = true;
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.reason) {
			return html`<div class="deprecated-info"><strong class="deprecated-label">⚠️ Deprecated:</strong> ${this.reason}</div>`;
		}
		return html`<div class="deprecated-info"><strong class="deprecated-label">⚠️ Deprecated</strong></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.reason) {
			return `**⚠️ Deprecated:** ${this.reason}`;
		}
		return `**⚠️ Deprecated**`;
	}
}
