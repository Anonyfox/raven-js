/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for global footer component
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { globalFooter } from "./global-footer.js";

test("globalFooter", async (t) => {
	await t.test("renders minimal footer with just Glean attribution", () => {
		const result = globalFooter({});

		assert(result.includes("⚡ Powered by Glean"), "Shows Glean attribution");
		assert(result.includes("Generated"), "Shows generation timestamp");
		assert(result.includes("col-12"), "Uses full width when no package info");
		assert(
			result.includes(
				"https://github.com/Anonyfox/ravenjs/tree/main/packages/glean",
			),
			"Links to Glean repo",
		);
	});

	await t.test("renders package information when provided", () => {
		const packageMetadata = {
			author: "John Doe <john@example.com>",
			homepage: "https://example.com",
			repository: { url: "https://github.com/user/repo" },
			bugs: { url: "https://github.com/user/repo/issues" },
			funding: { url: "https://github.com/sponsors/user" },
		};

		const result = globalFooter({
			packageName: "test-package",
			packageMetadata,
		});

		// Package info
		assert(result.includes("📦 test-package"), "Shows package name");
		assert(result.includes("by John Doe"), "Shows author name");
		assert(result.includes("john@example.com"), "Shows author email");

		// Package links with Unicode icons
		assert(result.includes("🏠"), "Shows homepage icon");
		assert(result.includes("📁"), "Shows repository icon");
		assert(result.includes("🐛"), "Shows issues icon");
		assert(result.includes("💖"), "Shows funding icon");

		// Link URLs
		assert(result.includes("https://example.com"), "Links to homepage");
		assert(
			result.includes("https://github.com/user/repo"),
			"Links to repository",
		);
		assert(
			result.includes("https://github.com/user/repo/issues"),
			"Links to issues",
		);
		assert(
			result.includes("https://github.com/sponsors/user"),
			"Links to funding",
		);

		// Layout
		assert(
			result.includes("col-lg-6"),
			"Uses two-column layout with package info",
		);
	});

	await t.test("handles string format author", () => {
		const result = globalFooter({
			packageMetadata: { author: "Jane Doe" },
		});

		assert(result.includes("by Jane Doe"), "Shows author name without email");
		assert(!result.includes("jane@"), "Does not show email when none provided");
		assert(
			!result.includes("&lt;") && !result.includes("<span><"),
			"Does not show email brackets when no email",
		);
	});

	await t.test("handles object format author", () => {
		const result = globalFooter({
			packageMetadata: {
				author: {
					name: "Bob Smith",
					email: "bob@example.com",
					url: "https://bobsmith.dev",
				},
			},
		});

		assert(result.includes("by Bob Smith"), "Shows author name from object");
		assert(
			result.includes("bob@example.com"),
			"Shows author email from object",
		);
	});

	await t.test("handles string format repository and bugs", () => {
		const result = globalFooter({
			packageMetadata: {
				repository: "https://github.com/user/string-repo",
				bugs: "https://github.com/user/string-repo/issues",
				funding: "https://opencollective.com/project",
			},
		});

		assert(
			result.includes("https://github.com/user/string-repo"),
			"Uses string repository URL",
		);
		assert(
			result.includes("https://github.com/user/string-repo/issues"),
			"Uses string bugs URL",
		);
		assert(
			result.includes("https://opencollective.com/project"),
			"Uses string funding URL",
		);
	});

	await t.test("uses custom generation timestamp when provided", () => {
		const customDate = new Date("2024-01-15T10:30:00Z").toISOString();
		const result = globalFooter({
			generationTimestamp: customDate,
		});

		assert(
			result.includes("Generated Jan 15, 2024"),
			"Uses custom timestamp format",
		);
	});

	await t.test("handles missing optional fields gracefully", () => {
		const result = globalFooter({
			packageName: "minimal-package",
			packageMetadata: {}, // Empty metadata
		});

		assert(result.includes("📦 minimal-package"), "Shows package name");
		assert(result.includes("⚡ Powered by Glean"), "Shows Glean attribution");
		assert(
			!result.includes("🏠"),
			"Does not show homepage icon when no homepage",
		);
		assert(
			!result.includes("by ") || result.match(/by /g)?.length === 1,
			"Does not show package author when no author (only 'Powered by Glean')",
		);
	});

	await t.test("includes responsive classes for mobile/desktop layout", () => {
		const result = globalFooter({
			packageName: "responsive-test",
			packageMetadata: { author: "Test Author" },
		});

		// Responsive classes
		assert(
			result.includes("col-lg-6 col-md-12"),
			"Has responsive column classes",
		);
		assert(result.includes("mb-2 mb-lg-0"), "Has responsive margin classes");
		assert(result.includes("text-lg-end"), "Has responsive text alignment");
		assert(result.includes("flex-lg-row"), "Has responsive flex direction");
		assert(result.includes("me-lg-3"), "Has responsive margin classes");
	});

	await t.test("includes proper external link attributes", () => {
		const result = globalFooter({
			packageMetadata: {
				homepage: "https://example.com",
				repository: { url: "https://github.com/user/repo" },
			},
		});

		// External link attributes
		assert(
			result.includes('target="_blank"'),
			"Opens external links in new tab",
		);
		assert(
			result.includes('rel="noopener noreferrer"'),
			"Uses safe external link attributes",
		);
		assert(result.includes("text-decoration-none"), "Removes link underlines");
	});
});
