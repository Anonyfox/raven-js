/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset entity model for documentation generation.
 *
 * Ravens track every resource in the ecosystem. This entity represents
 * static assets like images, files, and other resources referenced in
 * documentation with zero-waste precision.
 */

import { html } from "@raven-js/beak";

/**
 * Asset entity representing static files and resources
 *
 * Tracks images, documents, and other assets referenced in documentation.
 * Provides metadata extraction, validation, and output generation for
 * assets across the documentation ecosystem.
 *
 * @class AssetEntity
 */
export class AssetEntity {
	/**
	 * Create an asset entity instance
	 * @param {string} id - Unique asset identifier
	 * @param {string} path - Asset file path
	 * @param {string} [originalPath] - Original path before processing
	 */
	constructor(id, path, originalPath = path) {
		this.id = id;
		this.path = path;
		this.originalPath = originalPath;
		this.directory = "";
		this.size = 0;
		this.type = "";
		this.encoding = "";
		this.lastModified = null;
		this.checksum = "";
		this.isValidated = false;
		/** @type {Array<Object>} */
		this.validationIssues = [];
		this.mimeType = "";
		this.width = null;
		this.height = null;
		this.content = null;
		/** @type {Array<string>} */
		this.contexts = [];

		// Asset discovery metadata
		this.referenceType = "";
		this.sourceFile = "";
		this.altText = "";
		this.linkText = "";
		this.resolvedPath = "";
		this.contentCategory = "";
	}

	/**
	 * Set asset metadata
	 * @param {Object} metadata - Asset metadata
	 * @param {number} [metadata.size] - File size in bytes
	 * @param {string} [metadata.type] - MIME type
	 * @param {string} [metadata.encoding] - File encoding
	 * @param {Date} [metadata.lastModified] - Last modification date
	 * @param {string} [metadata.checksum] - File checksum
	 */
	setMetadata(metadata) {
		if (metadata.size !== undefined) this.size = metadata.size;
		if (metadata.type !== undefined) this.type = metadata.type;
		if (metadata.encoding !== undefined) this.encoding = metadata.encoding;
		if (metadata.lastModified !== undefined)
			this.lastModified = metadata.lastModified;
		if (metadata.checksum !== undefined) this.checksum = metadata.checksum;
	}

	/**
	 * Set directory context
	 * @param {string} directory - Directory path
	 */
	setDirectory(directory) {
		this.directory = directory;
	}

	/**
	 * Get unique asset identifier
	 * @returns {string} Asset ID
	 */
	getId() {
		return this.id;
	}

	/**
	 * Check if asset is valid
	 * @returns {boolean} True if asset is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Validate asset integrity and accessibility
	 * @returns {boolean} True if asset is valid
	 */
	validate() {
		this.validationIssues = [];

		// Check required properties
		if (!this.id?.trim()) {
			this.validationIssues.push({
				type: "missing_id",
				message: "Asset must have a valid ID",
			});
		}

		if (!this.path?.trim()) {
			this.validationIssues.push({
				type: "missing_path",
				message: "Asset must have a valid path",
			});
		}

		// Validate file type
		if (this.type && !this.isValidMimeType(this.type)) {
			this.validationIssues.push({
				type: "invalid_mime_type",
				message: `Invalid MIME type: ${this.type}`,
			});
		}

		// Check file size constraints
		if (this.size < 0) {
			this.validationIssues.push({
				type: "invalid_size",
				message: "Asset size cannot be negative",
			});
		}

		// Large file warning (>10MB)
		if (this.size > 10 * 1024 * 1024) {
			this.validationIssues.push({
				type: "large_file_warning",
				message: "Asset is larger than 10MB - consider optimization",
			});
		}

		this.isValidated = this.validationIssues.length === 0;
		return this.isValidated;
	}

	/**
	 * Check if MIME type is valid
	 * @param {string} mimeType - MIME type to validate
	 * @returns {boolean} True if valid
	 * @private
	 */
	isValidMimeType(mimeType) {
		// Basic MIME type validation
		return /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/i.test(
			mimeType,
		);
	}

	/**
	 * Get asset statistics
	 * @returns {Object} Asset statistics
	 */
	getStatistics() {
		return {
			id: this.id,
			path: this.path,
			directory: this.directory,
			size: this.size,
			sizeFormatted: this.formatSize(this.size),
			type: this.type,
			encoding: this.encoding,
			hasChecksum: Boolean(this.checksum),
			isValidated: this.isValidated,
			issueCount: this.validationIssues.length,
			referenceCount: this.contexts.length,
			contextCount: this.contexts.length,
		};
	}

	/**
	 * Format file size for display
	 * @param {number} bytes - Size in bytes
	 * @returns {string} Formatted size
	 */
	formatSize(bytes) {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
	}

	/**
	 * Check if asset is an image
	 * @returns {boolean} True if asset is an image
	 */
	isImage() {
		return this.mimeType?.startsWith("image/") || false;
	}

	/**
	 * Get data URL for inline embedding
	 * @returns {string} Data URL
	 */
	getDataURL() {
		if (this.content && this.mimeType) {
			return `data:${this.mimeType};base64,${this.content}`;
		}
		return "";
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for asset information
	 */
	toHTML() {
		const stats = /** @type {any} */ (this.getStatistics());

		return html`
			<div class="asset-entity" data-type="${this.isImage() ? "image" : "file"}">
				<h3>${this.path}</h3>
				<div class="asset-meta">
					<span class="asset-type">${this.mimeType || "unknown"}</span>
					<span class="asset-size">${stats.sizeFormatted}</span>
					${this.width && this.height ? html`<span class="asset-dimensions">${this.width}×${this.height}</span>` : ""}
				</div>

				${
					this.isImage() && this.content
						? html`
					<div class="asset-preview">
						<img src="${this.getDataURL()}" alt="${this.path}" style="max-width: 200px; max-height: 200px;">
					</div>
				`
						: ""
				}

				<div class="asset-stats">
					<div class="stat"><strong>References:</strong> ${stats.referenceCount}</div>
					<div class="stat"><strong>Contexts:</strong> ${stats.contextCount}</div>
				</div>

				${
					this.contexts.length > 0
						? html`
					<div class="asset-contexts">
						<h4>Used In</h4>
						${this.contexts.map((context) => html`<span class="context-tag">${context}</span>`).join(" ")}
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for asset information
	 */
	toMarkdown() {
		const stats = /** @type {any} */ (this.getStatistics());

		let output = `### ${this.path}\n\n`;
		output += `**Type:** ${this.mimeType || "unknown"}\n`;
		output += `**Size:** ${stats.sizeFormatted}\n`;

		if (this.width && this.height) {
			output += `**Dimensions:** ${this.width}×${this.height}\n`;
		}

		output += `**References:** ${stats.referenceCount}\n`;
		output += `**Contexts:** ${stats.contextCount}\n\n`;

		if (this.contexts.length > 0) {
			output += `**Used in:** ${this.contexts.join(", ")}\n\n`;
		}

		if (this.isImage() && this.content) {
			output += `![${this.path}](${this.getDataURL()})\n\n`;
		}

		return output;
	}
}
