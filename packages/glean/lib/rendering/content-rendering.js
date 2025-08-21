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
 * Pure HTML content generators using beak/md for markdown rendering.
 * Leverages existing entity toHTML methods for maximum precision.
 */

import { html, md } from "@raven-js/beak";

/**
 * Generate entity list HTML
 * @param {any[]} entities - Array of entities
 * @returns {string} HTML string
 */
export function generateEntityList(entities) {
	if (!entities || entities.length === 0) {
		return html`<div class="entity-grid"></div>`;
	}

	const entityCards = entities
		.map((entity) => {
			const entityType = entity.type || entity.entityType || "unknown";
			const entityName = entity.name || "Unnamed";
			// Use the full entity ID for the link, but entity name for display
			const entityId = entity.id || entity.getId?.() || entityName;
			const description = entity.jsdoc?.description || entity.description || "";

			return html`
			<div class="entity-card">
				<h4>
					<a href="../entities/${entityId.replace(/\//g, "-")}.html">${entityName}</a>
				</h4>
				<span class="entity-type">${entityType}</span>
				${description ? html`<p class="entity-description">${description}</p>` : ""}
			</div>
		`;
		})
		.join("");

	return html`<div class="entity-grid">${entityCards}</div>`;
}

/**
 * Generate entity details HTML
 * @param {any} entityData - Entity data
 * @returns {string} HTML string
 */
export function generateEntityDetails(entityData) {
	if (!entityData) {
		return "";
	}

	const entityType = entityData.type || entityData.entityType || "unknown";
	const entityName = entityData.name || "Unnamed";
	const location = entityData.location || {};
	const sourceFile = location.file || "";
	const lineNumber = location.line || "";
	const exports = entityData.exports || [];
	const jsdoc = entityData.jsdoc || {};

	let content = html`
		<section class="entity-details">
			<div class="entity-meta">
				<span class="entity-type">${entityType}</span>
				${sourceFile ? html`<span class="entity-source">${sourceFile}${lineNumber ? `:${lineNumber}` : ""}</span>` : ""}
			</div>

			<div class="entity-header">
				<h1 class="entity-name">${entityName}</h1>
			</div>
	`;

	// Add exports info if available
	if (exports.length > 0) {
		content += html`<div class="entity-exports">Exports: ${exports.join(", ")}</div>`;
	}

	// Add JSDoc content if available
	if (jsdoc) {
		content += generateJSDocSection(jsdoc);
	}

	// Add source code if available
	const source = entityData.source || "";
	if (source) {
		content += html`
			<div class="jsdoc-section">
				<h3>Source Code</h3>
				<pre class="source-code"><code>${source}</code></pre>
			</div>
		`;
	}

	// Use entity's toHTML method if available, otherwise use our generated content
	if (entityData.toHTML) {
		return entityData.toHTML();
	}

	content += html`</section>`;
	return content;
}

/**
 * Generate JSDoc section HTML
 * @param {any} jsdoc - JSDoc data
 * @returns {string} HTML string
 */
export function generateJSDocSection(jsdoc) {
	if (!jsdoc) {
		return "";
	}

	const description = jsdoc.description || "";
	const params = jsdoc.tags?.param || jsdoc.params || [];
	const returns = jsdoc.tags?.returns || jsdoc.returns || jsdoc.return || "";
	const examples = jsdoc.tags?.examples || jsdoc.examples || [];

	let content = "";

	if (description) {
		content += html`<div class="jsdoc-description">${description}</div>`;
	}

	if (params.length > 0) {
		const paramRows = params
			.map(
				/** @param {any} param */
				(param) => html`
			<tr>
				<td class="param-name">${param.name}</td>
				<td class="param-type">${param.type || ""}</td>
				<td>${param.description || ""}</td>
			</tr>
		`,
			)
			.join("");

		content += html`
			<div class="jsdoc-section">
				<h3>Parameters</h3>
				<table class="param-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>${paramRows}</tbody>
				</table>
			</div>
		`;
	}

	if (returns) {
		const returnType = returns.type || "";
		const returnDesc = returns.description || returns;
		content += html`
			<div class="jsdoc-section">
				<h3>Returns</h3>
				<p>
					${returnType ? html`<span class="param-type">${returnType}</span> ` : ""}
					${returnDesc}
				</p>
			</div>
		`;
	}

	if (examples.length > 0) {
		const exampleBlocks = examples
			.map(
				/** @param {any} example */
				(example) => html`
			<pre class="source-code"><code>${example}</code></pre>
		`,
			)
			.join("");

		content += html`
			<div class="jsdoc-section">
				<h3>Examples</h3>
				${exampleBlocks}
			</div>
		`;
	}

	return content;
}

/**
 * Generate README section HTML
 * @param {any} readmeData - README data
 * @returns {string} HTML string
 */
export function generateReadmeSection(readmeData) {
	if (!readmeData) {
		return html`<div class="readme"></div>`;
	}

	const content =
		readmeData.content || readmeData.markdown || readmeData.text || "";

	if (!content) {
		return html`<div class="readme"></div>`;
	}

	// Use beak/md for GFM-like rendering
	let renderedMarkdown = md`${content}`;

	// Shift heading levels down by one (h1->h2, h2->h3, etc.) to fit under document structure
	// Replace in reverse order to avoid conflicts
	renderedMarkdown = renderedMarkdown
		.replace(/<h5>/g, "<h6>")
		.replace(/<\/h5>/g, "</h6>")
		.replace(/<h4>/g, "<h5>")
		.replace(/<\/h4>/g, "</h5>")
		.replace(/<h3>/g, "<h4>")
		.replace(/<\/h3>/g, "</h4>")
		.replace(/<h2>/g, "<h3>")
		.replace(/<\/h2>/g, "</h3>")
		.replace(/<h1>/g, "<h2>")
		.replace(/<\/h1>/g, "</h2>");

	return html`<div class="readme">
		<h2>README</h2>
		${renderedMarkdown}
	</div>`;
}
