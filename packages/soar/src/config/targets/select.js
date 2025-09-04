/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Target selection function.
 *
 * Simple pure function to select and instantiate the correct target class.
 * Product classes handle their own validation and configuration.
 */

import { CloudflarePages } from "./cloudflare-pages.js";
// TODO: Import other target classes as they're implemented
// import { CloudflareWorkers } from "./cloudflare-workers.js";
// import { DigitalOceanDroplet } from "./digitalocean-droplet.js";
// import { DigitalOceanFunctions } from "./digitalocean-functions.js";

/**
 * Selects and creates the appropriate target instance from a target config object.
 * The config object must have a 'name' property that determines which target class to use.
 *
 * @param {object} targetConfig - Target configuration object with 'name' property
 * @param {string} targetConfig.name - Target name (e.g., 'cloudflare-pages', 'digitalocean-droplet')
 * @returns {import('./base.js').Base} Target instance
 * @throws {Error} When target name is not supported
 *
 * @example
 * ```javascript
 * const target = selectTarget({
 *   name: 'cloudflare-pages',
 *   projectName: 'my-pages-project',
 *   region: 'us-west-2'
 * });
 * ```
 */
export function selectTarget(targetConfig) {
	if (!targetConfig || typeof targetConfig !== "object") {
		throw new Error("Target config must be an object");
	}

	if (!targetConfig.name || typeof targetConfig.name !== "string") {
		throw new Error('Target config must have a "name" property');
	}

	switch (targetConfig.name) {
		case "cloudflare-pages":
			return new CloudflarePages(
				/** @type {import('./cloudflare-pages.js').CloudflarePagesConfig} */ (
					targetConfig
				),
			);

		// TODO: Add other target types
		// case 'cloudflare-workers':
		//   return new CloudflareWorkers(targetConfig);
		// case 'digitalocean-droplet':
		//   return new DigitalOceanDroplet(targetConfig);
		// case 'digitalocean-functions':
		//   return new DigitalOceanFunctions(targetConfig);

		default:
			throw new Error(`Unsupported target: ${targetConfig.name}`);
	}
}
