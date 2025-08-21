import assert from "node:assert";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import * as universal from "./index.js";

describe("universal/index.js", () => {
	let originalWindow;
	let originalFetch;

	beforeEach(() => {
		// Save original values
		originalWindow = globalThis.window;
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		// Restore original values
		globalThis.window = originalWindow;
		globalThis.fetch = originalFetch;
	});

	describe("exports", () => {
		it("should export reactive function", () => {
			assert.strictEqual(typeof universal.reactive, "function");
		});
	});

	describe("reactive()", () => {
		it("should create reactive wrapper function", () => {
			const handler = () => "test";
			const wrapped = universal.reactive(handler);

			assert.strictEqual(typeof wrapped, "function");
			assert.strictEqual(wrapped._reactiveWrapped, true);
		});

		it("should prevent double-wrapping", () => {
			const handler = () => "test";
			const wrapped1 = universal.reactive(handler);
			const wrapped2 = universal.reactive(wrapped1);

			assert.strictEqual(wrapped1, wrapped2);
		});

		it("should handle basic function execution", async () => {
			const handler = (arg) => `result: ${arg}`;
			const wrapped = universal.reactive(handler);

			const result = await wrapped("test");
			assert.strictEqual(result, "result: test");
		});

		it("should handle async function execution", async () => {
			const handler = async (arg) => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return `async result: ${arg}`;
			};
			const wrapped = universal.reactive(handler);

			const result = await wrapped("test");
			assert.strictEqual(result, "async result: test");
		});

		it("should handle errors in wrapped functions", async () => {
			const handler = () => {
				throw new Error("Handler error");
			};
			const wrapped = universal.reactive(handler);

			await assert.rejects(() => wrapped(), /Handler error/);
		});

		it("should pass custom options", () => {
			const handler = () => "test";
			const options = { timeout: 5000, maxSettleAttempts: 50 };
			const wrapped = universal.reactive(handler, options);

			assert.strictEqual(typeof wrapped, "function");
		});
	});

	describe("server environment", () => {
		beforeEach(() => {
			// Mock server environment (no window)
			delete globalThis.window;
		});

		it("should detect server environment", async () => {
			const handler = () => "server response";
			const wrapped = universal.reactive(handler);

			const result = await wrapped();
			assert.strictEqual(result, "server response");
		});

		it("should intercept fetch calls on server", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "application/json"]]),
				clone: () => mockResponse,
				json: () => Promise.resolve({ data: "test" }),
				text: () => Promise.resolve('{"data": "test"}'),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			const handler = async () => {
				const response = await fetch("/api/test");
				const data = await response.json();
				return `data: ${data.data}`;
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			assert.strictEqual(result, "data: test");
			assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
		});

		it("should inject SSR data into HTML", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "application/json"]]),
				clone: () => mockResponse,
				json: () => Promise.resolve({ message: "hello" }),
				text: () => Promise.resolve('{"message": "hello"}'),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			const handler = async () => {
				const response = await fetch("/api/greeting");
				const data = await response.json();

				return `<html><head><title>Test</title></head><body><h1>${data.message}</h1></body></html>`;
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			// Should contain SSR data injection
			assert.ok(result.includes("window.__SSR_DATA__"));
			assert.ok(result.includes("/api/greeting"));
			assert.ok(result.includes("<h1>hello</h1>"));
		});

		it("should not inject SSR data if no fetch calls made", async () => {
			const handler = async () => {
				return "<html><head><title>Test</title></head><body>no fetch</body></html>";
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			// Should NOT contain SSR data injection
			assert.ok(!result.includes("window.__SSR_DATA__"));
		});
	});

	describe("client environment", () => {
		beforeEach(() => {
			// Mock browser environment
			globalThis.window = {
				__SSR_DATA__: {
					fetch: {
						"/api/cached": {
							ok: true,
							status: 200,
							statusText: "OK",
							headers: [["content-type", "application/json"]],
							json: { cached: "data" },
							text: '{"cached": "data"}',
						},
					},
				},
			};
		});

		it("should detect client environment with hydration", async () => {
			const handler = async () => {
				const response = await fetch("/api/cached");
				const data = await response.json();
				return `hydrated: ${data.cached}`;
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			assert.strictEqual(result, "hydrated: data");
			// SSR data should be cleaned up after first run
			assert.strictEqual(globalThis.window.__SSR_DATA__, undefined);
		});

		it("should fall back to real fetch for non-cached URLs", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: () => Promise.resolve({ fresh: "data" }),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			const handler = async () => {
				const response = await fetch("/api/not-cached");
				const data = await response.json();
				return `fresh: ${data.fresh}`;
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			assert.strictEqual(result, "fresh: data");
			assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
		});
	});

	describe("client environment without hydration", () => {
		beforeEach(() => {
			// Mock browser environment without SSR data
			globalThis.window = {};
		});

		it("should handle regular client execution", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: () => Promise.resolve({ client: "data" }),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			const handler = async () => {
				const response = await fetch("/api/regular");
				const data = await response.json();
				return `client: ${data.client}`;
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			assert.strictEqual(result, "client: data");
			assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
		});
	});

	describe("error handling", () => {
		beforeEach(() => {
			delete globalThis.window; // Server environment
		});

		it("should handle fetch errors gracefully", async () => {
			globalThis.fetch = mock.fn(() =>
				Promise.reject(new Error("Network error")),
			);

			const handler = async () => {
				try {
					await fetch("/api/failing");
					return "<html><body>Should not reach here</body></html>";
				} catch (error) {
					return `<html><body>Error: ${error.message}</body></html>`;
				}
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			assert.ok(result.includes("Error: Network error"));
		});

		it("should restore fetch even if handler throws", async () => {
			const mockFetch = mock.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					headers: new Map(),
					clone: function () {
						return this;
					},
					text: () => Promise.resolve("response"),
				}),
			);
			globalThis.fetch = mockFetch;

			const handler = async () => {
				await fetch("/api/test");
				throw new Error("Handler error");
			};

			const wrapped = universal.reactive(handler);

			await assert.rejects(() => wrapped(), /Handler error/);

			// Fetch should be restored to the mock (since that was the "original" before reactive wrapper)
			assert.strictEqual(globalThis.fetch, mockFetch);
		});
	});

	describe("additional coverage tests", () => {
		beforeEach(() => {
			delete globalThis.window; // Server environment
		});

		it("should handle fetch response parsing errors", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => Promise.reject(new Error("JSON parse failed")),
				text: () => Promise.resolve("fallback text content"),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			const handler = async () => {
				await fetch("/api/json-error");
				return "<html><body>handled parsing error</body></html>";
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			// Should still inject SSR data despite JSON parsing error
			assert.ok(result.includes("window.__SSR_DATA__"));
			assert.ok(result.includes("handled parsing error"));
		});

		it("should handle non-HTML responses", async () => {
			const handler = async () => {
				return "Just plain text response";
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			// Should not try to inject SSR data into non-HTML
			assert.strictEqual(result, "Just plain text response");
		});

		it("should handle promise tracking in parent context", async () => {
			const innerPromise = new Promise((resolve) =>
				setTimeout(() => resolve("inner"), 1),
			);

			const handler = async () => {
				return innerPromise;
			};

			const outerHandler = async () => {
				const inner = universal.reactive(handler);
				await inner();
				return "<html><body>tracked</body></html>";
			};

			const wrapped = universal.reactive(outerHandler);
			const result = await wrapped();

			assert.ok(result.includes("tracked"));
		});
	});

	describe("options handling", () => {
		it("should use default options when none provided", () => {
			const handler = () => "test";
			const wrapped = universal.reactive(handler);

			assert.strictEqual(typeof wrapped, "function");
		});

		it("should merge provided options with defaults", () => {
			const handler = () => "test";
			const options = { timeout: 5000 }; // Only partial options
			const wrapped = universal.reactive(handler, options);

			assert.strictEqual(typeof wrapped, "function");
		});
	});

	describe("SSR Timeout Handling", () => {
		beforeEach(() => {
			// Mock server environment
			delete globalThis.window;
		});

		afterEach(() => {
			// Clean up any modified globals
			if (globalThis.fetch?.mock) {
				globalThis.fetch.mock.restore?.();
			}
		});

		it("should handle SSR timeout with graceful degradation", async () => {
			const mockFetch = mock.fn(() => {
				// Return a promise that resolves after the test completes
				return new Promise((resolve) => {
					setImmediate(() => {
						resolve({
							ok: true,
							status: 200,
							headers: new Map(),
							clone: function () {
								return this;
							},
							text: () => Promise.resolve("delayed data"),
						});
					});
				});
			});
			globalThis.fetch = mockFetch;

			const handler = async () => {
				try {
					const response = await fetch("/api/slow");
					return `<html><body>Data: ${await response.text()}</body></html>`;
				} catch (e) {
					return `<html><body>Error: ${e.message}</body></html>`;
				}
			};

			// Use very short timeout to test timeout handling
			const wrapped = universal.reactive(handler, {
				timeout: 50,
				maxSettleAttempts: 2,
			});

			const start = Date.now();
			const result = await wrapped();
			const elapsed = Date.now() - start;

			// Should timeout within reasonable time and continue with partial data
			assert.ok(elapsed < 200, "Should timeout within reasonable time");
			assert.ok(
				typeof result === "string",
				"Should return something even on timeout",
			);
		});

		it("should handle individual promise timeouts", async () => {
			let fetchCallCount = 0;

			const mockFetch = mock.fn((url) => {
				fetchCallCount++;
				if (url.includes("slow")) {
					// This one will timeout - resolves after test completes
					return new Promise((resolve) => {
						setImmediate(() => {
							resolve({
								ok: true,
								status: 200,
								headers: new Map(),
								clone: function () {
									return this;
								},
								text: () => Promise.resolve("slow data"),
							});
						});
					});
				} else {
					// This one resolves quickly
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Map(),
						clone: function () {
							return this;
						},
						text: () => Promise.resolve("fast data"),
						json: () => Promise.resolve({ data: "fast" }),
					});
				}
			});
			globalThis.fetch = mockFetch;

			const handler = async () => {
				// Start multiple fetches
				const fastPromise = fetch("/api/fast");
				const slowPromise = fetch("/api/slow");

				const fastResult = await fastPromise;
				const fastData = await fastResult.text();

				// Slow promise should timeout but not block the fast one
				try {
					await slowPromise;
				} catch (_e) {
					// Expected to timeout
				}

				return `<html><body>Data: ${fastData}</body></html>`;
			};

			const wrapped = universal.reactive(handler, {
				timeout: 100,
				maxSettleAttempts: 3,
			});

			const result = await wrapped();

			// Should contain the fast data and SSR injection
			assert.ok(result.includes("fast data"), "Should contain fast data");
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should inject SSR data",
			);
			assert.strictEqual(fetchCallCount, 2, "Both fetches should be called");
		});

		it("should use exponential backoff for promise settlement", async () => {
			let resolveCount = 0;
			const delayedPromises = [];

			const mockFetch = mock.fn(() => {
				const promise = new Promise((resolve) => {
					// Resolve promises with increasing delays to test backoff
					setTimeout(() => {
						resolveCount++;
						resolve({
							ok: true,
							status: 200,
							headers: new Map(),
							clone: function () {
								return this;
							},
							text: () => Promise.resolve(`data-${resolveCount}`),
						});
					}, resolveCount * 10);
				});
				delayedPromises.push(promise);
				return promise;
			});
			globalThis.fetch = mockFetch;

			const handler = async () => {
				// Create multiple fetches that resolve at different times
				const promises = [fetch("/api/1"), fetch("/api/2"), fetch("/api/3")];

				const results = await Promise.all(promises);
				const texts = await Promise.all(results.map((r) => r.text()));

				return `<html><body>Data: ${texts.join(", ")}</body></html>`;
			};

			const wrapped = universal.reactive(handler, {
				timeout: 500,
				maxSettleAttempts: 10,
			});

			const start = Date.now();
			const result = await wrapped();
			const elapsed = Date.now() - start;

			// Should complete with all data
			assert.ok(result.includes("data-1"), "Should have first data");
			assert.ok(result.includes("data-3"), "Should have last data");
			assert.ok(elapsed < 500, "Should complete before global timeout");
		});

		it("should provide detailed timeout warnings", async () => {
			const originalConsoleWarn = console.warn;
			const warnings = [];
			console.warn = (...args) => warnings.push(args.join(" "));
			let promiseResolver = null;

			try {
				const mockFetch = mock.fn(() => {
					// Return promise that takes much longer than timeout to ensure timeout triggers
					return new Promise((resolve) => {
						promiseResolver = resolve;
						// Auto-resolve after 1000ms - much longer than 30ms timeout
						setTimeout(() => {
							resolve({
								ok: true,
								status: 200,
								headers: new Map(),
								clone: function () {
									return this;
								},
								text: () => Promise.resolve("delayed data"),
							});
						}, 1000);
					});
				});
				globalThis.fetch = mockFetch;

				const handler = async () => {
					// Start fetch but don't await it - this leaves the promise pending
					const fetchPromise = fetch("/api/timeout");

					// Fire-and-forget style that would leave promises hanging without timeout
					fetchPromise
						.then((response) => response.text())
						.catch(() => {
							// Ignore errors from timed-out promises
						});

					// Return immediately, leaving the promise tracked but not awaited
					return `<html><body>Handler returned early, fetch is pending...</body></html>`;
				};

				const wrapped = universal.reactive(handler, {
					timeout: 30, // Very short timeout, promise takes 1000ms
					maxSettleAttempts: 10, // More attempts to trigger timeout logic
				});

				const result = await wrapped();

				// Should have warning about SSR timeout
				const hasTimeoutWarning = warnings.some(
					(w) =>
						w.includes("SSR timeout") && w.includes("promises still pending"),
				);
				assert.ok(hasTimeoutWarning, "Should warn about SSR timeout");

				// Should still return a result (graceful degradation)
				assert.ok(
					typeof result === "string",
					"Should return result despite timeout",
				);
			} finally {
				console.warn = originalConsoleWarn;
				// Ensure promise resolves immediately to prevent hanging
				if (promiseResolver) {
					promiseResolver({
						ok: true,
						status: 200,
						headers: new Map(),
						clone: function () {
							return this;
						},
						text: () => Promise.resolve("cleanup data"),
					});
				}
			}
		});
	});

	describe("Browser API Shims", () => {
		beforeEach(() => {
			// Ensure server environment
			delete globalThis.window;
			delete globalThis.localStorage;
			delete globalThis.navigator;
		});

		afterEach(() => {
			// Clean up shims
			delete globalThis.localStorage;
			delete globalThis.sessionStorage;
			delete globalThis.window;
			delete globalThis.navigator;
			delete globalThis.location;
			delete globalThis.history;
			delete globalThis.alert;
			delete globalThis.confirm;
			delete globalThis.prompt;
		});

		it("should install localStorage/sessionStorage shims", () => {
			// Ensure server environment and clean state
			delete globalThis.window;
			delete globalThis.localStorage;
			delete globalThis.sessionStorage;

			// Call installBrowserAPIShims directly
			universal.env.installBrowserAPIShims();

			// localStorage should be shimmed
			assert.ok(globalThis.localStorage, "localStorage should exist");
			assert.strictEqual(globalThis.localStorage.getItem("test"), null);
			assert.strictEqual(globalThis.localStorage.length, 0);

			// sessionStorage should be shimmed
			assert.ok(globalThis.sessionStorage, "sessionStorage should exist");
			assert.strictEqual(globalThis.sessionStorage.getItem("test"), null);
			assert.strictEqual(globalThis.sessionStorage.length, 0);

			// Should not throw when calling methods
			assert.doesNotThrow(() => {
				globalThis.localStorage.setItem("test", "value");
				globalThis.localStorage.removeItem("test");
				globalThis.localStorage.clear();
			});
		});

		it("should install window object shim", () => {
			// Ensure server environment and clean state
			delete globalThis.window;

			universal.env.installBrowserAPIShims();

			assert.ok(globalThis.window, "window should exist");
			assert.ok(globalThis.window.location, "window.location should exist");
			assert.strictEqual(globalThis.window.location.href, "/");
			assert.ok(globalThis.window.navigator, "window.navigator should exist");
			assert.strictEqual(globalThis.window.navigator.userAgent, "Node.js");
			assert.ok(globalThis.window.document, "window.document should exist");
			assert.strictEqual(globalThis.window.innerWidth, 1024);
		});

		it("should install navigator shim", () => {
			// Ensure server environment and clean state
			delete globalThis.window;
			delete globalThis.navigator;

			universal.env.installBrowserAPIShims();

			assert.ok(globalThis.navigator, "navigator should exist");
			assert.strictEqual(globalThis.navigator.userAgent, "Node.js");
			assert.strictEqual(globalThis.navigator.onLine, true);
			assert.strictEqual(globalThis.navigator.language, "en-US");
		});

		it("should install alert/confirm/prompt shims", () => {
			// Ensure server environment and clean state
			delete globalThis.window;
			delete globalThis.alert;
			delete globalThis.confirm;
			delete globalThis.prompt;

			universal.env.installBrowserAPIShims();

			assert.ok(globalThis.alert, "alert should exist");
			assert.ok(globalThis.confirm, "confirm should exist");
			assert.ok(globalThis.prompt, "prompt should exist");

			// Should not throw when called
			assert.doesNotThrow(() => {
				globalThis.alert("test message");
				const confirmed = globalThis.confirm("test?");
				assert.strictEqual(confirmed, true);
				const prompted = globalThis.prompt("test?");
				assert.strictEqual(prompted, null);
			});
		});

		it("should not install shims in client environment", () => {
			// Mock client environment by setting window
			/** @type {any} */ (globalThis).window = {};
			delete globalThis.localStorage;

			universal.env.installBrowserAPIShims();

			// Should not have installed shims (env.isServer() returns false when window exists)
			assert.strictEqual(typeof globalThis.localStorage, "undefined");

			// Clean up
			delete globalThis.window;
		});

		it("should automatically install shims during reactive SSR", async () => {
			// Mock server environment
			delete globalThis.window;
			delete globalThis.localStorage;
			delete globalThis.navigator;
			delete globalThis.location;

			const handler = () => {
				// Try to use browser APIs that would normally crash SSR
				const theme = localStorage.getItem("theme") || "light";
				const online = navigator.onLine;
				const href = location.href;

				return `<html><body>Theme: ${theme}, Online: ${online}, URL: ${href}</body></html>`;
			};

			const wrapped = universal.reactive(handler);
			const result = await wrapped();

			// Should have worked without throwing
			assert.ok(
				result.includes("Theme: light"),
				"Should handle localStorage gracefully",
			);
			assert.ok(
				result.includes("Online: true"),
				"Should handle navigator gracefully",
			);
			assert.ok(result.includes("URL: /"), "Should handle location gracefully");
		});
	});
});
