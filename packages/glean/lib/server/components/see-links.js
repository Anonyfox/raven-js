/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file See links component - surgical reference display
 *
 * Ravens display reference territories with link precision.
 * Renders @see tag links with proper external link handling and
 * Bootstrap badge styling. Groups links by type for organized
 * presentation. Optional rendering - nothing when no links exist.
 */

import { html } from "@raven-js/beak";

/**
 * Render external URL links as Bootstrap badges
 * @param {Array<Object>} urlLinks - URL link objects
 * @param {string} badgeClass - Bootstrap badge class
 * @returns {string} HTML for URL links
 */
function renderUrlLinks(urlLinks, badgeClass = "badge bg-secondary") {
	if (!Array.isArray(urlLinks) || urlLinks.length === 0) {
		return "";
	}

	return urlLinks
		.filter(
			(link) =>
				/** @type {any} */ (link).reference || /** @type {any} */ (link).url,
		)
		.map((link) => {
			/** @type {any} */
			const l = link;
			const url = l.url || l.reference;
			const displayText = l.description || new URL(url).hostname;

			return html`
				<a href="${url}" target="_blank" rel="noopener noreferrer" class="${badgeClass} text-decoration-none me-1">
					${displayText} ↗
				</a>
			`;
		})
		.join(" ");
}

/**
 * Render symbol references as internal badges
 * @param {Array<Object>} symbolLinks - Symbol link objects
 * @returns {string} HTML for symbol references
 */
function renderSymbolLinks(symbolLinks) {
	if (!Array.isArray(symbolLinks) || symbolLinks.length === 0) {
		return "";
	}

	return symbolLinks
		.filter((link) => /** @type {any} */ (link).reference)
		.map((link) => {
			/** @type {any} */
			const l = link;
			return html`
				<span class="badge bg-light text-dark me-1" title="Symbol reference">
					<code>${l.reference}</code>
				</span>
			`;
		})
		.join(" ");
}

/**
 * Render module references as module badges
 * @param {Array<Object>} moduleLinks - Module link objects
 * @returns {string} HTML for module references
 */
function renderModuleLinks(moduleLinks) {
	if (!Array.isArray(moduleLinks) || moduleLinks.length === 0) {
		return "";
	}

	return moduleLinks
		.filter((link) => /** @type {any} */ (link).reference)
		.map((link) => {
			/** @type {any} */
			const l = link;
			return html`
				<span class="badge bg-info text-dark me-1" title="Module reference">
					${l.reference}
				</span>
			`;
		})
		.join(" ");
}

/**
 * Render text references as plain badges
 * @param {Array<Object>} textLinks - Text reference objects
 * @returns {string} HTML for text references
 */
function renderTextLinks(textLinks) {
	if (!Array.isArray(textLinks) || textLinks.length === 0) {
		return "";
	}

	return textLinks
		.filter((link) => /** @type {any} */ (link).reference)
		.map((link) => {
			/** @type {any} */
			const l = link;
			return html`
				<span class="badge bg-light text-muted me-1" title="Text reference">
					${l.reference}
				</span>
			`;
		})
		.join(" ");
}

/**
 * See also links component for entity pages and cards
 *
 * Displays @see tag references organized by type with appropriate styling.
 * External URLs get external link icons, symbols get code styling,
 * modules get info badges. Subtle presentation that doesn't compete
 * with main content.
 *
 * **Bootstrap Dependencies:** badge, bg-secondary, bg-light, bg-info, text-dark, text-muted, me-1
 * **Unicode Icons:** ↗ for external links
 * **Surgical Design:** Optional rendering, grouped by reference type
 *
 * @param {import('../../extract/models/attribution.js').AttributionContext} attributionContext - Attribution context
 * @param {boolean} [compact=false] - Whether to use compact styling
 * @returns {string} HTML see links display or empty string
 */
export function seeAlsoLinks(attributionContext, compact = false) {
	if (
		!attributionContext ||
		!attributionContext.hasAttribution ||
		!attributionContext.hasLinks
	) {
		return "";
	}

	const seeLinks = attributionContext.getSeeLinks();
	const hasAnyLinks = Object.values(seeLinks).some(
		(linkArray) => Array.isArray(linkArray) && linkArray.length > 0,
	);

	if (!hasAnyLinks) {
		return "";
	}

	const linksHtml = renderUrlLinks(seeLinks.links, "badge bg-primary");
	const urlsHtml = renderUrlLinks(seeLinks.urls, "badge bg-secondary");
	const symbolsHtml = renderSymbolLinks(seeLinks.symbols);
	const modulesHtml = renderModuleLinks(seeLinks.modules);
	const textHtml = renderTextLinks(seeLinks.text);

	const allLinksHtml = [linksHtml, urlsHtml, symbolsHtml, modulesHtml, textHtml]
		.filter((html) => html.trim())
		.join(" ");

	if (!allLinksHtml.trim()) {
		return "";
	}

	const containerClass = compact ? "mt-1" : "mt-2";
	const labelClass = compact ? "text-muted small" : "text-muted";

	return html`
		<div class="${containerClass}">
			<span class="${labelClass}">See also:</span>
			${allLinksHtml}
		</div>
	`;
}
