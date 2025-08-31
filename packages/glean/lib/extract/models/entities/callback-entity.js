/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Callback entity model - surgical callback function documentation
 *
 * Ravens extract JSDoc @callback constructs with precision.
 * Handles callback function type definitions for event handlers,
 * API callbacks, and functional programming patterns.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * JSDoc callback entity implementation
 *
 * **Supported Callback Types:**
 * - Event callbacks: `@callback EventHandler`
 * - API callbacks: `@callback ApiCallback`
 * - Custom callbacks: `@callback CustomCallback`
 * - Async callbacks: `@callback AsyncCallback`
 *
 * **Valid JSDoc Tags:**
 * - `@param` - Parameter definitions
 * - `@returns/@return` - Return value documentation
 * - `@throws/@exception` - Exception documentation
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

		/** @type {boolean} Whether callback is exported */
		this.isExported = false;
		/** @type {boolean} Whether callback is async */
		this.isAsync = false;
		/** @type {Array<Object>} Callback parameters */
		this.parameters = [];
		/** @type {{type: string, description: string}|null} Return type */
		this.returnType = null;
		/** @type {Array<{type: string, description: string}>} Exception types this callback might throw */
		this.throwsTypes = [];
		/** @type {string} Callback signature */
		this.signature = "";
		/** @type {string} Callback usage context */
		this.context = "";
	}

	/**
	 * Parse callback-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Extract callback definition from JSDoc
		this._extractCallbackDefinition(sourceCode);
		this._extractSignature(sourceCode);
		this._analyzeContext(sourceCode);
	}

	/**
	 * Extract callback definition from JSDoc comments
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractCallbackDefinition(sourceCode) {
		// Look for @callback in JSDoc comments
		const callbackMatch = sourceCode.match(
			/@callback\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
		);

		if (callbackMatch) {
			// Name should already be set, but verify it matches
			if (callbackMatch[1] && callbackMatch[1] !== this.name) {
				this.name = callbackMatch[1];
			}
		}

		// Check for export
		this.isExported = /export.*@callback/.test(sourceCode);

		// Check for async context
		this.isAsync = /async|promise|await/i.test(sourceCode);
	}

	/**
	 * Extract callback signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		// Extract the @callback line
		const lines = sourceCode.split("\n");
		const callbackLine = lines.find((line) =>
			line.trim().includes("@callback"),
		);

		if (callbackLine) {
			this.signature = callbackLine.trim().replace(/^\s*\*\s*/, "");
		}
	}

	/**
	 * Analyze callback context and usage
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzeContext(sourceCode) {
		const content = sourceCode.toLowerCase();

		// Determine callback context
		if (content.includes("event") || content.includes("handler")) {
			this.context = "event";
		} else if (content.includes("api") || content.includes("request")) {
			this.context = "api";
		} else if (content.includes("async") || content.includes("promise")) {
			this.context = "async";
		} else if (content.includes("error") || content.includes("success")) {
			this.context = "result";
		} else {
			this.context = "general";
		}
	}

	/**
	 * Add parameter to callback
	 * @param {Object} parameter - Parameter information
	 * @param {string} parameter.name - Parameter name
	 * @param {string} [parameter.type] - Parameter type
	 * @param {string} [parameter.description] - Parameter description
	 * @param {boolean} [parameter.optional] - Whether parameter is optional
	 * @param {string} [parameter.defaultValue] - Default value
	 */
	addParameter(parameter) {
		if (parameter?.name) {
			this.parameters.push({
				name: parameter.name,
				type: parameter.type || "unknown",
				description: parameter.description || "",
				optional: parameter.optional || false,
				defaultValue: parameter.defaultValue || null,
			});
		}
	}

	/**
	 * Set return type
	 * @param {string} returnType - Return type
	 * @param {string} [description] - Return description
	 */
	setReturnType(returnType, description = "") {
		this.returnType = {
			type: returnType,
			description: description,
		};
	}

	/**
	 * Add exception type
	 * @param {string} exceptionType - Exception type
	 * @param {string} [description] - Exception description
	 */
	addThrowsType(exceptionType, description = "") {
		this.throwsTypes.push({
			type: exceptionType,
			description: description,
		});
	}

	/**
	 * Validate callback entity
	 */
	validate() {
		super.validate();

		// Callback-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);

		this.isValidated = this.isValidated && hasValidName;
	}

	/**
	 * Check if JSDoc tag is valid for callbacks
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for callbacks
	 */
	isValidJSDocTag(tagType) {
		const callbackTags = [
			"param",
			"parameter",
			"arg",
			"argument",
			"returns",
			"return",
			"throws",
			"exception",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return callbackTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize callback entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			isExported: this.isExported,
			isAsync: this.isAsync,
			parameters: this.parameters,
			returnType: this.returnType,
			throwsTypes: this.throwsTypes,
			signature: this.signature,
			context: this.context,
		};
	}
}
