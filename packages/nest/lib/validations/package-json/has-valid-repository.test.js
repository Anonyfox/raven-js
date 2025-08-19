import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidRepository } from "./has-valid-repository.js";

describe("lib/rules/package-json/has-valid-repository.js", () => {
	it("should export HasValidRepository function", () => {
		assert.strictEqual(typeof HasValidRepository, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidRepository("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidRepository(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidRepository("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
