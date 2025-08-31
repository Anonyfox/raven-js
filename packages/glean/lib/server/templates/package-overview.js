/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview template for documentation homepage
 *
 * Renders package information, README content, and module navigation
 * using Bootstrap 5 components. Follows WEBAPP.md content specification
 * for package overview pages.
 */

import { html, markdownToHTML } from "@raven-js/beak";
import {
	applySyntaxHighlighting,
	contentSection,
	gettingStarted,
	moduleNavigation,
	pageHeader,
} from "../components/index.js";
import { baseTemplate } from "./base.js";

/**
 * Generate package overview HTML page
 * @param {Object} data - Package overview data from extractor
 * @param {string} data.name - Package name
 * @param {string} data.version - Package version
 * @param {string} data.description - Package description
 * @param {string} data.readmeMarkdown - README markdown content
 * @param {Array<Object>} data.modules - Module information array
 * @param {boolean} data.hasReadme - Whether README content exists
 * @param {boolean} data.hasModules - Whether modules exist
 * @returns {string} Complete HTML page
 */
export function packageOverviewTemplate(data) {
	const {
		name,
		version,
		description,
		readmeMarkdown,
		modules,
		hasReadme,
		hasModules,
	} = data;

	// Generate header badges
	const badges = [];
	if (version) {
		badges.push({ text: `v${version}`, variant: "secondary" });
	}

	// Generate main content
	const content = html`
		${pageHeader({
			title: name,
			subtitle: description ? markdownToHTML(description) : undefined,
			badges,
		})}

		<!-- Getting Started Section - Moved to top -->
		${
			hasModules
				? gettingStarted({
						packageName: name,
						actions: [
							{
								href: "/modules/",
								text: "Explore Modules",
								variant: "primary",
							},
						],
					})
				: ""
		}

		<!-- Main Content Area -->
		<div class="row">
			<!-- README Content -->
			<div class="${hasModules ? "col-lg-8" : "col-12"} mb-4">
				${
					hasReadme
						? contentSection({
								title: "Documentation",
								icon: "📄",
								content: html`<div class="readme-content">${applySyntaxHighlighting(markdownToHTML(readmeMarkdown))}</div>`,
							})
						: contentSection({
								title: "No README Available",
								icon: "📄",
								content: html`
						<div class="text-center py-5">
							<div class="display-1 mb-3">📄</div>
							<h5 class="mt-3">No README Available</h5>
							<p class="text-muted">This package doesn't have README documentation.</p>
						</div>
					`,
							})
				}
			</div>

			<!-- Module Navigation Sidebar -->
			${
				hasModules
					? html`
			<div class="col-lg-4">
				<div class="mb-4">
					${moduleNavigation({
						modules: modules.map(
							/** @param {any} module */ (module) => ({
								name: module.name.split("/").pop() || "index",
								link: `/modules/${module.name.split("/").pop()}/`,
								entityCount: module.publicEntityCount,
								fullImportPath: module.name,
								isDefault: module.isDefault,
								availableTypes: module.availableTypes,
							}),
						),
						title: "🗂️ Modules",
					})}
				</div>


			</div>
			`
					: ""
			}
		</div>
	`;

	// Generate complete page using base template
	return baseTemplate({
		title: `${name} Documentation`,
		description: description || `Documentation for ${name}`,
		packageName: name,
		content,
		navigation: {
			current: "overview",
		},
		seo: {
			url: "", // Will be filled by route handler
		},
		packageMetadata: /** @type {any} */ (data).packageMetadata,
		generationTimestamp: /** @type {any} */ (data).generationTimestamp,
	});
}
