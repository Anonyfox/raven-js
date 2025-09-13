/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Minimal layout for CSS lab preview pages
 */

import { html } from "@raven-js/beak";

/**
 * @param {{ title: string, description?: string, content: string }} params
 */
export function Layout({ title, description = "", content }) {
	return html`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        ${description ? html`<meta name="description" content="${description}" />` : ""}
        <link rel="stylesheet" href="/bootstrap.css" />
      </head>
      <body>
        <!-- Main Content -->
        <main>${html`${content}`}</main>

        <!-- Bootstrap JavaScript -->
        <script src="/bootstrap.bundle.js" type="module"></script>

        <!-- Initialize tooltips and popovers -->
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Initialize tooltips
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
              return new bootstrap.Tooltip(tooltipTriggerEl);
            });

            // Initialize popovers
            var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
              return new bootstrap.Popover(popoverTriggerEl);
            });
          });
        </script>
      </body>
    </html>
  `;
}
