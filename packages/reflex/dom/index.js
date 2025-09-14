/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Browser DOM mounting with reactive templates, SSR hydration awareness, and scroll preservation during updates.
 */

import { __getWriteVersion, effect, withTemplateContext } from "../index.js";
import { ssr } from "./ssr.js";

// Re-export ssr for convenience
export { ssr } from "./ssr.js";

/**
 * Replace element HTML efficiently with scroll position preservation.
 * @param {Element} el
 * @param {string} html
 */
function setHTML(el, html) {
  const scrollable =
    el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth || el === document.scrollingElement;

  const top = scrollable ? el.scrollTop : 0;
  const left = scrollable ? el.scrollLeft : 0;

  if (document.createRange && el.replaceChildren) {
    try {
      const range = document.createRange();
      const frag = range.createContextualFragment(html);
      el.replaceChildren(frag);
      if (scrollable) {
        el.scrollTop = top;
        el.scrollLeft = left;
      }
      return;
    } catch {}
  }
  el.innerHTML = html;
  if (scrollable) {
    el.scrollTop = top;
    el.scrollLeft = left;
  }
}

/**
 * Resolve a selector string or return element directly with error handling.
 * @param {string|Element} target
 * @returns {Element}
 */
function resolveTarget(target) {
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (!el) throw new Error(`mount(): No element for selector ${target}`);
    return el;
  }
  return /** @type {Element} */ (target);
}

/**
 * Schedule callback with requestAnimationFrame alignment and microtask fallback.
 * @template T
 * @param {() => T} cb
 * @returns {Promise<T>}
 */
function schedule(cb) {
  if (typeof requestAnimationFrame === "function") {
    return new Promise((res) => {
      requestAnimationFrame(() => {
        Promise.resolve().then(() => res(cb()));
      });
    });
  }
  return Promise.resolve().then(cb);
}

/**
 * Mount reactive template into DOM element with automatic signal tracking and SSR hydration awareness.
 *
 * Signal reads inside template function automatically trigger DOM updates. Prevents downgrade
 * from server-rendered content during initial hydration when no reactive writes have occurred.
 * Schedules DOM updates via requestAnimationFrame for optimal rendering performance.
 *
 * @example
 * // Basic usage
 * import { mount } from '@raven-js/reflex/dom';
 * import { signal } from '@raven-js/reflex';
 *
 * const count = signal(0);
 * const app = mount(() => `<h1>Count: ${count()}</h1>`, '#app');
 *
 * @example
 * // Async templates
 * const AsyncWidget = mount(async () => {
 *   const data = await fetch('/api/data');
 *   return `<div>${await data.text()}</div>`;
 * }, document.querySelector('#widget'));
 *
 * @example
 * // Manual cleanup
 * const app = mount(() => template(), '#app');
 * // Later...
 * app.unmount(); // Optional - cleanup happens automatically
 *
 * @param {() => (string|Promise<string>)} templateFn
 * @param {string|Element} target
 * @param {{}} [_options]
 * @returns {{ unmount(): void }}
 */
export function mount(templateFn, target, /** @type {{}} */ _options = {}) {
  if (typeof window === "undefined") throw new Error("mount() is browser-only");
  const el = resolveTarget(target);

  const scope = { slots: /** @type {any[]} */ ([]), cursor: 0 };

  // --- HYDRATION AWARENESS ---
  const hydrationBaseline = __getWriteVersion(); // version before any client writes
  const hasSSRContent = el.childNodes && el.childNodes.length > 0;
  let first = !hasSSRContent; // if SSR present, we won't do a "first setHTML"
  let last = hasSSRContent ? el.innerHTML : ""; // track SSR HTML to compare against
  // ---------------------------

  let token = 0; // coalescing guard

  const dispose = effect(() => {
    const out = withTemplateContext(templateFn, scope);
    const runId = ++token;

    /** @param {string} html */
    const apply = (html) => {
      if (runId !== token) return;

      // --- SKIP INITIAL DOWNGRADE ---
      // If SSR already painted and no reactive writes occurred yet,
      // don't replace DOM with a different (usually "empty") HTML.
      if (hasSSRContent && __getWriteVersion() === hydrationBaseline) {
        // just record what the client *would* render; do not touch DOM yet
        last = String(html ?? "");
        return;
      }
      // ----------------------------------

      if (first) {
        setHTML(el, html);
        last = html;
        first = false;
      } else if (html !== last) {
        schedule(() => {
          if (runId !== token) return;
          if (html !== last) {
            setHTML(el, html);
            last = html;
          }
        });
      }
    };

    if (out && typeof (/** @type {any} */ (out).then) === "function") {
      /** @type {Promise<string>} */ (out).then((s) => apply(String(s ?? ""))).catch((e) => console.error(e));
    } else {
      apply(String(out ?? ""));
    }
  });

  return {
    unmount() {
      dispose();
      // optional: el.innerHTML = "";
    },
  };
}

/**
 * Import a module respecting a loading strategy.
 * @param {"load"|"idle"|"visible"} strategy
 * @param {Element} el
 * @param {string} modulePath
 * @returns {Promise<any>}
 */
function importWithStrategy(strategy, el, modulePath) {
  switch (strategy) {
    case "idle": {
      return new Promise((resolve, reject) => {
        const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
        schedule(() => import(modulePath).then(resolve, reject));
      });
    }
    case "visible": {
      return new Promise((resolve, reject) => {
        if (typeof window.IntersectionObserver === "function") {
          const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
              observer.disconnect();
              import(modulePath).then(resolve, reject);
            }
          });
          observer.observe(el);
        } else {
          import(modulePath).then(resolve, reject);
        }
      });
    }
    default: {
      return import(modulePath);
    }
  }
}

/**
 * Hydrate a single island element.
 * @param {Element} el
 */
async function hydrateIsland(el) {
  const modulePath = el.getAttribute("data-module");
  if (!modulePath) {
    console.error("[islands] Missing data-module on", el);
    return;
  }
  if (el.getAttribute("data-hydrated") === "1") return;
  const exportName = el.getAttribute("data-export") || "default";
  const strategy = /** @type {"load"|"idle"|"visible"} */ (el.getAttribute("data-client") || "load");
  const propsAttr = el.getAttribute("data-props");
  let props = {};
  if (propsAttr) {
    try {
      props = JSON.parse(decodeURIComponent(propsAttr));
    } catch (e) {
      console.error("[islands] Failed to parse data-props", e);
    }
  }

  try {
    const mod = await importWithStrategy(strategy, el, modulePath);
    const Component = mod?.[exportName] || mod?.default;
    if (typeof Component !== "function") {
      console.error(`[islands] Export "${exportName}" not found or not a function in ${modulePath}`);
      return;
    }

    // Check if this island was SSR'd and needs wrapping
    const needsSSR = el.getAttribute("data-ssr") === "true";

    // Clear SSR children and mount reactive component
    el.textContent = "";

    if (needsSSR) {
      // Wrap with ssr() to consume cached data
      const wrappedComponent = ssr(Component);
      mount(() => wrappedComponent(props), el, { replace: true });
    } else {
      // Direct mount for client-only islands
      mount(() => Component(props), el, { replace: true });
    }

    el.setAttribute("data-hydrated", "1");
  } catch (err) {
    console.error(`[islands] Failed to load ${modulePath}`, err);
  }
}

/**
 * Generate an island placeholder for client-side hydration.
 *
 * Creates a div with data attributes for client-side hydration. Use this for islands
 * that don't need server-side rendering, only client-side interactivity.
 *
 * @example
 * // Basic island for client-side only
 * import { island } from '@raven-js/reflex/dom';
 * const html = island({ src: '/apps/counter.js#Counter', props: { initial: 0 } });
 *
 * @example
 * // With loading strategy
 * const html = island({
 *   src: '/apps/counter.js#Counter',
 *   props: { initial: 10 },
 *   on: 'visible'
 * });
 *
 * @param {{ src: string, props?: Object, on?: 'load'|'idle'|'visible', id?: string }} cfg
 * @returns {string} HTML placeholder for hydration
 */
export function island(cfg) {
  const on = cfg?.on ?? "load";
  const src = cfg?.src;
  const props = cfg?.props ?? {};
  if (!src) {
    throw new Error("island(): src is required (e.g. '/apps/counter.js' or '/apps/counter.js#Counter')");
  }

  // Parse module path and export from src (e.g. "/apps/counter.js#Counter")
  const [modulePath, exportName = "default"] = src.split("#");

  const id = cfg?.id || `island-${Math.random().toString(36).substr(2, 9)}`;

  // Serialize props into attribute using URI encoding to avoid HTML escaping issues
  const propsAttr = encodeURIComponent(JSON.stringify(props));

  return `<div id="${id}" data-island data-module="${modulePath}" data-export="${exportName}" data-client="${on}" data-props="${propsAttr}"></div>`;
}

/**
 * Generate an island with server-side rendering and hydration metadata.
 *
 * Creates a div with pre-rendered content and data attributes for client-side hydration.
 * The component is automatically wrapped in the ssr() function for multi-pass rendering,
 * promise settlement, and fetch caching.
 *
 * @example
 * // Basic SSR island
 * import { islandSSR } from '@raven-js/reflex/dom';
 * import { Counter } from './counter.js';
 * const html = await islandSSR({
 *   src: '/apps/counter.js#Counter',
 *   ssr: Counter,
 *   props: { initial: 0 }
 * });
 *
 * @example
 * // With loading strategy
 * const html = await islandSSR({
 *   src: '/apps/counter.js#Counter',
 *   ssr: Counter,
 *   props: { initial: 10 },
 *   on: 'visible'
 * });
 *
 * @example
 * // In async page templates
 * export const body = async () => md`
 *   # My Page
 *   ${await islandSSR({ src: '/apps/counter.js', ssr: Counter })}
 * `;
 *
 * @param {{ src: string, ssr: Function, props?: Object, on?: 'load'|'idle'|'visible', id?: string }} cfg
 * @returns {Promise<string>} HTML with SSR content and hydration metadata
 */
export async function islandSSR(cfg) {
  const on = cfg?.on ?? "load";
  const src = cfg?.src;
  const props = cfg?.props ?? {};
  const ssrFn = cfg?.ssr;

  if (!src) {
    throw new Error("islandSSR(): src is required (e.g. '/apps/counter.js' or '/apps/counter.js#Counter')");
  }
  if (!ssrFn || typeof ssrFn !== "function") {
    throw new Error("islandSSR(): ssr function is required");
  }

  // Parse module path and export from src (e.g. "/apps/counter.js#Counter")
  const [modulePath, exportName = "default"] = src.split("#");

  const id = cfg?.id || `island-${Math.random().toString(36).substr(2, 9)}`;

  // Serialize props into attribute using URI encoding to avoid HTML escaping issues
  const propsAttr = encodeURIComponent(JSON.stringify(props));

  // Wrap the component in ssr() if not already wrapped
  const wrappedFn = /** @type {any} */ (ssrFn)._ssrWrapped ? ssrFn : ssr(/** @type {(...a:any) => any} */ (ssrFn));

  // Server-side render the component with full async support
  let ssrContent = "";
  try {
    const result = await wrappedFn(props);
    // Convert null/undefined to empty string
    ssrContent = result == null ? "" : String(result);
  } catch (err) {
    // Log error but don't throw - return empty content
    console.error("islandSSR component error:", err);
    ssrContent = "";
  }

  return `<div id="${id}" data-island data-ssr="true" data-module="${modulePath}" data-export="${exportName}" data-client="${on}" data-props="${propsAttr}">${ssrContent}</div>`;
}

/**
 * Hydrate all islands on the page with selective loading strategies.
 *
 * Scans for elements with `data-island` and `data-module` attributes and hydrates them
 * using the specified loading strategy (load, idle, visible). Each island is hydrated
 * with its component from the specified module path and export name.
 *
 * @example
 * // Hydrate all islands immediately
 * import { hydrateIslands } from '@raven-js/reflex/dom';
 * hydrateIslands();
 *
 * @example
 * // Auto-hydrate on DOM ready
 * if (document.readyState === 'loading') {
 *   document.addEventListener('DOMContentLoaded', hydrateIslands);
 * } else {
 *   hydrateIslands();
 * }
 */
export function hydrateIslands() {
  if (typeof window === "undefined") throw new Error("hydrateIslands() is browser-only");

  const islands = document.querySelectorAll("[data-island][data-module]");
  islands.forEach((el) => {
    void hydrateIsland(el);
  });
}
