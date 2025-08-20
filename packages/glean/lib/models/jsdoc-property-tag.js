/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc property tag model - surgical object property documentation.
 *
 * Ravens catalog object territories with predatory precision.
 * Parses property definitions with types, names, and descriptions
 * for clean object documentation and validation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc property tag implementation
 *
 * **Official JSDoc Tag:** Documents properties of objects, especially for record types.
 * **Alias:** prop tag (both `property` and `prop` are valid)
 *
 * **Syntax:**
 * - Full: `{Type} propertyName Description of property`
 * - No type: `propertyName Description`
 * - No description: `{Type} propertyName`
 * - Minimal: `propertyName`
 *
 * **Type Support:**
 * - Simple types: string, number, boolean, Date
 * - Complex types: Array.<Item>, Promise<Response>
 * - Union types: (string|number|null)
 * - Function properties: function(args): returnType
 * - Object properties: Object.<string, number>
 * - Nested objects: {nested: {deep: string}}
 * - Optional types: string= (though square brackets preferred)
 *
 * **Usage Status:** Common when documenting object literals, configuration objects,
 * or in combination with typedef to describe object structure in detail.
 *
 * **Primary Use Cases:**
 * - typedef object property documentation
 * - Configuration object structure
 * - API response/request object shapes
 * - Class property documentation
 * - Module options and settings
 *
 * **Best Practices:**
 * - Use with typedef for reusable object type definitions
 * - Group related properties logically in documentation
 * - Specify whether properties are required or optional
 * - Include meaningful descriptions for non-obvious properties
 * - Use consistent naming conventions across related objects
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
	 * Parse property tag content into structured data
	 *
	 * Extracts type, name, and description from property syntax.
	 * Handles complex type expressions with surgical precision.
	 */
	parseContent() {
		// Handle nested braces in types like {{x: number, y: number}}
		const content = this.rawContent.trim();
		let type = "";
		let nameAndDesc = content;

		// Extract type if present
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
		const nameDescMatch = nameAndDesc.match(/^(\w+)?\s*(.*)?$/);
		if (nameDescMatch) {
			const [, name, description] = nameDescMatch;
			this.type = type;
			this.name = name ? name.trim() : "";
			this.description = description ? description.trim() : "";
		} else {
			// Fallback for malformed content
			this.type = type;
			this.name = "";
			this.description = nameAndDesc;
		}
	}

	/**
	 * Validate property tag content
	 *
	 * Ravens demand precision: valid property tags must have
	 * at minimum a property name.
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Property-specific serializable data
	 */
	getSerializableData() {
		return {
			tagType: this.tagType,
			rawContent: this.rawContent,
			type: this.type,
			name: this.name,
			description: this.description,
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for property documentation
	 */
	toHTML() {
		return html`
			<li class="property-item">
				${this.type ? html`<span class="property-type">{${this.type}}</span> ` : ""}
				<code class="property-name">${this.name}</code>
				${this.description ? html` - ${this.description}` : ""}
			</li>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for property documentation
	 */
	toMarkdown() {
		const type = this.type ? `{${this.type}} ` : "";
		const name = `\`${this.name}\``;
		const desc = this.description ? ` - ${this.description}` : "";

		return `- ${type}${name}${desc}`;
	}
}
