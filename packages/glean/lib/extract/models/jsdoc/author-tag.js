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
 * Essential for legal attribution and maintenance responsibility.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc author tag implementation for code authorship attribution.
 *
 * Parses author tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocAuthorTag('John Doe <john@example.com>');
 * // Access parsed properties
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
	 * Parse author tag content
	 */
	parseContent() {
		/**
		 * @type {string} Full author information
		 */
		this.authorInfo = this.rawContent?.trim() || "";

		if (this.authorInfo) {
			// Extract name and email if in standard format: Name <email>
			const emailMatch = this.authorInfo.match(/^([^<]+?)\s*<([^>]+)>(.*)$/);
			if (emailMatch) {
				this.name = emailMatch[1].trim();
				this.email = emailMatch[2].trim();
				this.additional = emailMatch[3].trim();
			} else {
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
		this.isValidated = Boolean(this.authorInfo?.trim());
	}
}
