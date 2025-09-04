/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Cloudflare Workers with Static Assets implementation.
 *
 * Concrete implementation for deploying static sites to Cloudflare Workers
 * with Static Assets using the direct upload API. Replaces deprecated Pages.
 */

import { validate as validateResourceName } from "../identity/validate.js";
import { Cloudflare } from "./cloudflare.js";

/**
 * @typedef {Object} CloudflareWorkersConfig
 * @property {'cloudflare-workers'} name - Target name (must be 'cloudflare-workers')
 * @property {string} scriptName - Worker script name (must be lowercase, alphanumeric, hyphens)
 * @property {string} [dispatchNamespace] - Dispatch namespace for Workers for Platforms (optional)
 * @property {string} [compatibilityDate] - Compatibility date (defaults to current date)
 */

/**
 * @typedef {Object} FileMetadata
 * @property {string} hash - SHA-256 hash truncated to 32 characters
 * @property {number} size - File size in bytes
 */

/**
 * @typedef {Object} UploadSessionResponse
 * @property {string} jwt - JWT token for file uploads
 * @property {string[][]} buckets - Arrays of file hashes that need uploading
 */

/**
 * @typedef {Object} DeploymentResult
 * @property {boolean} success - Whether deployment succeeded
 * @property {string} url - Worker URL
 * @property {string} scriptName - Deployed script name
 * @property {string} deployedAt - ISO timestamp of deployment
 * @property {number} filesUploaded - Number of files uploaded
 * @property {string} [message] - Success message
 */

/**
 * Cloudflare Workers with Static Assets deployment service.
 * Handles deployment of static sites using the new Workers Static Assets API.
 * Replaces the deprecated Cloudflare Pages service.
 *
 * **Environment Variables Required:**
 * - `CF_API_TOKEN` - Cloudflare API token (required)
 * - `CF_ACCOUNT_ID` - Cloudflare account ID (required)
 *
 * **Supported Artifact Types:** `static`
 * **Supported Transports:** `http`
 */
export class CloudflareWorkers extends Cloudflare {
	/** @type {string} */
	#name;

	/** @type {string} */
	#scriptName;

	/** @type {string|null} */
	#dispatchNamespace;

	/** @type {string} */
	#compatibilityDate;

	/** @type {string} */
	#apiToken;

	/** @type {string} */
	#accountId;

	/**
	 * Creates a new Cloudflare Workers instance.
	 *
	 * @param {CloudflareWorkersConfig} config - Configuration object
	 */
	constructor(config) {
		super();

		// Validate target name
		if (config.name !== "cloudflare-workers") {
			throw new Error(
				"Target name must be 'cloudflare-workers' for CloudflareWorkers instances",
			);
		}

		// Validate required properties
		if (!config.scriptName || typeof config.scriptName !== "string") {
			throw new Error("Worker script name is required and must be a string");
		}

		this.#name = config.name;
		this.#scriptName = config.scriptName;
		this.#dispatchNamespace = config.dispatchNamespace || null;
		this.#compatibilityDate =
			config.compatibilityDate || new Date().toISOString().split("T")[0];

		// Load credentials from environment
		this.#apiToken = process.env.CF_API_TOKEN;
		if (!this.#apiToken) {
			throw new Error(
				"CF_API_TOKEN environment variable is required for Cloudflare Workers. " +
					"Get your API token from https://dash.cloudflare.com/profile/api-tokens",
			);
		}

		this.#accountId = process.env.CF_ACCOUNT_ID;
		if (!this.#accountId) {
			throw new Error(
				"CF_ACCOUNT_ID environment variable is required for Cloudflare Workers. " +
					"Find your account ID in the Cloudflare dashboard.",
			);
		}
	}

	/**
	 * Validates the configuration.
	 *
	 * @returns {Error[]} Array of validation errors
	 */
	validate() {
		const errors = [...super.validate()];

		// Validate script name (DNS-safe resource name)
		try {
			validateResourceName(this.#scriptName);
		} catch (error) {
			errors.push(
				new Error(
					`Invalid script name: ${/** @type {Error} */ (error).message}`,
				),
			);
		}

		// Validate compatibility date format (YYYY-MM-DD)
		if (!/^\d{4}-\d{2}-\d{2}$/.test(this.#compatibilityDate)) {
			errors.push(new Error("Compatibility date must be in YYYY-MM-DD format"));
		}

		return errors;
	}

	/**
	 * Gets Cloudflare credentials.
	 *
	 * @returns {Promise<object>} Cloudflare credentials
	 */
	async getCredentials() {
		return {
			apiToken: this.#apiToken,
			accountId: this.#accountId,
		};
	}

	/**
	 * Deploys static assets to Cloudflare Workers.
	 * Implements the 4-step Workers Static Assets deployment workflow.
	 *
	 * @param {import('../artifacts/static.js').StaticArtifact} staticArtifact - Static artifact instance
	 * @returns {Promise<DeploymentResult>} Deployment result
	 */
	async deploy(staticArtifact) {
		// Get vendor-neutral manifest from the artifact
		const artifactManifest = await staticArtifact.getManifest();
		const staticPath = staticArtifact.getPath();

		// Convert to Cloudflare-specific format
		const manifest = this.#createCloudflareManifest(artifactManifest.files);
		try {
			// Step 1: Start upload session
			const { jwt: uploadToken, buckets } =
				await this.#startUploadSession(manifest);

			let completionToken = uploadToken;
			let filesUploaded = 0;

			// Step 2: Upload missing files (if any)
			if (buckets.length > 0) {
				completionToken = await this.#uploadFilesBatch(
					uploadToken,
					buckets,
					manifest,
					staticPath,
				);
				filesUploaded = buckets.flat().length;
			}

			// Step 3: Deploy worker with assets
			await this.#deployWorkerScript(completionToken);

			// Step 4: Return deployment info
			return {
				success: true,
				url: `https://${this.#scriptName}.${this.#accountId}.workers.dev`,
				scriptName: this.#scriptName,
				deployedAt: new Date().toISOString(),
				filesUploaded,
				message: `Successfully deployed ${filesUploaded} files to Cloudflare Workers`,
			};
		} catch (error) {
			throw new Error(
				`Cloudflare Workers deployment failed: ${/** @type {Error} */ (error).message}`,
			);
		}
	}

	/**
	 * Gets supported artifact types.
	 *
	 * @returns {string[]} Array of supported artifact types
	 */
	getSupportedArtifactTypes() {
		return ["static"];
	}

	/**
	 * Gets supported transport methods.
	 *
	 * @returns {string[]} Array of supported transport methods
	 */
	getSupportedTransports() {
		return ["http"];
	}

	/**
	 * Step 1: Start upload session by posting manifest.
	 *
	 * @param {Record<string, FileMetadata>} manifest - File manifest
	 * @returns {Promise<UploadSessionResponse>} Upload session data
	 */
	async #startUploadSession(manifest) {
		const path = this.#dispatchNamespace
			? `/accounts/${this.#accountId}/workers/dispatch/namespaces/${this.#dispatchNamespace}/scripts/${this.#scriptName}/assets-upload-session`
			: `/accounts/${this.#accountId}/workers/scripts/${this.#scriptName}/assets-upload-session`;

		const response = await this.request("POST", path, this.#apiToken, {
			manifest,
		});

		if (!response.result || !response.result.jwt) {
			throw new Error("Invalid upload session response: missing jwt");
		}

		return {
			jwt: response.result.jwt,
			buckets: response.result.buckets || [],
		};
	}

	/**
	 * Step 2: Upload files in batches using the JWT token.
	 *
	 * @param {string} jwt - JWT token from upload session
	 * @param {string[][]} buckets - Arrays of file hashes to upload
	 * @param {Record<string, FileMetadata>} manifest - File manifest
	 * @param {string} staticPath - Path to static files directory
	 * @returns {Promise<string>} Completion token
	 */
	async #uploadFilesBatch(jwt, buckets, manifest, staticPath) {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");

		for (const bucket of buckets) {
			const formData = new FormData();

			for (const fileHash of bucket) {
				// Find the file path by hash
				const filePath = this.#findFilePathByHash(fileHash, manifest);
				const fullPath = path.join(staticPath, filePath);

				// Read file and convert to base64
				const fileBuffer = await fs.readFile(fullPath);
				const base64Data = fileBuffer.toString("base64");

				// Add to form data
				formData.append(
					fileHash,
					new File([base64Data], fileHash, {
						type: this.#getMimeType(filePath),
					}),
					fileHash,
				);
			}

			const response = await this.request(
				"POST",
				`/accounts/${this.#accountId}/workers/assets/upload?base64=true`,
				jwt,
				formData,
			);

			if (response.result.jwt) {
				return response.result.jwt;
			}
		}

		throw new Error("Should have received completion token");
	}

	/**
	 * Step 3: Deploy worker script with assets completion token.
	 *
	 * @param {string} completionToken - Completion token from file uploads
	 * @returns {Promise<void>}
	 */
	async #deployWorkerScript(completionToken) {
		const formData = new FormData();

		// Configure metadata
		formData.append(
			"metadata",
			JSON.stringify({
				main_module: "index.js",
				compatibility_date: this.#compatibilityDate,
				assets: {
					jwt: completionToken,
				},
				bindings: [{ name: "ASSETS", type: "assets" }],
			}),
		);

		// Add minimal worker script that serves static assets
		formData.append(
			"index.js",
			new File(
				[
					`export default {
	async fetch(request, env) {
		return env.ASSETS.fetch(request);
	}
}`,
				],
				"index.js",
				{
					type: "application/javascript+module",
				},
			),
		);

		const path = this.#dispatchNamespace
			? `/accounts/${this.#accountId}/workers/dispatch/namespaces/${this.#dispatchNamespace}/scripts/${this.#scriptName}`
			: `/accounts/${this.#accountId}/workers/scripts/${this.#scriptName}`;

		await this.request("PUT", path, this.#apiToken, formData);
	}

	/**
	 * Finds file path by hash in manifest.
	 *
	 * @param {string} hash - File hash to find
	 * @param {Record<string, FileMetadata>} manifest - File manifest
	 * @returns {string} File path
	 */
	#findFilePathByHash(hash, manifest) {
		for (const [filePath, metadata] of Object.entries(manifest)) {
			if (metadata.hash === hash) {
				return filePath.startsWith("/") ? filePath.slice(1) : filePath;
			}
		}
		throw new Error(`File with hash ${hash} not found in manifest`);
	}

	/**
	 * Converts generic file manifest to Cloudflare-specific format.
	 * Truncates SHA-256 hashes to 32 characters as required by Cloudflare API.
	 *
	 * @param {Record<string, import('../artifacts/static.js').FileMetadata>} genericManifest - Generic manifest
	 * @returns {Record<string, FileMetadata>} Cloudflare-specific manifest
	 */
	#createCloudflareManifest(genericManifest) {
		/** @type {Record<string, FileMetadata>} */
		const cloudflareManifest = {};

		for (const [filePath, metadata] of Object.entries(genericManifest)) {
			cloudflareManifest[filePath] = {
				hash: metadata.checksum.slice(0, 32), // Cloudflare wants 32-char hash
				size: metadata.size,
			};
		}

		return cloudflareManifest;
	}

	/**
	 * Gets MIME type for file extension.
	 *
	 * @param {string} filePath - File path
	 * @returns {string} MIME type
	 */
	#getMimeType(filePath) {
		const ext = filePath.split(".").pop()?.toLowerCase();
		/** @type {Record<string, string>} */
		const mimeTypes = {
			html: "text/html",
			css: "text/css",
			js: "application/javascript",
			json: "application/json",
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
			svg: "image/svg+xml",
			ico: "image/x-icon",
			txt: "text/plain",
		};
		return (ext && mimeTypes[ext]) || "application/octet-stream";
	}
}
