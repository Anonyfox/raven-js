/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset collection and discovery for documentation generation.
 *
 * Ravens track every resource in the ecosystem with predatory precision.
 * This module discovers asset references in markdown and JSDoc content,
 * validates file paths, and creates AssetEntity instances for static generation.
 */

import { access, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { AssetEntity } from "../models/asset-entity.js";

/**
 * Discover assets referenced in documentation content
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {string} packagePath - Package root path for relative resolution
 * @returns {Promise<import('../models/asset-entity.js').AssetEntity[]>} Array of discovered assets
 */
export async function discoverDocumentationAssets(graph, packagePath) {
	const discoveredAssets = [];
	const assetRegistry = new Map(); // Prevent duplicates

	// Scan README/markdown content for asset references
	const readmeAssets = await scanReadmeAssets(graph, packagePath);
	for (const asset of readmeAssets) {
		if (!assetRegistry.has(asset.path)) {
			assetRegistry.set(asset.path, asset);
			discoveredAssets.push(asset);
		}
	}

	// Scan JSDoc content for asset references
	const jsdocAssets = await scanJSDocAssets(graph, packagePath);
	for (const asset of jsdocAssets) {
		if (!assetRegistry.has(asset.path)) {
			assetRegistry.set(asset.path, asset);
			discoveredAssets.push(asset);
		}
	}

	// Step 2: Resolve and validate asset paths
	await resolveAndValidateAssets(discoveredAssets, packagePath);

	return discoveredAssets;
}

/**
 * Scan README content for asset references
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {string} packagePath - Package root path
 * @returns {Promise<import('../models/asset-entity.js').AssetEntity[]>} Array of assets from README files
 */
async function scanReadmeAssets(graph, packagePath) {
	const assets = [];

	// Get content entities (README files)
	const contentEntities = getEntitiesIterable(graph.content);

	for (const content of contentEntities) {
		if (!content.content) continue;

		const contentAssets = extractMarkdownAssets(
			content.content,
			content.path,
			packagePath,
		);
		assets.push(...contentAssets);
	}

	return assets;
}

/**
 * Scan JSDoc content for asset references
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {string} packagePath - Package root path
 * @returns {Promise<import('../models/asset-entity.js').AssetEntity[]>} Array of assets from JSDoc
 */
async function scanJSDocAssets(graph, packagePath) {
	const assets = [];

	// Get all entities with JSDoc
	const entities = getEntitiesIterable(graph.entities);

	for (const entity of entities) {
		if (typeof entity.getAllJSDocTags !== "function") continue;

		const jsdocTags = entity.getAllJSDocTags();
		if (!jsdocTags || jsdocTags.length === 0) continue;

		// Extract assets from JSDoc tags
		const entityAssets = extractJSDocAssets(
			jsdocTags,
			entity.location?.file || "",
			packagePath,
		);
		assets.push(...entityAssets);
	}

	return assets;
}

/**
 * Extract asset references from markdown content
 * @param {string} markdown - Markdown content
 * @param {string} sourcePath - Path of the source file containing the markdown
 * @param {string} _packagePath - Package root path (unused in Step 1 - will be used in Step 2)
 * @returns {import('../models/asset-entity.js').AssetEntity[]} Array of discovered assets
 */
function extractMarkdownAssets(markdown, sourcePath, _packagePath) {
	const assets = [];

	// Pattern for markdown images: ![alt](path) or ![alt](path "title")
	const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

	// Use matchAll for safer iteration
	const imageMatches = [...markdown.matchAll(imagePattern)];
	for (const match of imageMatches) {
		const altText = match[1];
		const assetPath = match[2].trim();

		// Skip URLs (external assets)
		if (isUrl(assetPath)) continue;

		// Create asset entity
		const assetId = generateAssetId(assetPath, sourcePath);
		const asset = new AssetEntity(assetId, assetPath, assetPath);
		asset.setDirectory(sourcePath);
		asset.contexts.push(sourcePath);

		// Store metadata
		asset.altText = altText;
		asset.referenceType = "image";
		asset.sourceFile = sourcePath;

		assets.push(asset);
	}

	// Pattern for markdown links to local files: [text](./path/file.ext)
	// Use negative lookbehind to exclude image syntax ![text](path)
	const linkPattern = /(?<!!)\[([^\]]*)\]\(([^)]+?)\)/g;

	// Use matchAll for safer iteration
	const linkMatches = [...markdown.matchAll(linkPattern)];
	for (const match of linkMatches) {
		const linkText = match[1];
		const assetPath = match[2].trim();

		// Skip URLs and anchors
		if (isUrl(assetPath) || assetPath.startsWith("#")) continue;

		// Only include if it looks like a file (has extension)
		if (!hasFileExtension(assetPath)) continue;

		// Create asset entity for file reference
		const assetId = generateAssetId(assetPath, sourcePath);
		const asset = new AssetEntity(assetId, assetPath, assetPath);
		asset.setDirectory(sourcePath);
		asset.contexts.push(sourcePath);

		// Store metadata
		asset.linkText = linkText;
		asset.referenceType = "file";
		asset.sourceFile = sourcePath;

		assets.push(asset);
	}

	// Pattern for reference-style images: ![alt][ref] with [ref]: path
	const refImagePattern = /!\[([^\]]*)\]\[([^\]]+)\]/g;
	const refDefinitionPattern = /^\s*\[([^\]]+)\]:\s*(.+)$/gm;

	// Build reference map using matchAll for safer iteration
	const references = new Map();
	const refDefinitionMatches = [...markdown.matchAll(refDefinitionPattern)];
	for (const refMatch of refDefinitionMatches) {
		references.set(refMatch[1], refMatch[2].trim());
	}

	// Process reference-style images using matchAll for safer iteration
	const refImageMatches = [...markdown.matchAll(refImagePattern)];
	for (const match of refImageMatches) {
		const altText = match[1];
		const refId = match[2];
		const assetPath = references.get(refId);

		if (!assetPath || isUrl(assetPath)) continue;

		const assetId = generateAssetId(assetPath, sourcePath);
		const asset = new AssetEntity(assetId, assetPath, assetPath);
		asset.setDirectory(sourcePath);
		asset.contexts.push(sourcePath);

		asset.altText = altText;
		asset.referenceType = "image-ref";
		asset.sourceFile = sourcePath;

		assets.push(asset);
	}

	return assets;
}

/**
 * Extract asset references from JSDoc tags
 * @param {any[]} jsdocTags - Array of JSDoc tag instances
 * @param {string} sourcePath - Path of the source file
 * @param {string} packagePath - Package root path
 * @returns {import('../models/asset-entity.js').AssetEntity[]} Array of discovered assets
 */
function extractJSDocAssets(jsdocTags, sourcePath, packagePath) {
	const assets = [];

	for (const tag of jsdocTags) {
		// Check @example tags for asset references
		if (tag.tagType === "example") {
			const exampleContent =
				/** @type {any} */ (tag).content ||
				/** @type {any} */ (tag).description ||
				"";
			const exampleAssets = extractMarkdownAssets(
				exampleContent,
				sourcePath,
				packagePath,
			);
			assets.push(...exampleAssets);
		}

		// Check @see tags for local file references
		if (tag.tagType === "see") {
			const reference = /** @type {any} */ (tag).reference || "";

			// Skip URLs and module references
			if (
				isUrl(reference) ||
				reference.startsWith("module:") ||
				reference.includes("{@link")
			) {
				continue;
			}

			// Check if it looks like a local file path
			if (hasFileExtension(reference)) {
				const assetId = generateAssetId(reference, sourcePath);
				const asset = new AssetEntity(assetId, reference, reference);
				asset.setDirectory(sourcePath);
				asset.contexts.push(sourcePath);

				asset.referenceType = "jsdoc-see";
				asset.sourceFile = sourcePath;

				assets.push(asset);
			}
		}

		// Check description fields for markdown-style asset references
		const description = /** @type {any} */ (tag).description || "";
		if (description) {
			const descriptionAssets = extractMarkdownAssets(
				description,
				sourcePath,
				packagePath,
			);
			assets.push(...descriptionAssets);
		}
	}

	return assets;
}

/**
 * Resolve and validate discovered asset paths
 * @param {import('../models/asset-entity.js').AssetEntity[]} assets - Array of discovered assets
 * @param {string} packagePath - Package root path for resolution
 * @returns {Promise<void>} Resolves when all assets are validated
 */
async function resolveAndValidateAssets(assets, packagePath) {
	// Process assets in parallel for performance
	await Promise.all(
		assets.map(async (asset) => {
			try {
				// Step 1: Resolve relative paths to absolute paths
				const resolvedPath = resolveAssetPath(
					asset.path,
					asset.sourceFile,
					packagePath,
				);
				asset.resolvedPath = resolvedPath;

				// Step 2: Check file existence and gather enhanced metadata
				const validationResult = await validateAssetFile(resolvedPath);

				// Step 3: Update asset with validation results and enhanced metadata
				if (validationResult.exists) {
					asset.isValidated = true;
					asset.setMetadata({
						size: validationResult.size,
						lastModified: validationResult.lastModified,
						type: validationResult.mimeType,
					});

					// Enhanced metadata
					asset.mimeType = validationResult.mimeType;
					asset.width = validationResult.width ?? null;
					asset.height = validationResult.height ?? null;
					asset.contentCategory = validationResult.contentCategory;

					// Mark asset as validated
					asset.validationIssues = [];
				} else {
					asset.isValidated = false;
					asset.validationIssues.push({
						type: "file_not_found",
						message: `Asset file not found: ${resolvedPath}`,
						path: resolvedPath,
					});
				}
			} catch (error) {
				// Handle validation errors gracefully
				asset.isValidated = false;
				asset.validationIssues.push({
					type: "validation_error",
					message: `Failed to validate asset: ${error.message}`,
					error: error.message,
				});
			}
		}),
	);
}

/**
 * Resolve asset path relative to source file and package root
 * @param {string} assetPath - Original asset path from markdown/JSDoc
 * @param {string} sourceFile - Source file containing the asset reference
 * @param {string} packagePath - Package root path
 * @returns {string} Resolved absolute path
 */
function resolveAssetPath(assetPath, sourceFile, packagePath) {
	// If already absolute, return as-is
	if (isAbsolute(assetPath)) {
		return assetPath;
	}

	// Resolve relative to source file directory
	const sourceDir = dirname(resolve(packagePath, sourceFile));
	const resolvedPath = resolve(sourceDir, assetPath);

	return resolvedPath;
}

/**
 * Validate asset file existence and gather enhanced metadata
 * @param {string} filePath - Absolute path to asset file
 * @returns {Promise<{exists: boolean, size?: number, lastModified?: Date, mimeType?: string, width?: number, height?: number, contentCategory?: string}>} Enhanced validation result
 */
async function validateAssetFile(filePath) {
	try {
		// Check file accessibility
		await access(filePath);

		// Get file statistics
		const stats = await stat(filePath);

		// Extract enhanced metadata
		const mimeType = detectMimeType(filePath);
		const contentCategory = categorizeContent(mimeType);
		const imageDimensions = await extractImageDimensions(filePath, mimeType);

		return {
			exists: true,
			size: stats.size,
			lastModified: stats.mtime,
			mimeType,
			contentCategory,
			width: imageDimensions?.width,
			height: imageDimensions?.height,
		};
	} catch (_error) {
		// File doesn't exist or is not accessible
		return {
			exists: false,
		};
	}
}

/**
 * Detect MIME type based on file extension
 * @param {string} filePath - File path
 * @returns {string} MIME type
 */
function detectMimeType(filePath) {
	const ext = extname(filePath).toLowerCase();

	// MIME type mapping for common file types
	const mimeTypes = {
		// Images
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".webp": "image/webp",
		".bmp": "image/bmp",
		".ico": "image/x-icon",
		".tiff": "image/tiff",
		".tif": "image/tiff",

		// Documents
		".pdf": "application/pdf",
		".doc": "application/msword",
		".docx":
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls": "application/vnd.ms-excel",
		".xlsx":
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt": "application/vnd.ms-powerpoint",
		".pptx":
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".txt": "text/plain",
		".rtf": "application/rtf",
		".odt": "application/vnd.oasis.opendocument.text",
		".ods": "application/vnd.oasis.opendocument.spreadsheet",
		".odp": "application/vnd.oasis.opendocument.presentation",

		// Web documents
		".html": "text/html",
		".htm": "text/html",
		".css": "text/css",
		".js": "text/javascript",
		".mjs": "text/javascript",
		".json": "application/json",
		".xml": "application/xml",
		".md": "text/markdown",
		".markdown": "text/markdown",

		// Archives
		".zip": "application/zip",
		".tar": "application/x-tar",
		".gz": "application/gzip",
		".rar": "application/vnd.rar",
		".7z": "application/x-7z-compressed",

		// Audio
		".mp3": "audio/mpeg",
		".wav": "audio/wav",
		".ogg": "audio/ogg",
		".flac": "audio/flac",
		".m4a": "audio/mp4",

		// Video
		".mp4": "video/mp4",
		".webm": "video/webm",
		".ogv": "video/ogg",
		".avi": "video/x-msvideo",
		".mov": "video/quicktime",
		".wmv": "video/x-ms-wmv",
		".flv": "video/x-flv",
		".mkv": "video/x-matroska",

		// Fonts
		".woff": "font/woff",
		".woff2": "font/woff2",
		".ttf": "font/ttf",
		".otf": "font/otf",
		".eot": "application/vnd.ms-fontobject",
	};

	return /** @type {any} */ (mimeTypes)[ext] || "application/octet-stream";
}

/**
 * Categorize content based on MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} Content category
 */
function categorizeContent(mimeType) {
	if (mimeType.startsWith("image/")) {
		return "image";
	}
	if (mimeType.startsWith("video/")) {
		return "video";
	}
	if (mimeType.startsWith("audio/")) {
		return "audio";
	}
	if (
		mimeType.startsWith("text/") ||
		mimeType === "application/json" ||
		mimeType === "application/xml"
	) {
		return "text";
	}
	if (
		mimeType === "application/pdf" ||
		mimeType.includes("document") ||
		mimeType.includes("spreadsheet") ||
		mimeType.includes("presentation") ||
		mimeType === "application/msword" ||
		mimeType === "application/vnd.ms-excel" ||
		mimeType === "application/vnd.ms-powerpoint"
	) {
		return "document";
	}
	if (
		mimeType.includes("zip") ||
		mimeType.includes("tar") ||
		mimeType.includes("compressed") ||
		mimeType === "application/gzip"
	) {
		return "archive";
	}
	if (
		mimeType.startsWith("font/") ||
		mimeType === "application/vnd.ms-fontobject"
	) {
		return "font";
	}

	return "other";
}

/**
 * Extract image dimensions (width/height) for image files
 * @param {string} filePath - Path to image file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{width: number, height: number}|null>} Image dimensions or null if not an image
 */
async function extractImageDimensions(filePath, mimeType) {
	// Only process image files
	if (!mimeType.startsWith("image/")) {
		return null;
	}

	try {
		// Read file header to extract dimensions
		const buffer = await readFile(filePath);

		// PNG format
		if (mimeType === "image/png") {
			return extractPngDimensions(buffer);
		}

		// JPEG format
		if (mimeType === "image/jpeg") {
			return extractJpegDimensions(buffer);
		}

		// GIF format
		if (mimeType === "image/gif") {
			return extractGifDimensions(buffer);
		}

		// BMP format
		if (mimeType === "image/bmp") {
			return extractBmpDimensions(buffer);
		}

		// WebP format
		if (mimeType === "image/webp") {
			return extractWebpDimensions(buffer);
		}

		// SVG format (text-based)
		if (mimeType === "image/svg+xml") {
			return extractSvgDimensions(buffer);
		}

		// Unsupported image format
		return null;
	} catch (_error) {
		// Error reading file or extracting dimensions
		return null;
	}
}

/**
 * Extract dimensions from PNG file buffer
 * @param {Buffer} buffer - PNG file buffer
 * @returns {{width: number, height: number}|null} PNG dimensions
 */
function extractPngDimensions(buffer) {
	// PNG signature: 89 50 4E 47 0D 0A 1A 0A
	if (
		buffer.length < 24 ||
		!buffer
			.subarray(0, 8)
			.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
	) {
		return null;
	}

	// IHDR chunk starts at offset 8, dimensions at offset 16
	const width = buffer.readUInt32BE(16);
	const height = buffer.readUInt32BE(20);

	return { width, height };
}

/**
 * Extract dimensions from JPEG file buffer
 * @param {Buffer} buffer - JPEG file buffer
 * @returns {{width: number, height: number}|null} JPEG dimensions
 */
function extractJpegDimensions(buffer) {
	// JPEG signature: FF D8
	if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
		return null;
	}

	let offset = 2;

	// Find SOF (Start of Frame) marker
	while (offset < buffer.length - 8) {
		if (buffer[offset] === 0xff) {
			const marker = buffer[offset + 1];

			// SOF0, SOF1, SOF2 markers contain dimensions
			if (marker >= 0xc0 && marker <= 0xc2) {
				const height = buffer.readUInt16BE(offset + 5);
				const width = buffer.readUInt16BE(offset + 7);
				return { width, height };
			}

			// Skip this segment
			const segmentLength = buffer.readUInt16BE(offset + 2);
			offset += 2 + segmentLength;
		} else {
			offset++;
		}
	}

	return null;
}

/**
 * Extract dimensions from GIF file buffer
 * @param {Buffer} buffer - GIF file buffer
 * @returns {{width: number, height: number}|null} GIF dimensions
 */
function extractGifDimensions(buffer) {
	// GIF signature: GIF87a or GIF89a
	if (
		buffer.length < 10 ||
		(!buffer.subarray(0, 6).equals(Buffer.from("GIF87a")) &&
			!buffer.subarray(0, 6).equals(Buffer.from("GIF89a")))
	) {
		return null;
	}

	// Dimensions are at offset 6 (little-endian)
	const width = buffer.readUInt16LE(6);
	const height = buffer.readUInt16LE(8);

	return { width, height };
}

/**
 * Extract dimensions from BMP file buffer
 * @param {Buffer} buffer - BMP file buffer
 * @returns {{width: number, height: number}|null} BMP dimensions
 */
function extractBmpDimensions(buffer) {
	// BMP signature: BM
	if (buffer.length < 30 || buffer[0] !== 0x42 || buffer[1] !== 0x4d) {
		return null;
	}

	// Dimensions are at offset 18 (little-endian)
	const width = buffer.readUInt32LE(18);
	const height = buffer.readUInt32LE(22);

	return { width, height };
}

/**
 * Extract dimensions from WebP file buffer
 * @param {Buffer} buffer - WebP file buffer
 * @returns {{width: number, height: number}|null} WebP dimensions
 */
function extractWebpDimensions(buffer) {
	// WebP signature: RIFF....WEBP
	if (
		buffer.length < 30 ||
		!buffer.subarray(0, 4).equals(Buffer.from("RIFF")) ||
		!buffer.subarray(8, 12).equals(Buffer.from("WEBP"))
	) {
		return null;
	}

	// VP8 format
	if (buffer.subarray(12, 16).equals(Buffer.from("VP8 "))) {
		// Simple VP8 format
		const width = buffer.readUInt16LE(26) & 0x3fff;
		const height = buffer.readUInt16LE(28) & 0x3fff;
		return { width, height };
	}

	// VP8L format
	if (buffer.subarray(12, 16).equals(Buffer.from("VP8L"))) {
		const data = buffer.readUInt32LE(21);
		const width = (data & 0x3fff) + 1;
		const height = ((data >> 14) & 0x3fff) + 1;
		return { width, height };
	}

	return null;
}

/**
 * Extract dimensions from SVG file buffer
 * @param {Buffer} buffer - SVG file buffer
 * @returns {{width: number, height: number}|null} SVG dimensions
 */
function extractSvgDimensions(buffer) {
	try {
		const svgContent = buffer.toString("utf8");

		// Look for width and height attributes in SVG tag
		const svgMatch = svgContent.match(/<svg[^>]*>/);
		if (!svgMatch) return null;

		const svgTag = svgMatch[0];

		// Extract width and height
		const widthMatch = svgTag.match(/width\s*=\s*["']?(\d+(?:\.\d+)?)/);
		const heightMatch = svgTag.match(/height\s*=\s*["']?(\d+(?:\.\d+)?)/);

		if (widthMatch && heightMatch) {
			const width = Number.parseFloat(widthMatch[1]);
			const height = Number.parseFloat(heightMatch[1]);
			return { width, height };
		}

		// Try viewBox as fallback
		const viewBoxMatch = svgTag.match(
			/viewBox\s*=\s*["']?[^"']*?\s+[^"']*?\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/,
		);
		if (viewBoxMatch) {
			const width = Number.parseFloat(viewBoxMatch[1]);
			const height = Number.parseFloat(viewBoxMatch[2]);
			return { width, height };
		}

		return null;
	} catch (_error) {
		return null;
	}
}

/**
 * Check if a string is a URL
 * @param {string} str - String to check
 * @returns {boolean} True if string is a URL
 */
function isUrl(str) {
	return (
		/^https?:\/\//.test(str) || /^ftp:\/\//.test(str) || /^mailto:/.test(str)
	);
}

/**
 * Check if a path has a file extension
 * @param {string} path - Path to check
 * @returns {boolean} True if path has file extension
 */
function hasFileExtension(path) {
	const lastSegment = path.split("/").pop() || "";
	return lastSegment.includes(".") && !lastSegment.endsWith(".");
}

/**
 * Generate unique asset ID
 * @param {string} assetPath - Asset path
 * @param {string} sourcePath - Source file path
 * @returns {string} Unique asset identifier
 */
function generateAssetId(assetPath, sourcePath) {
	// Use path-based ID for uniqueness
	const cleanAssetPath = assetPath.replace(/^\.\//, "").replace(/\//g, "_");
	const cleanSourcePath = sourcePath
		.replace(/\//g, "_")
		.replace(/\.[^.]*$/, "");
	return `asset_${cleanSourcePath}_${cleanAssetPath}`;
}

/**
 * Get iterable from either Map or plain object (compatibility helper)
 * @param {Map<string, any>|Object|undefined|null} entities - Entities container
 * @returns {Iterable<any>} Iterable of entity values
 */
function getEntitiesIterable(entities) {
	// Handle null/undefined cases first
	if (!entities) {
		return [];
	}

	// Check if it's a Map (production DocumentationGraph)
	if (typeof (/** @type {any} */ (entities).values) === "function") {
		return /** @type {any} */ (entities).values();
	}

	// Handle plain object (test mocks)
	if (typeof entities === "object") {
		return Object.values(entities);
	}

	// Fallback for unexpected types
	return [];
}
