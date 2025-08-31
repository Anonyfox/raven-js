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
 * Ravens track territorial evolution with version precision.
 * Essential for API history and compatibility intelligence.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc since tag implementation for version information documentation.
 *
 * Parses since tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocSinceTag('1.2.0');
 * // Access parsed properties
 */
export class JSDocSinceTag extends JSDocTagBase {
	/**
	 * @type {string} Parsed tag content
	 */
	content = "";

	/**
	 * Create since tag instance
	 * @param {string} rawContent - Raw since tag content
	 */
	constructor(rawContent) {
		super("since", rawContent);
	}

	/**
	 * Parse since content with version extraction
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			this.version = "";
			this.description = "";
			return;
		}

		const content = this.rawContent.trim();

		// Match version pattern at start, rest is description
		const versionMatch = content.match(/^([^\s]+)(?:\s+(.*))?$/);
		if (versionMatch) {
			this.version = versionMatch[1];
			this.description = versionMatch[2]?.trim() || "";
		} else {
			this.version = content;
			this.description = "";
		}
	}

	/**
	 * Validate since tag
	 */
	validate() {
		// Since tag requires a version
		this.isValidated = Boolean(this.version && this.version.length > 0);
	}
}
