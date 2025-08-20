import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import * as actions from "./index.js";

describe("actions module", () => {
	const expectedExports = [
		// Input functions
		"ask",
		"confirm",
		// Output functions
		"print",
		"success",
		"error",
		"warning",
		"info",
		// Formatting functions
		"bold",
		"italic",
		"dim",
		"underline",
		// Table function
		"table",
		// Internal testing utilities (not part of public API)
		"readlineProvider",
	];

	it("should export all expected action functions", () => {
		// Check individual exports exist
		assert.equal(typeof actions.ask, "function");
		assert.equal(typeof actions.confirm, "function");
		assert.equal(typeof actions.print, "function");
		assert.equal(typeof actions.success, "function");
		assert.equal(typeof actions.error, "function");
		assert.equal(typeof actions.warning, "function");
		assert.equal(typeof actions.info, "function");
		assert.equal(typeof actions.bold, "function");
		assert.equal(typeof actions.italic, "function");
		assert.equal(typeof actions.dim, "function");
		assert.equal(typeof actions.underline, "function");
		assert.equal(typeof actions.table, "function");
	});

	it("should have the correct number of exports", () => {
		const actualExports = Object.keys(actions);
		assert.equal(
			actualExports.length,
			expectedExports.length,
			`Expected ${expectedExports.length} exports, got ${actualExports.length}`,
		);
	});

	describe("function types", () => {
		it("should have async input functions", () => {
			assert.equal(actions.ask.constructor.name, "AsyncFunction");
			assert.equal(actions.confirm.constructor.name, "AsyncFunction");
		});

		it("should have sync output functions", () => {
			assert.equal(actions.print.constructor.name, "Function");
			assert.equal(actions.success.constructor.name, "Function");
			assert.equal(actions.error.constructor.name, "Function");
			assert.equal(actions.warning.constructor.name, "Function");
			assert.equal(actions.info.constructor.name, "Function");
		});

		it("should have sync formatting functions", () => {
			assert.equal(actions.bold.constructor.name, "Function");
			assert.equal(actions.italic.constructor.name, "Function");
			assert.equal(actions.dim.constructor.name, "Function");
			assert.equal(actions.underline.constructor.name, "Function");
		});

		it("should have sync table function", () => {
			assert.equal(actions.table.constructor.name, "Function");
		});
	});
});
