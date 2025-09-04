/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file DigitalOcean provider-level class.
 *
 * Pure abstract provider class with no configurable properties.
 * All configuration lives in concrete product classes.
 */

import { Base } from "./base.js";

/**
 * Abstract base class for all DigitalOcean services.
 * Pure provider abstraction with no configurable properties.
 * All configuration and credentials are handled by concrete product classes.
 */
export class DigitalOcean extends Base {
	/**
	 * Creates a new DigitalOcean provider instance.
	 * Provider classes have no configurable properties.
	 */
	constructor() {
		super();
	}

	/**
	 * Validates DigitalOcean provider configuration.
	 * Base provider has no configuration to validate.
	 *
	 * @returns {Error[]} Array of validation errors (empty for base provider)
	 */
	validate() {
		return [...super.validate()];
	}

	/**
	 * Gets DigitalOcean credentials.
	 * Must be implemented by concrete product classes.
	 *
	 * @returns {Promise<object>} DigitalOcean credentials
	 * @throws {Error} Always throws - must be implemented by product classes
	 */
	async getCredentials() {
		throw new Error(
			"getCredentials() must be implemented by concrete product classes",
		);
	}

	/**
	 * Creates a DigitalOcean provider from environment variables.
	 * Pure provider class - returns instance with no configuration.
	 *
	 * @returns {Promise<DigitalOcean>} DigitalOcean provider instance
	 */
	static async fromEnvironment() {
		return new DigitalOcean();
	}
}
