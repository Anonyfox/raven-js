/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Callback entity model - surgical JSDoc function signature documentation.
 *
 * Ravens extract JSDoc @callback constructs with predatory precision.
 * Handles function signature definitions defined purely in documentation
 * comments with comprehensive parameter and return value validation.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * JSDoc @callback entity implementation
 *
 * **Supported Callback Forms:**
 * - Basic callbacks: `@callback CallbackName`
 * - With parameters: `callback Handler` + `param {string} data`
 * - With return types: `callback Processor` + `returns {boolean}`
 * - Complex signatures: Multiple params + return + documentation
 *
 * **Valid JSDoc Tags:**
 * - `@param` - Parameter definitions
 * - `returns`/`return` - Return value documentation
 * - `@throws` - Exception documentation
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class CallbackEntity extends EntityBase {
	/**
	 * Create callback entity instance
	 * @param {string} name - Callback name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("callback", name, location);

		// Callback-specific properties
		this.description = ""; // Main callback description
		/** @type {Array<{name: string, type: string, description: string, optional: boolean, defaultValue: any}>} */
		this.parameters = []; // Parameters from @param tags
		this.returnType = null; // Return type from @returns tag
		/** @type {Array<{type: string, description: string}>} */
		this.throwsTypes = []; // Exception types from @throws tags
		this.signature = ""; // Generated function signature
	}

	/**
	 * Valid JSDoc tags for callback entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for callbacks
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"callback",
			"param",
			"returns",
			"return",
			"throws",
			"throw",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse callback from JSDoc tag data
	 * @param {any} callbackTag - The callback JSDoc tag object
	 * @param {any[]} [relatedTags=[]] - Related JSDoc tags (param, returns, etc.)
	 */
	/**
	 * @param {any} callbackTag
	 * @param {any[]} relatedTags
	 */
	parseFromJSDoc(callbackTag, relatedTags = []) {
		// Extract description from @callback tag
		this.description = /** @type {any} */ (callbackTag).description || "";

		// Process related tags to build function signature
		this.processRelatedTags(relatedTags);

		// Generate function signature
		this.generateSignature();

		// Attach all tags to this entity
		this.addJSDocTag(/** @type {any} */ (callbackTag));
		for (const tag of relatedTags) {
			if (this.isValidJSDocTag(/** @type {any} */ (tag).tagType)) {
				this.addJSDocTag(/** @type {any} */ (tag));
			}
		}
	}

	/**
	 * Process related JSDoc tags to extract callback definition
	 * @param {Object[]} relatedTags - Array of related JSDoc tag objects
	 */
	processRelatedTags(relatedTags) {
		for (const tag of relatedTags) {
			switch (/** @type {any} */ (tag).tagType) {
				case "param":
					this.parameters.push({
						name: /** @type {any} */ (tag).name,
						type: /** @type {any} */ (tag).type,
						description: /** @type {any} */ (tag).description,
						optional: /** @type {any} */ (tag).optional || false,
						defaultValue: /** @type {any} */ (tag).defaultValue || null,
					});
					break;

				case "returns":
				case "return":
					this.returnType = {
						type: /** @type {any} */ (tag).type,
						description: /** @type {any} */ (tag).description,
					};
					break;

				case "throws":
				case "throw":
					this.throwsTypes.push({
						type: /** @type {any} */ (tag).type,
						description: /** @type {any} */ (tag).description,
					});
					break;

				default:
					// Other tags are handled by the base class
					break;
			}
		}
	}

	/**
	 * Generate function signature from parameters and return type
	 */
	generateSignature() {
		const paramStrings = this.parameters.map((param) => {
			let paramStr = param.name;
			if (param.optional) paramStr += "?";
			if (param.defaultValue) paramStr += ` = ${param.defaultValue}`;
			return paramStr;
		});

		let signature = `function ${this.name}(${paramStrings.join(", ")})`;

		if (this.returnType) {
			signature += ` => ${this.returnType.type}`;
		}

		this.signature = signature;
	}

	/**
	 * Parse callback-specific content (not used for pure JSDoc constructs)
	 * @param {any} _rawEntity - Raw code entity (unused)
	 * @param {string} _content - Full file content (unused)
	 */
	parseEntity(_rawEntity, _content) {
		// CallbackEntity is parsed from JSDoc, not code
		// This method exists to satisfy the abstract contract
	}

	/**
	 * Validate callback entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate callback consistency
		this.validateCallbackConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate callback JSDoc consistency
	 */
	validateCallbackConsistency() {
		/** @type {Array<{type: string, message: string, duplicates?: string[], missingTypes?: string[], suggestion?: string}>} */
		this.validationIssues = [];

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

		// Check for missing parameter types
		const missingTypes = this.parameters.filter(
			(p) => !p.type || p.type.trim() === "",
		);
		if (missingTypes.length > 0) {
			this.validationIssues.push({
				type: "missing_parameter_types",
				message: `Parameters missing type information: ${missingTypes.map((p) => p.name).join(", ")}`,
				/** @type {any} */ missingTypes: missingTypes.map((p) => p.name),
			});
		}

		// Validate return type if present
		if (
			this.returnType &&
			(!this.returnType.type || this.returnType.type.trim() === "")
		) {
			this.validationIssues.push({
				type: "missing_return_type",
				message: "Return type is specified but missing type information",
			});
		}

		// Check for meaningful description
		if (!this.description?.trim() || this.description.trim().length < 3) {
			this.validationIssues.push({
				type: "missing_description",
				message: "Callback should have a meaningful description",
				/** @type {any} */ suggestion:
					"Add a description explaining the callback's purpose",
			});
		}

		// Validate throws types
		const invalidThrows = this.throwsTypes.filter(
			(t) => !t.type || t.type.trim() === "",
		);
		if (invalidThrows.length > 0) {
			this.validationIssues.push({
				type: "missing_throws_types",
				message: "Some @throws tags are missing type information",
			});
		}
	}

	/**
	 * Get callback signature for display
	 * @returns {string} Human-readable callback signature
	 */
	getSignature() {
		return this.signature || `function ${this.name}()`;
	}

	/**
	 * Get callback summary information
	 * @returns {Object} Callback summary
	 */
	getSummary() {
		return {
			hasParameters: this.parameters.length > 0,
			parameterCount: this.parameters.length,
			hasReturnType: Boolean(this.returnType),
			hasThrows: this.throwsTypes.length > 0,
			throwsCount: this.throwsTypes.length,
			hasDescription: Boolean(this.description?.trim()),
		};
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Callback-specific serializable data
	 */
	getSerializableData() {
		const baseData = super.getSerializableData();
		return {
			...baseData,
			description: this.description,
			parameters: this.parameters,
			returnType: this.returnType,
			throwsTypes: this.throwsTypes,
			signature: this.getSignature(),
			summary: this.getSummary(),
			validationIssues: this.validationIssues || [],
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for callback documentation
	 */
	toHTML() {
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);

		return html`
			<div class="callback-entity">
				<h3>${this.name}</h3>
				<div class="callback-meta">
					<span class="callback-type">@callback</span>
					<span class="callback-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="callback-signature">
					<code>${this.getSignature()}</code>
				</div>
				${
					this.description
						? html`
					<div class="callback-description">
						<p>${this.description}</p>
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
					this.throwsTypes.length > 0
						? html`
					<div class="throws">
						<h4>Throws</h4>
						<ul class="throws-list">
							${this.throwsTypes
								.map(
									(throwsType) => html`
								<li class="throws-item">
									${throwsType.type ? html`<code>{${throwsType.type}}</code>` : ""}
									${throwsType.description ? html`<span> - ${throwsType.description}</span>` : ""}
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
	 * @returns {string} Markdown string for callback documentation
	 */
	toMarkdown() {
		let output = `### ${this.name}\n\n`;
		output += `**Type:** @callback\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;
		output += `**Signature:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		if (this.description) {
			output += `${this.description}\n\n`;
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

		if (this.throwsTypes.length > 0) {
			output += `**Throws:**\n\n`;
			for (const throwsType of this.throwsTypes) {
				output += `- `;
				if (throwsType.type) output += `\`{${throwsType.type}}\``;
				if (throwsType.description) output += ` - ${throwsType.description}`;
				output += `\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
