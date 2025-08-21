/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Content rendering for documentation HTML generation.
 *
 * Pure HTML content generators that transform documentation data
 * into rendered HTML components. Handles entity lists, JSDoc sections,
 * entity details, and README markdown conversion.
 */

import { html } from "@raven-js/beak";

/**
 * Generate entity list HTML
 * @param {any[]} entities - Array of entities
 * @returns {string} HTML string
 */
export function generateEntityList(entities) {
	return html`
		<div class="entity-grid">
			${entities
				.map(
					(entity) => html`
						<div class="entity-card">
							<h4><a href="../entities/${entity.id.replace(/\//g, "-")}.html">${entity.name}</a></h4>
							<span class="entity-type">${entity.type}</span>
							${entity.jsdoc?.description ? html`<p class="entity-description">${entity.jsdoc.description}</p>` : ""}
						</div>
					`,
				)
				.join("")}
		</div>
	`;
}

/**
 * Generate entity details HTML
 * @param {any} entityData - Entity data
 * @returns {string} HTML string
 */
export function generateEntityDetails(entityData) {
	return html`
		<section class="entity-details">
			<div class="entity-meta">
				<p><strong>File:</strong> ${entityData.location.file}</p>
				<p><strong>Line:</strong> ${entityData.location.line}</p>
				${entityData.exports.length > 0 ? html`<p><strong>Export:</strong> ${entityData.exports.join(", ")}</p>` : ""}
			</div>

			${entityData.jsdoc ? generateJSDocSection(entityData.jsdoc) : ""}

			<section class="source-code">
				<h3>Source Code</h3>
				<pre><code>${entityData.source}</code></pre>
			</section>
		</section>
	`;
}

/**
 * Generate JSDoc documentation section
 * @param {any} jsdoc - JSDoc data
 * @returns {string} HTML string
 */
export function generateJSDocSection(jsdoc) {
	return html`
		<section class="jsdoc">
			<h3>Documentation</h3>
			${jsdoc.description ? html`<p class="description">${jsdoc.description}</p>` : ""}

			${
				jsdoc.tags?.param
					? html`
						<div class="parameters">
							<h4>Parameters</h4>
							<ul>
								${jsdoc.tags.param
									.map(
										/** @param {any} param */ (param) => html`
											<li>
												<code>${param.name}</code> <span class="type">{${param.type}}</span>
												${param.description ? html` - ${param.description}` : ""}
											</li>
										`,
									)
									.join("")}
							</ul>
						</div>
					`
					: ""
			}

			${
				jsdoc.tags?.returns
					? html`
						<div class="returns">
							<h4>Returns</h4>
							<p><span class="type">{${jsdoc.tags.returns.type}}</span> ${jsdoc.tags.returns.description}</p>
						</div>
					`
					: ""
			}
		</section>
	`;
}

/**
 * Generate README section HTML
 * @param {any} readmeData - README data
 * @returns {string} HTML string
 */
export function generateReadmeSection(readmeData) {
	// Simple markdown-to-HTML conversion (basic implementation)
	const htmlContent = readmeData.content
		.replace(/^# (.+)$/gm, "<h2>$1</h2>")
		.replace(/^## (.+)$/gm, "<h3>$1</h3>")
		.replace(/^### (.+)$/gm, "<h4>$1</h4>")
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/\*(.+?)\*/g, "<em>$1</em>")
		.replace(/`(.+?)`/g, "<code>$1</code>")
		.replace(/\n\n/g, "</p><p>")
		.replace(/^(.+)$/gm, "<p>$1</p>")
		.replace(/<p><h/g, "<h")
		.replace(
			/h[2-4]><\/p>/g,
			/** @param {string} match */ (match) => match.replace("></p>", ">"),
		);

	return html`
		<section class="readme">
			<h2>README</h2>
			<div class="readme-content">${htmlContent}</div>
		</section>
	`;
}
