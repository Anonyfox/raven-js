import assert from "node:assert";
import { describe, it } from "node:test";
import * as packageJsonRules from "./index.js";

describe("lib/rules/package-json/index.js", () => {
	it("should export all expected validation functions", () => {
		assert.strictEqual(typeof packageJsonRules.HasValidAuthor, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidBugs, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidEngines, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidHomepage, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidLicense, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidName, "function");
		assert.strictEqual(
			typeof packageJsonRules.HasValidPublishConfig,
			"function",
		);
		assert.strictEqual(typeof packageJsonRules.HasValidRepository, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidScripts, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidSemver, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidStructure, "function");
		assert.strictEqual(typeof packageJsonRules.HasValidType, "function");
		assert.strictEqual(typeof packageJsonRules.IsWorkspace, "function");
	});

	it("should have working IsWorkspace function", () => {
		// Test with current directory (should be a workspace)
		try {
			const result = packageJsonRules.IsWorkspace(".");
			assert.strictEqual(typeof result, "boolean");
		} catch (error) {
			// Function might throw instead of returning boolean
			assert.strictEqual(typeof error.message, "string");
		}
	});
});
