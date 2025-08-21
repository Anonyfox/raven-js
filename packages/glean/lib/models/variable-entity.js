/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Variable entity model - surgical variable documentation.
 *
 * Ravens hunt variable declarations with lean precision.
 * Handles modern JavaScript variable constructs: const, let
 * with type annotations and initialization analysis.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * JavaScript variable entity implementation
 *
 * **Supported Variable Types:**
 * - Constants: `const NAME = value`
 * - Variables: `let name = value`
 * - Module exports: `export const NAME = value`
 *
 * **Valid JSDoc Tags:**
 * - `@type` - Variable type annotation
 * - `@readonly` - Read-only indicator
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 * - `@example` - Usage examples
 */
export class VariableEntity extends EntityBase {
	/**
	 * Create variable entity instance
	 * @param {string} name - Variable name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("variable", name, location);

		// Variable-specific properties
		this.declarationType = "const"; // const|let|var
		this.hasInitializer = false;
		this.initializer = null; // Initial value expression
		this.isReadonly = false;
		this.inferredType = null; // Type inferred from initializer
	}

	/**
	 * Valid JSDoc tags for variable entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for variables
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"description",
			"type",
			"readonly",
			"since",
			"deprecated",
			"see",
			"author",
			"example",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse variable-specific content from raw code entity
	 * @param {any} rawEntity - Raw code entity from validation
	 * @param {string} content - Full file content for context
	 */
	parseEntity(rawEntity, content) {
		// Extract variable declaration from source
		const lines = content.split("\n");
		const variableLine = lines[rawEntity.line - 1];

		this.parseVariableDeclaration(variableLine);
		this.inferTypeFromInitializer();
	}

	/**
	 * Parse variable declaration to extract declaration type and initializer
	 * @param {string} variableLine - Source line containing variable declaration
	 */
	parseVariableDeclaration(variableLine) {
		const trimmed = variableLine.trim();

		// Detect declaration type
		if (trimmed.includes("const ")) {
			this.declarationType = "const";
			this.isReadonly = true; // const variables are inherently readonly
		} else if (trimmed.includes("let ")) {
			this.declarationType = "let";
		} else if (trimmed.includes("var ")) {
			this.declarationType = "var";
		}

		// Extract initializer if present
		const equalIndex = trimmed.indexOf("=");
		if (equalIndex !== -1) {
			this.hasInitializer = true;
			// Extract everything after = until semicolon or end of line
			let initializer = trimmed.substring(equalIndex + 1).trim();

			// Remove trailing semicolon if present
			if (initializer.endsWith(";")) {
				initializer = initializer.slice(0, -1).trim();
			}

			this.initializer = initializer;
		}
	}

	/**
	 * Infer variable type from initializer expression
	 */
	inferTypeFromInitializer() {
		if (!this.initializer) {
			this.inferredType = null;
			return;
		}

		const init = this.initializer.trim();

		// Basic type inference from literal values
		if (init.startsWith('"') || init.startsWith("'") || init.startsWith("`")) {
			this.inferredType = "string";
		} else if (/^\d+$/.test(init)) {
			this.inferredType = "number";
		} else if (/^\d*\.\d+$/.test(init)) {
			this.inferredType = "number";
		} else if (init === "true" || init === "false") {
			this.inferredType = "boolean";
		} else if (init === "null") {
			this.inferredType = "null";
		} else if (init === "undefined") {
			this.inferredType = "undefined";
		} else if (init.startsWith("[") && init.endsWith("]")) {
			this.inferredType = "Array";
		} else if (init.startsWith("{") && init.endsWith("}")) {
			this.inferredType = "Object";
		} else if (init.includes("=>") || init.startsWith("function")) {
			this.inferredType = "Function";
		} else if (init.startsWith("new ")) {
			// Extract constructor name
			const constructorMatch = init.match(/^new\s+(\w+)/);
			if (constructorMatch) {
				this.inferredType = constructorMatch[1];
			}
		} else {
			// Could be a variable reference or complex expression
			this.inferredType = "unknown";
		}
	}

	/**
	 * Validate variable entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate JSDoc consistency
		this.validateJSDocConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate JSDoc tags are consistent with variable characteristics
	 */
	validateJSDocConsistency() {
		/** @type {Array<{type: string, message: string, suggestion?: string, declaredType?: string, inferredType?: string}>} */
		this.validationIssues = [];

		// Check @readonly consistency
		const readonlyTag = this.getJSDocTag("readonly");
		if (readonlyTag && !this.isReadonly && this.declarationType !== "const") {
			this.validationIssues.push({
				type: "inconsistent_readonly",
				message: "@readonly tag used on mutable variable declaration",
				/** @type {any} */ suggestion:
					"Use const declaration or remove @readonly tag",
			});
		}

		// Check @type consistency with inferred type
		const typeTag = this.getJSDocTag("type");
		if (typeTag && this.inferredType && this.inferredType !== "unknown") {
			const declaredType = this.extractTypeFromTag(typeTag);
			if (
				declaredType &&
				!this.typesAreCompatible(declaredType, this.inferredType)
			) {
				this.validationIssues.push({
					type: "type_mismatch",
					message: `@type '${declaredType}' does not match inferred type '${this.inferredType}'`,
					/** @type {any} */ declaredType,
					inferredType: this.inferredType,
				});
			}
		}
	}

	/**
	 * Extract type from type JSDoc tag
	 * @param {any} typeTag - The type JSDoc tag
	 * @returns {string|null} Extracted type or null
	 */
	extractTypeFromTag(typeTag) {
		// Type tags typically have the format: {Type} or just Type
		if (/** @type {any} */ (typeTag).type) {
			return /** @type {any} */ (typeTag).type;
		}
		return null;
	}

	/**
	 * Check if declared type is compatible with inferred type
	 * @param {string} declaredType - Type from JSDoc
	 * @param {string} inferredType - Type inferred from initializer
	 * @returns {boolean} True if types are compatible
	 */
	typesAreCompatible(declaredType, inferredType) {
		// Simple compatibility check - can be enhanced
		if (declaredType === inferredType) return true;

		// Handle common compatible types
		if (declaredType === "number" && inferredType === "number") return true;
		if (declaredType === "string" && inferredType === "string") return true;
		if (declaredType === "boolean" && inferredType === "boolean") return true;
		if (declaredType.includes("Array") && inferredType === "Array") return true;
		if (declaredType.includes("Object") && inferredType === "Object")
			return true;

		return false;
	}

	/**
	 * Get variable signature for display
	 * @returns {string} Human-readable variable signature
	 */
	getSignature() {
		let signature = `${this.declarationType} ${this.name}`;

		if (this.hasInitializer) {
			// Truncate long initializers for display
			const maxLength = 50;
			let displayInit = this.initializer;
			if (displayInit.length > maxLength) {
				displayInit = `${displayInit.substring(0, maxLength)}...`;
			}
			signature += ` = ${displayInit}`;
		}

		return signature;
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for variable documentation
	 */
	toHTML() {
		const typeTag = this.getJSDocTag("type");
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);

		return html`
			<div class="variable-entity" data-type="${this.declarationType}">
				<h3>${this.name}</h3>
				<div class="variable-meta">
					<span class="variable-type">${this.declarationType}</span>
					${this.isReadonly ? html`<span class="readonly-indicator">readonly</span>` : ""}
					<span class="variable-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="variable-signature">
					<code>${this.getSignature()}</code>
				</div>
				${
					typeTag
						? html`
					<div class="type-info">
						<strong>Type:</strong> ${typeTag.toHTML()}
					</div>
				`
						: this.inferredType
							? html`
					<div class="type-info">
						<strong>Inferred Type:</strong> <code>${this.inferredType}</code>
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
	 * @returns {string} Markdown string for variable documentation
	 */
	toMarkdown() {
		const typeTag = this.getJSDocTag("type");

		let output = `### ${this.name}\n\n`;
		output += `**Type:** ${this.declarationType}`;
		if (this.isReadonly) output += " (readonly)";
		output += `\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;
		output += `**Declaration:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		if (typeTag) {
			output += `**Type:** ${typeTag.toMarkdown()}\n\n`;
		} else if (this.inferredType) {
			output += `**Inferred Type:** \`${this.inferredType}\`\n\n`;
		}

		return output;
	}
}
