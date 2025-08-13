/**
 * @packageDocumentation
 *
 * This module leverages JavaScript's tagged template literals to provide
 * a powerful and flexible templating engine, similar to JSX. It is the root
 * export of the `@raven-js/beak` package.
 *
 * It includes functions for creating HTML, CSS, JavaScript, SQL and Markdown strings.
 * Each function may perform some lightweight processing on the input string to
 * improve DX a bit, but in general `@raven-js/beak` is nearly as fast as
 * string concatenation.
 *
 * Plus, when using the RavenJS vscode plugin, you get syntax highlighting and
 * autocompletion for these template literals by leveraging the editor
 * capabilities instead of needing to execute code at runtime.
 *
 * @example
 * // using the `html` function for demonstration, but works with all functions
 * import { html } from '@raven-js/beak';
 *
 * // conditional rendering: use ternary operator
 * const isLoggedIn = true;
 * const greeting = html`
 * <div>
 *  ${isLoggedIn ? html`<p>Welcome back!</p>` : html`<p>Please log in.</p>`}
 * </div>
 * `;
 *
 * // looping like react: use map() to create a list of elements
 * const colors = ['red', 'green', 'blue'];
 * const list = html`
 * <ul>
 *   ${colors.map(color => html`<li>${color}</li>`)}
 * </ul>
 * `;
 *
 * // components: use functions to create reusable components
 * const Button = ({ text }) => html`<button>${text}</button>`;
 * const button = Button({ text: 'Click me' });
 * // Result: "<button>Click me</button>"
 */

export * from "./css/index.js";
export * from "./html/index.js";
export * from "./js/index.js";
export { md } from "./md/index.js";
export * from "./sql/index.js";
