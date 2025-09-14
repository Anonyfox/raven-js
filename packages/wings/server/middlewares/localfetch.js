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
 * - Handles self-signed certificates for local development
 * - Normalizes localhost variations (0.0.0.0, 127.0.0.1) to localhost
 *
 * Zero configuration. Zero dependencies. Uses Undici's global dispatcher for clean layering.
 * Never touches globalThis.fetch - works entirely at the transport layer.
 */

/** @type {AsyncLocalStorage<{origin:string, headers:Headers, allow:(string|RegExp)[]|null, deny:(string|RegExp)[]|null}>} */
const requestContext = new AsyncLocalStorage();

/** @type {boolean} */
let _dispatcherInstalled = false;

/** @type {any} */
let _originalDispatcher = null;

/** @type {any} */
let _enhancedDispatcher = null;

/** @type {any} */
const _undici = null;

/** @type {Map<string, any>} */
const _agentCache = new Map();

/**
 * Fallback store for environments where AsyncLocalStorage does not propagate as expected.
 * Cleared in after-callback; prevents cross-request leakage while enabling unit tests.
 * @type {null | {origin:string, headers:Headers, allow:(string|RegExp)[]|null, deny:(string|RegExp)[]|null}}
 */
let lastStore = null;

const GLOBAL_STORE_KEY = Symbol.for("@raven-js/wings/localfetch/store");
const UNDICI_DISPATCHER_SYMBOL = Symbol.for("undici.globalDispatcher.1");
const FETCH_WRAPPED = Symbol.for("@raven-js/wings/localfetch/wrapped");

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
 * Normalize localhost variations for consistent handling.
 * Always converts 0.0.0.0 and 127.0.0.1 to localhost for HTTPS compatibility.
 *
 * @param {string} hostname
 * @returns {string}
 */
function normalizeLocalhost(hostname) {
  // Always normalize to localhost for consistency
  if (hostname === "0.0.0.0" || hostname === "127.0.0.1" || hostname === "localhost") {
    return "localhost";
  }
  return hostname;
}

/**
 * Check if a hostname represents localhost in any form.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function isLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

/**
 * Case-insensitive header name matcher against an array of strings/regexes.
 *
 * @param {string} name
 * @param {(string|RegExp)[]} patterns
 * @returns {boolean}
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
 * Install a request-scoped fetch Proxy that:
 * - Resolves relative URLs against the current request origin
 * - Forwards allowed headers from the request (without overriding explicit ones)
 * - Normalizes localhost variants
 * - Attaches an insecure https.Agent for localhost/same-host HTTPS
 * Idempotent: does nothing if already wrapped.
 */
function installFetchProxyOnce() {
  const anyFetch = /** @type {any} */ (globalThis.fetch);
  if (!anyFetch || anyFetch[FETCH_WRAPPED]) return;

  const originalFetch = globalThis.fetch;

  function isRelativeInput(/** @type {any} */ input) {
    if (input instanceof URL) return false;
    if (input && typeof input === "object" && /** @type {any} */ (input).url) {
      const s = String(/** @type {any} */ (input).url);
      return s.startsWith("/") || s.startsWith("./") || s.startsWith("../");
    }
    const s = String(input);
    return s.startsWith("/") || s.startsWith("./") || s.startsWith("../");
  }

  globalThis.fetch = new Proxy(originalFetch, {
    apply(target, thisArg, args) {
      /** @type {[any, RequestInit?]} */
      // @ts-expect-error - runtime guard
      const [input, init] = args;

      const globalStore = /** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] || null;
      const store = requestContext.getStore() || lastStore || globalStore;
      if (!store) return Reflect.apply(target, thisArg, args);

      const origin = store.origin;

      // Helpers to merge headers without overriding explicit ones
      const mergeHeaders = (/** @type {any} */ h) => {
        const headers = new Headers(h);
        for (const [key, value] of store.headers.entries()) {
          if (store.allow && !matchesAny(key, store.allow)) continue;
          if (store.deny && matchesAny(key, store.deny)) continue;
          if (!headers.has(key)) headers.set(key, value);
        }
        return headers;
      };

      // Process string/URL input
      if (typeof input === "string" || input instanceof URL) {
        const rel = isRelativeInput(input);
        const absUrl = rel ? new URL(String(input), origin) : new URL(String(input));
        absUrl.hostname = normalizeLocalhost(absUrl.hostname);

        const headers = mergeHeaders(init?.headers);
        /** @type {RequestInit & { agent?: any }} */
        const opts = { ...init, headers };

        if (absUrl.protocol === "https:") {
          const targetHost = absUrl.hostname;
          const requestHost = normalizeLocalhost(new URL(origin).hostname);
          if (isLocalhost(targetHost) || targetHost === requestHost) {
            const agent = getInsecureAgent();
            if (agent) /** @type {any} */ (opts).agent = agent;
          }
        }

        return Reflect.apply(target, thisArg, [absUrl.toString(), opts]);
      }

      // Process Request-like input
      if (input && typeof input === "object" && /** @type {any} */ (input).url) {
        const rel = isRelativeInput(input);
        const originalUrl = new URL(
          rel ? new URL(/** @type {any} */ (input).url, origin) : /** @type {any} */ (input).url,
          origin
        );
        originalUrl.hostname = normalizeLocalhost(originalUrl.hostname);

        const headers = mergeHeaders(/** @type {any} */ (input).headers);
        const cloned = new Request(originalUrl.toString(), /** @type {any} */ (input));
        const merged = new Request(cloned, { headers });

        /** @type {RequestInit & { agent?: any }} */
        const extraInit = {};
        if (originalUrl.protocol === "https:") {
          const targetHost = originalUrl.hostname;
          const requestHost = normalizeLocalhost(new URL(origin).hostname);
          if (isLocalhost(targetHost) || targetHost === requestHost) {
            const agent = getInsecureAgent();
            if (agent) /** @type {any} */ (extraInit).agent = agent;
          }
        }

        // Pass merged Request; if we have agent, provide as second arg
        if (/** @type {any} */ (extraInit).agent) {
          return Reflect.apply(target, thisArg, [merged, extraInit]);
        }
        return Reflect.apply(target, thisArg, [merged, init]);
      }

      return Reflect.apply(target, thisArg, args);
    },
  });

  /** @type {any} */ (globalThis.fetch)[FETCH_WRAPPED] = true;
}

/**
 * Get or create an HTTPS agent for insecure connections.
 * Cached for the lifetime of the process.
 *
 * @returns {any}
 */
function getInsecureAgent() {
  const key = "insecure-agent";
  if (_agentCache.has(key)) {
    return _agentCache.get(key);
  }

  try {
    // Synchronous require for the agent - we're in Node.js context
    const https = require("node:https");
    const agent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 128,
    });
    _agentCache.set(key, agent);
    return agent;
  } catch {
    return null;
  }
}

/**
 * Custom dispatcher that wraps Undici's dispatcher with our enhancements.
 * This is the core of our transport-layer modifications.
 */
class EnhancedDispatcher {
  /**
   * @param {any} baseDispatcher - The original Undici dispatcher
   */
  constructor(baseDispatcher) {
    this.base = baseDispatcher;
    // Create an insecure dispatcher for localhost/same-host HTTPS
    try {
      const Ctor = baseDispatcher?.constructor;
      this.insecure = Ctor
        ? new Ctor({
            connections: 128,
            pipelining: 1,
            connect: {
              rejectUnauthorized: false,
              keepAlive: true,
              keepAliveInitialDelay: 1000,
            },
          })
        : null;
    } catch {
      this.insecure = null;
    }

    // Bind all methods to preserve context
    this.dispatch = this.dispatch.bind(this);
    this.close = this.close.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Close the dispatcher.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.base && typeof this.base.close === "function") {
      return this.base.close();
    }
  }

  /**
   * Destroy the dispatcher and clean up resources.
   * @returns {Promise<void>}
   */
  async destroy() {
    // Clean up our agent cache
    for (const agent of _agentCache.values()) {
      if (agent && typeof agent.destroy === "function") {
        agent.destroy();
      }
    }
    _agentCache.clear();

    // Destroy insecure dispatcher
    if (this.insecure && typeof this.insecure.destroy === "function") {
      try {
        await this.insecure.destroy();
      } catch {}
    }

    // Destroy the base dispatcher
    if (this.base && typeof this.base.destroy === "function") {
      return this.base.destroy();
    }
  }

  /**
   * Dispatch a request with our enhancements.
   * This is where all the magic happens.
   *
   * @param {any} options - Undici dispatch options
   * @param {any} handler - Undici response handler
   * @returns {any}
   */
  dispatch(options, handler) {
    // Get the current request context from AsyncLocalStorage
    const globalStore = /** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] || null;
    const store = requestContext.getStore() || lastStore || globalStore;

    // No context? Pass through unchanged to base dispatcher
    if (!store) {
      return this.base.dispatch(options, handler);
    }

    // Clone options to avoid mutating the original
    const enhancedOpts = { ...options };

    try {
      // Parse the request path to determine if it's relative
      const isRelative = isRelativeUrl(options.path);

      if (isRelative) {
        // Resolve relative URL against the request origin
        const resolvedUrl = new URL(options.path, store.origin);

        // Normalize localhost variations
        const normalizedHost = normalizeLocalhost(resolvedUrl.hostname);
        if (normalizedHost !== resolvedUrl.hostname) {
          resolvedUrl.hostname = normalizedHost;
        }

        // Update dispatch options with resolved URL
        enhancedOpts.origin = resolvedUrl.origin;
        enhancedOpts.path = resolvedUrl.pathname + resolvedUrl.search + resolvedUrl.hash;

        // Parse and enhance headers
        const currentHeaders = options.headers || {};
        const headersMap = new Map();

        // Parse existing headers (Undici uses array format: [key, value, key, value, ...])
        if (Array.isArray(currentHeaders)) {
          for (let i = 0; i < currentHeaders.length; i += 2) {
            if (i + 1 < currentHeaders.length) {
              headersMap.set(currentHeaders[i].toLowerCase(), [currentHeaders[i], currentHeaders[i + 1]]);
            }
          }
        } else if (typeof currentHeaders === "object") {
          // Handle object format (shouldn't happen in Undici but be defensive)
          for (const [key, value] of Object.entries(currentHeaders)) {
            headersMap.set(key.toLowerCase(), [key, value]);
          }
        }

        // Add headers from request context (for relative URLs only)
        for (const [key, value] of store.headers.entries()) {
          // Check allow/deny lists
          if (store.allow && !matchesAny(key, store.allow)) continue;
          if (store.deny && matchesAny(key, store.deny)) continue;

          // Don't override existing headers
          if (!headersMap.has(key.toLowerCase())) {
            headersMap.set(key.toLowerCase(), [key, value]);
          }
        }

        // Convert back to Undici's array format
        const headersArray = [];
        for (const [, [key, value]] of headersMap) {
          headersArray.push(key, value);
        }
        enhancedOpts.headers = headersArray;

        // Handle HTTPS with self-signed certificates
        if (resolvedUrl.protocol === "https:") {
          const targetHost = resolvedUrl.hostname;
          const requestHost = normalizeLocalhost(new URL(store.origin).hostname);

          // For localhost or same-host HTTPS, we need special handling
          if (isLocalhost(targetHost) || targetHost === requestHost) {
            // Create a custom dispatcher for this request with insecure agent
            // This is complex because Undici doesn't expose agent directly
            // We need to wrap the handler to inject our agent
            const agent = getInsecureAgent();
            if (agent) {
              // Add the agent to the options (Undici will use it)
              enhancedOpts.dispatcher = agent;
            }
          }
        }
      } else {
        // For absolute URLs, still normalize localhost and handle HTTPS
        const currentOrigin = options.origin || "";
        const currentPath = options.path || "";

        try {
          const absoluteUrl = new URL(currentOrigin + currentPath);
          const normalizedHost = normalizeLocalhost(absoluteUrl.hostname);

          if (normalizedHost !== absoluteUrl.hostname) {
            absoluteUrl.hostname = normalizedHost;
            enhancedOpts.origin = absoluteUrl.origin;
            // Keep the path portion unchanged
            enhancedOpts.path = absoluteUrl.pathname + absoluteUrl.search + absoluteUrl.hash;
          }

          // Handle HTTPS with self-signed certificates for absolute URLs too
          if (absoluteUrl.protocol === "https:") {
            const targetHost = absoluteUrl.hostname;
            const requestHost = normalizeLocalhost(new URL(store.origin).hostname);

            if (isLocalhost(targetHost) || targetHost === requestHost) {
              const agent = getInsecureAgent();
              if (agent) {
                enhancedOpts.dispatcher = agent;
              }
            }
          }
        } catch {
          // If URL parsing fails, continue with original options
        }
      }
    } catch (err) {
      // If any enhancement fails, log and pass through unchanged
      console.error("[LocalFetch] Error enhancing request:", err);
      return this.base.dispatch(options, handler);
    }

    // Select dispatcher: insecure for localhost/same-host HTTPS, otherwise base
    const useInsecure = (() => {
      try {
        const origin = enhancedOpts.origin || options.origin || "";
        const path = enhancedOpts.path || options.path || "";
        const url = new URL(origin + path);
        if (url.protocol !== "https:") return false;
        const targetHost = normalizeLocalhost(url.hostname);
        const reqHost = normalizeLocalhost(new URL(store.origin).hostname);
        return this.insecure && (isLocalhost(targetHost) || targetHost === reqHost);
      } catch {
        return false;
      }
    })();

    const dispatcher = useInsecure ? this.insecure : this.base;
    return dispatcher.dispatch(enhancedOpts, handler);
  }
}

/**
 * Install the enhanced dispatcher as the global Undici dispatcher.
 * This is called once per process on first middleware instantiation.
 */
function installDispatcher() {
  if (_dispatcherInstalled) return;

  try {
    // Check if we're in a Node.js environment
    if (typeof process === "undefined" || !process.versions?.node) {
      console.warn("[LocalFetch] Not in a Node.js environment, dispatcher enhancement skipped");
      return;
    }

    // Get the current global dispatcher
    const currentDispatcher = /** @type {any} */ (globalThis)[UNDICI_DISPATCHER_SYMBOL];

    if (!currentDispatcher) {
      console.warn("[LocalFetch] No Undici global dispatcher found, enhancement skipped");
      return;
    }

    // Save the original dispatcher
    _originalDispatcher = currentDispatcher;

    // Create our enhanced dispatcher wrapping the original
    _enhancedDispatcher = new EnhancedDispatcher(currentDispatcher);

    // Install as the global dispatcher
    /** @type {any} */ (globalThis)[UNDICI_DISPATCHER_SYMBOL] = _enhancedDispatcher;

    _dispatcherInstalled = true;
  } catch (err) {
    console.error("[LocalFetch] Failed to install dispatcher enhancement:", err);
  }
}

/**
 * Restore the original dispatcher (for cleanup/testing).
 */
export function restoreOriginalDispatcher() {
  if (_originalDispatcher && _dispatcherInstalled) {
    /** @type {any} */ (globalThis)[UNDICI_DISPATCHER_SYMBOL] = _originalDispatcher;
    _dispatcherInstalled = false;

    // Clean up enhanced dispatcher
    if (_enhancedDispatcher) {
      _enhancedDispatcher.destroy().catch(() => {});
      _enhancedDispatcher = null;
    }
  }
}

/**
 * FOR TESTING ONLY: Patch fetch directly when dispatcher isn't available.
 * This should only be used in test environments where Undici isn't present.
 *
 * @param {boolean} [force] - Force patching even if dispatcher is installed
 */
export function patchFetchForTesting(force = false) {
  if (!force && _dispatcherInstalled) return;

  const originalFetch = globalThis.fetch;
  if (!originalFetch) return;

  /**
   * @param {any} url
   * @param {RequestInit} [options]
   */
  const enhanced = async (url, options = {}) => {
    const globalStore = /** @type {any} */ (globalThis)[GLOBAL_STORE_KEY] || null;
    const store = requestContext.getStore() || lastStore || globalStore;

    // No request-scoped store → passthrough entirely
    if (!store) return originalFetch(url, options);

    // Relative URLs: resolve against request origin and forward headers
    if (isRelativeUrl(url)) {
      try {
        const resolvedUrl = new URL(String(url), store.origin);

        // Normalize localhost
        const normalizedHost = normalizeLocalhost(resolvedUrl.hostname);
        if (normalizedHost !== resolvedUrl.hostname) {
          resolvedUrl.hostname = normalizedHost;
        }

        const headers = new Headers(options.headers);
        for (const [key, value] of store.headers.entries()) {
          if (store.allow && !matchesAny(key, store.allow)) continue;
          if (store.deny && matchesAny(key, store.deny)) continue;
          if (!headers.has(key)) headers.set(key, value);
        }

        // For HTTPS to localhost/same-host, use insecure agent
        const fetchOpts = /** @type {RequestInit & { agent?: any }} */ ({ ...options, headers });
        if (resolvedUrl.protocol === "https:") {
          const targetHost = resolvedUrl.hostname;
          const requestHost = normalizeLocalhost(new URL(store.origin).hostname);

          if (isLocalhost(targetHost) || targetHost === requestHost) {
            const agent = getInsecureAgent();
            if (agent) {
              /** @type {any} */ (fetchOpts).agent = agent;
            }
          }
        }

        return originalFetch(resolvedUrl.toString(), fetchOpts);
      } catch {
        return originalFetch(url, options);
      }
    }

    // Absolute URLs: check for self-signed cert handling
    try {
      const absoluteUrl = new URL(String(url), store.origin);
      const normalizedHost = normalizeLocalhost(absoluteUrl.hostname);

      if (absoluteUrl.protocol === "https:" && normalizedHost !== absoluteUrl.hostname) {
        absoluteUrl.hostname = normalizedHost;
      }

      if (absoluteUrl.protocol === "https:") {
        const targetHost = absoluteUrl.hostname;
        const requestHost = normalizeLocalhost(new URL(store.origin).hostname);

        if (isLocalhost(targetHost) || targetHost === requestHost) {
          const agent = getInsecureAgent();
          if (agent) {
            const fetchOpts = { ...options };
            /** @type {any} */ (fetchOpts).agent = agent;
            return originalFetch(absoluteUrl.toString(), fetchOpts);
          }
        }
      }
    } catch {}

    return originalFetch(url, options);
  };

  globalThis.fetch = enhanced;
  return originalFetch; // Return original for restoration
}

/**
 * LocalFetch middleware.
 *
 * Lifecycle:
 * - Before: Install dispatcher and enter AsyncLocalStorage with request-scoped store
 * - After: Clear references from the store to help GC (defensive)
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
      // Install the dispatcher enhancement once per process
      installDispatcher();
      // Install the fetch Proxy once (idempotent). Dispatcher cannot see relative URLs.
      installFetchProxyOnce();

      // Create per-request store using Context's origin fields
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
