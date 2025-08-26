/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc param tag model - surgical parameter documentation.
 *
 * Ravens dissect function parameters with predatory precision.
 * Parses complex parameter syntax including types, optional parameters,
 * default values, and comprehensive validation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc param tag implementation
 *
 * **Official JSDoc Tag:** Documents function parameters with comprehensive syntax support.
 *
 * **Syntax Variants:**
 * - Basic: `{Type} paramName Description of parameter`
 * - Optional: `{Type} [paramName] Optional parameter`
 * - With default: `{Type} [paramName=defaultValue] Parameter with default`
 * - Type only: `{Type} paramName`
 * - Name only: `paramName Description`
 *
 * **Raven Design:**
 * - Single-pass parsing with V8-optimized regex
 * - Structured data extraction only
 * - Zero rendering dependencies
 */
export class JSDocParamTag extends JSDocTagBase {
	/**
	 * Create @param tag instance
	 * @param {string} rawContent - Raw @param content
	 */
	constructor(rawContent) {
		super("param", rawContent);
	}

	/**
	 * Parse @param tag content into structured data
	 *
	 * Extracts type, name, optional status, default value, and description
	 * from various @param syntax forms with surgical precision.
	 */
	parseContent() {
		// Match pattern: @param {type} [name=default] description
		const paramRegex =
			/^\s*(?:\{([^}]+)\})?\s*(?:\[([^\]]+)\]|(\w+))?\s*(.*)?$/;
		const match = this.rawContent.match(paramRegex);

		if (!match) {
			/**
			 * @type {string} Parameter type annotation
			 */
			this.type = "";
			/**
			 * @type {string} Parameter name
			 */
			this.name = "";
			/**
			 * @type {boolean} Whether parameter is optional
			 */
			this.optional = false;
			/**
			 * @type {string} Default value if optional
			 */
			this.defaultValue = "";
			/**
			 * @type {string} Parameter description
			 */
			this.description = "";
			return;
		}

		const [, type, bracketedName, simpleName, description] = match;

		/**
		 * @type {string} Parameter type annotation
		 */
		this.type = type || "";
		/**
		 * @type {string} Parameter description
		 */
		this.description = description ? description.trim() : "";

		// Handle bracketed parameters (optional with possible default)
		if (bracketedName) {
			/**
			 * @type {boolean} Whether parameter is optional
			 */
			this.optional = true;
			const defaultMatch = bracketedName.match(/^([^=]+)(?:=(.*))?$/);
			if (defaultMatch) {
				/**
				 * @type {string} Parameter name
				 */
				this.name = defaultMatch[1].trim();
				/**
				 * @type {string} Default value if optional
				 */
				this.defaultValue = defaultMatch[2] ? defaultMatch[2].trim() : "";
			} else {
				/**
				 * @type {string} Parameter name
				 */
				this.name = bracketedName.trim();
				/**
				 * @type {string} Default value if optional
				 */
				this.defaultValue = "";
			}
		} else {
			/**
			 * @type {string} Parameter name
			 */
			this.name = simpleName || "";
			/**
			 * @type {boolean} Whether parameter is optional
			 */
			this.optional = false;
			/**
			 * @type {string} Default value if optional
			 */
			this.defaultValue = "";
		}
	}

	/**
	 * Validate @param tag content
	 *
	 * Ravens demand precision: valid @param tags must have
	 * at minimum a parameter name.
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
