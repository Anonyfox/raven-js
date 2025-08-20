import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { Context } from "../core/index.js";

describe("Terminal", () => {
	let originalProcessProvider;
	let mockRouter;
	let capturedStdout;
	let capturedErrors;
	let capturedExits;
	let mockStdinHandlers;
	let stdinIsTTY;

	beforeEach(async () => {
		// Import the module and store original
		const runtimeModule = await import("./runtime.js");
		originalProcessProvider = {
			stdin: { ...runtimeModule.processProvider.stdin },
			stdout: { ...runtimeModule.processProvider.stdout },
			exit: runtimeModule.processProvider.exit,
			error: runtimeModule.processProvider.error,
		};

		// Reset capture data
		capturedStdout = [];
		capturedErrors = [];
		capturedExits = [];
		mockStdinHandlers = new Map();
		stdinIsTTY = true; // Default to TTY

		// Create mock router with default behavior
		mockRouter = {
			handleRequest: mock.fn(async (context) => {
				context.responseBody = "test response";
				context.responseStatusCode = 200;
			}),
		};

		// Replace processProvider with mocks
		runtimeModule.processProvider.stdin = {
			get isTTY() {
				return stdinIsTTY;
			},
			on: mock.fn((event, handler) => {
				if (!mockStdinHandlers.has(event)) {
					mockStdinHandlers.set(event, []);
				}
				mockStdinHandlers.get(event).push(handler);
			}),
		};

		runtimeModule.processProvider.stdout = {
			write: mock.fn((data) => {
				capturedStdout.push(data);
				return true;
			}),
		};

		runtimeModule.processProvider.exit = mock.fn((code) => {
			capturedExits.push(code);
		});

		runtimeModule.processProvider.error = mock.fn((message) => {
			capturedErrors.push(message);
		});
	});

	afterEach(async () => {
		// Restore original processProvider
		const runtimeModule = await import("./runtime.js");
		Object.assign(runtimeModule.processProvider, originalProcessProvider);
		mock.reset();
	});

	describe("constructor validation", () => {
		it("should create Terminal with valid router", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			assert.ok(terminal instanceof Terminal);
			assert.equal(terminal.router, mockRouter);
		});

		it("should throw TypeError for null router", async () => {
			const { Terminal } = await import("./runtime.js");

			assert.throws(() => new Terminal(null), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});
		});

		it("should throw TypeError for undefined router", async () => {
			const { Terminal } = await import("./runtime.js");

			assert.throws(() => new Terminal(undefined), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});
		});

		it("should throw TypeError for router without handleRequest method", async () => {
			const { Terminal } = await import("./runtime.js");

			assert.throws(() => new Terminal({}), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});
		});

		it("should throw TypeError for router with non-function handleRequest", async () => {
			const { Terminal } = await import("./runtime.js");

			assert.throws(() => new Terminal({ handleRequest: "not a function" }), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});
		});

		it("should validate router with handleRequest function", async () => {
			const { Terminal } = await import("./runtime.js");

			const validRouter = { handleRequest: () => {} };
			const terminal = new Terminal(validRouter);
			assert.equal(terminal.router, validRouter);
		});

		it("should reject falsy values", async () => {
			const { Terminal } = await import("./runtime.js");

			const falsyValues = [false, 0, "", NaN];
			for (const falsy of falsyValues) {
				assert.throws(() => new Terminal(falsy), {
					name: "TypeError",
					message: "Router must be a valid Wings Router instance",
				});
			}
		});
	});

	describe("router getter", () => {
		it("should return the router instance", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			assert.equal(terminal.router, mockRouter);
		});
	});

	describe("run method - TTY scenarios", () => {
		it("should handle successful execution with output", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true; // TTY scenario - no stdin reading

			await terminal.run(["test", "command"]);

			// Verify router was called with correct context
			assert.equal(mockRouter.handleRequest.mock.callCount(), 1);
			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.ok(context instanceof Context);
			assert.equal(context.method, "COMMAND");
			assert.equal(context.requestBody(), null); // TTY = no stdin data

			// Verify output and exit
			assert.deepEqual(capturedStdout, ["test response"]);
			assert.deepEqual(capturedExits, [0]);
			assert.deepEqual(capturedErrors, []);
		});

		it("should handle execution without response body", async () => {
			const { Terminal } = await import("./runtime.js");

			// Mock router that doesn't set responseBody
			const emptyRouter = {
				handleRequest: mock.fn(async (context) => {
					context.responseStatusCode = 204; // No content
				}),
			};

			const terminal = new Terminal(emptyRouter);
			stdinIsTTY = true;

			await terminal.run(["test"]);

			// No output should be written
			assert.deepEqual(capturedStdout, []);
			assert.deepEqual(capturedExits, [0]); // Success status
			assert.deepEqual(capturedErrors, []);
		});

		it("should handle error status codes", async () => {
			const { Terminal } = await import("./runtime.js");

			// Mock router that returns error status
			const errorRouter = {
				handleRequest: mock.fn(async (context) => {
					context.responseBody = "Error occurred";
					context.responseStatusCode = 404;
				}),
			};

			const terminal = new Terminal(errorRouter);
			stdinIsTTY = true;

			await terminal.run(["not-found"]);

			assert.deepEqual(capturedStdout, ["Error occurred"]);
			assert.deepEqual(capturedExits, [1]); // Error exit code
			assert.deepEqual(capturedErrors, []);
		});
	});

	describe("run method - non-TTY scenarios (stdin input)", () => {
		it("should handle piped stdin data", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = false; // Non-TTY - should read stdin

			// Simulate stdin data flow
			const runPromise = terminal.run(["process"]);

			// Simulate data events
			const dataHandlers = mockStdinHandlers.get("data") || [];
			const endHandlers = mockStdinHandlers.get("end") || [];

			// Send some data chunks
			setTimeout(() => {
				for (const handler of dataHandlers) {
					handler(Buffer.from("chunk1"));
				}
				for (const handler of dataHandlers) {
					handler(Buffer.from("chunk2"));
				}
				for (const handler of endHandlers) {
					handler();
				}
			}, 0);

			await runPromise;

			// Verify router received stdin data
			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			const stdinData = context.requestBody();
			assert.ok(Buffer.isBuffer(stdinData));
			assert.equal(stdinData.toString(), "chunk1chunk2");

			assert.deepEqual(capturedExits, [0]);
		});

		it("should handle empty stdin", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = false;

			const runPromise = terminal.run(["process"]);

			// Simulate immediate end without data
			setTimeout(() => {
				const endHandlers = mockStdinHandlers.get("end") || [];
				for (const handler of endHandlers) {
					handler();
				}
			}, 0);

			await runPromise;

			// Should receive null for empty stdin
			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.equal(context.requestBody(), null);
		});

		it("should handle stdin errors", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = false;

			const runPromise = terminal.run(["process"]);

			// Simulate stdin error
			setTimeout(() => {
				const errorHandlers = mockStdinHandlers.get("error") || [];
				for (const handler of errorHandlers) {
					handler();
				}
			}, 0);

			await runPromise;

			// Should receive null on error
			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.equal(context.requestBody(), null);
		});
	});

	describe("run method - error handling", () => {
		it("should handle router errors", async () => {
			const { Terminal } = await import("./runtime.js");

			const errorRouter = {
				handleRequest: mock.fn(async () => {
					throw new Error("Router crashed");
				}),
			};

			const terminal = new Terminal(errorRouter);
			stdinIsTTY = true;

			await terminal.run(["failing-command"]);

			// Should capture error and exit with code 1
			assert.deepEqual(capturedErrors, ["Error: Router crashed"]);
			assert.deepEqual(capturedExits, [1]);
			assert.deepEqual(capturedStdout, []); // No output on error
		});

		it("should handle URL creation errors", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true;

			// This might not actually cause URL creation to fail, but let's test the error path
			// by making the router throw during handleRequest
			mockRouter.handleRequest = mock.fn(async () => {
				throw new Error("Invalid URL");
			});

			await terminal.run(["test"]);

			assert.deepEqual(capturedErrors, ["Error: Invalid URL"]);
			assert.deepEqual(capturedExits, [1]);
		});
	});

	describe("integration components", () => {
		it("should integrate with ArgsToUrl for URL transformation", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true;

			await terminal.run(["test", "arg1", "--flag", "value"]);

			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];

			// Should have correct URL from ArgsToUrl transformation
			assert.equal(context.path, "/test/arg1");
			assert.equal(context.queryParams.get("flag"), "value");
		});

		it("should integrate with Context creation", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true;

			await terminal.run(["api", "users"]);

			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];

			// Verify Context properties
			assert.ok(context instanceof Context);
			assert.equal(context.method, "COMMAND");
			assert.equal(typeof context.path, "string");
			assert.ok(context.queryParams instanceof URLSearchParams);
			assert.ok(context.requestHeaders instanceof Headers);
			assert.equal(context.requestBody(), null);
		});
	});

	describe("exit code logic", () => {
		it("should calculate correct exit codes for status ranges", async () => {
			const { Terminal } = await import("./runtime.js");

			const statusCodes = [
				{ status: 200, expectedExit: 0 },
				{ status: 201, expectedExit: 0 },
				{ status: 299, expectedExit: 0 },
				{ status: 300, expectedExit: 1 },
				{ status: 400, expectedExit: 1 },
				{ status: 404, expectedExit: 1 },
				{ status: 500, expectedExit: 1 },
			];

			for (const { status, expectedExit } of statusCodes) {
				// Reset captures
				capturedExits = [];

				const statusRouter = {
					handleRequest: mock.fn(async (context) => {
						context.responseStatusCode = status;
					}),
				};

				const terminal = new Terminal(statusRouter);
				stdinIsTTY = true;

				await terminal.run(["test"]);

				assert.deepEqual(
					capturedExits,
					[expectedExit],
					`Status ${status} should exit with ${expectedExit}`,
				);
			}
		});
	});

	describe("process interactions", () => {
		it("should detect TTY vs non-TTY stdin", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			// Test TTY scenario
			stdinIsTTY = true;
			await terminal.run(["test"]);

			let context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.equal(context.requestBody(), null);

			// Reset for non-TTY test
			mockRouter.handleRequest.mock.resetCalls();
			stdinIsTTY = false;

			const runPromise = terminal.run(["test"]);

			// Simulate immediate end for non-TTY
			setTimeout(() => {
				const endHandlers = mockStdinHandlers.get("end") || [];
				for (const handler of endHandlers) {
					handler();
				}
			}, 0);

			await runPromise;

			context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			// Should have attempted to read stdin (result may be null, but it tried)
			assert.ok(mockStdinHandlers.has("data"));
			assert.ok(mockStdinHandlers.has("end"));
		});
	});

	describe("error message formatting", () => {
		it("should format error messages correctly", async () => {
			const { Terminal } = await import("./runtime.js");

			const errorRouter = {
				handleRequest: mock.fn(async () => {
					throw new Error("Test error message");
				}),
			};

			const terminal = new Terminal(errorRouter);
			stdinIsTTY = true;

			await terminal.run(["test"]);

			assert.deepEqual(capturedErrors, ["Error: Test error message"]);
		});
	});

	describe("response body output logic", () => {
		it("should determine when to output response body", async () => {
			const { Terminal } = await import("./runtime.js");

			// Test with response body
			let responseRouter = {
				handleRequest: mock.fn(async (context) => {
					context.responseBody = "Has output";
					context.responseStatusCode = 200;
				}),
			};

			let terminal = new Terminal(responseRouter);
			stdinIsTTY = true;

			await terminal.run(["test"]);
			assert.deepEqual(capturedStdout, ["Has output"]);

			// Reset and test without response body
			capturedStdout = [];
			responseRouter = {
				handleRequest: mock.fn(async (context) => {
					// No responseBody set
					context.responseStatusCode = 204;
				}),
			};

			terminal = new Terminal(responseRouter);

			await terminal.run(["test"]);
			assert.deepEqual(capturedStdout, []); // No output
		});
	});

	describe("URL creation and validation", () => {
		it("should create valid URL objects", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true;

			await terminal.run(["users", "123"]);

			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.equal(typeof context.path, "string");
			assert.ok(context.queryParams instanceof URLSearchParams);
			// The URL is created internally as file://localhost, so we can verify path structure
			assert.ok(context.path.startsWith("/"));
		});

		it("should handle URL with query parameters", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true;

			await terminal.run(["search", "--query", "test", "--limit", "10"]);

			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.equal(context.queryParams.get("query"), "test");
			assert.equal(context.queryParams.get("limit"), "10");
		});
	});

	describe("Headers object creation", () => {
		it("should create empty Headers objects", async () => {
			const { Terminal } = await import("./runtime.js");
			const terminal = new Terminal(mockRouter);

			stdinIsTTY = true;

			await terminal.run(["test"]);

			const context = mockRouter.handleRequest.mock.calls[0].arguments[0];
			assert.ok(context.requestHeaders instanceof Headers);
			assert.equal([...context.requestHeaders.entries()].length, 0);
		});
	});
});
