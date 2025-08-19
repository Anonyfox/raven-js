import assert from "node:assert";
import { describe, it } from "node:test";
import * as rules from "./index.js";

describe("lib/rules/index.js", () => {
	it("should export main validation functions", () => {
		assert.strictEqual(typeof rules.validate, "function");
		assert.strictEqual(typeof rules.validatePackage, "function");
		assert.strictEqual(typeof rules.IsWorkspace, "function");
		assert.strictEqual(typeof rules.ListWorkspacePackages, "function");
	});

	it("should validate function signature", () => {
		// Test input validation
		assert.throws(() => {
			rules.validate("");
		}, /Path must be a non-empty string/);

		assert.throws(() => {
			rules.validate(null);
		}, /Path must be a non-empty string/);
	});

	it("should validatePackage function signature", () => {
		// Test input validation
		assert.throws(() => {
			rules.validatePackage("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			rules.validatePackage(null);
		}, /Package path must be a non-empty string/);
	});

	it("should handle invalid package path", () => {
		// Test with non-existent path
		assert.throws(() => {
			rules.validatePackage("/non/existent/path");
		}, /is not a valid npm package/);
	});
});
