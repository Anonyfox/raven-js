import assert from "node:assert";
import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { afterEach, beforeEach, describe, test } from "node:test";
import { Router } from "../../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

describe("ClusteredServer", () => {
	let originalIsPrimary;
	let originalFork;
	let originalOn;
	let originalRemoveListener;
	let originalRemoveAllListeners;
	let originalDisconnect;
	let originalWorkers;
	let originalSend;

	beforeEach(() => {
		// Save original cluster methods
		originalIsPrimary = cluster.isPrimary;
		originalFork = cluster.fork;
		originalOn = cluster.on;
		originalRemoveListener = cluster.removeListener;
		originalRemoveAllListeners = cluster.removeAllListeners;
		originalDisconnect = cluster.disconnect;
		originalWorkers = cluster.workers;
		originalSend = process.send;
	});

	afterEach(() => {
		// Restore original cluster methods
		cluster.isPrimary = originalIsPrimary;
		cluster.fork = originalFork;
		cluster.on = originalOn;
		cluster.removeListener = originalRemoveListener;
		cluster.removeAllListeners = originalRemoveAllListeners;
		cluster.disconnect = originalDisconnect;
		cluster.workers = originalWorkers;
		process.send = originalSend;
	});

	test("should handle primary process initialization and worker management", async () => {
		const router = new Router();
		router.get("/test", (ctx) => ctx.json({ message: "Hello from cluster" }));

		const server = new ClusteredServer(router);

		// Test 1: Primary process getters
		cluster.isPrimary = true;
		assert.strictEqual(server.isMainProcess, true);
		assert.strictEqual(server.isWorkerProcess, false);

		// Test 2: Setup cluster mocking for primary process
		let forkCallCount = 0;
		let exitListener = null;
		let messageListener = null;
		const mockWorkers = {
			1: { kill: () => {} },
			2: { kill: () => {} },
		};

		cluster.fork = () => {
			forkCallCount++;
			return { id: forkCallCount };
		};

		cluster.on = (event, listener) => {
			if (event === "exit") exitListener = listener;
			if (event === "message") messageListener = listener;
		};

		const removedListeners = [];
		cluster.removeListener = (event, listener) => {
			removedListeners.push({ event, listener });
		};

		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};
		cluster.workers = mockWorkers;

		// Test 3: Primary process listen() - first call
		const listenPromise = server.listen(3000);

		// Simulate workers becoming ready
		const expectedWorkers = availableParallelism();
		for (let i = 0; i < expectedWorkers; i++) {
			messageListener({}, "ready");
		}

		await listenPromise;

		// Verify worker forking happened correctly
		assert.strictEqual(forkCallCount, expectedWorkers);
		assert.ok(exitListener);
		assert.ok(messageListener);

		// Test 4: Double listen prevention
		await server.listen(3000); // Should return immediately without re-forking
		assert.strictEqual(forkCallCount, expectedWorkers); // No additional forks

		// Test 5: Worker crash restart logic
		const initialForkCount = forkCallCount;
		exitListener({}, 1, null); // Worker crashed (code !== 0)
		assert.strictEqual(forkCallCount, initialForkCount + 1); // Should restart

		exitListener({}, 0, null); // Worker graceful shutdown (code === 0)
		assert.strictEqual(forkCallCount, initialForkCount + 1); // Should NOT restart

		// Test 6: Primary process close()
		await server.close();

		// Verify cleanup
		assert.ok(removedListeners.length > 0);
		assert.ok(removedListeners.some((l) => l.event === "exit"));
		assert.ok(removedListeners.some((l) => l.event === "message"));

		// Test 7: No restart after close
		const preCloseForkCount = forkCallCount;
		exitListener({}, 1, null); // Worker crash after close
		assert.strictEqual(forkCallCount, preCloseForkCount); // Should NOT restart
	});

	test("should handle worker process initialization and communication", async () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		// Test 1: Worker process getters
		cluster.isPrimary = false;
		assert.strictEqual(server.isMainProcess, false);
		assert.strictEqual(server.isWorkerProcess, true);

		// Test 2: Mock process.send for worker communication
		const sentMessages = [];
		process.send = (message) => {
			sentMessages.push(message);
		};

		// Test 3: Mock super.listen to avoid cluster._getServer issues
		let superListenCalled = false;
		let superListenArgs = [];
		const originalListen = Object.getPrototypeOf(
			Object.getPrototypeOf(server),
		).listen;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen = async (
			...args
		) => {
			superListenCalled = true;
			superListenArgs = args;
			// Don't call real listen to avoid cluster issues
		};

		// Worker process listen() - should call super.listen and send ready
		await server.listen(3000, "127.0.0.1");

		// Verify super.listen was called with correct args
		assert.ok(superListenCalled);
		assert.strictEqual(superListenArgs[0], 3000);
		assert.strictEqual(superListenArgs[1], "127.0.0.1");

		// Verify worker sent ready message
		assert.strictEqual(sentMessages.length, 1);
		assert.strictEqual(sentMessages[0], "ready");

		// Test 4: Mock super.close to avoid cluster issues
		let superCloseCalled = false;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).close = async () => {
			superCloseCalled = true;
		};

		// Worker process close() - should call super.close
		await server.close();

		assert.ok(superCloseCalled);
		assert.strictEqual(sentMessages.length, 1); // No additional messages

		// Restore original methods
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen =
			originalListen;
	});

	test("should handle message processing and over-counting prevention", async () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		cluster.isPrimary = true;

		// Setup message handling mock
		let messageListener = null;
		cluster.on = (event, listener) => {
			if (event === "message") messageListener = listener;
		};

		cluster.fork = () => ({ id: 1 });
		cluster.removeListener = () => {};
		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};
		cluster.workers = {};

		// Start listen to setup message handler
		const listenPromise = server.listen(3000);

		// Test 1: Valid ready messages should be counted
		messageListener({}, "ready");
		messageListener({}, "ready");

		// Test 2: Invalid messages should be ignored
		messageListener({}, "not-ready");
		messageListener({}, "");
		messageListener({}, null);

		// Test 3: Over-counting prevention
		const expectedWorkers = availableParallelism();
		for (let i = 0; i < expectedWorkers + 5; i++) {
			messageListener({}, "ready"); // Send more than expected
		}

		await listenPromise; // Should resolve when expectedWorkers count reached

		await server.close();
	});

	test("should handle listener cleanup and memory leak prevention", async () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		cluster.isPrimary = true;

		// Track listener management
		const addedListeners = [];
		const removedListeners = [];

		cluster.on = (event, listener) => {
			addedListeners.push({ event, listener });
		};

		cluster.removeListener = (event, listener) => {
			removedListeners.push({ event, listener });
		};

		cluster.fork = () => ({ id: 1 });
		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};
		cluster.workers = {};

		// Test 1: Listeners added during listen
		const listenPromise = server.listen(3000);

		// Simulate all workers ready
		const messageListener = addedListeners.find(
			(l) => l.event === "message",
		).listener;
		const expectedWorkers = availableParallelism();
		for (let i = 0; i < expectedWorkers; i++) {
			messageListener({}, "ready");
		}

		await listenPromise;

		// Test 2: Listeners removed during close
		await server.close();

		// Verify cleanup
		assert.ok(addedListeners.length > 0);
		assert.ok(removedListeners.length > 0);
		assert.ok(addedListeners.some((l) => l.event === "exit"));
		assert.ok(addedListeners.some((l) => l.event === "message"));
		assert.ok(removedListeners.some((l) => l.event === "exit"));
		assert.ok(removedListeners.some((l) => l.event === "message"));
	});

	test("should handle error scenarios and edge cases", async () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		// Test 1: Worker process super.close() error handling
		cluster.isPrimary = false;
		process.send = () => {};

		// Mock super.listen to avoid cluster issues
		const originalListen = Object.getPrototypeOf(
			Object.getPrototypeOf(server),
		).listen;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen = async () => {
			// Don't call real listen to avoid cluster issues
		};

		await server.listen(0);

		// Mock super.close to throw error
		const originalClose = Object.getPrototypeOf(
			Object.getPrototypeOf(server),
		).close;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).close = async () => {
			throw new Error("Server close error");
		};

		// Should not throw - error should be caught and ignored
		await server.close();

		// Restore original methods
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen =
			originalListen;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).close = originalClose;

		// Test 2: Primary process with various worker kill scenarios
		cluster.isPrimary = true;

		const killedWorkers = [];
		const mockWorkers = {
			1: { kill: (signal) => killedWorkers.push({ id: 1, signal }) },
			2: { kill: (signal) => killedWorkers.push({ id: 2, signal }) },
			3: { kill: (signal) => killedWorkers.push({ id: 3, signal }) },
		};

		cluster.workers = mockWorkers;
		cluster.fork = () => ({ id: 1 });
		cluster.on = (event, listener) => {
			if (event === "message") {
				// Immediately send ready messages for all expected workers
				setTimeout(() => {
					const expectedWorkers = availableParallelism();
					for (let i = 0; i < expectedWorkers; i++) {
						listener({}, "ready");
					}
				}, 1);
			}
		};
		cluster.removeListener = () => {};
		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};

		const server2 = new ClusteredServer(router);
		await server2.listen(3001);
		await server2.close();

		// Verify all workers were force killed with SIGKILL
		assert.strictEqual(killedWorkers.length, 3);
		assert.ok(killedWorkers.every((w) => w.signal === "SIGKILL"));

		// Test 3: removeListener with null listeners (defensive programming)
		const server3 = new ClusteredServer(router);

		// Test defensive programming by calling close when no listeners are set
		// This exercises the null check branches in #removeMessageListener and #removeListeners
		cluster.isPrimary = true;
		cluster.on = () => {};
		cluster.removeListener = () => {};
		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};
		cluster.workers = {};

		// This should not throw even if listeners are null
		await server3.close();
	});

	test("should handle concurrent worker readiness and race conditions", async () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		cluster.isPrimary = true;

		let messageListener = null;
		cluster.on = (event, listener) => {
			if (event === "message") messageListener = listener;
		};

		cluster.fork = () => ({ id: 1 });
		cluster.removeListener = () => {};
		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};
		cluster.workers = {};

		// Test concurrent message handling
		const listenPromise = server.listen(3000);

		// Ensure messageListener is set before sending messages
		await new Promise((resolve) => setTimeout(resolve, 1));

		// Simulate rapid concurrent ready messages
		const expectedWorkers = availableParallelism();
		const promises = [];

		for (let i = 0; i < expectedWorkers; i++) {
			promises.push(
				new Promise((resolve) => {
					setTimeout(() => {
						if (messageListener) {
							messageListener({}, "ready");
						}
						resolve();
					}, Math.random() * 10);
				}),
			);
		}

		// Wait for all messages to be sent
		await Promise.all(promises);
		await listenPromise;

		await server.close();
	});

	test("should maintain inheritance and proper method delegation", async () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		// Test 1: Verify inheritance from NodeHttp
		assert.ok(server instanceof ClusteredServer);
		assert.ok(
			Object.getPrototypeOf(Object.getPrototypeOf(server)).constructor.name ===
				"NodeHttp",
		);

		// Test 2: Worker process should delegate to super.listen with correct parameters
		cluster.isPrimary = false;
		process.send = () => {};

		let superListenCalled = false;
		let superListenArgs = [];

		const originalListen2 = Object.getPrototypeOf(
			Object.getPrototypeOf(server),
		).listen;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen = async (
			...args
		) => {
			superListenCalled = true;
			superListenArgs = args;
			// Don't call real listen to avoid cluster issues
		};

		await server.listen(4000, "127.0.0.1");

		assert.ok(superListenCalled);
		assert.strictEqual(superListenArgs[0], 4000);
		assert.strictEqual(superListenArgs[1], "127.0.0.1");

		// Mock close to avoid cluster issues
		Object.getPrototypeOf(Object.getPrototypeOf(server)).close = async () => {
			// Don't call real close
		};

		await server.close();

		// Restore original method
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen =
			originalListen2;

		// Test 3: Primary process should NOT call super.listen
		cluster.isPrimary = true;
		cluster.fork = () => ({ id: 1 });
		cluster.on = (event, listener) => {
			if (event === "message") {
				// Use setTimeout to avoid immediate execution during listener setup
				setTimeout(() => {
					const expectedWorkers = availableParallelism();
					for (let i = 0; i < expectedWorkers; i++) {
						listener({}, "ready");
					}
				}, 1);
			}
		};
		cluster.removeListener = () => {};
		cluster.removeAllListeners = () => {};
		cluster.disconnect = () => {};
		cluster.workers = {};

		superListenCalled = false;
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen = async (
			..._args
		) => {
			superListenCalled = true;
			// Don't call original to avoid issues
		};

		const server2 = new ClusteredServer(router);
		await server2.listen(5000);

		assert.strictEqual(superListenCalled, false); // Primary should NOT call super.listen

		await server2.close();

		// Restore original method (use originalListen2 which is in scope)
		Object.getPrototypeOf(Object.getPrototypeOf(server)).listen =
			originalListen2;
	});
});
