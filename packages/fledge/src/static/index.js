/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static site generation module - builds static HTML/CSS/JS sites from applications.
 *
 * This module handles the generation of static websites and single-page applications
 * optimized for edge deployment and CDN distribution.
 */

import { buildBundles, validateBundleConfig } from "./bundler.js";
import { Crawler } from "./crawler.js";

/**
 * @typedef {Object} StaticGenerationOptions
 * @property {string} outputDir - Output directory path
 * @property {boolean} [verbose] - Enable verbose logging
 */

/**
 * @typedef {Object} StaticGenerationResult
 * @property {number} totalFiles - Total number of resources found
 * @property {number} savedFiles - Number of files successfully saved
 * @property {number} totalTime - Total generation time in milliseconds
 * @property {number} resourcesCount - Number of resources crawled
 * @property {number} errorsCount - Number of errors encountered
 * @property {string} outputDir - Absolute path to output directory
 * @property {Array<{url: string, error: string}>} errors - Details of any errors
 * @property {Array<{url: string, path: string}>} [savedPaths] - Saved file details (if verbose)
 */

export { Config } from "./config/config.js";

/**
 * Generate static site from configuration
 * @param {import("./config/config.js").Config} config - Validated configuration
 * @param {StaticGenerationOptions} options - Generation options
 * @returns {Promise<StaticGenerationResult>} Generation results
 * @throws {Error} If static generation fails
 */
export async function generateStaticSite(config, options) {
	const { outputDir, verbose = false } = options;
	const errors = [];
	/** @type {Array<{url: string, path: string}> | undefined} */
	const savedPaths = verbose ? [] : undefined;

	const crawler = new Crawler(config);

	try {
		// Build bundles first if configured
		const bundlesConfig = config.getBundles();
		if (Object.keys(bundlesConfig).length > 0) {
			// Validate bundle configuration
			validateBundleConfig(bundlesConfig);

			// Build all bundles in-memory
			const serverConfig = config.getServer();
			const baseUrl = new URL(
				typeof serverConfig === "string"
					? serverConfig
					: "http://localhost:3000",
			);

			const bundleResources = await buildBundles(bundlesConfig, baseUrl);

			// Pre-populate crawler with bundle resources
			for (const [mountPath, resource] of bundleResources) {
				crawler.addVisitedResource(mountPath, resource);
			}
		}

		// Start crawling
		await crawler.start();
		await crawler.crawl();

		// Get crawled resources
		const resources = crawler.getResources();

		// Save all resources to files
		let savedCount = 0;
		for (const resource of resources) {
			try {
				const savedPath = await resource.saveToFile(
					outputDir,
					config.getBasePath(),
				);

				if (verbose && savedPaths) {
					const url = resource.getUrl();
					savedPaths.push({
						url: url.pathname,
						path: savedPath,
					});
				}
				savedCount++;
			} catch (error) {
				const url = resource.getUrl();
				const errorDetail = {
					url: url.href,
					error: /** @type {Error} */ (error).message,
				};
				errors.push(errorDetail);
			}
		}

		// Get final statistics
		const stats = /** @type {any} */ (crawler.getStatistics());

		await crawler.stop();

		return {
			totalFiles: resources.length,
			savedFiles: savedCount,
			totalTime: stats.totalTime,
			resourcesCount: stats.resourcesCount,
			errorsCount: errors.length,
			outputDir,
			errors,
			...(savedPaths && { savedPaths }),
		};
	} catch (error) {
		await crawler.stop();
		throw error;
	}
}
