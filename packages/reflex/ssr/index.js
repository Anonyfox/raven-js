/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Universal reactive wrapper for SSR and hydration
 *
 * The reactive() wrapper for fullstack applications with automatic SSR,
 * fetch interception, and seamless client hydration.
 */

import { contextStack } from "../index.js";

/**
 * Creates a canonical cache key for fetch requests.
 * Ensures server and client use identical keys for proper hydration matching.
 *
 * @param {string|URL|Request} url - Request URL (may be relative) or Request object
 * @param {RequestInit} [opts={}] - Fetch options
 * @returns {string} Canonical cache key
 */
function createCacheKey(url, opts = {}) {
	// Convert URL object or Request to string if needed
	let urlString;
	if (url instanceof URL) {
		urlString = url.toString();
	} else if (typeof url === "object" && url.url) {
		// Handle Request objects
		urlString = url.url;
	} else {
		urlString = String(url);
	}
	// Normalize base URL consistently
	let baseUrl = globalThis.location?.href || "http://localhost/";

	// Ensure baseUrl is a valid absolute URL
	if (baseUrl === "/" || !baseUrl.includes("://")) {
		baseUrl = "http://localhost/";
	}

	const absoluteUrl = new URL(urlString, baseUrl).toString();

	// Extract and normalize options
	const method = (opts.method || "GET").toUpperCase();

	// Normalize headers to lowercase keys
	/** @type {Record<string, string>} */
	const headers = {};
	if (opts.headers) {
		if (opts.headers instanceof Headers) {
			for (const [key, value] of opts.headers.entries()) {
				headers[key.toLowerCase()] = value;
			}
		} else if (typeof opts.headers === "object") {
			for (const [key, value] of Object.entries(opts.headers)) {
				headers[key.toLowerCase()] = String(value);
			}
		}
	}

	// Create body hash for non-GET requests
	let bodyHash = null;
	if (opts.body && method !== "GET") {
		// Simple hash for body content
		bodyHash =
			typeof opts.body === "string"
				? `${opts.body.length}:${opts.body.slice(0, 100)}`
				: "[object]";
	}

	return JSON.stringify({
		url: absoluteUrl,
		method,
		headers,
		bodyHash,
	});
}

/**
 * Environment detection utilities.
 * Determines the current runtime context for reactive behavior.
 */
const env = {
	/**
	 * Check if running in a server environment.
	 * @returns {boolean} True if server environment
	 */
	isServer: () => typeof window === "undefined",

	/**
	 * Check if running in a browser environment.
	 * @returns {boolean} True if browser environment
	 */
	isClient: () => typeof window !== "undefined",

	/**
	 * Check if client is in hydration mode (SSR data available).
	 * @returns {boolean} True if hydrating from SSR
	 */
	isHydrating: () =>
		typeof window !== "undefined" && /** @type {any} */ (window).__SSR_DATA__,

	/**
	 * Check if this is the root reactive call (no parent context).
	 * @returns {boolean} True if root level call
	 */
	isRoot: () => contextStack.length === 0,

	/**
	 * Installs safe browser API shims during SSR to prevent crashes.
	 * These shims provide sensible defaults for browser-only APIs.
	 */
	installBrowserAPIShims: () => {
		if (env.isServer()) {
			// localStorage/sessionStorage shims
			if (typeof globalThis.localStorage === "undefined") {
				/** @type {any} */ (globalThis).localStorage = {
					getItem: (/** @type {any} */ _key) => /** @type {any} */ (null),
					setItem: (/** @type {any} */ _key, /** @type {any} */ _value) => {},
					removeItem: (/** @type {any} */ _key) => {},
					clear: () => {},
					key: (/** @type {any} */ _index) => /** @type {any} */ (null),
					get length() {
						return 0;
					},
				};
			}

			if (typeof globalThis.sessionStorage === "undefined") {
				/** @type {any} */ (globalThis).sessionStorage = {
					getItem: (/** @type {any} */ _key) => /** @type {any} */ (null),
					setItem: (/** @type {any} */ _key, /** @type {any} */ _value) => {},
					removeItem: (/** @type {any} */ _key) => {},
					clear: () => {},
					key: (/** @type {any} */ _index) => /** @type {any} */ (null),
					get length() {
						return 0;
					},
				};
			}

			// window object shim
			if (typeof globalThis.window === "undefined") {
				/** @type {any} */ (globalThis).window = {
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
					navigator: {
						userAgent: "Node.js",
						onLine: true,
						language: "en-US",
						languages: ["en-US"],
					},
					document: {
						title: "",
						cookie: "",
						documentElement: {
							scrollTop: 0,
							scrollLeft: 0,
							clientWidth: 1024,
							clientHeight: 768,
						},
						body: {
							scrollTop: 0,
							scrollLeft: 0,
							clientWidth: 1024,
							clientHeight: 768,
						},
						createElement: () => ({
							innerHTML: "",
							textContent: "",
							style: {},
							setAttribute: (
								/** @type {any} */ _name,
								/** @type {any} */ _value,
							) => {},
							getAttribute: (/** @type {any} */ _name) =>
								/** @type {any} */ (null),
							appendChild: (/** @type {any} */ _child) => {},
							removeChild: (/** @type {any} */ _child) => {},
							addEventListener: (
								/** @type {any} */ _type,
								/** @type {any} */ _listener,
							) => {},
							removeEventListener: (
								/** @type {any} */ _type,
								/** @type {any} */ _listener,
							) => {},
						}),
						getElementById: (/** @type {any} */ _id) =>
							/** @type {any} */ (null),
						querySelector: (/** @type {any} */ _selector) =>
							/** @type {any} */ (null),
						querySelectorAll: (/** @type {any} */ _selector) =>
							/** @type {any[]} */ ([]),
					},
					innerWidth: 1024,
					innerHeight: 768,
					screen: {
						width: 1920,
						height: 1080,
						availWidth: 1920,
						availHeight: 1080,
					},
					addEventListener: () => {},
					removeEventListener: () => {},
					getComputedStyle: () => ({}),
					requestAnimationFrame: (/** @type {any} */ fn) => setTimeout(fn, 16),
					cancelAnimationFrame: (/** @type {any} */ id) => clearTimeout(id),
				};
			}

			// document shim (if window exists but document doesn't)
			if (typeof globalThis.document === "undefined" && globalThis.window) {
				/** @type {any} */ (globalThis).document = /** @type {any} */ (
					globalThis.window
				).document;
			}

			// navigator shim
			if (typeof globalThis.navigator === "undefined") {
				/** @type {any} */ (globalThis).navigator = {
					userAgent: "Node.js",
					onLine: true,
					language: "en-US",
					languages: ["en-US"],
					platform: "node",
					cookieEnabled: false,
				};
			}

			// location shim
			if (typeof globalThis.location === "undefined") {
				/** @type {any} */ (globalThis).location = {
					href: "http://localhost/",
					hostname: "localhost",
					pathname: "/",
					search: "",
					hash: "",
					protocol: "http:",
					port: "",
					host: "localhost",
				};
			}

			// history shim
			if (typeof globalThis.history === "undefined") {
				/** @type {any} */ (globalThis).history = {
					length: 1,
					state: null,
					pushState: () => {},
					replaceState: () => {},
					back: () => {},
					forward: () => {},
					go: () => {},
				};
			}

			// alert/confirm/prompt shims
			if (typeof globalThis.alert === "undefined") {
				/** @type {any} */ (globalThis).alert = (
					/** @type {any} */ message,
				) => {
					console.log("ALERT:", message);
				};
			}

			if (typeof globalThis.confirm === "undefined") {
				/** @type {any} */ (globalThis).confirm = (
					/** @type {any} */ _message,
				) => true;
			}

			if (typeof globalThis.prompt === "undefined") {
				/** @type {any} */ (globalThis).prompt = (
					/** @type {any} */ _message,
				) => /** @type {any} */ (null);
			}
		}
	},
};

/**
 * Universal reactive wrapper that handles SSR, hydration, and async operations.
 *
 * This function wraps handler functions to provide automatic SSR data injection,
 * fetch interception, client-side hydration, and async operation management.
 * The same wrapped function runs on both server and client with different behavior.
 *
 * **Server Behavior:**
 * - Intercepts fetch calls and caches responses
 * - Injects SSR data into HTML output automatically
 * - Tracks async operations for completion
 *
 * **Client Behavior:**
 * - Uses cached SSR data for initial hydration
 * - Falls back to normal fetch after hydration
 * - Manages reactive state updates
 *
 * **Isomorphic**: Same code runs everywhere with environment-specific optimizations.
 * **Automatic**: No manual SSR/hydration setup required.
 * **Performance**: Eliminates server round-trips during hydration.
 *
 * @template T
 * @param {function(...any[]): T|Promise<T>} fn - Handler function to make reactive
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.timeout=10000] - Maximum time to wait for async operations (ms)
 * @param {number} [options.maxSettleAttempts=100] - Maximum attempts to settle all async operations
 * @returns {function(...any[]): Promise<T>} Wrapped function that handles SSR/hydration
 *
 * @example
 * ```javascript
 * // Express/Wings route handler
 * import { Router } from "@raven-js/wings";
 * import { html } from "@raven-js/beak";
 * import { reactive, signal } from "@raven-js/reflex";
 *
 * const router = new Router();
 *
 * router.get("/todos", reactive(async (ctx) => {
 *   const todos = signal([]);
 *
 *   // This fetch works on server AND client
 *   const response = await fetch("/api/todos");
 *   const data = await response.json();
 *   todos.set(data);
 *
 *   return ctx.html(html`
 *     <html>
 *       <head><title>Todos</title></head>
 *       <body>
 *         <h1>Todo List</h1>
 *         <ul>
 *           ${todos().map(todo => html`<li>${todo.title}</li>`)}
 *         </ul>
 *         <script src="/client.js"></script>
 *       </body>
 *     </html>
 *   `);
 * }));
 * ```
 *
 * @example
 * ```javascript
 * // Pure Node.js usage
 * import { createServer } from "http";
 * import { reactive, signal, effect } from "@raven-js/reflex";
 *
 * const handler = reactive(async () => {
 *   const data = signal("loading...");
 *
 *   // Automatic fetch interception and caching
 *   const result = await fetch("https://api.example.com/data");
 *   data.set(await result.text());
 *
 *   return \`<html><body><h1>\${data()}</h1></body></html>\`;
 * });
 *
 * createServer((req, res) => {
 *   handler().then(html => {
 *     res.writeHead(200, { "Content-Type": "text/html" });
 *     res.end(html);
 *   });
 * }).listen(3000);
 * ```
 */
export function reactive(fn, options = {}) {
	// Prevent double-wrapping
	if (/** @type {any} */ (fn)._reactiveWrapped) {
		return /** @type {any} */ (fn);
	}

	const { timeout = 10000, maxSettleAttempts = 100 } = options;

	const wrapped = async function (/** @type {...any} */ ...args) {
		const isServer = env.isServer();
		const isClient = env.isClient();
		const isHydrating = env.isHydrating();
		const isRoot = env.isRoot();

		// CLIENT: Use cached SSR data if hydrating
		if (isClient && isHydrating && isRoot) {
			const originalFetch = globalThis.fetch;

			// Intercept fetch calls and use cached data
			globalThis.fetch = /** @type {any} */ (
				(/** @type {any} */ url, /** @type {any} */ opts = {}) => {
					const cacheKey = createCacheKey(url, opts);
					const ssrData = /** @type {any} */ (window).__SSR_DATA__;
					const cached = ssrData?.fetch?.[cacheKey];

					if (cached) {
						// Delete this specific cache entry after use (per-entry consumption)
						delete ssrData.fetch[cacheKey];

						// If fetch cache is now empty, clean up the entire __SSR_DATA__
						if (Object.keys(ssrData.fetch).length === 0) {
							delete (/** @type {any} */ (window).__SSR_DATA__);
						}

						// Create absolute URL for Response.url field
						let urlString;
						if (url instanceof URL) {
							urlString = url.toString();
						} else if (typeof url === "object" && url.url) {
							urlString = url.url;
						} else {
							urlString = String(url);
						}

						let baseUrl = globalThis.location?.href || "http://localhost/";
						if (baseUrl === "/" || !baseUrl.includes("://")) {
							baseUrl = "http://localhost/";
						}

						// Return cached response as Promise with complete Response shape parity
						const absoluteUrl = new URL(urlString, baseUrl).toString();
						return Promise.resolve({
							ok: cached.ok,
							status: cached.status,
							statusText: cached.statusText,
							headers: new Headers(cached.headers),
							url: absoluteUrl,
							redirected: false,
							type: "basic",
							body: null,
							bodyUsed: false,
							json: () => Promise.resolve(cached.json),
							text: () => Promise.resolve(cached.text),
							arrayBuffer: () => Promise.resolve(cached.arrayBuffer),
							blob: () => Promise.resolve(cached.blob),
							formData: () =>
								Promise.reject(
									new Error("formData not available in SSR cache"),
								),
							clone: function () {
								return this;
							},
						});
					}

					// Fall back to normal fetch for non-cached requests
					// Use absolute URL for fetch fallback
					let baseUrl = globalThis.location?.href || "http://localhost/";
					if (baseUrl === "/" || !baseUrl.includes("://")) {
						baseUrl = "http://localhost/";
					}
					const absoluteUrl = new URL(url, baseUrl).toString();
					return originalFetch(absoluteUrl, opts);
				}
			);

			// Schedule fetch restoration after first microtask to limit interception scope
			queueMicrotask(() => {
				globalThis.fetch = originalFetch;
			});

			try {
				const result = await fn.apply(this, args);

				// Note: SSR data is cleaned up per-entry in fetch interception above

				return result;
			} finally {
				// Ensure fetch is restored even if handler throws
				// (Note: microtask restoration above handles the normal case)
				if (globalThis.fetch !== originalFetch) {
					globalThis.fetch = originalFetch;
				}
			}
		}

		// SERVER: Intercept fetch and track async operations
		if (isServer && isRoot) {
			// Install browser API shims automatically during SSR
			env.installBrowserAPIShims();

			const context = {
				promises: new Set(),
				fetchCache: new Map(),
				/** @type {{fetch: any}|null} */
				ssrData: null,
				track: (/** @type {Promise<any>} */ promise) => {
					if (promise && typeof promise.then === "function") {
						context.promises.add(promise);
						promise
							.finally(() => context.promises.delete(promise))
							.catch(() => {
								// Prevent unhandled rejection warnings for tracked promises
							});
					}
				},
			};

			contextStack.push(context);

			const originalFetch = globalThis.fetch;

			// Intercept fetch calls and cache responses (GET only)
			globalThis.fetch = async (url, opts = {}) => {
				try {
					const method = (opts.method || "GET").toUpperCase();
					const cacheKey = createCacheKey(url, opts);

					// Only cache GET requests for idempotency
					if (method === "GET" && context.fetchCache.has(cacheKey)) {
						return context.fetchCache.get(cacheKey);
					}

					const fetchPromise = originalFetch(url, opts).then(
						async (response) => {
							// Cache the response data
							const cloned = response.clone();
							const responseData = {
								ok: response.ok,
								status: response.status,
								statusText: response.statusText,
								headers: Array.from(response.headers.entries()),
								/** @type {any} */
								json: null,
								/** @type {any} */
								text: null,
								/** @type {any} */
								arrayBuffer: null,
								/** @type {any} */
								blob: null,
							};

							// Wrap response in Proxy to track body reads for settlement
							const responseProxy = new Proxy(response, {
								get(target, prop) {
									const value = /** @type {any} */ (target)[
										/** @type {any} */ (prop)
									];

									// Track body reading methods
									if (
										typeof value === "function" &&
										[
											"json",
											"text",
											"arrayBuffer",
											"blob",
											"formData",
										].includes(String(prop))
									) {
										return (/** @type {...any} */ ...args) => {
											const promise = value.apply(target, args);
											context.track(promise);
											return promise;
										};
									}

									return value;
								},
							});

							// Try to read as different formats (using cloned response to avoid proxy tracking)
							try {
								const contentType = response.headers.get("content-type") || "";

								if (contentType.includes("application/json")) {
									responseData.json = await cloned.json();
								} else if (contentType.includes("text/")) {
									responseData.text = await cloned.text();
								} else {
									responseData.arrayBuffer = await cloned.arrayBuffer();
								}
							} catch (_error) {
								// If parsing fails, store as text (using cloned to avoid proxy tracking)
								responseData.text = await cloned.text();
							}

							// Store in SSR cache for client hydration (GET only)
							if (method === "GET") {
								if (!context.ssrData) {
									context.ssrData = { fetch: {} };
								}
								/** @type {any} */ (context.ssrData).fetch[cacheKey] =
									responseData;
							}

							return responseProxy;
						},
					);

					context.track(fetchPromise);

					// Only cache GET requests for idempotency
					if (method === "GET") {
						context.fetchCache.set(cacheKey, fetchPromise);
					}

					return fetchPromise;
				} catch (error) {
					// Ensure fetch is restored even if interception fails
					globalThis.fetch = originalFetch;
					throw error;
				}
			};

			try {
				// Execute the wrapped function
				const result = await fn.apply(this, args);

				// Wait for all async operations to complete
				await settleAllPromises(context, timeout, maxSettleAttempts);

				// Inject SSR data into HTML if it's an HTML response
				if (typeof result === "string" && result.includes("<html")) {
					return injectSSRData(result, /** @type {any} */ (context.ssrData));
				}

				return result;
			} finally {
				// Restore original fetch and clean up context
				globalThis.fetch = originalFetch;
				contextStack.pop();
			}
		}

		// REGULAR: Non-root calls or client without hydration
		const result = await fn.apply(this, args);

		// Track promise in parent context if available
		const parentContext = contextStack[contextStack.length - 1];
		if (parentContext && result && typeof result.then === "function") {
			parentContext.track(result);
		}

		return result;
	};

	// Mark as wrapped to prevent double-wrapping
	/** @type {any} */ (wrapped)._reactiveWrapped = true;

	return wrapped;
}

/**
 * Waits for all pending promises in a context to settle with robust timeout handling.
 *
 * Prevents SSR hangs by implementing multiple timeout strategies:
 * - Global timeout: Maximum total time allowed
 * - Individual promise timeout: Per-promise timeout wrapper
 * - Graceful degradation: Continues with partial data on timeout
 *
 * @param {{promises: Set<Promise<any>>}} context - The reactive context
 * @param {number} timeout - Maximum time to wait (ms)
 * @param {number} maxAttempts - Maximum settle attempts
 * @returns {Promise<void>}
 */
async function settleAllPromises(context, timeout, maxAttempts) {
	const startTime = Date.now();
	let attempts = 0;
	const timeoutWarnings = new Set();

	/**
	 * Wraps a promise with individual timeout.
	 * @param {Promise<any>} promise - Promise to wrap
	 * @param {number} individualTimeout - Timeout for this promise
	 * @returns {Promise<any>} Timeout-wrapped promise
	 */
	const withTimeout = (promise, individualTimeout) => {
		return Promise.race([
			promise,
			new Promise((_, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error(`Promise timeout: ${individualTimeout}ms exceeded`));
				}, individualTimeout);

				// Clean up timeout if promise resolves first
				promise.finally(() => clearTimeout(timeoutId)).catch(() => {});
			}),
		]);
	};

	while (context.promises.size > 0 && attempts < maxAttempts) {
		const elapsed = Date.now() - startTime;

		// Global timeout check
		if (elapsed > timeout) {
			const pendingCount = context.promises.size;
			console.warn(
				`SSR timeout: ${pendingCount} promises still pending after ${timeout}ms. Continuing with partial data.`,
			);

			// Cancel remaining promises by removing them from tracking
			const remainingPromises = Array.from(context.promises);
			remainingPromises.forEach((promise) => {
				context.promises.delete(promise);
			});

			break;
		}

		const currentPromises = Array.from(context.promises);
		const individualTimeout = Math.min(5000, timeout - elapsed); // Max 5s per promise

		// Wrap each promise with individual timeout
		const timeoutWrappedPromises = currentPromises.map((promise) => {
			return withTimeout(promise, individualTimeout).catch(
				/** @type {(error: Error) => null} */ (error) => {
					if (error.message.includes("Promise timeout")) {
						const key = promise.toString();
						if (!timeoutWarnings.has(key)) {
							timeoutWarnings.add(key);
							console.warn(
								`Individual promise timeout (${individualTimeout}ms):`,
								error.message,
							);
						}
					}
					return null; // Graceful degradation - continue with null value
				},
			);
		});

		// Wait for current batch with graceful error handling
		try {
			await Promise.allSettled(timeoutWrappedPromises);
		} catch (error) {
			console.warn("Error during promise settlement:", error.message);
		}

		attempts++;

		// Exponential backoff for new promise detection
		if (context.promises.size > 0) {
			const backoffDelay = Math.min(100, 1 << attempts); // 2ms, 4ms, 8ms, ..., max 100ms
			await new Promise((resolve) => setTimeout(resolve, backoffDelay));
		}
	}

	// Final summary
	const finalElapsed = Date.now() - startTime;
	if (attempts >= maxAttempts) {
		console.warn(
			`SSR max attempts: stopped after ${maxAttempts} attempts (${finalElapsed}ms). ${context.promises.size} promises may still be pending.`,
		);
	}

	if (context.promises.size > 0) {
		console.warn(
			`SSR completion: ${context.promises.size} promises remain unresolved after ${finalElapsed}ms`,
		);
	}
}

/**
 * Safely escapes JSON for embedding in HTML script tags.
 * Prevents XSS by escaping dangerous characters and Unicode line separators.
 *
 * @param {any} data - Data to escape
 * @returns {string} XSS-safe JSON string
 */
function escapeJsonForScript(data) {
	return JSON.stringify(data)
		.replace(/</g, "\\u003c") // Escape < to prevent </script> injection
		.replace(/>/g, "\\u003e") // Escape > for symmetry
		.replace(/\u2028/g, "\\u2028") // Escape Unicode line separator
		.replace(/\u2029/g, "\\u2029"); // Escape Unicode paragraph separator
}

/**
 * Injects SSR data into HTML as a script tag.
 * Includes XSS protection and size cap to prevent payload abuse.
 *
 * @param {string} html - The HTML content
 * @param {Object} ssrData - The SSR data to inject
 * @returns {string} HTML with injected SSR data
 */
function injectSSRData(html, ssrData) {
	if (!ssrData || Object.keys(ssrData).length === 0) {
		return html;
	}

	// Size cap: skip injection if payload is too large (512KB)
	const jsonString = escapeJsonForScript(ssrData);
	const maxSize = 512 * 1024; // 512KB

	if (jsonString.length > maxSize) {
		console.warn(
			`SSR payload too large (${Math.round(jsonString.length / 1024)}KB > ${maxSize / 1024}KB). Skipping injection to prevent HTML bloat.`,
		);
		return html;
	}

	// Check for optional CSP nonce
	const nonce = /** @type {any} */ (globalThis).__REFLEX_CSP_NONCE__;
	const nonceAttr = nonce ? ` nonce="${nonce}"` : "";

	const ssrScript = `<script${nonceAttr}>window.__SSR_DATA__ = ${jsonString};</script>`;

	// Try to inject before closing head tag
	if (html.includes("</head>")) {
		return html.replace("</head>", `${ssrScript}</head>`);
	}

	// Fallback: inject before closing body tag
	if (html.includes("</body>")) {
		return html.replace("</body>", `${ssrScript}</body>`);
	}

	// Fallback: inject before closing html tag
	if (html.includes("</html>")) {
		return html.replace("</html>", `${ssrScript}</html>`);
	}

	// Last resort: append to end
	return html + ssrScript;
}

// Export env for testing
export { env };
