/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset entity model - predatory asset management.
 *
 * Ravens collect and encode documentation assets with surgical precision.
 * Handles images, files, and media referenced in documentation with
 * base64 encoding for self-contained documentation graphs.
 */

import { html } from "@raven-js/beak";

/**
 * Asset entity implementation
 *
 * **Represents:** Files referenced in documentation (images, documents, media)
 *
 * **Core Functionality:**
 * - Asset file path tracking
 * - Base64 content encoding for portability
 * - MIME type detection and validation
 * - Asset metadata (size, dimensions for images)
 * - Reference tracking from documentation
 *
 * **Serialization:** Self-contained base64 encoded assets in JSON
 */
export class AssetEntity {
	/**
	 * Create asset entity instance
	 * @param {string} id - Asset identifier
	 * @param {string} path - Asset file path
	 */
	constructor(id, path) {
		// Asset identification
		this.id = id;
		this.path = path;
		this.originalPath = path; // Original path before any processing

		// Asset content
		this.content = ""; // Base64 encoded content
		this.mimeType = "";
		this.encoding = "base64";

		// Asset metadata
		this.fileSize = 0;
		this.lastModified = null;
		this.checksum = ""; // For content integrity

		// Image-specific metadata (if applicable)
		this.width = null;
		this.height = null;
		this.format = null;

		// Reference tracking
		/** @type {string[]} */
		this.referencedBy = []; // Entity IDs that reference this asset
		/** @type {string[]} */
		this.contexts = []; // Context where asset is used (README, JSDoc, etc.)

		// Validation state
		this.isValidated = false;
		this.exists = false;
		/** @type {Array<{type: string, message: string}>} */
		this.validationIssues = [];
	}

	/**
	 * Get asset identifier
	 * @returns {string} Asset ID
	 */
	getId() {
		return this.id;
	}

	/**
	 * Set asset content with base64 encoding
	 * @param {Buffer|string} content - Raw content or base64 string
	 * @param {string} mimeType - MIME type of content
	 */
	setContent(content, mimeType) {
		if (Buffer.isBuffer(content)) {
			this.content = content.toString("base64");
		} else {
			this.content = content;
		}
		this.mimeType = mimeType;
		this.exists = true;
	}

	/**
	 * Set asset metadata
	 * @param {{fileSize?: number, lastModified?: Date, checksum?: string}} metadata - Asset metadata
	 */
	setMetadata(metadata) {
		if (metadata.fileSize !== undefined) {
			this.fileSize = metadata.fileSize;
		}
		if (metadata.lastModified !== undefined) {
			this.lastModified = metadata.lastModified;
		}
		if (metadata.checksum !== undefined) {
			this.checksum = metadata.checksum;
		}
	}

	/**
	 * Set image-specific metadata
	 * @param {{width?: number, height?: number, format?: string}} imageData - Image metadata
	 */
	setImageMetadata(imageData) {
		if (imageData.width !== undefined) {
			this.width = imageData.width;
		}
		if (imageData.height !== undefined) {
			this.height = imageData.height;
		}
		if (imageData.format !== undefined) {
			this.format = imageData.format;
		}
	}

	/**
	 * Add reference to this asset
	 * @param {string} entityId - Entity that references this asset
	 * @param {string} context - Context of reference (README, JSDoc, etc.)
	 */
	addReference(entityId, context = "unknown") {
		if (!this.referencedBy.includes(entityId)) {
			this.referencedBy.push(entityId);
		}
		if (!this.contexts.includes(context)) {
			this.contexts.push(context);
		}
	}

	/**
	 * Get asset file extension
	 * @returns {string} File extension (without dot)
	 */
	getFileExtension() {
		const match = this.path.match(/\.([^.]+)$/);
		return match ? match[1].toLowerCase() : "";
	}

	/**
	 * Check if asset is an image
	 * @returns {boolean} True if asset is an image
	 */
	isImage() {
		const imageTypes = [
			"jpg",
			"jpeg",
			"png",
			"gif",
			"webp",
			"svg",
			"bmp",
			"ico",
		];
		return imageTypes.includes(this.getFileExtension());
	}

	/**
	 * Check if asset is a document
	 * @returns {boolean} True if asset is a document
	 */
	isDocument() {
		const docTypes = ["pdf", "doc", "docx", "txt", "md", "rtf"];
		return docTypes.includes(this.getFileExtension());
	}

	/**
	 * Get data URL for embedding
	 * @returns {string} Data URL for direct embedding in HTML
	 */
	getDataURL() {
		if (!this.content || !this.mimeType) {
			return "";
		}
		return `data:${this.mimeType};base64,${this.content}`;
	}

	/**
	 * Get human-readable file size
	 * @returns {string} Formatted file size
	 */
	getFormattedSize() {
		if (this.fileSize === 0) return "0 B";

		const units = ["B", "KB", "MB", "GB"];
		let size = this.fileSize;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)} ${units[unitIndex]}`;
	}

	/**
	 * Validate asset configuration
	 */
	validate() {
		this.validationIssues = [];

		// Validate required fields
		if (!this.id || this.id.length === 0) {
			this.validationIssues.push({
				type: "missing_id",
				message: "Asset ID is missing or empty",
			});
		}

		if (!this.path || this.path.length === 0) {
			this.validationIssues.push({
				type: "missing_path",
				message: "Asset path is missing or empty",
			});
		}

		// Validate content if asset should exist
		if (this.exists && (!this.content || this.content.length === 0)) {
			this.validationIssues.push({
				type: "missing_content",
				message: "Asset marked as existing but has no content",
			});
		}

		// Validate MIME type consistency
		if (this.mimeType && this.exists) {
			this.validateMimeType();
		}

		// Validate image metadata consistency
		if (this.isImage() && this.width !== null && this.height !== null) {
			if (this.width <= 0 || this.height <= 0) {
				this.validationIssues.push({
					type: "invalid_dimensions",
					message: "Image dimensions must be positive numbers",
				});
			}
		}

		this.isValidated = this.validationIssues.length === 0;
	}

	/**
	 * Validate MIME type consistency with file extension
	 */
	validateMimeType() {
		const extension = this.getFileExtension();
		/** @type {Record<string, string>} */
		const expectedMimeTypes = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
			pdf: "application/pdf",
			txt: "text/plain",
			md: "text/markdown",
		};

		const expected = expectedMimeTypes[extension];
		if (expected && this.mimeType !== expected) {
			this.validationIssues.push({
				type: "mime_type_mismatch",
				message: `MIME type '${this.mimeType}' doesn't match file extension '${extension}' (expected '${expected}')`,
			});
		}
	}

	/**
	 * Check if asset is valid
	 * @returns {boolean} True if asset is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Get asset statistics
	 * @returns {{referenceCount: number, contextCount: number, sizeFormatted: string}} Asset statistics
	 */
	getStatistics() {
		return {
			referenceCount: this.referencedBy.length,
			contextCount: this.contexts.length,
			sizeFormatted: this.getFormattedSize(),
		};
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Asset-specific serializable data
	 */
	getSerializableData() {
		return {
			id: this.id,
			path: this.path,
			originalPath: this.originalPath,
			content: this.content,
			mimeType: this.mimeType,
			encoding: this.encoding,
			fileSize: this.fileSize,
			lastModified: this.lastModified,
			checksum: this.checksum,
			width: this.width,
			height: this.height,
			format: this.format,
			referencedBy: this.referencedBy,
			contexts: this.contexts,
			exists: this.exists,
			statistics: this.getStatistics(),
			validationIssues: this.validationIssues,
		};
	}

	/**
	 * Serialize asset to JSON format
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			__type: "asset",
			__data: this.getSerializableData(),
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for asset information
	 */
	toHTML() {
		const stats = this.getStatistics();

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
		const stats = this.getStatistics();

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
