/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for connection pool
 */

import { ok, rejects, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { ConnectionPool } from "./pool.js";

// Mock connection factory
const createMockConnection = () => ({
	id: Math.random().toString(36).substring(7),
	closed: false,
	close: function () {
		this.closed = true;
		return Promise.resolve();
	},
});

describe("ConnectionPool", () => {
	it("creates pool with configuration", () => {
		const pool = new ConnectionPool(createMockConnection, {
			min: 1,
			max: 5,
			idleTimeoutMs: 30000,
		});

		strictEqual(pool.config.min, 1);
		strictEqual(pool.config.max, 5);
		strictEqual(pool.config.idleTimeoutMs, 30000);
	});

	it("acquires and releases connections", async () => {
		const pool = new ConnectionPool(createMockConnection, { min: 0, max: 2 });

		const conn1 = await pool.acquire();
		ok(conn1);
		strictEqual(pool.stats.active, 1);

		const conn2 = await pool.acquire();
		ok(conn2);
		strictEqual(pool.stats.active, 2);

		pool.release(conn1);
		strictEqual(pool.stats.active, 1);
		strictEqual(pool.stats.idle, 1);

		pool.release(conn2);
		strictEqual(pool.stats.active, 0);
		strictEqual(pool.stats.idle, 2);

		await pool.close();
	});

	it("respects max pool size", async () => {
		const pool = new ConnectionPool(createMockConnection, { min: 0, max: 1 });

		const conn1 = await pool.acquire();
		ok(conn1);

		// Second acquire should timeout
		await rejects(
			() => pool.acquire({ signal: AbortSignal.timeout(50) }),
			(error) =>
				error.message.includes("timeout") || error.name === "TimeoutError",
		);

		pool.release(conn1);
		await pool.close();
	});

	it("maintains minimum connections", async () => {
		const pool = new ConnectionPool(createMockConnection, { min: 2, max: 5 });

		// Wait a bit for minimum connections to be created
		await new Promise((resolve) => setTimeout(resolve, 10));

		ok(pool.stats.total >= 2);
		await pool.close();
	});

	it("handles connection creation failures", async () => {
		const failingFactory = () => {
			throw new Error("Connection failed");
		};
		const pool = new ConnectionPool(failingFactory, { min: 0, max: 1 });

		await rejects(
			() => pool.acquire(),
			(error) => error.message.includes("Connection failed"),
		);

		await pool.close();
	});

	it("closes all connections", async () => {
		const pool = new ConnectionPool(createMockConnection, { min: 1, max: 3 });

		const conn1 = await pool.acquire();
		const conn2 = await pool.acquire();

		pool.release(conn1);
		// Keep conn2 active

		await pool.close();

		strictEqual(pool.stats.total, 0);
		strictEqual(pool.stats.active, 0);
		strictEqual(pool.stats.idle, 0);
	});

	it("provides pool statistics", async () => {
		const pool = new ConnectionPool(createMockConnection, { min: 1, max: 3 });

		const stats = pool.stats;
		ok(typeof stats.total === "number");
		ok(typeof stats.active === "number");
		ok(typeof stats.idle === "number");
		ok(typeof stats.pending === "number");

		await pool.close();
	});
});
