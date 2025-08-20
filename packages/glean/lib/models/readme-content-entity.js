/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file README content entity model - predatory content intelligence.
 *
 * Ravens parse README and markdown documentation with surgical precision.
 * Extracts asset references, analyzes content structure, and provides
 * comprehensive documentation content management.
 */

import { html, mdExtractStructuredContent } from "@raven-js/beak";

/**
 * README content entity implementation
 *
 * **Represents:** README.md files and other markdown documentation
 *
 * **Core Functionality:**
 * - Markdown content parsing and storage
 * - Asset reference extraction (images, links)
 * - Content structure analysis (headings, sections)
 * - Directory context tracking
 * - Cross-reference detection
 *
 * **Serialization:** Clean JSON with parsed content structure
 */
export class ReadmeContentEntity {
	/**
	 * Create README content entity instance
	 * @param {string} id - Content identifier
	 * @param {string} path - Relative path to README file
	 * @param {string} directory - Directory containing the README
	 */
	constructor(id, path, directory) {
		// Content identification
		this.id = id;
		this.path = path;
		this.directory = directory;

		// Content data
		this.content = "";
		this.rawContent = ""; // Original unchanged content

		// Parsed content structure
		/** @type {Array<{level: number, title: string, id: string, line: number}>} */
		this.headings = [];
		/** @type {Array<{type: string, url: string, text: string, line: number}>} */
		this.links = [];
		/** @type {Array<{src: string, alt: string, line: number}>} */
		this.images = [];
		/** @type {Array<{language: string, content: string, line: number}>} */
		this.codeBlocks = [];

		// Asset references
		/** @type {string[]} */
		this.assetIds = []; // Referenced asset IDs
		/** @type {string[]} */
		this.missingAssets = []; // Assets that couldn't be found

		// Content metadata
		this.wordCount = 0;
		this.lineCount = 0;
		this.lastModified = null;
		this.language = "en"; // Content language

		// Cross-references
		/** @type {string[]} */
		this.entityReferences = []; // Referenced entity IDs from links
		/** @type {string[]} */
		this.moduleReferences = []; // Referenced module IDs

		// Validation state
		this.isValidated = false;
		/** @type {Array<{type: string, message: string, line?: number}>} */
		this.validationIssues = [];
	}

	/**
	 * Get content identifier
	 * @returns {string} Content ID
	 */
	getId() {
		return this.id;
	}

	/**
	 * Set content and trigger parsing
	 * @param {string} content - Markdown content
	 */
	setContent(content) {
		this.content = content;
		this.rawContent = content;
		this.parseContent();
	}

	/**
	 * Parse markdown content to extract structure and references
	 * Uses beak's internal markdown parser for comprehensive, reliable parsing
	 */
	parseContent() {
		if (this.content === null || this.content === undefined) {
			return;
		}

		// Use beak's internal parser for comprehensive markdown analysis
		const parsed = mdExtractStructuredContent(this.content);

		// Update counts
		this.lineCount = parsed.lineCount;
		this.wordCount = parsed.wordCount;

		// Use parsed structure directly
		this.headings = parsed.headings;
		this.links = parsed.links;
		this.images = parsed.images;
		this.codeBlocks = parsed.codeBlocks;
	}

	/**
	 * Add asset reference
	 * @param {string} assetId - Asset identifier
	 */
	addAssetReference(assetId) {
		if (!this.assetIds.includes(assetId)) {
			this.assetIds.push(assetId);
		}
	}

	/**
	 * Add missing asset reference
	 * @param {string} assetPath - Path to missing asset
	 */
	addMissingAsset(assetPath) {
		if (!this.missingAssets.includes(assetPath)) {
			this.missingAssets.push(assetPath);
		}
	}

	/**
	 * Add entity reference
	 * @param {string} entityId - Referenced entity ID
	 */
	addEntityReference(entityId) {
		if (!this.entityReferences.includes(entityId)) {
			this.entityReferences.push(entityId);
		}
	}

	/**
	 * Add module reference
	 * @param {string} moduleId - Referenced module ID
	 */
	addModuleReference(moduleId) {
		if (!this.moduleReferences.includes(moduleId)) {
			this.moduleReferences.push(moduleId);
		}
	}

	/**
	 * Set content metadata
	 * @param {{lastModified?: Date, language?: string}} metadata - Content metadata
	 */
	setMetadata(metadata) {
		if (metadata.lastModified !== undefined) {
			this.lastModified = metadata.lastModified;
		}
		if (metadata.language !== undefined) {
			this.language = metadata.language;
		}
	}

	/**
	 * Get content statistics
	 * @returns {{headingCount: number, linkCount: number, imageCount: number, codeBlockCount: number, assetCount: number}} Content statistics
	 */
	getStatistics() {
		return {
			headingCount: this.headings.length,
			linkCount: this.links.length,
			imageCount: this.images.length,
			codeBlockCount: this.codeBlocks.length,
			assetCount: this.assetIds.length,
		};
	}

	/**
	 * Get table of contents from headings
	 * @returns {Array<{level: number, title: string, id: string}>} Table of contents
	 */
	getTableOfContents() {
		return this.headings.map((heading) => ({
			level: heading.level,
			title: heading.title,
			id: heading.id,
		}));
	}

	/**
	 * Validate content structure and references
	 */
	validate() {
		this.validationIssues = [];

		// Validate required fields
		if (!this.id || this.id.length === 0) {
			this.validationIssues.push({
				type: "missing_id",
				message: "Content ID is missing or empty",
			});
		}

		if (!this.path || this.path.length === 0) {
			this.validationIssues.push({
				type: "missing_path",
				message: "Content path is missing or empty",
			});
		}

		// Validate content structure
		this.validateContentStructure();

		// Validate links and references
		this.validateReferences();

		this.isValidated = this.validationIssues.length === 0;
	}

	/**
	 * Validate content structure
	 */
	validateContentStructure() {
		// Check for proper heading hierarchy
		let previousLevel = 0;
		for (const heading of this.headings) {
			if (heading.level > previousLevel + 1 && previousLevel > 0) {
				this.validationIssues.push({
					type: "heading_hierarchy",
					message: `Heading level jump from H${previousLevel} to H${heading.level} at line ${heading.line}`,
					line: heading.line,
				});
			}
			previousLevel = heading.level;
		}

		// Check for duplicate heading IDs
		const headingIds = this.headings.map((h) => h.id);
		const duplicates = headingIds.filter(
			(id, index) => headingIds.indexOf(id) !== index,
		);
		if (duplicates.length > 0) {
			this.validationIssues.push({
				type: "duplicate_heading_ids",
				message: `Duplicate heading IDs found: ${duplicates.join(", ")}`,
			});
		}
	}

	/**
	 * Validate links and references
	 */
	validateReferences() {
		// Check for broken internal anchor links
		const anchorLinks = this.links.filter((link) => link.type === "anchor");
		const headingIds = this.headings.map((h) => h.id);

		for (const link of anchorLinks) {
			const anchorId = link.url.substring(1); // Remove #
			if (!headingIds.includes(anchorId)) {
				this.validationIssues.push({
					type: "broken_anchor",
					message: `Broken anchor link '${link.url}' at line ${link.line}`,
					line: link.line,
				});
			}
		}

		// Report missing assets
		for (const missingAsset of this.missingAssets) {
			this.validationIssues.push({
				type: "missing_asset",
				message: `Referenced asset not found: ${missingAsset}`,
			});
		}
	}

	/**
	 * Check if content is valid
	 * @returns {boolean} True if content is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Content-specific serializable data
	 */
	getSerializableData() {
		return {
			id: this.id,
			path: this.path,
			directory: this.directory,
			content: this.content,
			headings: this.headings,
			links: this.links,
			images: this.images,
			codeBlocks: this.codeBlocks,
			assetIds: this.assetIds,
			missingAssets: this.missingAssets,
			entityReferences: this.entityReferences,
			moduleReferences: this.moduleReferences,
			wordCount: this.wordCount,
			lineCount: this.lineCount,
			lastModified: this.lastModified,
			language: this.language,
			statistics: this.getStatistics(),
			validationIssues: this.validationIssues,
		};
	}

	/**
	 * Serialize content to JSON format
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			__type: "readme-content",
			__data: this.getSerializableData(),
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for content documentation
	 */
	toHTML() {
		const stats = this.getStatistics();
		const toc = this.getTableOfContents();

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
									<a href="#${item.id}">${item.title}</a>
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
		const stats = this.getStatistics();

		let output = `## ${this.path}\n\n`;
		output += `**Directory:** \`${this.directory}\`\n`;
		output += `**Words:** ${this.wordCount}\n`;
		output += `**Lines:** ${this.lineCount}\n\n`;

		output += `**Statistics:**\n`;
		output += `- Headings: ${stats.headingCount}\n`;
		output += `- Links: ${stats.linkCount}\n`;
		output += `- Images: ${stats.imageCount}\n`;
		output += `- Code Blocks: ${stats.codeBlockCount}\n\n`;

		const toc = this.getTableOfContents();
		if (toc.length > 0) {
			output += `**Table of Contents:**\n`;
			for (const item of toc) {
				const indent = "  ".repeat(item.level - 1);
				output += `${indent}- [${item.title}](#${item.id})\n`;
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
