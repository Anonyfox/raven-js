/**
 * Checks if a value should be included in the output.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value should be included, false otherwise.
 */
const isValidValue = (value) => value === 0 || Boolean(value);

// TODO: duplicated code
/**
 * Converts a value to a string, joining arrays if necessary.
 * @param {*} value - The value to stringify.
 * @returns {string} The stringified value.
 */
const stringify = (value) =>
	Array.isArray(value) ? value.join("") : String(value);

/**
 * A template tag function for creating JavaScript snippets.
 * This function doesn't perform any escaping or processing, allowing for raw JS interpolation.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The combined JavaScript snippet as a string.
 *
 * @example
 * import { js } from '@raven-js/beak';
 *
 * const variableName = 'count';
 * const value = 10;
 * const script = js`
 *   let ${variableName} = ${value};
 *   console.log(${variableName});
 * `;
 * // Result: "let count = 10; console.log(count);"
 */
export const js = (strings, ...values) => {
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
 * A template tag function for creating script tags with JavaScript content.
 * This function wraps the content in `<script>` tags.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The JavaScript snippet wrapped in `<script>` tags.
 *
 * @example
 * import { script } from '@raven-js/beak';
 *
 * const variableName = 'count';
 * const value = 10;
 * const scriptTag = script`
 *   let ${variableName} = ${value};
 *   console.log(${variableName});
 * `;
 * // Result: "<script type="text/javascript">let count = 10; console.log(count);</script>"
 */
export const script = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript">${jsContent}</script>`;
};

/**
 * A template tag function for creating script tags with deferred JavaScript content.
 * This function wraps the content in <script> tags with the "defer" attribute.
 * Use this when you want the script to be executed after the document has been parsed.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The JavaScript snippet wrapped in <script> tags with "defer" attribute.
 *
 * @example
 * import { scriptDefer } from '@raven-js/beak';
 *
 * const variableName = 'count';
 * const value = 10;
 * const scriptTag = scriptDefer`
 *   let ${variableName} = ${value};
 *   console.log(${variableName});
 * `;
 * // Result: "<script type=\"text/javascript\" defer>let count = 10; console.log(count);</script>"
 */
export const scriptDefer = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript" defer>${jsContent}</script>`;
};

/**
 * A template tag function for creating script tags with asynchronous JavaScript content.
 * This function wraps the content in `<script>` tags with the "async" attribute.
 * Use this when you want the script to be executed as soon as it is available, without blocking the HTML parser.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The JavaScript snippet wrapped in `<script>` tags with "async" attribute.
 *
 * @example
 * import { scriptAsync } from '@raven-js/beak';
 *
 * const variableName = 'count';
 * const value = 10;
 * const scriptTag = scriptAsync`
 *   let ${variableName} = ${value};
 *   console.log(${variableName});
 * `;
 * // Result: "<script type=\"text/javascript\" async>let count = 10; console.log(count);</script>"
 */
export const scriptAsync = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript" async>${jsContent}</script>`;
};
