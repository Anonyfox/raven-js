/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for entity card components
 *
 * Validates Bootstrap card patterns and responsive behavior.
 * Ensures 100% branch coverage for entity display variations.
 */

import { ok } from "node:assert";
import { describe, test } from "node:test";
import { entityCard, moduleCard } from "./entity-card.js";

describe("entityCard component", () => {
	test("generates minimal entity card", () => {
		const entity = {
			name: "testFunction",
			type: "function",
			link: "/api/test",
		};

		const result = entityCard(entity);

		ok(result.includes('<div class="card border h-100">'));
		ok(
			result.includes(
				'<a href="/api/test" class="text-decoration-none">testFunction</a>',
			),
		);
		ok(result.includes('<span class="badge bg-primary">function</span>'));
	});

	test("generates entity card with description", () => {
		const entity = {
			name: "addClass",
			type: "function",
			description: "Adds CSS class to element",
			link: "/api/addClass",
		};

		const result = entityCard(entity);

		ok(result.includes("Adds CSS class to element"));
		ok(result.includes('class="card-text text-muted small mb-0 flex-grow-1"'));
	});

	test("handles entity without description", () => {
		const entity = {
			name: "test",
			type: "class",
			link: "/test",
		};

		const result = entityCard(entity);

		ok(result.includes("No description available"));
		ok(result.includes("fst-italic"));
	});

	test("generates badges for different entity types", () => {
		const testCases = [
			{ type: "class", variant: "success" },
			{ type: "interface", variant: "warning" },
			{ type: "enum", variant: "secondary" },
			{ type: "unknown", variant: "secondary" },
		];

		testCases.forEach(({ type, variant }) => {
			const entity = { name: "test", type, link: "/test" };
			const result = entityCard(entity);
			ok(result.includes(`bg-${variant}`));
		});
	});

	test("includes custom badges", () => {
		const entity = {
			name: "test",
			type: "function",
			link: "/test",
			badges: [
				{ text: "deprecated", variant: "warning" },
				{ text: "experimental", variant: "info" },
			],
		};

		const result = entityCard(entity);

		ok(result.includes('<span class="badge bg-warning">deprecated</span>'));
		ok(result.includes('<span class="badge bg-info">experimental</span>'));
	});

	test("shows location information when provided", () => {
		const entity = {
			name: "test",
			type: "function",
			link: "/test",
			location: { file: "utils.js", line: 42 },
		};

		const result = entityCard(entity);

		ok(result.includes("utils.js:42"));
	});

	test("handles light variant badges correctly", () => {
		const entity = {
			name: "test",
			type: "variable",
			link: "/test",
		};

		const result = entityCard(entity);

		ok(result.includes("bg-light"));
		ok(result.includes("text-dark"));
	});

	test("can disable footer", () => {
		const entity = {
			name: "test",
			type: "function",
			link: "/test",
			showFooter: false,
		};

		const result = entityCard(entity);

		ok(!result.includes("card-footer"));
		ok(!result.includes("View Details"));
	});
});

describe("moduleCard component", () => {
	test("generates minimal module card", () => {
		const module = {
			name: "utils",
			importPath: "lib/utils",
			publicEntityCount: 5,
			entityTypes: ["function"],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes('<div class="card border-0 shadow-sm h-100">'));
		ok(
			result.includes(
				'<a href="/modules/utils/" class="text-decoration-none">',
			),
		);
		ok(result.includes('<span class="badge bg-secondary">5</span>'));
	});

	test("shows default module badge", () => {
		const module = {
			name: "index",
			importPath: "lib/index",
			isDefault: true,
			publicEntityCount: 3,
			entityTypes: [],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes('<span class="badge bg-primary me-2">default</span>'));
	});

	test("displays module description", () => {
		const module = {
			name: "core",
			importPath: "lib/core",
			description: "Core functionality",
			publicEntityCount: 8,
			entityTypes: [],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes("Core functionality"));
	});

	test("shows README preview when available", () => {
		const module = {
			name: "docs",
			importPath: "lib/docs",
			readmePreview: "This module provides documentation utilities",
			publicEntityCount: 2,
			entityTypes: [],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes("This module provides documentation utilities"));
		ok(result.includes("bg-light p-2 rounded"));
	});

	test("handles long README preview with truncation", () => {
		const longText = "x".repeat(250);
		const module = {
			name: "test",
			importPath: "lib/test",
			readmePreview: longText,
			publicEntityCount: 1,
			entityTypes: [],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes('<small class="text-muted">...</small>'));
	});

	test("shows entity types when available", () => {
		const module = {
			name: "mixed",
			importPath: "lib/mixed",
			publicEntityCount: 6,
			entityTypes: ["function", "class", "interface"],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes("Available Types:"));
		ok(
			result.includes(
				'<span class="badge bg-light text-dark me-1 mb-1">function</span>',
			),
		);
		ok(
			result.includes(
				'<span class="badge bg-light text-dark me-1 mb-1">class</span>',
			),
		);
	});

	test("displays sample entities", () => {
		const module = {
			name: "api",
			importPath: "lib/api",
			publicEntityCount: 4,
			entityTypes: ["function"],
			sampleEntities: [
				{ name: "fetch", type: "function", description: "Fetch data from API" },
				{ name: "post", type: "function" },
			],
		};

		const result = moduleCard(module);

		ok(result.includes("Featured APIs:"));
		ok(result.includes("fetch"));
		ok(result.includes("Fetch data from API"));
		ok(result.includes("post"));
	});

	test("handles empty state when no documentation", () => {
		const module = {
			name: "empty",
			importPath: "lib/empty",
			publicEntityCount: 0,
			entityTypes: [],
			sampleEntities: [],
		};

		const result = moduleCard(module);

		ok(result.includes("No documentation available"));
		ok(result.includes("No public entities available"));
	});

	test("always shows explore module button", () => {
		const moduleWithAPIs = {
			name: "test",
			importPath: "lib/test",
			publicEntityCount: 3,
			entityTypes: [],
			sampleEntities: [],
		};

		const result1 = moduleCard(moduleWithAPIs);
		ok(result1.includes("📖 Explore Module"));

		const moduleWithoutAPIs = {
			name: "empty",
			importPath: "lib/empty",
			publicEntityCount: 0,
			entityTypes: [],
			sampleEntities: [],
		};

		const result2 = moduleCard(moduleWithoutAPIs);
		ok(result2.includes("📖 Explore Module"));
		ok(!result2.includes("🔍")); // No search links at all
	});
});
