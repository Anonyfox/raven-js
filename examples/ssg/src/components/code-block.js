/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Code block component - syntax highlighted code display
 */

import { html } from "@raven-js/beak";

/**
 * Code block component with syntax highlighting
 * @param {Object} props - Code block properties
 * @param {string} props.language - Programming language for highlighting
 * @param {string} props.code - Code content
 * @param {string} [props.filename] - Optional filename to display
 * @returns {string} Code block HTML
 */
export const CodeBlock = ({ language, code, filename }) => {
  // Escape HTML in code content
  const escapedCode = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return html`
    <div class="code-block">
      ${
        filename
          ? html`<div class="code-block__filename">${filename}</div>`
          : ""
      }
      <pre class="code-block__pre"><code class="code-block__code language-${language}">${escapedCode}</code></pre>
    </div>
  `;
};
