import { escapeSpecialCharacters } from "./escape-special-characters.js";
import { stringify } from "./stringify.js";

/**
 * Checks if a value should be included in the output.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value should be included, false otherwise.
 */
const isValidValue = (value) => value === 0 || Boolean(value);

/**
 * Private template rendering function that handles the core logic.
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {Array<*>} values - The dynamic values to be interpolated.
 * @param {Function} [escapeFn] - Optional function to escape values.
 * @returns {string} The rendered template as a string.
 */
const _renderTemplate = (strings, values, escapeFn = null) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (isValidValue(value)) {
			const stringified = stringify(value);
			result += escapeFn ? escapeFn(stringified) : stringified;
		}
		result += strings[i + 1];
	}
	return result.trim();
};

/**
 * The main template tag function for creating HTML templates.
 * By default, it does NOT escape the input, trusting the developer like a raven trusts its wings.
 *
 * If you want to shield your nest from XSS attacks, use the `safeHtml` function instead,
 * basically everytime when one of the inner variables comes from user input.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The rendered HTML as a string.
 *
 * @example
 * import { html } from '@raven-js/beak';
 *
 * const name = 'John Doe';
 * const content = html`
 *   <div>
 *     <h1>Hello, ${name}!</h1>
 *     <p>Welcome to our site.</p>
 *   </div>
 * `;
 * // Result: "<div><h1>Hello, John Doe!</h1><p>Welcome to our site.</p></div>"
 */
export const html = (strings, ...values) => _renderTemplate(strings, values);

/**
 * A template tag function for creating HTML with escaped content.
 * Use this for untrusted input to shield your nest from XSS attacks.
 *
 * If you trust the input, use the `html` function instead for better performance.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated and escaped.
 * @returns {string} The rendered HTML as a string with escaped content.
 *
 * @example
 * import { safeHtml } from '@raven-js/beak';
 *
 * const userInput = '<script>alert("XSS")</script>';
 * const content = safeHtml`
 *   <div>
 *     <p>${userInput}</p>
 *   </div>
 * `;
 * // Result: "<div><p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p></div>"
 */
export const safeHtml = (strings, ...values) =>
	_renderTemplate(strings, values, escapeSpecialCharacters);
