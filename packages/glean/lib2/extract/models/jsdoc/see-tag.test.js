/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocSeeTag } from "./see-tag.js";

describe("JSDocSeeTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocSeeTag("test");
		assert.strictEqual(tag.tagType, "see");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle URL references", () => {
		const testCases = [
			[
				"https://example.com",
				"url",
				"https://example.com",
				"",
				"https://example.com",
			],
			[
				"http://example.com",
				"url",
				"http://example.com",
				"",
				"http://example.com",
			],
			[
				"https://github.com/user/repo",
				"url",
				"https://github.com/user/repo",
				"",
				"https://github.com/user/repo",
			],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle link syntax with URL", () => {
		const testCases = [
			[
				"{@link https://example.com}",
				"link",
				"https://example.com",
				"",
				"https://example.com",
			],
			[
				"{link https://github.com}",
				"link",
				"https://github.com",
				"",
				"https://github.com",
			],
			[
				"{@link https://docs.com|Documentation}",
				"link",
				"https://docs.com",
				"Documentation",
				"https://docs.com",
			],
			[
				"{link http://api.example.com|API Docs}",
				"link",
				"http://api.example.com",
				"API Docs",
				"http://api.example.com",
			],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle link syntax with symbols", () => {
		const testCases = [
			["{@link MyClass}", "link", "MyClass", "", ""],
			["{link MyFunction}", "link", "MyFunction", "", ""],
			[
				"{@link MyClass.method|Method description}",
				"link",
				"MyClass.method",
				"Method description",
				"",
			],
			[
				"{link utils.helper|Helper function}",
				"link",
				"utils.helper",
				"Helper function",
				"",
			],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle symbol references", () => {
		const testCases = [
			["MyClass", "symbol", "MyClass", "", ""],
			["MyFunction", "symbol", "MyFunction", "", ""],
			["MyClass.method", "symbol", "MyClass.method", "", ""],
			["module.exports", "symbol", "module.exports", "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle module references", () => {
		const testCases = [
			["module:fs", "module", "module:fs", "", ""],
			["module:path", "module", "module:path", "", ""],
			["module:my-custom-module", "module", "module:my-custom-module", "", ""],
			["module:@scope/package", "module", "module:@scope/package", "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle quoted text references", () => {
		const testCases = [
			['"Some documentation"', "text", "Some documentation", "", ""],
			["'API Reference'", "text", "API Reference", "", ""],
			['"User Guide Chapter 5"', "text", "User Guide Chapter 5", "", ""],
			[
				"'Error Handling Best Practices'",
				"text",
				"Error Handling Best Practices",
				"",
				"",
			],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocSeeTag(input);
			assert.strictEqual(tag.referenceType, "empty");
			assert.strictEqual(tag.reference, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.url, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocSeeTag(input);
			assert.strictEqual(tag.referenceType, "empty");
			assert.strictEqual(tag.reference, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.url, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle malformed link syntax", () => {
		const testCases = [
			["{@link unclosed", "symbol", "{@link unclosed", "", ""],
			["@link without braces", "symbol", "@link without braces", "", ""],
			["{link}", "symbol", "{link}", "", ""],
			// {link   } matches the link regex because \s+ matches whitespace
			["{@link   }", "link", "", "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, expectedRef.length > 0);
			},
		);
	});

	it("should handle edge cases with quotes", () => {
		const testCases = [
			["'unclosed quote", "symbol", "'unclosed quote", "", ""],
			['"unclosed quote', "symbol", '"unclosed quote', "", ""],
			// Empty quotes don't match (.+) regex, fall back to symbol
			["''", "symbol", "''", "", ""],
			['""', "symbol", '""', "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, expectedRef.length > 0);
			},
		);
	});

	it("should handle special characters in references", () => {
		const testCases = [
			["MyClass#method", "symbol", "MyClass#method", "", ""],
			["MyClass~staticMethod", "symbol", "MyClass~staticMethod", "", ""],
			[
				"MyClass.prototype.method",
				"symbol",
				"MyClass.prototype.method",
				"",
				"",
			],
			["@scope/package.Class", "symbol", "@scope/package.Class", "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["类名", "symbol", "类名", "", ""],
			["Модуль", "symbol", "Модуль", "", ""],
			[
				"{@link https://example.com|文档}",
				"link",
				"https://example.com",
				"文档",
				"https://example.com",
			],
			['"Документация"', "text", "Документация", "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle complex URLs", () => {
		const testCases = [
			[
				"https://example.com/path?query=value#fragment",
				"url",
				"https://example.com/path?query=value#fragment",
				"",
				"https://example.com/path?query=value#fragment",
			],
			[
				"http://localhost:3000/api/v1/users",
				"url",
				"http://localhost:3000/api/v1/users",
				"",
				"http://localhost:3000/api/v1/users",
			],
			[
				"https://api.github.com/repos/user/repo/issues",
				"url",
				"https://api.github.com/repos/user/repo/issues",
				"",
				"https://api.github.com/repos/user/repo/issues",
			],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle whitespace trimming", () => {
		const testCases = [
			["  MyClass  ", "symbol", "MyClass", "", ""],
			[
				"\t{@link https://example.com}\t",
				"link",
				"https://example.com",
				"",
				"https://example.com",
			],
			["\n  module:fs  \n", "module", "module:fs", "", ""],
			["   'Text Reference'   ", "text", "Text Reference", "", ""],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should handle link descriptions with special characters", () => {
		const testCases = [
			[
				"{@link MyClass|Class & Method}",
				"link",
				"MyClass",
				"Class & Method",
				"",
			],
			[
				"{link https://example.com|API (v2.0)}",
				"link",
				"https://example.com",
				"API (v2.0)",
				"https://example.com",
			],
			[
				"{@link MyModule|Module: utilities & helpers}",
				"link",
				"MyModule",
				"Module: utilities & helpers",
				"",
			],
		];

		testCases.forEach(
			([input, expectedType, expectedRef, expectedDesc, expectedUrl]) => {
				const tag = new JSDocSeeTag(input);
				assert.strictEqual(tag.referenceType, expectedType);
				assert.strictEqual(tag.reference, expectedRef);
				assert.strictEqual(tag.description, expectedDesc);
				assert.strictEqual(tag.url, expectedUrl);
				assert.strictEqual(tag.isValidated, true);
			},
		);
	});

	it("should validate correctly based on reference content", () => {
		const validCases = [
			"MyClass",
			"https://example.com",
			"{@link MyFunction}",
			"module:fs",
			'"Text Reference"',
			" \t MySymbol \t ", // Whitespace around content
		];

		const invalidCases = ["", "   ", "\t", "\n"];

		validCases.forEach((input) => {
			const tag = new JSDocSeeTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocSeeTag(input);
			assert.strictEqual(
				tag.isValidated,
				false,
				`Should be invalid: "${input}"`,
			);
		});
	});

	it("should identify URLs correctly", () => {
		const tag = new JSDocSeeTag("");

		const validUrls = [
			"https://example.com",
			"http://example.com",
			"https://api.github.com/repos",
			"http://localhost:3000",
		];

		const invalidUrls = [
			"ftp://example.com",
			"mailto:test@example.com",
			"file://path/to/file",
			"MyClass",
			"module:fs",
		];

		validUrls.forEach((url) => {
			assert.strictEqual(tag.isUrl(url), true, `Should be valid URL: "${url}"`);
		});

		invalidUrls.forEach((url) => {
			assert.strictEqual(
				tag.isUrl(url),
				false,
				`Should not be valid URL: "${url}"`,
			);
		});
	});
});
