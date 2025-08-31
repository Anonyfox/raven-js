/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { JSDocSinceTag } from "./since-tag.js";

describe("JSDocSinceTag core functionality", () => {
	test("should inherit from JSDocTagBase", () => {
		const tag = new JSDocSinceTag("1.2.0 Added new feature");

		strictEqual(tag.tagType, "since");
		strictEqual(tag.rawContent, "1.2.0 Added new feature");
		strictEqual(tag.isValid(), true);
	});

	test("should parse version and description", () => {
		const tag = new JSDocSinceTag("2.1.0 Enhanced functionality");

		strictEqual(tag.version, "2.1.0");
		strictEqual(tag.description, "Enhanced functionality");
		strictEqual(tag.isValidated, true);
	});

	test("should parse version only", () => {
		const tag = new JSDocSinceTag("1.0.0");

		strictEqual(tag.version, "1.0.0");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, true);
	});

	test("should handle empty content", () => {
		const tag = new JSDocSinceTag("");

		strictEqual(tag.version, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});

	test("should handle undefined/null content", () => {
		const undefinedTag = new JSDocSinceTag(undefined);
		const nullTag = new JSDocSinceTag(null);

		strictEqual(undefinedTag.version, "");
		strictEqual(undefinedTag.description, "");
		strictEqual(undefinedTag.isValidated, false);

		strictEqual(nullTag.version, "");
		strictEqual(nullTag.description, "");
		strictEqual(nullTag.isValidated, false);
	});
});

describe("JSDocSinceTag version formats", () => {
	test("should handle semantic versioning", () => {
		const versions = [
			"1.0.0",
			"2.1.5",
			"10.15.3",
			"0.1.0-alpha",
			"1.0.0-beta.1",
			"2.0.0-rc.1",
		];

		versions.forEach((version) => {
			const tag = new JSDocSinceTag(`${version} Release notes`);
			strictEqual(tag.version, version);
			strictEqual(tag.description, "Release notes");
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle pre-release versions", () => {
		const preVersions = [
			"1.0.0-alpha",
			"2.1.0-beta.2",
			"3.0.0-rc.1",
			"1.5.0-dev",
			"2.0.0-snapshot",
		];

		preVersions.forEach((version) => {
			const tag = new JSDocSinceTag(version);
			strictEqual(tag.version, version);
			strictEqual(tag.description, "");
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle non-semantic versions", () => {
		const versions = ["v1", "2.0", "latest", "next", "stable"];

		versions.forEach((version) => {
			const tag = new JSDocSinceTag(`${version} Description`);
			strictEqual(tag.version, version);
			strictEqual(tag.description, "Description");
			strictEqual(tag.isValidated, true);
		});
	});

	test("should handle date-based versions", () => {
		const dateVersions = [
			"2023.01.15",
			"20230115",
			"2023-Q1",
			"Jan-2023",
		];

		dateVersions.forEach((version) => {
			const tag = new JSDocSinceTag(`${version} Quarterly release`);
			strictEqual(tag.version, version);
			strictEqual(tag.description, "Quarterly release");
			strictEqual(tag.isValidated, true);
		});
	});
});

describe("JSDocSinceTag description parsing", () => {
	test("should handle detailed descriptions", () => {
		const tag = new JSDocSinceTag(
			"1.5.0 Added comprehensive error handling and validation",
		);

		strictEqual(tag.version, "1.5.0");
		strictEqual(
			tag.description,
			"Added comprehensive error handling and validation",
		);
		strictEqual(tag.isValidated, true);
	});

	test("should handle descriptions with multiple spaces", () => {
		const tag = new JSDocSinceTag("2.0.0     Major   refactoring     release");

		strictEqual(tag.version, "2.0.0");
		strictEqual(tag.description, "Major   refactoring     release");
		strictEqual(tag.isValidated, true);
	});

	test("should trim whitespace around version and description", () => {
		const tag = new JSDocSinceTag("  1.2.3   Bug fixes and improvements  ");

		strictEqual(tag.version, "1.2.3");
		strictEqual(tag.description, "Bug fixes and improvements");
		strictEqual(tag.isValidated, true);
	});

	test("should handle descriptions with special characters", () => {
		const tag = new JSDocSinceTag("1.0.0 Fix for issue #123 & feature @mention");

		strictEqual(tag.version, "1.0.0");
		strictEqual(tag.description, "Fix for issue #123 & feature @mention");
		strictEqual(tag.isValidated, true);
	});

	test("should handle Unicode descriptions", () => {
		const tag = new JSDocSinceTag("2.1.0 新功能和改进 🚀");

		strictEqual(tag.version, "2.1.0");
		strictEqual(tag.description, "新功能和改进 🚀");
		strictEqual(tag.isValidated, true);
	});
});

describe("JSDocSinceTag edge cases", () => {
	test("should handle version with hyphens and dots", () => {
		const tag = new JSDocSinceTag("v1.2.3-alpha.1 Pre-release version");

		strictEqual(tag.version, "v1.2.3-alpha.1");
		strictEqual(tag.description, "Pre-release version");
		strictEqual(tag.isValidated, true);
	});

	test("should handle single character version", () => {
		const tag = new JSDocSinceTag("A Initial release");

		strictEqual(tag.version, "A");
		strictEqual(tag.description, "Initial release");
		strictEqual(tag.isValidated, true);
	});

	test("should handle numeric only version", () => {
		const tag = new JSDocSinceTag("42 Ultimate version");

		strictEqual(tag.version, "42");
		strictEqual(tag.description, "Ultimate version");
		strictEqual(tag.isValidated, true);
	});

	test("should handle version with spaces in description", () => {
		const tag = new JSDocSinceTag("1.0 Added support for   multiple   formats");

		strictEqual(tag.version, "1.0");
		strictEqual(tag.description, "Added support for   multiple   formats");
		strictEqual(tag.isValidated, true);
	});

	test("should handle very long version strings", () => {
		const longVersion = "1.0.0-very.long.pre.release.identifier.with.many.parts";
		const tag = new JSDocSinceTag(`${longVersion} Complex version`);

		strictEqual(tag.version, longVersion);
		strictEqual(tag.description, "Complex version");
		strictEqual(tag.isValidated, true);
	});

	test("should handle whitespace-only content", () => {
		const tag = new JSDocSinceTag("   \t\n   ");

		strictEqual(tag.version, "");
		strictEqual(tag.description, "");
		strictEqual(tag.isValidated, false);
	});
});

describe("JSDocSinceTag validation", () => {
	test("should validate when version exists", () => {
		const tag = new JSDocSinceTag("1.0.0");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should validate when both version and description exist", () => {
		const tag = new JSDocSinceTag("2.1.0 New features");

		strictEqual(tag.isValidated, true);
		strictEqual(tag.isValid(), true);
	});

	test("should not validate empty content", () => {
		const emptyTags = ["", "   ", undefined, null];

		emptyTags.forEach((content) => {
			const tag = new JSDocSinceTag(content);
			strictEqual(tag.isValidated, false);
			strictEqual(tag.isValid(), false);
		});
	});

	test("should validate all non-empty versions", () => {
		const versions = [
			"v1",
			"1.0",
			"1.0.0",
			"alpha",
			"beta-1",
			"2023.01",
			"latest",
		];

		versions.forEach((version) => {
			const tag = new JSDocSinceTag(version);
			strictEqual(tag.isValidated, true, `Failed for version: ${version}`);
			strictEqual(tag.isValid(), true);
		});
	});
});

describe("JSDocSinceTag real-world scenarios", () => {
	test("should handle Git commit-like versions", () => {
		const tag = new JSDocSinceTag("abc123f Fixed critical bug");

		strictEqual(tag.version, "abc123f");
		strictEqual(tag.description, "Fixed critical bug");
		strictEqual(tag.isValidated, true);
	});

	test("should handle branch-based versions", () => {
		const tag = new JSDocSinceTag("feature/auth-v2 New authentication system");

		strictEqual(tag.version, "feature/auth-v2");
		strictEqual(tag.description, "New authentication system");
		strictEqual(tag.isValidated, true);
	});

	test("should handle codename versions", () => {
		const tag = new JSDocSinceTag("Wolverine Major performance improvements");

		strictEqual(tag.version, "Wolverine");
		strictEqual(tag.description, "Major performance improvements");
		strictEqual(tag.isValidated, true);
	});

	test("should handle URL-like descriptions", () => {
		const tag = new JSDocSinceTag(
			"1.5.0 See https://github.com/project/releases/v1.5.0",
		);

		strictEqual(tag.version, "1.5.0");
		strictEqual(tag.description, "See https://github.com/project/releases/v1.5.0");
		strictEqual(tag.isValidated, true);
	});
});
