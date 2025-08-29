/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Statistics card component for metrics display
 *
 * Bootstrap-based statistics grid component using utility classes.
 * Clean design eliminating custom CSS through proper responsive grid.
 */

import { html } from "@raven-js/beak";

/**
 * Generate statistics card grid
 * @param {Object} options - Stats configuration
 * @param {Array<{value: string|number, label: string, variant?: string}>} options.stats - Statistics array
 * @param {string} [options.title] - Optional card title
 * @param {string} [options.variant] - Card background variant (light, primary, etc.)
 * @returns {string} Statistics card HTML
 */
export function statsCard({ stats, title, variant = "light" }) {
	const isLightVariant = variant === "light";
	const cardClass = isLightVariant
		? "card bg-light border-0"
		: `card bg-${variant}`;
	const textClass = isLightVariant ? "" : "text-white";

	return html`
		<div class="${cardClass}">
			${
				title
					? html`
			<div class="card-header bg-transparent border-bottom-0">
				<h5 class="mb-0 ${textClass}">${title}</h5>
			</div>
			`
					: ""
			}
			<div class="card-body ${title ? "pt-2" : "p-4"}">
				<div class="row text-center g-4">
					${stats.map((stat) => {
						const statVariant =
							stat.variant || (isLightVariant ? "primary" : "light");
						const statTextClass = isLightVariant
							? `text-${statVariant}`
							: stat.variant
								? `text-${stat.variant}`
								: "text-white";

						return html`
						<div class="col-md-${Math.floor(12 / Math.min(4, stats.length))}">
							<div class="h4 fw-bold ${statTextClass} mb-1">${stat.value}</div>
							<div class="text-muted ${textClass}">${stat.label}</div>
						</div>
						`;
					})}
				</div>
			</div>
		</div>
	`;
}

/**
 * Generate simple statistics grid (without card wrapper)
 * @param {Array<{value: string|number, label: string, variant?: string}>} stats - Statistics array
 * @returns {string} Statistics grid HTML
 */
export function statsGrid(stats) {
	return html`
		<div class="row text-center g-4">
			${stats.map(
				(stat) => html`
			<div class="col-md-${Math.floor(12 / Math.min(4, stats.length))}">
				<div class="h4 fw-bold text-${stat.variant || "primary"} mb-1">${stat.value}</div>
				<div class="text-muted">${stat.label}</div>
			</div>
			`,
			)}
		</div>
	`;
}
