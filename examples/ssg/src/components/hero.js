/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Hero component - large promotional section
 */

import { html } from "@raven-js/beak";

/**
 * Hero section component
 * @param {Object} props - Hero properties
 * @param {string} props.title - Main title
 * @param {string} props.subtitle - Subtitle text
 * @param {Object} [props.cta] - Call-to-action button
 * @param {string} props.cta.text - Button text
 * @param {string} props.cta.href - Button link
 * @returns {string} Hero section HTML
 */
export const Hero = ({ title, subtitle, cta }) => {
  return html`
    <section class="hero">
      <div class="hero__content">
        <h1 class="hero__title">${title}</h1>
        <p class="hero__subtitle">${subtitle}</p>
        ${
          cta
            ? html`
              <a href="${cta.href}" class="hero__cta btn btn--primary">
                ${cta.text}
              </a>
            `
            : ""
        }
      </div>
    </section>
  `;
};
