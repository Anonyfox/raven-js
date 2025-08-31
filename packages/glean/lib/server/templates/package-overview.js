/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview template for documentation homepage.
 *
 * Renders package information, README content, and module navigation using
 * Bootstrap 5 components with responsive layout and getting started section.
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
 * Apply asset path rewriting to HTML content if asset registry is available
 * @param {string} html - HTML content to process
 * @param {import('../../assets/registry.js').AssetRegistry} [assetRegistry] - Asset registry
 * @returns {string} HTML with rewritten asset paths
 */
function applyAssetPathRewriting(html, assetRegistry) {
	if (!assetRegistry || typeof html !== "string") {
		return html;
	}
	return assetRegistry.rewriteImagePaths(html);
}

/**
 * Generate package overview HTML page with README content and module navigation.
 *
 * @param {Object} data - Package overview data from extractor
 * @param {string} data.name - Package name
 * @param {string} data.version - Package version
 * @param {string} data.description - Package description
 * @param {string} data.readmeMarkdown - README markdown content
 * @param {Array<Object>} data.modules - Module information array
 * @param {boolean} data.hasReadme - Whether README content exists
 * @param {boolean} data.hasModules - Whether modules exist
 * @param {import('../../assets/registry.js').AssetRegistry} [assetRegistry] - Asset registry for path rewriting
 * @param {Object} [options] - Template options
 * @param {Object} [options.urlBuilder] - URL builder for generating navigation links
 * @returns {string} Complete HTML page
 *
 * @example
 * // Basic package overview
 * packageOverviewTemplate({
 *   name: 'my-package',
 *   version: '1.0.0',
 *   description: 'A great package',
 *   readmeMarkdown: '# Hello World',
 *   modules: [],
 *   hasReadme: true,
 *   hasModules: false
 * }, assetRegistry);
 */
export function packageOverviewTemplate(data, assetRegistry, options = {}) {
	const { urlBuilder } = options;
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
								content: html`<div class="readme-content">${applyAssetPathRewriting(applySyntaxHighlighting(markdownToHTML(readmeMarkdown)), assetRegistry)}</div>`,
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
								link: urlBuilder
									? /** @type {any} */ (urlBuilder).moduleUrl(
											module.name.split("/").pop(),
										)
									: `/modules/${module.name.split("/").pop()}/`,
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
		urlBuilder,
	});
}
