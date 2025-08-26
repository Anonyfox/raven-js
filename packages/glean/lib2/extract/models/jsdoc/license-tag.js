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
 * JSDoc license tag implementation
 *
 * **Official JSDoc Tag:** Documents the legal license under which code is distributed.
 *
 * **Syntax:**
 * - SPDX identifier: `MIT`, `Apache-2.0`, `GPL-3.0`
 * - License name: `MIT License`
 * - License URL: `https://opensource.org/licenses/MIT`
 *
 * **Raven Design:**
 * - SPDX identifier detection
 * - URL recognition
 * - Zero legal validation complexity
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
			/**
			 * @type {boolean} Whether this is a standard SPDX identifier
			 */
			this.isSpdxIdentifier = spdxPattern.test(this.licenseInfo);

			/**
			 * @type {boolean} Whether this is a URL
			 */
			this.isUrl = /^https?:\/\//.test(this.licenseInfo);
		} else {
			/**
			 * @type {boolean} Whether this is a standard SPDX identifier
			 */
			this.isSpdxIdentifier = false;
			/**
			 * @type {boolean} Whether this is a URL
			 */
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
