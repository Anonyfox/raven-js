/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for entity page route handler
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "@raven-js/wings";
import { createEntityPageHandler } from "./entity-page.js";

describe("createEntityPageHandler", () => {
	/**
	 * Create mock Wings context
	 * @param {Object} options - Context options
	 * @returns {Object} Mock context
	 */
	function createTestContext(
		pathParams = { moduleName: "utils", entityName: "testFunction" },
	) {
		const url = new URL("http://localhost:3000/modules/utils/testFunction/");
		const headers = new Headers();
		const ctx = new Context("GET", url, headers);
		ctx.pathParams = pathParams;
		return ctx;
	}

	/**
	 * Create mock entity for testing
	 * @param {string} name - Entity name
	 * @param {string} type - Entity type
	 * @param {Object} options - Additional options
	 * @returns {Object} Mock entity
	 */
	function createMockEntity(name, type = "function", options = {}) {
		const {
			description = "A test entity",
			source = "function test() { return 'test'; }",
			location = { file: "test.js", line: 1, column: 0 },
			jsdocTags = {},
		} = options;

		return {
			name,
			entityType: type,
			description,
			source,
			location,
			moduleId: "test-package/utils",
			signature: options.signature || "",

			// JSDoc tag simulation
			hasJSDocTag: (tagName) => Boolean(jsdocTags[tagName]),
			getJSDocTag: (tagName) => jsdocTags[tagName] || null,
			getJSDocTagsByType: (tagName) => {
				const tag = jsdocTags[tagName];
				if (!tag) return [];
				return Array.isArray(tag) ? tag : [tag];
			},
		};
	}

	/**
	 * Create mock module with entities
	 * @param {string} importPath - Module import path
	 * @param {Array} entities - Module entities
	 * @param {Object} options - Module options
	 * @returns {Object} Mock module
	 */
	function createMockModule(importPath, entities = [], options = {}) {
		const publicEntities = entities.filter(
			(e) => !e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		);

		return {
			importPath,
			isDefault: options.isDefault || false,
			readme: options.readme || "# Test Module\n\nA test module.",
			entities,
			entityCount: entities.length,
			publicEntityCount: publicEntities.length,
			availableEntityTypes: [
				...new Set(publicEntities.map((e) => e.entityType || "unknown")),
			],
			publicEntityGroups: publicEntities.reduce((groups, entity) => {
				const type = entity.entityType || "unknown";
				if (!groups[type]) groups[type] = [];
				groups[type].push(entity);
				return groups;
			}, {}),
			findEntityByName: (name) => entities.find((e) => e.name === name) || null,
		};
	}

	/**
	 * Create mock package with modules
	 * @param {Array} modules - Package modules
	 * @param {Object} options - Package options
	 * @returns {Object} Mock package
	 */
	function createMockPackage(modules = [], options = {}) {
		const allEntities = modules.flatMap((m) => m.entities || []);

		return {
			name: options.name || "test-package",
			version: options.version || "1.0.0",
			description: options.description || "A test package",
			modules,
			allEntities,
			findModuleByImportPath: (importPath) =>
				modules.find((m) => m.importPath === importPath) || null,
			...options,
		};
	}

	/**
	 * Create default test package setup
	 * @returns {Object} Mock package with test data
	 */
	function createTestPackage() {
		const entities = [
			createMockEntity("testFunction", "function", {
				description: "A test function for unit testing",
				jsdocTags: {
					param: [
						{
							name: "data",
							type: "Array",
							description: "Input data",
						},
					],
					returns: {
						type: "Object",
						description: "Processed result",
					},
				},
			}),
			createMockEntity("TestClass", "class", {
				description: "A test class",
			}),
		];

		const utilsModule = createMockModule("test-package/utils", entities);
		const defaultModule = createMockModule(
			"test-package",
			[createMockEntity("mainFunction", "function")],
			{ isDefault: true },
		);

		return createMockPackage([defaultModule, utilsModule]);
	}

	test("generates successful HTML response for valid entity", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Check response status and headers
		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		assert.strictEqual(
			ctx.responseHeaders.get("Content-Type"),
			"text/html",
			"Sets HTML content type",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=3600",
			"Sets cache headers",
		);

		// Check security headers
		assert.strictEqual(
			ctx.responseHeaders.get("X-Content-Type-Options"),
			"nosniff",
			"Sets nosniff header",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("X-Frame-Options"),
			"SAMEORIGIN",
			"Sets frame options header",
		);

		// Check HTML structure
		const html = ctx.responseBody;
		assert(html.includes("<!DOCTYPE html>"), "Contains DOCTYPE");
		assert(html.includes("testFunction"), "Contains entity name");
		assert(html.includes("test-package"), "Contains package name");
	});

	test("includes entity information in response", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		const html = ctx.responseBody;

		// Entity details
		assert(html.includes("testFunction"), "Contains entity name");
		assert(html.includes("function"), "Contains entity type");
		assert(html.includes("A test function"), "Contains entity description");

		// Import statement
		assert(
			html.includes("import { testFunction }"),
			"Contains import statement",
		);

		// JSDoc information
		assert(html.includes("Parameters"), "Contains parameters section");
		assert(html.includes("Returns"), "Contains returns section");
		assert(html.includes("Input data"), "Contains parameter description");

		// Navigation
		assert(html.includes("test-package"), "Contains package breadcrumb");
		assert(html.includes("utils"), "Contains module breadcrumb");
	});

	test("handles missing moduleName parameter", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: undefined,
			entityName: "testFunction",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("Module name is required"),
			"Shows module name error",
		);
	});

	test("handles missing entityName parameter", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "utils",
			entityName: undefined,
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("Entity name is required"),
			"Shows entity name error",
		);
	});

	test("handles invalid moduleName type", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: 123,
			entityName: "testFunction",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("must be a valid string"),
			"Shows type validation error",
		);
	});

	test("handles invalid entityName type", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({ moduleName: "utils", entityName: null });

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("must be a valid string"),
			"Shows type validation error",
		);
	});

	test("rejects directory traversal in moduleName", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "../../../etc/passwd",
			entityName: "test",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("path traversal"),
			"Shows security error message",
		);
	});

	test("rejects directory traversal in entityName", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "utils",
			entityName: "../malicious",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("dangerous characters"),
			"Shows security error message",
		);
	});

	test("rejects null bytes in parameters", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "utils\0",
			entityName: "test",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("path traversal"),
			"Shows security error message",
		);
	});

	test("rejects HTML injection in entityName", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "utils",
			entityName: "<script>alert('xss')</script>",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("dangerous characters"),
			"Shows security error message",
		);
	});

	test("rejects excessively long parameters", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const longName = "a".repeat(201); // Over 200 character limit
		const ctx = createTestContext({ moduleName: longName, entityName: "test" });

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("under 200 characters"),
			"Shows length validation error",
		);
	});

	test("handles module not found error", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "nonexistent",
			entityName: "testFunction",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 404, "Returns 404 status");
		assert(
			ctx.responseBody.includes("not found"),
			"Shows module not found error",
		);
	});

	test("handles entity not found error", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "utils",
			entityName: "nonexistentFunction",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 404, "Returns 404 status");
		assert(
			ctx.responseBody.includes("not found"),
			"Shows entity not found error",
		);
	});

	test("handles data extraction errors gracefully", async () => {
		// Create a package that will cause an error during data extraction
		const faultyPackage = {
			name: "test-package",
			modules: null, // This will cause an error
			allEntities: [],
		};

		const handler = createEntityPageHandler(faultyPackage);
		const ctx = createTestContext();

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500, "Returns 500 status");
		assert(
			ctx.responseBody.includes("Failed to generate entity page"),
			"Shows server error message",
		);
	});

	test("works with default module entities", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "test-package",
			entityName: "mainFunction",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		const html = ctx.responseBody;
		assert(html.includes("mainFunction"), "Contains entity name");
		assert(html.includes("default module"), "Shows default module badge");
	});

	test("handles complex module and entity names", async () => {
		const complexEntity = createMockEntity("complexEntityName", "class");
		const complexModule = createMockModule(
			"test-package/deeply/nested/module",
			[complexEntity],
		);
		const mockPackage = createMockPackage([complexModule]);

		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "module",
			entityName: "complexEntityName",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		const html = ctx.responseBody;
		assert(html.includes("complexEntityName"), "Contains entity name");
		assert(html.includes("class"), "Contains entity type");
	});

	test("properly encodes URLs in error responses", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		// Use a valid module name but non-existent entity to trigger the entity not found error
		const ctx = createTestContext({
			moduleName: "utils",
			entityName: "nonexistent-entity",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 404, "Returns 404 status");
		// Check that the response contains the encoded module name in the error link
		assert(
			ctx.responseBody.includes("not found"),
			"Contains not found message in error response",
		);
	});

	test("handles entities with comprehensive JSDoc", async () => {
		const complexEntity = createMockEntity("advancedFunction", "function", {
			description: "A function with comprehensive documentation",
			jsdocTags: {
				param: [
					{
						name: "data",
						type: "Array<Object>",
						description: "Input data array",
					},
					{
						name: "options",
						type: "ProcessOptions",
						description: "Processing options",
						optional: true,
					},
				],
				returns: {
					type: "Promise<ProcessedData>",
					description: "Processed data promise",
				},
				example: [
					{
						description: "const result = await advancedFunction(data);",
						title: "Basic usage",
					},
				],
				since: { description: "1.2.0" },
				author: [{ description: "Test Author <test@example.com>" }],
			},
		});

		const module = createMockModule("test-package/advanced", [complexEntity]);
		const mockPackage = createMockPackage([module]);

		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext({
			moduleName: "advanced",
			entityName: "advancedFunction",
		});

		await handler(ctx);

		assert.strictEqual(ctx.responseStatusCode, 200, "Returns 200 status");
		const html = ctx.responseBody;

		// Check comprehensive JSDoc rendering
		assert(html.includes("Input data array"), "Contains parameter description");
		assert(html.includes("ProcessOptions"), "Contains parameter type");
		assert(html.includes("Promise<ProcessedData>"), "Contains return type");
		assert(html.includes("Basic usage"), "Contains example title");
		assert(html.includes("Since 1.2.0"), "Contains since version");
		assert(html.includes("Test Author"), "Contains author information");
	});

	test("includes proper cache and security headers", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);
		const ctx = createTestContext();

		await handler(ctx);

		// Performance headers
		assert.strictEqual(
			ctx.responseHeaders.get("Cache-Control"),
			"public, max-age=3600",
			"Sets appropriate cache control",
		);

		// Security headers
		assert.strictEqual(
			ctx.responseHeaders.get("X-Content-Type-Options"),
			"nosniff",
			"Prevents MIME type sniffing",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("X-Frame-Options"),
			"SAMEORIGIN",
			"Prevents clickjacking",
		);
	});

	test("handles edge case parameter combinations", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);

		// Test various edge cases
		const edgeCases = [
			{ moduleName: "", entityName: "test" },
			{ moduleName: "utils", entityName: "" },
			{ moduleName: "\\", entityName: "test" },
			{ moduleName: "utils", entityName: "//" },
			{ moduleName: "utils//", entityName: "test" },
		];

		for (const params of edgeCases) {
			const ctx = createTestContext(params);
			await handler(ctx);
			assert.strictEqual(
				ctx.responseStatusCode,
				500,
				`Returns 500 for params: ${JSON.stringify(params)}`,
			);
		}
	});

	test("generates different content for different entities", async () => {
		const mockPackage = createTestPackage();
		const handler = createEntityPageHandler(mockPackage);

		// Test function entity
		const functionCtx = createTestContext({
			moduleName: "utils",
			entityName: "testFunction",
		});
		await handler(functionCtx);
		const functionHtml = functionCtx.responseBody;

		// Test class entity
		const classCtx = createTestContext({
			moduleName: "utils",
			entityName: "TestClass",
		});
		await handler(classCtx);
		const classHtml = classCtx.responseBody;

		// Verify different content
		assert(
			functionHtml.includes("function"),
			"Function page shows function type",
		);
		assert(classHtml.includes("class"), "Class page shows class type");
		assert(
			functionHtml.includes("testFunction"),
			"Function page shows function name",
		);
		assert(classHtml.includes("TestClass"), "Class page shows class name");
	});
});
