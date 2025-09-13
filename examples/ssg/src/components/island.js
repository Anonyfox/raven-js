/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Islands helper - selective client-side hydration with loading strategies
 */

import { html } from "@raven-js/beak";

/**
 * Generate an island placeholder with hydration metadata.
 * Clean API: island({ src, ssr, props, on, id })
 * - src (required): client module path with optional export (e.g. "/apps/counter.js#Counter")
 * - ssr (optional): server-side render function for SSR
 * - props (optional): initial props object
 * - on (optional): 'load' | 'idle' | 'visible' (default 'load')
 * - id (optional): deterministic id override
 * @param {{ src: string, ssr?: Function, props?: Object, on?: 'load'|'idle'|'visible', id?: string }} cfg
 * @returns {string} HTML placeholder with SSR content and hydration data attributes
 */
export const island = (cfg) => {
  const on = cfg?.on ?? "load";
  const src = cfg?.src;
  const props = cfg?.props ?? {};
  const ssrFn = cfg?.ssr;
  if (!src) {
    throw new Error("island(): src is required (e.g. '/apps/counter.js' or '/apps/counter.js#Counter')");
  }

  // Parse module path and export from src (e.g. "/apps/counter.js#Counter")
  const [modulePath, exportName = "default"] = src.split("#");

  const id = cfg?.id || `island-${Math.random().toString(36).substr(2, 9)}`;

  // Serialize props into attribute using URI encoding to avoid HTML escaping issues
  const propsAttr = encodeURIComponent(JSON.stringify(props));

  // Server-side render the component output if available
  let ssrContent = "";
  try {
    if (typeof ssrFn === "function") {
      const out = ssrFn(props);
      ssrContent = String(out ?? "");
    }
  } catch {
    ssrContent = "";
  }

  return html`
		<div
			id="${id}"
			data-island
			data-module="${modulePath}"
			data-export="${exportName}"
			data-client="${on}"
			data-props="${propsAttr}"
		>
			${ssrContent}
		</div>
	`;
};
