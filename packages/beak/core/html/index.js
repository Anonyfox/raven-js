/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation
 *
 * HTML template literal processing with XSS protection and dynamic content
 * interpolation
 */

import { escapeSpecialCharacters } from "./escape-special-characters.js";
import { _renderHtmlFast, _renderSafeHtmlFast } from "./template-renderer.js";

/**
 * The main template tag function for creating HTML templates.
 *
 * This function uses JavaScript's native tagged template literals to create HTML strings
 * with dynamic content interpolation. It does NOT escape the input by default, trusting
 * the developer to provide safe content. For untrusted input, use `safeHtml` instead.
 *
 * **How it works:**
 * - Takes template strings and dynamic values as arguments
 * - Interpolates values into the template at runtime
 * - Automatically handles arrays by flattening them
 * - Normalizes whitespace for clean HTML output
 * - Falsy values (except 0) are excluded from output
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The rendered HTML as a string.
 *
 * @example
 * // Basic variable interpolation
 * import { html } from '@raven-js/beak';
 *
 * const name = 'John Doe';
 * const content = html`<div><h1>Hello, ${name}!</h1></div>`;
 * // Result: "<div><h1>Hello, John Doe!</h1></div>"
 *
 * @example
 * // Conditional rendering with ternary operators
 * const isLoggedIn = true;
 * const userContent = html`
 *   <div>
 *     ${isLoggedIn ? html`<span>Welcome back!</span>` : html`<a href="/login">Login</a>`}
 *   </div>
 * `;
 *
 * @example
 * // List rendering with map()
 * const items = ['apple', 'banana', 'cherry'];
 * const listContent = html`
 *   <ul>
 *     ${items.map(item => html`<li>${item}</li>`)}
 *   </ul>
 * `;
 *
 * @example
 * // Conditional attributes
 * const isDisabled = true;
 * const button = html`<button${isDisabled ? ' disabled' : ''}>Submit</button>`;
 *
 * @example
 * // Dynamic CSS classes
 * const isActive = true;
 * const element = html`<div class="base ${isActive ? 'active' : ''}">Content</div>`;
 *
 * @example
 * // Complex nested structures with data
 * const users = [
 *   { name: 'Alice', isAdmin: true },
 *   { name: 'Bob', isAdmin: false }
 * ];
 * const userList = html`
 *   <div class="users">
 *     ${users.map(user => html`
 *       <div class="user${user.isAdmin ? ' admin' : ''}">
 *         <h3>${user.name}</h3>
 *         ${user.isAdmin ? html`<span class="badge">Admin</span>` : ''}
 *       </div>
 *     `)}
 *   </div>
 * `;
 *
 * @example
 * // Form rendering with dynamic fields
 * const fields = [
 *   { name: 'username', type: 'text', required: true },
 *   { name: 'email', type: 'email', required: true }
 * ];
 * const form = html`
 *   <form>
 *     ${fields.map(field => html`
 *       <div class="field">
 *         <label for="${field.name}">${field.name}</label>
 *         <input type="${field.type}" name="${field.name}"${field.required ? ' required' : ''}>
 *       </div>
 *     `)}
 *   </form>
 * `;
 *
 * @example
 * // Handling falsy values (null, undefined, false, empty string)
 * const user = null;
 * const content = html`<div>${user || 'Guest'}</div>`;
 * // Result: "<div>Guest</div>"
 *
 * @example
 * // Zero is treated as truthy (included in output)
 * const count = 0;
 * const content = html`<div>Count: ${count}</div>`;
 * // Result: "<div>Count: 0</div>"
 *
 * @example
 * // Array flattening
 * const items = [['a', 'b'], ['c', 'd']];
 * const content = html`<div>${items}</div>`;
 * // Result: "<div>abcd</div>"
 */
export const html = (strings, ...values) => _renderHtmlFast(strings, values);

/**
 * A template tag function for creating HTML with escaped content.
 *
 * This function provides XSS protection by automatically escaping HTML special characters
 * in dynamic content. Use this whenever you're dealing with untrusted user input.
 * For trusted content, use `html` for better performance.
 *
 * **How it works:**
 * - Escapes HTML special characters: &, <, >, ", '
 * - Converts them to HTML entities: &amp;, &lt;, &gt;, &quot;, &#39;
 * - Prevents script injection and other XSS attacks
 * - Works with all the same patterns as `html` function
 *
 * **When to use:**
 * - User comments, reviews, or posts
 * - Form input data
 * - API responses from untrusted sources
 * - Any content that comes from external users
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated and escaped.
 * @returns {string} The rendered HTML as a string with escaped content.
 *
 * @example
 * // Basic usage with user input
 * import { safeHtml } from '@raven-js/beak';
 *
 * const userInput = '<script>alert("XSS")</script>';
 * const content = safeHtml`<div><p>${userInput}</p></div>`;
 * // Result: "<div><p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p></div>"
 *
 * @example
 * // User-generated content in forms
 * const userComment = '<img src="x" onerror="alert(\'XSS\')">';
 * const commentSection = safeHtml`
 *   <div class="comment">
 *     <p>${userComment}</p>
 *   </div>
 * `;
 *
 * @example
 * // User data in tables
 * const userData = [
 *   { name: '<script>alert("XSS")</script>', email: 'user@example.com' },
 *   { name: 'Bob', email: '<img src="x" onerror="alert(\'XSS\')">' }
 * ];
 * const userTable = safeHtml`
 *   <table>
 *     <tbody>
 *       ${userData.map(user => safeHtml`
 *         <tr>
 *           <td>${user.name}</td>
 *           <td>${user.email}</td>
 *         </tr>
 *       `)}
 *     </tbody>
 *   </table>
 * `;
 *
 * @example
 * // Mixed trusted and untrusted content
 * const trustedContent = "This is safe content";
 * const untrustedContent = '<script>alert("XSS")</script>';
 * const mixedContent = safeHtml`
 *   <div>
 *     <p>${trustedContent}</p>
 *     <p>${untrustedContent}</p>
 *   </div>
 * `;
 *
 * @example
 * // User input in conditional rendering
 * const userInput = '<script>alert("XSS")</script>';
 * const isLoggedIn = true;
 * const userContent = safeHtml`
 *   <div>
 *     ${isLoggedIn ? safeHtml`<span>Welcome, ${userInput}!</span>` : safeHtml`<a href="/login">Login</a>`}
 *   </div>
 * `;
 *
 * @example
 * // User-generated attributes
 * const maliciousClass = '"><script>alert("XSS")</script><div class="';
 * const isActive = true;
 * const element = safeHtml`<div class="base ${isActive ? maliciousClass : ''}">Content</div>`;
 * // Result: "<div class=\"base &quot;&gt;&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;div class=&quot;\">Content</div>"
 *
 * @example
 * // Complex user-generated content
 * const userProfile = {
 *   name: '<script>alert("XSS")</script>',
 *   bio: '<img src="x" onerror="alert(\'XSS\')">',
 *   website: 'javascript:alert("XSS")'
 * };
 * const profile = safeHtml`
 *   <div class="user-profile">
 *     <h1>${userProfile.name}</h1>
 *     <p>${userProfile.bio}</p>
 *     <a href="${userProfile.website}">Website</a>
 *   </div>
 * `;
 *
 * @example
 * // Handling falsy values with escaping
 * const userInput = null;
 * const content = safeHtml`<div>${userInput || 'No input provided'}</div>`;
 * // Result: "<div>No input provided</div>"
 *
 * @example
 * // Array flattening with escaping
 * const userInputs = [['<script>alert("XSS1")</script>', '<script>alert("XSS2")</script>']];
 * const content = safeHtml`<div>${userInputs}</div>`;
 * // Result: "<div>&lt;script&gt;alert(&quot;XSS1&quot;)&lt;/script&gt;&lt;script&gt;alert(&quot;XSS2&quot;)&lt;/script&gt;</div>"
 */
export const safeHtml = (strings, ...values) =>
	_renderSafeHtmlFast(strings, values);

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 *
 * This function converts HTML special characters (&, <, >, ", ') to their
 * corresponding HTML entities to safely display user input in HTML context.
 *
 * @param {*} str - The value to escape (will be converted to string).
 * @returns {string} The escaped string.
 *
 * @example
 * import { escapeHtml } from '@raven-js/beak';
 *
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHtml(userInput);
 * // Result: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
 */
export const escapeHtml = escapeSpecialCharacters;
