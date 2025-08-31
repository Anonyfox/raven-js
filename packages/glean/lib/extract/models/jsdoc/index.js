/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc tag classes with registry for dynamic tag creation.
 *
 * Exports all JSDoc tag implementations and provides TAG_REGISTRY for
 * runtime tag instantiation by tag name.
 */

export { JSDocAliasTag } from "./alias-tag.js";
export { JSDocAuthorTag } from "./author-tag.js";
// Base class and core tags
export { JSDocTagBase } from "./base.js";
export { JSDocCallbackTag } from "./callback-tag.js";
export { JSDocDeprecatedTag } from "./deprecated-tag.js";
export { JSDocEnumTag } from "./enum-tag.js";
export { JSDocExampleTag } from "./example-tag.js";
// Metadata tags
export { JSDocFileTag } from "./file-tag.js";
export { JSDocLicenseTag } from "./license-tag.js";
export { JSDocMemberofTag } from "./memberof-tag.js";
// Organization tags
export { JSDocNamespaceTag } from "./namespace-tag.js";
export { JSDocParamTag } from "./param-tag.js";
// Access and visibility tags
export { JSDocPrivateTag } from "./private-tag.js";
export { JSDocPropertyTag } from "./property-tag.js";
export { JSDocProtectedTag } from "./protected-tag.js";
export { JSDocReadonlyTag } from "./readonly-tag.js";
export { JSDocReturnsTag } from "./returns-tag.js";
export { JSDocSeeTag } from "./see-tag.js";
export { JSDocSinceTag } from "./since-tag.js";
export { JSDocStaticTag } from "./static-tag.js";
export { JSDocThrowsTag } from "./throws-tag.js";
// Type and definition tags
export { JSDocTypeTag } from "./type-tag.js";
export { JSDocTypedefTag } from "./typedef-tag.js";

// Import classes for registry construction
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
 * Tag registry for dynamic tag instantiation by name.
 *
 * Maps tag names (including aliases) to their corresponding class constructors
 * for runtime tag creation from JSDoc comment parsing.
 *
 * @type {Record<string, new(content: string) => import('./base.js').JSDocTagBase>}
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
 * @returns {import('./base.js').JSDocTagBase|null} Tag instance or null if unknown tag
 */
export function createTag(tagName, content) {
	/** @type {any} */
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
