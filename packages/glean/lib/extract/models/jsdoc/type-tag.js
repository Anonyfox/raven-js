/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc type tag model - type annotation documentation.
 *
 * Ravens define type territories with surgical precision.
 * Essential for TypeScript-like type checking in pure JavaScript.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc type tag implementation for type annotation documentation.
 *
 * Parses type tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocTypeTag('{string}');
 * // Access parsed properties
 */
export class JSDocTypeTag extends JSDocTagBase {
	/**
	 * @type {string} Parsed tag content
	 */
	content = "";

	/**
	 * Create type tag instance
	 * @param {string} rawContent - Raw type tag content
	 */
	constructor(rawContent) {
		super("type", rawContent);
	}

	/**
	 * Parse type content
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			this.type = "";
			return;
		}

		const content = this.rawContent.trim();

		// Extract type from braces or use raw content
		const braceMatch = content.match(/^\{([^}]+)\}$/);
		if (braceMatch) {
			this.type = braceMatch[1].trim();
		} else {
			this.type = content;
		}
	}

	/**
	 * Validate type tag
	 */
	validate() {
		// Type tag requires a type annotation
		this.isValidated = Boolean(this.type && this.type.length > 0);
	}
}
