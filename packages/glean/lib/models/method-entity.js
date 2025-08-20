/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Method entity model - surgical class method documentation.
 *
 * Ravens extract class methods with predatory precision.
 * Handles constructors, getters, setters, static methods, and private methods.
 * Reuses function parsing intelligence with class-specific context.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * Class method entity implementation
 *
 * **Supported Method Types:**
 * - Constructor: `constructor(params) { ... }`
 * - Regular: `methodName(params) { ... }`
 * - Async: `async methodName(params) { ... }`
 * - Generator: `*methodName(params) { ... }`
 * - Async Generator: `async *methodName(params) { ... }`
 * - Getter: `get propertyName() { ... }`
 * - Setter: `set propertyName(value) { ... }`
 * - Static: `static methodName(params) { ... }`
 * - Private: `#methodName(params) { ... }`
 *
 * **Valid JSDoc Tags:**
 * - `@param` - Parameter definitions
 * - `returns`/`return` - Return value documentation
 * - `@throws` - Exception documentation
 * - `@override` - Method overrides parent
 * - `@abstract` - Abstract method declaration
 * - `@static` - Static method marker
 * - `@private` - Private method marker
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class MethodEntity extends EntityBase {
	/**
	 * Create method entity instance
	 * @param {string} name - Method name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("method", name, location);

		// Method-specific properties
		this.methodType = "method"; // constructor|method|getter|setter
		this.isStatic = false;
		this.isPrivate = false;
		this.isAsync = false;
		this.isGenerator = false;
		this.parentClass = null; // Reference to parent class entity
		/** @type {Array<{name: string, fullSignature?: string, isOptional?: boolean, hasDefault?: boolean, defaultValue: any, isRest?: boolean, type?: string, description?: string, optional?: boolean}>} */
		this.parameters = [];
		this.returnType = null;
		this.signature = "";
		this.body = null; // Method body content (optional)
	}

	/**
	 * Valid JSDoc tags for method entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for methods
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"description",
			"param",
			"returns",
			"return",
			"throws",
			"throw",
			"override",
			"abstract",
			"static",
			"private",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse method entity from raw method data and source content
	 * @param {Object} rawMethod - Raw method object from ClassEntity
	 * @param {string} content - Full source content
	 */
	parseEntity(rawMethod, content) {
		// Extract method metadata from ClassEntity data
		this.methodType = /** @type {any} */ (rawMethod).type || "method";
		this.isStatic = /** @type {any} */ (rawMethod).isStatic || false;
		this.isPrivate = /** @type {any} */ (rawMethod).isPrivate || false;
		this.signature = /** @type {any} */ (rawMethod).signature || "";

		// Parse the method signature for additional details
		this.parseMethodSignature(this.signature);

		// Extract parameters from signature
		this.extractParameters();

		// Set source snippet
		const lines = content.split("\n");
		const startLine = Math.max(0, this.location.line - 1);
		const endLine = Math.min(lines.length, startLine + 10);
		this.source = lines.slice(startLine, endLine).join("\n");
	}

	/**
	 * Parse method signature to extract type information
	 * @param {string} signature - Method signature string
	 */
	parseMethodSignature(signature) {
		if (!signature) return;

		// Check for async methods
		this.isAsync = signature.includes("async ");

		// Check for generator methods (*)
		this.isGenerator = signature.includes("*");

		// Clean signature for parameter parsing
		this.signature = signature;
	}

	/**
	 * Extract parameters from method signature
	 */
	extractParameters() {
		if (!this.signature) return;

		// Extract parameter list from signature
		const paramMatch = this.signature.match(/\(([^)]*)\)/);
		if (!paramMatch) return;

		const paramString = paramMatch[1];
		if (!paramString.trim()) return;

		// Split parameters (reuse logic from FunctionEntity)
		const paramList = this.splitParameters(paramString);
		this.parameters = paramList.map((param) => this.parseParameter(param));
	}

	/**
	 * Split parameter string into individual parameters
	 * @param {string} paramString - Parameters string from signature
	 * @returns {string[]} Array of individual parameter strings
	 */
	splitParameters(paramString) {
		const parameters = [];
		let current = "";
		let parenDepth = 0;
		let braceDepth = 0;
		let bracketDepth = 0;

		for (let i = 0; i < paramString.length; i++) {
			const char = paramString[i];

			if (char === "(") parenDepth++;
			else if (char === ")") parenDepth--;
			else if (char === "{") braceDepth++;
			else if (char === "}") braceDepth--;
			else if (char === "[") bracketDepth++;
			else if (char === "]") bracketDepth--;
			else if (
				char === "," &&
				parenDepth === 0 &&
				braceDepth === 0 &&
				bracketDepth === 0
			) {
				parameters.push(current.trim());
				current = "";
				continue;
			}

			current += char;
		}

		if (current.trim()) {
			parameters.push(current.trim());
		}

		return parameters;
	}

	/**
	 * Parse individual parameter information
	 * @param {string} paramString - Single parameter string
	 * @returns {{name: string, fullSignature: string, isOptional: boolean, hasDefault: boolean, defaultValue: any, isRest: boolean}} Parsed parameter object
	 */
	parseParameter(paramString) {
		const param = {
			name: "",
			fullSignature: paramString,
			isOptional: false,
			hasDefault: false,
			/** @type {any} */
			defaultValue: null,
			isRest: false,
		};

		let working = paramString.trim();

		// Check for rest parameter (...)
		if (working.startsWith("...")) {
			param.isRest = true;
			working = working.substring(3);
		}

		// Check for default value (=) - but be careful with destructuring
		let equalIndex = -1;
		if (working.startsWith("{") || working.startsWith("[")) {
			// For destructuring, find the closing brace/bracket first
			let depth = 0;
			let closingIndex = -1;
			const startChar = working[0];
			const endChar = startChar === "{" ? "}" : "]";

			for (let i = 0; i < working.length; i++) {
				if (working[i] === startChar) depth++;
				else if (working[i] === endChar) {
					depth--;
					if (depth === 0) {
						closingIndex = i;
						break;
					}
				}
			}

			// Look for = after the destructuring pattern
			if (closingIndex > -1 && closingIndex + 1 < working.length) {
				const afterDestructuring = working.substring(closingIndex + 1).trim();
				if (afterDestructuring.startsWith("=")) {
					equalIndex = closingIndex + 1 + afterDestructuring.indexOf("=");
				}
			}

			// Use the whole destructuring pattern as the name
			param.name =
				closingIndex > -1 ? working.substring(0, closingIndex + 1) : working;
		} else {
			// Regular parameter - find = normally
			equalIndex = working.indexOf("=");

			if (equalIndex > -1) {
				param.name = working.substring(0, equalIndex).trim();
			} else {
				param.name = working.split(/\s+/)[0];
			}
		}

		// Extract default value if = was found
		if (equalIndex > -1) {
			param.hasDefault = true;
			param.defaultValue = working.substring(equalIndex + 1).trim();
		}

		// Optional parameters in TypeScript/JSDoc style
		if (param.name.endsWith("?")) {
			param.isOptional = true;
			param.name = param.name.slice(0, -1);
		}

		return param;
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
	 * Validate method entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate method-specific consistency
		this.validateMethodConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate method JSDoc consistency with actual signature
	 */
	validateMethodConsistency() {
		/** @type {Array<{type: string, message: string, parameter?: string, missingParams?: string[], extraParams?: string[]}>} */
		this.validationIssues = [];

		// Get all @param tags
		const paramTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "param",
		);

		// Check if @param tags match actual parameters
		const actualParamNames = this.parameters.map((p) => p.name);
		const jsdocParamNames = paramTags.map(
			(tag) => /** @type {any} */ (tag).name,
		);

		// Find missing @param tags
		const missingParams = actualParamNames.filter(
			(name) =>
				!jsdocParamNames.includes(name) &&
				!name.startsWith("{") &&
				!name.startsWith("["),
		);
		if (missingParams.length > 0) {
			this.validationIssues.push({
				type: "missing_param_docs",
				message: `Missing @param tags for: ${missingParams.join(", ")}`,
				/** @type {any} */ missingParams,
			});
		}

		// Find extra @param tags
		const extraParams = jsdocParamNames.filter(
			(name) => !actualParamNames.includes(name),
		);
		if (extraParams.length > 0) {
			this.validationIssues.push({
				type: "extra_param_docs",
				message: `Extra @param tags found: ${extraParams.join(", ")}`,
				/** @type {any} */ extraParams,
			});
		}

		// Validate @static tag consistency
		const staticTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "static",
		);
		if (staticTags.length > 0 && !this.isStatic) {
			this.validationIssues.push({
				type: "static_tag_mismatch",
				message: "Method has @static tag but is not declared as static",
			});
		}

		// Validate @private tag consistency
		const privateTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "private",
		);
		if (privateTags.length > 0 && !this.isPrivate) {
			this.validationIssues.push({
				type: "private_tag_mismatch",
				message: "Method has @private tag but is not declared as private",
			});
		}

		// Validate constructor doesn't have @returns
		if (this.methodType === "constructor") {
			const returnTags = this.getAllJSDocTags().filter(
				(tag) => tag.tagType === "returns" || tag.tagType === "return",
			);
			if (returnTags.length > 0) {
				this.validationIssues.push({
					type: "constructor_return_tag",
					message: "Constructor methods should not have @returns tags",
				});
			}
		}

		// Validate getters have returns but no param
		if (this.methodType === "getter") {
			const returnTags = this.getAllJSDocTags().filter(
				(tag) => tag.tagType === "returns" || tag.tagType === "return",
			);
			if (returnTags.length === 0) {
				this.validationIssues.push({
					type: "getter_missing_returns",
					message: "Getter methods should have @returns documentation",
				});
			}
			if (paramTags.length > 0) {
				this.validationIssues.push({
					type: "getter_has_params",
					message: "Getter methods should not have @param tags",
				});
			}
		}

		// Validate setters have exactly one param and no returns
		if (this.methodType === "setter") {
			if (paramTags.length !== 1) {
				this.validationIssues.push({
					type: "setter_param_count",
					message: "Setter methods should have exactly one @param tag",
				});
			}
			const returnTags = this.getAllJSDocTags().filter(
				(tag) => tag.tagType === "returns" || tag.tagType === "return",
			);
			if (returnTags.length > 0) {
				this.validationIssues.push({
					type: "setter_has_returns",
					message: "Setter methods should not have @returns tags",
				});
			}
		}
	}

	/**
	 * Get method signature for display
	 * @returns {string} Human-readable method signature
	 */
	getSignature() {
		let signature = "";

		if (this.isStatic) signature += "static ";
		if (this.isAsync) signature += "async ";
		if (this.methodType === "getter") signature += "get ";
		if (this.methodType === "setter") signature += "set ";
		if (this.isGenerator) signature += "*";

		signature += this.name;

		// Add parameters for non-getter methods
		if (this.methodType !== "getter") {
			const paramStrings = this.parameters.map((p) => {
				let paramStr = "";
				if (p.isRest) paramStr += "...";
				paramStr += p.name;
				if (p.hasDefault) paramStr += ` = ${p.defaultValue}`;
				return paramStr;
			});
			signature += `(${paramStrings.join(", ")})`;
		} else {
			signature += "()";
		}

		return signature;
	}

	/**
	 * Get method summary information
	 * @returns {Object} Method summary
	 */
	getSummary() {
		return {
			methodType: this.methodType,
			isStatic: this.isStatic,
			isPrivate: this.isPrivate,
			isAsync: this.isAsync,
			isGenerator: this.isGenerator,
			parameterCount: this.parameters.length,
			hasParameters: this.parameters.length > 0,
			hasReturnType: Boolean(this.returnType),
			parentClass: this.parentClass,
		};
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Method-specific serializable data
	 */
	getSerializableData() {
		const baseData = super.getSerializableData();
		return {
			...baseData,
			methodType: this.methodType,
			isStatic: this.isStatic,
			isPrivate: this.isPrivate,
			isAsync: this.isAsync,
			isGenerator: this.isGenerator,
			parentClass: this.parentClass,
			parameters: this.parameters,
			returnType: this.returnType,
			signature: this.getSignature(),
			summary: this.getSummary(),
			validationIssues: this.validationIssues || [],
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for method documentation
	 */
	toHTML() {
		const paramTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "param",
		);
		const returnTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "returns" || tag.tagType === "return",
		);
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);
		const throwsTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "throws" || tag.tagType === "throw",
		);

		return html`
			<div class="method-entity" data-type="${this.methodType}">
				<h3>${this.name}</h3>
				<div class="method-meta">
					<span class="method-type">${this.methodType}</span>
					${this.isStatic ? html`<span class="static-indicator">static</span>` : ""}
					${this.isPrivate ? html`<span class="private-indicator">private</span>` : ""}
					${this.isAsync ? html`<span class="async-indicator">async</span>` : ""}
					${this.isGenerator ? html`<span class="generator-indicator">generator</span>` : ""}
					<span class="method-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="method-signature">
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
					paramTags.length > 0
						? html`
					<div class="parameters">
						<h4>Parameters</h4>
						<ul class="param-list">
							${paramTags.map((tag) => tag.toHTML()).join("\n")}
						</ul>
					</div>
				`
						: ""
				}
				${
					returnTags.length > 0
						? html`
					<div class="returns">
						<h4>Returns</h4>
						${returnTags.map((tag) => tag.toHTML()).join("\n")}
					</div>
				`
						: ""
				}
				${
					throwsTags.length > 0
						? html`
					<div class="throws">
						<h4>Throws</h4>
						<ul class="throws-list">
							${throwsTags.map((tag) => tag.toHTML()).join("\n")}
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
	 * @returns {string} Markdown string for method documentation
	 */
	toMarkdown() {
		let output = `### ${this.name}\n\n`;
		output += `**Type:** ${this.methodType}`;
		if (this.isStatic) output += " (static)";
		if (this.isPrivate) output += " (private)";
		if (this.isAsync) output += " (async)";
		if (this.isGenerator) output += " (generator)";
		output += `\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;

		if (this.parentClass) {
			output += `**Class:** \`${this.parentClass}\`\n\n`;
		}

		output += `**Signature:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		const paramTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "param",
		);
		if (paramTags.length > 0) {
			output += `**Parameters:**\n\n`;
			for (const tag of paramTags) {
				output += `${tag.toMarkdown()}\n`;
			}
			output += `\n`;
		}

		const returnTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "returns" || tag.tagType === "return",
		);
		if (returnTags.length > 0) {
			output += `**Returns:**\n\n`;
			for (const tag of returnTags) {
				output += `${tag.toMarkdown()}\n`;
			}
			output += `\n`;
		}

		const throwsTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "throws" || tag.tagType === "throw",
		);
		if (throwsTags.length > 0) {
			output += `**Throws:**\n\n`;
			for (const tag of throwsTags) {
				output += `${tag.toMarkdown()}\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
