/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc readonly tag model - immutable property documentation.
 *
 * Ravens mark property immutability with territorial precision.
 * Parses readonly declarations that specify properties should not
 * be reassigned after initialization or instantiation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc readonly tag implementation
 *
 * **Official JSDoc Tag:** Marks a property as read-only (should not be reassigned).
 * **Purpose:** Indicates that a property should not change after initialization.
 *
 * **Syntax:**
 * - Standalone: Used without additional content (just the tag itself)
 * - With description: `Optional description of readonly nature or immutability reason`
 * - Combined: Often used with property, member, or type tags for complete documentation
 *
 * **Readonly Property Types:**
 * - Instance constants: Object properties set during construction and never changed
 * - Static constants: Class-level immutable values and configuration
 * - Configuration properties: Settings that should not be modified after setup
 * - Identifier properties: IDs, keys, or reference values that remain constant
 * - Computed properties: Values derived from other properties that shouldn't be overwritten
 * - API constants: External interface values that maintain consistency
 *
 * **Usage Status:** Moderately used, especially in object-oriented designs and
 * configurations where immutability is important for data integrity.
 *
 * **Primary Use Cases:**
 * - Object identifier and key property documentation
 * - Configuration constant and setting documentation
 * - Instance property immutability indication
 * - Static class constant documentation
 * - API contract enforcement through documentation
 * - Data integrity and consistency assurance
 *
 * **Best Practices:**
 * - Use for properties that should never be reassigned after initialization
 * - Combine with member or property tags for complete documentation
 * - Document the reason for immutability when not obvious
 * - Distinguish between readonly and constant values appropriately
 * - Include initialization context when relevant
 * - Use consistent patterns across related readonly properties
 * - Consider thread-safety implications in documentation
 */
export class JSDocReadonlyTag extends JSDocTagBase {
	/**
	 * Create readonly tag instance
	 * @param {string} rawContent - Raw readonly tag content
	 */
	constructor(rawContent) {
		super("readonly", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "readonly";
	}

	/**
	 * Parse readonly tag content
	 */
	parseContent() {
		// Readonly tag is typically standalone, but may have optional description
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate readonly tag structure
	 */
	validate() {
		// Readonly tag is always valid - it's a marker tag
		this.isValidated = true;
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="readonly-info"><strong class="readonly-label">Read-only:</strong> ${this.description}</div>`;
		}
		return html`<div class="readonly-info"><strong class="readonly-label">Read-only property</strong></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.description) {
			return `**Read-only:** ${this.description}`;
		}
		return `**Read-only property**`;
	}
}
