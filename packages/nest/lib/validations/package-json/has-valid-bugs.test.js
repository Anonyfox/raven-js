import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidBugs } from "./has-valid-bugs.js";

describe("lib/rules/package-json/has-valid-bugs.js", () => {
	it("should export HasValidBugs function", () => {
		assert.strictEqual(typeof HasValidBugs, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidBugs("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidBugs(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidBugs("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
