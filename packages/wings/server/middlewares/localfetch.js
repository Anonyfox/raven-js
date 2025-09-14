/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { Middleware } from "../../core/middleware.js";

/**
 * @file LocalFetch middleware: transparent, request-scoped enhancement for server-side fetch().
 *
 * Makes server-side fetch() behave like the browser during request handling:
 * - Resolves relative URLs against the current request origin
 * - Forwards Authorization and Cookie headers for session continuity
 * - Leaves absolute/external URLs untouched
 *
 * Zero configuration. Zero dependencies. Platform-native AsyncLocalStorage for isolation.
 */

/** @type {AsyncLocalStorage<{origin:string, headers:Headers, allow:(string|RegExp)[]|null, deny:(string|RegExp)[]|null}>} */
const requestContext = new AsyncLocalStorage();

/** @type {boolean} */
let _fetchPatched = false;
/** @type {((...a:any[])=>any) | null} */
let enhancedFetchFn = null;

/** @type {typeof globalThis.fetch} */
let originalFetch;

/**
 * Fallback store for environments where AsyncLocalStorage does not propagate as expected.
 * Cleared in after-callback; prevents cross-request leakage while enabling unit tests.
 * @type {null | {origin:string, headers:Headers, allow:(string|RegExp)[]|null, deny:(string|RegExp)[]|null}}
 */
let lastStore = null;

const GLOBAL_STORE_KEY = Symbol.for("@raven-js/wings/localfetch/store");

/**
 * Determine whether a value represents a relative URL that should be enhanced.
 *
 * Only strings that start with '/', './', or '../' are considered relative.
 * URL and Request objects are treated as absolute and forwarded as-is.
 *
 * @param {unknown} url
 * @returns {boolean}
 */
function isRelativeUrl(url) {
  if (url instanceof URL) return false;
  // Request objects always contain absolute URLs in Node fetch
  if (url && typeof url === "object" && /** @type {any} */ (url).url) return false;
  const s = String(url);
  return s.startsWith("/") || s.startsWith("./") || s.startsWith("../");
}

/**
 * Resolve a relative URL against an origin string.
 *
 * @param {string} relative
 * @param {string} origin
 * @returns {string}
 */
// (legacy helper removed)

/**
 * Normalize any input (string|URL|Request-like) to a URL instance.
 *
 * @param {any} url
 * @param {string} origin
 * @returns {URL}
 */
function toAbsoluteUrl(url, origin) {
  if (url instanceof URL) return url;
  if (url && typeof url === "object" && /** @type {any} */ (url).url) {
    const s = /** @type {any} */ (url).url;
    return new URL(String(s), origin);
  }
  return new URL(String(url), origin);
}

/**
 * Decide whether to attach an https.Agent that ignores certificate validation for local/internal hosts.
 * Returns the agent instance (cached per call site via dynamic import) or null.
 *
 * Criteria: protocol https, hostname in { localhost, 127.0.0.1, 0.0.0.0 } or matches request host (same-origin dev certs).
 *
 * @param {URL} url
 * @param {string} requestOrigin
 * @returns {any|null}
 */
function shouldAttachInsecureAgent(url, requestOrigin) {
  try {
    if (typeof process === "undefined" || !process.versions?.node) return null;
    if (url.protocol !== "https:") return null;
    const host = url.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
    const reqHost = new URL(requestOrigin).hostname;
    const sameHost = host === reqHost;
    if (!isLocalHost && !sameHost) return null;

    const nodeHttps = "node:" + "https";
    // Dynamic import keeps browser bundles safe and avoids cost if not needed
    return import(nodeHttps).then((https) => new https.Agent({ rejectUnauthorized: false }));
  } catch {
    return null;
  }
}

/**
 * Patch global fetch() once with a context-aware resolver.
 */
function patchFetchOnce() {
  // Don't patch if SSR is active (it wraps fetch temporarily)
  if (/** @type {any} */ (globalThis).__SSR_FETCH_ACTIVE__) return;

  // Re-patch if global fetch changed since last enhancement
  if (enhancedFetchFn && globalThis.fetch === enhancedFetchFn) return;
  originalFetch = globalThis.fetch;

  /**
   * @param {any} url
   * @param {RequestInit} [options]
   */
  const enhanced = async (url, options = {}) => {
    const globalStore = /** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] || null;
    const store = requestContext.getStore() || lastStore || globalStore;

    // No request-scoped store → passthrough entirely
    if (!store) return originalFetch(url, options);

    // Relative URLs: resolve against request origin, forward headers, and apply dev/prod self-signed https agent for internal hosts
    if (isRelativeUrl(url)) {
      try {
        const absoluteUrl = new URL(String(url), store.origin);
        const headers = new Headers(options.headers);
        for (const [key, value] of store.headers.entries()) {
          if (store.allow && !matchesAny(key, store.allow)) continue;
          if (store.deny && matchesAny(key, store.deny)) continue;
          if (!headers.has(key)) headers.set(key, value);
        }

        // Prepare fetch options (clone lazily)
        let fetchOpts = /** @type {RequestInit & { agent?: any }} */ (options);
        const agentPromise = shouldAttachInsecureAgent(absoluteUrl, store.origin);
        if (agentPromise) {
          const agent = await agentPromise;
          if (agent) {
            fetchOpts = { ...options };
            /** @type {any} */ (fetchOpts).agent = agent;
          }
        }

        return originalFetch(absoluteUrl.toString(), { ...fetchOpts, headers });
      } catch {
        return originalFetch(url, options);
      }
    }

    // Absolute URLs: do not forward headers, but attach https agent for internal/self hosts if needed
    try {
      const absoluteUrl = toAbsoluteUrl(url, store.origin);
      const agentPromise = shouldAttachInsecureAgent(absoluteUrl, store.origin);
      if (agentPromise) {
        const agent = await agentPromise;
        if (agent) {
          const fetchOpts = { ...options };
          /** @type {any} */ (fetchOpts).agent = agent;
          return originalFetch(url, fetchOpts);
        }
      }
    } catch {}
    return originalFetch(url, options);
  };

  globalThis.fetch = enhanced;
  enhancedFetchFn = enhanced;

  _fetchPatched = true;
}

/**
 * Case-insensitive header name matcher against an array of strings/regexes.
 *
 * @param {string} name
 * @param {(string|RegExp)[]} patterns
 */
function matchesAny(name, patterns) {
  const lower = name.toLowerCase();
  for (const p of patterns) {
    if (typeof p === "string") {
      if (lower === p.toLowerCase()) return true;
    } else if (p instanceof RegExp) {
      if (p.test(name)) return true;
    }
  }
  return false;
}

/**
 * LocalFetch middleware.
 *
 * Lifecycle:
 * - Before: enter AsyncLocalStorage with request-scoped store
 * - After: clear references from the store to help GC (defensive)
 */
export class LocalFetch extends Middleware {
  /**
   * @param {{
   *   allow?: (string|RegExp)[]|null,
   *   deny?: (string|RegExp)[]|null,
   * }|string} [optionsOrIdentifier]
   * @param {string} [maybeIdentifier]
   */
  constructor(optionsOrIdentifier = "@raven-js/wings/localfetch", maybeIdentifier) {
    /** @type {(string|RegExp)[]|null} */
    const allow =
      typeof optionsOrIdentifier === "object" && optionsOrIdentifier && !Array.isArray(optionsOrIdentifier)
        ? (optionsOrIdentifier.allow ?? null)
        : null;
    /** @type {(string|RegExp)[]|null} */
    const deny =
      typeof optionsOrIdentifier === "object" && optionsOrIdentifier && !Array.isArray(optionsOrIdentifier)
        ? (optionsOrIdentifier.deny ?? null)
        : null;

    const identifier =
      typeof optionsOrIdentifier === "string"
        ? optionsOrIdentifier
        : typeof maybeIdentifier === "string"
          ? maybeIdentifier
          : "@raven-js/wings/localfetch";

    super(async (/** @type {import('../../core/context.js').Context} */ ctx) => {
      // Ensure fetch() is patched once globally
      patchFetchOnce();

      // Create per-request store using Context’s origin fields
      const store = {
        origin: ctx.origin,
        headers: ctx.requestHeaders,
        allow,
        deny,
      };

      // Enter store for the remainder of this async request lifecycle
      lastStore = store; // test-safety fallback
      /** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] = store;
      requestContext.enterWith(store);

      // Register after-callback to clear references ASAP post-response
      ctx.addAfterCallback(
        new Middleware(() => {
          // Best-effort cleanup (ALS will naturally GC with async context end)
          store.headers = new Headers();
          store.origin = "";
          store.allow = null;
          store.deny = null;
          if (lastStore === store) lastStore = null;
          if (/** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] === store) {
            /** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] = null;
          }
        }, `${identifier}-cleanup`)
      );
    }, identifier);
  }
}
