/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Feature grid component - displays features in a responsive grid
 */

import { html } from "@raven-js/beak";

/**
 * @typedef {Object} Feature
 * @property {string} icon - Feature icon (emoji or text)
 * @property {string} title - Feature title
 * @property {string} description - Feature description
 */

/**
 * Feature grid component
 * @param {Feature[]} features - Array of feature objects
 * @returns {string} Feature grid HTML
 */
export const FeatureGrid = (features) => {
  return html`
    <div class="feature-grid">
      ${features
        .map(
          (feature) => html`
            <div class="feature-card">
              <div class="feature-card__icon">${feature.icon}</div>
              <h3 class="feature-card__title">${feature.title}</h3>
              <p class="feature-card__description">${feature.description}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
};
