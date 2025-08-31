/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc deprecated tag model - deprecation documentation.
 *
 * Ravens mark obsolete territories with precision warnings.
 * Critical for API evolution and migration intelligence.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc deprecated tag implementation for deprecation warning documentation.
 *
 * Parses deprecated tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocDeprecatedTag('Use newFunction() instead');
 * // Access parsed properties
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
	 * Parse deprecated content
	 */
	parseContent() {
		/**
		 * @type {string} Deprecation message or reason
		 */
		this.message = this.rawContent ? this.rawContent.trim() : "";
	}

	/**
	 * Validate deprecated tag
	 */
	validate() {
		// Deprecated tag is always valid - message is optional
		this.isValidated = true;
	}
}
