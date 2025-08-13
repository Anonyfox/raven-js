/**
 * Processes a CSS string to ensure single-line output with minimal whitespace.
 * @param {string} css - The input CSS string.
 * @returns {string} The processed CSS string.
 */
const processCSS = (css) => {
	return css
		.replace(/\s+/g, " ")
		.replace(/:\s+/g, ":")
		.replace(/\s+;/g, ";")
		.replace(/\s+\{/g, "{")
		.replace(/\s+\}/g, "}")
		.replace(/;(?!$|\s)/g, "; ")
		.replace(/\}(?!$|\s)/g, "} ")
		.trim();
};

/**
 * Creates a CSS string from template literals.
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The processed CSS string.
 * @example
 * import { css } from '@raven-js/beak';
 *
 * const primaryColor = '#007bff';
 * const styles = css`
 *   .button {
 *     background-color: ${primaryColor};
 *     color: white;
 *     padding: 10px 15px;
 *   }
 * `;
 * // Result: ".button {background-color:#007bff; color:white; padding:10px 15px}"
 */
export const css = (strings, ...values) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (value != null) {
			result += Array.isArray(value) ? value.join(" ") : value;
		}
		result += strings[i + 1];
	}
	return processCSS(result);
};

/**
 * Creates a CSS string wrapped in `<style>` tags from template literals.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The processed CSS string wrapped in `<style>` tags.
 *
 * @example
 * import { styles } from '@raven-js/beak';
 *
 * const theme = {
 *   primaryColor: '#007bff',
 *   secondaryColor: '#6c757d'
 * };
 * const styles = style`
 *   .button-primary {
 *     background-color: ${theme.primaryColor};
 *     color: white;
 *   }
 *   .button-secondary {
 *     background-color: ${theme.secondaryColor};
 *     color: white;
 *   }
 * `;
 * // Result: "<style>.button-primary {background-color:#007bff; color:white} .button-secondary {background-color:#6c757d; color:white}</style>"
 */
export const style = (strings, ...values) => {
	const cssContent = css(strings, ...values);
	return `<style>${cssContent}</style>`;
};
