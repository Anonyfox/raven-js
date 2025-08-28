/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocNamespaceTag } from "./namespace-tag.js";

describe("JSDocNamespaceTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocNamespaceTag("test");
		assert.strictEqual(tag.tagType, "namespace");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle name only", () => {
		const testCases = [
			["Utils", "Utils", ""],
			["API", "API", ""],
			["MyNamespace", "MyNamespace", ""],
			["App", "App", ""],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle name with description", () => {
		const testCases = [
			["Utils Helper utilities", "Utils", "Helper utilities"],
			["API REST API namespace", "API", "REST API namespace"],
			[
				"Config Application configuration",
				"Config",
				"Application configuration",
			],
			[
				"Database Database connection utilities",
				"Database",
				"Database connection utilities",
			],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle names with special characters", () => {
		const testCases = [
			["$Utils", "$Utils", ""],
			["_Private", "_Private", ""],
			["My-Namespace", "My-Namespace", ""],
			["Namespace_v2", "Namespace_v2", ""],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle scoped package names", () => {
		const testCases = [
			["@scope/package", "@scope/package", ""],
			["@company/utils", "@company/utils", ""],
			[
				"@org/library Organizational library",
				"@org/library",
				"Organizational library",
			],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, "");
			assert.strictEqual(tag.description, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should trim whitespace", () => {
		const testCases = [
			["  Utils  ", "Utils", ""],
			["\t API \t", "API", ""],
			["\n Config Configuration options \n", "Config", "Configuration options"],
			["  Namespace  Extra description  ", "Namespace", "Extra description"],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["工具类", "工具类", ""],
			["Модуль", "Модуль", ""],
			["Namespace 配置选项", "Namespace", "配置选项"],
			["类库 Helper utilities library", "类库", "Helper utilities library"],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle numbers in names", () => {
		const testCases = [
			["API2", "API2", ""],
			["Version3", "Version3", ""],
			["Utils123 Helper utilities", "Utils123", "Helper utilities"],
			["MyLib2024", "MyLib2024", ""],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle multiple spaces in description", () => {
		const testCases = [
			["Utils  Multiple   spaces", "Utils", "Multiple   spaces"],
			["API   A   B   C", "API", "A   B   C"],
			// Tabs don't split - indexOf only looks for space character
			["Name\t\tTabbed\t\tdescription", "Name\t\tTabbed\t\tdescription", ""],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle long descriptions", () => {
		const input =
			"Utils This is a very long description that spans multiple words and provides detailed information about the namespace purpose";
		const tag = new JSDocNamespaceTag(input);
		assert.strictEqual(tag.name, "Utils");
		assert.strictEqual(
			tag.description,
			"This is a very long description that spans multiple words and provides detailed information about the namespace purpose",
		);
		assert.strictEqual(tag.isValidated, true);
	});

	it("should handle special characters in descriptions", () => {
		const testCases = [
			[
				"Utils Helper & configuration utilities",
				"Utils",
				"Helper & configuration utilities",
			],
			["API REST API (v2.0)", "API", "REST API (v2.0)"],
			[
				"Config Options: host, port, timeout",
				"Config",
				"Options: host, port, timeout",
			],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle edge cases with spaces", () => {
		const testCases = [
			["Name ", "Name", ""],
			[" Name", "Name", ""],
			["Name  ", "Name", ""],
			["  Name  Description  ", "Name", "Description"],
		];

		testCases.forEach(([input, expectedName, expectedDesc]) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.name, expectedName);
			assert.strictEqual(tag.description, expectedDesc);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should validate correctly based on name content", () => {
		const validCases = [
			"Utils",
			"API",
			"Name Description",
			"@scope/package",
			" \t Valid \t ", // Whitespace around content
		];

		const invalidCases = ["", "   ", "\t", "\n"];

		validCases.forEach((input) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocNamespaceTag(input);
			assert.strictEqual(
				tag.isValidated,
				false,
				`Should be invalid: "${input}"`,
			);
		});
	});
});
