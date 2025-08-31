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
 * JSDoc example tag implementation for code usage demonstration.
 *
 * Parses code examples with optional captions, preserving formatting exactly.
 * Supports both simple code and captioned examples with clean separation.
 *
 * @example
 * // Basic code example
 * const tag = new JSDocExampleTag('console.log("Hello World")');
 * console.log(tag.code); // Raw code content
 *
 * @example
 * // Captioned example
 * const tag = new JSDocExampleTag('<caption>Usage</caption> myFunction(42)');
 * console.log(tag.caption, tag.code);
 */
export class JSDocExampleTag extends JSDocTagBase {
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
	 * Validate example content - requires code
	 */
	validate() {
		// Example should have some code content
		this.isValidated = Boolean(this.code && this.code.length > 0);
	}
}
