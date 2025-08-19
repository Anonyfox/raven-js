import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidHomepage } from "./has-valid-homepage.js";

describe("lib/rules/package-json/has-valid-homepage.js", () => {
	it("should export HasValidHomepage function", () => {
		assert.strictEqual(typeof HasValidHomepage, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidHomepage("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidHomepage(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidHomepage("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
