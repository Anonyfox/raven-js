/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Page header component with breadcrumbs and title
 *
 * Clean Bootstrap-based header component for documentation pages.
 * Surgical design eliminating custom CSS through proper utility classes.
 */

import { html } from "@raven-js/beak";

/**
 * Generate page header with breadcrumbs, title, badges, and description.
 *
 * Bootstrap-based header component with responsive layout and flexible content areas.
 * Includes optional breadcrumb navigation and title badge support.
 *
 * @param {Object} options - Header configuration
 * @param {string} options.title - Page title
 * @param {string} [options.subtitle] - Optional subtitle
 * @param {Array<{href?: string, text: string, active?: boolean}>} [options.breadcrumbs] - Breadcrumb navigation
 * @param {Array<{text: string, variant: string}>} [options.badges] - Title badges
 * @param {string} [options.description] - Page description
 * @returns {string} Header HTML
 *
 * @example
 * // Basic page header
 * pageHeader({ title: 'API Documentation' });
 *
 * @example
 * // Full header with all features
 * pageHeader({
 *   title: 'myFunction',
 *   subtitle: 'Utility Function',
 *   breadcrumbs: [
 *     { href: '/', text: 'Home' },
 *     { text: 'API', active: true }
 *   ],
 *   badges: [{ text: 'function', variant: 'primary' }],
 *   description: 'A utility function description'
 * });
 */
export function pageHeader({
	title,
	subtitle,
	breadcrumbs = [],
	badges = [],
	description,
}) {
	return html`
		${
			breadcrumbs.length > 0
				? html`
		<nav aria-label="breadcrumb" class="mb-3">
			<ol class="breadcrumb">
				${breadcrumbs.map(
					(crumb) => html`
				<li class="breadcrumb-item ${crumb.active ? "active" : ""}"${crumb.active ? ' aria-current="page"' : ""}>
					${
						crumb.active || !crumb.href
							? html`${crumb.text}`
							: html`<a href="${crumb.href}" class="text-decoration-none">${crumb.text}</a>`
					}
				</li>
				`,
				)}
			</ol>
		</nav>
		`
				: ""
		}

		<div class="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
			<div class="flex-grow-1">
				<div class="d-flex align-items-center gap-2 mb-2">
					<h1 class="display-5 fw-bold text-primary mb-0">${title}</h1>
					${badges.map(
						(badge) => html`
					<span class="badge bg-${badge.variant} fs-6">${badge.text}</span>
					`,
					)}
				</div>
				${
					subtitle
						? html`
				<p class="lead text-muted mb-2">${subtitle}</p>
				`
						: ""
				}
				${
					description
						? html`
				<div class="text-muted mb-0">${description}</div>
				`
						: ""
				}
			</div>
		</div>
	`;
}
