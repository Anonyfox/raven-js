/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Function entity model - surgical function documentation.
 *
 * Ravens dissect function constructs with predatory precision.
 * Handles all JavaScript function variants: regular, arrow, async,
 * generators with comprehensive parameter and return type analysis.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

/**
 * JavaScript function entity implementation
 *
 * **Supported Function Types:**
 * - Regular functions: `function name() {}`
 * - Arrow functions: `const name = () => {}`
 * - Async functions: `async function name() {}`
 * - Generator functions: `function* name() {}`
 * - Async generators: `async function* name() {}`
 * - Method functions: object methods and class methods
 *
 * **Valid JSDoc Tags:**
 * - `@param` - Parameter documentation
 * - `returns/return` - Return value documentation
 * - `@throws/@exception` - Exception documentation
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 * - `@override` - Method override indicator
 */
export class FunctionEntity extends EntityBase {
	/**
	 * Create function entity instance
	 * @param {string} name - Function name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("function", name, location);

		// Function-specific properties
		this.functionType = "function"; // function|arrow|async|generator|async-generator
		this.isAsync = false;
		this.isGenerator = false;
		this.isArrow = false;
		/** @type {Array<{name: string, fullSignature: string, isRest: boolean, hasDefault: boolean, defaultValue: string|null, isDestructured: boolean}>} */
		this.parameters = []; // Extracted parameter information
		this.returnType = null; // Extracted from JSDoc or inference
	}

	/**
	 * Valid JSDoc tags for function entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for functions
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"description",
			"param",
			"returns",
			"return",
			"throws",
			"exception",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
			"override",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse function-specific content from raw code entity
	 * @param {any} rawEntity - Raw code entity from validation
	 * @param {string} content - Full file content for context
	 */
	parseEntity(rawEntity, content) {
		// Extract function signature from source
		const lines = content.split("\n");
		const functionLine = lines[rawEntity.line - 1];

		this.parseFunctionSignature(functionLine);
		this.extractParameters(functionLine);
	}

	/**
	 * Parse function signature to determine function type and characteristics
	 * @param {string} functionLine - Source line containing function declaration
	 */
	parseFunctionSignature(functionLine) {
		const trimmed = functionLine.trim();

		// Detect async functions
		this.isAsync = trimmed.includes("async");

		// Detect generator functions
		this.isGenerator = trimmed.includes("function*");

		// Detect arrow functions
		this.isArrow = trimmed.includes("=>");

		// Determine function type
		if (this.isAsync && this.isGenerator) {
			this.functionType = "async-generator";
		} else if (this.isAsync) {
			this.functionType = "async";
		} else if (this.isGenerator) {
			this.functionType = "generator";
		} else if (this.isArrow) {
			this.functionType = "arrow";
		} else {
			this.functionType = "function";
		}
	}

	/**
	 * Extract parameter information from function signature
	 * @param {string} functionLine - Source line containing function declaration
	 */
	extractParameters(functionLine) {
		// Find the parameter list, handling nested parentheses properly
		const openParenIndex = functionLine.indexOf("(");
		if (openParenIndex === -1) {
			this.parameters = [];
			return;
		}

		// Find matching closing parenthesis
		let parenDepth = 0;
		let closeParenIndex = -1;

		for (let i = openParenIndex; i < functionLine.length; i++) {
			if (functionLine[i] === "(") parenDepth++;
			else if (functionLine[i] === ")") {
				parenDepth--;
				if (parenDepth === 0) {
					closeParenIndex = i;
					break;
				}
			}
		}

		if (closeParenIndex === -1) {
			this.parameters = [];
			return;
		}

		const paramString = functionLine
			.substring(openParenIndex + 1, closeParenIndex)
			.trim();
		if (!paramString) {
			this.parameters = [];
			return;
		}

		// Split parameters, handling complex cases like destructuring
		const params = this.splitParameters(paramString);
		this.parameters = params.map((param) => this.parseParameter(param.trim()));
	}

	/**
	 * Split parameter string into individual parameters
	 * @param {string} paramString - Parameter string from function signature
	 * @returns {string[]} Array of parameter strings
	 */
	splitParameters(paramString) {
		const params = [];
		let current = "";
		let braceDepth = 0;
		let bracketDepth = 0;
		let parenDepth = 0;

		for (const char of paramString) {
			if (char === "{") braceDepth++;
			else if (char === "}") braceDepth--;
			else if (char === "[") bracketDepth++;
			else if (char === "]") bracketDepth--;
			else if (char === "(") parenDepth++;
			else if (char === ")") parenDepth--;
			else if (
				char === "," &&
				braceDepth === 0 &&
				bracketDepth === 0 &&
				parenDepth === 0
			) {
				params.push(current.trim());
				current = "";
				continue;
			}

			current += char;
		}

		if (current.trim()) {
			params.push(current.trim());
		}

		return params;
	}

	/**
	 * Parse individual parameter
	 * @param {string} param - Parameter string
	 * @returns {{name: string, fullSignature: string, isRest: boolean, hasDefault: boolean, defaultValue: string|null, isDestructured: boolean}} Parameter metadata
	 */
	parseParameter(param) {
		// Handle destructuring, defaults, and rest parameters
		const isRest = param.startsWith("...");
		const hasDefault = param.includes("=");

		let name = param;
		let defaultValue = null;

		if (hasDefault) {
			const equalIndex = param.indexOf("=");
			name = param.substring(0, equalIndex).trim();
			defaultValue = param.substring(equalIndex + 1).trim();
		}

		if (isRest) {
			name = name.substring(3); // Remove '...'
		}

		// Extract simple name from complex patterns
		const simpleName = this.extractSimpleParameterName(name);

		return {
			name: simpleName,
			fullSignature: param,
			isRest,
			hasDefault,
			defaultValue,
			isDestructured: name.includes("{") || name.includes("["),
		};
	}

	/**
	 * Extract simple parameter name from complex patterns
	 * @param {string} name - Parameter name pattern
	 * @returns {string} Simple parameter name
	 */
	extractSimpleParameterName(name) {
		// Handle destructuring patterns
		if (name.startsWith("{") || name.startsWith("[")) {
			// For destructured parameters, use the pattern as the name
			return name;
		}

		// Handle simple names
		return name.replace(/\s+/g, "");
	}

	/**
	 * Validate function entity and its JSDoc documentation
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
	 * Validate JSDoc tags are consistent with function signature
	 */
	validateJSDocConsistency() {
		// Check that param tags match actual parameters
		const paramTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "param",
		);
		const paramNames = this.parameters.map((p) => p.name);

		// Store validation results for potential reporting
		/** @type {Array<{type: string, message: string, parameter: string}>} */
		this.validationIssues = [];

		// Check for missing param tags
		for (const param of this.parameters) {
			const hasParamTag = paramTags.some(
				(tag) => /** @type {any} */ (tag).name === param.name,
			);
			if (!hasParamTag) {
				this.validationIssues.push({
					type: "missing_param_tag",
					message: `Missing param tag for parameter '${param.name}'`,
					parameter: param.name,
				});
			}
		}

		// Check for extra param tags
		for (const paramTag of paramTags) {
			const hasParam = paramNames.includes(/** @type {any} */ (paramTag).name);
			if (!hasParam) {
				this.validationIssues.push({
					type: "extra_param_tag",
					message: `param tag '${/** @type {any} */ (paramTag).name}' does not match any function parameter`,
					parameter: /** @type {any} */ (paramTag).name,
				});
			}
		}
	}

	/**
	 * Get function signature for display
	 * @returns {string} Human-readable function signature
	 */
	getSignature() {
		const asyncPrefix = this.isAsync ? "async " : "";
		const generatorSuffix = this.isGenerator ? "*" : "";
		const paramString = this.parameters.map((p) => p.fullSignature).join(", ");

		if (this.isArrow) {
			return `${asyncPrefix}(${paramString}) => {}`;
		}

		return `${asyncPrefix}function${generatorSuffix} ${this.name}(${paramString})`;
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for function documentation
	 */
	toHTML() {
		const paramTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "param",
		);
		const returnsTag =
			this.getJSDocTag("returns") || this.getJSDocTag("return");
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);

		return html`
			<div class="function-entity" data-type="${this.functionType}">
				<h3>${this.name}</h3>
				<div class="function-meta">
					<span class="function-type">${this.functionType}</span>
					<span class="function-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="function-signature">
					<code>${this.getSignature()}</code>
				</div>
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
					returnsTag
						? html`
					<div class="returns">
						<h4>Returns</h4>
						${returnsTag.toHTML()}
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
	 * @returns {string} Markdown string for function documentation
	 */
	toMarkdown() {
		const paramTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "param",
		);
		const returnsTag =
			this.getJSDocTag("returns") || this.getJSDocTag("return");

		let output = `### ${this.name}\n\n`;
		output += `**Type:** ${this.functionType}\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;
		output += `**Signature:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		if (paramTags.length > 0) {
			output += `**Parameters:**\n\n`;
			output += `${paramTags.map((tag) => tag.toMarkdown()).join("\n")}\n\n`;
		}

		if (returnsTag) {
			output += `${returnsTag.toMarkdown()}\n\n`;
		}

		return output;
	}
}
