/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc memberof tag model - symbol membership documentation.
 *
 * Ravens establish hierarchical relationships with territorial precision.
 * Parses membership declarations that specify parent-child relationships
 * between symbols and their containing classes, namespaces, or modules.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc memberof tag implementation
 *
 * **Official JSDoc Tag:** Specifies that a symbol belongs to a particular parent container.
 * **Purpose:** Manually establishes ownership relationships in documentation hierarchy.
 *
 * **Syntax:**
 * - Simple: `ParentName` (class or namespace name)
 * - Nested: `ParentNamespace.ChildClass` (hierarchical containers)
 * - Instance: `ClassName#` (instance member indicator)
 * - Static: `ClassName.` (static member indicator, though less common)
 *
 * **Parent Types:**
 * - Class names: MyClass, AuthService, DatabaseManager
 * - Namespace paths: MyApp.Utils, Company.Product.Core
 * - Module references: my-module, @company/utils
 * - Object hierarchies: window.MyLibrary, global.Constants
 * - Mixed notation: MyNamespace.ClassName#
 *
 * **Usage Status:** Common in cases where code structure doesn't clearly reveal
 * ownership, especially with dynamically assigned methods or complex inheritance patterns.
 *
 * **Primary Use Cases:**
 * - Dynamic method assignment to class prototypes
 * - Mixin pattern documentation where methods are copied
 * - Factory function results that belong to specific classes
 * - Plugin or extension method registration
 * - Complex inheritance documentation clarity
 * - Legacy code organization and documentation migration
 *
 * **Best Practices:**
 * - Use consistent parent naming throughout documentation
 * - Specify # for instance members, . for static members when relevant
 * - Ensure parent symbols are properly documented with namespace or class tags
 * - Combine with other tags like function, member, or type for clarity
 * - Document the relationship reason when ownership isn't obvious
 * - Group related memberof declarations for better organization
 * - Use hierarchical naming that matches actual code structure
 */
export class JSDocMemberofTag extends JSDocTagBase {
	/**
	 * Create memberof tag instance
	 * @param {string} rawContent - Raw memberof tag content
	 */
	constructor(rawContent) {
		super("memberof", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "memberof";
	}

	/**
	 * Parse memberof tag content
	 */
	parseContent() {
		if (!this.rawContent) {
			this.parent = "";
			this.description = "";
			return;
		}

		// Match pattern: @memberof ParentName optional description
		const memberofRegex = /^\s*([^\s]+)(?:\s+(.*))?$/;
		const match = this.rawContent.trim().match(memberofRegex);

		if (!match) {
			this.parent = "";
			this.description = "";
			return;
		}

		const [, parent, description] = match;
		this.parent = parent || "";
		this.description = description?.trim() || "";
	}

	/**
	 * Validate memberof tag structure
	 */
	validate() {
		// Memberof tag should have a parent name
		this.isValidated = Boolean(this.parent && this.parent.length > 0);
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			parent: this.parent || "",
			description: this.description || "",
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="memberof-info"><strong class="memberof-label">Member of:</strong> <code class="memberof-parent">${this.parent}</code> - ${this.description}</div>`;
		}
		return html`<div class="memberof-info"><strong class="memberof-label">Member of:</strong> <code class="memberof-parent">${this.parent}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		const desc = this.description ? ` - ${this.description}` : "";
		return `**Member of:** \`${this.parent}\`${desc}`;
	}
}
