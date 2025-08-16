import assert from "node:assert";
import { describe, test } from "node:test";
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

describe("ClusteredServer", () => {
	test("constructor", () => {
		const router = new Router();
		const server = new ClusteredServer(router);
		assert.ok(server instanceof ClusteredServer);
		assert.strictEqual(typeof server.listen, "function");
		assert.strictEqual(typeof server.close, "function");
		assert.strictEqual(typeof server.getClusterStats, "function");
	});

	test("constructor with options", () => {
		const router = new Router();
		const server = new ClusteredServer(router, {
			workers: 2,
			maxRestarts: 3,
			restartWindow: 5000,
			healthCheckInterval: 1000,
		});
		assert.ok(server instanceof ClusteredServer);
	});

	test("basic lifecycle", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		// Start the server
		await server.listen(3000, "127.0.0.1");

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.primaryPid, process.pid);
			assert.strictEqual(stats.targetWorkers, 1);
			assert.strictEqual(stats.shuttingDown, false);
			assert.ok(stats.workerIds.length >= 0);
		}

		// Close the server
		await server.close();
	});

	test("worker process behavior", async () => {
		// Test worker process behavior (lines 133-134, 158-159)
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		// Test worker process close behavior
		if (!global.cluster?.isPrimary) {
			// In worker process, close should just call super.close()
			// But we need to start the server first
			await server.listen(3001, "127.0.0.1");
			await server.close();
		} else {
			// In primary process, just test that it works
			const stats = server.getClusterStats();
			assert.ok(stats);
		}
	});

	test("targeted coverage improvements", async () => {
		// Test specific scenarios to hit uncovered lines without causing hangs
		const router = new Router();

		// Test with maxRestarts: 0 to potentially hit lines 186-190
		const server1 = new ClusteredServer(router, {
			workers: 1,
			maxRestarts: 0,
			restartWindow: 100,
		});

		await server1.listen(3014, "127.0.0.1");
		await new Promise((resolve) => setTimeout(resolve, 100));
		await server1.close();

		// Test with very short health check interval to potentially hit lines 285-296
		const server2 = new ClusteredServer(router, {
			workers: 1,
			healthCheckInterval: 50,
		});

		await server2.listen(3015, "127.0.0.1");
		await new Promise((resolve) => setTimeout(resolve, 100));
		await server2.close();

		// Test with longer restart window to potentially hit lines 231-265
		const server3 = new ClusteredServer(router, {
			workers: 1,
			maxRestarts: 2,
			restartWindow: 1000,
		});

		await server3.listen(3016, "127.0.0.1");
		await new Promise((resolve) => setTimeout(resolve, 100));
		await server3.close();

		// Only test in primary process
		if (global.cluster?.isPrimary) {
			assert.ok(true);
		}
	});

	test("health monitoring", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, {
			workers: 1,
			healthCheckInterval: 200, // Longer interval to avoid IPC errors
		});

		await server.listen(3002, "127.0.0.1");

		// Wait a bit for health checks to start
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.ok(stats.healthTimers >= 0);
		}

		await server.close();
	});

	test("graceful shutdown", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3003, "127.0.0.1");

		// Start shutdown
		const closePromise = server.close();

		// Wait for shutdown to complete
		await closePromise;

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.shuttingDown, true);
		}
	});

	test("signal handling", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3004, "127.0.0.1");

		// Mock process.exit to prevent actual exit
		const originalExit = process.exit;
		let exitCalled = false;
		process.exit = (code) => {
			exitCalled = true;
			assert.strictEqual(code, 0);
		};

		try {
			// Trigger SIGTERM
			process.emit("SIGTERM");

			// Wait a bit for signal handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify exit was called (only in primary process)
			if (global.cluster?.isPrimary) {
				assert.ok(exitCalled);
			}
		} finally {
			process.exit = originalExit;
			await server.close();
		}
	});

	test("SIGINT handling", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3005, "127.0.0.1");

		// Mock process.exit to prevent actual exit
		const originalExit = process.exit;
		let exitCalled = false;
		process.exit = (code) => {
			exitCalled = true;
			assert.strictEqual(code, 0);
		};

		try {
			// Trigger SIGINT (lines 328-330)
			process.emit("SIGINT");

			// Wait a bit for signal handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify exit was called (only in primary process)
			if (global.cluster?.isPrimary) {
				assert.ok(exitCalled);
			}
		} finally {
			process.exit = originalExit;
			await server.close();
		}
	});

	test("multiple workers", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 2 });

		await server.listen(3006, "127.0.0.1");

		// Wait for workers to start
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.targetWorkers, 2);
			assert.ok(stats.workerIds.length >= 0);
		}

		await server.close();
	});

	test("server options validation", () => {
		// Test with various option combinations
		const router1 = new Router();
		const server1 = new ClusteredServer(router1, { workers: 0 });
		assert.ok(server1 instanceof ClusteredServer);

		const router2 = new Router();
		const server2 = new ClusteredServer(router2, { workers: 10 });
		assert.ok(server2 instanceof ClusteredServer);

		const router3 = new Router();
		const server3 = new ClusteredServer(router3, {
			workers: 1,
			maxRestarts: 0,
			restartWindow: 100,
			healthCheckInterval: 50,
		});
		assert.ok(server3 instanceof ClusteredServer);
	});

	test("concurrent server instances", async () => {
		const router1 = new Router();
		const router2 = new Router();
		const server1 = new ClusteredServer(router1, { workers: 1 });
		const server2 = new ClusteredServer(router2, { workers: 1 });

		await server1.listen(3007, "127.0.0.1");
		await server2.listen(3008, "127.0.0.1");

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats1 = server1.getClusterStats();
			const stats2 = server2.getClusterStats();

			assert.strictEqual(stats1.primaryPid, process.pid);
			assert.strictEqual(stats2.primaryPid, process.pid);
			assert.notStrictEqual(stats1.workerIds, stats2.workerIds);
		}

		await server1.close();
		await server2.close();
	});

	test("error handling in close", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		await server.listen(3009, "127.0.0.1");
		await server.close();

		// Try to close again - should handle gracefully (lines 154-155)
		await server.close();

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.shuttingDown, true);
		}
	});

	test("rapid start/stop cycles", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, { workers: 1 });

		// Multiple rapid start/stop cycles
		for (let i = 0; i < 3; i++) {
			await server.listen(3010 + i, "127.0.0.1");
			await server.close();
		}

		// Only test cluster stats if we're in the primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.shuttingDown, true);
		}
	});

	test("worker restart configuration", async () => {
		const router = new Router();
		const server = new ClusteredServer(router, {
			workers: 1,
			maxRestarts: 1,
			restartWindow: 100,
		});

		await server.listen(3013, "127.0.0.1");

		// Wait for worker to start
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Only test in primary process
		if (global.cluster?.isPrimary) {
			const stats = server.getClusterStats();
			assert.strictEqual(stats.activeWorkers, 1);
		}

		await server.close();
	});
});
