import assert from "node:assert";
import { describe, it } from "node:test";
import * as glean from "./index.js";

describe("index.js", () => {
	it("should export all expected functions", () => {
		// Core functions
		assert.strictEqual(typeof glean.getVersion, "function");
		assert.strictEqual(typeof glean.showBanner, "function");
		assert.strictEqual(typeof glean.parseArguments, "function");
		assert.strictEqual(typeof glean.processCodebase, "function");
	});

	it("should return correct version", () => {
		const version = glean.getVersion();
		assert.strictEqual(typeof version, "string");
		assert.strictEqual(version, "0.1.0");
	});

	it("should display banner without errors", () => {
		// We can't easily test console output, but we can ensure it doesn't throw
		assert.doesNotThrow(() => {
			glean.showBanner();
		});
	});

	it("should parse arguments correctly", () => {
		// Test default arguments
		const defaultArgs = glean.parseArguments([]);
		assert.strictEqual(defaultArgs.target, ".");
		assert.strictEqual(defaultArgs.format, "html");
		assert.strictEqual(defaultArgs.validate, true);
		assert.strictEqual(defaultArgs.verbose, false);

		// Test custom target
		const customTargetArgs = glean.parseArguments(["./src"]);
		assert.strictEqual(customTargetArgs.target, "./src");

		// Test verbose flag
		const verboseArgs = glean.parseArguments(["--verbose"]);
		assert.strictEqual(verboseArgs.verbose, true);

		const verboseShortArgs = glean.parseArguments(["-v"]);
		assert.strictEqual(verboseShortArgs.verbose, true);
	});

	it("should process codebase without errors", async () => {
		const options = {
			target: ".",
			format: "html",
			validate: true,
			verbose: false,
		};

		// Should not throw
		await assert.doesNotReject(async () => {
			await glean.processCodebase(options);
		});
	});
});
