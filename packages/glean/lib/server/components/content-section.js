/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Content section components for organizing page content
 *
 * Bootstrap-based content sectioning using cards and proper spacing.
 * Semantic markup eliminating custom CSS through utility classes.
 */

import { html, safeHtml } from "@raven-js/beak";
import {
	highlightCSS,
	highlightHTML,
	highlightJS,
	highlightShell,
	highlightSQL,
} from "@raven-js/beak/highlight";

/**
 * Language alias mappings for syntax highlighting
 * Maps common language identifiers to their corresponding highlighter functions
 * @type {Record<string, string>}
 */
const LANGUAGE_MAPPINGS = {
	// JavaScript variants
	js: "javascript",
	javascript: "javascript",
	jsx: "javascript",
	es6: "javascript",
	node: "javascript",
	mjs: "javascript",

	// Shell variants
	sh: "shell",
	shell: "shell",
	bash: "shell",
	zsh: "shell",
	fish: "shell",
	powershell: "shell",

	// HTML variants
	html: "html",
	htm: "html",
	xml: "html",

	// CSS variants
	css: "css",
	scss: "css",
	sass: "css",
	less: "css",
	styl: "css",

	// SQL variants
	sql: "sql",
	mysql: "sql",
	postgres: "sql",
	postgresql: "sql",
	sqlite: "sql",
	mariadb: "sql",
};

/**
 * Available syntax highlighters
 * @type {Record<string, (sourceText: string) => string>}
 */
const HIGHLIGHTERS = {
	javascript: highlightJS,
	html: highlightHTML,
	css: highlightCSS,
	sql: highlightSQL,
	shell: highlightShell,
};

/**
 * Resolve language to highlighter function
 * @param {string} [language] - Language identifier
 * @returns {string|null} Resolved highlighter key or null if unsupported
 */
function resolveHighlighter(language) {
	if (!language) return null;
	const normalizedKey = language.toLowerCase();
	const normalized = LANGUAGE_MAPPINGS[normalizedKey];
	return normalized && HIGHLIGHTERS[normalized] ? normalized : null;
}

/**
 * Post-process HTML to apply syntax highlighting to code blocks
 * Finds <pre><code class="language-xxx"> blocks and applies beak highlighting
 * @param {string} html - HTML content containing code blocks
 * @returns {string} HTML with syntax-highlighted code blocks
 */
export function applySyntaxHighlighting(html) {
	if (!html || typeof html !== "string") {
		return html;
	}

	// Match <pre><code class="language-xxx">content</code></pre> blocks
	const codeBlockRegex =
		/<pre><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g;

	return html.replace(codeBlockRegex, (_match, language, content) => {
		// Decode HTML entities back to original code
		const decodedContent = content
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&amp;/g, "&")
			.replace(/&#39;/g, "'")
			.replace(/&quot;/g, '"');

		// Apply syntax highlighting if supported language
		const highlighterKey = resolveHighlighter(language);
		const highlightedCode = highlighterKey
			? HIGHLIGHTERS[highlighterKey](decodedContent)
			: safeHtml`${decodedContent}`;

		// Return enhanced code block
		const langClass = language
			? ` class="language-${safeHtml`${language}`}"`
			: "";
		return `<pre><code${langClass}>${highlightedCode}</code></pre>`;
	});
}

/**
 * Generate content section with card wrapper
 * @param {Object} options - Section configuration
 * @param {string} [options.title] - Section title
 * @param {string} [options.icon] - Section icon
 * @param {string} options.content - Section content
 * @param {boolean} [options.noPadding] - Remove card body padding
 * @param {string} [options.headerVariant] - Header background variant
 * @returns {string} Content section HTML
 */
export function contentSection({
	title,
	icon,
	content,
	noPadding = false,
	headerVariant = "white",
}) {
	return html`
		<div class="card mb-4">
			${
				title
					? html`
			<div class="card-header bg-${headerVariant} border-bottom">
				<h3 class="h5 mb-0">${icon ? `${icon} ` : ""}${title}</h3>
			</div>
			`
					: ""
			}
			<div class="card-body ${noPadding ? "p-0" : ""}">
				${content}
			</div>
		</div>
	`;
}

/**
 * Generate code block with copy functionality
 * @param {Object} options - Code block configuration
 * @param {string} options.code - Code content
 * @param {string} [options.language] - Code language
 * @param {string} [options.title] - Code block title
 * @param {boolean} [options.showCopy] - Show copy button
 * @returns {string} Code block HTML
 */
export function codeBlock({
	code,
	language = "javascript",
	title,
	showCopy = true,
}) {
	// Generate unique ID for this code block
	const blockId = `code-${Math.random().toString(36).substr(2, 9)}`;

	// Apply syntax highlighting if supported language
	const highlighterKey = resolveHighlighter(language);
	const highlightedCode = highlighterKey
		? HIGHLIGHTERS[highlighterKey](code)
		: safeHtml`${code}`;

	return html`
		${title ? html`<h6 class="fw-bold mb-3">${safeHtml`${title}`}</h6>` : ""}
		<div class="position-relative">
			<pre class="bg-light border rounded p-3 mb-0" id="${blockId}"><code class="language-${safeHtml`${language}`}">${highlightedCode}</code></pre>
			${
				showCopy
					? html`
			<button class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
				onclick="copyCodeBlock('${blockId}')" title="Copy ${safeHtml`${title || "code"}`}">
				📋 Copy
			</button>
			`
					: ""
			}
		</div>
	`;
}

/**
 * Generate table section
 * @param {Object} options - Table configuration
 * @param {Array<string>} options.headers - Table headers
 * @param {Array<Array<string>>} options.rows - Table rows
 * @param {boolean} [options.striped] - Use striped table
 * @param {boolean} [options.responsive] - Make table responsive
 * @returns {string} Table HTML
 */
export function tableSection({
	headers,
	rows,
	striped = true,
	responsive = true,
}) {
	const tableClass = `table ${striped ? "table-striped" : ""} mb-0`;

	const table = html`
		<table class="${tableClass}">
			<thead class="table-light">
				<tr>
					${headers.map((header) => html`<th>${header}</th>`)}
				</tr>
			</thead>
			<tbody>
				${rows.map(
					(row) => html`
				<tr>
					${row.map((cell) => html`<td>${cell}</td>`)}
				</tr>
				`,
				)}
			</tbody>
		</table>
	`;

	return responsive
		? html`
		<div class="table-responsive">
			${table}
		</div>
	`
		: table;
}

/**
 * Generate grid layout for cards
 * @param {Object} options - Grid configuration
 * @param {Array<string>} options.items - Grid items (HTML content)
 * @param {number} [options.columns] - Items per row (1-4)
 * @param {string} [options.gap] - Grid gap class (g-1, g-2, g-3, g-4, g-5)
 * @returns {string} Grid HTML
 */
export function cardGrid({ items, columns = 2, gap = "g-4" }) {
	// Calculate Bootstrap column class based on items per row
	// 1 per row = col-12, 2 per row = col-md-6, 3 per row = col-md-4, 4 per row = col-md-3
	/** @type {Record<number, string>} */
	const colMap = {
		1: "col-12",
		2: "col-md-6",
		3: "col-md-6 col-lg-4",
		4: "col-md-6 col-lg-3",
	};

	const normalizedColumns = Math.min(4, Math.max(1, columns));
	const colClass = colMap[normalizedColumns] || "col-md-6";

	return html`
		<div class="row ${gap}">
			${items.map(
				(item) => html`
			<div class="${colClass}">
				${item}
			</div>
			`,
			)}
		</div>
	`;
}

/**
 * Generate getting started section
 * @param {Object} options - Getting started configuration
 * @param {string} options.packageName - Package name
 * @param {Array<{href: string, text: string, variant?: string}>} [options.actions] - Action buttons
 * @returns {string} Getting started HTML
 */
export function gettingStarted({ packageName, actions = [] }) {
	return html`
		<div class="card border-primary">
			<div class="card-header bg-primary text-white">
				<h4 class="mb-0">🚀 Getting Started</h4>
			</div>
			<div class="card-body">
				<div class="row">
					<div class="col-md-6">
						<h6 class="fw-bold">Installation</h6>
						<div class="bg-dark text-light p-3 rounded mb-3">
							<code>npm install ${packageName}</code>
						</div>
					</div>
					<div class="col-md-6">
						<h6 class="fw-bold">Basic Usage</h6>
						<div class="bg-dark text-light p-3 rounded mb-3">
							<code>import { ... } from '${packageName}';</code>
						</div>
					</div>
				</div>
				${
					actions.length > 0
						? html`
				<div class="row">
					<div class="col-12">
						<h6 class="fw-bold">Quick Navigation</h6>
						<div class="d-flex gap-2 flex-wrap">
							${actions.map(
								(action) => html`
							<a href="${action.href}" class="btn btn-${action.variant || "outline-primary"} btn-sm">${action.text}</a>
							`,
							)}
						</div>
					</div>
				</div>
				`
						: ""
				}
			</div>
		</div>
	`;
}
