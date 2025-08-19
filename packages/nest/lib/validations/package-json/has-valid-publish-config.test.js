import assert from "node:assert";
import { describe, it } from "node:test";
import { HasValidPublishConfig } from "./has-valid-publish-config.js";

describe("lib/rules/package-json/has-valid-publish-config.js", () => {
	it("should export HasValidPublishConfig function", () => {
		assert.strictEqual(typeof HasValidPublishConfig, "function");
	});

	it("should throw error for invalid input", () => {
		assert.throws(() => {
			HasValidPublishConfig("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			HasValidPublishConfig(null);
		}, /Package path must be a non-empty string/);
	});

	it("should throw error for non-existent package.json", () => {
		assert.throws(() => {
			HasValidPublishConfig("/non/existent/path");
		}, /Cannot read package\.json/);
	});
});
