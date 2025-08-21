/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc private tag model - internal API documentation.
 *
 * Ravens mark internal territories with territorial precision.
 * Parses private declarations that specify symbols are intended
 * for internal use only and not part of public API surface.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc private tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as private (internal use only, not public API).
 * **Purpose:** Indicates that a symbol is intended for internal implementation and should not be used externally.
 *
 * **Syntax:**
 * - Standalone: Used without additional content (just the tag itself)
 * - With description: `Optional description of privacy reason or internal usage context`
 * - Documentation control: JSDoc generators typically omit private items from public documentation
 *
 * **Private Symbol Types:**
 * - Helper functions: Internal utility functions not meant for external consumption
 * - Implementation details: Methods and properties that support public API but shouldn't be accessed directly
 * - Internal state: Properties that manage object state but aren't part of the interface
 * - Legacy code: Deprecated internal functions maintained for backward compatibility
 * - Debug utilities: Development and debugging functions not for production use
 * - Framework internals: Library implementation details that users shouldn't interact with
 *
 * **Usage Status:** Very common in large codebases and libraries to clearly distinguish
 * between public API surface and internal implementation details.
 *
 * **Primary Use Cases:**
 * - Internal helper function documentation
 * - Implementation detail method marking
 * - Private class property and method documentation
 * - Library internal API distinction
 * - Legacy code maintenance and migration
 * - Development and debugging utility marking
 *
 * **Best Practices:**
 * - Mark all internal functions and methods that shouldn't be used externally
 * - Use consistent privacy patterns across codebase architecture
 * - Document the reason for privacy when it's not immediately obvious
 * - Distinguish between private, protected, and public access levels clearly
 * - Consider refactoring if too many public methods need private helpers
 * - Group private members logically to improve code organization
 * - Review private API usage during code reviews to prevent external dependencies
 */
export class JSDocPrivateTag extends JSDocTagBase {
	/**
	 * Create private tag instance
	 * @param {string} rawContent - Raw private tag content
	 */
	constructor(rawContent) {
		super("private", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "private";
	}

	/**
	 * Parse private tag content
	 */
	parseContent() {
		// Private tag is typically standalone, but may have optional description
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate private tag structure
	 */
	validate() {
		// Private tag is always valid - it's a marker tag
		this.isValidated = true;
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="private-info"><strong class="private-label">Private:</strong> ${this.description}</div>`;
		}
		return html`<div class="private-info"><strong class="private-label">Private member</strong></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.description) {
			return `**Private:** ${this.description}`;
		}
		return `**Private member**`;
	}
}
