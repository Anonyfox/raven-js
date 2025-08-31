/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Global footer component for documentation pages
 *
 * Renders a Bootstrap-native responsive footer containing package attribution
 * and Glean branding with generation timestamp. Adapts layout from desktop
 * two-column to mobile stacked design.
 */

import { html } from "@raven-js/beak";

/**
 * Render a package metadata link with icon
 * @param {string} url - Link URL
 * @param {string} label - Link label text
 * @param {string} icon - Unicode icon
 * @returns {string} HTML link with icon
 */
function renderPackageLink(url, label, icon) {
	if (!url) return "";

	return html`
		<a href="${url}" target="_blank" rel="noopener noreferrer"
		   class="text-decoration-none text-muted me-3">
			${icon} ${label}
		</a>
	`;
}

/**
 * Generate global footer for documentation pages
 * @param {Object} options - Footer options
 * @param {string} [options.packageName] - Package name
 * @param {Object} [options.packageMetadata] - Package metadata
 * @param {string} [options.packageMetadata.homepage] - Homepage URL
 * @param {string|Object} [options.packageMetadata.author] - Author info
 * @param {Object} [options.packageMetadata.repository] - Repository info
 * @param {string} [options.packageMetadata.repository.url] - Repository URL
 * @param {Object} [options.packageMetadata.bugs] - Bug tracker info
 * @param {string} [options.packageMetadata.bugs.url] - Bug tracker URL
 * @param {Object} [options.packageMetadata.funding] - Funding info
 * @param {string} [options.packageMetadata.funding.url] - Funding URL
 * @param {string} [options.generationTimestamp] - Generation timestamp
 * @returns {string} Global footer HTML
 */
export function globalFooter({
	packageName = "",
	packageMetadata = null,
	generationTimestamp = null,
}) {
	// Extract package metadata if provided
	let authorName = "";
	let authorEmail = "";

	if (packageMetadata?.author) {
		const author = packageMetadata.author;
		if (typeof author === "string") {
			// Parse "Name <email>" format
			const match = author.match(/^(.+?)\s*<([^>]+)>$/);
			if (match) {
				authorName = match[1].trim();
				authorEmail = match[2].trim();
			} else {
				authorName = author;
			}
		} else if (
			author &&
			typeof author === "object" &&
			/** @type {any} */ (author).name
		) {
			/** @type {any} */
			const authorObj = author;
			authorName = authorObj.name;
			authorEmail = authorObj.email || "";
		}
	}

	// Generate package links
	const homepageLink = packageMetadata?.homepage
		? renderPackageLink(packageMetadata.homepage, "Homepage", "🏠")
		: "";

	const repositoryUrl =
		typeof packageMetadata?.repository === "string"
			? packageMetadata.repository
			: packageMetadata?.repository?.url || "";
	const repositoryLink = repositoryUrl
		? renderPackageLink(repositoryUrl, "Repository", "📁")
		: "";

	const issuesUrl =
		typeof packageMetadata?.bugs === "string"
			? packageMetadata.bugs
			: packageMetadata?.bugs?.url || "";
	const issuesLink = issuesUrl
		? renderPackageLink(issuesUrl, "Issues", "🐛")
		: "";

	const fundingUrl =
		typeof packageMetadata?.funding === "string"
			? packageMetadata.funding
			: packageMetadata?.funding?.url || "";
	const fundingLink = fundingUrl
		? renderPackageLink(fundingUrl, "Funding", "💖")
		: "";

	// Generate timestamp string
	const timestamp = generationTimestamp
		? new Date(generationTimestamp).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: new Date().toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});

	return html`
		<footer class="bg-light border-top py-4 mt-5">
			<div class="container-fluid">
				<div class="row align-items-center">
					<!-- Package Attribution (Left) -->
					${
						packageName || packageMetadata
							? html`
					<div class="col-lg-6 col-md-12 mb-2 mb-lg-0">
						<div class="d-flex flex-wrap align-items-center">
							${
								packageName
									? html`
								<span class="text-muted me-3">📦 ${packageName}</span>
							`
									: ""
							}
							${homepageLink}
							${repositoryLink}
							${issuesLink}
							${fundingLink}
						</div>
						${
							authorName
								? html`
							<small class="text-muted">
								by ${authorName}${authorEmail ? html` <span><</span>${authorEmail}<span>></span>` : ""}
							</small>
						`
								: ""
						}
					</div>
					`
							: ""
					}

					<!-- Glean Attribution & Timestamp (Right) -->
					<div class="${packageName || packageMetadata ? "col-lg-6 col-md-12" : "col-12"} text-lg-end">
						<div class="d-flex flex-column flex-lg-row justify-content-lg-end align-items-lg-center">
							<small class="text-muted me-lg-3 mb-1 mb-lg-0">
								Generated ${timestamp}
							</small>
							<small>
								<a href="https://github.com/Anonyfox/ravenjs/tree/main/packages/glean"
								   target="_blank" rel="noopener noreferrer"
								   class="text-decoration-none text-muted">
									⚡ Powered by Glean
								</a>
							</small>
						</div>
					</div>
				</div>
			</div>
		</footer>
	`;
}
