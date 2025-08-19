import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidEngines } from "./has-valid-engines.js";

describe("lib/rules/package-json/has-valid-engines.js", () => {
	it("should export HasValidEngines function", () => {
		assert.strictEqual(typeof HasValidEngines, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidEngines("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidEngines(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidEngines("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
