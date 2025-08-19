import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidType } from "./has-valid-type.js";

describe("lib/rules/package-json/has-valid-type.js", () => {
	it("should export HasValidType function", () => {
		assert.strictEqual(typeof HasValidType, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidType("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidType(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidType("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
