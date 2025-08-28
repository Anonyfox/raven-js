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
 * JSDoc file tag implementation
 *
 * **Official JSDoc Tag:** Documents the purpose/overview of an entire file.
 * **Alias:** fileoverview, overview
 *
 * **Syntax:**
 * - Description: `Brief description of file purpose and contents`
 * - Multi-line: Can span multiple lines for comprehensive overview
 *
 * **Raven Design:**
 * - Simple file description capture
 * - Multi-line content support
 * - Essential for module intelligence
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
