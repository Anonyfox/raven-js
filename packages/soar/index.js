/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main entry point for the @raven-js/soar library.
 *
 * Soar provides surgical precision deployment capabilities for modern
 * JavaScript applications. Deploy any artifact (binary, script, static)
 * to any target (VPS, serverless, CDN) using zero external dependencies
 * and pure platform primitives.
 */

import { selectArtifact } from "./src/config/artifacts/select.js";
import { SoarConfig } from "./src/config/soar-config.js";
import { selectTarget } from "./src/config/targets/select.js";

/**
 * @typedef {Object} DeploymentResult
 * @property {boolean} success - Whether deployment succeeded
 * @property {string} [url] - Deployed URL if available
 * @property {string} [message] - Deployment message
 * @property {string} [scriptName] - Script name for Workers
 * @property {string} [deployedAt] - Deployment timestamp
 * @property {number} [filesUploaded] - Number of files uploaded
 */

/**
 * Deploys an artifact to a target using the provided configuration.
 *
 * @param {string|import('./src/config/soar-config.js').SoarConfigObject} config - Path to config file or config object
 * @param {string} [exportName] - Named export to use from config file
 * @returns {Promise<DeploymentResult>} Deployment result
 *
 * @example
 * ```javascript
 * // Deploy using config file
 * const result = await deploy('./soar.config.js');
 *
 * // Deploy using config object
 * const result = await deploy({
 *   artifact: { type: 'static', path: './dist' },
 *   target: { name: 'cloudflare-workers', scriptName: 'my-app' }
 * });
 * ```
 */
export async function deploy(config, exportName) {
	// Load and validate configuration
	const soarConfig =
		typeof config === "string"
			? await SoarConfig.fromFile(config, exportName)
			: new SoarConfig(
					/** @type {import('./src/config/soar-config.js').SoarConfigObject} */ (
						config
					),
				);

	const errors = soarConfig.validate();
	if (errors.length > 0) {
		throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
	}

	// Prepare artifact
	const artifact = selectArtifact(
		/** @type {any} */ (soarConfig.getArtifact()),
	);
	await artifact.prepare();

	// Deploy to target
	const target = selectTarget(/** @type {any} */ (soarConfig.getTarget()));
	const result = await target.deploy(artifact);

	return /** @type {DeploymentResult} */ (result);
}

/**
 * @typedef {Object} DeploymentPlan
 * @property {Object} artifact - Artifact information
 * @property {string} artifact.type - Artifact type
 * @property {string} artifact.path - Artifact path
 * @property {Object} [artifact.manifest] - File manifest if available
 * @property {Object} target - Target information
 * @property {string} target.type - Target type
 * @property {Object} target.config - Target configuration
 * @property {boolean} planned - Always true for plans
 * @property {string} timestamp - Plan timestamp
 */

/**
 * Plans a deployment without executing it (dry-run).
 *
 * @param {string|import('./src/config/soar-config.js').SoarConfigObject} config - Path to config file or config object
 * @param {string} [exportName] - Named export to use from config file
 * @returns {Promise<DeploymentPlan>} Deployment plan
 */
export async function plan(config, exportName) {
	// Load and validate configuration
	const soarConfig =
		typeof config === "string"
			? await SoarConfig.fromFile(config, exportName)
			: new SoarConfig(
					/** @type {import('./src/config/soar-config.js').SoarConfigObject} */ (
						config
					),
				);

	const errors = soarConfig.validate();
	if (errors.length > 0) {
		throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
	}

	// Prepare artifact for planning
	const artifact = selectArtifact(
		/** @type {any} */ (soarConfig.getArtifact()),
	);
	await artifact.prepare();

	const target = selectTarget(/** @type {any} */ (soarConfig.getTarget()));

	// Cast to StaticArtifact since we know it has getManifest method
	const staticArtifact =
		/** @type {import('./src/config/artifacts/static.js').StaticArtifact} */ (
			artifact
		);

	// Return deployment plan
	return {
		artifact: {
			type: artifact.constructor.name,
			path: artifact.getPath(),
			...(staticArtifact.getManifest
				? { manifest: await staticArtifact.getManifest() }
				: {}),
		},
		target: {
			type: target.constructor.name,
			config: soarConfig.getTarget(),
		},
		planned: true,
		timestamp: new Date().toISOString(),
	};
}
