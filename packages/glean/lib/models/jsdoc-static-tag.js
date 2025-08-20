/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc static tag model - static member documentation.
 *
 * Ravens mark class territories with territorial precision.
 * Parses static member declarations that specify class-level
 * rather than instance-level property and method accessibility.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc static tag implementation
 *
 * **Official JSDoc Tag:** Marks a member as static (belongs to class, not instance).
 * **Purpose:** Explicitly indicates that a property or method is static rather than instance-based.
 *
 * **Syntax:**
 * - Standalone: Used without additional content (just the tag itself)
 * - With description: `Optional description of static nature or purpose`
 * - Self-documenting: JSDoc can often infer static status, but tag ensures clarity
 *
 * **Static Member Types:**
 * - Static methods: Class utility functions not requiring instance state
 * - Static properties: Class-level constants, configuration, or shared data
 * - Static factories: Constructor alternatives or object creation helpers
 * - Static validators: Class-level validation or utility functions
 * - Static constants: Immutable class-level values and enumerations
 *
 * **Usage Status:** Commonly used in class documentation to ensure clarity about
 * static nature, especially when automatic inference might be ambiguous.
 *
 * **Primary Use Cases:**
 * - Class utility method documentation
 * - Static property and constant declaration
 * - Factory method and constructor alternative documentation
 * - Class-level configuration and metadata documentation
 * - Static validation and helper function documentation
 * - Library and framework static API documentation
 *
 * **Best Practices:**
 * - Use when static nature isn't immediately obvious from code structure
 * - Combine with other tags like memberof to establish clear ownership
 * - Document purpose and usage context of static members
 * - Group related static members logically in documentation
 * - Include examples showing static member usage patterns
 * - Distinguish between static and instance members clearly
 * - Use consistent naming conventions for static members
 */
export class JSDocStaticTag extends JSDocTagBase {
	/**
	 * Create static tag instance
	 * @param {string} rawContent - Raw static tag content
	 */
	constructor(rawContent) {
		super("static", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "static";
	}

	/**
	 * Parse static tag content
	 */
	parseContent() {
		// Static tag is typically standalone, but may have optional description
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate static tag structure
	 */
	validate() {
		// Static tag is always valid - it's a marker tag
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
			return html`<div class="static-info"><strong class="static-label">Static:</strong> ${this.description}</div>`;
		}
		return html`<div class="static-info"><strong class="static-label">Static member</strong></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.description) {
			return `**Static:** ${this.description}`;
		}
		return `**Static member**`;
	}
}
