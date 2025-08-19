import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ask, confirm } from "./ask.js";

describe("ask", () => {
	it("should be an async function", () => {
		assert.equal(typeof ask, "function");
		assert.equal(ask.constructor.name, "AsyncFunction");
	});
});

describe("confirm", () => {
	it("should be an async function", () => {
		assert.equal(typeof confirm, "function");
		assert.equal(confirm.constructor.name, "AsyncFunction");
	});
});
