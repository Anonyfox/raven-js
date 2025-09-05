/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Navigation component - site header with menu
 */

import { html } from "@raven-js/beak";

/**
 * Navigation links configuration
 */
const navLinks = [
  { href: "/", text: "Home" },
  { href: "/about", text: "About" },
  { href: "/docs", text: "Docs" },
];

/**
 * Navigation component
 * @returns {string} Navigation HTML
 */
export const Navigation = () => {
  return html`
    <nav class="nav">
      <div class="container">
        <div class="nav__brand">
          <a href="/" class="nav__logo">🦅 RavenJS SSG</a>
        </div>
        <div class="nav__menu">
          ${navLinks
            .map(
              (link) => html`
                <a href="${link.href}" class="nav__link">${link.text}</a>
              `,
            )
            .join("")}
        </div>
      </div>
    </nav>
  `;
};
