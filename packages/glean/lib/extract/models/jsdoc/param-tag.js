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
 * JSDoc param tag implementation for function parameter documentation.
 *
 * Parses comprehensive @param syntax including optional parameters, defaults, types, and descriptions.
 * Single-pass regex parsing with structured data extraction only.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocParamTag('{string} name User name parameter');
 * console.log(tag.name, tag.type, tag.description);
 *
 * @example
 * // Optional parameter with default
 * const tag = new JSDocParamTag('{number} [timeout=5000] Request timeout');
 * console.log(tag.optional, tag.defaultValue);
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
			this.type = "";
			this.name = "";
			this.optional = false;
			this.defaultValue = "";
			this.description = "";
			return;
		}

		const [, type, bracketedName, simpleName, description] = match;

		this.type = type || "";
		this.description = description ? description.trim() : "";

		// Handle bracketed parameters (optional with possible default)
		if (bracketedName) {
			this.optional = true;
			const defaultMatch = bracketedName.match(/^([^=]+)(?:=(.*))?$/);
			if (defaultMatch) {
				this.name = defaultMatch[1].trim();
				this.defaultValue = defaultMatch[2] ? defaultMatch[2].trim() : "";
			} else {
				this.name = bracketedName.trim();
				this.defaultValue = "";
			}
		} else {
			this.name = simpleName || "";
			this.optional = false;
			this.defaultValue = "";
		}
	}

	/**
	 * Validate @param tag content - requires parameter name at minimum
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
