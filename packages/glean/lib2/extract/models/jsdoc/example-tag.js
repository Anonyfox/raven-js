/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc example tag model - code example documentation.
 *
 * Ravens demonstrate usage with precision code examples.
 * Critical for developer understanding and API adoption.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc example tag implementation
 *
 * **Official JSDoc Tag:** Documents code examples showing usage patterns.
 *
 * **Syntax:**
 * - Simple: `functionCall(param1, param2)`
 * - With caption: `<caption>Example description</caption> code here`
 * - Multi-line: Code examples can span multiple lines
 *
 * **Raven Design:**
 * - Clean caption/code separation
 * - Preserves code formatting exactly
 * - Zero code execution or validation
 */
export class JSDocExampleTag extends JSDocTagBase {
	/**
	 * @type {string} Optional caption/description for the example
	 */
	caption = "";

	/**
	 * @type {string} The actual code example
	 */
	code = "";

	/**
	 * Create example tag instance
	 * @param {string} rawContent - Raw example tag content
	 */
	constructor(rawContent) {
		super("example", rawContent);
	}

	/**
	 * Parse example content with caption detection
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			this.caption = "";
			this.code = "";
			return;
		}

		// Check for caption syntax: <caption>Description</caption>
		const captionMatch = this.rawContent.match(
			/^\s*<caption>(.*?)<\/caption>\s*([\s\S]*)$/,
		);
		if (captionMatch) {
			this.caption = captionMatch[1].trim();
			this.code = captionMatch[2].trim();
		} else {
			this.caption = "";
			this.code = this.rawContent.trim();
		}
	}

	/**
	 * Validate example content
	 */
	validate() {
		// Example should have some code content
		this.isValidated = Boolean(this.code && this.code.length > 0);
	}
}
