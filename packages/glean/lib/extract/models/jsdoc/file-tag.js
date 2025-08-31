/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc file tag model - file-level documentation.
 *
 * Ravens document file territories with overview precision.
 * Essential for module and file-level context.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc file tag implementation for file-level documentation.
 *
 * Parses file tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocFileTag('Module description');
 * // Access parsed properties
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
	 * Parse file tag content
	 */
	parseContent() {
		/**
		 * @type {string} File description or overview
		 */
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate file tag structure
	 */
	validate() {
		// File tags are always valid - they just mark file-level documentation
		this.isValidated = true;
	}
}
