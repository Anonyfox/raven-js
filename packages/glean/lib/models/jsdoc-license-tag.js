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
 * Parses license declarations that specify legal terms, copyright
 * information, and usage permissions for code and documentation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc license tag implementation
 *
 * **Official JSDoc Tag:** Documents the legal license under which code is distributed.
 * **Purpose:** Provides legal information, usage permissions, and copyright terms for code usage.
 *
 * **Syntax:**
 * - License identifier: `MIT`, `Apache-2.0`, `GPL-3.0` - Standard SPDX license identifiers
 * - License name: `MIT License`, `Apache License 2.0` - Full license names
 * - Custom text: `Proprietary - Internal Use Only` - Custom license terms
 * - License URL: `https://opensource.org/licenses/MIT` - Direct license references
 *
 * **License Information Types:**
 * - Open source licenses: MIT, Apache, GPL, BSD and other standard open source terms
 * - Proprietary licenses: Commercial, internal, or custom restricted usage terms
 * - Copyright notices: Legal copyright attribution and ownership information
 * - Usage restrictions: Specific terms, limitations, or special usage conditions
 * - License URLs: Direct links to full license text and legal documentation
 * - Multi-licensing: Complex licensing scenarios with multiple applicable licenses
 *
 * **Usage Status:** Extremely common in professional software development,
 * especially in open source projects and enterprise codebases for legal compliance.
 *
 * **Primary Use Cases:**
 * - Legal compliance and copyright attribution
 * - Open source project license declaration
 * - Commercial software licensing information
 * - Enterprise code usage policy documentation
 * - Third-party dependency license tracking
 * - Legal audit and compliance verification
 *
 * **Best Practices:**
 * - Use standard SPDX license identifiers when possible for consistency
 * - Include license information in all significant code files
 * - Be consistent with license declaration format across the project
 * - Ensure license compatibility when combining code from different sources
 * - Update license information when code ownership or terms change
 * - Include copyright years and owner information when legally required
 * - Reference full license text when using custom or complex licensing terms
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
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "license";
	}

	/**
	 * Parse license tag content
	 */
	parseContent() {
		// License tag content is typically license identifier or text
		this.licenseInfo = this.rawContent?.trim() || "";

		// Try to detect if it's a standard SPDX identifier
		if (this.licenseInfo) {
			// Common SPDX license identifiers
			const spdxPattern =
				/^(MIT|Apache-2\.0|GPL-[23]\.0|BSD-[23]-Clause|ISC|LGPL-[23]\.1|MPL-2\.0|AGPL-3\.0|Unlicense|CC0-1\.0)$/i;
			this.isSpdxIdentifier = spdxPattern.test(this.licenseInfo);

			// Check if it's a URL
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
		// License tag should have some content
		this.isValidated = Boolean(this.licenseInfo?.trim());
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			licenseInfo: this.licenseInfo || "",
			isSpdxIdentifier: this.isSpdxIdentifier || false,
			isUrl: this.isUrl || false,
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.isUrl) {
			return html`<div class="license-info"><strong class="license-label">License:</strong> <a href="${this.licenseInfo}" class="license-link">${this.licenseInfo}</a></div>`;
		}
		return html`<div class="license-info"><strong class="license-label">License:</strong> <code class="license-text">${this.licenseInfo}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.isUrl) {
			return `**License:** [${this.licenseInfo}](${this.licenseInfo})`;
		}
		return `**License:** \`${this.licenseInfo}\``;
	}
}
