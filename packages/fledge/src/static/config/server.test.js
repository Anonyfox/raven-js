/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { createServer as createTcpServer } from "node:net";
import { describe, test } from "node:test";

import { Server } from "./server.js";

describe("Server", () => {
	test("constructs with handler function", () => {
		const handler = async ({ port: _port }) => {};
		const server = new Server(handler);

		assert.strictEqual(server.isBooted(), false);
		assert.strictEqual(server.getOrigin(), null);
		assert.strictEqual(server.getPort(), null);
	});

	test("throws on invalid handler", () => {
		assert.throws(
			() => new Server("not a function"),
			/Server handler must be a function/,
		);
		assert.throws(() => new Server(null), /Server handler must be a function/);
		assert.throws(() => new Server({}), /Server handler must be a function/);
	});

	test("finds free port via OS allocation", async () => {
		const server = new Server(async ({ port: _port }) => {});

		const port1 = await server.findFreePort();
		const port2 = await server.findFreePort();

		assert.strictEqual(typeof port1, "number");
		assert.strictEqual(typeof port2, "number");
		assert.strictEqual(port1 > 0, true);
		assert.strictEqual(port2 > 0, true);
		assert.strictEqual(port1 !== port2, true); // Should be different ports
	});

	test("detects port readiness correctly", async () => {
		const server = new Server(async ({ port: _port }) => {});

		// Test non-existent port
		const unusedPort = await server.findFreePort();
		assert.strictEqual(await server.isPortReady(unusedPort), false);

		// Test active port
		const testServer = createTcpServer();
		const activePort = await new Promise((resolve, reject) => {
			testServer.listen(0, (error) => {
				if (error) {
					reject(error);
					return;
				}
				const address = testServer.address();
				resolve(typeof address === "string" ? 0 : address.port);
			});
		});

		assert.strictEqual(await server.isPortReady(activePort), true);

		// Cleanup
		testServer.close();
	});

	test("sleep utility works correctly", async () => {
		const server = new Server(async ({ port: _port }) => {});

		const start = Date.now();
		await server.sleep(50);
		const elapsed = Date.now() - start;

		// Allow some tolerance for timing
		assert.strictEqual(elapsed >= 40, true);
		assert.strictEqual(elapsed <= 100, true);
	});

	test("provides accurate JSON representation", () => {
		const server = new Server(async ({ port: _port }) => {});

		const json = server.toJSON();
		assert.strictEqual(json.isBooted, false);
		assert.strictEqual(json.port, null);
		assert.strictEqual(json.origin, null);
		assert.strictEqual(json.pid, null);
		assert.strictEqual(json.crashed, false);
	});

	test("handles isAlive checks correctly", async () => {
		const server = new Server(async ({ port: _port }) => {});

		// Should be false when not booted
		assert.strictEqual(await server.isAlive(), false);
	});

	test("handles kill on non-running server", async () => {
		const server = new Server(async ({ port: _port }) => {});

		// Should handle kill gracefully when not running
		await server.kill();
		assert.strictEqual(server.isBooted(), false);
	});

	test("boot validates state correctly", async () => {
		const server = new Server(async ({ port: _port }) => {
			// Simulate hanging server (never binds to port)
			await new Promise(() => {});
		});

		// Should timeout and reject
		await assert.rejects(
			async () => await server.boot({ timeout: 100, maxAttempts: 1 }),
			/Failed to boot server after 1 attempts/,
		);
	});

	test("prevents concurrent operations", async () => {
		const server = new Server(async ({ port: _port }) => {
			// Slow server startup
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		const boot1 = server.boot({ timeout: 200, maxAttempts: 1 });

		// Try second boot while first is in progress
		await assert.rejects(
			async () => await server.boot(),
			/Server is already booting/,
		);

		// Clean up
		try {
			await boot1;
		} catch {
			// Expected to fail due to timeout/mocking
		}
	});
});
