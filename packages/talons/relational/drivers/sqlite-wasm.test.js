/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for SQLite WASM driver
 */

import { rejects, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { connect, validate } from "./sqlite-wasm.js";

describe("SQLite WASM driver", () => {
	it("exports connect function", () => {
		strictEqual(typeof connect, "function");
	});

	it("exports validate function", () => {
		strictEqual(typeof validate, "function");
	});

	it("connect requires WASM engine", async () => {
		await rejects(
			() => connect({}),
			(error) => error.message.includes("WASM engine"),
		);
	});

	it("validate handles invalid connections", () => {
		strictEqual(validate(null), false);
		strictEqual(validate({}), false);
	});
});
