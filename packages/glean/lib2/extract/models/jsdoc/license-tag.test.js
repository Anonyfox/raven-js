/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JSDocLicenseTag } from "./license-tag.js";

describe("JSDocLicenseTag functionality", () => {
	it("should inherit from JSDocTagBase", () => {
		const tag = new JSDocLicenseTag("test");
		assert.strictEqual(tag.tagType, "license");
		assert.strictEqual(tag.rawContent, "test");
	});

	it("should detect standard SPDX identifiers", () => {
		const testCases = [
			["MIT", "MIT", true, false],
			["Apache-2.0", "Apache-2.0", true, false],
			["GPL-2.0", "GPL-2.0", true, false],
			["GPL-3.0", "GPL-3.0", true, false],
			["BSD-2-Clause", "BSD-2-Clause", true, false],
			["BSD-3-Clause", "BSD-3-Clause", true, false],
			["ISC", "ISC", true, false],
			["LGPL-2.1", "LGPL-2.1", true, false],
			["LGPL-3.1", "LGPL-3.1", true, false],
			["MPL-2.0", "MPL-2.0", true, false],
			["AGPL-3.0", "AGPL-3.0", true, false],
			["Unlicense", "Unlicense", true, false],
			["CC0-1.0", "CC0-1.0", true, false],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle case insensitive SPDX identifiers", () => {
		const testCases = [
			["mit", "mit", true, false],
			["apache-2.0", "apache-2.0", true, false],
			["Gpl-2.0", "Gpl-2.0", true, false],
			["BSD-3-clause", "BSD-3-clause", true, false],
			["isc", "isc", true, false],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should detect license URLs", () => {
		const testCases = [
			["https://opensource.org/licenses/MIT", "https://opensource.org/licenses/MIT", false, true],
			["http://www.apache.org/licenses/LICENSE-2.0", "http://www.apache.org/licenses/LICENSE-2.0", false, true],
			["https://www.gnu.org/licenses/gpl-3.0.html", "https://www.gnu.org/licenses/gpl-3.0.html", false, true],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle license names that are not SPDX", () => {
		const testCases = [
			["MIT License", "MIT License", false, false],
			["Apache License 2.0", "Apache License 2.0", false, false],
			["GNU General Public License v3.0", "GNU General Public License v3.0", false, false],
			["Custom License", "Custom License", false, false],
			["Proprietary", "Proprietary", false, false],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle unknown SPDX-style identifiers", () => {
		const testCases = [
			["CustomLicense-1.0", "CustomLicense-1.0", false, false],
			["MIT-Custom", "MIT-Custom", false, false],
			["GPL-4.0", "GPL-4.0", false, false], // Not in pattern
			["BSD-4-Clause", "BSD-4-Clause", false, false], // Not in pattern
			["LGPL-4.1", "LGPL-4.1", false, false], // Not in pattern
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should reject non-HTTP URLs", () => {
		const testCases = [
			["ftp://example.com/license", "ftp://example.com/license", false, false],
			["file://path/to/license", "file://path/to/license", false, false],
			["mailto:license@example.com", "mailto:license@example.com", false, false],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle empty content", () => {
		const testCases = ["", "   ", "\t", "\n"];

		testCases.forEach((input) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, "");
			assert.strictEqual(tag.isSpdxIdentifier, false);
			assert.strictEqual(tag.isUrl, false);
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should handle undefined/null content", () => {
		const testCases = [undefined, null];

		testCases.forEach((input) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, "");
			assert.strictEqual(tag.isSpdxIdentifier, false);
			assert.strictEqual(tag.isUrl, false);
			assert.strictEqual(tag.isValidated, false);
		});
	});

	it("should trim whitespace", () => {
		const testCases = [
			["  MIT  ", "MIT", true, false],
			["\t Apache-2.0 \t", "Apache-2.0", true, false],
			["\n https://example.com/license \n", "https://example.com/license", false, true],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle Unicode content", () => {
		const testCases = [
			["许可证", "许可证", false, false],
			["Лицензия MIT", "Лицензия MIT", false, false],
			["Licença Personalizada", "Licença Personalizada", false, false],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should handle complex license text", () => {
		const complexLicense = `MIT License

Copyright (c) 2024 Example

Permission is hereby granted, free of charge...`;
		
		const tag = new JSDocLicenseTag(complexLicense);
		assert.strictEqual(tag.licenseInfo, complexLicense);
		assert.strictEqual(tag.isSpdxIdentifier, false);
		assert.strictEqual(tag.isUrl, false);
		assert.strictEqual(tag.isValidated, true);
	});

	it("should handle special characters and edge cases", () => {
		const testCases = [
			["License v1.0+", "License v1.0+", false, false],
			["MIT/Apache-2.0", "MIT/Apache-2.0", false, false],
			["(MIT)", "(MIT)", false, false],
			["MIT OR Apache-2.0", "MIT OR Apache-2.0", false, false],
		];

		testCases.forEach(([input, expectedInfo, expectedSpdx, expectedUrl]) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.licenseInfo, expectedInfo);
			assert.strictEqual(tag.isSpdxIdentifier, expectedSpdx);
			assert.strictEqual(tag.isUrl, expectedUrl);
			assert.strictEqual(tag.isValidated, true);
		});
	});

	it("should validate correctly based on content", () => {
		const validCases = [
			"MIT",
			"Apache-2.0",
			"Custom License",
			"https://example.com/license",
			"Any license text",
			" \t Valid \t ", // Whitespace around content
		];

		const invalidCases = [
			"",
			"   ",
			"\t",
			"\n",
		];

		validCases.forEach((input) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.isValidated, true, `Should be valid: "${input}"`);
		});

		invalidCases.forEach((input) => {
			const tag = new JSDocLicenseTag(input);
			assert.strictEqual(tag.isValidated, false, `Should be invalid: "${input}"`);
		});
	});
});
