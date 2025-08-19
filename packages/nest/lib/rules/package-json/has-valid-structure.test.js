import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidStructure } from "./has-valid-structure.js";

describe("lib/rules/package-json/has-valid-structure.js", () => {
	it("should export HasValidStructure function", () => {
		assert.strictEqual(typeof HasValidStructure, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidStructure("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidStructure(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidStructure("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
