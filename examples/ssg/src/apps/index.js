/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Islands bootloader – hydrates all islands declared via data attributes.
 *
 * Contract (emitted by server/SSG):
 * <div data-island data-module="/apps/counter.js" data-export="Counter" data-client="load|idle|visible">
 *   <script type="application/json">{"initial":0}</script>
 * </div>
 */

import { mount } from "@raven-js/reflex/dom";

// No JSON child support; props are passed via data-props only.

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
    // Trigger initial render to attach listeners and styles by clearing SSR children once
    el.textContent = "";
    mount(() => Component(props), el, { replace: true });
    el.setAttribute("data-hydrated", "1");
  } catch (err) {
    console.error(`[islands] Failed to load ${modulePath}`, err);
  }
}

function boot() {
  const islands = document.querySelectorAll("[data-island][data-module]");
  islands.forEach((el) => {
    void hydrateIsland(el);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
