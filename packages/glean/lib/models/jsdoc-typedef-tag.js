/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc typedef tag model - surgical type definition documentation.
 *
 * Ravens architect custom type territories with predatory precision.
 * Parses type definitions with base types, names, and descriptions
 * for clean custom type documentation and validation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc typedef tag implementation
 *
 * **Official JSDoc Tag:** Defines custom type names for reusable type definitions.
 * **Purpose:** Creates type aliases for complex objects or function signatures.
 *
 * **Syntax:**
 * - Full: `{BaseType} TypeName Description of custom type`
 * - Basic: `{BaseType} TypeName`
 * - Name only: `TypeName Description`
 * - Minimal: `TypeName`
 *
 * **Common Base Types:**
 * - Object: Generic object structure
 * - Array.<Type>: Typed array collections
 * - function(params): returnType: Function signatures
 * - Object.<KeyType, ValueType>: Map-like objects
 * - Union types: (TypeA|TypeB|TypeC)
 * - Generic types: Promise<ResultType>, Map<K, V>
 *
 * **Usage Status:** Common in JSDoc-heavy codebases for describing object literals,
 * configuration objects, and reusable type definitions in detail.
 *
 * **Primary Use Cases:**
 * - Configuration object type definitions
 * - API request/response object shapes
 * - Callback function type definitions
 * - Complex data structure documentation
 * - Module interface type specifications
 * - Reusable type aliases for consistency
 *
 * **Best Practices:**
 * - Combine with property tags for detailed object structure
 * - Use descriptive type names that convey purpose
 * - Group related typedefs logically in documentation
 * - Reference typedef names in param and returns tags
 * - Document complex nested structures with multiple typedefs
 * - Include usage examples when type structure is complex
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
	 * Parse typedef tag content into structured data
	 *
	 * Extracts base type, type name, and description.
	 * Handles complex type expressions with surgical precision.
	 */
	parseContent() {
		// Handle nested braces in types like {Object.<string, number>}
		const content = this.rawContent.trim();
		let baseType = "";
		let nameAndDesc = content;

		// Extract base type if present
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
				baseType = content.slice(1, typeEnd).trim();
				nameAndDesc = content.slice(typeEnd + 1).trim();
			}
		}

		// Parse type name and description
		const nameDescMatch = nameAndDesc.match(/^(\w+)?\s*(.*)?$/);
		if (nameDescMatch) {
			const [, name, description] = nameDescMatch;
			this.baseType = baseType;
			this.name = name ? name.trim() : "";
			this.description = description ? description.trim() : "";
		} else {
			// Fallback for malformed content
			this.baseType = baseType;
			this.name = "";
			this.description = nameAndDesc;
		}
	}

	/**
	 * Validate typedef tag content
	 *
	 * Ravens demand precision: valid typedef tags must have
	 * a type name to create the alias.
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Typedef-specific serializable data
	 */
	getSerializableData() {
		return {
			tagType: this.tagType,
			rawContent: this.rawContent,
			baseType: this.baseType,
			name: this.name,
			description: this.description,
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for typedef documentation
	 */
	toHTML() {
		return html`
			<div class="typedef-info">
				${this.baseType ? html`<span class="typedef-base">{${this.baseType}}</span> ` : ""}
				<strong class="typedef-name">${this.name}</strong>
				${this.description ? html` - ${this.description}` : ""}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for typedef documentation
	 */
	toMarkdown() {
		const baseType = this.baseType ? `{${this.baseType}} ` : "";
		const name = `**${this.name}**`;
		const desc = this.description ? ` - ${this.description}` : "";

		return `${baseType}${name}${desc}`;
	}
}
