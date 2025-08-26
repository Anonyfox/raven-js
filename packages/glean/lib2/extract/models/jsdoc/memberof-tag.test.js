/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocMemberofTag } from "./memberof-tag.js";

describe("JSDocMemberofTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocMemberofTag("test");
		assert.strictEqual(tag.tagType, "memberof");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should handle class membership", () => {
		const testCases = [
			["MyClass", "MyClass"],
			["User", "User"],
			["DatabaseConnection", "DatabaseConnection"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle namespace membership", () => {
		const testCases = [
			["Utils", "Utils"],
			["API", "API"],
			["Config", "Config"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle nested membership", () => {
		const testCases = [
			["Outer.Inner", "Outer.Inner"],
			["App.Components.Button", "App.Components.Button"],
			["API.v1.Users", "API.v1.Users"],
			["Database.Models.User", "Database.Models.User"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle module membership", () => {
		const testCases = [
			["module:fs", "module:fs"],
			["module:path", "module:path"],
			["module:myModule", "module:myModule"],
			["module:@scope/package", "module:@scope/package"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle complex parent references", () => {
		const testCases = [
			["external:jQuery", "external:jQuery"],
			["event:CustomEvent", "event:CustomEvent"],
			["global", "global"],
			["window", "window"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle scoped package names", () => {
		const testCases = [
			["@scope/package", "@scope/package"],
			["@company/library", "@company/library"],
			["@org/utils", "@org/utils"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, "");
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should trim whitespace", () => {
		const testCases = [
			["  MyClass  ", "MyClass"],
			["\t Utils.Helper \t", "Utils.Helper"],
			["\n module:fs \n", "module:fs"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle special characters", () => {
		const testCases = [
			["Class$Inner", "Class$Inner"],
			["Namespace_Utils", "Namespace_Utils"],
			["API-v2", "API-v2"],
			["Module#method", "Module#method"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["类名", "类名"],
			["Модуль", "Модуль"],
			["Namespace.配置", "Namespace.配置"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle numbers in parent names", () => {
		const testCases = [
			["Version2", "Version2"],
			["API.v1", "API.v1"],
			["Module123", "Module123"],
			["Class2.Method", "Class2.Method"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle deeply nested hierarchies", () => {
		const testCases = [
			["App.Core.Utils.String.Helper", "App.Core.Utils.String.Helper"],
			[
				"Company.Product.Module.Feature.Component",
				"Company.Product.Module.Feature.Component",
			],
			["A.B.C.D.E.F", "A.B.C.D.E.F"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle prototype and static references", () => {
		const testCases = [
			["MyClass.prototype", "MyClass.prototype"],
			["MyClass.static", "MyClass.static"],
			["Class.prototype.method", "Class.prototype.method"],
		];

		testCases.forEach(([input, expected]) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.parent, expected);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should validate correctly based on content", () => {
		const validCases = [
			"MyClass",
			"Utils.Helper",
			"module:fs",
			"@scope/package",
			"Class.prototype",
			" \t Valid \t ", // Whitespace around content
		];

		const invalidCases = ["", "   ", "\t", "\n"];

		validCases.forEach((input) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocMemberofTag(input);
			assert.strictEqual(
				tag.isValidated,
				false,
				`Should be invalid: "${input}"`,
			);
		});
	});
});
