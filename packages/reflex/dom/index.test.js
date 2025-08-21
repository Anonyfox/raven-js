import assert from "node:assert";
import { describe, it } from "node:test";
import * as dom from "./index.js";

describe("dom/index.js", () => {
	it("should export all expected functions", () => {
		// DOM utility functions
		assert.strictEqual(typeof dom.mount, "function");
	});

	it("should throw not implemented errors for placeholders", () => {
		// Placeholder implementations should throw
		assert.throws(() => dom.mount(), /Not implemented yet/);
	});
});
