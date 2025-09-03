/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for MySQL driver
 */

import { strictEqual, rejects } from "node:assert";
import { describe, it } from "node:test";
import { connect, validate } from "./mysql.js";

describe("MySQL driver", () => {
	it("exports connect function", () => {
		strictEqual(typeof connect, "function");
	});

	it("exports validate function", () => {
		strictEqual(typeof validate, "function");
	});

	it("connect requires valid configuration", async () => {
		await rejects(
			() => connect({}),
			(error) => error.message.includes("host")
		);
	});

	it("validate handles invalid connections", () => {
		strictEqual(validate(null), false);
		strictEqual(validate({ socket: { destroyed: true } }), false);
	});
});
