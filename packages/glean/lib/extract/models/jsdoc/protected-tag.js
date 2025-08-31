/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc protected tag model - inheritance access documentation.
 *
 * Ravens mark protected territories for inheritance intelligence.
 * Essential for object-oriented API design and encapsulation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc protected tag implementation for protected member access documentation.
 *
 * Parses protected tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocProtectedTag('tag content');
 * // Access parsed properties
 */
export class JSDocProtectedTag extends JSDocTagBase {
	/**
	 * Create protected tag instance
	 * @param {string} rawContent - Raw protected tag content
	 */
	constructor(rawContent) {
		super("protected", rawContent);
	}

	/**
	 * Parse protected tag content
	 */
	parseContent() {
		/**
		 * @type {string} Optional description of protection reason
		 */
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate protected tag structure
	 */
	validate() {
		// Protected tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
