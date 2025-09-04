/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Artifact selection function.
 *
 * Simple pure function to select and instantiate the correct artifact class.
 * Artifact classes handle their own validation and configuration.
 */

import { BinaryArtifact } from "./binary.js";
import { ScriptArtifact } from "./script.js";
import { StaticArtifact } from "./static.js";

/**
 * Selects and creates the appropriate artifact instance from an artifact config object.
 * The config object must have a 'type' property that determines which artifact class to use.
 *
 * @param {object} artifactConfig - Artifact configuration object with 'type' property
 * @param {string} artifactConfig.type - Artifact type ('binary', 'script', or 'static')
 * @param {string} artifactConfig.path - Path to the artifact
 * @returns {import('./base.js').Base} Artifact instance
 * @throws {Error} When artifact type is not supported
 *
 * @example
 * ```javascript
 * const artifact = selectArtifact({
 *   type: 'static',
 *   path: './dist',
 *   indexFile: 'index.html'
 * });
 * ```
 */
export function selectArtifact(artifactConfig) {
	if (!artifactConfig || typeof artifactConfig !== "object") {
		throw new Error("Artifact config must be an object");
	}

	if (!artifactConfig.type || typeof artifactConfig.type !== "string") {
		throw new Error('Artifact config must have a "type" property');
	}

	switch (artifactConfig.type) {
		case "binary":
			return new BinaryArtifact(
				/** @type {import('./binary.js').BinaryArtifactConfig} */ (
					artifactConfig
				),
			);

		case "script":
			return new ScriptArtifact(
				/** @type {import('./script.js').ScriptArtifactConfig} */ (
					artifactConfig
				),
			);

		case "static":
			return new StaticArtifact(
				/** @type {import('./static.js').StaticArtifactConfig} */ (
					artifactConfig
				),
			);

		default:
			throw new Error(`Unsupported artifact type: ${artifactConfig.type}`);
	}
}
