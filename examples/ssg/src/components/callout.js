/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Callout component - highlighted information boxes
 */

import { html } from "@raven-js/beak";

/**
 * Callout icons for different types
 */
const calloutIcons = {
  info: "ℹ️",
  tip: "💡",
  warning: "⚠️",
  danger: "🚨",
  success: "✅",
};

/**
 * Callout component for highlighted content
 * @param {Object} props - Callout properties
 * @param {'info'|'tip'|'warning'|'danger'|'success'} props.type - Callout type
 * @param {string} props.content - Callout content
 * @param {string} [props.title] - Optional title
 * @returns {string} Callout HTML
 */
export const Callout = ({ type = "info", content, title }) => {
  const icon = calloutIcons[type] || calloutIcons.info;

  return html`
    <div class="callout callout--${type}">
      <div class="callout__icon">${icon}</div>
      <div class="callout__content">
        ${title ? html`<div class="callout__title">${title}</div>` : ""}
        <div class="callout__text">${content}</div>
      </div>
    </div>
  `;
};
