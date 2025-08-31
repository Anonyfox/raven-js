/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc typedef tag model - type definition documentation.
 *
 * Ravens define custom types with structural precision.
 * Essential for complex object types and API contracts.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc typedef tag implementation for custom type definition documentation.
 *
 * Parses typedef tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocTypedefTag('{Object} MyType');
 * // Access parsed properties
 */
export class JSDocTypedefTag extends JSDocTagBase {
	/**
	 * @type {string} Parsed tag content
	 */
	content = "";

	/**
	 * Create typedef tag instance
	 * @param {string} rawContent - Raw typedef tag content
	 */
	constructor(rawContent) {
		super("typedef", rawContent);
	}

	/**
	 * Parse typedef tag content with complex type handling
	 */
	parseContent() {
		const content = this.rawContent?.trim() || "";

		if (!content) {
			this.type = "";
			this.name = "";
			this.description = "";
			return;
		}

		// Extract type if present (handle nested braces)
		let type = "";
		let nameAndDesc = content;

		if (content.startsWith("{")) {
			let braceCount = 0;
			let typeEnd = -1;

			for (let i = 0; i < content.length; i++) {
				if (content[i] === "{") {
					braceCount++;
				} else if (content[i] === "}") {
					braceCount--;
					if (braceCount === 0) {
						typeEnd = i;
						break;
					}
				}
			}

			if (typeEnd !== -1) {
				type = content.slice(1, typeEnd).trim();
				nameAndDesc = content.slice(typeEnd + 1).trim();
			}
		}

		// Parse name and description
		const spaceIndex = nameAndDesc.indexOf(" ");
		if (spaceIndex !== -1) {
			const name = nameAndDesc.slice(0, spaceIndex).trim();
			const description = nameAndDesc.slice(spaceIndex + 1).trim();
			this.type = type;
			this.name = name;
			this.description = description;
		} else {
			this.type = type;
			this.name = nameAndDesc;
			this.description = "";
		}
	}

	/**
	 * Validate typedef tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
