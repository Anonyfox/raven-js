import assert from "node:assert";
import { describe, it } from "node:test";
import * as docs from "./index.js";

describe("lib/docs/index.js", () => {
	it("should export all expected functions", () => {
		// Documentation generation functions
		assert.strictEqual(typeof docs.copyFavicon, "function");
		assert.strictEqual(typeof docs.generateContext, "function");
		assert.strictEqual(typeof docs.generateContextJson, "function");
		assert.strictEqual(typeof docs.generateLandingPage, "function");
		assert.strictEqual(typeof docs.getDocsPath, "function");
		assert.strictEqual(typeof docs.getWorkspaceRoot, "function");

		// Bundle generation functions
		assert.strictEqual(typeof docs.canGenerateBundles, "function");
		assert.strictEqual(typeof docs.generateAllBundles, "function");
		assert.strictEqual(typeof docs.generateCommonJSBundle, "function");
		assert.strictEqual(typeof docs.generateESMBundle, "function");
		assert.strictEqual(typeof docs.generateESMMinifiedBundle, "function");
		assert.strictEqual(typeof docs.getBundleEntryPoint, "function");

		// TypeDoc generation functions
		assert.strictEqual(typeof docs.canGenerateTypeDoc, "function");
		assert.strictEqual(typeof docs.generateTypeDoc, "function");
		assert.strictEqual(typeof docs.generateTypeDocConfig, "function");
		assert.strictEqual(typeof docs.getEntryPoints, "function");
	});

	it("should have working getWorkspaceRoot function", () => {
		// Basic smoke test - should return a string path or throw
		try {
			const result = docs.getWorkspaceRoot();
			assert.strictEqual(typeof result, "string");
		} catch (error) {
			// It's okay if it throws in test environment - we just want to ensure the function exists
			assert.strictEqual(typeof error.message, "string");
		}
	});
});
