/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc models index - surgical export aggregation.
 *
 * Ravens organize their arsenal with predatory efficiency.
 * Clean exports for all JSDoc tag models with zero waste.
 */

export { JSDocAliasTag } from "./alias-tag.js";
export { JSDocAuthorTag } from "./author-tag.js";
// Base class
export { JSDocTagBase } from "./base.js";
export { JSDocCallbackTag } from "./callback-tag.js";
// Metadata and lifecycle tags
export { JSDocDeprecatedTag } from "./deprecated-tag.js";
export { JSDocEnumTag } from "./enum-tag.js";
export { JSDocExampleTag } from "./example-tag.js";
// File and authorship tags
export { JSDocFileTag } from "./file-tag.js";
export { JSDocLicenseTag } from "./license-tag.js";
export { JSDocMemberofTag } from "./memberof-tag.js";
// Organization and structure tags
export { JSDocNamespaceTag } from "./namespace-tag.js";
// Essential function documentation tags
export { JSDocParamTag } from "./param-tag.js";
// Access and visibility tags
export { JSDocPrivateTag } from "./private-tag.js";

// Object and type definition tags
export { JSDocPropertyTag } from "./property-tag.js";
export { JSDocProtectedTag } from "./protected-tag.js";
export { JSDocReadonlyTag } from "./readonly-tag.js";
export { JSDocReturnsTag } from "./returns-tag.js";
// Cross-reference and navigation tags
export { JSDocSeeTag } from "./see-tag.js";
export { JSDocSinceTag } from "./since-tag.js";
export { JSDocStaticTag } from "./static-tag.js";
export { JSDocThrowsTag } from "./throws-tag.js";
export { JSDocTypeTag } from "./type-tag.js";
export { JSDocTypedefTag } from "./typedef-tag.js";

import { JSDocAliasTag } from "./alias-tag.js";
import { JSDocAuthorTag } from "./author-tag.js";
import { JSDocCallbackTag } from "./callback-tag.js";
import { JSDocDeprecatedTag } from "./deprecated-tag.js";
import { JSDocEnumTag } from "./enum-tag.js";
import { JSDocExampleTag } from "./example-tag.js";
import { JSDocFileTag } from "./file-tag.js";
import { JSDocLicenseTag } from "./license-tag.js";
import { JSDocMemberofTag } from "./memberof-tag.js";
import { JSDocNamespaceTag } from "./namespace-tag.js";
// Import classes for registry
import { JSDocParamTag } from "./param-tag.js";
import { JSDocPrivateTag } from "./private-tag.js";
import { JSDocPropertyTag } from "./property-tag.js";
import { JSDocProtectedTag } from "./protected-tag.js";
import { JSDocReadonlyTag } from "./readonly-tag.js";
import { JSDocReturnsTag } from "./returns-tag.js";
import { JSDocSeeTag } from "./see-tag.js";
import { JSDocSinceTag } from "./since-tag.js";
import { JSDocStaticTag } from "./static-tag.js";
import { JSDocThrowsTag } from "./throws-tag.js";
import { JSDocTypeTag } from "./type-tag.js";
import { JSDocTypedefTag } from "./typedef-tag.js";

/**
 * Tag registry for dynamic tag creation
 * Maps tag names to their corresponding class constructors
 */
export const TAG_REGISTRY = {
	// Function documentation
	param: JSDocParamTag,
	parameter: JSDocParamTag, // Alias
	arg: JSDocParamTag, // Alias
	argument: JSDocParamTag, // Alias

	returns: JSDocReturnsTag,
	return: JSDocReturnsTag, // Alias

	throws: JSDocThrowsTag,
	exception: JSDocThrowsTag, // Alias

	// Cross-reference and examples
	see: JSDocSeeTag,
	example: JSDocExampleTag,

	// Metadata and lifecycle
	deprecated: JSDocDeprecatedTag,
	since: JSDocSinceTag,
	type: JSDocTypeTag,

	// Access and visibility
	private: JSDocPrivateTag,
	protected: JSDocProtectedTag,
	static: JSDocStaticTag,
	readonly: JSDocReadonlyTag,

	// Object and type definitions
	property: JSDocPropertyTag,
	prop: JSDocPropertyTag, // Alias
	typedef: JSDocTypedefTag,
	enum: JSDocEnumTag,
	callback: JSDocCallbackTag,

	// Organization and structure
	namespace: JSDocNamespaceTag,
	memberof: JSDocMemberofTag,
	alias: JSDocAliasTag,

	// File and authorship
	file: JSDocFileTag,
	fileoverview: JSDocFileTag, // Alias
	overview: JSDocFileTag, // Alias
	author: JSDocAuthorTag,
	license: JSDocLicenseTag,
};

/**
 * Create JSDoc tag instance from tag name and content
 * @param {string} tagName - Tag name (e.g., 'param', 'returns')
 * @param {string} content - Tag content
 * @returns {JSDocTagBase|null} Tag instance or null if unknown tag
 */
export function createTag(tagName, content) {
	const TagClass = TAG_REGISTRY[tagName.toLowerCase()];
	return TagClass ? new TagClass(content) : null;
}

/**
 * Get all supported tag names
 * @returns {Array<string>} List of supported tag names
 */
export function getSupportedTags() {
	return Object.keys(TAG_REGISTRY);
}
