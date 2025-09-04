/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Binary bundler for native executable generation.
 *
 * Orchestrates Node.js SEA (Single Executable Applications) protocol with ESBuild bundling,
 * asset embedding, and platform-specific binary generation. Current platform only.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

/**
 * Binary bundler with SEA protocol integration and native executable generation
 */
export class BinaryBundler {
	/** @type {import("./config/config.js").BinaryConfig} Validated configuration */
	#config;

	/** @type {string | null} Generated executable path */
	#executablePath = null;

	/** @type {Record<string, string>} All asset content (files + built bundles) */
	#assetContent = {};

	/** @type {boolean} Track bundling state */
	#isBundled = false;

	/** @type {{startTime: number, endTime: number, totalTime: number, executableSize: number, assetCount: number}} Bundle statistics */
	#statistics = {
		startTime: 0,
		endTime: 0,
		totalTime: 0,
		executableSize: 0,
		assetCount: 0,
	};

	/** @type {string} Temporary SEA config file path */
	#seaConfigPath = "";

	/** @type {string} Temporary SEA blob file path */
	#seaBlobPath = "";

	/** @type {string} Temporary asset index file path */
	#assetIndexPath = "";

	/** @type {string} Temporary bundled server file path */
	#serverBundlePath = "";

	/**
	 * Create bundler instance
	 * @param {import("./config/config.js").BinaryConfig} config - Binary configuration
	 */
	constructor(config) {
		this.#config = config;
	}

	/**
	 * Generate native executable
	 * @param {string} outputDir - Output directory for executable and temp files
	 * @returns {Promise<string>} Path to generated executable
	 * @throws {Error} If bundling fails
	 */
	async generate(outputDir) {
		if (this.#isBundled) {
			throw new Error("Bundler has already generated executable");
		}

		this.#statistics.startTime = Date.now();

		try {
			// Setup temporary file paths
			this.#setupTempPaths(outputDir);

			// Core bundling phases
			await this.#buildClientBundles();
			await this.#generateAssetIndex();
			await this.#generateServerBundle();
			this.#generateSeaConfig();
			await this.#generateSeaBlob();
			await this.#generateExecutable();

			// Finalize statistics
			this.#statistics.endTime = Date.now();
			this.#statistics.totalTime =
				this.#statistics.endTime - this.#statistics.startTime;
			this.#statistics.executableSize = this.#getFileSize(this.#executablePath);
			this.#isBundled = true;

			return /** @type {string} */ (this.#executablePath);
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(`Binary bundling failed: ${err.message}`);
		}
	}

	/**
	 * Get bundling statistics
	 * @returns {{startTime: number, endTime: number, totalTime: number, executableSize: number, assetCount: number}} Statistics object
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
	 * Get path to generated executable
	 * @returns {string | null} Executable path or null if not generated
	 */
	getExecutablePath() {
		return this.#executablePath;
	}

	/**
	 * Setup temporary file paths for SEA generation
	 * @param {string} outputDir - Output directory
	 */
	#setupTempPaths(outputDir) {
		const outputName = this.#config.getOutput();
		this.#executablePath = resolve(outputDir, outputName);
		this.#seaConfigPath = resolve(outputDir, "sea-config.json");
		this.#seaBlobPath = resolve(outputDir, "sea-prep.blob");
		this.#assetIndexPath = resolve(outputDir, "assets.json");
		this.#serverBundlePath = resolve(outputDir, "server.bundle.js");
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
	 * Generate asset index and embed all assets
	 * @returns {Promise<void>}
	 */
	async #generateAssetIndex() {
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

		// Create asset index for runtime access (magic key for RavenJS)
		const assetIndex = Object.keys(this.#assetContent);
		writeFileSync(this.#assetIndexPath, JSON.stringify(assetIndex));

		// Add asset index to SEA assets
		this.#assetContent["@raven-js/assets.json"] = this.#assetIndexPath;
	}

	/**
	 * Generate main server bundle (CJS format required by SEA)
	 * @returns {Promise<void>}
	 */
	async #generateServerBundle() {
		const entryPath = this.#config.getEntry();
		const env = this.#config.getEnvironment();

		try {
			const buildResult = await build({
				entryPoints: [entryPath],
				bundle: true,
				minify: true,
				format: "cjs", // SEA requires CommonJS
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

			// Prepend environment variables
			const envCode = env.generateGlobalCode();
			const finalServerCode = [envCode, serverCode]
				.filter(Boolean)
				.join("\n\n");

			// Write server bundle to temp file
			writeFileSync(this.#serverBundlePath, finalServerCode);
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(
				`Failed to build server bundle from ${entryPath}: ${err.message}`,
			);
		}
	}

	/**
	 * Generate SEA configuration file
	 */
	#generateSeaConfig() {
		const seaOptions = this.#config.getSea();

		// Create SEA asset mapping (file paths for SEA to embed)
		/** @type {Record<string, string>} */
		const seaAssets = {};
		for (const [assetPath, contentOrPath] of Object.entries(
			this.#assetContent,
		)) {
			if (assetPath === "@raven-js/assets.json") {
				// Special case: asset index points to file
				seaAssets[assetPath] = contentOrPath;
			} else {
				// Regular assets: create temp files for SEA to read
				const tempAssetPath = resolve(
					`${this.#assetIndexPath}..${assetPath.replace(/[/\\]/g, "_")}`,
				);
				writeFileSync(tempAssetPath, contentOrPath);
				seaAssets[assetPath] = tempAssetPath;
			}
		}

		const seaConfig = {
			main: this.#serverBundlePath,
			output: this.#seaBlobPath,
			disableExperimentalSEAWarning: /** @type {any} */ (seaOptions)
				.disableExperimentalSEAWarning,
			useCodeCache: /** @type {any} */ (seaOptions).useCodeCache,
			assets: seaAssets,
		};

		writeFileSync(this.#seaConfigPath, JSON.stringify(seaConfig, null, 2));
	}

	/**
	 * Generate SEA blob using Node.js SEA protocol
	 * @returns {Promise<void>}
	 */
	async #generateSeaBlob() {
		try {
			const cmd = `node --experimental-sea-config "${this.#seaConfigPath}"`;
			execSync(cmd, { stdio: "inherit" });
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(`Failed to generate SEA blob: ${err.message}`);
		}
	}

	/**
	 * Generate final executable with blob injection
	 * @returns {Promise<void>}
	 */
	async #generateExecutable() {
		try {
			// Copy Node.js binary
			this.#copyNodeBinary();

			// Remove signature on macOS before injection
			if (process.platform === "darwin") {
				const signing = this.#config.getSigning();
				if (/** @type {any} */ (signing).enabled) {
					execSync(`codesign --remove-signature "${this.#executablePath}"`, {
						stdio: "inherit",
					});
				}
			}

			// Inject SEA blob
			await this.#injectSeaBlob();

			// Re-sign on macOS after injection
			if (process.platform === "darwin") {
				const signing = this.#config.getSigning();
				if (/** @type {any} */ (signing).enabled) {
					const identity = /** @type {any} */ (signing).identity || "-"; // Default signing identity
					execSync(`codesign --sign "${identity}" "${this.#executablePath}"`, {
						stdio: "inherit",
					});
				}
			}
		} catch (error) {
			const err = /** @type {Error} */ (error);
			throw new Error(`Failed to generate executable: ${err.message}`);
		}
	}

	/**
	 * Copy Node.js binary to output location
	 */
	#copyNodeBinary() {
		const cmd = `node -e "require('fs').copyFileSync(process.execPath, '${this.#executablePath}')"`;
		execSync(cmd, { stdio: "inherit" });
	}

	/**
	 * Inject SEA blob into Node.js binary using postject
	 * @returns {Promise<void>}
	 */
	async #injectSeaBlob() {
		const blobContents = readFileSync(this.#seaBlobPath);

		try {
			// Dynamic import of postject (optional dependency)
			// @ts-expect-error - postject is an optional dependency
			const { inject } = await /** @type {any} */ (import("postject"));
			await inject(this.#executablePath, "NODE_SEA_BLOB", blobContents, {
				sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
				machoSegmentName: "NODE_SEA",
			});
		} catch (error) {
			const err = /** @type {Error & {code?: string}} */ (error);
			if (
				err.code === "MODULE_NOT_FOUND" ||
				err.message?.includes("postject")
			) {
				throw new Error(
					'Binary mode requires the "postject" package for SEA blob injection.\n' +
						"Install it with: npm install postject\n" +
						'Or add to your package.json: "optionalDependencies": { "postject": "^1.0.0" }',
				);
			}
			throw new Error(`Failed to inject SEA blob: ${err.message}`);
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
	 * Get file size in bytes
	 * @param {string | null} filePath - File path
	 * @returns {number} File size in bytes
	 */
	#getFileSize(filePath) {
		if (!filePath) return 0;
		try {
			const stats = readFileSync(filePath).length;
			return stats;
		} catch {
			return 0;
		}
	}
}
