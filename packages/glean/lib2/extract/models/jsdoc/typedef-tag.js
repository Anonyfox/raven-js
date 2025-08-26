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
 * JSDoc typedef tag implementation
 *
 * **Official JSDoc Tag:** Defines a custom type.
 *
 * **Syntax:**
 * - Object type: `{Object} TypeName`
 * - Function type: `{Function} TypeName`
 * - Complex type: `{Object<string, number>} TypeName`
 * - With description: `{Object} TypeName Description of type`
 *
 * **Raven Design:**
 * - Clean type/name extraction
 * - Complex type support
 * - Essential for type system intelligence
 */
export class JSDocTypedefTag extends JSDocTagBase {
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
			/**
			 * @type {string} Type definition
			 */
			this.type = "";
			/**
			 * @type {string} Type name
			 */
			this.name = "";
			/**
			 * @type {string} Type description
			 */
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
			/**
			 * @type {string} Type definition
			 */
			this.type = type;
			/**
			 * @type {string} Type name
			 */
			this.name = name;
			/**
			 * @type {string} Type description
			 */
			this.description = description;
		} else {
			/**
			 * @type {string} Type definition
			 */
			this.type = type;
			/**
			 * @type {string} Type name
			 */
			this.name = nameAndDesc;
			/**
			 * @type {string} Type description
			 */
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
