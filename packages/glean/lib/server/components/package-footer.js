/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package metadata footer component - surgical package attribution
 *
 * Ravens display package territories with link precision.
 * Renders package.json metadata as clean footer links with proper
 * external link handling and Bootstrap styling. Optional rendering -
 * nothing displayed when no package metadata exists.
 */

import { html } from "@raven-js/beak";

/**
 * Render individual package link with icon and external link behavior
 * @param {string} url - Link URL
 * @param {string} label - Link label
 * @param {string} icon - Unicode icon
 * @returns {string} HTML for package link
 */
function renderPackageLink(url, label, icon) {
	if (!url || !url.trim()) {
		return "";
	}

	return html`
		<a href="${url}" target="_blank" rel="noopener noreferrer"
		   class="text-decoration-none text-muted me-3">
			${icon} ${label}
		</a>
	`;
}

/**
 * Package metadata footer component for documentation pages
 *
 * Displays package.json metadata links in a clean footer format.
 * Includes homepage, repository, issues, and funding links with
 * appropriate icons. Subtle styling that enhances without intruding.
 *
 * **Bootstrap Dependencies:** text-decoration-none, text-muted, me-3, border-top, pt-3, mt-4
 * **Unicode Icons:**
 * - 🏠 (homepage)
 * - 📁 (repository)
 * - 🐛 (issues)
 * - 💖 (funding)
 * **Surgical Design:** Optional rendering, clean horizontal layout
 *
 * @param {import('../../extract/models/attribution.js').AttributionContext} attributionContext - Attribution context
 * @param {boolean} [minimal=false] - Whether to use minimal styling without border
 * @returns {string} HTML package footer or empty string
 */
export function packageFooter(attributionContext, minimal = false) {
	if (
		!attributionContext ||
		!attributionContext.hasAttribution ||
		!attributionContext.hasPackageMeta
	) {
		return "";
	}

	const packageMeta = attributionContext.getPackageMetadata();

	if (!packageMeta || !(/** @type {any} */ (packageMeta).hasAnyLink)) {
		return "";
	}

	/** @type {any} */
	const pm = packageMeta;
	const homepageLink = renderPackageLink(pm.homepage, "Homepage", "🏠");
	const repositoryLink = renderPackageLink(pm.repository, "Repository", "📁");
	const issuesLink = renderPackageLink(pm.bugs, "Issues", "🐛");
	const fundingLink = renderPackageLink(pm.funding, "Funding", "💖");

	const allLinks = [homepageLink, repositoryLink, issuesLink, fundingLink]
		.filter((link) => link.trim())
		.join(" ");

	if (!allLinks.trim()) {
		return "";
	}

	const containerClasses = minimal ? "mt-3 pt-2" : "mt-4 pt-3 border-top";

	return html`
		<div class="${containerClasses}">
			<div class="small text-muted">
				${allLinks}
			</div>
		</div>
	`;
}

/**
 * Inline package links for compact displays
 *
 * Renders package metadata as inline badges for space-constrained areas.
 * Uses smaller badge styling with icons for minimal footprint.
 *
 * @param {import('../../extract/models/attribution.js').AttributionContext} attributionContext - Attribution context
 * @returns {string} HTML inline package links or empty string
 */
export function inlinePackageLinks(attributionContext) {
	if (
		!attributionContext ||
		!attributionContext.hasAttribution ||
		!attributionContext.hasPackageMeta
	) {
		return "";
	}

	const packageMeta = attributionContext.getPackageMetadata();

	if (!packageMeta || !(/** @type {any} */ (packageMeta).hasAnyLink)) {
		return "";
	}

	/** @type {any} */
	const pm = packageMeta;
	const links = [];

	if (pm.hasHomepage) {
		links.push(html`
			<a href="${pm.homepage}" target="_blank" rel="noopener noreferrer"
			   class="badge bg-light text-dark text-decoration-none me-1">
				🏠 Home
			</a>
		`);
	}

	if (pm.hasRepository) {
		links.push(html`
			<a href="${pm.repository}" target="_blank" rel="noopener noreferrer"
			   class="badge bg-light text-dark text-decoration-none me-1">
				📁 Repo
			</a>
		`);
	}

	if (pm.hasBugs) {
		links.push(html`
			<a href="${pm.bugs}" target="_blank" rel="noopener noreferrer"
			   class="badge bg-light text-dark text-decoration-none me-1">
				🐛 Issues
			</a>
		`);
	}

	if (pm.hasFunding) {
		links.push(html`
			<a href="${pm.funding}" target="_blank" rel="noopener noreferrer"
			   class="badge bg-danger text-white text-decoration-none me-1">
				💖 Fund
			</a>
		`);
	}

	if (links.length === 0) {
		return "";
	}

	return html`
		<div class="mt-2">
			${links.join(" ")}
		</div>
	`;
}
