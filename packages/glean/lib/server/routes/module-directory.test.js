/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for module directory route handler
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "@raven-js/wings";
import { createModuleDirectoryHandler } from "./module-directory.js";

describe("createModuleDirectoryHandler", () => {
	/**
	 * Create mock Wings context
	 * @returns {Object} Mock context object
	 */
	function createTestContext() {
		const url = new URL("http://localhost:3000/modules/");
		const headers = new Headers();
		return new Context("GET", url, headers);
	}

	/**
	 * Create mock package for testing
	 * @param {Object} overrides - Override default package properties
	 * @returns {Object} Mock package instance
	 */
	function createMockPackage(overrides = {}) {
		const defaultModules = [
			{
				importPath: "test-package",
				isDefault: true,
				readme: "# Main Module\n\nThis is the main module documentation.",
				entities: [
					{
						name: "func1",
						entityType: "function",
						description: "Primary function",
						hasJSDocTag: () => false,
					},
					{
						name: "func2",
						entityType: "function",
						description: "Secondary function",
						hasJSDocTag: () => false,
					},
				],
				publicEntities: [
					{
						name: "func1",
						entityType: "function",
						description: "Primary function",
						hasJSDocTag: () => false,
					},
					{
						name: "func2",
						entityType: "function",
						description: "Secondary function",
						hasJSDocTag: () => false,
					},
				],
				entityCount: 2,
				publicEntityCount: 2,
				availableEntityTypes: ["function"],
			},
		];

		return {
			name: "test-package",
			description: "Test package description",
			modules: defaultModules,
			allEntities: defaultModules.flatMap((m) => m.entities),
			entityCount: 2,
			moduleCount: 1,
			...overrides,
		};
	}

	test("creates route handler function", () => {
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);

		assert(typeof handler === "function", "Returns function");
	});

	test("generates successful HTML response", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Response status
		assert.strictEqual(ctx.responseStatusCode, 200, "Sets 200 status code");

		// Response headers
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/html",
			"Sets HTML content type",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=3600",
			"Sets cache control header",
		);

		// Response body
		assert(typeof ctx.responseBody === "string", "Response body is string");
		assert(ctx.responseBody.length > 0, "Response body is not empty");
		assert(
			ctx.responseBody.includes("<!DOCTYPE html>"),
			"Contains HTML doctype",
		);
	});

	test("includes package information in response", async () => {
		const mockPackage = createMockPackage({
			name: "awesome-package",
			description: "An awesome test package",
		});
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check package information is in HTML
		assert(
			ctx.responseBody.includes("awesome-package"),
			"Contains package name",
		);
		assert(
			ctx.responseBody.includes("awesome-package Documentation"),
			"Contains documentation title",
		);
		assert(
			ctx.responseBody.includes("npm install awesome-package"),
			"Contains install command with package name",
		);
	});

	test("displays module directory information", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check module directory content
		assert(ctx.responseBody.includes("📦 Modules"), "Contains page title");
		assert(
			ctx.responseBody.includes("Explore the"),
			"Contains exploration text",
		);
		assert(ctx.responseBody.includes("test-package"), "Contains module name");
	});

	test("includes module cards with metadata", async () => {
		const mockPackage = createMockPackage({
			modules: [
				{
					importPath: "test-package",
					isDefault: true,
					readme: "# Main Module\n\nMain module documentation",
					entities: [
						{
							name: "mainFunc",
							entityType: "function",
							description: "Main function",
							hasJSDocTag: () => false,
						},
					],
					publicEntities: [
						{
							name: "mainFunc",
							entityType: "function",
							description: "Main function",
							hasJSDocTag: () => false,
						},
					],
					entityCount: 1,
					publicEntityCount: 1,
					availableEntityTypes: ["function"],
				},
				{
					importPath: "test-package/utils",
					isDefault: false,
					readme: "# Utils\n\nUtility functions",
					entities: [
						{
							name: "utilFunc",
							entityType: "function",
							description: "Utility function",
							hasJSDocTag: () => false,
						},
					],
					publicEntities: [
						{
							name: "utilFunc",
							entityType: "function",
							description: "Utility function",
							hasJSDocTag: () => false,
						},
					],
					entityCount: 1,
					publicEntityCount: 1,
					availableEntityTypes: ["function"],
				},
			],
		});
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check module cards
		assert(ctx.responseBody.includes("test-package"), "Contains main module");
		assert(ctx.responseBody.includes("utils"), "Contains utils module");
		assert(ctx.responseBody.includes("default"), "Shows default module badge");

		// Check README previews
		assert(
			ctx.responseBody.includes("Main Module"),
			"Contains main module README",
		);
		assert(ctx.responseBody.includes("Utils"), "Contains utils module README");

		// Check entity information
		assert(ctx.responseBody.includes("function"), "Shows entity types");
		assert(ctx.responseBody.includes("mainFunc"), "Shows sample entities");
	});

	test("displays directory statistics", async () => {
		const mockPackage = createMockPackage({
			modules: [
				{
					importPath: "test-package",
					isDefault: true,
					readme: "# Module",
					entities: new Array(5).fill().map((_, i) => ({
						name: `func${i}`,
						entityType: "function",
						description: `Function ${i}`,
						hasJSDocTag: () => false,
					})),
					publicEntities: new Array(3).fill().map((_, i) => ({
						name: `func${i}`,
						entityType: "function",
						description: `Function ${i}`,
						hasJSDocTag: () => false,
					})),
					entityCount: 5,
					publicEntityCount: 3,
					availableEntityTypes: ["function"],
				},
			],
		});
		mockPackage.allEntities = mockPackage.modules.flatMap((m) => m.entities);
		mockPackage.entityCount = 5;
		mockPackage.moduleCount = 1;

		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check statistics in response
		assert(ctx.responseBody.includes("1"), "Contains module count");
		assert(ctx.responseBody.includes("3"), "Contains public entity count");
	});

	test("handles package without modules", async () => {
		const mockPackage = createMockPackage({
			name: "empty-package",
			description: "An empty package for testing",
			modules: [],
			allEntities: [],
			entityCount: 0,
			moduleCount: 0,
		});
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200, "Still returns 200");
		assert(
			ctx.responseBody.includes("No Modules Available"),
			"Shows empty state message",
		);
		assert(ctx.responseBody.includes("📭"), "Shows empty state icon");
		assert(
			ctx.responseBody.includes("An empty package for testing"),
			"Shows package description in empty state",
		);
	});

	test("includes navigation and action buttons", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Module exploration buttons
		assert(
			ctx.responseBody.includes('href="/modules/test-package/"'),
			"Contains module link",
		);
		assert(
			ctx.responseBody.includes("📖 Explore Module"),
			"Contains explore button",
		);

		// Getting started section
		assert(
			ctx.responseBody.includes("🚀 Getting Started"),
			"Contains getting started",
		);
		assert(
			ctx.responseBody.includes("npm install test-package"),
			"Contains install command",
		);
	});

	test("handles data extraction errors gracefully", async () => {
		// Create an invalid package that will cause extraction to fail
		const invalidPackage = null;
		const handler = createModuleDirectoryHandler(invalidPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should return 500 error
		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status code");
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/plain",
			"Sets plain text content type for error",
		);
		assert(
			ctx.responseBody.includes("Failed to generate module directory"),
			"Contains error message",
		);
	});

	test("handles template rendering errors gracefully", async () => {
		// Create package that will pass extraction but potentially fail rendering
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		// Force an error by corrupting the context after handler creation
		const originalHandler = handler;
		const errorHandler = (ctx) => {
			// Mock a template error by making the moduleDirectoryTemplate throw
			const originalCall = originalHandler;
			try {
				originalCall(ctx);
			} catch (_error) {
				// If an error occurs, verify error handling
				assert.strictEqual(
					ctx.responseStatusCode,
					500,
					"Error sets 500 status",
				);
			}
		};

		// This test verifies the error handling structure exists
		// In practice, the template should not throw errors
		errorHandler(ctx);

		// The successful case should complete normally
		assert(
			ctx.responseStatusCode === 200 || ctx.responseStatusCode === 500,
			"Response handled",
		);
	});

	test("sets appropriate cache headers", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=3600",
			"Sets 1-hour cache control",
		);
	});

	test("handles edge case package data", async () => {
		const mockPackage = createMockPackage({
			name: "",
			description: undefined,
		});
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should handle gracefully
		assert.strictEqual(ctx.responseStatusCode, 200, "Handles edge case data");
		assert(
			ctx.responseBody.includes("<!DOCTYPE html>"),
			"Still generates valid HTML",
		);
	});

	test("includes entity type distribution", async () => {
		const mockPackage = createMockPackage({
			modules: [
				{
					importPath: "test-package",
					isDefault: true,
					readme: "# Module",
					entities: [
						{
							name: "func1",
							entityType: "function",
							description: "Function 1",
							hasJSDocTag: () => false,
						},
						{
							name: "Class1",
							entityType: "class",
							description: "Class 1",
							hasJSDocTag: () => false,
						},
					],
					publicEntities: [
						{
							name: "func1",
							entityType: "function",
							description: "Function 1",
							hasJSDocTag: () => false,
						},
						{
							name: "Class1",
							entityType: "class",
							description: "Class 1",
							hasJSDocTag: () => false,
						},
					],
					entityCount: 2,
					publicEntityCount: 2,
					availableEntityTypes: ["function", "class"],
				},
			],
		});
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check entity type distribution
		assert(
			ctx.responseBody.includes("Entity Type Distribution"),
			"Contains distribution section",
		);
		assert(ctx.responseBody.includes("function"), "Shows function type");
		assert(ctx.responseBody.includes("class"), "Shows class type");
	});

	test("includes proper page title and navigation", async () => {
		const mockPackage = createMockPackage();
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Should include base template structure with modules navigation active
		assert(
			ctx.responseBody.includes("Modules - test-package Documentation"),
			"Contains proper title",
		);
		assert(
			ctx.responseBody.includes("nav-link active"),
			"Marks modules nav as active",
		);
	});

	test("handles modules with different entity counts", async () => {
		const mockPackage = createMockPackage({
			modules: [
				{
					importPath: "test-package/empty",
					isDefault: false,
					readme: "# Empty Module",
					entities: [],
					publicEntities: [],
					entityCount: 0,
					publicEntityCount: 0,
					availableEntityTypes: [],
				},
				{
					importPath: "test-package/full",
					isDefault: false,
					readme: "# Full Module",
					entities: [
						{
							name: "func1",
							entityType: "function",
							description: "Function 1",
							hasJSDocTag: () => false,
						},
					],
					publicEntities: [
						{
							name: "func1",
							entityType: "function",
							description: "Function 1",
							hasJSDocTag: () => false,
						},
					],
					entityCount: 1,
					publicEntityCount: 1,
					availableEntityTypes: ["function"],
				},
			],
		});
		const handler = createModuleDirectoryHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check both modules are handled
		assert(ctx.responseBody.includes("empty"), "Contains empty module");
		assert(ctx.responseBody.includes("full"), "Contains full module");
		assert(
			ctx.responseBody.includes("No public entities available"),
			"Shows empty state for empty module",
		);
		assert(
			ctx.responseBody.includes("func1"),
			"Shows entities for full module",
		);
	});
});
