import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import * as terminal from "./index.js";

describe("terminal module", () => {
	it("should export ArgsToUrl function", () => {
		assert.equal(typeof terminal.ArgsToUrl, "function");
	});

	it("should export UrlToArgs function", () => {
		assert.equal(typeof terminal.UrlToArgs, "function");
	});

	it("should have expected exports from transform-pattern", () => {
		const exports = Object.keys(terminal);
		assert.ok(exports.includes("ArgsToUrl"));
		assert.ok(exports.includes("UrlToArgs"));
	});
});
