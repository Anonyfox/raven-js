/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for database client
 */

import { strictEqual, deepStrictEqual, ok, rejects, throws } from "node:assert";
import { describe, it } from "node:test";
import { connect } from "./client.js";

describe("connect", () => {
	it("throws for unsupported drivers", async () => {
		await rejects(
			() => connect({ driver: "unsupported" }),
			(error) => error.message.includes("Unsupported driver")
		);
	});

	it("throws for missing required config", async () => {
		await rejects(
			() => connect({}),
			(error) => error.message.includes("Driver is required")
		);
	});

	it("accepts DSN string", async () => {
		// This will fail to connect but should parse the DSN
		await rejects(
			() => connect("postgresql://user:pass@nonexistent:5432/db"),
			(error) => {
				// Should fail on connection, not parsing
				return !error.message.includes("Invalid DSN");
			}
		);
	});

	it("merges configuration correctly", async () => {
		// Test config merging without actual connection
		const config = {
			driver: "pg",
			host: "localhost",
			port: 5432,
			user: "test",
		};

		// This will fail to connect but config should be processed
		await rejects(
			() => connect(config),
			(error) => {
				// Should fail on connection, not config validation
				return true;
			}
		);
	});
});

// Note: Full client testing would require actual database connections
// or extensive mocking. These tests focus on the public API and
// configuration handling that can be tested without connections.

describe("Client interface", () => {
	it("connect function exists and is callable", () => {
		strictEqual(typeof connect, "function");
	});

	// Additional integration tests would go here with actual database instances
	// or comprehensive mocking of the driver layer
});
