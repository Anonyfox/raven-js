/**
 * @fileoverview Tests for landing page generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { generateLandingPage } from "./generate-landingpage.js";

describe("generateLandingPage", () => {
	test("should generate landing page with valid packages", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			// Add package.json files for test packages
			mkdirSync(join(tempDir, "packages", "beak"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "beak", "package.json"),
				JSON.stringify({
					name: "@raven-js/beak",
					description: "A templating library for modern web development",
					version: "1.0.0",
				}),
			);

			mkdirSync(join(tempDir, "packages", "nest"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "nest", "package.json"),
				JSON.stringify({
					name: "@raven-js/nest",
					description: "Development tools and utilities",
					version: "2.0.0",
				}),
			);

			const packageNames = ["beak", "nest"];
			const result = generateLandingPage(packageNames, tempDir);

			// Check that the result is a string
			assert.strictEqual(typeof result, "string");

			// Check that it contains HTML structure
			assert(result.includes("<!DOCTYPE html>"));
			assert(result.includes('<html lang="en">'));
			assert(result.includes("</html>"));

			// Check that it contains the title
			assert(result.includes("<title>RavenJS Documentation</title>"));

			// Check that it contains package information
			assert(result.includes("🦜 beak"));
			assert(result.includes("🦅 nest"));
			assert(
				result.includes("A templating library for modern web development"),
			);
			assert(result.includes("Development tools and utilities"));
			assert(result.includes("v1.0.0"));
			assert(result.includes("v2.0.0"));

			// Check that it contains package links
			assert(result.includes('href="./beak/"'));
			assert(result.includes('href="./nest/"'));
			assert(result.includes('href="./beak.context.json"'));
			assert(result.includes('href="./nest.context.json"'));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle missing package.json files", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			// Add one valid package and one with missing package.json
			mkdirSync(join(tempDir, "packages", "beak"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "beak", "package.json"),
				JSON.stringify({
					name: "@raven-js/beak",
					description: "A templating library",
					version: "1.0.0",
				}),
			);

			const packageNames = ["beak", "missing"];
			const result = generateLandingPage(packageNames, tempDir);

			// Should still generate page with valid package
			assert(result.includes("🦜 beak"));
			// Should not include the missing package
			assert(!result.includes("missing"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle invalid package.json files", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			// Add one valid package and one with invalid JSON
			mkdirSync(join(tempDir, "packages", "beak"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "beak", "package.json"),
				JSON.stringify({
					name: "@raven-js/beak",
					description: "A templating library",
					version: "1.0.0",
				}),
			);

			mkdirSync(join(tempDir, "packages", "invalid"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "invalid", "package.json"),
				"{ invalid json",
			);

			const packageNames = ["beak", "invalid"];
			const result = generateLandingPage(packageNames, tempDir);

			// Should still generate page with valid package
			assert(result.includes("🦜 beak"));
			// Should not include the invalid package
			assert(!result.includes("invalid"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle packages with missing fields", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			mkdirSync(join(tempDir, "packages", "minimal"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "minimal", "package.json"),
				JSON.stringify({
					name: "minimal",
					version: "1.0.0",
					// missing description
				}),
			);

			const packageNames = ["minimal"];
			const result = generateLandingPage(packageNames, tempDir);

			// Should include package even without description
			assert(result.includes("📦 minimal"));
			assert(result.includes("v1.0.0"));
			assert(result.includes("No description available"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle empty package names array", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			const result = generateLandingPage([], tempDir);

			// Should still generate valid HTML
			assert(result.includes("<!DOCTYPE html>"));
			assert(result.includes("<title>RavenJS Documentation</title>"));
			// Should not crash and be valid HTML
			assert(result.includes("RavenJS Documentation"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should include all required page elements", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			const result = generateLandingPage([], tempDir);

			// Check for essential HTML structure
			assert(result.includes("<!DOCTYPE html>"));
			assert(result.includes('<html lang="en">'));
			assert(result.includes("<head>"));
			assert(result.includes("<body>"));
			assert(result.includes("</html>"));

			// Check for required meta tags
			assert(result.includes('<meta charset="UTF-8">'));
			assert(result.includes('<meta name="viewport"'));

			// Check for title
			assert(result.includes("<title>RavenJS Documentation</title>"));

			// Check for basic styling
			assert(result.includes("<style>"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle packages with different name formats", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "landingpage-test-"));
		try {
			mkdirSync(join(tempDir, "packages", "scoped-package"), {
				recursive: true,
			});
			writeFileSync(
				join(tempDir, "packages", "scoped-package", "package.json"),
				JSON.stringify({
					name: "@scope/scoped-package",
					description: "A scoped package",
					version: "1.0.0",
				}),
			);

			mkdirSync(join(tempDir, "packages", "regular"), { recursive: true });
			writeFileSync(
				join(tempDir, "packages", "regular", "package.json"),
				JSON.stringify({
					name: "regular-package",
					description: "A regular package",
					version: "2.0.0",
				}),
			);

			const packageNames = ["scoped-package", "regular"];
			const result = generateLandingPage(packageNames, tempDir);

			// Should include both packages with proper display names
			assert(result.includes("scoped-package"));
			assert(result.includes("regular"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
