/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset registry for in-memory asset management and path rewriting
 *
 * Content-addressable asset registry that manages local image assets,
 * generates deterministic /assets/* URLs, and rewrites HTML img tags
 * with surgical precision. Zero dependencies, maximum performance.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

/**
 * Generate SEO-friendly filename with word deduplication
 * @param {string} originalPath - Original file path (e.g., "media/logo.webp")
 * @param {string} altText - Alt text (e.g., "Beak Logo")
 * @param {string} hash - Content hash for uniqueness
 * @returns {string} SEO-optimized filename (e.g., "beak-logo-4a0046b4.webp")
 */
function generateSeoFilename(originalPath, altText, hash) {
	const extension = extname(originalPath);
	const originalBase = basename(originalPath, extension);

	// Extract words from alt text and original filename
	const altWords = altText
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ") // Replace non-alphanumeric with spaces
		.split(/\s+/)
		.filter((word) => word.length > 0);

	const originalWords = originalBase
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 0);

	// Combine and deduplicate words (preserving alt text order first)
	const allWords = [...altWords, ...originalWords];
	const uniqueWords = [];
	const seen = new Set();

	for (const word of allWords) {
		if (!seen.has(word) && word.length > 1) {
			// Skip single character words
			uniqueWords.push(word);
			seen.add(word);
		}
	}

	// Fallback to original base if no meaningful words extracted
	const slug = uniqueWords.length > 0 ? uniqueWords.join("-") : originalBase;

	// Ensure exactly 8-character hash
	let shortHash = hash.substring(0, 8);
	if (shortHash.length < 8) {
		shortHash = shortHash.padEnd(8, "0");
	}

	return `${slug}-${shortHash}${extension}`;
}

/**
 * @typedef {Object} AssetRegistryEntry
 * @property {string} originalPath - Original path in markdown
 * @property {string} resolvedPath - Full filesystem path
 * @property {string} assetUrl - Generated /assets/* URL
 * @property {string} contentType - MIME type
 * @property {string} filename - Generated filename with hash
 */

/**
 * Asset registry for managing local image assets with content-addressable storage
 *
 * Provides deterministic URL generation, deduplication, and HTML path rewriting
 * for local image assets. Uses content-based hashing to ensure same content
 * gets same URL across builds and eliminates duplicates.
 */
export class AssetRegistry {
	/**
	 * Create new asset registry
	 * @param {Object} [options] - Configuration options
	 * @param {Object} [options.urlBuilder] - URL builder for base path support
	 */
	constructor(options = {}) {
		/** @type {Map<string, AssetRegistryEntry>} */
		this.assets = new Map();

		/** @type {Map<string, string>} */
		this.pathToUrl = new Map(); // originalPath -> assetUrl mapping for fast lookups

		/** @type {Object|null} */
		this.urlBuilder = options.urlBuilder || null;
	}

	/**
	 * Register an image asset in the registry
	 *
	 * Generates content-addressable URL and stores mapping for path rewriting.
	 * Deduplicates identical content automatically.
	 *
	 * @param {Object} asset - Asset metadata from extractor
	 * @param {string} asset.originalPath - Original path in markdown
	 * @param {string} asset.resolvedPath - Full filesystem path
	 * @param {string} asset.contentType - MIME type
	 * @param {string} [asset.altText] - Alt text for SEO filename generation
	 * @returns {string} Generated /assets/* URL
	 *
	 * @example
	 * // Register asset with SEO naming
	 * const url = registry.register({
	 *   originalPath: './images/logo.png',
	 *   resolvedPath: '/project/images/logo.png',
	 *   contentType: 'image/png',
	 *   altText: 'Company Logo'
	 * });
	 * // → '/assets/company-logo-a1b2c3d4.png'
	 */
	register(asset) {
		const { originalPath, resolvedPath, contentType, altText = "" } = asset;

		// Check if already registered
		if (this.pathToUrl.has(originalPath)) {
			return this.pathToUrl.get(originalPath);
		}

		// Generate content-based hash for deduplication
		const content = readFileSync(resolvedPath);
		const hash = createHash("sha256").update(content).digest("hex");

		// Generate SEO-friendly filename with word deduplication
		const filename = generateSeoFilename(originalPath, altText, hash);
		const assetUrl = this.urlBuilder
			? /** @type {any} */ (this.urlBuilder).assetUrl(filename)
			: `/assets/${filename}`;

		// Check if content already exists (deduplication)
		const existingEntry = Array.from(this.assets.values()).find(
			(entry) => entry.filename === filename,
		);

		if (existingEntry) {
			// Reuse existing URL for identical content
			this.pathToUrl.set(originalPath, existingEntry.assetUrl);
			return existingEntry.assetUrl;
		}

		// Create new registry entry
		const entry = {
			originalPath,
			resolvedPath,
			assetUrl,
			contentType,
			filename,
		};

		this.assets.set(assetUrl, entry);
		this.pathToUrl.set(originalPath, assetUrl);

		return assetUrl;
	}

	/**
	 * Get asset entry by URL
	 * @param {string} assetUrl - Asset URL (e.g., '/assets/hash.png')
	 * @returns {AssetRegistryEntry|undefined} Asset entry or undefined
	 */
	getAsset(assetUrl) {
		return this.assets.get(assetUrl);
	}

	/**
	 * Get all registered assets
	 * @returns {AssetRegistryEntry[]} Array of all asset entries
	 */
	getAllAssets() {
		return Array.from(this.assets.values());
	}

	/**
	 * Clear all registered assets
	 */
	clear() {
		this.assets.clear();
		this.pathToUrl.clear();
	}

	/**
	 * Get number of registered assets
	 * @returns {number} Asset count
	 */
	get size() {
		return this.assets.size;
	}

	/**
	 * Rewrite HTML img src attributes to use /assets/* URLs
	 *
	 * Surgical single-pass replacement of local image paths with asset URLs.
	 * Only processes paths that were registered, preserves all other content.
	 *
	 * @param {string} html - HTML content with img tags
	 * @returns {string} HTML with rewritten img src attributes
	 *
	 * @example
	 * // Rewrite HTML
	 * const html = '<img src="./images/logo.png" alt="Logo">';
	 * const rewritten = registry.rewriteImagePaths(html);
	 * // → '<img src="/assets/a1b2c3d4e5f6.png" alt="Logo">'
	 */
	rewriteImagePaths(html) {
		if (!html || typeof html !== "string") {
			return html;
		}

		// If no assets registered, return unchanged
		if (this.pathToUrl.size === 0) {
			return html;
		}

		// Single regex pass to find all img src attributes
		return html.replace(
			/<img\s+([^>]*\s+)?src=["']([^"']+)["']([^>]*)>/gi,
			(match, beforeSrc, srcValue, afterSrc) => {
				// Check if this path has a registered asset URL
				const assetUrl = this.pathToUrl.get(srcValue);

				if (assetUrl) {
					// Replace with asset URL
					const beforeSrcAttr = beforeSrc || "";
					const afterSrcAttr = afterSrc || "";
					return `<img ${beforeSrcAttr}src="${assetUrl}"${afterSrcAttr}>`;
				}

				// No registered asset, return unchanged
				return match;
			},
		);
	}

	/**
	 * Check if a path has been registered
	 * @param {string} originalPath - Original path to check
	 * @returns {boolean} True if path is registered
	 */
	hasPath(originalPath) {
		return this.pathToUrl.has(originalPath);
	}

	/**
	 * Get asset URL for original path
	 * @param {string} originalPath - Original path in markdown
	 * @returns {string|undefined} Asset URL or undefined if not registered
	 */
	getUrlForPath(originalPath) {
		return this.pathToUrl.get(originalPath);
	}

	/**
	 * Generate statistics about registered assets
	 * @returns {Object} Statistics object
	 */
	getStats() {
		const assets = this.getAllAssets();
		const totalSize = assets.reduce((sum, asset) => {
			try {
				const stats = readFileSync(asset.resolvedPath);
				return sum + stats.length;
			} catch {
				return sum;
			}
		}, 0);

		const contentTypes = assets.reduce(
			(/** @type {Record<string, number>} */ counts, asset) => {
				counts[asset.contentType] = (counts[asset.contentType] || 0) + 1;
				return counts;
			},
			/** @type {Record<string, number>} */ ({}),
		);

		return {
			totalAssets: assets.length,
			totalSize,
			contentTypes,
			averageSize:
				assets.length > 0 ? Math.round(totalSize / assets.length) : 0,
		};
	}
}
