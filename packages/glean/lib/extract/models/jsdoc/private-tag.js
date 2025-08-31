/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc private tag model - internal API documentation.
 *
 * Ravens mark internal territories with precision.
 * Critical for API surface management and encapsulation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc private tag implementation for private member access documentation.
 *
 * Parses private tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocPrivateTag('tag content');
 * // Access parsed properties
 */
export class JSDocPrivateTag extends JSDocTagBase {
	/**
	 * Create private tag instance
	 * @param {string} rawContent - Raw private tag content
	 */
	constructor(rawContent) {
		super("private", rawContent);
	}

	/**
	 * Parse private tag content
	 */
	parseContent() {
		/**
		 * @type {string} Optional description of privacy reason
		 */
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate private tag structure
	 */
	validate() {
		// Private tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
