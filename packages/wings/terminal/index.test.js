import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import * as terminal from "./index.js";

describe("terminal module", () => {
	const coreExports = ["ArgsToUrl", "UrlToArgs", "Terminal"];
	const actionExports = [
		"ask",
		"confirm",
		"print",
		"success",
		"error",
		"warning",
		"info",
		"bold",
		"italic",
		"dim",
		"underline",
		"table",
	];

	it("should export core functions", () => {
		assert.equal(typeof terminal.ArgsToUrl, "function");
		assert.equal(typeof terminal.UrlToArgs, "function");
		assert.equal(typeof terminal.Terminal, "function");
		assert.equal(terminal.Terminal.name, "Terminal");
	});

	it("should export all action functions", () => {
		// Check action exports exist
		assert.equal(typeof terminal.ask, "function");
		assert.equal(typeof terminal.confirm, "function");
		assert.equal(typeof terminal.print, "function");
		assert.equal(typeof terminal.success, "function");
		assert.equal(typeof terminal.error, "function");
		assert.equal(typeof terminal.warning, "function");
		assert.equal(typeof terminal.info, "function");
		assert.equal(typeof terminal.bold, "function");
		assert.equal(typeof terminal.italic, "function");
		assert.equal(typeof terminal.dim, "function");
		assert.equal(typeof terminal.underline, "function");
		assert.equal(typeof terminal.table, "function");
	});

	it("should have all expected exports", () => {
		const exports = Object.keys(terminal);
		const expectedExports = [...coreExports, ...actionExports];

		for (const expectedExport of expectedExports) {
			assert.ok(
				exports.includes(expectedExport),
				`Missing export: ${expectedExport}`,
			);
		}
	});
});
