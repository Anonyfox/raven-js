/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main layout component - wraps all pages with HTML structure
 */

import { html } from "@raven-js/beak";
import { Navigation } from "./navigation.js";

/**
 * Main layout component
 * @param {Object} props - Layout properties
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description for meta tags
 * @param {string} props.content - Page content HTML
 * @returns {string} Complete HTML document
 */
export const Layout = ({ title, description, content }) => {
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        ${Navigation()}
        <main class="main">
          <div class="container">${content}</div>
        </main>
        <footer class="footer">
          <div class="container">
            <p>&copy; 2024 RavenJS. Built with Content As Code.</p>
          </div>
        </footer>
        <script type="module" src="/apps/index.js" defer></script>
      </body>
    </html>
  `;
};
