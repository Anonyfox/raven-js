/**
 * @fileoverview Tests for landing page generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { generateLandingPage } from "./generate-landingpage.js";

describe("generateLandingPage", () => {
	test("should generate landing page with valid packages", () => {
		const workspaceFolder = new Folder();

		// Add package.json files for test packages
		workspaceFolder.addFile(
			"packages/beak/package.json",
			JSON.stringify({
				name: "@raven-js/beak",
				description: "A templating library for modern web development",
				version: "1.0.0",
			}),
		);

		workspaceFolder.addFile(
			"packages/nest/package.json",
			JSON.stringify({
				name: "@raven-js/nest",
				description: "Development tools and utilities",
				version: "2.0.0",
			}),
		);

		const packageNames = ["beak", "nest"];
		const result = generateLandingPage(packageNames, workspaceFolder);

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
		assert(result.includes("A templating library for modern web development"));
		assert(result.includes("Development tools and utilities"));
		assert(result.includes("v1.0.0"));
		assert(result.includes("v2.0.0"));

		// Check that it contains package links
		assert(result.includes('href="./beak/"'));
		assert(result.includes('href="./nest/"'));
		assert(result.includes('href="./beak.context.json"'));
		assert(result.includes('href="./nest.context.json"'));
	});

	test("should handle missing package.json files", () => {
		const workspaceFolder = new Folder();

		// Only add one package.json
		workspaceFolder.addFile(
			"packages/beak/package.json",
			JSON.stringify({
				name: "@raven-js/beak",
				description: "A templating library",
				version: "1.0.0",
			}),
		);

		const packageNames = ["beak", "missing-package"];
		const result = generateLandingPage(packageNames, workspaceFolder);

		// Should still generate valid HTML
		assert.strictEqual(typeof result, "string");
		assert(result.includes("<!DOCTYPE html>"));

		// Should only include the valid package
		assert(result.includes("🦜 beak"));
		assert(!result.includes("missing-package"));
	});

	test("should handle invalid package.json files", () => {
		const workspaceFolder = new Folder();

		// Add valid package.json
		workspaceFolder.addFile(
			"packages/beak/package.json",
			JSON.stringify({
				name: "@raven-js/beak",
				description: "A templating library",
				version: "1.0.0",
			}),
		);

		// Add invalid package.json
		workspaceFolder.addFile("packages/invalid/package.json", "{ invalid json");

		const packageNames = ["beak", "invalid"];
		const result = generateLandingPage(packageNames, workspaceFolder);

		// Should still generate valid HTML
		assert.strictEqual(typeof result, "string");
		assert(result.includes("<!DOCTYPE html>"));

		// Should only include the valid package
		assert(result.includes("🦜 beak"));
		assert(!result.includes("invalid"));
	});

	test("should handle packages with missing fields", () => {
		const workspaceFolder = new Folder();

		// Add package.json with minimal fields
		workspaceFolder.addFile(
			"packages/minimal/package.json",
			JSON.stringify({
				name: "@raven-js/minimal",
				// Missing description and version
			}),
		);

		const packageNames = ["minimal"];
		const result = generateLandingPage(packageNames, workspaceFolder);

		// Should still generate valid HTML
		assert.strictEqual(typeof result, "string");
		assert(result.includes("<!DOCTYPE html>"));

		// Should use defaults for missing fields
		assert(result.includes("📦 minimal")); // Default emoji
		assert(result.includes("No description available"));
		assert(result.includes("v0.0.0"));
	});

	test("should handle empty package names array", () => {
		const workspaceFolder = new Folder();
		const packageNames = [];
		const result = generateLandingPage(packageNames, workspaceFolder);

		// Should still generate valid HTML
		assert.strictEqual(typeof result, "string");
		assert(result.includes("<!DOCTYPE html>"));
		assert(result.includes("<title>RavenJS Documentation</title>"));

		// Should not contain any package cards
		assert(!result.includes('class="package"'));
	});

	test("should include all required page elements", () => {
		const workspaceFolder = new Folder();
		workspaceFolder.addFile(
			"packages/test/package.json",
			JSON.stringify({
				name: "@raven-js/test",
				description: "Test package",
				version: "1.0.0",
			}),
		);

		const packageNames = ["test"];
		const result = generateLandingPage(packageNames, workspaceFolder);

		// Check for required page elements
		assert(result.includes("🦅 RavenJS Documentation"));
		assert(result.includes("A swift web dev toolkit"));
		assert(result.includes("📦 Pre-built Bundles"));
		assert(result.includes("View on GitHub"));
		assert(result.includes("Visit Website"));
		assert(result.includes("MIT License"));
		assert(result.includes("Copyright (c) 2025 Anonyfox e.K."));
	});

	test("should handle packages with different name formats", () => {
		const workspaceFolder = new Folder();

		// Package with scoped name
		workspaceFolder.addFile(
			"packages/scoped/package.json",
			JSON.stringify({
				name: "@raven-js/scoped-package",
				description: "Scoped package",
				version: "1.0.0",
			}),
		);

		// Package with simple name
		workspaceFolder.addFile(
			"packages/simple/package.json",
			JSON.stringify({
				name: "simple-package",
				description: "Simple package",
				version: "1.0.0",
			}),
		);

		const packageNames = ["scoped", "simple"];
		const result = generateLandingPage(packageNames, workspaceFolder);

		// Should handle both name formats correctly
		assert(result.includes("scoped-package")); // From @raven-js/scoped-package
		assert(result.includes("simple-package")); // From simple-package
	});
});
