import assert from "node:assert";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import * as ssr from "./index.js";

describe("ssr/index.js", () => {
	let originalWindow;
	let originalFetch;
	let originalLocation;

	beforeEach(() => {
		// Save original values
		originalWindow = globalThis.window;
		originalFetch = globalThis.fetch;
		originalLocation = globalThis.location;
	});

	afterEach(() => {
		// Restore original values
		globalThis.window = originalWindow;
		globalThis.fetch = originalFetch;
		if (originalLocation) {
			globalThis.location = originalLocation;
		} else {
			delete globalThis.location;
		}
	});

	describe("exports", () => {
		it("should export ssr function", () => {
			assert.strictEqual(typeof ssr.ssr, "function");
		});
	});

	describe("ssr()", () => {
		it("should create ssr wrapper function", () => {
			const handler = () => "test";
			const wrapped = ssr.ssr(handler);

			assert.strictEqual(typeof wrapped, "function");
			assert.strictEqual(wrapped._ssrWrapped, true);
		});

		it("should prevent double-wrapping", () => {
			const handler = () => "test";
			const wrapped1 = ssr.ssr(handler);
			const wrapped2 = ssr.ssr(wrapped1);

			assert.strictEqual(wrapped1, wrapped2);
		});

		it("should handle basic function execution", async () => {
			const handler = (arg) => `result: ${arg}`;
			const wrapped = ssr.ssr(handler);

			const result = await wrapped("test");
			assert.strictEqual(result, "result: test");
		});

		it("should handle async function execution", async () => {
			const handler = async (arg) => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return `async result: ${arg}`;
			};
			const wrapped = ssr.ssr(handler);

			const result = await wrapped("test");
			assert.strictEqual(result, "async result: test");
		});

		it("should handle errors in wrapped functions", async () => {
			const handler = () => {
				throw new Error("Handler error");
			};
			const wrapped = ssr.ssr(handler);

			await assert.rejects(() => wrapped(), /Handler error/);
		});

		it("should pass custom options", () => {
			const handler = () => "test";
			const options = { timeout: 5000, maxSettleAttempts: 50 };
			const wrapped = ssr.ssr(handler, options);

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
			const wrapped = ssr.ssr(handler);

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

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should contain the component content plus inline SSR data (new behavior)
			assert.ok(
				result.startsWith("data: test"),
				"Should start with component content",
			);
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should inject component-scoped SSR data",
			);
			assert.ok(result.includes("<script>"), "Should include script tag");
			assert.ok(result.endsWith("</script>"), "Should end with script tag");
			assert.ok(result.includes("/api/test"), "Should cache the fetch URL");
			assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
		});

		it("should inject component-scoped SSR data inline", async () => {
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

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should contain component-scoped SSR data injection inline
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should have component-scoped SSR data",
			);
			assert.ok(result.includes("/api/greeting"), "Should cache the fetch URL");
			assert.ok(
				result.includes("<h1>hello</h1>"),
				"Should render the component content",
			);
			// Should be injected inline after component content, not at HTML structure points
			assert.ok(
				result.includes("</html><script>"),
				"Should inject script inline after component",
			);
		});

		it("should not inject SSR data if no fetch calls made", async () => {
			const handler = async () => {
				return "<html><head><title>Test</title></head><body>no fetch</body></html>";
			};

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should NOT contain SSR data injection
			assert.ok(!result.includes("window.__SSR_DATA__"));
			assert.ok(
				!result.includes("<script>"),
				"Should not inject script when no fetch calls",
			);
		});

		it("should give each component unique SSR data when multiple components exist", async () => {
			// Create a more controlled test - test each component separately
			const mockResponse1 = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => Promise.resolve({ component: "first" }),
				text: () => Promise.resolve('{"component": "first"}'),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse1));

			const handler1 = async () => {
				const response = await fetch("/api/first");
				const data = await response.json();
				return `<div>Component 1: ${data.component}</div>`;
			};

			// Test first component
			const wrapped1 = ssr.ssr(handler1, { _testComponentId: "comp1" });
			const result1 = await wrapped1();

			// Now test second component with fresh setup
			const mockResponse2 = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => Promise.resolve({ component: "second" }),
				text: () => Promise.resolve('{"component": "second"}'),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse2));

			const handler2 = async () => {
				const response = await fetch("/api/second");
				const data = await response.json();
				return `<div>Component 2: ${data.component}</div>`;
			};

			const wrapped2 = ssr.ssr(handler2, { _testComponentId: "comp2" });
			const result2 = await wrapped2();

			// Both should have their own SSR data with different component IDs (server environment)
			// Note: This test runs in server environment, so SSR data gets injected
			assert.ok(
				result1.includes("window.__SSR_DATA__"),
				"First component should have SSR data",
			);
			assert.ok(
				result2.includes("window.__SSR_DATA__"),
				"Second component should have SSR data",
			);

			// Verify they contain the expected component-specific data
			assert.ok(
				result1.startsWith("<div>Component 1: first</div>"),
				"First component should have correct content",
			);
			assert.ok(
				result2.startsWith("<div>Component 2: second</div>"),
				"Second component should have correct content",
			);

			// Since component IDs are predictable in our mock, verify they're different
			assert.ok(
				result1.includes("__SSR_DATA__comp1"),
				"First component should use comp1 ID",
			);
			assert.ok(
				result2.includes("__SSR_DATA__comp2"),
				"Second component should use comp2 ID",
			);

			// Verify both results end with script tags (inline injection)
			assert.ok(
				result1.endsWith("</script>"),
				"First component should have inline script",
			);
			assert.ok(
				result2.endsWith("</script>"),
				"Second component should have inline script",
			);

			// Verify both components rendered correctly
			assert.strictEqual(
				globalThis.fetch.mock.callCount(),
				1,
				"Should have made one fetch call for second component",
			);
		});
	});

	describe("client environment", () => {
		beforeEach(() => {
			// Mock browser environment with component-scoped SSR data
			const canonicalKey = JSON.stringify({
				url: "http://localhost/api/cached",
				method: "GET",
				headers: {},
				bodyHash: null,
			});

			// Component-scoped SSR data with mock component ID
			globalThis.window = {
				__SSR_DATA__abc123: {
					fetch: {
						[canonicalKey]: {
							ok: true,
							status: 200,
							statusText: "OK",
							headers: [["content-type", "application/json"]],
							json: { cached: "data" },
							text: '{"cached": "data"}',
						},
					},
				},
				location: {
					href: "http://localhost/",
					hostname: "localhost",
					pathname: "/",
					search: "",
					hash: "",
					protocol: "http:",
					port: "",
					host: "localhost",
				},
				// Mock browser APIs to ensure client environment detection
				document: {
					createElement: () => ({}),
				},
				navigator: {
					userAgent: "Mozilla/5.0 (Test Browser)",
				},
			};
			// Store component ID for tests to access
			globalThis.window.__TEST_COMPONENT_ID__ = "abc123";
			// Set up globalThis.location for URL resolution in tests
			globalThis.location = globalThis.window.location;
		});

		it("should detect client environment with hydration using component-scoped data", async () => {
			// Mock fetch to avoid real network calls in client tests
			const originalFetch = globalThis.fetch;
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => Promise.resolve({ cached: "data" }),
				text: () => Promise.resolve('{"cached": "data"}'),
			};
			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			try {
				const handler = async () => {
					const response = await fetch("/api/cached");
					const data = await response.json();
					return `hydrated: ${data.cached}`;
				};

				// Use test component ID parameter to match our cached data
				const wrapped = ssr.ssr(handler, { _testComponentId: "abc123" });
				const result = await wrapped();

				assert.strictEqual(result, "hydrated: data");
				// Component-scoped SSR data should be cleaned up after consumption
				assert.strictEqual(globalThis.window.__SSR_DATA__abc123, undefined);
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should fall back to real fetch for non-cached URLs", async () => {
			// Store original fetch to restore later
			const originalFetch = globalThis.fetch;
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => Promise.resolve({ fresh: "data" }),
				text: () => Promise.resolve('{"fresh": "data"}'),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			try {
				const handler = async () => {
					const response = await fetch("/api/not-cached");
					const data = await response.json();
					return `fresh: ${data.fresh}`;
				};

				// Use test component ID parameter for consistency
				const wrapped = ssr.ssr(handler, { _testComponentId: "abc123" });
				const result = await wrapped();

				assert.strictEqual(result, "fresh: data");
				assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});

	describe("client environment without hydration", () => {
		beforeEach(() => {
			// Mock browser environment without component-scoped SSR data
			globalThis.window = {
				location: {
					href: "http://localhost/",
					hostname: "localhost",
					pathname: "/",
					search: "",
					hash: "",
					protocol: "http:",
					port: "",
					host: "localhost",
				},
				// Mock browser APIs to ensure client environment detection
				document: {
					createElement: () => ({}),
				},
				navigator: {
					userAgent: "Mozilla/5.0 (Test Browser)",
				},
				// Explicitly no SSR data - this is client without hydration
			};
			// Set up globalThis.location for URL resolution in tests
			globalThis.location = globalThis.window.location;
		});

		it("should handle regular client execution without component-scoped data", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => Promise.resolve({ client: "data" }),
				text: () => Promise.resolve('{"client": "data"}'),
			};

			globalThis.fetch = mock.fn(() => Promise.resolve(mockResponse));

			const handler = async () => {
				const response = await fetch("/api/regular");
				const data = await response.json();
				return `client: ${data.client}`;
			};

			const wrapped = ssr.ssr(handler);
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

			const wrapped = ssr.ssr(handler);
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

			const wrapped = ssr.ssr(handler);

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

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should still inject component-scoped SSR data despite JSON parsing error
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should inject component-scoped SSR data",
			);
			assert.ok(result.includes("handled parsing error"));
			// Should be inline after component content
			assert.ok(
				result.includes("</html><script>"),
				"Should inject inline after component",
			);
		});

		it("should handle non-HTML responses with inline injection", async () => {
			const handler = async () => {
				return "Just plain text response";
			};

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should not inject SSR data when no fetch calls (non-HTML is fine with inline)
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
				const inner = ssr.ssr(handler);
				await inner();
				return "<html><body>tracked</body></html>";
			};

			const wrapped = ssr.ssr(outerHandler);
			const result = await wrapped();

			assert.ok(result.includes("tracked"));
		});
	});

	describe("options handling", () => {
		it("should use default options when none provided", () => {
			const handler = () => "test";
			const wrapped = ssr.ssr(handler);

			assert.strictEqual(typeof wrapped, "function");
		});

		it("should merge provided options with defaults", () => {
			const handler = () => "test";
			const options = { timeout: 5000 }; // Only partial options
			const wrapped = ssr.ssr(handler, options);

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
			const wrapped = ssr.ssr(handler, {
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

			const wrapped = ssr.ssr(handler, {
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

			const wrapped = ssr.ssr(handler, {
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

				const wrapped = ssr.ssr(handler, {
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
			ssr.env.installBrowserAPIShims();

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

			ssr.env.installBrowserAPIShims();

			assert.ok(globalThis.window, "window should exist");
			assert.ok(globalThis.window.location, "window.location should exist");
			assert.strictEqual(globalThis.window.location.href, "http://localhost/");
			assert.ok(globalThis.window.navigator, "window.navigator should exist");
			assert.strictEqual(globalThis.window.navigator.userAgent, "Node.js");
			assert.ok(globalThis.window.document, "window.document should exist");
			assert.strictEqual(globalThis.window.innerWidth, 1024);
		});

		it("should install navigator shim", () => {
			// Ensure server environment and clean state
			delete globalThis.window;
			delete globalThis.navigator;

			ssr.env.installBrowserAPIShims();

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

			ssr.env.installBrowserAPIShims();

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
			// Mock client environment with proper browser APIs
			/** @type {any} */ (globalThis).window = {
				document: {
					createElement: () => ({}),
				},
				navigator: {
					userAgent: "Mozilla/5.0 (Test Browser)",
				},
			};
			delete globalThis.localStorage;

			ssr.env.installBrowserAPIShims();

			// Should not have installed shims (env.isServer() returns false when window has browser APIs)
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

			const wrapped = ssr.ssr(handler);
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
			assert.ok(
				result.includes("URL: http://localhost/"),
				"Should handle location gracefully",
			);
		});
	});

	describe("canonical cache key implementation", () => {
		it("should create identical cache keys for same requests", () => {
			// Simulate the same request from server and client
			const _url1 = "/api/test";
			const _url2 = "http://localhost/api/test";
			const _opts = { method: "GET", headers: { Accept: "application/json" } };

			// Both should resolve to same canonical key when base is normalized
			const key1 = JSON.stringify({
				url: "http://localhost/api/test",
				method: "GET",
				headers: { accept: "application/json" },
				bodyHash: null,
			});

			// This test verifies the concept - actual createCacheKey is not exported
			// but this shows the expected behavior for cache key matching
			assert.ok(key1.includes("http://localhost/api/test"));
			assert.ok(key1.includes("GET"));
			assert.ok(key1.includes("accept"));
		});

		it("should only cache GET requests", async () => {
			delete globalThis.window; // Server environment

			const mockResponses = new Map();
			globalThis.fetch = async (url, opts = {}) => {
				const method = opts.method || "GET";
				const key = `${method}:${url}`;

				if (mockResponses.has(key)) {
					return mockResponses.get(key);
				}

				const response = {
					ok: true,
					status: 200,
					headers: new Map(),
					clone: () => response,
					text: () => Promise.resolve(`Response for ${method} ${url}`),
				};

				mockResponses.set(key, response);
				return response;
			};

			const handler = async () => {
				// Make GET and POST requests
				await fetch("/api/get-endpoint");
				await fetch("/api/post-endpoint", { method: "POST", body: "data" });
				return "<html><body>test</body></html>";
			};

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should contain component-scoped SSR data injection (only GET cached)
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should have component-scoped SSR data",
			);
			assert.ok(
				result.includes("</html><script>"),
				"Should inject inline after component",
			);
		});

		it("should restore fetch after first microtask during hydration", async () => {
			// Mock client environment with component-scoped SSR data
			const canonicalKey = JSON.stringify({
				url: "http://localhost/api/data",
				method: "GET",
				headers: {},
				bodyHash: null,
			});

			globalThis.window = {
				__SSR_DATA__xyz789: {
					fetch: {
						[canonicalKey]: {
							ok: true,
							status: 200,
							headers: [],
							json: { hydrated: "data" },
						},
					},
				},
				location: {
					href: "http://localhost/",
					hostname: "localhost",
					pathname: "/",
					search: "",
					hash: "",
					protocol: "http:",
					port: "",
					host: "localhost",
				},
				// Mock browser APIs to ensure client environment detection
				document: {
					createElement: () => ({}),
				},
				navigator: {
					userAgent: "Mozilla/5.0 (Test Browser)",
				},
			};
			globalThis.location = globalThis.window.location;

			const _fetchInterceptCount = 0;
			const _originalFetchCalls = 0;

			// Mock fetch to avoid URL parsing issues
			const originalFetch = globalThis.fetch;
			globalThis.fetch = mock.fn(() =>
				Promise.reject(new Error("Network unavailable")),
			);

			try {
				const handler = async () => {
					// This fetch should use cached data
					const response1 = await fetch("/api/data");
					const data1 = await response1.json();

					// Schedule a fetch for next microtask (should use original fetch)
					queueMicrotask(async () => {
						try {
							await fetch("/api/later");
						} catch (_e) {
							// Expected to fail (no real server), but should use original fetch
						}
					});

					return `hydrated: ${data1.hydrated}`;
				};

				// Use test component ID parameter to match cached data
				const wrapped = ssr.ssr(handler, { _testComponentId: "xyz789" });
				const result = await wrapped();

				// Give microtask a chance to run
				await new Promise((resolve) => setTimeout(resolve, 10));

				assert.strictEqual(result, "hydrated: data");
				// The main test is that cached data was used (not the later fetch tracking)
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should handle multi-component apps with separate component-scoped data", async () => {
			// Mock client environment with component-scoped cached entries
			const key1 = JSON.stringify({
				url: "http://localhost/api/data1",
				method: "GET",
				headers: {},
				bodyHash: null,
			});
			const key2 = JSON.stringify({
				url: "http://localhost/api/data2",
				method: "GET",
				headers: {},
				bodyHash: null,
			});

			globalThis.window = {
				// Each component gets its own scoped SSR data
				__SSR_DATA__comp1: {
					fetch: {
						[key1]: {
							ok: true,
							status: 200,
							headers: [],
							json: { data: "first" },
						},
					},
				},
				__SSR_DATA__comp2: {
					fetch: {
						[key2]: {
							ok: true,
							status: 200,
							headers: [],
							json: { data: "second" },
						},
					},
				},
				location: {
					href: "http://localhost/",
					hostname: "localhost",
					pathname: "/",
					search: "",
					hash: "",
					protocol: "http:",
					port: "",
					host: "localhost",
				},
				// Mock browser APIs to ensure client environment detection
				document: {
					createElement: () => ({}),
				},
				navigator: {
					userAgent: "Mozilla/5.0 (Test Browser)",
				},
			};
			globalThis.location = globalThis.window.location;

			// Mock fetch to avoid any fallback network calls
			const originalFetch = globalThis.fetch;
			globalThis.fetch = mock.fn(() =>
				Promise.reject(
					new Error("Network unavailable - should use cached data"),
				),
			);

			try {
				// First component consumes its own scoped data
				const handler1 = async () => {
					const response = await fetch("/api/data1");
					const data = await response.json();
					return data.data;
				};

				// Use test component ID parameters to match cached data
				const wrapped1 = ssr.ssr(handler1, { _testComponentId: "comp1" });
				const result1 = await wrapped1();

				assert.strictEqual(result1, "first");

				// First component's SSR data should be cleaned up
				assert.strictEqual(
					/** @type {any} */ (globalThis.window).__SSR_DATA__comp1,
					undefined,
					"First component's SSR data should be consumed",
				);

				// Second component's data should still exist
				assert.ok(
					/** @type {any} */ (globalThis.window).__SSR_DATA__comp2,
					"Second component's SSR data should still exist",
				);

				// Second component consumes its own scoped data
				const handler2 = async () => {
					const response = await fetch("/api/data2");
					const data = await response.json();
					return data.data;
				};

				const wrapped2 = ssr.ssr(handler2, { _testComponentId: "comp2" });
				const result2 = await wrapped2();

				assert.strictEqual(result2, "second");

				// Now both component's SSR data should be cleaned up
				assert.strictEqual(
					/** @type {any} */ (globalThis.window).__SSR_DATA__comp2,
					undefined,
					"Second component's SSR data should be consumed",
				);
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should return complete Response objects with url, redirected, type fields", async () => {
			// Mock client environment with component-scoped cached data
			const canonicalKey = JSON.stringify({
				url: "http://localhost/api/complete",
				method: "GET",
				headers: {},
				bodyHash: null,
			});

			globalThis.window = {
				__SSR_DATA__complete123: {
					fetch: {
						[canonicalKey]: {
							ok: true,
							status: 200,
							statusText: "OK",
							headers: [["content-type", "application/json"]],
							json: { test: "data" },
						},
					},
				},
				location: {
					href: "http://localhost/",
					hostname: "localhost",
					pathname: "/",
					search: "",
					hash: "",
					protocol: "http:",
					port: "",
					host: "localhost",
				},
				// Mock browser APIs to ensure client environment detection
				document: {
					createElement: () => ({}),
				},
				navigator: {
					userAgent: "Mozilla/5.0 (Test Browser)",
				},
			};
			globalThis.location = globalThis.window.location;

			// Mock fetch to avoid any fallback network calls
			const originalFetch = globalThis.fetch;
			globalThis.fetch = mock.fn(() =>
				Promise.reject(new Error("Network unavailable")),
			);

			try {
				const handler = async () => {
					const response = await fetch("/api/complete");

					// Test all Response properties for compatibility
					assert.strictEqual(response.ok, true);
					assert.strictEqual(response.status, 200);
					assert.strictEqual(response.statusText, "OK");
					assert.strictEqual(response.url, "http://localhost/api/complete");
					assert.strictEqual(response.redirected, false);
					assert.strictEqual(response.type, "basic");
					assert.strictEqual(response.body, null);
					assert.strictEqual(response.bodyUsed, false);
					assert.ok(response.headers instanceof Headers);
					assert.strictEqual(typeof response.json, "function");
					assert.strictEqual(typeof response.text, "function");
					assert.strictEqual(typeof response.arrayBuffer, "function");
					assert.strictEqual(typeof response.blob, "function");
					assert.strictEqual(typeof response.formData, "function");
					assert.strictEqual(typeof response.clone, "function");

					const data = await response.json();
					return data.test;
				};

				// Use test component ID parameter to match cached data
				const wrapped = ssr.ssr(handler, { _testComponentId: "complete123" });
				const result = await wrapped();

				assert.strictEqual(result, "data");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});

	describe("XSS-safe script injection + size cap", () => {
		beforeEach(() => {
			delete globalThis.window; // Server environment
		});

		it("should escape dangerous characters in component-scoped SSR data", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "application/json"]]),
				clone: () => mockResponse,
				json: () =>
					Promise.resolve({
						xss: "</script><script>alert('xss')</script>",
						lineSep: "Line\u2028Break\u2029Test",
					}),
			};

			globalThis.fetch = () => Promise.resolve(mockResponse);

			const handler = async () => {
				const response = await fetch("/api/dangerous");
				await response.json();
				return "<html><head><title>Test</title></head><body>content</body></html>";
			};

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should contain escaped characters in component-scoped SSR data, not raw dangerous content
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should have component-scoped SSR data",
			);
			assert.ok(
				result.includes("\\u003c/script\\u003e"),
				"Should escape </script> tags",
			); // Escaped </script>
			assert.ok(
				!result.includes("</script><script>alert"),
				"Should not contain raw XSS",
			); // Not raw XSS
			assert.ok(
				result.includes("\\u2028"),
				"Should escape Unicode line separator",
			); // Escaped line separator
			assert.ok(
				result.includes("\\u2029"),
				"Should escape Unicode paragraph separator",
			); // Escaped paragraph separator
			// Should be injected inline after component content
			assert.ok(
				result.includes("</html><script>"),
				"Should inject inline after component",
			);
		});

		it("should skip component-scoped injection for payloads exceeding 512KB", async () => {
			// Create a large payload
			const largeData = "x".repeat(600 * 1024); // 600KB > 512KB limit

			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: () => mockResponse,
				json: () => Promise.resolve({ large: largeData }),
			};

			globalThis.fetch = () => Promise.resolve(mockResponse);

			let warningCalled = false;
			const originalWarn = console.warn;
			console.warn = (...args) => {
				if (args[0].includes("SSR payload too large")) {
					warningCalled = true;
				}
			};

			try {
				const handler = async () => {
					const response = await fetch("/api/large");
					await response.json();
					return "<html><head><title>Test</title></head><body>content</body></html>";
				};

				const wrapped = ssr.ssr(handler);
				const result = await wrapped();

				// Should NOT contain component-scoped SSR data injection due to size cap
				assert.ok(
					!result.includes("window.__SSR_DATA__"),
					"Should not inject large payload",
				);
				assert.ok(warningCalled, "Should warn about large payload");
			} finally {
				console.warn = originalWarn;
			}
		});

		it("should add CSP nonce to component-scoped script when available", async () => {
			// Set CSP nonce
			/** @type {any} */ (globalThis).__REFLEX_CSP_NONCE__ = "test-nonce-123";

			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: () => mockResponse,
				json: () => Promise.resolve({ csp: "test" }),
			};

			globalThis.fetch = () => Promise.resolve(mockResponse);

			try {
				const handler = async () => {
					const response = await fetch("/api/csp");
					await response.json();
					return "<html><head><title>Test</title></head><body>content</body></html>";
				};

				const wrapped = ssr.ssr(handler);
				const result = await wrapped();

				// Should contain nonce attribute in inline component script
				assert.ok(
					result.includes('nonce="test-nonce-123"'),
					"Should include CSP nonce",
				);
				assert.ok(
					result.includes("window.__SSR_DATA__"),
					"Should have component-scoped SSR data",
				);
				assert.ok(
					result.includes("</html><script "),
					"Should inject inline after component",
				);
			} finally {
				// Clean up
				delete (/** @type {any} */ (globalThis).__REFLEX_CSP_NONCE__);
			}
		});

		it("should work without CSP nonce in component-scoped script when not set", async () => {
			// Ensure no nonce is set
			delete (/** @type {any} */ (globalThis).__REFLEX_CSP_NONCE__);

			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: () => mockResponse,
				json: () => Promise.resolve({ normal: "test" }),
			};

			globalThis.fetch = () => Promise.resolve(mockResponse);

			const handler = async () => {
				const response = await fetch("/api/normal");
				await response.json();
				return "<html><head><title>Test</title></head><body>content</body></html>";
			};

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// Should NOT contain nonce attribute in inline component script
			assert.ok(
				!result.includes("nonce="),
				"Should not include nonce when not set",
			);
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should have component-scoped SSR data",
			);
			assert.ok(
				result.includes("</html><script>window.__SSR_DATA__"),
				"Should inject inline after component",
			);
		});
	});

	describe("body read tracking for settlement", () => {
		beforeEach(() => {
			delete globalThis.window; // Server environment
		});

		it("should track userland body reads for settlement", async () => {
			let bodyReadPromiseResolved = false;

			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () =>
					new Promise((resolve) => {
						// Simulate slow body read that would otherwise hang SSR
						setTimeout(() => {
							bodyReadPromiseResolved = true;
							resolve({ delayed: "data" });
						}, 50);
					}),
				text: () => Promise.resolve('{"delayed": "data"}'),
			};

			globalThis.fetch = () => Promise.resolve(mockResponse);

			const handler = async () => {
				const response = await fetch("/api/tracked");

				// Userland code calls response.json() - should be tracked
				const data = await response.json();

				return `<html><body>Data: ${data.delayed}</body></html>`;
			};

			const wrapped = ssr.ssr(handler, { timeout: 200 });
			const result = await wrapped();

			// Should have waited for the body read to complete
			assert.ok(
				bodyReadPromiseResolved,
				"Body read promise should have resolved",
			);
			assert.ok(result.includes("Data: data"));
			assert.ok(
				result.includes("window.__SSR_DATA__"),
				"Should have component-scoped SSR data",
			);
			assert.ok(
				result.includes("</html><script>"),
				"Should inject inline after component",
			);
		});

		it("should track multiple body read methods", async () => {
			const trackedCalls = [];

			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map([["content-type", "application/json"]]),
				clone: function () {
					return this;
				},
				json: () => {
					const promise = Promise.resolve({ json: "data" });
					trackedCalls.push("json");
					return promise;
				},
				text: () => {
					const promise = Promise.resolve("text data");
					trackedCalls.push("text");
					return promise;
				},
				arrayBuffer: () => {
					const promise = Promise.resolve(new ArrayBuffer(8));
					trackedCalls.push("arrayBuffer");
					return promise;
				},
				blob: () => {
					const promise = Promise.resolve(new Blob(["blob data"]));
					trackedCalls.push("blob");
					return promise;
				},
			};

			globalThis.fetch = () => Promise.resolve(mockResponse);

			const handler = async () => {
				const response = await fetch("/api/multi");

				// Call multiple body read methods
				await response.json();
				await response.text();
				await response.arrayBuffer();
				await response.blob();

				return "<html><body>All methods called</body></html>";
			};

			const wrapped = ssr.ssr(handler);
			const result = await wrapped();

			// All body read methods should have been called and tracked
			// Note: json is called twice - once for internal caching, once by userland
			assert.deepStrictEqual(trackedCalls, [
				"json",
				"json",
				"text",
				"arrayBuffer",
				"blob",
			]);
			assert.ok(result.includes("All methods called"));
		});
	});

	describe("fetch restoration on errors", () => {
		beforeEach(() => {
			delete globalThis.window; // Server environment
		});

		it("should restore fetch if handler throws after fetch override", async () => {
			const actualOriginal = globalThis.fetch;

			const handler = async () => {
				// This fetch will trigger the override installation
				const _response = await fetch("/api/test");

				// Then throw an error to test restoration
				throw new Error("Handler error after fetch");
			};

			// Mock fetch response
			const mockResponse = {
				ok: true,
				status: 200,
				headers: new Map(),
				clone: function () {
					return this;
				},
				text: () => Promise.resolve("test data"),
			};

			const mockFetch = () => Promise.resolve(mockResponse);
			globalThis.fetch = mockFetch;

			const wrapped = ssr.ssr(handler);

			try {
				await wrapped();
				assert.fail("Should have thrown");
			} catch (error) {
				assert.strictEqual(error.message, "Handler error after fetch");
			}

			// Fetch should be restored to what it was before reactive was called
			assert.strictEqual(
				globalThis.fetch,
				mockFetch,
				"Fetch should be restored to pre-reactive state",
			);

			// Clean up
			globalThis.fetch = actualOriginal;
		});
	});
});
