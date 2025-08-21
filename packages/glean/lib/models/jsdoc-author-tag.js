/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc author tag model - authorship metadata documentation.
 *
 * Ravens track authorship information with territorial precision.
 * Parses author declarations that specify code authorship, contact
 * information, and responsibility attribution for documentation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc author tag implementation
 *
 * **Official JSDoc Tag:** Documents the author(s) of code or documentation.
 * **Purpose:** Provides authorship attribution, contact information, and responsibility tracking.
 *
 * **Syntax:**
 * - Name only: `Author Name` - Simple name attribution
 * - Name with email: `Author Name <email@domain.com>` - Standard format with contact
 * - Multiple formats: `Author Name (Organization)` - Organizational attribution
 * - Free-form: Any authorship information pattern or custom format
 *
 * **Author Information Types:**
 * - Individual authorship: Personal name and contact for code responsibility
 * - Organizational authorship: Company, team, or project group attribution
 * - Multiple authors: Several contributors listed in single or multiple tags
 * - Historical attribution: Original and current maintainer information
 * - Contact information: Email addresses, usernames, or professional identifiers
 * - Legacy authorship: Previous authors and code inheritance tracking
 *
 * **Usage Status:** Very common in professional codebases, open source projects,
 * and corporate environments for legal, maintenance, and contact purposes.
 *
 * **Primary Use Cases:**
 * - Legal attribution and copyright tracking
 * - Maintenance responsibility identification
 * - Contact information for code questions
 * - Open source contribution acknowledgment
 * - Corporate code ownership documentation
 * - Historical authorship and evolution tracking
 *
 * **Best Practices:**
 * - Use consistent format across project files for uniformity
 * - Include contact information when appropriate for maintainability
 * - Update authorship when significant changes or ownership transfers occur
 * - Consider privacy and security when including personal contact information
 * - Use multiple tags for multiple authors rather than cramming into one
 * - Follow organizational or project-specific authorship guidelines
 * - Include meaningful attribution that helps with code maintenance
 */
export class JSDocAuthorTag extends JSDocTagBase {
	/**
	 * Create author tag instance
	 * @param {string} rawContent - Raw author tag content
	 */
	constructor(rawContent) {
		super("author", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "author";
	}

	/**
	 * Parse author tag content
	 */
	parseContent() {
		// Author tag content is typically free-form text
		this.authorInfo = this.rawContent?.trim() || "";

		// Try to extract name and email if in standard format
		if (this.authorInfo) {
			const emailMatch = this.authorInfo.match(/^([^<]+?)\s*<([^>]+)>(.*)$/);
			if (emailMatch) {
				this.name = emailMatch[1].trim();
				this.email = emailMatch[2].trim();
				this.additional = emailMatch[3].trim();
			} else {
				// No email format detected, treat as name or free-form
				this.name = this.authorInfo;
				this.email = "";
				this.additional = "";
			}
		} else {
			this.name = "";
			this.email = "";
			this.additional = "";
		}
	}

	/**
	 * Validate author tag structure
	 */
	validate() {
		// Author tag should have some content
		this.isValidated = Boolean(this.authorInfo?.trim());
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		return html`<div class="author-info"><strong class="author-label">Author:</strong> ${this.authorInfo}</div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		return `**Author:** ${this.authorInfo}`;
	}
}
