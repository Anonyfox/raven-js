/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc protected tag model - subclass access documentation.
 *
 * Ravens establish inheritance hierarchies with territorial precision.
 * Parses protected declarations that specify symbols are intended
 * for class and subclass use but not public API consumption.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc protected tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as protected (accessible to class and subclasses only).
 * **Purpose:** Indicates that a symbol is intended for inheritance hierarchy use but not public API.
 *
 * **Syntax:**
 * - Standalone: Used without additional content (just the tag itself)
 * - With description: `Optional description of protection reason or inheritance usage context`
 * - Access control: More permissive than private, less than public - subclass accessible
 *
 * **Protected Symbol Types:**
 * - Template methods: Base class methods intended to be overridden by subclasses
 * - Helper methods: Utility functions shared between class and subclasses
 * - Internal state: Properties that subclasses may need to access or modify
 * - Hook methods: Extension points for subclass customization
 * - Framework extension points: Library methods designed for framework extension
 * - Abstract implementations: Partial implementations completed by subclasses
 *
 * **Usage Status:** Occasionally used in object-oriented designs and frameworks
 * where inheritance hierarchies are important and subclass access patterns are defined.
 *
 * **Primary Use Cases:**
 * - Template method pattern implementation
 * - Framework extension point documentation
 * - Inheritance-based API design documentation
 * - Abstract base class method marking
 * - Subclass utility method documentation
 * - Protected property access documentation
 *
 * **Best Practices:**
 * - Use for methods and properties that subclasses need but external users don't
 * - Document inheritance contracts and expected subclass behavior
 * - Distinguish clearly between private, protected, and public access levels
 * - Consider composition over inheritance when too many protected members exist
 * - Review protected API usage during inheritance design reviews
 * - Group protected members logically to improve inheritance understanding
 * - Document the intended subclass usage patterns and restrictions
 */
export class JSDocProtectedTag extends JSDocTagBase {
	/**
	 * Create protected tag instance
	 * @param {string} rawContent - Raw protected tag content
	 */
	constructor(rawContent) {
		super("protected", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "protected";
	}

	/**
	 * Parse protected tag content
	 */
	parseContent() {
		// Protected tag is typically standalone, but may have optional description
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate protected tag structure
	 */
	validate() {
		// Protected tag is always valid - it's a marker tag
		this.isValidated = true;
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			description: this.description || "",
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="protected-info"><strong class="protected-label">Protected:</strong> ${this.description}</div>`;
		}
		return html`<div class="protected-info"><strong class="protected-label">Protected member</strong></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.description) {
			return `**Protected:** ${this.description}`;
		}
		return `**Protected member**`;
	}
}
