/**
 * A mapping of HTML special characters to their escaped counterparts.
 * @type {Object.<string, string>}
 */
const escapeMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"'": "&#39;",
	'"': "&quot;",
};

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
const escapeHTML = (str) =>
	str.replace(/[&<>"]/g, (char) => escapeMap[char] || char);

/**
 * Checks if a value should be included in the output.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value should be included, false otherwise.
 */
const isValidValue = (value) => value === 0 || Boolean(value);

/**
 * Converts a value to a string, joining arrays if necessary.
 * @param {*} value - The value to stringify.
 * @returns {string} The stringified value.
 */
const stringify = (value) =>
	Array.isArray(value) ? value.join("") : String(value);

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
export const html = (strings, ...values) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (isValidValue(value)) {
			result += stringify(value);
		}
		result += strings[i + 1];
	}
	return result.trim();
};

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
export const safeHtml = (strings, ...values) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (isValidValue(value)) {
			result += escapeHTML(stringify(value));
		}
		result += strings[i + 1];
	}
	return result.trim();
};
