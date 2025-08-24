/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { processJSTemplate } from "./template-processor.js";

/**
 * @file JavaScript template processor with value filtering and array flattening.
 *
 * Filters falsy values (except 0), flattens arrays, trims whitespace.
 *
 * @param {TemplateStringsArray} strings - Static template parts.
 * @param {...any} values - Values to interpolate.
 * @returns {string} Processed JavaScript code.
 *
 * @example
 * js`const ${varName} = ${count};`  // "const userCount = 42;"
 * js`${[1,2,3]}`                   // "123" (arrays flatten)
 * js`${null}valid${false}`         // "valid" (falsy filtered except 0)
 */
export const js = processJSTemplate;

/**
 * Wraps JavaScript in `<script type="text/javascript">` tags.
 *
 * @param {TemplateStringsArray} strings - Static template parts.
 * @param {...any} values - Values to interpolate.
 * @returns {string} JavaScript wrapped in script tags.
 *
 * @example
 * script`window.config = ${config};`
 * // '<script type="text/javascript">window.config = {...};</script>'
 */
export const script = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript">${jsContent}</script>`;
};

/**
 * Wraps JavaScript in `<script type="text/javascript" defer>` tags.
 * Executes after HTML parsing completes.
 *
 * @param {TemplateStringsArray} strings - Static template parts.
 * @param {...any} values - Values to interpolate.
 * @returns {string} JavaScript wrapped in deferred script tags.
 *
 * @example
 * scriptDefer`document.getElementById('${id}').focus();`
 * // '<script type="text/javascript" defer>document.getElementById('app').focus();</script>'
 */
export const scriptDefer = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript" defer>${jsContent}</script>`;
};

/**
 * Wraps JavaScript in `<script type="text/javascript" async>` tags.
 * Executes without blocking HTML parsing.
 *
 * @param {TemplateStringsArray} strings - Static template parts.
 * @param {...any} values - Values to interpolate.
 * @returns {string} JavaScript wrapped in async script tags.
 *
 * @example
 * scriptAsync`fetch('/analytics', { body: ${data} });`
 * // '<script type="text/javascript" async>fetch('/analytics', { body: {...} });</script>'
 */
export const scriptAsync = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript" async>${jsContent}</script>`;
};
