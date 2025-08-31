/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Alert component for notifications and warnings
 *
 * Bootstrap-based alert components using proper variant classes.
 * Clean semantic markup eliminating custom CSS through utility patterns.
 */

import { html } from "@raven-js/beak";

/**
 * Generate alert component with Bootstrap styling and optional dismiss functionality.
 *
 * @param {Object} options - Alert configuration
 * @param {string} options.variant - Bootstrap variant (primary, secondary, success, danger, warning, info, light, dark)
 * @param {string} [options.icon] - Alert icon (emoji or text)
 * @param {string} [options.title] - Alert title
 * @param {string} options.message - Alert message content
 * @param {boolean} [options.dismissible] - Whether alert can be dismissed
 * @returns {string} Alert HTML
 *
 * @example
 * // Basic success alert
 * alert({ variant: 'success', message: 'Operation completed!' });
 *
 * @example
 * // Alert with icon, title and dismiss
 * alert({
 *   variant: 'warning',
 *   icon: '⚠️',
 *   title: 'Warning',
 *   message: 'Check your configuration',
 *   dismissible: true
 * });
 */
export function alert({ variant, icon, title, message, dismissible = false }) {
	return html`
		<div class="alert alert-${variant} ${dismissible ? "alert-dismissible" : ""} d-flex align-items-center" role="alert">
			${icon ? html`<span class="fs-4 me-2">${icon}</span>` : ""}
			<div class="flex-grow-1">
				${title ? html`<h6 class="alert-heading mb-1">${title}</h6>` : ""}
				<div class="mb-0">${message}</div>
			</div>
			${
				dismissible
					? html`
			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			`
					: ""
			}
		</div>
	`;
}

/**
 * Generate deprecation warning alert
 * @param {Object} options - Deprecation configuration
 * @param {string} options.reason - Deprecation reason
 * @param {string} [options.since] - Version since deprecated
 * @returns {string} Deprecation alert HTML
 */
export function deprecationAlert({ reason, since }) {
	return alert({
		variant: "warning",
		icon: "⚠️",
		title: "Deprecated API",
		message: html`
			<p class="mb-0">${reason}</p>
			${since ? html`<small class="text-muted">Since version ${since}</small>` : ""}
		`,
	});
}

/**
 * Generate empty state alert
 * @param {Object} options - Empty state configuration
 * @param {string} options.icon - Empty state icon
 * @param {string} options.title - Empty state title
 * @param {string} options.message - Empty state message
 * @param {Array<{href: string, text: string, variant?: string}>} [options.actions] - Action buttons
 * @returns {string} Empty state HTML
 */
export function emptyState({ icon, title, message, actions = [] }) {
	return html`
		<div class="text-center py-5">
			<div class="display-1 mb-3">${icon}</div>
			<h3 class="text-muted mb-3">${title}</h3>
			<p class="text-muted mb-4">${message}</p>
			${
				actions.length > 0
					? html`
			<div class="d-flex gap-2 justify-content-center flex-wrap">
				${actions.map(
					(action) => html`
				<a href="${action.href}" class="btn btn-${action.variant || "outline-primary"}">${action.text}</a>
				`,
				)}
			</div>
			`
					: ""
			}
		</div>
	`;
}
