/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc license tag model.
 *
 * Ravens test legal information documentation with precision.
 * Verifies license tag parsing, validation, and legal information indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocLicenseTag } from "./jsdoc-license-tag.js";

test("JSDocLicenseTag - MIT license", () => {
	const tag = new JSDocLicenseTag("MIT");

	strictEqual(tag.licenseInfo, "MIT", "Should parse MIT license");
	strictEqual(tag.isSpdxIdentifier, true, "Should detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - Apache license", () => {
	const tag = new JSDocLicenseTag("Apache-2.0");

	strictEqual(tag.licenseInfo, "Apache-2.0", "Should parse Apache license");
	strictEqual(tag.isSpdxIdentifier, true, "Should detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - GPL license", () => {
	const tag = new JSDocLicenseTag("GPL-3.0");

	strictEqual(tag.licenseInfo, "GPL-3.0", "Should parse GPL license");
	strictEqual(tag.isSpdxIdentifier, true, "Should detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - BSD license", () => {
	const tag = new JSDocLicenseTag("BSD-3-Clause");

	strictEqual(tag.licenseInfo, "BSD-3-Clause", "Should parse BSD license");
	strictEqual(tag.isSpdxIdentifier, true, "Should detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - ISC license", () => {
	const tag = new JSDocLicenseTag("ISC");

	strictEqual(tag.licenseInfo, "ISC", "Should parse ISC license");
	strictEqual(tag.isSpdxIdentifier, true, "Should detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - custom license text", () => {
	const tag = new JSDocLicenseTag("Proprietary - Internal Use Only");

	strictEqual(
		tag.licenseInfo,
		"Proprietary - Internal Use Only",
		"Should parse custom license",
	);
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - license URL", () => {
	const tag = new JSDocLicenseTag("https://opensource.org/licenses/MIT");

	strictEqual(
		tag.licenseInfo,
		"https://opensource.org/licenses/MIT",
		"Should parse license URL",
	);
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX identifier");
	strictEqual(tag.isUrl, true, "Should detect URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - full license name", () => {
	const tag = new JSDocLicenseTag("MIT License");

	strictEqual(tag.licenseInfo, "MIT License", "Should parse full license name");
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - copyright notice", () => {
	const tag = new JSDocLicenseTag(
		"Copyright 2024 TechCorp. All rights reserved.",
	);

	strictEqual(
		tag.licenseInfo,
		"Copyright 2024 TechCorp. All rights reserved.",
		"Should parse copyright notice",
	);
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX identifier");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - multi-licensing", () => {
	const tag = new JSDocLicenseTag("MIT OR Apache-2.0");

	strictEqual(
		tag.licenseInfo,
		"MIT OR Apache-2.0",
		"Should parse multi-licensing",
	);
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect single SPDX");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - case insensitive SPDX detection", () => {
	const tag = new JSDocLicenseTag("mit");

	strictEqual(tag.licenseInfo, "mit", "Should preserve original case");
	strictEqual(
		tag.isSpdxIdentifier,
		true,
		"Should detect SPDX case-insensitive",
	);
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - whitespace handling", () => {
	const spacedTag = new JSDocLicenseTag("   Apache-2.0   ");

	strictEqual(
		spacedTag.licenseInfo,
		"Apache-2.0",
		"Should trim license info whitespace",
	);
	strictEqual(
		spacedTag.isSpdxIdentifier,
		true,
		"Should detect SPDX after trim",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - empty content", () => {
	const tag = new JSDocLicenseTag("");

	strictEqual(tag.licenseInfo, "", "Should have empty license info");
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), false, "Should be invalid without content");
});

test("JSDocLicenseTag - only whitespace", () => {
	const tag = new JSDocLicenseTag("   \n\t  ");

	strictEqual(tag.licenseInfo, "", "Should handle whitespace-only content");
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX");
	strictEqual(tag.isUrl, false, "Should not be URL");
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocLicenseTag - HTTPS URL", () => {
	const tag = new JSDocLicenseTag(
		"https://www.apache.org/licenses/LICENSE-2.0",
	);

	strictEqual(
		tag.licenseInfo,
		"https://www.apache.org/licenses/LICENSE-2.0",
		"Should parse HTTPS URL",
	);
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX");
	strictEqual(tag.isUrl, true, "Should detect HTTPS URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - HTTP URL", () => {
	const tag = new JSDocLicenseTag("http://example.com/license.txt");

	strictEqual(
		tag.licenseInfo,
		"http://example.com/license.txt",
		"Should parse HTTP URL",
	);
	strictEqual(tag.isSpdxIdentifier, false, "Should not detect SPDX");
	strictEqual(tag.isUrl, true, "Should detect HTTP URL");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - serialization", () => {
	const tag = new JSDocLicenseTag("MIT");
	const json = tag.toJSON();

	strictEqual(json.__type, "license", "Should have correct type");
	strictEqual(json.__data.licenseInfo, "MIT", "Should serialize license info");
	strictEqual(json.__data.isSpdxIdentifier, true, "Should serialize SPDX flag");
	strictEqual(json.__data.isUrl, false, "Should serialize URL flag");
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocLicenseTag - serialization with URL", () => {
	const tag = new JSDocLicenseTag(
		"https://creativecommons.org/licenses/by/4.0/",
	);
	const json = tag.toJSON();

	strictEqual(json.__type, "license", "Should have correct type");
	strictEqual(
		json.__data.licenseInfo,
		"https://creativecommons.org/licenses/by/4.0/",
		"Should serialize URL license info",
	);
	strictEqual(
		json.__data.isSpdxIdentifier,
		false,
		"Should serialize SPDX flag",
	);
	strictEqual(json.__data.isUrl, true, "Should serialize URL flag");
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocLicenseTag - HTML output with SPDX", () => {
	const tag = new JSDocLicenseTag("MIT");

	strictEqual(
		tag.toHTML(),
		'<div class="license-info"><strong class="license-label">License:</strong><code class="license-text">MIT</code></div>',
		"Should generate correct HTML for SPDX license",
	);
});

test("JSDocLicenseTag - HTML output with URL", () => {
	const tag = new JSDocLicenseTag("https://opensource.org/licenses/MIT");

	strictEqual(
		tag.toHTML(),
		'<div class="license-info"><strong class="license-label">License:</strong><a href="https://opensource.org/licenses/MIT" class="license-link">https://opensource.org/licenses/MIT</a></div>',
		"Should generate correct HTML for license URL",
	);
});

test("JSDocLicenseTag - HTML output with custom text", () => {
	const tag = new JSDocLicenseTag("Proprietary License");

	strictEqual(
		tag.toHTML(),
		'<div class="license-info"><strong class="license-label">License:</strong><code class="license-text">Proprietary License</code></div>',
		"Should generate correct HTML for custom license",
	);
});

test("JSDocLicenseTag - Markdown output with SPDX", () => {
	const tag = new JSDocLicenseTag("Apache-2.0");

	strictEqual(
		tag.toMarkdown(),
		"**License:** `Apache-2.0`",
		"Should generate correct Markdown for SPDX license",
	);
});

test("JSDocLicenseTag - Markdown output with URL", () => {
	const tag = new JSDocLicenseTag("https://www.gnu.org/licenses/gpl-3.0.html");

	strictEqual(
		tag.toMarkdown(),
		"**License:** [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)",
		"Should generate correct Markdown for license URL",
	);
});

test("JSDocLicenseTag - common license patterns", () => {
	// Open source licenses
	const mitTag = new JSDocLicenseTag("MIT");
	strictEqual(mitTag.isSpdxIdentifier, true, "Should handle MIT pattern");
	strictEqual(mitTag.isValid(), true, "Should be valid");

	// Enterprise licenses
	const propTag = new JSDocLicenseTag(
		"Commercial License - Enterprise Edition",
	);
	strictEqual(
		propTag.licenseInfo,
		"Commercial License - Enterprise Edition",
		"Should handle enterprise patterns",
	);
	strictEqual(propTag.isValid(), true, "Should be valid");

	// Creative Commons
	const ccTag = new JSDocLicenseTag("CC0-1.0");
	strictEqual(ccTag.isSpdxIdentifier, true, "Should handle CC patterns");
	strictEqual(ccTag.isValid(), true, "Should be valid");
});

test("JSDocLicenseTag - edge cases", () => {
	// Very long license text
	const longTag = new JSDocLicenseTag(
		"This is a very comprehensive custom license agreement that includes detailed terms and conditions, usage restrictions, liability limitations, and warranty disclaimers for enterprise software distribution",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long license text");

	// License with version numbers
	const versionTag = new JSDocLicenseTag("LGPL-2.1");
	strictEqual(
		versionTag.licenseInfo,
		"LGPL-2.1",
		"Should handle license with version",
	);
	strictEqual(
		versionTag.isSpdxIdentifier,
		true,
		"Should detect versioned SPDX",
	);
	strictEqual(versionTag.isValid(), true, "Should be valid");

	// Special characters in license
	const specialTag = new JSDocLicenseTag("MIT & Apache-2.0 (dual license)");
	strictEqual(
		specialTag.licenseInfo,
		"MIT & Apache-2.0 (dual license)",
		"Should handle special characters",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");
});
