/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Table of contents component - navigation for long pages
 */

import { html } from "@raven-js/beak";

/**
 * @typedef {Object} Section
 * @property {string} id - Section ID for anchor links
 * @property {string} title - Section title
 */

/**
 * Table of contents component
 * @param {Object} props - TOC properties
 * @param {Section[]} props.sections - Array of section objects
 * @returns {string} Table of contents HTML
 */
export const TableOfContents = ({ sections }) => {
  return html`
    <div class="toc">
      <h2 class="toc__title">Table of Contents</h2>
      <ul class="toc__list">
        ${sections
          .map(
            (section) => html`
              <li class="toc__item">
                <a href="#${section.id}" class="toc__link">${section.title}</a>
              </li>
            `,
          )
          .join("")}
      </ul>
    </div>
  `;
};
