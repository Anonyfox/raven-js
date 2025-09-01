/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Script bundler for executable generation.
 *
 * Orchestrates ESBuild bundling, asset embedding, and executable generation
 * using string concatenation approach compatible with Wings middleware.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

/**
 * Script bundler with asset embedding and executable generation
 */
export class Bundler {
	/** @type {import("./config/config.js").ScriptConfig} Validated configuration */
	#config;

	/** @type {string | null} Generated executable content */
	#executable = null;

	/** @type {Record<string, string>} All asset content (files + built bundles) */
	#assetContent = {};

	/** @type {boolean} Track bundling state */
	#isBundled = false;

	/** @type {{startTime: number, endTime: number, totalTime: number, bundleSize: number, assetCount: number}} Bundle statistics */
	#statistics = {
		startTime: 0,
		endTime: 0,
		totalTime: 0,
		bundleSize: 0,
		assetCount: 0,
	};

	/**
	 * Create bundler instance
	 * @param {import("./config/config.js").ScriptConfig} config - Script configuration
	 */
	constructor(config) {
		this.#config = config;
	}

	/**
	 * Generate executable script
	 * @returns {Promise<string>} Complete executable content
	 * @throws {Error} If bundling fails
	 */
	async generate() {
		if (this.#isBundled) {
			throw new Error("Bundler has already generated executable");
		}

		this.#statistics.startTime = Date.now();

		try {
			// Core bundling steps
			const shebang = this.#generateShebang();
			const banner = this.#generateBanner();
			const envCode = this.#generateEnvironmentCode();

			// Build client bundles first, then embed all assets together
			await this.#buildClientBundles();
			const assetCode = await this.#generateAssetCode();
			const serverCode = await this.#generateServerBundle();

			// Assemble final executable
			this.#executable = [shebang, banner, envCode, assetCode, serverCode]
				.filter(Boolean)
				.join("\n\n");

			this.#statistics.endTime = Date.now();
			this.#statistics.totalTime =
				this.#statistics.endTime - this.#statistics.startTime;
			this.#statistics.bundleSize = this.#executable.length;
			this.#isBundled = true;

			return this.#executable;
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(`Script bundling failed: ${err.message}`);
		}
	}

	/**
	 * Get bundling statistics
	 * @returns {{startTime: number, endTime: number, totalTime: number, bundleSize: number, assetCount: number}} Statistics object
	 */
	getStatistics() {
		return { ...this.#statistics };
	}

	/**
	 * Check if bundling has been completed
	 * @returns {boolean} True if bundled
	 */
	isBundled() {
		return this.#isBundled;
	}

	/**
	 * Generate shebang line with Node.js flags
	 * @returns {string} Shebang line
	 */
	#generateShebang() {
		const flags = this.#config.getNodeFlags();
		const flagString = flags.length > 0 ? ` ${flags.join(" ")}` : "";
		return `#!/usr/bin/env node${flagString}`;
	}

	/**
	 * Generate metadata banner
	 * @returns {string} Banner comment block
	 */
	#generateBanner() {
		const metadata = this.#config.getMetadata();
		return metadata.generateBanner();
	}

	/**
	 * Generate environment variable initialization code
	 * @returns {string} Environment setup code
	 */
	#generateEnvironmentCode() {
		const env = this.#config.getEnvironment();
		return env.generateGlobalCode();
	}

	/**
	 * Generate asset embedding code for all assets (files + built bundles)
	 * @returns {Promise<string>} Asset initialization code
	 */
	async #generateAssetCode() {
		const assets = this.#config.getAssets();
		const assetFiles = assets.getFiles();

		// Load all regular asset files
		for (const filePath of assetFiles) {
			const resolvedPath = resolve(filePath);
			try {
				const content = readFileSync(resolvedPath);

				// Determine if file is text or binary
				if (this.#isTextFile(filePath)) {
					this.#assetContent[filePath] = content.toString("utf8");
				} else {
					this.#assetContent[filePath] = content.toString("base64");
				}
			} catch (error) {
				const err = /** @type {Error} */ (error);
				throw new Error(`Failed to read asset ${filePath}: ${err.message}`);
			}
		}

		// Count total assets (files + bundles)
		this.#statistics.assetCount = Object.keys(this.#assetContent).length;

		if (this.#statistics.assetCount === 0) {
			return "";
		}

		// Generate globalThis.RavenJS.assets initialization
		const assetEntries = Object.entries(this.#assetContent)
			.map(([path, content]) => {
				const isText = this.#isTextFile(path) || path.startsWith("/"); // Bundle paths start with /
				const encodedContent = JSON.stringify(content);
				const metadata = JSON.stringify({
					encoding: isText ? "utf8" : "base64",
					type: this.#getAssetType(path),
				});
				return `  ${JSON.stringify(path)}: { content: ${encodedContent}, meta: ${metadata} }`;
			})
			.join(",\n");

		return [
			"// Asset embedding",
			"globalThis.RavenJS = globalThis.RavenJS || {};",
			"globalThis.RavenJS.assets = {",
			assetEntries,
			"};",
		].join("\n");
	}

	/**
	 * Build client bundles and add them to asset collection
	 * @returns {Promise<void>}
	 */
	async #buildClientBundles() {
		const bundles = this.#config.getBundles();

		for (const [mountPath, sourcePath] of Object.entries(bundles)) {
			const bundleContent = await this.#buildClientBundle(sourcePath);
			// Add built bundle to asset collection for unified embedding
			this.#assetContent[mountPath] = bundleContent;
		}
	}

	/**
	 * Generate main server bundle
	 * @returns {Promise<string>} Server bundle code
	 */
	async #generateServerBundle() {
		const entryPath = this.#config.getEntry();
		const format = this.#config.getFormat();

		try {
			const buildResult = await build({
				entryPoints: [entryPath],
				bundle: true,
				minify: true,
				format: format,
				target: "node22",
				platform: "node",
				write: false,
				outfile: "server.js",
				sourcemap: false,
				metafile: false,
				treeShaking: true,
				legalComments: "none",
				external: [], // Bundle everything for standalone executable
			});

			const serverFile = buildResult.outputFiles.find((file) =>
				file.path.endsWith(".js"),
			);

			if (!serverFile) {
				throw new Error(`No server bundle output found for ${entryPath}`);
			}

			let serverCode = new TextDecoder().decode(serverFile.contents);

			// Strip shebang from bundled code if present
			if (serverCode.startsWith("#!")) {
				serverCode = serverCode.split("\n").slice(1).join("\n");
			}

			return ["// Main server bundle", serverCode].join("\n");
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(
				`Failed to build server bundle from ${entryPath}: ${err.message}`,
			);
		}
	}

	/**
	 * Build client-side bundle
	 * @param {string} sourcePath - Source file path
	 * @returns {Promise<string>} Bundled client code
	 */
	async #buildClientBundle(sourcePath) {
		try {
			const buildResult = await build({
				entryPoints: [sourcePath],
				bundle: true,
				minify: true,
				format: "esm",
				target: "es2022",
				platform: "browser",
				write: false,
				outfile: "client.js",
				sourcemap: false,
				metafile: false,
				treeShaking: true,
				legalComments: "none",
			});

			const clientFile = buildResult.outputFiles.find((file) =>
				file.path.endsWith(".js"),
			);

			if (!clientFile) {
				throw new Error(`No client bundle output found for ${sourcePath}`);
			}

			return new TextDecoder().decode(clientFile.contents);
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(
				`Failed to build client bundle from ${sourcePath}: ${err.message}`,
			);
		}
	}

	/**
	 * Determine if file is text-based
	 * @param {string} filePath - File path to check
	 * @returns {boolean} True if text file
	 */
	#isTextFile(filePath) {
		const textExtensions = [
			".txt",
			".md",
			".json",
			".xml",
			".html",
			".css",
			".js",
			".mjs",
			".ts",
			".tsx",
			".jsx",
			".svg",
			".csv",
			".env",
			".yml",
			".yaml",
			".toml",
			".ini",
			".conf",
			".log",
			".sql",
		];

		return textExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
	}

	/**
	 * Get MIME type for asset
	 * @param {string} filePath - File path
	 * @returns {string} MIME type
	 */
	#getAssetType(filePath) {
		const ext = filePath.toLowerCase().split(".").pop() || "";
		/** @type {Record<string, string>} */
		const mimeTypes = {
			js: "application/javascript",
			mjs: "application/javascript",
			json: "application/json",
			html: "text/html",
			css: "text/css",
			svg: "image/svg+xml",
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
			webp: "image/webp",
			ico: "image/x-icon",
			txt: "text/plain",
			md: "text/markdown",
			xml: "application/xml",
		};

		return mimeTypes[ext] || "application/octet-stream";
	}
}
