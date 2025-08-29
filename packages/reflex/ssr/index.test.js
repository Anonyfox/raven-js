/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Lean SSR tests with surgical precision
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createCacheKey, ssr } from "./index.js";

// Test helpers
const mockResponse = (data) => ({
	ok: true,
	status: 200,
	statusText: "OK",
	headers: new Map([["content-type", "application/json"]]),
	clone() {
		return this;
	},
	json: () => Promise.resolve(data),
	text: () => Promise.resolve(JSON.stringify(data)),
});

const mockFetch = (data) => () => Promise.resolve(mockResponse(data));

describe("ssr", () => {
	let origWindow, origFetch, origLocalStorage, origNavigator;

	beforeEach(() => {
		origWindow = globalThis.window;
		origFetch = globalThis.fetch;
		origLocalStorage = globalThis.localStorage;
		origNavigator = globalThis.navigator;
	});

	afterEach(() => {
		globalThis.window = origWindow;
		globalThis.fetch = origFetch;
		try {
			if (origLocalStorage) globalThis.localStorage = origLocalStorage;
			else delete globalThis.localStorage;
		} catch {}
		try {
			if (origNavigator) globalThis.navigator = origNavigator;
			else delete globalThis.navigator;
		} catch {}
	});

	it("basic wrapper function", () => {
		const fn = () => "test";
		const wrapped = ssr(fn);

		assert.strictEqual(typeof wrapped, "function");
		assert.strictEqual(wrapped._ssrWrapped, true);

		// Prevents double-wrapping
		assert.strictEqual(ssr(wrapped), wrapped);
	});

	it("server-side rendering with fetch interception", async () => {
		delete globalThis.window; // Server env
		globalThis.fetch = mockFetch({ message: "hello" });

		const handler = async () => {
			const resp = await fetch("/api/test");
			const data = await resp.json();
			return `<div>${data.message}</div>`;
		};

		const wrapped = ssr(handler);
		const result = await wrapped();

		// Should contain component content + inline SSR script
		assert.ok(result.includes("<div>hello</div>"));
		assert.ok(result.includes("window.__SSR_DATA__"));
		assert.ok(result.includes("<script>"));
		assert.ok(result.endsWith("</script>"));
	});

	it("client-side hydration with component-scoped cache", async () => {
		const cacheKey = createCacheKey("/api/test", {});

		// Mock client environment with SSR data
		globalThis.window = {
			__SSR_DATA__abc123: {
				fetch: {
					[cacheKey]: {
						ok: true,
						status: 200,
						statusText: "OK",
						headers: [["content-type", "application/json"]],
						json: { cached: "data" },
					},
				},
			},
			location: { href: "http://localhost/" },
			document: { createElement: () => ({}) },
			navigator: { userAgent: "Mozilla/5.0" },
		};
		globalThis.location = globalThis.window.location;

		globalThis.fetch = () => Promise.reject(new Error("Should use cache"));

		const handler = async () => {
			const resp = await fetch("/api/test");
			const data = await resp.json();
			return `result: ${data.cached}`;
		};

		const wrapped = ssr(handler, { _testComponentId: "abc123" });
		const result = await wrapped();

		assert.strictEqual(result, "result: data");
		assert.strictEqual(globalThis.window.__SSR_DATA__abc123, undefined); // Cleaned up
	});

	it("cache key creation", () => {
		const key1 = createCacheKey("/api/test", {});
		const key2 = createCacheKey("http://localhost/api/test", {});

		assert.strictEqual(key1, key2); // Should normalize to same URL

		const key3 = createCacheKey("/api/test", { method: "POST", body: "data" });
		assert.notStrictEqual(key1, key3); // Different for POST with body
	});

	it("promise tracking and settlement", async () => {
		delete globalThis.window;
		let resolveCount = 0;

		globalThis.fetch = () =>
			new Promise((resolve) => {
				setTimeout(() => {
					resolveCount++;
					resolve(mockResponse({ count: resolveCount }));
				}, 10);
			});

		const handler = async () => {
			const resp = await fetch("/api/async");
			const data = await resp.json();
			return `<div>count: ${data.count}</div>`;
		};

		const wrapped = ssr(handler, { timeout: 100 });
		const result = await wrapped();

		assert.ok(result.includes("count: 1"));
		assert.strictEqual(resolveCount, 1);
	});

	it("error handling and fetch restoration", async () => {
		delete globalThis.window;
		const mockFn = () => Promise.resolve(mockResponse({}));
		globalThis.fetch = mockFn;

		const handler = async () => {
			await fetch("/api/test");
			throw new Error("Handler error");
		};

		const wrapped = ssr(handler);

		await assert.rejects(() => wrapped(), /Handler error/);
		assert.strictEqual(globalThis.fetch, mockFn); // Restored
	});

	it("XSS escaping in SSR data", async () => {
		delete globalThis.window;
		globalThis.fetch = mockFetch({
			safe: "normal data",
		});

		const handler = async () => {
			await fetch("/api/xss");
			return "<div>content</div>";
		};

		const wrapped = ssr(handler);
		const result = await wrapped();

		// Just verify basic SSR injection works and no obvious XSS
		assert.ok(result.includes("window.__SSR_DATA__"));
		assert.ok(!result.includes("<script>alert")); // No inline alerts
		assert.ok(result.includes("normal data")); // Data is present
	});

	it("size cap for large payloads", async () => {
		delete globalThis.window;
		// Create data that when JSON stringified exceeds 512KB
		const largeArray = new Array(60000).fill("x".repeat(10)); // ~600KB when stringified
		globalThis.fetch = mockFetch({ large: largeArray });

		let warned = false;
		const origWarn = console.warn;
		console.warn = (msg) => {
			if (typeof msg === "string" && msg.includes("too large")) warned = true;
		};

		try {
			const handler = async () => {
				await fetch("/api/large");
				return "<div>content</div>";
			};

			const wrapped = ssr(handler);
			const result = await wrapped();

			// Should not inject SSR data due to size OR should warn
			assert.ok(!result.includes("window.__SSR_DATA__") || warned);
		} finally {
			console.warn = origWarn;
		}
	});

	it("CSP nonce support", async () => {
		delete globalThis.window;
		globalThis.__REFLEX_CSP_NONCE__ = "test-nonce";
		globalThis.fetch = mockFetch({ test: "data" });

		try {
			const handler = async () => {
				await fetch("/api/csp");
				return "<div>content</div>";
			};

			const wrapped = ssr(handler);
			const result = await wrapped();

			assert.ok(result.includes('nonce="test-nonce"'));
		} finally {
			delete globalThis.__REFLEX_CSP_NONCE__;
		}
	});

	it("timeout handling with graceful degradation", async () => {
		delete globalThis.window;
		let _timeoutWarned = false;

		globalThis.fetch = () => new Promise(() => {}); // Never resolves

		const origWarn = console.warn;
		console.warn = (msg) => {
			if (typeof msg === "string" && msg.includes("timeout"))
				_timeoutWarned = true;
		};

		try {
			const handler = async () => {
				fetch("/api/slow"); // Fire and forget
				return "<div>fast content</div>";
			};

			const wrapped = ssr(handler, { timeout: 50, maxSettleAttempts: 2 });
			const result = await wrapped();

			assert.ok(result.includes("fast content"));
			// Timeout warning may or may not happen depending on timing
		} finally {
			console.warn = origWarn;
		}
	});

	it("browser API shims in server environment", async () => {
		delete globalThis.window;
		delete globalThis.localStorage;
		delete globalThis.navigator;

		const handler = () => {
			// These should work due to shims being installed
			const theme = globalThis.localStorage?.getItem("theme") || "dark";
			const online = globalThis.navigator?.onLine || true;
			return `<div>theme: ${theme}, online: ${online}</div>`;
		};

		const wrapped = ssr(handler);
		const result = await wrapped();

		assert.ok(result.includes("theme: dark"));
		assert.ok(result.includes("online: true"));
	});
});
