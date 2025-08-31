/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc readonly tag model - immutability documentation.
 *
 * Ravens mark immutable territories with precision.
 * Essential for functional programming and data integrity.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc readonly tag implementation for read-only property documentation.
 *
 * Parses readonly tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocReadonlyTag('tag content');
 * // Access parsed properties
 */
export class JSDocReadonlyTag extends JSDocTagBase {
	/**
	 * Create readonly tag instance
	 * @param {string} rawContent - Raw readonly tag content
	 */
	constructor(rawContent) {
		super("readonly", rawContent);
	}

	/**
	 * Parse readonly tag content
	 */
	parseContent() {
		/**
		 * @type {string} Optional description of readonly nature
		 */
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate readonly tag structure
	 */
	validate() {
		// Readonly tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
