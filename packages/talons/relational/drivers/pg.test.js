/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for PostgreSQL driver
 */

import { strictEqual, ok, rejects } from "node:assert";
import { describe, it } from "node:test";
import { connect, validate } from "./pg.js";

describe("PostgreSQL driver", () => {
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

	it("validate handles null connection", () => {
		strictEqual(validate(null), false);
		strictEqual(validate(undefined), false);
	});

	it("validate handles invalid connection", () => {
		const invalidConn = { socket: { destroyed: true } };
		strictEqual(validate(invalidConn), false);
	});

	// Note: Full driver testing requires actual PostgreSQL instance
	// These tests focus on the driver interface and basic validation
});
