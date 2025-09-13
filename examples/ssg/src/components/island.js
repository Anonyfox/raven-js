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
 * @param {Function} Component - Component function reference
 * @param {Object} [props={}] - Component props
 * @param {Object} [options={}] - Island options
 * @param {string} [options.module] - Explicit client module path (e.g. "/apps/counter.js")
 * @param {'load'|'idle'|'visible'} [options.client='load'] - Loading strategy
 * @param {string} [options.export='default'] - Export name to use from module
 * @returns {string} HTML placeholder with SSR content and hydration data attributes
 */
export const island = (Component, props = {}, options = {}) => {
  const {
    client = "load",
    module,
    export: exportName = "default",
  } = /** @type {{ client?: 'load'|'idle'|'visible', module?: string, export?: string }} */ (options);
  if (!module) {
    throw new Error("island(): options.module is required (e.g. '/apps/counter.js')");
  }
  const id = `island-${Math.random().toString(36).substr(2, 9)}`;

  // Serialize props into attribute using URI encoding to avoid HTML escaping issues
  const propsAttr = encodeURIComponent(JSON.stringify(props));

  // Server-side render the component output if available
  let ssr = "";
  try {
    if (typeof Component === "function") {
      const out = Component(props);
      ssr = String(out ?? "");
    }
  } catch {
    ssr = "";
  }

  return html`
		<div
			id="${id}"
			data-island
			data-module="${module}"
			data-export="${exportName}"
			data-client="${client}"
			data-props="${propsAttr}"
		>
			${ssr}
		</div>
	`;
};
