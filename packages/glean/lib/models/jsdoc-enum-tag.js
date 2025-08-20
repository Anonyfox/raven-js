/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc enum tag model - enumeration type documentation.
 *
 * Ravens categorize enumeration types with systematic precision.
 * Parses enum declarations that define collections of named constants
 * with specified types and optional descriptions.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc enum tag implementation
 *
 * **Official JSDoc Tag:** Documents an enumeration of related constants with a specified type.
 * **Purpose:** Defines a collection of named constants that share a common type and semantic grouping.
 *
 * **Syntax:**
 * - Type only: `{Type}` - Specifies the type of all enumeration values
 * - With description: `{Type} Optional description of enumeration purpose`
 * - Common types: {string}, {number}, {Object}, {*} for mixed types
 *
 * **Enumeration Patterns:**
 * - String enumerations: Named string constants for configuration, states, or categories
 * - Numeric enumerations: Integer or float constants for measurements, codes, or indices
 * - Object enumerations: Complex constant objects with multiple properties
 * - Mixed enumerations: Collections of different types grouped by semantic meaning
 * - Status enumerations: Application state constants and workflow status values
 * - Configuration enumerations: Settings, options, and parameter constant collections
 *
 * **Usage Status:** Occasionally used in JavaScript codebases to document constant collections
 * and provide type information for enumeration-like patterns.
 *
 * **Primary Use Cases:**
 * - Status and state constant documentation
 * - Configuration option enumeration
 * - Error code and message constant groups
 * - API response type collections
 * - Mathematical constant sets
 * - File format and MIME type enumerations
 *
 * **Best Practices:**
 * - Always specify the enumeration value type for consistency
 * - Document the purpose and usage context of the enumeration
 * - Use descriptive names that clearly indicate the enumeration's domain
 * - Group related constants logically within enumeration objects
 * - Consider using TypeScript-style const assertions for better type safety
 * - Document any special values or reserved enumeration entries
 * - Maintain consistent naming patterns across related enumerations
 */
export class JSDocEnumTag extends JSDocTagBase {
	/**
	 * Create enum tag instance
	 * @param {string} rawContent - Raw enum tag content
	 */
	constructor(rawContent) {
		super("enum", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "enum";
	}

	/**
	 * Parse enum tag content
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			this.type = "";
			this.description = "";
			return;
		}

		const content = this.rawContent.trim();

		// Check if content starts with type braces
		if (content.startsWith("{")) {
			// Find the matching closing brace using manual counting
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
				// Extract type (including braces) and description
				const typeString = content.substring(0, typeEnd + 1);
				this.type = typeString.slice(1, -1).trim(); // Remove braces and trim
				this.description = content.substring(typeEnd + 1).trim();
			} else {
				// Malformed - no closing brace found
				this.type = "";
				this.description = content;
			}
		} else {
			// No type specified, treat entire content as description
			this.type = "";
			this.description = content;
		}
	}

	/**
	 * Validate enum tag structure
	 */
	validate() {
		// Enum tag should have a type specified
		this.isValidated = Boolean(this.type?.trim());
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			type: this.type || "",
			description: this.description || "",
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="enum-info"><strong class="enum-label">Enum:</strong> <code class="enum-type">{${this.type}}</code> - ${this.description}</div>`;
		}
		return html`<div class="enum-info"><strong class="enum-label">Enum:</strong> <code class="enum-type">{${this.type}}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.description) {
			return `**Enum:** \`{${this.type}}\` - ${this.description}`;
		}
		return `**Enum:** \`{${this.type}}\``;
	}
}
