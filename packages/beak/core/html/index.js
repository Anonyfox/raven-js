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
	// Normalize whitespace: trim and collapse internal whitespace while preserving HTML structure
	return result.trim().replace(/>\s+</g, "><").replace(/\n\s*/g, "");
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
 * // Basic usage
 * import { html } from '@raven-js/beak';
 *
 * const name = 'John Doe';
 * const content = html`<div><h1>Hello, ${name}!</h1></div>`;
 * // Result: "<div><h1>Hello, John Doe!</h1></div>"
 *
 * @example
 * // Conditional rendering
 * const isLoggedIn = true;
 * const userContent = html`
 *   <div>
 *     ${isLoggedIn ? html`<span>Welcome back!</span>` : html`<a href="/login">Login</a>`}
 *   </div>
 * `;
 *
 * @example
 * // List rendering
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
 * // Dynamic classes
 * const isActive = true;
 * const element = html`<div class="base ${isActive ? 'active' : ''}">Content</div>`;
 *
 * @example
 * // Complex nested structures
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
 * // Form rendering
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
 */
export const safeHtml = (strings, ...values) =>
	_renderTemplate(strings, values, escapeSpecialCharacters);
