/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc callback tag model - callback function documentation.
 *
 * Ravens define callback territories with functional precision.
 * Essential for async patterns and event-driven architecture.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc callback tag implementation for callback function parameter documentation.
 *
 * Parses callback tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocCallbackTag('{function} onComplete Completion callback');
 * // Access parsed properties
 */
export class JSDocCallbackTag extends JSDocTagBase {
	/**
	 * @type {string} Parsed tag content
	 */
	content = "";

	/**
	 * Create callback tag instance
	 * @param {string} rawContent - Raw callback tag content
	 */
	constructor(rawContent) {
		super("callback", rawContent);
	}

	/**
	 * Parse callback tag content
	 */
	parseContent() {
		const content = this.rawContent?.trim() || "";

		if (!content) {
			this.name = "";
			this.description = "";
			return;
		}

		// Split on first whitespace to separate name from description
		const spaceIndex = content.indexOf(" ");
		if (spaceIndex !== -1) {
			this.name = content.slice(0, spaceIndex).trim();
			this.description = content.slice(spaceIndex + 1).trim();
		} else {
			this.name = content;
			this.description = "";
		}
	}

	/**
	 * Validate callback tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
