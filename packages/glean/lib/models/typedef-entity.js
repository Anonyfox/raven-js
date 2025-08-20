/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Typedef entity model - surgical JSDoc type definition documentation.
 *
 * Ravens extract JSDoc typedef constructs with precision.
 * Handles custom type definitions, object schemas, and complex
 * type aliases defined purely in documentation comments.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * JSDoc typedef entity implementation
 *
 * **Supported Typedef Forms:**
 * - Simple aliases: `typedef {string} MyString`
 * - Object types: `typedef {Object} User` with `property` tags
 * - Function types: `typedef {function} Callback` with `param/returns`
 * - Array types: `typedef {Array<string>} StringArray`
 * - Union types: `typedef {(string|number)} StringOrNumber`
 * - Generic types: `typedef {Promise<User>} UserPromise`
 *
 * **Valid JSDoc Tags:**
 * - `@property` - Object property definitions
 * - `@param` - Function parameter definitions (for function typedefs)
 * - `@returns` - Function return type (for function typedefs)
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class TypedefEntity extends EntityBase {
	/**
	 * Create typedef entity instance
	 * @param {string} name - Typedef name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("typedef", name, location);

		// Typedef-specific properties
		this.baseType = null; // Base type from typedef {Type}
		this.typedefType = "simple"; // simple|object|function|array|union
		/** @type {Array<{name: string, type: string, description: string, optional: boolean, defaultValue: any}>} */
		this.properties = []; // Properties for object typedefs
		/** @type {Array<{name: string, type: string, description: string, optional: boolean, defaultValue: any}>} */
		this.parameters = []; // Parameters for function typedefs
		this.returnType = null; // Return type for function typedefs
		this.description = ""; // Main typedef description
		this.isGeneric = false; // Has generic parameters like <T>
		/** @type {string[]} */
		this.genericParameters = []; // Generic parameter names
	}

	/**
	 * Valid JSDoc tags for typedef entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for typedefs
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"typedef",
			"property",
			"param",
			"returns",
			"return",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse typedef from JSDoc tag data
	 * @param {any} typedefTag - The typedef JSDoc tag object
	 * @param {Object[]} relatedTags - Related JSDoc tags (property, param, etc.)
	 */
	parseFromJSDoc(typedefTag, relatedTags = []) {
		// Extract base type from typedef {Type} Name
		this.baseType = /** @type {any} */ (typedefTag).type || "";
		this.description = /** @type {any} */ (typedefTag).description || "";

		// Analyze the base type to determine typedef type
		this.analyzeTypedefType();

		// Process related tags based on typedef type
		this.processRelatedTags(relatedTags);

		// Attach all tags to this entity
		this.addJSDocTag(/** @type {any} */ (typedefTag));
		for (const tag of relatedTags) {
			if (this.isValidJSDocTag(/** @type {any} */ (tag).tagType)) {
				this.addJSDocTag(/** @type {any} */ (tag));
			}
		}
	}

	/**
	 * Analyze the base type to determine what kind of typedef this is
	 */
	analyzeTypedefType() {
		if (!this.baseType) {
			this.typedefType = "simple";
			return;
		}

		const type = this.baseType.toLowerCase();

		// Check for generics
		if (this.baseType.includes("<") && this.baseType.includes(">")) {
			this.isGeneric = true;
			this.extractGenericParameters();
		}

		// Determine typedef category
		if (type === "object" || type.startsWith("{")) {
			this.typedefType = "object";
		} else if (type === "function" || type.includes("function")) {
			this.typedefType = "function";
		} else if (type.includes("array") || type.includes("[]")) {
			this.typedefType = "array";
		} else if (type.includes("|") || type.includes("(")) {
			this.typedefType = "union";
		} else {
			this.typedefType = "simple";
		}
	}

	/**
	 * Extract generic parameters from type definition
	 */
	extractGenericParameters() {
		const genericMatch = this.baseType.match(/<([^>]+)>/);
		if (genericMatch) {
			const params = genericMatch[1]
				.split(",")
				.map((/** @type {any} */ param) => param.trim())
				.filter((/** @type {any} */ param) => param.length > 0);
			this.genericParameters = params;
		}
	}

	/**
	 * Process related JSDoc tags based on typedef type
	 * @param {Object[]} relatedTags - Array of related JSDoc tag objects
	 */
	processRelatedTags(relatedTags) {
		for (const tag of relatedTags) {
			switch (/** @type {any} */ (tag).tagType) {
				case "property":
					if (this.typedefType === "object" || this.typedefType === "simple") {
						this.properties.push({
							name: /** @type {any} */ (tag).name,
							type: /** @type {any} */ (tag).type,
							description: /** @type {any} */ (tag).description,
							optional: /** @type {any} */ (tag).optional || false,
							defaultValue: /** @type {any} */ (tag).defaultValue || null,
						});
						// Upgrade to object type if we have properties
						if (this.typedefType === "simple") {
							this.typedefType = "object";
						}
					}
					break;

				case "param":
					if (
						this.typedefType === "function" ||
						this.typedefType === "simple"
					) {
						this.parameters.push({
							name: /** @type {any} */ (tag).name,
							type: /** @type {any} */ (tag).type,
							description: /** @type {any} */ (tag).description,
							optional: /** @type {any} */ (tag).optional || false,
							defaultValue: /** @type {any} */ (tag).defaultValue || null,
						});
						// Upgrade to function type if we have parameters
						if (this.typedefType === "simple") {
							this.typedefType = "function";
						}
					}
					break;

				case "returns":
				case "return":
					if (
						this.typedefType === "function" ||
						this.typedefType === "simple"
					) {
						this.returnType = {
							type: /** @type {any} */ (tag).type,
							description: /** @type {any} */ (tag).description,
						};
						// Upgrade to function type if we have return type
						if (this.typedefType === "simple") {
							this.typedefType = "function";
						}
					}
					break;

				default:
					// Other tags are handled by the base class
					break;
			}
		}
	}

	/**
	 * Parse typedef-specific content (not used for pure JSDoc constructs)
	 * @param {any} _rawEntity - Raw code entity (unused)
	 * @param {string} _content - Full file content (unused)
	 */
	parseEntity(_rawEntity, _content) {
		// TypedefEntity is parsed from JSDoc, not code
		// This method exists to satisfy the abstract contract
	}

	/**
	 * Validate typedef entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate typedef consistency
		this.validateTypedefConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate typedef structure is consistent
	 */
	validateTypedefConsistency() {
		/** @type {Array<{type: string, message: string, suggestion?: string, duplicates?: string[]}>} */
		this.validationIssues = [];

		// Object typedefs should have properties
		if (this.typedefType === "object" && this.properties.length === 0) {
			this.validationIssues.push({
				type: "empty_object_typedef",
				message: "Object typedef has no @property tags",
				/** @type {any} */ suggestion:
					"Add @property tags to define object structure",
			});
		}

		// Function typedefs should have parameters or return type
		if (
			this.typedefType === "function" &&
			this.parameters.length === 0 &&
			!this.returnType
		) {
			this.validationIssues.push({
				type: "incomplete_function_typedef",
				message: "Function typedef has no param or returns tags",
				/** @type {any} */ suggestion:
					"Add param and returns tags to define function signature",
			});
		}

		// Validate property names are unique
		const propertyNames = this.properties.map((p) => p.name);
		const duplicateProperties = propertyNames.filter(
			(name, index) => propertyNames.indexOf(name) !== index,
		);
		if (duplicateProperties.length > 0) {
			this.validationIssues.push({
				type: "duplicate_properties",
				message: `Duplicate property names: ${duplicateProperties.join(", ")}`,
				/** @type {any} */ duplicates: duplicateProperties,
			});
		}

		// Validate parameter names are unique
		const paramNames = this.parameters.map((p) => p.name);
		const duplicateParams = paramNames.filter(
			(name, index) => paramNames.indexOf(name) !== index,
		);
		if (duplicateParams.length > 0) {
			this.validationIssues.push({
				type: "duplicate_parameters",
				message: `Duplicate parameter names: ${duplicateParams.join(", ")}`,
				/** @type {any} */ duplicates: duplicateParams,
			});
		}
	}

	/**
	 * Get typedef signature for display
	 * @returns {string} Human-readable typedef signature
	 */
	getSignature() {
		let signature = `@typedef {${this.baseType || "any"}} ${this.name}`;

		if (this.isGeneric) {
			const generics = this.genericParameters.join(", ");
			signature = `@typedef {${this.baseType}<${generics}>} ${this.name}`;
		}

		return signature;
	}

	/**
	 * Get typedef structure summary
	 * @returns {Object} Typedef summary
	 */
	getSummary() {
		return {
			typedefType: this.typedefType,
			hasProperties: this.properties.length > 0,
			propertyCount: this.properties.length,
			hasParameters: this.parameters.length > 0,
			parameterCount: this.parameters.length,
			hasReturnType: Boolean(this.returnType),
			isGeneric: this.isGeneric,
			genericParameterCount: this.genericParameters.length,
		};
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Typedef-specific serializable data
	 */
	getSerializableData() {
		const baseData = super.getSerializableData();
		return {
			...baseData,
			baseType: this.baseType,
			typedefType: this.typedefType,
			properties: this.properties,
			parameters: this.parameters,
			returnType: this.returnType,
			description: this.description,
			isGeneric: this.isGeneric,
			genericParameters: this.genericParameters,
			signature: this.getSignature(),
			summary: this.getSummary(),
			validationIssues: this.validationIssues || [],
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for typedef documentation
	 */
	toHTML() {
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);

		return html`
			<div class="typedef-entity" data-type="${this.typedefType}">
				<h3>${this.name}</h3>
				<div class="typedef-meta">
					<span class="typedef-type">@typedef</span>
					<span class="typedef-category">${this.typedefType}</span>
					${
						this.isGeneric
							? html`<span class="generic-indicator">generic</span>`
							: ""
					}
					<span class="typedef-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="typedef-signature">
					<code>${this.getSignature()}</code>
				</div>
				${
					this.description
						? html`
					<div class="typedef-description">
						<p>${this.description}</p>
					</div>
				`
						: ""
				}
				${
					this.baseType
						? html`
					<div class="base-type">
						<strong>Type:</strong> <code>${this.baseType}</code>
					</div>
				`
						: ""
				}
				${
					this.properties.length > 0
						? html`
					<div class="properties">
						<h4>Properties</h4>
						<ul class="property-list">
							${this.properties
								.map(
									(prop) => html`
								<li class="property-item">
									<code class="property-name">${prop.name}</code>
									${prop.type ? html`<span class="property-type">{${prop.type}}</span>` : ""}
									${prop.optional ? html`<em>(optional)</em>` : ""}
									${prop.defaultValue ? html`<span class="property-default">= ${prop.defaultValue}</span>` : ""}
									${prop.description ? html`<span class="property-desc">- ${prop.description}</span>` : ""}
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
					this.parameters.length > 0
						? html`
					<div class="parameters">
						<h4>Parameters</h4>
						<ul class="param-list">
							${this.parameters
								.map(
									(param) => html`
								<li class="param-item">
									<code class="param-name">${param.name}</code>
									${param.type ? html`<span class="param-type">{${param.type}}</span>` : ""}
									${param.optional ? html`<em>(optional)</em>` : ""}
									${param.defaultValue ? html`<span class="param-default">= ${param.defaultValue}</span>` : ""}
									${param.description ? html`<span class="param-desc">- ${param.description}</span>` : ""}
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
					this.returnType
						? html`
					<div class="return-type">
						<h4>Returns</h4>
						<div class="return-info">
							${this.returnType.type ? html`<code>{${this.returnType.type}}</code>` : ""}
							${this.returnType.description ? html`<span> - ${this.returnType.description}</span>` : ""}
						</div>
					</div>
				`
						: ""
				}
				${
					this.isGeneric && this.genericParameters.length > 0
						? html`
					<div class="generic-params">
						<h4>Generic Parameters</h4>
						<ul class="generic-list">
							${this.genericParameters
								.map((param) => html`<li><code>${param}</code></li>`)
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
	 * @returns {string} Markdown string for typedef documentation
	 */
	toMarkdown() {
		let output = `### ${this.name}\n\n`;
		output += `**Type:** @typedef (${this.typedefType})`;
		if (this.isGeneric) output += " (generic)";
		output += `\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;
		output += `**Definition:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		if (this.description) {
			output += `${this.description}\n\n`;
		}

		if (this.baseType) {
			output += `**Base Type:** \`${this.baseType}\`\n\n`;
		}

		if (this.properties.length > 0) {
			output += `**Properties:**\n\n`;
			for (const prop of this.properties) {
				output += `- \`${prop.name}\``;
				if (prop.type) output += ` \`{${prop.type}}\``;
				if (prop.optional) output += " *(optional)*";
				if (prop.defaultValue) output += ` = ${prop.defaultValue}`;
				if (prop.description) output += ` - ${prop.description}`;
				output += `\n`;
			}
			output += `\n`;
		}

		if (this.parameters.length > 0) {
			output += `**Parameters:**\n\n`;
			for (const param of this.parameters) {
				output += `- \`${param.name}\``;
				if (param.type) output += ` \`{${param.type}}\``;
				if (param.optional) output += " *(optional)*";
				if (param.defaultValue) output += ` = ${param.defaultValue}`;
				if (param.description) output += ` - ${param.description}`;
				output += `\n`;
			}
			output += `\n`;
		}

		if (this.returnType) {
			output += `**Returns:**`;
			if (this.returnType.type) output += ` \`{${this.returnType.type}}\``;
			if (this.returnType.description)
				output += ` - ${this.returnType.description}`;
			output += `\n\n`;
		}

		if (this.isGeneric && this.genericParameters.length > 0) {
			output += `**Generic Parameters:** ${this.genericParameters.map((p) => `\`${p}\``).join(", ")}\n\n`;
		}

		return output;
	}
}
