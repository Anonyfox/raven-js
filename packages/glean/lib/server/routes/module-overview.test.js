/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for module overview route handler
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "@raven-js/wings";
import { createModuleOverviewHandler } from "./module-overview.js";

describe("createModuleOverviewHandler", () => {
	/**
	 * Get test origin from RAVENJS_ORIGIN or test default
	 * @returns {string} Test origin URL
	 */
	function getTestOrigin() {
		return process.env.RAVENJS_ORIGIN || "http://localhost:3000";
	}

	/**
	 * Create mock context for testing
	 * @param {Object} overrides - Override default context values
	 * @returns {Object} Mock Wings context
	 */
	function createTestContext(pathParams = { moduleName: "utils" }) {
		const url = new URL(`${getTestOrigin()}/modules/utils/`);
		const headers = new Headers();
		const ctx = new Context("GET", url, headers);
		ctx.pathParams = pathParams;
		return ctx;
	}

	/**
	 * Create mock package instance for testing
	 * @param {Object} overrides - Override default package values
	 * @returns {Object} Mock package instance
	 */
	function createMockPackage(overrides = {}) {
		const defaultEntities = [
			{
				name: "testFunction",
				entityType: "function",
				description: "A test function",
				hasJSDocTag: () => false,
			},
			{
				name: "TestClass",
				entityType: "class",
				description: "A test class",
				hasJSDocTag: () => false,
			},
		];

		const defaultModules = [
			{
				importPath: "awesome-package",
				isDefault: true,
				readme: "# Main Module\n\nThis is the main module.",
				entities: [defaultEntities[0]],
				entityCount: 1,
				publicEntityCount: 1,
				availableEntityTypes: ["function"],
				publicEntityGroups: {
					function: [defaultEntities[0]],
				},
			},
			{
				importPath: "awesome-package/utils",
				isDefault: false,
				readme: "# Utils Module\n\nUtility functions for the package.",
				entities: defaultEntities,
				entityCount: 2,
				publicEntityCount: 2,
				availableEntityTypes: ["function", "class"],
				publicEntityGroups: {
					function: [defaultEntities[0]],
					class: [defaultEntities[1]],
				},
			},
			{
				importPath: "awesome-package/helpers",
				isDefault: false,
				readme: "",
				entities: [],
				entityCount: 0,
				publicEntityCount: 0,
				availableEntityTypes: [],
				publicEntityGroups: {},
			},
		];

		return {
			name: "awesome-package",
			version: "1.0.0",
			description: "An awesome package for testing",
			modules: defaultModules,
			allEntities: defaultEntities,
			findModuleByImportPath: (importPath) =>
				defaultModules.find((m) => m.importPath === importPath) || null,
			...overrides,
		};
	}

	test("renders module overview successfully", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should return success status
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/html",
			"Sets HTML content type",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=3600",
			"Sets caching headers",
		);

		// Should contain valid HTML
		assert(ctx.responseBody.includes("<!DOCTYPE html>"), "Contains DOCTYPE");
		assert(ctx.responseBody.includes("</html>"), "Contains closing HTML tag");
	});

	test("includes module information in response", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		const html = ctx.responseBody;

		// Should include module information
		assert(html.includes("utils"), "Contains module name");
		assert(html.includes("awesome-package/utils"), "Contains full import path");
		assert(html.includes("Utils Module"), "Contains README title");
		assert(html.includes("Utility functions"), "Contains README description");

		// Should include entity information
		assert(html.includes("testFunction"), "Contains function entity");
		assert(html.includes("TestClass"), "Contains class entity");
		assert(html.includes("A test function"), "Contains entity descriptions");
	});

	test("includes package and navigation information", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		const html = ctx.responseBody;

		// Should include package information
		assert(
			html.includes("awesome-package Documentation"),
			"Contains package documentation title",
		);
		assert(html.includes("📦 awesome-package"), "Contains package breadcrumb");

		// Should include navigation
		assert(html.includes('href="/"'), "Contains package overview link");
		assert(
			html.includes('href="/modules/"'),
			"Contains modules directory link",
		);
		assert(html.includes("🗂️ All Modules"), "Contains module navigation");
	});

	test("handles missing module name parameter", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({});

		await handler(ctx);

		// Should return bad request status
		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/plain",
			"Sets plain text content type",
		);
		assert(
			ctx.responseBody.includes("Missing or invalid module name"),
			"Contains error message",
		);
	});

	test("handles invalid module name parameter types", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({ moduleName: 123 });

		await handler(ctx);

		// Should return bad request status
		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("Missing or invalid module name"),
			"Contains error message",
		);
	});

	test("validates module name format for security", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);

		// Test directory traversal attempts
		const maliciousNames = ["../etc/passwd", "module//name", "/absolute/path"];

		for (const badName of maliciousNames) {
			const ctx = createTestContext({ moduleName: badName });
			await handler(ctx);

			assert.strictEqual(
				ctx.responseStatusCode,
				500,
				`Returns 500 for malicious name: ${badName}`,
			);
			assert(
				ctx.responseBody.includes("Invalid module name format"),
				`Error message for: ${badName}`,
			);
		}
	});

	test("handles module not found error", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({ moduleName: "nonexistent" });

		await handler(ctx);

		// Should return not found status (Wings notFound() returns 404)
		assert.strictEqual(ctx.responseStatusCode, 404, "Returns 404 status");
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/plain",
			"Sets plain text content type",
		);
		assert(
			ctx.responseBody.includes("not found"),
			"Contains not found message",
		);
		assert(
			ctx.responseBody.includes("nonexistent"),
			"Includes module name in error",
		);
	});

	test("handles data extraction errors", async () => {
		// Create a package that will cause extraction to fail
		const brokenPackage = {
			name: "broken-package",
			modules: null, // This will cause an error
		};

		const handler = createModuleOverviewHandler(brokenPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should return internal server error
		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/plain",
			"Sets plain text content type",
		);
		assert(
			ctx.responseBody.includes("Failed to generate module overview"),
			"Contains server error message",
		);
	});

	test("handles complex module names correctly", async () => {
		const complexModules = [
			{
				importPath: "package/deep/nested/module",
				isDefault: false,
				readme: "# Deep Module\n\nA deeply nested module.",
				entities: [],
				entityCount: 0,
				publicEntityCount: 0,
				availableEntityTypes: [],
				publicEntityGroups: {},
			},
		];

		const mockPackage = createMockPackage({
			modules: complexModules,
			findModuleByImportPath: (importPath) =>
				complexModules.find((m) => m.importPath === importPath) || null,
		});

		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({ moduleName: "module" });

		await handler(ctx);

		// Should successfully render the complex module
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert(ctx.responseBody.includes("Deep Module"), "Contains module content");
	});

	test("handles modules without README", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({ moduleName: "helpers" });

		await handler(ctx);

		const html = ctx.responseBody;

		// Should still render successfully
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert(html.includes("helpers"), "Contains module name");
		assert(!html.includes("📚 Documentation"), "Does not show README section");
		assert(html.includes("📭"), "Shows empty state for no entities");
	});

	test("handles modules with no entities", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({ moduleName: "helpers" });

		await handler(ctx);

		const html = ctx.responseBody;

		// Should render empty state appropriately
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert(html.includes("No Public Entities"), "Shows empty entities message");
		assert(!html.includes("🔧 API Reference"), "Does not show API section");
	});

	test("renders default module correctly", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext({ moduleName: "awesome-package" });

		await handler(ctx);

		const html = ctx.responseBody;

		// Should show default module badge
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert(html.includes("awesome-package"), "Contains module name");
		assert(
			html.includes('badge bg-primary fs-6">default'),
			"Shows default badge",
		);
		assert(html.includes("Main Module"), "Contains default module README");
	});

	test("sets proper HTTP headers", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check all required headers
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/html",
			"Sets correct content type",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=3600",
			"Sets caching headers",
		);
	});

	test("handles edge case module lookup", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleOverviewHandler(mockPackage);

		// Test finding module by partial name (should work with module overview data extractor logic)
		const ctx = createTestContext({ moduleName: "utils" });

		await handler(ctx);

		// Should successfully find and render utils module
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert(
			ctx.responseBody.includes("awesome-package/utils"),
			"Found correct module",
		);
	});
});
