/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for SQLite Node.js driver
 */

import { rejects, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { connect, validate } from "./sqlite-node.js";

describe("SQLite Node.js driver", () => {
	it("exports connect function", () => {
		strictEqual(typeof connect, "function");
	});

	it("exports validate function", () => {
		strictEqual(typeof validate, "function");
	});

	it("connect handles missing sqlite module gracefully", async () => {
		// Will fail if Node.js sqlite module not available
		await rejects(
			() => connect({ database: ":memory:" }),
			(error) => error.message.includes("sqlite module"),
		);
	});

	it("validate handles invalid connections", () => {
		strictEqual(validate(null), false);
		strictEqual(validate({}), false);
	});
});
