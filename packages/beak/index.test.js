import assert from "node:assert";
import { describe, it } from "node:test";
import * as core from "./index.js";

describe("core/index.js", () => {
	it("should export all expected functions", () => {
		// CSS exports
		assert.strictEqual(typeof core.css, "function");

		// HTML exports
		assert.strictEqual(typeof core.html, "function");

		// JS exports
		assert.strictEqual(typeof core.js, "function");

		// MD export (named export, not default)
		assert.strictEqual(typeof core.md, "function");

		// SQL exports
		assert.strictEqual(typeof core.sql, "function");
	});

	it("should have working template functions", () => {
		// Basic functionality test for each exported function
		const htmlResult = core.html`<p>test</p>`;
		assert.strictEqual(typeof htmlResult, "string");
		assert(htmlResult.includes("test"));

		const cssResult = core.css`body { color: red; }`;
		assert.strictEqual(typeof cssResult, "string");
		assert(cssResult.includes("red"));

		const jsResult = core.js`const x = 42;`;
		assert.strictEqual(typeof jsResult, "string");
		assert(jsResult.includes("42"));

		const sqlResult = core.sql`SELECT * FROM users`;
		assert.strictEqual(typeof sqlResult, "string");
		assert(sqlResult.includes("SELECT"));

		const mdResult = core.md`# Test`;
		assert.strictEqual(typeof mdResult, "string");
		assert(mdResult.includes("Test"));
	});
});
