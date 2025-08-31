/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static site generation from live router instance
 *
 * Transforms the live documentation server into static HTML files by invoking
 * the Wings router directly without HTTP overhead. Generates complete static
 * sites with all assets, following the index.html pattern for clean URLs.
 */

import fs from "node:fs";
import path from "node:path";
import { Context } from "@raven-js/wings";
import { extractSitemapData } from "./server/data/sitemap.js";
import { createDocumentationServer } from "./server/index.js";

/**
 * Generate static documentation site from package
 * @param {string} packagePath - Path to package to document
 * @param {string} outputPath - Destination directory for static files
 * @param {Object} options - Generation options
 * @param {string} [options.domain] - Base domain for canonical URLs
 * @param {string} [options.basePath] - Base path for URL prefixing (default: "/")
 * @returns {Promise<{totalFiles: number, totalBytes: number, generatedAt: string}>} Generation statistics
 */
export async function generateStaticSite(
	packagePath,
	outputPath,
	options = {},
) {
	const { domain, basePath = "/" } = options;

	// Normalize base path - ensure it starts and ends with /
	const normalizedBasePath =
		basePath === "/" ? "/" : `/${basePath.replace(/^\/+|\/+$/g, "")}/`;

	// Validate inputs
	if (!packagePath || typeof packagePath !== "string") {
		throw new Error("packagePath is required and must be a string");
	}
	if (!outputPath || typeof outputPath !== "string") {
		throw new Error("outputPath is required and must be a string");
	}

	// Create documentation server instance (router + package data)
	const server = createDocumentationServer(packagePath, {
		domain,
		basePath: normalizedBasePath,
	});
	const packageInstance = /** @type {any} */ (server).packageInstance;
	const router = /** @type {any} */ (server).router;
	const assetRegistry = /** @type {any} */ (server).assetRegistry;
	const urlBuilder = /** @type {any} */ (server).urlBuilder;

	// Extract all URLs from sitemap
	const baseUrl = domain ? `https://${domain}` : "https://docs.example.com";
	const sitemapData = extractSitemapData(packageInstance, baseUrl, {
		urlBuilder,
	});

	// Prepare output directory
	await fs.promises.rm(outputPath, { recursive: true, force: true });
	await fs.promises.mkdir(outputPath, { recursive: true });

	let totalFiles = 0;
	let totalBytes = 0;

	// Generate HTML files for each URL
	for (const urlEntry of sitemapData.urls) {
		const urlPath = new URL(urlEntry.loc).pathname;

		// Create Context instance for this URL
		const urlObj = new URL(urlPath, "http://localhost");
		const context = new Context("GET", urlObj, new Headers());

		// Invoke router directly to get rendered response
		await router.handleRequest(context);

		if (context.responseStatusCode === 200 && context.responseBody) {
			// Strip base path from URL path for file system conversion
			// e.g., "/beak/modules/" becomes "/modules/"
			let fileUrlPath = urlPath;
			if (
				normalizedBasePath !== "/" &&
				urlPath.startsWith(normalizedBasePath)
			) {
				fileUrlPath = urlPath.slice(normalizedBasePath.length - 1); // Keep leading slash
			}

			// Convert URL path to file system path
			const filePath = urlPathToFilePath(fileUrlPath, outputPath);

			// Ensure directory exists
			const dir = path.dirname(filePath);
			await fs.promises.mkdir(dir, { recursive: true });

			// Write HTML file
			await fs.promises.writeFile(filePath, context.responseBody, "utf8");

			totalFiles++;
			totalBytes += Buffer.byteLength(context.responseBody, "utf8");
		}
	}

	// Generate sitemap.xml separately
	const sitemapPath =
		normalizedBasePath === "/"
			? "/sitemap.xml"
			: `${normalizedBasePath}sitemap.xml`;
	const sitemapUrl = new URL(sitemapPath, "http://localhost");
	const sitemapContext = new Context("GET", sitemapUrl, new Headers());
	await router.handleRequest(sitemapContext);

	if (
		sitemapContext.responseStatusCode === 200 &&
		sitemapContext.responseBody
	) {
		const sitemapPath = path.join(outputPath, "sitemap.xml");
		await fs.promises.writeFile(
			sitemapPath,
			sitemapContext.responseBody,
			"utf8",
		);
		totalFiles++;
		totalBytes += Buffer.byteLength(sitemapContext.responseBody, "utf8");
	}

	// Copy static assets
	const assetsStats = await copyStaticAssets(outputPath);
	totalFiles += assetsStats.files;
	totalBytes += assetsStats.bytes;

	// Copy image assets from asset registry
	const imageAssetsStats = await copyImageAssets(assetRegistry, outputPath);
	totalFiles += imageAssetsStats.files;
	totalBytes += imageAssetsStats.bytes;

	return {
		totalFiles,
		totalBytes,
		generatedAt: new Date().toISOString(),
	};
}

/**
 * Convert URL path to file system path following index.html pattern
 * @param {string} urlPath - URL path (e.g., "/modules/utils/")
 * @param {string} outputPath - Base output directory
 * @returns {string} File system path with index.html
 */
function urlPathToFilePath(urlPath, outputPath) {
	// Handle root path
	if (urlPath === "/") {
		return path.join(outputPath, "index.html");
	}

	// Remove leading and trailing slashes
	const cleanPath = urlPath.replace(/^\/|\/$/g, "");

	// Create nested directory structure with index.html
	return path.join(outputPath, cleanPath, "index.html");
}

/**
 * Copy image assets from asset registry to output directory
 * @param {import('./assets/registry.js').AssetRegistry} assetRegistry - Asset registry
 * @param {string} outputPath - Destination directory
 * @returns {Promise<{files: number, bytes: number}>} Copy statistics
 */
async function copyImageAssets(assetRegistry, outputPath) {
	let files = 0;
	let bytes = 0;

	if (!assetRegistry || assetRegistry.size === 0) {
		return { files, bytes };
	}

	try {
		// Ensure assets directory exists
		const assetsDir = path.join(outputPath, "assets");
		await fs.promises.mkdir(assetsDir, { recursive: true });

		// Copy all registered assets
		const assets = assetRegistry.getAllAssets();

		for (const asset of assets) {
			const destPath = path.join(outputPath, asset.assetUrl.substring(1)); // Remove leading /

			try {
				// Copy file from resolved path to destination
				await fs.promises.copyFile(asset.resolvedPath, destPath);

				// Get file size for statistics
				const stats = await fs.promises.stat(destPath);
				files++;
				bytes += stats.size;
			} catch (copyError) {
				console.warn(
					`Warning: Could not copy image asset ${asset.originalPath}: ${copyError.message}`,
				);
			}
		}
	} catch (error) {
		console.warn(
			`Warning: Could not create assets directory: ${error.message}`,
		);
	}

	return { files, bytes };
}

/**
 * Copy static assets from glean package to output directory
 * @param {string} outputPath - Destination directory
 * @returns {Promise<{files: number, bytes: number}>} Copy statistics
 */
async function copyStaticAssets(outputPath) {
	// Calculate path to static directory in glean package
	const currentFileUrl = import.meta.url;
	const currentFilePath = new URL(currentFileUrl).pathname;
	const currentDir = path.dirname(currentFilePath);
	const staticDir = path.resolve(currentDir, "../static");

	let files = 0;
	let bytes = 0;

	try {
		// Check if static directory exists
		await fs.promises.access(staticDir);

		// Read all files in static directory
		const entries = await fs.promises.readdir(staticDir, {
			withFileTypes: true,
		});

		for (const entry of entries) {
			if (entry.isFile()) {
				const sourcePath = path.join(staticDir, entry.name);
				const destPath = path.join(outputPath, entry.name);

				// Copy file
				await fs.promises.copyFile(sourcePath, destPath);

				// Get file size for statistics
				const stats = await fs.promises.stat(destPath);
				files++;
				bytes += stats.size;
			}
		}
	} catch (error) {
		// Static directory doesn't exist or other error - continue without assets
		console.warn(
			`Warning: Could not copy static assets from ${staticDir}: ${error.message}`,
		);
	}

	return { files, bytes };
}
