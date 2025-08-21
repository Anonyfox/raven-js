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
