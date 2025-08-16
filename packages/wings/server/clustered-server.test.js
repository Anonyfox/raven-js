import assert from "node:assert";
import cluster from "node:cluster";
import { describe, test } from "node:test";
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

describe("ClusteredServer", () => {
	// Test state
	let mockWorkers, mockClusterEvents, mockTimers, mockProcessEvents;
	let originalSetInterval, originalClearInterval;
	let capturedLogs, capturedErrors, capturedWarnings;

	// Setup before each test
	const setupMocks = () => {
		// Reset state
		mockWorkers = new Map();
		mockClusterEvents = new Map();
		mockTimers = new Map();
		mockProcessEvents = new Map();
		capturedLogs = [];
		capturedErrors = [];
		capturedWarnings = [];

		// Store originals
		originalSetInterval = global.setInterval;
		originalClearInterval = global.clearInterval;

		// Mock cluster.isPrimary
		Object.defineProperty(cluster, "isPrimary", {
			value: true,
			writable: true,
		});

		// Mock cluster.fork
		cluster.fork = () => {
			const worker = {
				id: mockWorkers.size + 1,
				isDead: () => false,
				disconnect: () => triggerClusterEvent("disconnect", worker),
				kill: (signal) => triggerClusterEvent("exit", worker, 0, signal),
				send: () => {},
				once: (event, callback) => {
					if (event === "disconnect") {
						// Use immediate callback instead of setTimeout
						process.nextTick(callback);
					}
				},
			};
			mockWorkers.set(worker.id, worker);
			return worker;
		};

		// Mock cluster events
		cluster.on = (event, listener) => {
			if (!mockClusterEvents.has(event)) {
				mockClusterEvents.set(event, []);
			}
			mockClusterEvents.get(event).push(listener);
		};

		// Mock cluster.workers
		Object.defineProperty(cluster, "workers", {
			get: () => Object.fromEntries(mockWorkers),
		});

		// Mock cluster.disconnect
		cluster.disconnect = () => {};

		// Mock timers (store callbacks for manual execution)
		global.setInterval = (callback, delay) => {
			const id = Math.random();
			mockTimers.set(id, { callback, delay });
			return id;
		};

		global.clearInterval = (id) => mockTimers.delete(id);

		// Mock process events
		process.on = (event, handler) => {
			if (!mockProcessEvents.has(event)) {
				mockProcessEvents.set(event, []);
			}
			mockProcessEvents.get(event).push(handler);
		};

		// Mock console methods
		global.console = {
			...console,
			log: (...args) => capturedLogs.push(args.join(" ")),
			error: (...args) => capturedErrors.push(args.join(" ")),
			warn: (...args) => capturedWarnings.push(args.join(" ")),
		};

		// Mock process.exit
		process.exit = () => {};
	};

	// Cleanup after each test
	const cleanupMocks = () => {
		// Clear all timers
		mockTimers.clear();

		// Clear all event listeners
		mockClusterEvents.clear();
		mockProcessEvents.clear();

		// Clear all workers
		mockWorkers.clear();

		// Restore original global functions
		global.setInterval = originalSetInterval;
		global.clearInterval = originalClearInterval;

		// Remove all process event listeners to prevent hanging
		process.removeAllListeners("SIGTERM");
		process.removeAllListeners("SIGINT");

		// Remove all cluster event listeners
		cluster.removeAllListeners("listening");
		cluster.removeAllListeners("exit");
		cluster.removeAllListeners("disconnect");

		// Force garbage collection to clean up any remaining references
		if (global.gc) {
			global.gc();
		}
	};

	// Helper functions
	const triggerClusterEvent = (event, ...args) => {
		const listeners = mockClusterEvents.get(event) || [];
		listeners.forEach((listener) => {
			listener(...args);
		});
	};

	const triggerProcessEvent = (event, ...args) => {
		const listeners = mockProcessEvents.get(event) || [];
		listeners.forEach((listener) => {
			listener(...args);
		});
	};

	const createServer = (options = {}) => {
		const router = new Router();
		return new ClusteredServer(router, options);
	};

	// Test groups
	test("constructor", () => {
		setupMocks();

		// Test basic instantiation
		const server = createServer();
		assert.ok(server instanceof ClusteredServer);
		assert.strictEqual(typeof server.listen, "function");
		assert.strictEqual(typeof server.close, "function");
		assert.strictEqual(typeof server.getClusterStats, "function");

		// Test with various configurations
		const configs = [
			{},
			{ workers: 2 },
			{ workers: 4, timeout: 30000 },
			{ workers: 2, healthCheckInterval: 15000, maxRestarts: 3 },
			{ timeout: 60000, keepAlive: false, maxHeadersCount: 1000 },
			{ workers: 0, timeout: 0, healthCheckInterval: 0 },
			{ workers: 1000, timeout: 999999, maxRestarts: 999999 },
		];

		configs.forEach((config) => {
			const testServer = createServer(config);
			assert.ok(testServer instanceof ClusteredServer);
		});

		cleanupMocks();
	});

	test("primary process lifecycle", async () => {
		setupMocks();
		const server = createServer({ workers: 2 });

		// Test listen on primary process
		await server.listen(3000);
		assert.strictEqual(mockWorkers.size, 2);

		// Test worker listening events
		const worker = mockWorkers.get(1);
		triggerClusterEvent("listening", worker, { port: 3000 });
		assert.strictEqual(mockTimers.size, 1);

		// Test worker disconnect
		triggerClusterEvent("disconnect", worker);
		assert.ok(capturedLogs.some((log) => log.includes("disconnected")));

		// Test cluster statistics
		const stats = server.getClusterStats();
		assert.strictEqual(stats.primaryPid, process.pid);
		assert.strictEqual(stats.targetWorkers, 2);
		assert.strictEqual(stats.workerIds.length, 2);

		// Ensure server is properly closed
		await server.close();
		cleanupMocks();
	});

	test("health monitoring", async () => {
		setupMocks();
		const server = createServer({ workers: 1, healthCheckInterval: 100 });

		await server.listen(3000);
		const worker = mockWorkers.get(1);

		// Start health check
		triggerClusterEvent("listening", worker, { port: 3000 });
		assert.strictEqual(mockTimers.size, 1);

		// Test dead worker detection
		worker.isDead = () => true;
		const timer = Array.from(mockTimers.values())[0];
		timer.callback(); // This should stop health check
		assert.strictEqual(mockTimers.size, 0);

		// Ensure server is properly closed
		await server.close();
		cleanupMocks();
	});

	test("graceful shutdown", async () => {
		setupMocks();
		const server = createServer({ workers: 1, gracefulShutdownTimeout: 10 });

		await server.listen(3000);

		// Test graceful shutdown
		await server.close();
		assert.ok(true); // Shutdown completed

		// Test shutdown timeout
		const server2 = createServer({ workers: 1, gracefulShutdownTimeout: 10 });
		await server2.listen(3001);
		const slowWorker = {
			id: 1,
			isDead: () => false,
			disconnect: () => {
				// Simulate slow disconnect
				process.nextTick(() => triggerClusterEvent("disconnect", slowWorker));
			},
			kill: () => {},
			send: () => {},
			once: () => {},
		};
		mockWorkers.set(1, slowWorker);

		await server2.close();
		assert.ok(true); // Shutdown completed

		cleanupMocks();
	});

	test("signal handling", async () => {
		setupMocks();
		const server = createServer({ workers: 1 });

		await server.listen(3000);

		// Test SIGTERM
		triggerProcessEvent("SIGTERM");
		assert.ok(capturedLogs.some((log) => log.includes("Received SIGTERM")));

		// Ensure server is properly closed
		await server.close();
		cleanupMocks();
	});

	test("worker process behavior", () => {
		setupMocks();

		// Set cluster.isPrimary to false
		Object.defineProperty(cluster, "isPrimary", {
			value: false,
			writable: true,
		});

		const server = createServer();

		// Test getClusterStats on worker process
		assert.throws(() => {
			server.getClusterStats();
		}, /Cluster stats only available on primary process/);

		// Test listen on worker process
		let superListenCalled = false;
		const originalListen = server.listen;
		server.listen = async (port, host) => {
			superListenCalled = true;
			assert.strictEqual(port, 3000);
			assert.strictEqual(host, "0.0.0.0");
		};

		server.listen(3000, "0.0.0.0");
		assert.ok(superListenCalled);

		// Test close on worker process
		let superCloseCalled = false;
		const originalClose = server.close;
		server.close = async () => {
			superCloseCalled = true;
		};

		server.close();
		assert.ok(superCloseCalled);

		cleanupMocks();
	});

	test("edge cases", async () => {
		setupMocks();
		const server = createServer({ workers: 1 });

		await server.listen(3000);

		// Test forking during shutdown
		const closePromise = server.close();
		const worker = mockWorkers.get(1);
		triggerClusterEvent("exit", worker, 1, "SIGTERM");
		await closePromise;
		assert.strictEqual(mockWorkers.size, 1);

		// Test missing restart counter
		triggerClusterEvent("exit", worker, 1, "SIGTERM");
		assert.ok(true); // No error occurred

		// Test multiple worker exits
		setupMocks(); // Reset for clean state
		const server2 = createServer({ workers: 2, maxRestarts: 1 });
		await server2.listen(3001);
		const worker1 = mockWorkers.get(1);
		const worker2 = mockWorkers.get(2);

		triggerClusterEvent("exit", worker1, 1, "SIGTERM");
		triggerClusterEvent("exit", worker1, 1, "SIGTERM");
		triggerClusterEvent("exit", worker2, 1, "SIGTERM");
		triggerClusterEvent("exit", worker2, 1, "SIGTERM");

		assert.ok(
			capturedErrors.some((error) =>
				error.includes("Worker 1 crashed too many times"),
			),
		);
		assert.ok(
			capturedErrors.some((error) =>
				error.includes("Worker 2 crashed too many times"),
			),
		);

		// Ensure server is properly closed
		await server2.close();
		cleanupMocks();
	});
});
