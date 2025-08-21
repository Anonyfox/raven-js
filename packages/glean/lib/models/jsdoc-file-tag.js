/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc file tag model - comprehensive file-level documentation.
 *
 * Ravens claim territory with territorial precision.
 * Parses file-level descriptions that explain module purpose,
 * architecture context, and overall responsibility.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc file tag implementation
 *
 * **Official JSDoc Tag:** Provides documentation for an entire file describing its purpose.
 * **Aliases:** fileoverview tag, overview tag (file, fileoverview, overview are all valid)
 *
 * **Syntax:**
 * - Standard: `File description content`
 * - Multi-line: Content spans multiple lines with detailed explanations
 * - Combined: Often used with other file-level tags like author, license, copyright
 *
 * **Content Handling:**
 * - Free-form description text
 * - May contain markdown-style formatting
 * - Typically explains module purpose, architecture overview, or usage context
 * - Can reference other files, dependencies, or related documentation
 *
 * **Usage Status:** Very common and considered best practice. Every significant file
 * should have file-level documentation explaining its purpose and contents.
 *
 * **Primary Use Cases:**
 * - Module purpose and responsibility documentation
 * - Architecture overview and design decisions
 * - Main entry point documentation
 * - Library or package overview descriptions
 * - Configuration file explanations
 * - Complex algorithm or business logic context
 *
 * **Best Practices:**
 * - Place at the very top of file before any imports or code
 * - Keep description concise but comprehensive enough to understand purpose
 * - Mention key exports, classes, or functionality provided
 * - Include architectural context when file is part of larger system
 * - Reference related files or documentation when relevant
 * - Combine with author, license, version tags for complete file metadata
 * - Use consistent tone and style across project files
 */
export class JSDocFileTag extends JSDocTagBase {
	/**
	 * Create file tag instance
	 * @param {string} rawContent - Raw file tag content
	 */
	constructor(rawContent) {
		super("file", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "file";
	}

	/**
	 * Parse file tag content
	 */
	parseContent() {
		// File tag content is simply the description text
		// No special parsing needed - everything is description
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate file tag structure
	 */
	validate() {
		// File tag should have some description content
		this.isValidated = Boolean(this.description && this.description.length > 0);
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		return html`
			<div class="file-info">
				<strong class="file-label">File:</strong> ${this.description}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		return `**File:** ${this.description}`;
	}
}
