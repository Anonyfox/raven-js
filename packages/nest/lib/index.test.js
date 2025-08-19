import assert from "node:assert";
import { describe, it } from "node:test";
import * as nestLib from "./index.js";

describe("lib/index.js", () => {
	it("should export all expected functions", () => {
		// Core functions
		assert.strictEqual(typeof nestLib.getVersion, "function");
		assert.strictEqual(typeof nestLib.showBanner, "function");

		// Docs exports (from docs/index.js)
		assert.strictEqual(typeof nestLib.copyFavicon, "function");
		assert.strictEqual(typeof nestLib.generateContext, "function");
		assert.strictEqual(typeof nestLib.generateLandingPage, "function");

		// Semver exports (from semver/index.js)
		assert.strictEqual(typeof nestLib.bumpVersion, "function");
		assert.strictEqual(typeof nestLib.updatePackageVersions, "function");
	});

	it("should return correct version", () => {
		const version = nestLib.getVersion();
		assert.strictEqual(typeof version, "string");
		assert.strictEqual(version, "0.1.0");
	});

	it("should display banner without errors", () => {
		// We can't easily test console output, but we can ensure it doesn't throw
		assert.doesNotThrow(() => {
			nestLib.showBanner();
		});
	});
});
