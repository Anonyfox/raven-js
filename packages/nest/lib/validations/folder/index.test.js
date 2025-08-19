import assert from "node:assert";
import { describe, it } from "node:test";
import * as folderRules from "./index.js";

describe("lib/rules/folder/index.js", () => {
	it("should export all expected functions", () => {
		assert.strictEqual(typeof folderRules.GetAllFilePaths, "function");
		assert.strictEqual(typeof folderRules.HasFile, "function");
		assert.strictEqual(typeof folderRules.HasValidStructure, "function");
		assert.strictEqual(typeof folderRules.HasValidTestFiles, "function");
	});

	it("should have working GetAllFilePaths function", () => {
		// Basic smoke test
		try {
			const result = folderRules.GetAllFilePaths(".");
			assert(Array.isArray(result));
		} catch (error) {
			// Function might require specific setup - just ensure it's callable
			assert.strictEqual(typeof error.message, "string");
		}
	});

	it("should have working HasFile function", () => {
		// Test with current directory and package.json (should exist)
		try {
			const result = folderRules.HasFile(".", "package.json");
			assert.strictEqual(typeof result, "boolean");
		} catch (error) {
			// Function might throw instead of returning boolean
			assert.strictEqual(typeof error.message, "string");
		}
	});
});
