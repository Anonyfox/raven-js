/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc deprecated tag model.
 *
 * Ravens test deprecation notice documentation with precision.
 * Verifies deprecated tag parsing, validation, and warning indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocDeprecatedTag } from "./jsdoc-deprecated-tag.js";

test("JSDocDeprecatedTag - simple deprecation", () => {
	const tag = new JSDocDeprecatedTag("");

	strictEqual(tag.reason, "", "Should have empty reason");
	strictEqual(tag.deprecatedSince, "", "Should have empty version");
	strictEqual(
		tag.hasMigrationGuidance,
		false,
		"Should not have migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - migration guidance", () => {
	const tag = new JSDocDeprecatedTag("Use newFunction() instead");

	strictEqual(tag.reason, "Use newFunction() instead", "Should parse reason");
	strictEqual(tag.deprecatedSince, "", "Should have empty version");
	strictEqual(
		tag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - version information", () => {
	const tag = new JSDocDeprecatedTag("since version 2.0.0");

	strictEqual(tag.reason, "since version 2.0.0", "Should parse reason");
	strictEqual(tag.deprecatedSince, "2.0.0", "Should extract version");
	strictEqual(
		tag.hasMigrationGuidance,
		false,
		"Should not detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - version with v prefix", () => {
	const tag = new JSDocDeprecatedTag("deprecated since v1.5.2");

	strictEqual(tag.reason, "deprecated since v1.5.2", "Should parse reason");
	strictEqual(
		tag.deprecatedSince,
		"v1.5.2",
		"Should extract version with prefix",
	);
	strictEqual(
		tag.hasMigrationGuidance,
		false,
		"Should not detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - complex deprecation notice", () => {
	const tag = new JSDocDeprecatedTag(
		"Will be removed in v3.0. Use alternative approach",
	);

	strictEqual(
		tag.reason,
		"Will be removed in v3.0. Use alternative approach",
		"Should parse complex reason",
	);
	strictEqual(tag.deprecatedSince, "v3.0", "Should extract version");
	strictEqual(
		tag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - security deprecation", () => {
	const tag = new JSDocDeprecatedTag(
		"Replaced by more secure implementation in crypto module",
	);

	strictEqual(
		tag.reason,
		"Replaced by more secure implementation in crypto module",
		"Should parse security reason",
	);
	strictEqual(tag.deprecatedSince, "", "Should have empty version");
	strictEqual(
		tag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - performance deprecation", () => {
	const tag = new JSDocDeprecatedTag(
		"Performance issues identified. Migrate to optimized version",
	);

	strictEqual(
		tag.reason,
		"Performance issues identified. Migrate to optimized version",
		"Should parse performance reason",
	);
	strictEqual(tag.deprecatedSince, "", "Should have empty version");
	strictEqual(
		tag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - API evolution", () => {
	const tag = new JSDocDeprecatedTag("Try using the new async API instead");

	strictEqual(
		tag.reason,
		"Try using the new async API instead",
		"Should parse API evolution reason",
	);
	strictEqual(tag.deprecatedSince, "", "Should have empty version");
	strictEqual(
		tag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - version extraction patterns", () => {
	// Test "since version" pattern
	const sinceTag = new JSDocDeprecatedTag("deprecated since version 1.2.3");
	strictEqual(
		sinceTag.deprecatedSince,
		"1.2.3",
		"Should extract 'since version'",
	);

	// Test "from version" pattern
	const fromTag = new JSDocDeprecatedTag("removed from version 2.0");
	strictEqual(fromTag.deprecatedSince, "2.0", "Should extract 'from version'");

	// Test "in version" pattern
	const inTag = new JSDocDeprecatedTag("deprecated in v3.1.0");
	strictEqual(inTag.deprecatedSince, "v3.1.0", "Should extract 'in version'");
});

test("JSDocDeprecatedTag - migration guidance detection", () => {
	// Test various migration keywords
	const useTag = new JSDocDeprecatedTag("Use newMethod() for better results");
	strictEqual(useTag.hasMigrationGuidance, true, "Should detect 'use'");

	const replaceTag = new JSDocDeprecatedTag(
		"Replace with modern implementation",
	);
	strictEqual(replaceTag.hasMigrationGuidance, true, "Should detect 'replace'");

	const alternativeTag = new JSDocDeprecatedTag(
		"Consider alternative approaches",
	);
	strictEqual(
		alternativeTag.hasMigrationGuidance,
		true,
		"Should detect 'alternative'",
	);

	const migrateTag = new JSDocDeprecatedTag("Migrate to new API structure");
	strictEqual(migrateTag.hasMigrationGuidance, true, "Should detect 'migrate'");

	const insteadTag = new JSDocDeprecatedTag("Call newFunction instead");
	strictEqual(insteadTag.hasMigrationGuidance, true, "Should detect 'instead'");
});

test("JSDocDeprecatedTag - no migration guidance", () => {
	const tag = new JSDocDeprecatedTag("No longer supported");

	strictEqual(tag.reason, "No longer supported", "Should parse reason");
	strictEqual(
		tag.hasMigrationGuidance,
		false,
		"Should not detect migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - whitespace handling", () => {
	const spacedTag = new JSDocDeprecatedTag(
		"   Will be removed. Use alternative instead   ",
	);

	strictEqual(
		spacedTag.reason,
		"Will be removed. Use alternative instead",
		"Should trim reason whitespace",
	);
	strictEqual(
		spacedTag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - only whitespace", () => {
	const tag = new JSDocDeprecatedTag("   \n\t  ");

	strictEqual(tag.reason, "", "Should handle whitespace-only content");
	strictEqual(tag.deprecatedSince, "", "Should have empty version");
	strictEqual(
		tag.hasMigrationGuidance,
		false,
		"Should not have migration guidance",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - case insensitive patterns", () => {
	// Test case insensitive version extraction
	const upperTag = new JSDocDeprecatedTag("SINCE VERSION 1.0.0");
	strictEqual(
		upperTag.deprecatedSince,
		"1.0.0",
		"Should extract uppercase version",
	);

	// Test case insensitive migration guidance
	const upperMigrationTag = new JSDocDeprecatedTag("USE newMethod() INSTEAD");
	strictEqual(
		upperMigrationTag.hasMigrationGuidance,
		true,
		"Should detect uppercase migration",
	);
});

test("JSDocDeprecatedTag - serialization", () => {
	const tag = new JSDocDeprecatedTag("Use modernAPI() since version 2.1.0");
	const json = tag.toJSON();

	strictEqual(json.__type, "deprecated", "Should have correct type");
	strictEqual(
		json.__data.reason,
		"Use modernAPI() since version 2.1.0",
		"Should serialize reason",
	);
	strictEqual(json.__data.deprecatedSince, "2.1.0", "Should serialize version");
	strictEqual(
		json.__data.hasMigrationGuidance,
		true,
		"Should serialize migration flag",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocDeprecatedTag - serialization without reason", () => {
	const tag = new JSDocDeprecatedTag("");
	const json = tag.toJSON();

	strictEqual(json.__type, "deprecated", "Should have correct type");
	strictEqual(json.__data.reason, "", "Should serialize empty reason");
	strictEqual(
		json.__data.deprecatedSince,
		"",
		"Should serialize empty version",
	);
	strictEqual(
		json.__data.hasMigrationGuidance,
		false,
		"Should serialize migration flag",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocDeprecatedTag - HTML output", () => {
	const withReason = new JSDocDeprecatedTag("Use newFunction() instead");

	strictEqual(
		withReason.toHTML(),
		'<div class="deprecated-info"><strong class="deprecated-label">⚠️ Deprecated:</strong> Use newFunction() instead</div>',
		"Should generate correct HTML with reason",
	);

	const withoutReason = new JSDocDeprecatedTag("");

	strictEqual(
		withoutReason.toHTML(),
		'<div class="deprecated-info"><strong class="deprecated-label">⚠️ Deprecated</strong></div>',
		"Should generate correct HTML without reason",
	);
});

test("JSDocDeprecatedTag - Markdown output", () => {
	const withReason = new JSDocDeprecatedTag("Migrate to async implementation");

	strictEqual(
		withReason.toMarkdown(),
		"**⚠️ Deprecated:** Migrate to async implementation",
		"Should generate correct Markdown with reason",
	);

	const withoutReason = new JSDocDeprecatedTag("");

	strictEqual(
		withoutReason.toMarkdown(),
		"**⚠️ Deprecated**",
		"Should generate correct Markdown without reason",
	);
});

test("JSDocDeprecatedTag - common deprecation patterns", () => {
	// Library API deprecation
	const apiTag = new JSDocDeprecatedTag(
		"Use the new Promise-based API instead of callbacks",
	);
	strictEqual(
		apiTag.reason,
		"Use the new Promise-based API instead of callbacks",
		"Should handle API patterns",
	);
	strictEqual(
		apiTag.hasMigrationGuidance,
		true,
		"Should detect migration guidance",
	);
	strictEqual(apiTag.isValid(), true, "Should be valid");

	// Security deprecation
	const securityTag = new JSDocDeprecatedTag(
		"Security vulnerability found. Replace with secureMethod()",
	);
	strictEqual(
		apiTag.hasMigrationGuidance,
		true,
		"Should detect security patterns",
	);
	strictEqual(securityTag.isValid(), true, "Should be valid");

	// Version-based deprecation
	const versionTag = new JSDocDeprecatedTag("Removed in version 3.0.0");
	strictEqual(
		versionTag.deprecatedSince,
		"3.0.0",
		"Should extract version patterns",
	);
	strictEqual(versionTag.isValid(), true, "Should be valid");
});

test("JSDocDeprecatedTag - edge cases", () => {
	// Very long deprecation notice
	const longTag = new JSDocDeprecatedTag(
		"This function has been deprecated due to performance issues and security vulnerabilities. Please migrate to the new implementation available in the security module which provides better error handling, improved performance, and enhanced security features",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long reasons");
	strictEqual(
		longTag.hasMigrationGuidance,
		true,
		"Should detect migration in long text",
	);

	// Multiple version references
	const multiVersionTag = new JSDocDeprecatedTag(
		"Deprecated since version 1.0.0, will be removed in version 2.0.0",
	);
	strictEqual(
		multiVersionTag.deprecatedSince,
		"1.0.0",
		"Should extract first version reference",
	);
	strictEqual(multiVersionTag.isValid(), true, "Should be valid");

	// Special characters
	const specialTag = new JSDocDeprecatedTag(
		"Use newMethod() & modernAPI() instead of this legacy implementation",
	);
	strictEqual(
		specialTag.hasMigrationGuidance,
		true,
		"Should handle special characters",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Unicode characters
	const unicodeTag = new JSDocDeprecatedTag(
		"Dépréciée - Utilisez la nouvelle implémentation",
	);
	strictEqual(
		unicodeTag.reason,
		"Dépréciée - Utilisez la nouvelle implémentation",
		"Should handle unicode characters",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");
});
