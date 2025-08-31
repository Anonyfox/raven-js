/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc license tag model - legal information documentation.
 *
 * Ravens track legal territories with regulatory precision.
 * Critical for compliance and open source attribution.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc license tag implementation for license information documentation.
 *
 * Parses license tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocLicenseTag('MIT');
 * // Access parsed properties
 */
export class JSDocLicenseTag extends JSDocTagBase {
	/**
	 * Create license tag instance
	 * @param {string} rawContent - Raw license tag content
	 */
	constructor(rawContent) {
		super("license", rawContent);
	}

	/**
	 * Parse license tag content
	 */
	parseContent() {
		/**
		 * @type {string} Full license information
		 */
		this.licenseInfo = this.rawContent?.trim() || "";

		if (this.licenseInfo) {
			// Check for SPDX identifier
			const spdxPattern =
				/^(MIT|Apache-2\.0|GPL-[23]\.0|BSD-[23]-Clause|ISC|LGPL-[23]\.1|MPL-2\.0|AGPL-3\.0|Unlicense|CC0-1\.0)$/i;
			this.isSpdxIdentifier = spdxPattern.test(this.licenseInfo);

			this.isUrl = /^https?:\/\//.test(this.licenseInfo);
		} else {
			this.isSpdxIdentifier = false;
			this.isUrl = false;
		}
	}

	/**
	 * Validate license tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.licenseInfo?.trim());
	}
}
