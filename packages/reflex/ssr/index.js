/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import {
	__getWriteVersion,
	afterFlush,
	withTemplateContext,
} from "../index.js";

// Get the same global singleton used by the core.
const __g = /** @type {any} */ (globalThis);
if (!__g.__REFLEX_CONTEXT_STACK__) __g.__REFLEX_CONTEXT_STACK__ = [];
const contextStack =
	/** @type {Array<{promises:Set<Promise<any>>, track(p:Promise<any>):void}>} */ (
		__g.__REFLEX_CONTEXT_STACK__
	);

/* ---------------- base URL + cache key ---------------- */

/**
 * Resolve the origin for absolute URL resolution.
 * Uses RAVENJS_ORIGIN environment variable set by Wings server.
 * @returns {string}
 * @throws {Error} When RAVENJS_ORIGIN is not set (server) or location unavailable (client)
 */
function getBaseURL() {
	// Server: RAVENJS_ORIGIN is the single source of truth
	if (typeof globalThis.window === "undefined") {
		if (!process.env.RAVENJS_ORIGIN) {
			throw new Error(
				"RAVENJS_ORIGIN environment variable must be set for SSR. Wings server sets this automatically.",
			);
		}
		return process.env.RAVENJS_ORIGIN;
	}

	// Client: browser location
	if (globalThis.location?.href) {
		return globalThis.location.origin;
	}

	throw new Error("Unable to determine origin: no location available");
}

/**
 * Canonical cache key so server and client match.
 * @param {string|URL|Request} url
 * @param {RequestInit} [opts]
 * @returns {string}
 */
export function createCacheKey(url, opts = {}) {
	let urlString;
	if (url instanceof URL) urlString = url.toString();
	else if (typeof url === "object" && /** @type {any} */ (url).url)
		urlString = /** @type {any} */ (url).url;
	else urlString = String(url);

	const absolute = new URL(urlString, getBaseURL()).toString();
	const method = (opts.method || "GET").toUpperCase();

	/** @type {Record<string,string>} */
	const headers = {};
	if (opts.headers) {
		if (opts.headers instanceof Headers) {
			for (const [k, v] of opts.headers.entries()) headers[k.toLowerCase()] = v;
		} else {
			for (const [k, v] of Object.entries(opts.headers))
				headers[k.toLowerCase()] = String(v);
		}
	}

	let bodyHash = null;
	if (opts.body && method !== "GET") {
		bodyHash =
			typeof opts.body === "string"
				? `${opts.body.length}:${opts.body.slice(0, 100)}`
				: "[object]";
	}
	return JSON.stringify({ url: absolute, method, headers, bodyHash });
}

/* ---------------- helpers ---------------- */

/**
 * Escape JSON for safe inline script embedding.
 * @param {any} data
 * @returns {string}
 */
function escapeJson(data) {
	return JSON.stringify(data)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

/**
 * Inline component-scoped SSR data right after component HTML.
 * @param {string} html
 * @param {{fetch:Record<string, any>}} ssrData
 * @param {string} cid
 * @returns {string}
 */
function injectSSRData(html, ssrData, cid) {
	if (!ssrData || Object.keys(ssrData).length === 0) return html;
	const json = escapeJson(ssrData);
	if (json.length > 512 * 1024) return html; // cap at 512KB

	const nonce = /** @type {any} */ (globalThis).__REFLEX_CSP_NONCE__;
	const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
	return `${html}<script${nonceAttr}>window.__SSR_DATA__${cid}=${json};</script>`;
}

/**
 * Wait for all tracked promises to settle with timeouts.
 * @param {{promises:Set<Promise<any>>}} ctx
 * @param {number} timeoutTotal
 * @param {number} maxAttempts
 */
async function settleAllPromises(ctx, timeoutTotal, maxAttempts) {
	const start = Date.now();
	let attempts = 0;

	while (ctx.promises.size > 0 && attempts < maxAttempts) {
		const elapsed = Date.now() - start;
		if (elapsed > timeoutTotal) {
			// eslint-disable-next-line no-console
			console.warn(
				`SSR timeout: ${ctx.promises.size} pending after ${timeoutTotal}ms`,
			);
			break;
		}
		const batch = Array.from(ctx.promises);
		await Promise.allSettled(
			batch.map((p) => {
				// soft per-promise timeout (max 5s or remaining time)
				const per = Math.min(5000, timeoutTotal - elapsed);
				return Promise.race([
					p,
					new Promise((_, rej) =>
						setTimeout(() => rej(new Error("promise timeout")), per),
					),
				]).catch(() => {});
			}),
		);
		attempts++;
		if (ctx.promises.size > 0) {
			await new Promise((r) => setTimeout(r, Math.min(100, 1 << attempts))); // backoff
		}
	}
}

/* ---------------- ssr(fn) ---------------- */

/**
 * Wrap a function for SSR + component-scoped hydration.
 * Works seamlessly with `effect(async () => fetch(...))`.
 *
 * @template T
 * @param {(...a:any) => T|Promise<T>} fn
 * @param {{
 *   timeout?: number,
 *   maxSettleAttempts?: number,
 *   maxPasses?: number,
 *   _testComponentId?: string
 * }} [options]
 * @returns {(...a:any) => Promise<T>}
 */
export function ssr(fn, options = {}) {
	if (/** @type {any} */ (fn)._ssrWrapped) return /** @type {any} */ (fn);

	const {
		timeout = 10000,
		maxSettleAttempts = 100,
		maxPasses = 8,
		_testComponentId,
	} = options;

	const cid =
		_testComponentId ||
		(typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
			: (
					Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
				).slice(-8));

	const wrapped = async function (/** @type {...any} */ ...args) {
		const isServer =
			typeof globalThis.window === "undefined" ||
			(typeof globalThis.window !== "undefined" &&
				globalThis.window?.navigator?.userAgent === "Node.js");
		const isClient =
			typeof globalThis.window !== "undefined" &&
			(!globalThis.window?.navigator ||
				globalThis.window?.navigator.userAgent !== "Node.js");
		const isRoot = contextStack.length === 0;

		// Hydration: serve from component-scoped cache on the client, then restore fetch.
		if (
			isClient &&
			isRoot &&
			typeof globalThis.window !== "undefined" &&
			globalThis.window &&
			Object.keys(globalThis.window).some((k) => k.startsWith("__SSR_DATA__"))
		) {
			const orig = globalThis.fetch;

			// find a cached entry across any component-scoped SSR blob
			/** @param {string} cacheKey */
			function findCached(cacheKey) {
				const w = /** @type {any} */ (globalThis.window);
				for (const k of Object.keys(w)) {
					if (!k.startsWith("__SSR_DATA__")) continue;
					const bag = w[k];
					const entry = bag?.fetch?.[cacheKey];
					if (entry) return { bag, key: k, entry };
				}
				return null;
			}

			globalThis.fetch = (url, opts = {}) => {
				const key = createCacheKey(url, opts);
				const hit = findCached(key);

				if (hit) {
					// consume this entry
					delete hit.bag.fetch[key];
					if (Object.keys(hit.bag.fetch).length === 0) {
						delete (/** @type {any} */ (globalThis.window)[hit.key]);
					}

					// normalize absolute URL for the Response-like object
					let urlString;
					if (url instanceof URL) urlString = url.toString();
					else if (typeof url === "object" && /** @type {any} */ (url).url)
						urlString = /** @type {any} */ (url).url;
					else urlString = String(url);
					const absolute = new URL(urlString, getBaseURL()).toString();

					const cached = hit.entry;
					return /** @type {Promise<Response>} */ (
						Promise.resolve({
							ok: cached.ok,
							status: cached.status,
							statusText: cached.statusText,
							headers: new Headers(cached.headers),
							url: absolute,
							redirected: false,
							type: "basic",
							body: null,
							bodyUsed: false,
							json: () => Promise.resolve(cached.json),
							text: () => Promise.resolve(cached.text),
							arrayBuffer: () => Promise.resolve(cached.arrayBuffer),
							blob: () => Promise.resolve(cached.blob),
							clone() {
								return this;
							},
							formData: () =>
								Promise.reject(
									new Error("formData not available in SSR cache"),
								),
							bytes: () =>
								Promise.resolve(cached.arrayBuffer || new ArrayBuffer(0)),
						})
					);
				}

				const absolute = new URL(String(url), getBaseURL()).toString();
				return orig(absolute, opts);
			};

			// Don't restore fetch immediately - let deferred effects run first
			try {
				const result = /** @type {any} */ (await fn.apply(this, args));

				// Wait for the next flush cycle to complete before restoring fetch
				// This ensures deferred effects get to use the SSR cache
				afterFlush().then(() => {
					globalThis.fetch = orig;
				});

				return result;
			} catch (error) {
				globalThis.fetch = orig;
				throw error;
			}
		}

		// Server root: do a settle loop
		if (isServer && isRoot) {
			const ctx = {
				promises: new Set(),
				fetchCache: new Map(),
				ssrData: /** @type {{fetch:Record<string,any>}|null} */ (null),
				track(/** @type {Promise<any>} */ p) {
					if (p && typeof p.then === "function") {
						this.promises.add(p);
						p.finally(() => this.promises.delete(p)).catch(() => {});
					}
				},
			};
			contextStack.push(ctx);

			const orig = globalThis.fetch;

			globalThis.fetch = async (url, opts = {}) => {
				const method = (opts.method || "GET").toUpperCase();
				const key = createCacheKey(url, opts);
				if (method === "GET" && ctx.fetchCache.has(key))
					return ctx.fetchCache.get(key);

				const absolute = (() => {
					if (url instanceof URL) return url.toString();
					if (typeof url === "object" && /** @type {any} */ (url).url)
						url = /** @type {any} */ (url).url;
					return new URL(String(url), getBaseURL()).toString();
				})();

				const p = orig(absolute, opts).then(async (resp) => {
					const clone = resp.clone();
					const data = {
						ok: resp.ok,
						status: resp.status,
						statusText: resp.statusText,
						headers: Array.from(resp.headers.entries()),
						json: /** @type {any} */ (null),
						text: /** @type {any} */ (null),
						arrayBuffer: /** @type {any} */ (null),
						blob: /** @type {any} */ (null),
					};

					// Track body reads on the response we return
					const proxy = new Proxy(resp, {
						get(target, prop) {
							const v = /** @type {any} */ (target)[/** @type {any} */ (prop)];
							if (
								typeof v === "function" &&
								["json", "text", "arrayBuffer", "blob", "formData"].includes(
									String(prop),
								)
							) {
								return (/** @type {...any} */ ...a) => {
									const bp = v.apply(target, a);
									ctx.track(bp);
									return bp;
								};
							}
							return v;
						},
					});

					// Try to pre-read a representation for hydration cache
					try {
						const ct = resp.headers.get("content-type") || "";
						if (ct.includes("application/json")) data.json = await clone.json();
						else if (ct.includes("text/")) data.text = await clone.text();
						else data.arrayBuffer = await clone.arrayBuffer();
					} catch {
						try {
							data.text = await clone.text();
						} catch {}
					}

					if (method === "GET") {
						if (!ctx.ssrData) ctx.ssrData = { fetch: {} };
						ctx.ssrData.fetch[key] = data;
					}
					return proxy;
				});

				ctx.track(p);
				if (method === "GET") ctx.fetchCache.set(key, p);
				return p;
			};

			// stable render scope across passes (prevents instance churn)
			const scope = { slots: /** @type {any[]} */ ([]), cursor: 0 };
			let html = "";
			let prevHtml = "";
			let prevVer = __getWriteVersion();
			let pass = 0;

			try {
				while (pass++ < maxPasses) {
					const out = withTemplateContext(() => fn.apply(this, args), scope);
					html = await Promise.resolve(out);

					// 1) run deferred effects (handled by withTemplateContext root)
					// 2) flush graph
					await afterFlush();
					// 3) settle async
					await settleAllPromises(ctx, timeout, maxSettleAttempts);
					// 4) final flush
					await afterFlush();

					const stable =
						ctx.promises.size === 0 &&
						__getWriteVersion() === prevVer &&
						html === prevHtml;

					// Debug hook for tracing SSR behavior
					if (/** @type {any} */ (globalThis).__REFLEX_DEBUG__) {
						// eslint-disable-next-line no-console
						console.log("[SSR] pass", pass, {
							promises: ctx.promises.size,
							writeVersion: __getWriteVersion(),
							htmlChanged: html !== prevHtml,
							stable,
						});
					}

					if (stable) break;

					prevVer = __getWriteVersion();
					prevHtml = html;
				}
			} finally {
				globalThis.fetch = orig;
				contextStack.pop();
			}

			if (typeof html === "string" && ctx.ssrData) {
				return /** @type {any} */ (injectSSRData(html, ctx.ssrData, cid));
			}
			return /** @type {any} */ (html);
		}

		// Fallback (non-root / non-SSR)
		const res = await fn.apply(this, args);
		const parent = contextStack[contextStack.length - 1];
		if (parent && res && typeof res.then === "function") parent.track(res);
		return /** @type {any} */ (res);
	};

	/** @type {any} */ (wrapped)._ssrWrapped = true;
	return wrapped;
}
