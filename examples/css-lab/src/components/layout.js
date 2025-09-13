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
 * @param {{ title: string, description?: string, content: string, themes?: string[], activeTheme?: string }} params
 */
export function Layout({ title, description = "", content, themes = [], activeTheme = "default" }) {
	const hasTheme = themes.length > 0;
	const requested = (() => {
		try {
			const url = new URL(
				typeof window === "undefined" ? "http://localhost" : window.location.href
			);
			return url.searchParams.get("theme");
		} catch {
			return null;
		}
	})();
	const invalidRequested = !!requested && !themes.includes(requested);
	const cssHref = `/dev/theme/${encodeURIComponent(activeTheme)}.css`;
	const themeSwitcher = hasTheme
		? html`<nav class="navbar navbar-expand-lg bg-body-tertiary mb-3">
			<div class="container-fluid">
				<a class="navbar-brand" href="/">CSS Lab</a>
				<div class="collapse navbar-collapse">
					<ul class="navbar-nav ms-auto">
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
								Theme: ${activeTheme}
							</a>
							<ul class="dropdown-menu dropdown-menu-end">
								${themes.map((t) => html`<li><a class="dropdown-item" href="/?theme=${encodeURIComponent(t)}">${t}</a></li>`)}
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</nav>`
		: "";

	const invalidToast = invalidRequested
		? html`<div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080;">
			<div id="themeToast" class="toast align-items-center text-bg-warning border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
				<div class="d-flex">
					<div class="toast-body">
						Requested theme "${requested}" not found. Using "${activeTheme}".
					</div>
					<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
				</div>
			</div>
		</div>`
		: "";

	return html`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        ${description ? html`<meta name="description" content="${description}" />` : ""}
        <link rel="stylesheet" href="${cssHref}" />
      </head>
      <body>
        ${themeSwitcher}
        <main class="container my-4">${html`${content}`}</main>
        ${invalidToast}

        <script src="/bootstrap.bundle.js" type="module"></script>
      </body>
    </html>
  `;
}
