/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Property entity model - surgical class property documentation.
 *
 * Ravens extract class properties with territorial precision.
 * Handles class fields, static properties, private properties, and initializers.
 * Combines variable-like parsing with class-specific context awareness.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * Class property entity implementation
 *
 * **Supported Property Types:**
 * - Instance fields: `propertyName = value;`
 * - Static fields: `static propertyName = value;`
 * - Private fields: `#propertyName = value;`
 * - Static private: `static #propertyName = value;`
 * - Declared fields: `propertyName;` (no initializer)
 * - Computed properties: `[computed] = value;`
 *
 * **Valid JSDoc Tags:**
 * - `@type` - Property type annotation
 * - `@readonly` - Read-only property marker
 * - `@static` - Static property marker
 * - `@private` - Private property marker
 * - `@abstract` - Abstract property declaration
 * - `@override` - Property overrides parent
 * - `@default` - Default value documentation
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class PropertyEntity extends EntityBase {
	/**
	 * Create property entity instance
	 * @param {string} name - Property name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("property", name, location);

		// Property-specific properties
		this.isStatic = false;
		this.isPrivate = false;
		this.isReadonly = false;
		this.hasInitializer = false;
		this.initializer = null;
		this.inferredType = "unknown";
		this.parentClass = null; // Reference to parent class entity
		this.signature = "";
		this.accessModifier = "public"; // public|private|protected
	}

	/**
	 * Valid JSDoc tags for property entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for properties
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"description",
			"type",
			"readonly",
			"static",
			"private",
			"abstract",
			"override",
			"default",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse property entity from raw property data and source content
	 * @param {Object} rawProperty - Raw property object from ClassEntity
	 * @param {string} content - Full source content
	 */
	parseEntity(rawProperty, content) {
		// Extract property metadata from ClassEntity data
		this.isStatic = /** @type {any} */ (rawProperty).isStatic || false;
		this.isPrivate = /** @type {any} */ (rawProperty).isPrivate || false;
		this.signature = /** @type {any} */ (rawProperty).signature || "";

		// Parse the property declaration
		this.parsePropertyDeclaration(this.signature);

		// Set access modifier based on privacy
		this.accessModifier = this.isPrivate ? "private" : "public";

		// Set source snippet
		const lines = content.split("\n");
		const startLine = Math.max(0, this.location.line - 1);
		const endLine = Math.min(lines.length, startLine + 5);
		this.source = lines.slice(startLine, endLine).join("\n");
	}

	/**
	 * Parse property declaration to extract details
	 * @param {string} signature - Property signature string
	 */
	parsePropertyDeclaration(signature) {
		if (!signature) return;

		// Clean up signature - remove static/private prefixes for parsing
		const cleanSignature = signature
			.replace(/^\s*static\s+/, "")
			.replace(/^\s*#/, "")
			.trim();

		// Check for initializer (=)
		const equalIndex = cleanSignature.indexOf("=");
		if (equalIndex > -1) {
			this.hasInitializer = true;
			this.initializer = cleanSignature.substring(equalIndex + 1).trim();

			// Remove semicolon if present
			if (this.initializer.endsWith(";")) {
				this.initializer = this.initializer.slice(0, -1).trim();
			}

			// Infer type from initializer
			this.inferredType = this.inferTypeFromInitializer(this.initializer);
		}

		// Store cleaned signature
		this.signature = signature;
	}

	/**
	 * Infer property type from its initializer
	 * @param {string} initializer - Property initializer expression
	 * @returns {string} Inferred type name
	 */
	inferTypeFromInitializer(initializer) {
		if (!initializer) return "unknown";

		const trimmed = initializer.trim();

		// String literals
		if (
			(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
			(trimmed.startsWith("'") && trimmed.endsWith("'")) ||
			(trimmed.startsWith("`") && trimmed.endsWith("`"))
		) {
			return "string";
		}

		// Number literals
		if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
			return "number";
		}

		// Boolean literals
		if (trimmed === "true" || trimmed === "false") {
			return "boolean";
		}

		// null/undefined
		if (trimmed === "null") return "null";
		if (trimmed === "undefined") return "undefined";

		// Array literals
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			return "Array";
		}

		// Object literals
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			return "Object";
		}

		// Function expressions
		if (
			trimmed.startsWith("function") ||
			trimmed.includes("=>") ||
			trimmed.startsWith("async")
		) {
			return "Function";
		}

		// Constructor calls
		if (/^new\s+\w+\s*\(/.test(trimmed)) {
			const match = trimmed.match(/^new\s+(\w+)/);
			return match ? match[1] : "Object";
		}

		// Common constructors without 'new'
		if (/^(Date|Map|Set|WeakMap|WeakSet|Promise|Error)\s*\(/.test(trimmed)) {
			const match = trimmed.match(/^(\w+)/);
			return match ? match[1] : "Object";
		}

		// Simple constructor-like calls with known patterns
		if (
			/^(Array|Object|String|Number|Boolean|Symbol|BigInt)\s*\(/.test(trimmed)
		) {
			const match = trimmed.match(/^(\w+)/);
			return match ? match[1] : "unknown";
		}

		return "unknown";
	}

	/**
	 * Set parent class context
	 * @param {string} className - Parent class name
	 * @param {any|null} classEntity - Parent class entity reference
	 */
	setParentClass(className, classEntity = null) {
		this.parentClass = className;
		if (classEntity) {
			this.parentClassEntity = classEntity;
		}
	}

	/**
	 * Validate property entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate property-specific consistency
		this.validatePropertyConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate property JSDoc consistency with actual declaration
	 */
	validatePropertyConsistency() {
		/** @type {Array<{type: string, message: string, jsdocType?: string, inferredType?: string, suggestion?: string}>} */
		this.validationIssues = [];

		// Get JSDoc tags for validation
		const typeTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "type",
		);
		const readonlyTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "readonly",
		);
		const staticTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "static",
		);
		const privateTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "private",
		);

		// Validate @static tag consistency
		if (staticTags.length > 0 && !this.isStatic) {
			this.validationIssues.push({
				type: "static_tag_mismatch",
				message: "Property has @static tag but is not declared as static",
			});
		}

		// Validate @private tag consistency
		if (privateTags.length > 0 && !this.isPrivate) {
			this.validationIssues.push({
				type: "private_tag_mismatch",
				message: "Property has @private tag but is not declared as private",
			});
		}

		// Validate @readonly tag consistency
		if (readonlyTags.length > 0) {
			// Check if this looks like a readonly property (no setter, const-like)
			// For now, just warn if @readonly is used with an initializer that could change
			if (this.hasInitializer && this.inferredType === "Object") {
				this.validationIssues.push({
					type: "readonly_mutable_warning",
					message:
						"Property marked @readonly but initialized with mutable Object",
					/** @type {any} */ suggestion:
						"Consider using immutable patterns or documenting mutability",
				});
			}
		}

		// Validate @type tag consistency with inferred type
		if (typeTags.length > 0 && this.hasInitializer) {
			const jsdocType = /** @type {any} */ (typeTags[0]).type.toLowerCase();
			const inferredType = this.inferredType.toLowerCase();

			// Basic type compatibility check
			const isCompatible =
				jsdocType === inferredType ||
				(jsdocType.includes("string") && inferredType === "string") ||
				(jsdocType.includes("number") && inferredType === "number") ||
				(jsdocType.includes("boolean") && inferredType === "boolean") ||
				(jsdocType.includes("array") && inferredType === "array") ||
				(jsdocType.includes("object") && inferredType === "object") ||
				(jsdocType.includes("function") && inferredType === "function") ||
				jsdocType === "any" ||
				jsdocType === "*";

			if (!isCompatible) {
				this.validationIssues.push({
					type: "type_mismatch",
					message: `type declares '${/** @type {any} */ (typeTags[0]).type}' but initializer suggests '${this.inferredType}'`,
					jsdocType: /** @type {any} */ (typeTags[0]).type,
					inferredType: this.inferredType,
				});
			}
		}

		// Check for missing @type when type is ambiguous
		if (
			typeTags.length === 0 &&
			this.inferredType === "unknown" &&
			this.hasInitializer
		) {
			this.validationIssues.push({
				type: "missing_type_annotation",
				message:
					"Property has unclear type from initializer, consider adding @type tag",
				/** @type {any} */ suggestion:
					"Add @type {YourType} to clarify the intended type",
			});
		}
	}

	/**
	 * Get property signature for display
	 * @returns {string} Human-readable property signature
	 */
	getSignature() {
		let signature = "";

		if (this.isStatic) signature += "static ";

		// Only add # prefix if the name doesn't already start with #
		if (this.isPrivate && !this.name.startsWith("#")) {
			signature += "#";
		}

		signature += this.name;

		if (this.hasInitializer) {
			signature += ` = ${this.initializer}`;
		}

		return signature;
	}

	/**
	 * Get property summary information
	 * @returns {Object} Property summary
	 */
	getSummary() {
		return {
			isStatic: this.isStatic,
			isPrivate: this.isPrivate,
			isReadonly: this.isReadonly,
			hasInitializer: this.hasInitializer,
			inferredType: this.inferredType,
			accessModifier: this.accessModifier,
			parentClass: this.parentClass,
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for property documentation
	 */
	toHTML() {
		const typeTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "type",
		);
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);
		const readonlyTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "readonly",
		);
		const defaultTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "default",
		);

		return html`
			<div class="property-entity" data-access="${this.accessModifier}">
				<h3>${this.name}</h3>
				<div class="property-meta">
					<span class="property-type">property</span>
					${this.isStatic ? html`<span class="static-indicator">static</span>` : ""}
					${this.isPrivate ? html`<span class="private-indicator">private</span>` : ""}
					${readonlyTags.length > 0 ? html`<span class="readonly-indicator">readonly</span>` : ""}
					<span class="property-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="property-signature">
					<code>${this.getSignature()}</code>
				</div>
				${
					this.parentClass
						? html`
					<div class="parent-class">
						<strong>Class:</strong> <code>${this.parentClass}</code>
					</div>
				`
						: ""
				}
				${
					typeTags.length > 0
						? html`
					<div class="property-type-info">
						<strong>Type:</strong> ${typeTags.map((tag) => tag.toHTML()).join(", ")}
					</div>
				`
						: this.inferredType !== "unknown"
							? html`
					<div class="inferred-type">
						<strong>Inferred Type:</strong> <code>${this.inferredType}</code>
					</div>
				`
							: ""
				}
				${
					this.hasInitializer
						? html`
					<div class="initializer">
						<strong>Default Value:</strong> <code>${this.initializer}</code>
					</div>
				`
						: ""
				}
				${
					defaultTags.length > 0
						? html`
					<div class="default-docs">
						<h4>Default Value</h4>
						${defaultTags.map((tag) => tag.toHTML()).join("\n")}
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
	 * @returns {string} Markdown string for property documentation
	 */
	toMarkdown() {
		let output = `### ${this.name}\n\n`;
		output += `**Type:** property`;
		if (this.isStatic) output += " (static)";
		if (this.isPrivate) output += " (private)";

		const readonlyTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "readonly",
		);
		if (readonlyTags.length > 0) output += " (readonly)";

		output += `\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;

		if (this.parentClass) {
			output += `**Class:** \`${this.parentClass}\`\n\n`;
		}

		output += `**Declaration:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		const typeTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "type",
		);
		if (typeTags.length > 0) {
			output += `**Type:** ${typeTags.map((tag) => `\`${/** @type {any} */ (tag).type}\``).join(", ")}\n\n`;
		} else if (this.inferredType !== "unknown") {
			output += `**Inferred Type:** \`${this.inferredType}\`\n\n`;
		}

		if (this.hasInitializer) {
			output += `**Default Value:** \`${this.initializer}\`\n\n`;
		}

		return output;
	}
}
