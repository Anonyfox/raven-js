/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc since tag model.
 *
 * Ravens test version tracking documentation with precision.
 * Verifies since tag parsing, validation, and temporal indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocSinceTag } from "./jsdoc-since-tag.js";

test("JSDocSinceTag - semantic version", () => {
	const tag = new JSDocSinceTag("1.0.0");

	strictEqual(tag.version, "1.0.0", "Should parse semantic version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "semver", "Should detect semver type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - semantic version with v prefix", () => {
	const tag = new JSDocSinceTag("v2.1.3");

	strictEqual(tag.version, "v2.1.3", "Should parse v-prefixed version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "semver", "Should detect semver type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - prerelease version", () => {
	const tag = new JSDocSinceTag("3.0.0-beta.1");

	strictEqual(tag.version, "3.0.0-beta.1", "Should parse prerelease version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "semver", "Should detect semver type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - version with build metadata", () => {
	const tag = new JSDocSinceTag("1.0.0+build.123");

	strictEqual(tag.version, "1.0.0+build.123", "Should parse build metadata");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "semver", "Should detect semver type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - date version", () => {
	const tag = new JSDocSinceTag("2024-01-15");

	strictEqual(tag.version, "2024-01-15", "Should parse date version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "date", "Should detect date type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - date version with dots", () => {
	const tag = new JSDocSinceTag("2024.01.15");

	strictEqual(tag.version, "2024.01.15", "Should parse dot date version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "date", "Should detect date type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - numeric version", () => {
	const tag = new JSDocSinceTag("1.5");

	strictEqual(tag.version, "1.5", "Should parse numeric version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "numeric", "Should detect numeric type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - simple numeric version", () => {
	const tag = new JSDocSinceTag("42");

	strictEqual(tag.version, "42", "Should parse simple numeric version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "numeric", "Should detect numeric type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - named version", () => {
	const tag = new JSDocSinceTag("Initial");

	strictEqual(tag.version, "Initial", "Should parse named version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "named", "Should detect named type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - legacy version", () => {
	const tag = new JSDocSinceTag("Legacy");

	strictEqual(tag.version, "Legacy", "Should parse legacy version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "named", "Should detect named type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - version with description", () => {
	const tag = new JSDocSinceTag("1.2.0 Added new parameter support");

	strictEqual(tag.version, "1.2.0", "Should parse version");
	strictEqual(
		tag.description,
		"Added new parameter support",
		"Should parse description",
	);
	strictEqual(tag.versionType, "semver", "Should detect semver type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - complex version with description", () => {
	const tag = new JSDocSinceTag(
		"v3.0.0-alpha.1 Introduced breaking changes to API",
	);

	strictEqual(tag.version, "v3.0.0-alpha.1", "Should parse complex version");
	strictEqual(
		tag.description,
		"Introduced breaking changes to API",
		"Should parse description",
	);
	strictEqual(tag.versionType, "semver", "Should detect semver type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - date version with description", () => {
	const tag = new JSDocSinceTag("2024-03-15 Release milestone achieved");

	strictEqual(tag.version, "2024-03-15", "Should parse date version");
	strictEqual(
		tag.description,
		"Release milestone achieved",
		"Should parse description",
	);
	strictEqual(tag.versionType, "date", "Should detect date type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - named version with description", () => {
	const tag = new JSDocSinceTag("Release Feature enhancement completed");

	strictEqual(tag.version, "Release", "Should parse named version");
	strictEqual(
		tag.description,
		"Feature enhancement completed",
		"Should parse description",
	);
	strictEqual(tag.versionType, "named", "Should detect named type");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - whitespace handling", () => {
	const spacedTag = new JSDocSinceTag("   2.0.0   Enhanced functionality   ");

	strictEqual(spacedTag.version, "2.0.0", "Should trim version whitespace");
	strictEqual(
		spacedTag.description,
		"Enhanced functionality",
		"Should trim description whitespace",
	);
	strictEqual(spacedTag.versionType, "semver", "Should detect semver type");
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - empty content", () => {
	const tag = new JSDocSinceTag("");

	strictEqual(tag.version, "", "Should have empty version");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "unknown", "Should be unknown type");
	strictEqual(tag.isValid(), false, "Should be invalid without content");
});

test("JSDocSinceTag - only whitespace", () => {
	const tag = new JSDocSinceTag("   \n\t  ");

	strictEqual(tag.version, "", "Should handle whitespace-only content");
	strictEqual(tag.description, "", "Should have empty description");
	strictEqual(tag.versionType, "unknown", "Should be unknown type");
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocSinceTag - version type detection", () => {
	// Test semver patterns
	const semverTag = new JSDocSinceTag("1.0.0-rc.1+build.456");
	strictEqual(semverTag.versionType, "semver", "Should detect complex semver");

	// Test date patterns
	const dateTag = new JSDocSinceTag("2023/12/25");
	strictEqual(dateTag.versionType, "date", "Should detect slash date");

	// Test numeric patterns
	const numericTag = new JSDocSinceTag("1.2.3.4");
	strictEqual(
		numericTag.versionType,
		"numeric",
		"Should detect multi-dot numeric",
	);

	// Test named patterns
	const namedTag = new JSDocSinceTag("Beta-Release");
	strictEqual(namedTag.versionType, "named", "Should detect named with dash");
});

test("JSDocSinceTag - serialization", () => {
	const tag = new JSDocSinceTag("1.5.0 Major feature update");
	const json = tag.toJSON();

	strictEqual(json.__type, "since", "Should have correct type");
	strictEqual(json.__data.version, "1.5.0", "Should serialize version");
	strictEqual(
		json.__data.description,
		"Major feature update",
		"Should serialize description",
	);
	strictEqual(
		json.__data.versionType,
		"semver",
		"Should serialize version type",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocSinceTag - serialization without description", () => {
	const tag = new JSDocSinceTag("2.0.0");
	const json = tag.toJSON();

	strictEqual(json.__type, "since", "Should have correct type");
	strictEqual(json.__data.version, "2.0.0", "Should serialize version");
	strictEqual(
		json.__data.description,
		"",
		"Should serialize empty description",
	);
	strictEqual(
		json.__data.versionType,
		"semver",
		"Should serialize version type",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocSinceTag - HTML output", () => {
	const withDescription = new JSDocSinceTag("1.3.0 API improvements added");

	strictEqual(
		withDescription.toHTML(),
		'<div class="since-info"><strong class="since-label">Since:</strong><code class="since-version">1.3.0</code> - API improvements added</div>',
		"Should generate correct HTML with description",
	);

	const withoutDescription = new JSDocSinceTag("2.1.0");

	strictEqual(
		withoutDescription.toHTML(),
		'<div class="since-info"><strong class="since-label">Since:</strong><code class="since-version">2.1.0</code></div>',
		"Should generate correct HTML without description",
	);
});

test("JSDocSinceTag - Markdown output", () => {
	const withDescription = new JSDocSinceTag("1.4.0 Performance optimizations");

	strictEqual(
		withDescription.toMarkdown(),
		"**Since:** `1.4.0` - Performance optimizations",
		"Should generate correct Markdown with description",
	);

	const withoutDescription = new JSDocSinceTag("v3.0.0");

	strictEqual(
		withoutDescription.toMarkdown(),
		"**Since:** `v3.0.0`",
		"Should generate correct Markdown without description",
	);
});

test("JSDocSinceTag - common version patterns", () => {
	// Library versions
	const libTag = new JSDocSinceTag("v1.0.0");
	strictEqual(libTag.versionType, "semver", "Should handle library patterns");
	strictEqual(libTag.isValid(), true, "Should be valid");

	// Enterprise versions
	const entTag = new JSDocSinceTag("2024.Q1");
	strictEqual(entTag.versionType, "named", "Should handle enterprise patterns");
	strictEqual(entTag.isValid(), true, "Should be valid");

	// Development versions
	const devTag = new JSDocSinceTag("0.1.0-dev");
	strictEqual(devTag.versionType, "semver", "Should handle dev patterns");
	strictEqual(devTag.isValid(), true, "Should be valid");
});

test("JSDocSinceTag - edge cases", () => {
	// Very long version string
	const longTag = new JSDocSinceTag(
		"1.0.0-alpha.beta.gamma.delta.epsilon+build.20240315.123456789",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long versions");

	// Unicode in description
	const unicodeTag = new JSDocSinceTag(
		"1.0.0 Añadido soporte für spëcial characters",
	);
	strictEqual(
		unicodeTag.description,
		"Añadido soporte für spëcial characters",
		"Should handle unicode in description",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");

	// Special characters in version
	const specialTag = new JSDocSinceTag("v2.0.0_RC1");
	strictEqual(
		specialTag.version,
		"v2.0.0_RC1",
		"Should handle special characters in version",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Mixed format description
	const mixedTag = new JSDocSinceTag(
		"1.5.0 Bug fixes & performance improvements (50% faster)",
	);
	strictEqual(
		mixedTag.description,
		"Bug fixes & performance improvements (50% faster)",
		"Should handle mixed format descriptions",
	);
	strictEqual(mixedTag.isValid(), true, "Should be valid");
});
