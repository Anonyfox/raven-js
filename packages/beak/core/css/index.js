/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * CSS template literal processing with optimization and style tag generation
 */

import { processCSS } from "./process-css.js";
import { processCSSTemplate } from "./template-processor.js";

/**
 * Creates optimized CSS strings from template literals with automatic whitespace normalization.
 *
 * This function processes CSS template literals by:
 * - Interpolating dynamic values (strings, numbers, arrays, objects)
 * - Automatically flattening arrays with space-separated values
 * - Normalizing whitespace for optimal CSS output
 * - Filtering out null/undefined values
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The processed and optimized CSS string.
 *
 * @example
 * // Basic usage with dynamic values
 * import { css } from '@raven-js/beak';
 *
 * const primaryColor = '#007bff';
 * const padding = '10px 15px';
 * const styles = css`
 *   .button {
 *     background-color: ${primaryColor};
 *     padding: ${padding};
 *     color: white;
 *   }
 * `;
 * // Result: ".button {background-color:#007bff; padding:10px 15px; color:white}"
 *
 * @example
 * // Array interpolation (automatically flattened)
 * const colors = ['red', 'blue', 'green'];
 * const sizes = [16, 18, 20];
 * const result = css`
 *   .gradient { background: linear-gradient(${colors}); }
 *   .text { font-size: ${sizes}px; }
 * `;
 * // Result: ".gradient {background:linear-gradient(red blue green)} .text {font-size:16 18 20px}"
 *
 * @example
 * // Conditional CSS with ternary operators
 * const isDark = true;
 * const theme = css`
 *   body {
 *     background: ${isDark ? '#333' : '#fff'};
 *     color: ${isDark ? '#fff' : '#333'};
 *   }
 * `;
 *
 * @example
 * // Complex nested structures
 * const theme = {
 *   colors: { primary: '#007bff', secondary: '#6c757d' },
 *   spacing: ['10px', '20px', '30px']
 * };
 * const styles = css`
 *   .btn-primary { background: ${theme.colors.primary}; }
 *   .container { margin: ${theme.spacing}; }
 * `;
 *
 * @example
 * // Media queries and responsive design
 * const breakpoint = '768px';
 * const mobilePadding = '10px';
 * const desktopPadding = '20px';
 * const responsive = css`
 *   .container { padding: ${mobilePadding}; }
 *   @media (min-width: ${breakpoint}) {
 *     .container { padding: ${desktopPadding}; }
 *   }
 * `;
 */
export const css = (strings, ...values) => {
	return processCSS(processCSSTemplate(strings, ...values));
};

/**
 * Creates CSS strings wrapped in `<style>` tags for direct HTML insertion.
 *
 * This function combines the power of the `css()` function with automatic
 * `<style>` tag wrapping, making it perfect for:
 * - Dynamic stylesheet generation
 * - Component-based styling
 * - Server-side rendering
 * - Inline style injection
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The processed CSS wrapped in `<style>` tags.
 *
 * @example
 * // Basic style tag generation
 * import { style } from '@raven-js/beak';
 *
 * const theme = {
 *   primaryColor: '#007bff',
 *   secondaryColor: '#6c757d'
 * };
 * const stylesheet = style`
 *   .button-primary {
 *     background-color: ${theme.primaryColor};
 *     color: white;
 *     padding: 10px 15px;
 *   }
 *   .button-secondary {
 *     background-color: ${theme.secondaryColor};
 *     color: white;
 *     padding: 10px 15px;
 *   }
 * `;
 * // Result: "<style>.button-primary {background-color:#007bff; color:white; padding:10px 15px} .button-secondary {background-color:#6c757d; color:white; padding:10px 15px}</style>"
 *
 * @example
 * // Component-based styling with dynamic themes
 * const createComponentStyles = (variant, colors) => style`
 *   .component-${variant} {
 *     background: ${colors.background};
 *     color: ${colors.text};
 *     border: 1px solid ${colors.border};
 *   }
 * `;
 *
 * const primaryStyles = createComponentStyles('primary', {
 *   background: '#007bff',
 *   text: 'white',
 *   border: '#0056b3'
 * });
 *
 * @example
 * // Server-side rendering with dynamic content
 * const generatePageStyles = (userPreferences) => style`
 *   body {
 *     font-family: ${userPreferences.fontFamily || 'Arial'};
 *     font-size: ${userPreferences.fontSize || '16px'};
 *   }
 *   .content {
 *     max-width: ${userPreferences.maxWidth || '1200px'};
 *     margin: 0 auto;
 *   }
 * `;
 *
 * @example
 * // CSS-in-JS patterns with computed values
 * const createResponsiveStyles = (breakpoints) => style`
 *   .grid {
 *     display: grid;
 *     grid-template-columns: repeat(${breakpoints.mobile}, 1fr);
 *     gap: ${breakpoints.gap}px;
 *   }
 *   @media (min-width: ${breakpoints.tablet}px) {
 *     .grid { grid-template-columns: repeat(${breakpoints.tablet}, 1fr); }
 *   }
 *   @media (min-width: ${breakpoints.desktop}px) {
 *     .grid { grid-template-columns: repeat(${breakpoints.desktop}, 1fr); }
 *   }
 * `;
 */
export const style = (strings, ...values) => {
	const cssContent = css(strings, ...values);
	return `<style>${cssContent}</style>`;
};
