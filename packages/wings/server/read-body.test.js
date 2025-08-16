import assert from "node:assert";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { readBody } from "./read-body.js";

/**
 * Helper function to create a mock request object that behaves like an HTTP request stream.
 *
 * @param {Object} options - Configuration options
 * @param {Buffer[]} options.chunks - Array of data chunks to emit
 * @param {boolean} options.shouldError - Whether to emit an error event
 * @param {Error} options.error - The error to emit (if shouldError is true)
 * @returns {EventEmitter} A mock request object
 */
function createMockRequest({
	chunks = [],
	shouldError = false,
	error = new Error("Test error"),
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
			// Emit end event
			mockRequest.emit("end");
		}
	});

	return mockRequest;
}

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
});
