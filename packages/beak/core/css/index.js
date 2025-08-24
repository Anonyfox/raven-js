/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CSS template literal processing with optimization and style tag generation
 */

import { processCSS } from "./process-css.js";
import { processCSSTemplate } from "./template-processor.js";

/**
 * Generate optimized CSS from template literals with intelligent value interpolation.
 *
 * **Value Processing:**
 * - Primitives: Direct string conversion
 * - Arrays: Space-separated flattening (recursive)
 * - Objects: CSS key-value pairs with camelCase→kebab-case conversion
 * - Filters null/undefined values
 *
 * Outputs single-line minified CSS. Processes 300KB+ bundles in ~7ms.
 *
 * @param {TemplateStringsArray} strings - Template literal static parts
 * @param {...any} values - Dynamic values (primitives, arrays, objects)
 * @returns {string} Minified CSS string
 *
 * @example
 * css`.button { color: ${['red', 'bold']}; margin: ${[10, 20]}px; }`;
 * // Returns: ".button{ color:red bold; margin:10 20px; }"
 *
 * css`.theme { ${({ backgroundColor: '#007bff', fontSize: '16px' })} }`;
 * // Returns: ".theme{ background-color:#007bff; font-size:16px; }"
 */
export const css = (strings, ...values) => {
	return processCSS(processCSSTemplate(strings, ...values));
};

/**
 * Generate `<style>` wrapped CSS for direct HTML insertion.
 *
 * Composition: css() → `<style>${result}</style>`.
 * SSR, dynamic stylesheets, component-scoped CSS.
 *
 * @param {TemplateStringsArray} strings - Template literal static parts
 * @param {...any} values - Dynamic values (primitives, arrays, objects)
 * @returns {string} CSS wrapped in style tags
 *
 * @example
 * style`.theme { color: ${isDark ? '#fff' : '#000'}; }`;
 * // Returns: "<style>.theme{ color:#fff; }</style>"
 */
export const style = (strings, ...values) => {
	const cssContent = css(strings, ...values);
	return `<style>${cssContent}</style>`;
};
