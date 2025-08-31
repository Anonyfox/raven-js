/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Attribution bar component - surgical authorship display
 *
 * Ravens display authorship territories with predatory precision.
 * Renders author information with proper mailto links and contributor
 * intelligence through Bootstrap utility classes. Optional rendering -
 * nothing displayed when no attribution exists.
 */

import { html } from "@raven-js/beak";

/**
 * Render primary author information with optional email link
 * @param {any} primaryAuthor - Primary author data
 * @returns {string} HTML for primary author display
 */
function renderPrimaryAuthor(primaryAuthor) {
	if (!primaryAuthor || !primaryAuthor.name) {
		return "";
	}

	if (primaryAuthor.hasEmail && primaryAuthor.email) {
		return html`
			<span class="text-muted small">
				By <a href="mailto:${primaryAuthor.email}" class="text-decoration-none">${primaryAuthor.name}</a>
			</span>
		`;
	}

	return html`
		<span class="text-muted small">
			By ${primaryAuthor.name}
		</span>
	`;
}

/**
 * Render contributors list with proper email links
 * @param {Array<Object>} contributors - Contributors array
 * @returns {string} HTML for contributors display
 */
function renderContributors(contributors) {
	if (!Array.isArray(contributors) || contributors.length === 0) {
		return "";
	}

	const contributorLinks = contributors
		.filter((contributor) => /** @type {any} */ (contributor).name)
		.map((contributor) => {
			/** @type {any} */
			const c = contributor;
			if (c.hasEmail && c.email) {
				return html`<a href="mailto:${c.email}" class="text-decoration-none text-muted">${c.name}</a>`;
			}
			return html`<span class="text-muted">${c.name}</span>`;
		})
		.join(", ");

	if (contributorLinks) {
		return html`
			<span class="text-muted small">
				| Contributors: ${contributorLinks}
			</span>
		`;
	}

	return "";
}

/**
 * Attribution bar component for entity cards and pages
 *
 * Displays primary author and contributors in a subtle, non-intrusive way.
 * Uses Bootstrap small text styling with muted colors. Renders nothing
 * when no attribution context exists.
 *
 * **Bootstrap Dependencies:** text-muted, small, text-decoration-none
 * **Surgical Design:** Optional rendering, proper mailto: links
 *
 * @param {import('../../extract/models/attribution.js').AttributionContext} attributionContext - Attribution context
 * @returns {string} HTML attribution bar or empty string
 */
export function attributionBar(attributionContext) {
	if (
		!attributionContext ||
		!attributionContext.hasAttribution ||
		!attributionContext.hasAuthors
	) {
		return "";
	}

	const primaryAuthor = attributionContext.getPrimaryAuthor();
	const contributors = attributionContext.getContributors();

	const primaryAuthorHtml = renderPrimaryAuthor(primaryAuthor);
	const contributorsHtml = renderContributors(contributors);

	if (!primaryAuthorHtml && !contributorsHtml) {
		return "";
	}

	return html`
		<div class="mt-2">
			${primaryAuthorHtml}
			${contributorsHtml}
		</div>
	`;
}
