/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Bundle resource with sourcemap support.
 *
 * Extends Resource to handle JavaScript bundles built with ESBuild,
 * automatically writing both bundle and sourcemap files on save.
 */

import { writeFile } from "node:fs/promises";
import { Resource } from "./resource.js";

/**
 * Bundle resource that writes both JS bundle and sourcemap files
 */
export class BundleResource extends Resource {
	/** @type {ArrayBuffer | null} Sourcemap content buffer */
	#sourcemapBuffer;

	/**
	 * Create bundle resource instance
	 * @param {ArrayBuffer} bundleBuffer - Bundle content buffer
	 * @param {ArrayBuffer | null} sourcemapBuffer - Sourcemap content buffer
	 * @param {URL} url - Bundle URL (mount path)
	 * @param {URL} baseUrl - Base URL for resolution
	 */
	constructor(bundleBuffer, sourcemapBuffer, url, baseUrl) {
		// Create mock Response for Resource constructor
		const headers = new Headers({
			"Content-Type": "application/javascript",
			"Content-Length": bundleBuffer.byteLength.toString(),
		});

		const response = new Response(bundleBuffer, {
			status: 200,
			statusText: "OK",
			headers,
		});

		super(url, response, bundleBuffer, baseUrl, []);
		this.#sourcemapBuffer = sourcemapBuffer;
	}

	/**
	 * Check if bundle has sourcemap
	 * @returns {boolean} True if sourcemap exists
	 */
	hasSourcemap() {
		return this.#sourcemapBuffer !== null;
	}

	/**
	 * Get sourcemap buffer
	 * @returns {ArrayBuffer | null} Sourcemap buffer or null
	 */
	getSourcemapBuffer() {
		return this.#sourcemapBuffer;
	}

	/**
	 * Save bundle and sourcemap files to filesystem
	 * @param {string} destinationFolder - Root folder for static site output
	 * @param {string} [basePath] - Optional base path for URL rewriting
	 * @returns {Promise<string>} Path where bundle file was saved
	 * @throws {Error} If file cannot be saved
	 */
	async saveToFile(destinationFolder, basePath) {
		// Save main bundle file using parent implementation
		const bundlePath = await super.saveToFile(destinationFolder, basePath);

		// Save sourcemap file if exists
		if (this.#sourcemapBuffer) {
			const sourcemapPath = `${bundlePath}.map`;
			await writeFile(sourcemapPath, new Uint8Array(this.#sourcemapBuffer));
		}

		return bundlePath;
	}

	/**
	 * JSON representation includes sourcemap info
	 * @returns {object} Serializable bundle resource data
	 */
	toJSON() {
		const base = super.toJSON();
		return {
			...base,
			hasSourcemap: this.hasSourcemap(),
			sourcemapSize: this.#sourcemapBuffer?.byteLength ?? 0,
			resourceType: "bundle",
		};
	}
}
