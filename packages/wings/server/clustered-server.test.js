import assert from "node:assert";
import { describe, test } from "node:test";
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

describe("ClusteredServer", () => {
	test("constructor and basic functionality", () => {
		const router = new Router();
		const server = new ClusteredServer(router);
		assert.ok(server instanceof ClusteredServer);
		assert.strictEqual(typeof server.listen, "function");
		assert.strictEqual(typeof server.close, "function");
		assert.strictEqual(typeof server.getClusterStats, "function");
	});

	test("constructor with custom options", () => {
		const router = new Router();
		const server = new ClusteredServer(router, {
			workers: 2,
			maxRestarts: 3,
			restartWindow: 5000,
			healthCheckInterval: 1000,
		});
		assert.ok(server instanceof ClusteredServer);
	});

	test("basic lifecycle - start and stop", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3000, "127.0.0.1");

		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.primaryPid, process.pid);
			assert.strictEqual(stats.targetWorkers, 1);
			assert.strictEqual(stats.shuttingDown, false);
		}

		await server.close();
	});

	test("multiple workers", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 2 });

		await server.listen(3001, "127.0.0.1");

		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.targetWorkers, 2);
		}

		await server.close();
	});

	test("graceful shutdown", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3002, "127.0.0.1");
		await server.close();

		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.shuttingDown, true);
		}
	});

	test("signal handling", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3003, "127.0.0.1");

		// Mock process.exit to prevent actual exit
		const originalExit = process.exit;
		let exitCalled = false;
		process.exit = (code) => {
			exitCalled = true;
			assert.strictEqual(code, 0);
		};

		try {
			process.emit("SIGTERM");
			await new Promise((resolve) => setTimeout(resolve, 50));

			if (global.cluster?.isPrimary) {
				assert.ok(exitCalled);
			}
		} finally {
			process.exit = originalExit;
			await server.close();
		}
	});

	test("error handling in close", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3004, "127.0.0.1");
		await server.close();
		// Should handle double close gracefully
		await server.close();
	});

	test("rapid start/stop cycles", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		// Multiple rapid start/stop cycles
		for (let i = 0; i < 3; i++) {
			await server.listen(3005 + i, "127.0.0.1");
			await server.close();
		}
	});
});
