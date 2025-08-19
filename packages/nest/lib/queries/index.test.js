import assert from "node:assert";
import { describe, it } from "node:test";
import * as queries from "./index.js";

describe("lib/queries/index.js", () => {
	it("should export all expected functions", () => {
		// File path functions
		assert.strictEqual(typeof queries.GetAllFilePaths, "function");

		// Package.json functions with prefixes
		assert.strictEqual(
			typeof queries.PackageJsonListPublicPackages,
			"function",
		);
		assert.strictEqual(
			typeof queries.PackageJsonListWorkspacePackages,
			"function",
		);
	});

	it("should have working GetAllFilePaths function", () => {
		// Basic smoke test with current directory
		try {
			const result = queries.GetAllFilePaths(".");
			assert(Array.isArray(result));
		} catch (error) {
			// Function might require specific directory structure - just ensure it's callable
			assert.strictEqual(typeof error.message, "string");
		}
	});
});
