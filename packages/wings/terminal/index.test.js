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

	it("should export Terminal class", () => {
		assert.equal(typeof terminal.Terminal, "function");
		assert.equal(terminal.Terminal.name, "Terminal");
	});

	it("should have expected exports from all modules", () => {
		const exports = Object.keys(terminal);
		assert.ok(exports.includes("ArgsToUrl"));
		assert.ok(exports.includes("UrlToArgs"));
		assert.ok(exports.includes("Terminal"));
	});
});
