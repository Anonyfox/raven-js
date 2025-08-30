/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc property tag model - object property documentation.
 *
 * Ravens catalog object territories with surgical precision.
 * Essential for typedef and object structure documentation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc property tag implementation
 *
 * **Official JSDoc Tag:** Documents properties of objects.
 * **Alias:** prop tag (both `property` and `prop` are valid)
 *
 * **Syntax:**
 * - Full: `{Type} propertyName Description of property`
 * - No type: `propertyName Description`
 * - Minimal: `propertyName`
 *
 * **Raven Design:**
 * - Complex nested type handling
 * - Clean name/description separation
 * - Essential for object documentation
 */
export class JSDocPropertyTag extends JSDocTagBase {
	/**
	 * Create property tag instance
	 * @param {string} rawContent - Raw property tag content
	 */
	constructor(rawContent) {
		super("property", rawContent);
	}

	/**
	 * Parse property tag content with nested brace handling
	 */
	parseContent() {
		const content = this.rawContent.trim();
		let type = "";
		let nameAndDesc = content;

		// Extract type if present (handle nested braces)
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

		// Parse name and description, handling optional syntax [propertyName]
		let isOptional = false;
		let propertyName = "";
		let description = "";

		// Check for optional property syntax [propertyName]
		const optionalMatch = nameAndDesc.match(/^\[(\w+)\]\s*(.*)$/);
		if (optionalMatch) {
			isOptional = true;
			propertyName = optionalMatch[1].trim();
			description = optionalMatch[2].trim();
		} else {
			// Check for regular property syntax propertyName
			const regularMatch = nameAndDesc.match(/^(\w+)\s*(.*)$/);
			if (regularMatch) {
				propertyName = regularMatch[1].trim();
				description = regularMatch[2].trim();
			} else {
				// Fallback: treat entire nameAndDesc as description
				description = nameAndDesc.trim();
			}
		}

		// Clean up description by removing leading dash
		if (description.startsWith("- ")) {
			description = description.slice(2).trim();
		} else if (description.startsWith("-")) {
			description = description.slice(1).trim();
		}

		/**
		 * @type {string} Property type annotation
		 */
		this.type = type;
		/**
		 * @type {string} Property name
		 */
		this.name = propertyName;
		/**
		 * @type {string} Property description
		 */
		this.description = description;
		/**
		 * @type {boolean} Whether property is optional
		 */
		this.optional = isOptional;
	}

	/**
	 * Validate property tag content
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
