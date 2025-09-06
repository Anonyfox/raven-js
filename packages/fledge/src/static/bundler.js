/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ESBuild integration for in-memory JavaScript bundling.
 *
 * Builds JavaScript bundles with sourcemaps using ESBuild API,
 * keeping all artifacts in memory until final write phase.
 */

import { build } from "esbuild";
import { BundleResource } from "./resource/bundle-resource.js";

/**
 * Build all bundles from configuration
 * @param {Record<string, string>} bundlesConfig - Mount path to source file mapping
 * @param {URL} baseUrl - Base URL for bundle resolution
 * @returns {Promise<Map<string, BundleResource>>} Map of mount paths to bundle resources
 * @throws {Error} If any bundle build fails
 */
export async function buildBundles(bundlesConfig, baseUrl) {
	const bundleResources = new Map();

	for (const [mountPath, sourcePath] of Object.entries(bundlesConfig)) {
		const resource = await buildBundle(mountPath, sourcePath, baseUrl);
		bundleResources.set(mountPath, resource);
	}

	return bundleResources;
}

/**
 * Build single bundle with ESBuild
 * @param {string} mountPath - Mount path for bundle (e.g., "/app.js")
 * @param {string} sourcePath - Source file path to bundle
 * @param {URL} baseUrl - Base URL for bundle resolution
 * @returns {Promise<BundleResource>} Bundle resource instance
 * @throws {Error} If bundle build fails
 */
export async function buildBundle(mountPath, sourcePath, baseUrl) {
	try {
		// Extract filename from mount path for proper sourcemap naming
		const bundleFilename = mountPath.split("/").pop();

		const buildResult = await build({
			entryPoints: [sourcePath],
			bundle: true,
			minify: true,
			format: "esm",
			target: "es2022",
			platform: "browser",
			write: false, // Keep in memory
			outfile: bundleFilename, // Use actual bundle filename
			sourcemap: "external", // Generate separate .map files
			metafile: false, // Reduce overhead
			treeShaking: true,
			legalComments: "none",
		});

		// Extract bundle and sourcemap from build result
		const bundleFile = buildResult.outputFiles.find((file) =>
			file.path.endsWith(".js"),
		);
		const sourcemapFile = buildResult.outputFiles.find((file) =>
			file.path.endsWith(".js.map"),
		);

		if (!bundleFile) {
			throw new Error(`No bundle output found for ${sourcePath}`);
		}

		// Create bundle URL
		const bundleUrl = new URL(mountPath, baseUrl);

		// Create BundleResource instance with external sourcemap
		return new BundleResource(
			bundleFile.contents.slice().buffer,
			sourcemapFile ? sourcemapFile.contents.slice().buffer : null,
			bundleUrl,
			baseUrl,
		);
	} catch (error) {
		const err = /** @type {any} */ (error);
		throw new Error(
			`Failed to build bundle ${mountPath} from ${sourcePath}: ${err.message}`,
		);
	}
}

/**
 * Validate bundle configuration
 * @param {Record<string, string>} bundlesConfig - Bundle configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateBundleConfig(bundlesConfig) {
	for (const [mountPath, sourcePath] of Object.entries(bundlesConfig)) {
		// Validate mount path format
		if (!mountPath.startsWith("/")) {
			throw new Error(`Bundle mount path must start with '/': ${mountPath}`);
		}

		if (!mountPath.endsWith(".js")) {
			throw new Error(`Bundle mount path must end with '.js': ${mountPath}`);
		}

		// Validate source path exists (basic string check)
		if (typeof sourcePath !== "string" || sourcePath.trim() === "") {
			throw new Error(
				`Bundle source path must be non-empty string: ${sourcePath}`,
			);
		}

		// Validate source path format
		if (!sourcePath.endsWith(".js") && !sourcePath.endsWith(".mjs")) {
			throw new Error(
				`Bundle source path must be JavaScript file: ${sourcePath}`,
			);
		}
	}
}
