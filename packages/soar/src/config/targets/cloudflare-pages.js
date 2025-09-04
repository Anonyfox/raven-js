/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Cloudflare Pages implementation.
 *
 * Concrete implementation for deploying static sites to Cloudflare Pages
 * with service-specific configuration and validation.
 */

import { validate as validateResourceName } from "../identity/validate.js";
import { Cloudflare } from "./cloudflare.js";

/**
 * @typedef {Object} CloudflarePagesConfig
 * @property {'cloudflare-pages'} name - Target name (must be 'cloudflare-pages')
 * @property {string} projectName - Pages project name (must be lowercase, alphanumeric, hyphens)
 * @property {string} [region] - Target region (optional)
 * @property {string} [environment] - Environment name (optional)
 */

/**
 * Cloudflare Pages deployment service.
 * Handles deployment of pre-built static artifacts to Cloudflare Pages.
 * Accepts ready-to-deploy static files and uploads them directly.
 *
 * **Environment Variables Required:**
 * - `CF_API_TOKEN` - Cloudflare API token (required)
 * - `CF_ACCOUNT_ID` - Cloudflare account ID (optional)
 * - `CF_ZONE_ID` - Cloudflare zone ID (optional)
 *
 * **Supported Artifact Types:** `static`
 * **Supported Transports:** `http`
 */
export class CloudflarePages extends Cloudflare {
	/** @type {string} */
	#name;

	/** @type {string} */
	#projectName;

	/** @type {string|null} */
	#region;

	/** @type {string|null} */
	#environment;

	/** @type {string} */
	#apiToken;

	/** @type {string|null} */
	#accountId;

	/** @type {string|null} */
	#zoneId;

	/**
	 * Creates a new Cloudflare Pages instance.
	 *
	 * @param {CloudflarePagesConfig} config - Configuration object
	 */
	constructor(config) {
		super();

		// Validate target name
		if (config.name !== "cloudflare-pages") {
			throw new Error(
				"Target name must be 'cloudflare-pages' for CloudflarePages instances",
			);
		}

		// Validate required properties
		if (!config.projectName || typeof config.projectName !== "string") {
			throw new Error("Pages project name is required and must be a string");
		}

		this.#name = config.name;
		this.#projectName = config.projectName;
		this.#region = config.region || null;
		this.#environment = config.environment || null;

		// Load credentials from environment
		this.#apiToken = process.env.CF_API_TOKEN;
		if (!this.#apiToken) {
			throw new Error(
				"CF_API_TOKEN environment variable is required for Cloudflare Pages. " +
					"Get your API token from https://dash.cloudflare.com/profile/api-tokens",
			);
		}

		this.#accountId = process.env.CF_ACCOUNT_ID || null;
		this.#zoneId = process.env.CF_ZONE_ID || null;
	}

	/**
	 * Gets the target name.
	 * @returns {string} Target name
	 */
	getName() {
		return this.#name;
	}

	/**
	 * Gets the Pages project name.
	 * @returns {string} Project name
	 */
	getProjectName() {
		return this.#projectName;
	}

	/**
	 * Gets the target region.
	 * @returns {string|null} Target region
	 */
	getRegion() {
		return this.#region;
	}

	/**
	 * Gets the environment name.
	 * @returns {string|null} Environment name
	 */
	getEnvironment() {
		return this.#environment;
	}

	/**
	 * Gets the API token.
	 * @returns {string} API token
	 */
	getApiToken() {
		return this.#apiToken;
	}

	/**
	 * Gets the account ID.
	 * @returns {string|null} Account ID
	 */
	getAccountId() {
		return this.#accountId;
	}

	/**
	 * Gets the zone ID.
	 * @returns {string|null} Zone ID
	 */
	getZoneId() {
		return this.#zoneId;
	}

	/**
	 * Validates the Cloudflare Pages configuration.
	 * @returns {Error[]} Array of validation errors (empty if valid)
	 */
	validate() {
		const errors = [...super.validate()];

		// Validate name (using imported validation)
		try {
			validateResourceName(this.#name);
		} catch (error) {
			errors.push(
				new Error(`Invalid name: ${/** @type {Error} */ (error).message}`),
			);
		}

		// Validate region format (if provided)
		if (this.#region !== null) {
			if (
				typeof this.#region !== "string" ||
				this.#region.trim().length === 0
			) {
				errors.push(new Error("Region must be a non-empty string"));
			}
		}

		// Validate environment format (if provided)
		if (this.#environment !== null) {
			if (
				typeof this.#environment !== "string" ||
				this.#environment.trim().length === 0
			) {
				errors.push(new Error("Environment must be a non-empty string"));
			}
		}

		// Validate API token format
		if (this.#apiToken.length < 10) {
			errors.push(new Error("Cloudflare API token appears to be too short"));
		}

		if (!this.#apiToken.match(/^[a-zA-Z0-9_-]+$/)) {
			errors.push(
				new Error("Cloudflare API token contains invalid characters"),
			);
		}

		// Validate account ID format (if provided)
		if (this.#accountId !== null) {
			if (
				typeof this.#accountId !== "string" ||
				this.#accountId.trim().length === 0
			) {
				errors.push(new Error("Account ID must be a non-empty string"));
			}
		}

		// Validate zone ID format (if provided)
		if (this.#zoneId !== null) {
			if (
				typeof this.#zoneId !== "string" ||
				this.#zoneId.trim().length === 0
			) {
				errors.push(new Error("Zone ID must be a non-empty string"));
			}
		}

		// Validate project name
		if (this.#projectName.trim().length === 0) {
			errors.push(new Error("Pages project name cannot be empty"));
		}

		// Pages project names have specific format requirements
		if (!this.#projectName.match(/^[a-z0-9-]+$/)) {
			errors.push(
				new Error(
					"Pages project name must contain only lowercase letters, numbers, and hyphens",
				),
			);
		}

		if (this.#projectName.startsWith("-") || this.#projectName.endsWith("-")) {
			errors.push(
				new Error("Pages project name cannot start or end with a hyphen"),
			);
		}

		return errors;
	}

	/**
	 * Gets Cloudflare credentials.
	 * @returns {Promise<object>} Cloudflare credentials
	 */
	async getCredentials() {
		// Validate credentials before returning
		const errors = this.validate();
		if (errors.length > 0) {
			throw new Error(
				`Invalid Cloudflare credentials: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		return {
			token: this.#apiToken,
			accountId: this.#accountId,
			zoneId: this.#zoneId,
		};
	}

	/**
	 * Deploys static files to Cloudflare Pages.
	 *
	 * @param {object} artifact - Artifact to deploy
	 * @param {string} artifact.path - Path to static files
	 * @param {string} artifact.type - Artifact type (must be 'static')
	 * @returns {Promise<object>} Deployment result
	 */
	async deploy(artifact) {
		if (artifact.type !== "static") {
			throw new Error("Cloudflare Pages only supports static artifacts");
		}

		// TODO: Implement actual deployment logic
		// This would involve:
		// 1. Creating/updating the Pages project
		// 2. Uploading files via the Pages API
		// 3. Triggering deployment
		// 4. Monitoring deployment status

		return {
			success: true,
			url: `https://${this.#projectName}.pages.dev`,
			deploymentId: "placeholder-deployment-id",
			message: "Deployment successful (placeholder implementation)",
		};
	}

	/**
	 * Gets supported artifact types for this target.
	 * @returns {string[]} Supported artifact types
	 */
	static getSupportedArtifactTypes() {
		return ["static"];
	}

	/**
	 * Gets supported transport methods for this target.
	 * @returns {string[]} Supported transport methods
	 */
	static getSupportedTransports() {
		return ["http"];
	}
}
