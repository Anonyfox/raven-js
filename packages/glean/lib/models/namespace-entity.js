/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Namespace entity model - surgical JSDoc namespace documentation.
 *
 * Ravens extract JSDoc @namespace constructs with territorial precision.
 * Handles namespace definitions defined purely in documentation comments
 * with comprehensive metadata and organizational structure validation.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * JSDoc @namespace entity implementation
 *
 * **Supported Namespace Forms:**
 * - Simple namespaces: `@namespace MyNamespace`
 * - With descriptions: `@namespace Utils` + description
 * - Nested namespaces: `@namespace App.Utils.Data`
 * - Module namespaces: `@namespace module:myModule`
 *
 * **Valid JSDoc Tags:**
 * - `@namespace` - Namespace declaration
 * - `@memberof` - Parent namespace reference
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class NamespaceEntity extends EntityBase {
	/**
	 * Create namespace entity instance
	 * @param {string} name - Namespace name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("namespace", name, location);

		// Namespace-specific properties
		this.description = ""; // Main namespace description
		this.fullName = name; // Full qualified name (e.g., App.Utils.Data)
		this.parentNamespace = null; // Parent namespace reference
		this.nestedLevel = 0; // How deeply nested this namespace is
		this.isModuleNamespace = false; // Whether this is a module namespace
		this.moduleName = null; // Module name if this is a module namespace
		/** @type {Array<{name: string, type: string, id: string}>} */
		this.members = []; // Members that belong to this namespace
	}

	/**
	 * Valid JSDoc tags for namespace entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for namespaces
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"namespace",
			"memberof",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse namespace from JSDoc tag data
	 * @param {Object} namespaceTag - The namespace JSDoc tag object
	 * @param {Object[]} relatedTags - Related JSDoc tags (memberof, etc.)
	 */
	parseFromJSDoc(namespaceTag, relatedTags = []) {
		// Extract namespace name and description
		this.fullName = /** @type {any} */ (namespaceTag).name || this.name;
		this.description = /** @type {any} */ (namespaceTag).description || "";

		// Analyze the namespace name structure
		this.analyzeNamespaceStructure();

		// Process related tags
		this.processRelatedTags(relatedTags);

		// Attach all tags to this entity
		this.addJSDocTag(/** @type {any} */ (namespaceTag));
		for (const tag of relatedTags) {
			if (this.isValidJSDocTag(/** @type {any} */ (tag).tagType)) {
				this.addJSDocTag(/** @type {any} */ (tag));
			}
		}
	}

	/**
	 * Analyze the namespace name structure to extract hierarchy information
	 */
	analyzeNamespaceStructure() {
		// Check if this is a module namespace
		if (this.fullName.startsWith("module:")) {
			this.isModuleNamespace = true;
			this.moduleName = this.fullName.substring(7); // Remove "module:" prefix
			this.name = this.moduleName;
			return;
		}

		// Count nesting level based on dot notation
		const parts = this.fullName.split(".");
		this.nestedLevel = parts.length - 1;

		// Extract parent namespace if nested
		if (this.nestedLevel > 0) {
			this.parentNamespace = parts.slice(0, -1).join(".");
			this.name = parts[parts.length - 1];
		}
	}

	/**
	 * Process related JSDoc tags
	 * @param {Object[]} relatedTags - Array of related JSDoc tag objects
	 */
	processRelatedTags(relatedTags) {
		for (const tag of relatedTags) {
			switch (/** @type {any} */ (tag).tagType) {
				case "memberof":
					// Override parent namespace from @memberof tag
					this.parentNamespace =
						/** @type {any} */ (tag).name || /** @type {any} */ (tag).namespace;
					break;

				default:
					// Other tags are handled by the base class
					break;
			}
		}
	}

	/**
	 * Add a member to this namespace
	 * @param {Object} member - Member entity reference
	 */
	addMember(member) {
		this.members.push({
			name: /** @type {any} */ (member).name,
			type: /** @type {any} */ (member).entityType,
			id:
				/** @type {any} */ (member).id ||
				`${this.fullName}.${/** @type {any} */ (member).name}`,
		});
	}

	/**
	 * Parse namespace-specific content (not used for pure JSDoc constructs)
	 * @param {any} _rawEntity - Raw code entity (unused)
	 * @param {string} _content - Full file content (unused)
	 */
	parseEntity(_rawEntity, _content) {
		// NamespaceEntity is parsed from JSDoc, not code
		// This method exists to satisfy the abstract contract
	}

	/**
	 * Validate namespace entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate namespace consistency
		this.validateNamespaceConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate namespace structure and documentation
	 */
	validateNamespaceConsistency() {
		/** @type {Array<{type: string, message: string, suggestion?: string}>} */
		this.validationIssues = [];

		// Check for meaningful description
		if (!this.description?.trim() || this.description.trim().length < 3) {
			this.validationIssues.push({
				type: "missing_description",
				message: "Namespace should have a meaningful description",
				/** @type {any} */ suggestion:
					"Add a description explaining the namespace's purpose",
			});
		}

		// Validate namespace naming conventions
		if (
			!/^[A-Z][a-zA-Z0-9_.]*$/.test(this.fullName) &&
			!this.isModuleNamespace
		) {
			this.validationIssues.push({
				type: "invalid_namespace_name",
				message: "Namespace name should follow PascalCase convention",
				/** @type {any} */ suggestion:
					"Use PascalCase for namespace names (e.g., MyNamespace, App.Utils)",
			});
		}

		// Validate module namespace naming
		if (
			this.isModuleNamespace &&
			!/^[a-z][a-zA-Z0-9_/-]*$/.test(this.moduleName)
		) {
			this.validationIssues.push({
				type: "invalid_module_name",
				message: "Module namespace should follow valid module naming",
				/** @type {any} */ suggestion:
					"Use lowercase with hyphens or underscores for module names",
			});
		}

		// Check for circular namespace references
		if (this.parentNamespace === this.fullName) {
			this.validationIssues.push({
				type: "circular_namespace_reference",
				message: "Namespace cannot be its own parent",
			});
		}

		// Validate nesting depth (warn about overly deep nesting)
		if (this.nestedLevel > 4) {
			this.validationIssues.push({
				type: "deep_nesting_warning",
				message: `Namespace is deeply nested (${this.nestedLevel} levels)`,
				/** @type {any} */ suggestion:
					"Consider flattening the namespace hierarchy for better maintainability",
			});
		}
	}

	/**
	 * Get namespace signature for display
	 * @returns {string} Human-readable namespace signature
	 */
	getSignature() {
		if (this.isModuleNamespace) {
			return `@namespace module:${this.moduleName}`;
		}
		return `@namespace ${this.fullName}`;
	}

	/**
	 * Get namespace summary information
	 * @returns {Object} Namespace summary
	 */
	getSummary() {
		return {
			isModuleNamespace: this.isModuleNamespace,
			nestedLevel: this.nestedLevel,
			hasParent: Boolean(this.parentNamespace),
			memberCount: this.members.length,
			hasMembers: this.members.length > 0,
			hasDescription: Boolean(this.description?.trim()),
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for namespace documentation
	 */
	toHTML() {
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);
		const memberofTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "memberof",
		);

		return html`
			<div class="namespace-entity" data-nested="${this.nestedLevel}">
				<h3>${this.fullName}</h3>
				<div class="namespace-meta">
					<span class="namespace-type">@namespace</span>
					${this.isModuleNamespace ? html`<span class="module-indicator">module</span>` : ""}
					${this.nestedLevel > 0 ? html`<span class="nested-indicator">nested (${this.nestedLevel})</span>` : ""}
					<span class="namespace-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="namespace-signature">
					<code>${this.getSignature()}</code>
				</div>
				${
					this.description
						? html`
					<div class="namespace-description">
						<p>${this.description}</p>
					</div>
				`
						: ""
				}
				${
					this.parentNamespace
						? html`
					<div class="parent-namespace">
						<strong>Parent:</strong> <code>${this.parentNamespace}</code>
					</div>
				`
						: ""
				}
				${
					memberofTags.length > 0
						? html`
					<div class="memberof-info">
						<strong>Member of:</strong> ${memberofTags.map((tag) => html`<code>${/** @type {any} */ (tag).name || /** @type {any} */ (tag).namespace}</code>`).join(", ")}
					</div>
				`
						: ""
				}
				${
					this.members.length > 0
						? html`
					<div class="namespace-members">
						<h4>Members (${this.members.length})</h4>
						<ul class="member-list">
							${this.members
								.map(
									(member) => html`
								<li class="member-item">
									<span class="member-type">${member.type}</span>
									<code class="member-name">${member.name}</code>
								</li>
							`,
								)
								.join("\n")}
						</ul>
					</div>
				`
						: ""
				}
				${
					exampleTags.length > 0
						? html`
					<div class="examples">
						<h4>Examples</h4>
						${exampleTags.map((tag) => tag.toHTML()).join("\n")}
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for namespace documentation
	 */
	toMarkdown() {
		let output = `### ${this.fullName}\n\n`;
		output += `**Type:** @namespace`;
		if (this.isModuleNamespace) output += " (module)";
		if (this.nestedLevel > 0) output += ` (nested: ${this.nestedLevel})`;
		output += `\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;
		output += `**Declaration:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		if (this.description) {
			output += `${this.description}\n\n`;
		}

		if (this.parentNamespace) {
			output += `**Parent Namespace:** \`${this.parentNamespace}\`\n\n`;
		}

		if (this.members.length > 0) {
			output += `**Members (${this.members.length}):**\n\n`;
			for (const member of this.members) {
				output += `- \`${member.name}\` *(${member.type})*\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
