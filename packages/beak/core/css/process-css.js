/**
 * Processes a CSS string to ensure single-line output with minimal whitespace.
 *
 * This function performs the following transformations:
 * - Normalizes all whitespace sequences to single spaces
 * - Removes spaces before and after colons in property declarations
 * - Removes spaces before semicolons
 * - Removes spaces before opening braces
 * - Removes spaces before closing braces
 * - Ensures proper spacing after semicolons and closing braces
 * - Trims leading and trailing whitespace
 *
 * @param {string} css - The input CSS string.
 * @returns {string} The processed CSS string.
 *
 * @example
 * processCSS(`
 *   .button {
 *     color: white;
 *     background: #007bff;
 *   }
 * `);
 * // Returns: ".button{ color:white; background:#007bff; }"
 */
export const processCSS = (css) => {
	return css
		.replace(/\s+/g, " ")
		.replace(/([a-zA-Z-]+)\s*:\s*/g, "$1:")
		.replace(/\s+;/g, ";")
		.replace(/\s+\{/g, "{")
		.replace(/\s+\}/g, "}")
		.replace(/;(?!$|\s)/g, "; ")
		.replace(/\}(?!$|\s)/g, "} ")
		.trim();
};
