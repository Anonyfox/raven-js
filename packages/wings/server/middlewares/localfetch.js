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
let fetchPatched = false;

/** @type {typeof globalThis.fetch} */
let originalFetch;

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
function resolveAgainstOrigin(relative, origin) {
  try {
    return new URL(relative, origin).toString();
  } catch {
    return relative;
  }
}

/**
 * Patch global fetch() once with a context-aware resolver.
 */
function patchFetchOnce() {
  if (fetchPatched) return;
  originalFetch = globalThis.fetch;

  /**
   * @param {any} url
   * @param {RequestInit} [options]
   */
  globalThis.fetch = (url, options = {}) => {
    const store = requestContext.getStore();

    // No store or absolute URL → pass through untouched
    if (!store || !isRelativeUrl(url)) {
      return originalFetch(url, options);
    }

    try {
      const resolvedUrl = resolveAgainstOrigin(String(url), store.origin);
      const headers = new Headers(options.headers);
      // Blanket-forward request headers (do not override explicit caller headers)
      for (const [key, value] of store.headers.entries()) {
        // Apply allow/deny filters if configured
        if (store.allow && !matchesAny(key, store.allow)) continue;
        if (store.deny && matchesAny(key, store.deny)) continue;
        if (!headers.has(key)) headers.set(key, value);
      }

      return originalFetch(resolvedUrl, { ...options, headers });
    } catch {
      return originalFetch(url, options);
    }
  };

  fetchPatched = true;
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
      requestContext.enterWith(store);

      // Register after-callback to clear references ASAP post-response
      ctx.addAfterCallback(
        new Middleware(() => {
          // Best-effort cleanup (ALS will naturally GC with async context end)
          store.headers = new Headers();
          store.origin = "";
          store.allow = null;
          store.deny = null;
        }, `${identifier}-cleanup`)
      );
    }, identifier);
  }
}
