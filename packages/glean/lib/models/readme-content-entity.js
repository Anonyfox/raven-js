/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file README content entity model for documentation generation.
 *
 * Ravens feast on documentation. This entity represents README and markdown
 * content, parsing structure, extracting metadata, and providing rich
 * content integration with surgical precision.
 */

import { html } from "@raven-js/beak";

/**
 * README content entity representing markdown documentation
 *
 * Handles README files and markdown content throughout the documentation
 * ecosystem. Provides parsing, validation, and output generation for
 * content-rich documentation assets.
 *
 * @class ReadmeContentEntity
 */
export class ReadmeContentEntity {
	/**
	 * Create a README content entity instance
	 * @param {string} id - Unique content identifier
	 * @param {string} path - Content file path
	 * @param {string} directory - Directory context
	 */
	constructor(id, path, directory) {
		this.id = id;
		this.path = path;
		this.directory = directory;
		this.content = "";
		this.wordCount = 0;
		this.lineCount = 0;
		/** @type {Array<any>} */
		this.headings = [];
		/** @type {Array<any>} */
		this.links = [];
		this.lastModified = null;
		this.language = "markdown";
		this.isValidated = false;
		/** @type {Array<any>} */
		this.validationIssues = [];
		/** @type {Array<string>} */
		this.assetIds = [];
		/** @type {Array<string>} */
		this.missingAssets = [];
	}

	/**
	 * Set content and parse metadata
	 * @param {string} content - Raw content string
	 */
	setContent(content) {
		this.content = content;
		this.parseMetadata();
	}

	/**
	 * Set metadata properties
	 * @param {Object} metadata - Content metadata
	 * @param {Date} [metadata.lastModified] - Last modification date
	 * @param {string} [metadata.language] - Content language
	 */
	setMetadata(metadata) {
		if (metadata.lastModified !== undefined)
			this.lastModified = metadata.lastModified;
		if (metadata.language !== undefined) this.language = metadata.language;
	}

	/**
	 * Get unique content identifier
	 * @returns {string} Content ID
	 */
	getId() {
		return this.id;
	}

	/**
	 * Check if content is valid
	 * @returns {boolean} True if content is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Parse content metadata and structure
	 * @private
	 */
	parseMetadata() {
		this.lineCount = this.content.split("\n").length;
		this.wordCount = this.content
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
		this.extractHeadings();
		this.extractLinks();
	}

	/**
	 * Extract headings from content
	 * @private
	 */
	extractHeadings() {
		this.headings = [];
		const lines = this.content.split("\n");
		for (const line of lines) {
			const match = line.match(/^(#{1,6})\s+(.+)$/);
			if (match) {
				this.headings.push({
					level: match[1].length,
					text: match[2].trim(),
					anchor: match[2].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
				});
			}
		}
	}

	/**
	 * Extract links from content
	 * @private
	 */
	extractLinks() {
		this.links = [];
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		let match = linkRegex.exec(this.content);
		while (match !== null) {
			this.links.push({
				text: match[1],
				url: match[2],
				isExternal: match[2].startsWith("http"),
			});
			match = linkRegex.exec(this.content);
		}
	}

	/**
	 * Get table of contents from headings
	 * @returns {Array<Object>} Table of contents items
	 */
	getTableOfContents() {
		return this.headings.map((heading) => ({
			level: heading.level,
			text: heading.text,
			anchor: heading.anchor,
		}));
	}

	/**
	 * Get content statistics
	 * @returns {Object} Content statistics
	 */
	getStatistics() {
		return {
			id: this.id,
			path: this.path,
			directory: this.directory,
			wordCount: this.wordCount,
			lineCount: this.lineCount,
			headingCount: this.headings.length,
			linkCount: this.links.length,
			imageCount: this.links.filter((link) =>
				link.url?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i),
			).length,
			codeBlockCount: (this.content.match(/```/g) || []).length / 2,
			externalLinkCount: this.links.filter((link) => link.isExternal).length,
			isValidated: this.isValidated,
			issueCount: this.validationIssues.length,
		};
	}

	/**
	 * Validate content structure and accessibility
	 * @returns {boolean} True if content is valid
	 */
	validate() {
		this.validationIssues = [];

		// Check required properties
		if (!this.id?.trim()) {
			this.validationIssues.push({
				type: "missing_id",
				message: "Content must have a valid ID",
			});
		}

		if (!this.path?.trim()) {
			this.validationIssues.push({
				type: "missing_path",
				message: "Content must have a valid path",
			});
		}

		// Content quality checks
		if (this.content.length === 0) {
			this.validationIssues.push({
				type: "empty_content",
				message: "Content appears to be empty",
			});
		}

		if (this.wordCount < 10) {
			this.validationIssues.push({
				type: "minimal_content",
				message: "Content appears to be minimal (less than 10 words)",
			});
		}

		// Check for basic README structure
		if (
			this.path.toLowerCase().includes("readme") &&
			this.headings.length === 0
		) {
			this.validationIssues.push({
				type: "missing_structure",
				message: "README file lacks heading structure",
			});
		}

		this.isValidated = this.validationIssues.length === 0;
		return this.isValidated;
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for content documentation
	 */
	toHTML() {
		const stats = /** @type {any} */ (this.getStatistics());
		const toc = /** @type {any[]} */ (this.getTableOfContents());

		return html`
			<div class="readme-content-entity">
				<h2>${this.path}</h2>
				<div class="content-meta">
					<span class="content-directory">${this.directory}</span>
					<span class="content-words">${this.wordCount} words</span>
					<span class="content-lines">${this.lineCount} lines</span>
				</div>

				<div class="content-stats">
					<div class="stat"><strong>Headings:</strong> ${stats.headingCount}</div>
					<div class="stat"><strong>Links:</strong> ${stats.linkCount}</div>
					<div class="stat"><strong>Images:</strong> ${stats.imageCount}</div>
					<div class="stat"><strong>Code Blocks:</strong> ${stats.codeBlockCount}</div>
				</div>

				${
					toc.length > 0
						? html`
					<div class="table-of-contents">
						<h3>Table of Contents</h3>
						<ul class="toc-list">
							${toc
								.map(
									(item) => html`
								<li class="toc-level-${item.level}">
									<a href="#${item.anchor}">${item.text}</a>
								</li>
							`,
								)
								.join("\n")}
						</ul>
					</div>
				`
						: ""
				}

				${
					this.assetIds.length > 0
						? html`
					<div class="referenced-assets">
						<h3>Referenced Assets</h3>
						<ul class="asset-list">
							${this.assetIds.map((assetId) => html`<li><code>${assetId}</code></li>`).join("\n")}
						</ul>
					</div>
				`
						: ""
				}

				${
					this.missingAssets.length > 0
						? html`
					<div class="missing-assets">
						<h3>Missing Assets</h3>
						<ul class="missing-asset-list">
							${this.missingAssets.map((asset) => html`<li class="missing"><code>${asset}</code></li>`).join("\n")}
						</ul>
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for content documentation
	 */
	toMarkdown() {
		const stats = /** @type {any} */ (this.getStatistics());

		let output = `## ${this.path}\n\n`;
		output += `**Directory:** \`${this.directory}\`\n`;
		output += `**Words:** ${this.wordCount}\n`;
		output += `**Lines:** ${this.lineCount}\n\n`;

		output += `**Statistics:**\n`;
		output += `- Headings: ${stats.headingCount}\n`;
		output += `- Links: ${stats.linkCount}\n`;
		output += `- Images: ${stats.imageCount}\n`;
		output += `- Code Blocks: ${stats.codeBlockCount}\n\n`;

		const toc = /** @type {any[]} */ (this.getTableOfContents());
		if (toc.length > 0) {
			output += `**Table of Contents:**\n`;
			for (const item of toc) {
				const indent = "  ".repeat(item.level - 1);
				output += `${indent}- [${item.text}](#${item.anchor})\n`;
			}
			output += `\n`;
		}

		if (this.assetIds.length > 0) {
			output += `**Referenced Assets:**\n`;
			for (const assetId of this.assetIds) {
				output += `- \`${assetId}\`\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
