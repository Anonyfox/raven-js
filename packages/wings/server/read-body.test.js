import assert from "node:assert";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import {
	clearTimer,
	createResourceManager,
	createTimer,
	createValidator,
	DEFAULT_TIMER_IMPL,
	getMaxBodySize,
	getMaxChunks,
	getTimeout,
	RequestValidator,
	ResourceManager,
	readBody,
	SECURITY_DEFAULTS,
	ValidationError,
} from "./read-body.js";

/**
 * Helper function to create a mock request object that behaves like an HTTP request stream.
 *
 * @param {Object} options - Configuration options
 * @param {Buffer[]} options.chunks - Array of data chunks to emit
 * @param {boolean} options.shouldError - Whether to emit an error event
 * @param {Error} options.error - The error to emit (if shouldError is true)
 * @param {boolean} options.shouldDelayEnd - Whether to delay the end event (for timeout tests)
 * @returns {EventEmitter} A mock request object
 */
function createMockRequest({
	chunks = [],
	shouldError = false,
	error = new Error("Test error"),
	shouldDelayEnd = false,
} = {}) {
	const mockRequest = new EventEmitter();

	// Simulate the request lifecycle
	setImmediate(() => {
		if (shouldError) {
			// Emit error first
			mockRequest.emit("error", error);
		} else {
			// Emit data chunks
			for (const chunk of chunks) {
				mockRequest.emit("data", chunk);
			}
			// Emit end event (unless delayed for timeout tests)
			if (!shouldDelayEnd) {
				mockRequest.emit("end");
			}
		}
	});

	return mockRequest;
}

test("Security defaults", async (t) => {
	await t.test("SECURITY_DEFAULTS should have expected values", () => {
		assert.strictEqual(typeof SECURITY_DEFAULTS.MAX_BODY_SIZE, "number");
		assert.strictEqual(typeof SECURITY_DEFAULTS.MAX_CHUNKS, "number");
		assert.strictEqual(typeof SECURITY_DEFAULTS.TIMEOUT_MS, "number");

		// Verify sensible default values
		assert.strictEqual(SECURITY_DEFAULTS.MAX_BODY_SIZE, 10 * 1024 * 1024); // 10MB
		assert.strictEqual(SECURITY_DEFAULTS.MAX_CHUNKS, 1000);
		assert.strictEqual(SECURITY_DEFAULTS.TIMEOUT_MS, 30 * 1000); // 30 seconds
	});

	await t.test("getMaxBodySize should return correct value", () => {
		const result = getMaxBodySize();
		assert.strictEqual(result, SECURITY_DEFAULTS.MAX_BODY_SIZE);
		assert.strictEqual(typeof result, "number");
		assert.ok(result > 0);
	});

	await t.test("getMaxChunks should return correct value", () => {
		const result = getMaxChunks();
		assert.strictEqual(result, SECURITY_DEFAULTS.MAX_CHUNKS);
		assert.strictEqual(typeof result, "number");
		assert.ok(result > 0);
	});

	await t.test("getTimeout should return correct value", () => {
		const result = getTimeout();
		assert.strictEqual(result, SECURITY_DEFAULTS.TIMEOUT_MS);
		assert.strictEqual(typeof result, "number");
		assert.ok(result > 0);
	});
});

test("Timer abstraction", async (t) => {
	await t.test("DEFAULT_TIMER_IMPL should have correct interface", () => {
		assert.strictEqual(typeof DEFAULT_TIMER_IMPL.create, "function");
		assert.strictEqual(typeof DEFAULT_TIMER_IMPL.clear, "function");
		assert.strictEqual(DEFAULT_TIMER_IMPL.create, setTimeout);
		assert.strictEqual(DEFAULT_TIMER_IMPL.clear, clearTimeout);
	});

	await t.test("createTimer should use default implementation", (_t, done) => {
		const callback = () => {
			done();
		};

		const timerId = createTimer(callback, 1);
		assert.ok(timerId != null);
		assert.strictEqual(typeof timerId, "object"); // Node.js returns a Timeout object
	});

	await t.test("createTimer should use custom implementation", () => {
		let callbackCalled = false;
		let createCalled = false;

		const mockImpl = {
			create: (callback, delay) => {
				createCalled = true;
				assert.strictEqual(typeof callback, "function");
				assert.strictEqual(delay, 100);
				// Call immediately for testing
				callback();
				return "mock-timer-id";
			},
			clear: () => {},
		};

		const timerId = createTimer(
			() => {
				callbackCalled = true;
			},
			100,
			mockImpl,
		);

		assert.strictEqual(createCalled, true);
		assert.strictEqual(callbackCalled, true);
		assert.strictEqual(timerId, "mock-timer-id");
	});

	await t.test("clearTimer should use default implementation", () => {
		const timerId = createTimer(() => {}, 1000);
		// Should not throw
		assert.doesNotThrow(() => clearTimer(timerId));
	});

	await t.test("clearTimer should use custom implementation", () => {
		let clearCalled = false;
		const mockImpl = {
			create: () => "mock-timer-id",
			clear: (timerId) => {
				clearCalled = true;
				assert.strictEqual(timerId, "test-timer-id");
			},
		};

		clearTimer("test-timer-id", mockImpl);
		assert.strictEqual(clearCalled, true);
	});

	await t.test(
		"createTimer should handle undefined implementation",
		(_t, done) => {
			const callback = () => {
				done();
			};

			// Should fallback to default implementation
			const timerId = createTimer(callback, 1, undefined);
			assert.ok(timerId != null);
		},
	);

	await t.test("clearTimer should handle undefined implementation", () => {
		const timerId = createTimer(() => {}, 1000);
		// Should not throw and fallback to default
		assert.doesNotThrow(() => clearTimer(timerId, undefined));
	});
});

test("ValidationError", async (t) => {
	await t.test("should create error with message and code", () => {
		const error = new ValidationError("Test message", "TEST_CODE");

		assert.strictEqual(error.message, "Test message");
		assert.strictEqual(error.code, "TEST_CODE");
		assert.strictEqual(error.name, "ValidationError");
		assert.ok(error instanceof Error);
		assert.ok(error instanceof ValidationError);
	});

	await t.test("should handle undefined code", () => {
		const error = new ValidationError("Test message");

		assert.strictEqual(error.message, "Test message");
		assert.strictEqual(error.code, undefined);
		assert.strictEqual(error.name, "ValidationError");
	});

	await t.test("should handle empty message", () => {
		const error = new ValidationError("", "EMPTY");

		assert.strictEqual(error.message, "");
		assert.strictEqual(error.code, "EMPTY");
		assert.strictEqual(error.name, "ValidationError");
	});
});

test("RequestValidator", async (t) => {
	await t.test("should create validator with default limits", () => {
		const validator = new RequestValidator();

		assert.strictEqual(validator.maxSize, getMaxBodySize());
		assert.strictEqual(validator.maxChunks, getMaxChunks());
		assert.strictEqual(validator.totalSize, 0);
		assert.strictEqual(validator.chunkCount, 0);
		assert.strictEqual(validator.isValid, true);
		assert.strictEqual(validator.error, null);
	});

	await t.test("should create validator with custom limits", () => {
		const validator = new RequestValidator({
			maxSize: 1000,
			maxChunks: 50,
		});

		assert.strictEqual(validator.maxSize, 1000);
		assert.strictEqual(validator.maxChunks, 50);
		assert.strictEqual(validator.totalSize, 0);
		assert.strictEqual(validator.chunkCount, 0);
		assert.strictEqual(validator.isValid, true);
		assert.strictEqual(validator.error, null);
	});

	await t.test("should create validator with partial custom limits", () => {
		const validator = new RequestValidator({ maxSize: 2000 });

		assert.strictEqual(validator.maxSize, 2000);
		assert.strictEqual(validator.maxChunks, getMaxChunks());
	});

	await t.test("should validate chunk within limits", () => {
		const validator = new RequestValidator({ maxSize: 100, maxChunks: 5 });
		const chunk = Buffer.from("small chunk");

		const result = validator.validateChunk(chunk);

		assert.strictEqual(result, true);
		assert.strictEqual(validator.totalSize, chunk.length);
		assert.strictEqual(validator.chunkCount, 1);
		assert.strictEqual(validator.isValid, true);
		assert.strictEqual(validator.error, null);
	});

	await t.test("should reject chunk when size limit exceeded", () => {
		const validator = new RequestValidator({ maxSize: 10, maxChunks: 5 });
		const chunk = Buffer.from("this chunk is too large");

		const result = validator.validateChunk(chunk);

		assert.strictEqual(result, false);
		assert.strictEqual(validator.totalSize, chunk.length);
		assert.strictEqual(validator.chunkCount, 1);
		assert.strictEqual(validator.isValid, false);
		assert.ok(validator.error instanceof ValidationError);
		assert.strictEqual(validator.error.code, "BODY_TOO_LARGE");
		assert.ok(validator.error.message.includes("Request body too large"));
	});

	await t.test("should reject chunk when chunk limit exceeded", () => {
		const validator = new RequestValidator({ maxSize: 1000, maxChunks: 2 });

		// Add two valid chunks
		assert.strictEqual(validator.validateChunk(Buffer.from("1")), true);
		assert.strictEqual(validator.validateChunk(Buffer.from("2")), true);

		// Third chunk should be rejected
		const result = validator.validateChunk(Buffer.from("3"));

		assert.strictEqual(result, false);
		assert.strictEqual(validator.chunkCount, 3);
		assert.strictEqual(validator.isValid, false);
		assert.ok(validator.error instanceof ValidationError);
		assert.strictEqual(validator.error.code, "TOO_MANY_CHUNKS");
		assert.ok(validator.error.message.includes("Too many chunks"));
	});

	await t.test("should reject subsequent chunks after becoming invalid", () => {
		const validator = new RequestValidator({ maxSize: 10, maxChunks: 5 });

		// First chunk exceeds size limit
		assert.strictEqual(
			validator.validateChunk(Buffer.from("too large chunk")),
			false,
		);

		// Subsequent chunk should also be rejected
		const result = validator.validateChunk(Buffer.from("small"));

		assert.strictEqual(result, false);
		assert.strictEqual(validator.isValid, false);
	});

	await t.test("should track cumulative size correctly", () => {
		const validator = new RequestValidator({ maxSize: 100, maxChunks: 10 });

		assert.strictEqual(validator.validateChunk(Buffer.from("chunk1")), true);
		assert.strictEqual(validator.totalSize, 6);

		assert.strictEqual(validator.validateChunk(Buffer.from("chunk2")), true);
		assert.strictEqual(validator.totalSize, 12);

		assert.strictEqual(validator.validateChunk(Buffer.from("chunk3")), true);
		assert.strictEqual(validator.totalSize, 18);
	});

	await t.test("should detect cumulative size exceeding limit", () => {
		const validator = new RequestValidator({ maxSize: 15, maxChunks: 10 });

		assert.strictEqual(validator.validateChunk(Buffer.from("12345")), true); // 5 bytes
		assert.strictEqual(validator.validateChunk(Buffer.from("67890")), true); // 10 bytes total
		assert.strictEqual(validator.validateChunk(Buffer.from("abcdef")), false); // 16 bytes total - exceeds limit

		assert.strictEqual(validator.error.code, "BODY_TOO_LARGE");
	});

	await t.test("getState should return current state", () => {
		const validator = new RequestValidator({ maxSize: 100, maxChunks: 5 });

		let state = validator.getState();
		assert.strictEqual(state.totalSize, 0);
		assert.strictEqual(state.chunkCount, 0);
		assert.strictEqual(state.isValid, true);
		assert.strictEqual(state.error, null);

		validator.validateChunk(Buffer.from("test"));

		state = validator.getState();
		assert.strictEqual(state.totalSize, 4);
		assert.strictEqual(state.chunkCount, 1);
		assert.strictEqual(state.isValid, true);
		assert.strictEqual(state.error, null);
	});

	await t.test("getState should return error state", () => {
		const validator = new RequestValidator({ maxSize: 5, maxChunks: 5 });

		validator.validateChunk(Buffer.from("too long"));

		const state = validator.getState();
		assert.strictEqual(state.isValid, false);
		assert.ok(state.error instanceof ValidationError);
		assert.strictEqual(state.error.code, "BODY_TOO_LARGE");
	});

	await t.test("reset should restore initial state", () => {
		const validator = new RequestValidator({ maxSize: 100, maxChunks: 5 });

		// Invalidate the validator
		validator.validateChunk(Buffer.from("test"));
		validator.validateChunk(Buffer.from("a".repeat(200))); // Too large

		assert.strictEqual(validator.isValid, false);
		assert.ok(validator.error);

		validator.reset();

		assert.strictEqual(validator.totalSize, 0);
		assert.strictEqual(validator.chunkCount, 0);
		assert.strictEqual(validator.isValid, true);
		assert.strictEqual(validator.error, null);

		// Should work again after reset
		assert.strictEqual(validator.validateChunk(Buffer.from("new chunk")), true);
	});

	await t.test("should handle zero-length chunks", () => {
		const validator = new RequestValidator({ maxSize: 100, maxChunks: 5 });

		const result = validator.validateChunk(Buffer.alloc(0));

		assert.strictEqual(result, true);
		assert.strictEqual(validator.totalSize, 0);
		assert.strictEqual(validator.chunkCount, 1);
		assert.strictEqual(validator.isValid, true);
	});

	await t.test("should handle exact limit boundaries", () => {
		const validator = new RequestValidator({ maxSize: 10, maxChunks: 2 });

		// Exact size limit
		assert.strictEqual(
			validator.validateChunk(Buffer.from("1234567890")),
			true,
		);
		assert.strictEqual(validator.totalSize, 10);

		// Reset and test exact chunk limit
		validator.reset();
		assert.strictEqual(validator.validateChunk(Buffer.from("a")), true);
		assert.strictEqual(validator.validateChunk(Buffer.from("b")), true);
		assert.strictEqual(validator.chunkCount, 2);

		// One more should fail
		assert.strictEqual(validator.validateChunk(Buffer.from("c")), false);
	});
});

test("createValidator", async (t) => {
	await t.test("should create validator with default limits", () => {
		const validator = createValidator();

		assert.ok(validator instanceof RequestValidator);
		assert.strictEqual(validator.maxSize, getMaxBodySize());
		assert.strictEqual(validator.maxChunks, getMaxChunks());
	});

	await t.test("should create validator with custom limits", () => {
		const validator = createValidator({ maxSize: 500, maxChunks: 10 });

		assert.ok(validator instanceof RequestValidator);
		assert.strictEqual(validator.maxSize, 500);
		assert.strictEqual(validator.maxChunks, 10);
	});

	await t.test("should create validator with undefined limits", () => {
		const validator = createValidator(undefined);

		assert.ok(validator instanceof RequestValidator);
		assert.strictEqual(validator.maxSize, getMaxBodySize());
		assert.strictEqual(validator.maxChunks, getMaxChunks());
	});
});

test("ResourceManager", async (t) => {
	await t.test(
		"should create manager with default timer implementation",
		() => {
			const manager = new ResourceManager();

			assert.ok(manager.timerImpl);
			assert.strictEqual(manager.request, null);
			assert.strictEqual(manager.timerId, null);
			assert.deepStrictEqual(manager.eventListeners, []);
		},
	);

	await t.test("should create manager with custom timer implementation", () => {
		const mockTimer = {
			create: () => "mock-timer",
			clear: () => {},
		};
		const manager = new ResourceManager(mockTimer);

		assert.strictEqual(manager.timerImpl, mockTimer);
		assert.strictEqual(manager.request, null);
		assert.strictEqual(manager.timerId, null);
	});

	await t.test("should set request and clear listeners", () => {
		const manager = new ResourceManager();
		const mockRequest = new EventEmitter();

		manager.setRequest(mockRequest);

		assert.strictEqual(manager.request, mockRequest);
		assert.deepStrictEqual(manager.eventListeners, []);
	});

	await t.test("should add listener and track it", () => {
		const manager = new ResourceManager();
		const mockRequest = new EventEmitter();
		const listener = () => {};

		manager.setRequest(mockRequest);
		manager.addListener("data", listener);

		assert.strictEqual(manager.eventListeners.length, 1);
		assert.strictEqual(manager.eventListeners[0].event, "data");
		assert.strictEqual(manager.eventListeners[0].listener, listener);
		assert.strictEqual(mockRequest.listenerCount("data"), 1);
	});

	await t.test("should add multiple listeners", () => {
		const manager = new ResourceManager();
		const mockRequest = new EventEmitter();
		const dataListener = () => {};
		const endListener = () => {};

		manager.setRequest(mockRequest);
		manager.addListener("data", dataListener);
		manager.addListener("end", endListener);

		assert.strictEqual(manager.eventListeners.length, 2);
		assert.strictEqual(mockRequest.listenerCount("data"), 1);
		assert.strictEqual(mockRequest.listenerCount("end"), 1);
	});

	await t.test(
		"should throw error when adding listener without request",
		() => {
			const manager = new ResourceManager();
			const listener = () => {};

			assert.throws(() => {
				manager.addListener("data", listener);
			}, /Request not set/);
		},
	);

	await t.test("should set timeout using timer implementation", () => {
		let callbackCalled = false;
		const mockTimer = {
			create: (callback, delay) => {
				assert.strictEqual(typeof callback, "function");
				assert.strictEqual(delay, 1000);
				// Call immediately for testing
				callback();
				return "mock-timer-id";
			},
			clear: () => {},
		};

		const manager = new ResourceManager(mockTimer);
		manager.setTimeout(() => {
			callbackCalled = true;
		}, 1000);

		assert.strictEqual(callbackCalled, true);
		assert.strictEqual(manager.timerId, "mock-timer-id");
	});

	await t.test("should clear existing timeout when setting new one", () => {
		let clearCalled = false;
		const mockTimer = {
			create: () => "new-timer-id",
			clear: (id) => {
				clearCalled = true;
				assert.strictEqual(id, "old-timer-id");
			},
		};

		const manager = new ResourceManager(mockTimer);
		manager.timerId = "old-timer-id";
		manager.setTimeout(() => {}, 1000);

		assert.strictEqual(clearCalled, true);
		assert.strictEqual(manager.timerId, "new-timer-id");
	});

	await t.test("should clear timeout", () => {
		let clearCalled = false;
		const mockTimer = {
			create: () => "timer-id",
			clear: (id) => {
				clearCalled = true;
				assert.strictEqual(id, "timer-id");
			},
		};

		const manager = new ResourceManager(mockTimer);
		manager.timerId = "timer-id";
		manager.clearTimeout();

		assert.strictEqual(clearCalled, true);
		assert.strictEqual(manager.timerId, null);
	});

	await t.test("should handle clearTimeout when no timer set", () => {
		const manager = new ResourceManager();

		// Should not throw
		assert.doesNotThrow(() => manager.clearTimeout());
		assert.strictEqual(manager.timerId, null);
	});

	await t.test("should clear all listeners", () => {
		const manager = new ResourceManager();
		const mockRequest = new EventEmitter();
		const dataListener = () => {};
		const endListener = () => {};

		manager.setRequest(mockRequest);
		manager.addListener("data", dataListener);
		manager.addListener("end", endListener);

		assert.strictEqual(mockRequest.listenerCount("data"), 1);
		assert.strictEqual(mockRequest.listenerCount("end"), 1);

		manager.clearListeners();

		assert.strictEqual(mockRequest.listenerCount("data"), 0);
		assert.strictEqual(mockRequest.listenerCount("end"), 0);
		assert.strictEqual(manager.eventListeners.length, 0);
	});

	await t.test(
		"should clear non-error listeners while preserving error listeners",
		() => {
			const manager = new ResourceManager();
			const mockRequest = new EventEmitter();
			const dataListener = () => {};
			const endListener = () => {};
			const errorListener = () => {};

			manager.setRequest(mockRequest);
			manager.addListener("data", dataListener);
			manager.addListener("end", endListener);
			manager.addListener("error", errorListener);

			assert.strictEqual(mockRequest.listenerCount("data"), 1);
			assert.strictEqual(mockRequest.listenerCount("end"), 1);
			assert.strictEqual(mockRequest.listenerCount("error"), 1);
			assert.strictEqual(manager.eventListeners.length, 3);

			manager.clearNonErrorListeners();

			assert.strictEqual(mockRequest.listenerCount("data"), 0);
			assert.strictEqual(mockRequest.listenerCount("end"), 0);
			assert.strictEqual(mockRequest.listenerCount("error"), 1);
			assert.strictEqual(manager.eventListeners.length, 1);
			assert.strictEqual(manager.eventListeners[0].event, "error");
		},
	);

	await t.test("should handle clearListeners when no request set", () => {
		const manager = new ResourceManager();

		// Should not throw
		assert.doesNotThrow(() => manager.clearListeners());
	});

	await t.test(
		"should handle clearNonErrorListeners when no request set",
		() => {
			const manager = new ResourceManager();

			// Should not throw
			assert.doesNotThrow(() => manager.clearNonErrorListeners());
		},
	);

	await t.test("should cleanup all resources", () => {
		let clearTimerCalled = false;
		const mockTimer = {
			create: () => "timer-id",
			clear: () => {
				clearTimerCalled = true;
			},
		};

		const manager = new ResourceManager(mockTimer);
		const mockRequest = new EventEmitter();

		manager.setRequest(mockRequest);
		manager.addListener("data", () => {});
		manager.setTimeout(() => {}, 1000);

		assert.strictEqual(mockRequest.listenerCount("data"), 1);
		assert.strictEqual(manager.timerId, "timer-id");

		manager.cleanup();

		assert.strictEqual(mockRequest.listenerCount("data"), 0);
		assert.strictEqual(manager.eventListeners.length, 0);
		assert.strictEqual(clearTimerCalled, true);
		assert.strictEqual(manager.timerId, null);
	});

	await t.test("getState should return correct state", () => {
		const manager = new ResourceManager();

		let state = manager.getState();
		assert.strictEqual(state.hasRequest, false);
		assert.strictEqual(state.hasTimer, false);
		assert.strictEqual(state.listenerCount, 0);

		const mockRequest = new EventEmitter();
		manager.setRequest(mockRequest);
		manager.addListener("data", () => {});
		manager.setTimeout(() => {}, 1000);

		state = manager.getState();
		assert.strictEqual(state.hasRequest, true);
		assert.strictEqual(state.hasTimer, true);
		assert.strictEqual(state.listenerCount, 1);
	});

	await t.test("should handle listener removal correctly", () => {
		const manager = new ResourceManager();
		const mockRequest = new EventEmitter();
		let dataCallCount = 0;
		let endCallCount = 0;

		const dataListener = () => {
			dataCallCount++;
		};
		const endListener = () => {
			endCallCount++;
		};

		manager.setRequest(mockRequest);
		manager.addListener("data", dataListener);
		manager.addListener("end", endListener);

		// Emit events to verify listeners are attached
		mockRequest.emit("data", Buffer.from("test"));
		mockRequest.emit("end");

		assert.strictEqual(dataCallCount, 1);
		assert.strictEqual(endCallCount, 1);

		// Clear listeners and verify they're removed
		manager.clearListeners();

		mockRequest.emit("data", Buffer.from("test2"));
		mockRequest.emit("end");

		// Counts should not increase
		assert.strictEqual(dataCallCount, 1);
		assert.strictEqual(endCallCount, 1);
	});

	await t.test("should reset listeners when setting new request", () => {
		const manager = new ResourceManager();
		const oldRequest = new EventEmitter();
		const newRequest = new EventEmitter();

		manager.setRequest(oldRequest);
		manager.addListener("data", () => {});

		assert.strictEqual(manager.eventListeners.length, 1);

		manager.setRequest(newRequest);

		assert.strictEqual(manager.eventListeners.length, 0);
		assert.strictEqual(manager.request, newRequest);
	});
});

test("createResourceManager", async (t) => {
	await t.test("should create manager with default timer", () => {
		const manager = createResourceManager();

		assert.ok(manager instanceof ResourceManager);
		assert.strictEqual(manager.timerImpl, DEFAULT_TIMER_IMPL);
	});

	await t.test("should create manager with custom timer", () => {
		const customTimer = {
			create: () => "custom",
			clear: () => {},
		};
		const manager = createResourceManager(customTimer);

		assert.ok(manager instanceof ResourceManager);
		assert.strictEqual(manager.timerImpl, customTimer);
	});

	await t.test("should create manager with undefined timer", () => {
		const manager = createResourceManager(undefined);

		assert.ok(manager instanceof ResourceManager);
		assert.strictEqual(manager.timerImpl, DEFAULT_TIMER_IMPL);
	});
});

test("readBody", async (t) => {
	await t.test("should read body with single chunk", async () => {
		const data = Buffer.from("Hello, World!");
		const mockRequest = createMockRequest({ chunks: [data] });

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(result, data);
	});

	await t.test("should read body with multiple chunks", async () => {
		const chunk1 = Buffer.from("Hello, ");
		const chunk2 = Buffer.from("World!");
		const mockRequest = createMockRequest({ chunks: [chunk1, chunk2] });

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(result, Buffer.concat([chunk1, chunk2]));
	});

	await t.test("should return undefined for empty body", async () => {
		const mockRequest = createMockRequest({ chunks: [] });

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should handle request stream error", async () => {
		const testError = new Error("Connection lost");
		const mockRequest = createMockRequest({
			shouldError: true,
			error: testError,
		});

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test(
		"should handle request stream error with custom error",
		async () => {
			const customError = new TypeError("Invalid data");
			const mockRequest = createMockRequest({
				shouldError: true,
				error: customError,
			});

			const result = await readBody(mockRequest);

			assert.strictEqual(result, undefined);
		},
	);

	await t.test("should handle large body data", async () => {
		const largeData = Buffer.alloc(1024 * 1024, "A"); // 1MB of data
		const mockRequest = createMockRequest({ chunks: [largeData] });

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(result, largeData);
		assert.strictEqual(result.length, 1024 * 1024);
	});

	await t.test("should handle binary data", async () => {
		const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
		const mockRequest = createMockRequest({ chunks: [binaryData] });

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(result, binaryData);
	});

	await t.test("should handle mixed data types in chunks", async () => {
		const stringChunk = Buffer.from("Hello");
		const binaryChunk = Buffer.from([0x00, 0x01, 0x02]);
		const mockRequest = createMockRequest({
			chunks: [stringChunk, binaryChunk],
		});

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(result, Buffer.concat([stringChunk, binaryChunk]));
	});

	await t.test("should handle many small chunks", async () => {
		const chunks = [];
		for (let i = 0; i < 100; i++) {
			chunks.push(Buffer.from(`chunk${i}`));
		}
		const mockRequest = createMockRequest({ chunks });

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(result, Buffer.concat(chunks));
	});

	await t.test("should handle zero-length chunks", async () => {
		const emptyChunk = Buffer.alloc(0);
		const dataChunk = Buffer.from("data");
		const mockRequest = createMockRequest({
			chunks: [emptyChunk, dataChunk, emptyChunk],
		});

		const result = await readBody(mockRequest);

		assert.deepStrictEqual(
			result,
			Buffer.concat([emptyChunk, dataChunk, emptyChunk]),
		);
	});

	await t.test(
		"should handle request that emits data after error",
		async () => {
			const mockRequest = new EventEmitter();

			setImmediate(() => {
				mockRequest.emit("error", new Error("Test error"));
				// This data should be ignored since error was already emitted
				mockRequest.emit("data", Buffer.from("ignored"));
			});

			const result = await readBody(mockRequest);

			assert.strictEqual(result, undefined);
		},
	);

	await t.test("should handle request that emits end after error", async () => {
		const mockRequest = new EventEmitter();

		setImmediate(() => {
			mockRequest.emit("error", new Error("Test error"));
			// This end should be ignored since error was already emitted
			mockRequest.emit("end");
		});

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should handle request that emits multiple errors", async () => {
		const mockRequest = new EventEmitter();

		setImmediate(() => {
			mockRequest.emit("error", new Error("First error"));
			// Second error should be ignored
			mockRequest.emit("error", new Error("Second error"));
		});

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test(
		"should handle request that emits multiple end events",
		async () => {
			const data = Buffer.from("test");
			const mockRequest = new EventEmitter();

			setImmediate(() => {
				mockRequest.emit("data", data);
				mockRequest.emit("end");
				// Second end should be ignored
				mockRequest.emit("end");
			});

			const result = await readBody(mockRequest);

			assert.deepStrictEqual(result, data);
		},
	);

	await t.test("should handle request with null error", async () => {
		const mockRequest = createMockRequest({ shouldError: true, error: null });

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should handle request with undefined error", async () => {
		const mockRequest = createMockRequest({
			shouldError: true,
			error: undefined,
		});

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should handle request with string error", async () => {
		const mockRequest = createMockRequest({
			shouldError: true,
			error: "String error",
		});

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should handle request with number error", async () => {
		const mockRequest = createMockRequest({ shouldError: true, error: 42 });

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should handle request with object error", async () => {
		const mockRequest = createMockRequest({
			shouldError: true,
			error: { message: "Object error" },
		});

		const result = await readBody(mockRequest);

		assert.strictEqual(result, undefined);
	});

	await t.test("should timeout large requests", async () => {
		let timeoutCalled = false;
		const mockTimer = {
			create: (callback, delay) => {
				assert.strictEqual(delay, getTimeout());
				// Call timeout immediately for testing
				setImmediate(() => {
					timeoutCalled = true;
					callback();
				});
				return "timer-id";
			},
			clear: () => {},
		};

		const mockRequest = createMockRequest({
			chunks: [Buffer.from("data")],
			shouldDelayEnd: true, // Don't emit end event
		});

		const result = await readBody(mockRequest, { timerImpl: mockTimer });

		assert.strictEqual(timeoutCalled, true);
		assert.strictEqual(result, undefined);
	});

	await t.test("should reject when body size limit exceeded", async () => {
		const mockRequest = createMockRequest({
			chunks: [Buffer.from("a".repeat(100))], // Large chunk
		});

		const result = await readBody(mockRequest, {
			limits: { maxSize: 10, maxChunks: 10 },
		});

		assert.strictEqual(result, undefined);
	});

	await t.test("should reject when chunk limit exceeded", async () => {
		const chunks = Array.from({ length: 5 }, () => Buffer.from("x"));
		const mockRequest = createMockRequest({ chunks });

		const result = await readBody(mockRequest, {
			limits: { maxSize: 1000, maxChunks: 3 },
		});

		assert.strictEqual(result, undefined);
	});

	await t.test(
		"should handle buffer concatenation errors gracefully",
		async () => {
			const mockRequest = createMockRequest({
				chunks: [Buffer.from("data1"), Buffer.from("data2")],
			});

			// Mock Buffer.concat to throw an error
			const originalConcat = Buffer.concat;
			Buffer.concat = () => {
				throw new Error("Memory error");
			};

			try {
				const result = await readBody(mockRequest);
				assert.strictEqual(result, undefined);
			} finally {
				// Restore original Buffer.concat
				Buffer.concat = originalConcat;
			}
		},
	);
});
