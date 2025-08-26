/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
// Import all classes individually to test exports
import {
	createTag,
	getSupportedTags,
	JSDocAliasTag,
	JSDocAuthorTag,
	JSDocCallbackTag,
	JSDocDeprecatedTag,
	JSDocEnumTag,
	JSDocExampleTag,
	JSDocFileTag,
	JSDocLicenseTag,
	JSDocMemberofTag,
	JSDocNamespaceTag,
	JSDocParamTag,
	JSDocPrivateTag,
	JSDocPropertyTag,
	JSDocProtectedTag,
	JSDocReadonlyTag,
	JSDocReturnsTag,
	JSDocSeeTag,
	JSDocSinceTag,
	JSDocStaticTag,
	JSDocTagBase,
	JSDocThrowsTag,
	JSDocTypedefTag,
	JSDocTypeTag,
	TAG_REGISTRY,
} from "./index.js";

describe("JSDoc models index functionality", () => {
	it("should export all JSDoc tag classes", () => {
		// Test that all expected classes are exported and are constructors
		const expectedClasses = [
			JSDocTagBase,
			JSDocAliasTag,
			JSDocAuthorTag,
			JSDocCallbackTag,
			JSDocDeprecatedTag,
			JSDocEnumTag,
			JSDocExampleTag,
			JSDocFileTag,
			JSDocLicenseTag,
			JSDocMemberofTag,
			JSDocNamespaceTag,
			JSDocParamTag,
			JSDocPrivateTag,
			JSDocPropertyTag,
			JSDocProtectedTag,
			JSDocReadonlyTag,
			JSDocReturnsTag,
			JSDocSeeTag,
			JSDocSinceTag,
			JSDocStaticTag,
			JSDocThrowsTag,
			JSDocTypeTag,
			JSDocTypedefTag,
		];

		expectedClasses.forEach((TagClass) => {
			assert.strictEqual(
				typeof TagClass,
				"function",
				`${TagClass.name} should be a constructor function`,
			);
			assert.strictEqual(
				TagClass.prototype.constructor,
				TagClass,
				`${TagClass.name} should have correct prototype`,
			);
		});
	});

	it("should export TAG_REGISTRY with all expected mappings", () => {
		assert.strictEqual(typeof TAG_REGISTRY, "object");
		assert.notStrictEqual(TAG_REGISTRY, null);

		// Test main tag mappings
		const expectedMappings = {
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

		Object.entries(expectedMappings).forEach(([tagName, expectedClass]) => {
			assert.strictEqual(
				TAG_REGISTRY[tagName],
				expectedClass,
				`TAG_REGISTRY should map ${tagName} to ${expectedClass.name}`,
			);
		});
	});

	it("should export createTag function", () => {
		assert.strictEqual(typeof createTag, "function");
		assert.strictEqual(createTag.length, 2); // Should accept 2 parameters
	});

	it("should export getSupportedTags function", () => {
		assert.strictEqual(typeof getSupportedTags, "function");
		assert.strictEqual(getSupportedTags.length, 0); // Should accept 0 parameters
	});

	it("should create tag instances with createTag function", () => {
		const testCases = [
			["param", JSDocParamTag],
			["returns", JSDocReturnsTag],
			["see", JSDocSeeTag],
			["private", JSDocPrivateTag],
			["typedef", JSDocTypedefTag],
		];

		testCases.forEach(([tagName, expectedClass]) => {
			const tag = createTag(tagName, "test content");
			assert.ok(
				tag instanceof expectedClass,
				`createTag('${tagName}') should return ${expectedClass.name} instance`,
			);
			assert.strictEqual(tag.tagType, tagName);
			assert.strictEqual(tag.rawContent, "test content");
		});
	});

	it("should handle case insensitive tag names", () => {
		const testCases = [
			["PARAM", JSDocParamTag],
			["Returns", JSDocReturnsTag],
			["SEE", JSDocSeeTag],
			["Private", JSDocPrivateTag],
			["TYPEDEF", JSDocTypedefTag],
		];

		testCases.forEach(([tagName, expectedClass]) => {
			const tag = createTag(tagName, "test content");
			assert.ok(
				tag instanceof expectedClass,
				`createTag('${tagName}') should return ${expectedClass.name} instance`,
			);
		});
	});

	it("should handle tag aliases correctly", () => {
		const testCases = [
			// Function documentation aliases
			["parameter", JSDocParamTag],
			["arg", JSDocParamTag],
			["argument", JSDocParamTag],
			["return", JSDocReturnsTag],
			["exception", JSDocThrowsTag],

			// Object and type definition aliases
			["prop", JSDocPropertyTag],

			// File and authorship aliases
			["fileoverview", JSDocFileTag],
			["overview", JSDocFileTag],
		];

		testCases.forEach(([alias, expectedClass]) => {
			const tag = createTag(alias, "test content");
			assert.ok(
				tag instanceof expectedClass,
				`createTag('${alias}') should return ${expectedClass.name} instance`,
			);
		});
	});

	it("should return null for unknown tag names", () => {
		const unknownTags = [
			"unknown",
			"invalid",
			"notreal",
			"fake",
			"",
			"123",
			"@param", // Should not include @ symbol
		];

		unknownTags.forEach((tagName) => {
			const tag = createTag(tagName, "test content");
			assert.strictEqual(
				tag,
				null,
				`createTag('${tagName}') should return null for unknown tag`,
			);
		});
	});

	it("should handle empty and invalid content", () => {
		const testCases = [
			["param", "", ""],
			["returns", null, ""], // null gets converted to empty string
			["see", undefined, ""], // undefined gets converted to empty string
			["private", "   ", "   "],
		];

		testCases.forEach(([tagName, content, expectedContent]) => {
			const tag = createTag(tagName, content);
			assert.ok(
				tag instanceof TAG_REGISTRY[tagName],
				`createTag should handle content: ${content}`,
			);
			assert.strictEqual(tag.rawContent, expectedContent);
		});
	});

	it("should return all supported tags with getSupportedTags", () => {
		const supportedTags = getSupportedTags();

		// Should be an array
		assert.ok(Array.isArray(supportedTags));

		// Should contain expected number of tags (including aliases)
		assert.ok(supportedTags.length >= 23); // At least 23 unique tag classes

		// Should include main tags
		const expectedMainTags = [
			"param",
			"returns",
			"throws",
			"see",
			"example",
			"deprecated",
			"since",
			"type",
			"private",
			"protected",
			"static",
			"readonly",
			"property",
			"typedef",
			"enum",
			"callback",
			"namespace",
			"memberof",
			"alias",
			"file",
			"author",
			"license",
		];

		expectedMainTags.forEach((tagName) => {
			assert.ok(
				supportedTags.includes(tagName),
				`getSupportedTags should include ${tagName}`,
			);
		});

		// Should include aliases
		const expectedAliases = [
			"parameter",
			"arg",
			"argument",
			"return",
			"exception",
			"prop",
			"fileoverview",
			"overview",
		];

		expectedAliases.forEach((alias) => {
			assert.ok(
				supportedTags.includes(alias),
				`getSupportedTags should include alias ${alias}`,
			);
		});
	});

	it("should maintain consistency between TAG_REGISTRY and getSupportedTags", () => {
		const supportedTags = getSupportedTags();
		const registryKeys = Object.keys(TAG_REGISTRY);

		// Should have same length
		assert.strictEqual(supportedTags.length, registryKeys.length);

		// Should contain same tags
		registryKeys.forEach((key) => {
			assert.ok(
				supportedTags.includes(key),
				`getSupportedTags should include all TAG_REGISTRY keys: ${key}`,
			);
		});

		supportedTags.forEach((tag) => {
			assert.ok(
				registryKeys.includes(tag),
				`TAG_REGISTRY should include all getSupportedTags results: ${tag}`,
			);
		});
	});

	it("should handle tag creation with complex content", () => {
		const complexTestCases = [
			["param", "{string} name User name parameter"],
			["returns", "{Promise<User>} User object promise"],
			["see", "{@link https://example.com|Documentation}"],
			["example", "<caption>Usage</caption> console.log('hello')"],
			["typedef", "{Object<string, number>} ScoreMap"],
		];

		complexTestCases.forEach(([tagName, content]) => {
			const tag = createTag(tagName, content);
			assert.ok(tag instanceof TAG_REGISTRY[tagName]);
			assert.strictEqual(tag.rawContent, content);
			// Tag should be properly parsed
			assert.ok(tag.isValidated !== undefined);
		});
	});

	it("should validate tag instances are properly constructed", () => {
		const allTags = Object.keys(TAG_REGISTRY);

		allTags.forEach((tagName) => {
			const tag = createTag(tagName, "test content");

			// Should be instance of correct class
			assert.ok(tag instanceof TAG_REGISTRY[tagName]);

			// Should inherit from JSDocTagBase
			assert.ok(tag instanceof JSDocTagBase);

			// Should have basic properties
			assert.strictEqual(typeof tag.tagType, "string");
			assert.strictEqual(typeof tag.rawContent, "string");
			assert.strictEqual(typeof tag.isValidated, "boolean");

			// Should have methods from base class
			assert.strictEqual(typeof tag.parseContent, "function");
			assert.strictEqual(typeof tag.validate, "function");
		});
	});

	it("should handle edge cases in createTag", () => {
		// Test with special characters in content
		const edgeCases = [
			["param", "content with\nnewlines"],
			["returns", "content with\ttabs"],
			["see", "content with 中文 unicode"],
			["type", "content with émojis 🚀"],
			["example", "content with <script>alert('xss')</script>"],
		];

		edgeCases.forEach(([tagName, content]) => {
			const tag = createTag(tagName, content);
			assert.ok(tag instanceof TAG_REGISTRY[tagName]);
			assert.strictEqual(tag.rawContent, content);
		});
	});

	it("should validate TAG_REGISTRY completeness", () => {
		// All classes should be represented in the registry
		const classesToCheck = [
			JSDocAliasTag,
			JSDocAuthorTag,
			JSDocCallbackTag,
			JSDocDeprecatedTag,
			JSDocEnumTag,
			JSDocExampleTag,
			JSDocFileTag,
			JSDocLicenseTag,
			JSDocMemberofTag,
			JSDocNamespaceTag,
			JSDocParamTag,
			JSDocPrivateTag,
			JSDocPropertyTag,
			JSDocProtectedTag,
			JSDocReadonlyTag,
			JSDocReturnsTag,
			JSDocSeeTag,
			JSDocSinceTag,
			JSDocStaticTag,
			JSDocThrowsTag,
			JSDocTypeTag,
			JSDocTypedefTag,
		];

		const registryClasses = Object.values(TAG_REGISTRY);

		classesToCheck.forEach((TagClass) => {
			assert.ok(
				registryClasses.includes(TagClass),
				`TAG_REGISTRY should include ${TagClass.name}`,
			);
		});
	});
});
