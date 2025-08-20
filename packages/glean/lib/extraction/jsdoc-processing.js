/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc comment processing for documentation extraction.
 *
 * Surgical parsing of JSDoc comments into structured format with
 * comprehensive tag support and graceful error handling.
 */

/**
 * Parse JSDoc comment to structured format
 * @param {any} jsDocComment - JSDoc comment object
 * @returns {StructuredJSDoc} Structured JSDoc data
 */
export function parseJSDocToStructured(jsDocComment) {
	const structured = {
		description: jsDocComment.description,
		tags: /** @type {any} */ ({}),
	};

	// Process tags into structured format
	for (const [tagName, tagValues] of Object.entries(jsDocComment.tags)) {
		if (tagName === "param") {
			structured.tags.param = tagValues.map(parseParamTag);
		} else if (tagName === "returns" || tagName === "return") {
			structured.tags.returns = parseReturnTag(tagValues[0]);
		} else {
			structured.tags[tagName] = tagValues;
		}
	}

	return structured;
}

/**
 * Parse @param tag content
 * @param {string} paramTag - @param tag content
 * @returns {ParamTag} Parsed param tag
 */
export function parseParamTag(paramTag) {
	// Match: {type} name - description
	const match = paramTag.match(/^\{([^}]+)\}\s*(\w+)\s*-?\s*(.*)/);

	if (match) {
		return {
			type: match[1],
			name: match[2],
			description: match[3].trim(),
		};
	}

	// Fallback for malformed param tags
	return {
		type: "any",
		name: "unknown",
		description: paramTag,
	};
}

/**
 * Parse return tag content
 * @param {string} returnTag - Return tag content
 * @returns {ReturnTag} Parsed return tag
 */
export function parseReturnTag(returnTag) {
	// Match: {type} description
	const match = returnTag.match(/^\{([^}]+)\}\s*(.*)/);

	if (match) {
		return {
			type: match[1],
			description: match[2].trim(),
		};
	}

	// Fallback
	return {
		type: "any",
		description: returnTag,
	};
}

/**
 * @typedef {Object} StructuredJSDoc
 * @property {string} description - Main description
 * @property {Object} tags - Structured JSDoc tags
 */

/**
 * @typedef {Object} ParamTag
 * @property {string} type - Parameter type
 * @property {string} name - Parameter name
 * @property {string} description - Parameter description
 */

/**
 * @typedef {Object} ReturnTag
 * @property {string} type - Return type
 * @property {string} description - Return description
 */
