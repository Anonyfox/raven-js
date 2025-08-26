/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc throws tag model - exception documentation.
 *
 * Ravens document exceptions with predatory precision.
 * Critical for API contracts and error handling intelligence.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc throws/exception tag implementation
 *
 * **Official JSDoc Tag:** Documents exceptions that functions may throw.
 * **Aliases:** exception tag (both `throws` and `exception` are valid)
 *
 * **Syntax Variants:**
 * - Full: `{ErrorType} Description of when error is thrown`
 * - Type only: `{ErrorType}`
 * - Description only: `Description of error condition`
 *
 * **Raven Design:**
 * - Single-pass exception type extraction
 * - Clean error condition documentation
 * - Critical for defensive programming intelligence
 */
export class JSDocThrowsTag extends JSDocTagBase {
	/**
	 * @type {string} Exception/error type
	 */
	type = "";

	/**
	 * @type {string} Description of when exception is thrown
	 */
	description = "";

	/**
	 * Create throws tag instance
	 * @param {string} rawContent - Raw throws tag content
	 */
	constructor(rawContent) {
		super("throws", rawContent);
	}

	/**
	 * Parse @throws tag content into structured data
	 *
	 * Extracts exception type and throwing conditions with precision.
	 */
	parseContent() {
		// Match pattern: @throws {Type} description or @throws description
		const throwsRegex = /^\s*(?:\{([^}]*)\})?\s*(.*)$/;
		const match = this.rawContent.match(throwsRegex);

		if (!match) {
			this.type = "";
			this.description = "";
			return;
		}

		const [, type, description] = match;

		this.type = type?.trim() || "";
		this.description = description ? description.trim() : "";
	}

	/**
	 * Validate throws tag content
	 *
	 * Ravens require meaningful exception documentation:
	 * either type or description must be present.
	 */
	validate() {
		this.isValidated = Boolean(
			(this.type && this.type.length > 0) ||
				(this.description && this.description.length > 0),
		);
	}
}
