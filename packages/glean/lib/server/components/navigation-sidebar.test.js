/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for navigation sidebar components
 *
 * Validates Bootstrap navigation patterns and active states.
 * Ensures 100% branch coverage for navigation variations.
 */

import { ok } from "node:assert";
import { describe, test } from "node:test";
import {
	entityNavigation,
	moduleNavigation,
	quickActions,
	statsSidebar,
} from "./navigation-sidebar.js";

describe("moduleNavigation component", () => {
	test("generates module navigation with default title", () => {
		const modules = [
			{
				name: "core",
				link: "/modules/core/",
				entityCount: 5,
				fullImportPath: "lib/core",
			},
			{
				name: "utils",
				link: "/modules/utils/",
				entityCount: 3,
				fullImportPath: "lib/utils",
			},
		];

		const result = moduleNavigation({ modules });

		ok(result.includes('<h5 class="mb-0">🗂️ All Modules</h5>'));
		ok(result.includes('class="list-group list-group-flush"'));
		ok(result.includes('<a href="/modules/core/"'));
		ok(result.includes('<span class="badge bg-secondary">5</span>'));
	});

	test("shows current module as active", () => {
		const modules = [
			{
				name: "core",
				link: "/modules/core/",
				entityCount: 5,
				fullImportPath: "lib/core",
				isCurrent: true,
			},
			{
				name: "utils",
				link: "/modules/utils/",
				entityCount: 3,
				fullImportPath: "lib/utils",
			},
		];

		const result = moduleNavigation({ modules });

		ok(
			result.includes(
				'class="list-group-item list-group-item-action d-flex justify-content-between align-items-center active"',
			),
		);
		ok(result.includes('<span class="badge bg-light text-dark">5</span>'));
	});

	test("handles default module badge", () => {
		const modules = [
			{
				name: "index",
				link: "/modules/index/",
				entityCount: 2,
				isDefault: true,
				fullImportPath: "lib/index",
			},
		];

		const result = moduleNavigation({ modules });

		ok(result.includes('<span class="badge bg-primary me-2">default</span>'));
	});

	test("uses custom title when provided", () => {
		const modules = [];
		const result = moduleNavigation({ modules, title: "Custom Navigation" });

		ok(result.includes("Custom Navigation"));
	});

	test("supports currentModule string matching", () => {
		const modules = [
			{
				name: "core",
				link: "/modules/core/",
				entityCount: 5,
				fullImportPath: "lib/core",
			},
		];

		const result = moduleNavigation({ modules, currentModule: "core" });

		ok(result.includes("active"));
	});
});

describe("entityNavigation component", () => {
	test("generates entity navigation list", () => {
		const entities = [
			{ name: "fetch", type: "function", link: "/api/fetch/" },
			{
				name: "ApiClient",
				type: "class",
				link: "/api/ApiClient/",
				isCurrent: true,
			},
		];

		const result = entityNavigation({ entities });

		ok(result.includes('<h5 class="mb-0">🗂️ Module APIs</h5>'));
		ok(result.includes('<div class="fw-medium">fetch</div>'));
		ok(result.includes('<div class="small text-muted">function</div>'));
		ok(result.includes("active"));
		ok(
			result.includes('<span class="badge bg-light text-dark">current</span>'),
		);
	});

	test("uses custom title", () => {
		const entities = [];
		const result = entityNavigation({ entities, title: "Entity List" });

		ok(result.includes("Entity List"));
	});

	test("supports currentEntity string matching", () => {
		const entities = [{ name: "test", type: "function", link: "/api/test/" }];

		const result = entityNavigation({ entities, currentEntity: "test" });

		ok(result.includes("active"));
	});
});

describe("quickActions component", () => {
	test("generates action buttons with default variants", () => {
		const actions = [
			{ href: "/modules/", text: "Browse Modules" },
			{ href: "/api/", text: "API Reference", variant: "secondary" },
		];

		const result = quickActions({ actions });

		ok(result.includes('<h5 class="mb-0">🚀 Quick Actions</h5>'));
		ok(result.includes('class="d-grid gap-2"'));
		ok(result.includes('<a href="/modules/" class="btn btn-outline-primary">'));
		ok(result.includes('<a href="/api/" class="btn btn-secondary">'));
		ok(result.includes("Browse Modules"));
	});

	test("includes icons in actions", () => {
		const actions = [{ href: "/home", text: "Home", icon: "🏠" }];

		const result = quickActions({ actions });

		ok(result.includes("🏠 Home"));
	});

	test("uses custom title", () => {
		const actions = [];
		const result = quickActions({ actions, title: "Custom Actions" });

		ok(result.includes("Custom Actions"));
	});
});

describe("statsSidebar component", () => {
	test("generates stats in grid layout", () => {
		const stats = [
			{ value: 5, label: "Modules", variant: "primary" },
			{ value: 42, label: "APIs", variant: "success" },
			{ value: "100%", label: "Coverage", variant: "info" },
		];

		const result = statsSidebar({ stats });

		ok(result.includes('<h6 class="mb-0">📊 Statistics</h6>'));
		ok(result.includes('class="row g-3 text-center"'));
		ok(result.includes('<div class="fw-bold text-primary">5</div>'));
		ok(result.includes('<div class="small text-muted">Modules</div>'));
		ok(result.includes('class="col-6"'));
	});

	test("uses default variant when none specified", () => {
		const stats = [{ value: 10, label: "Default" }];

		const result = statsSidebar({ stats });

		ok(result.includes("text-primary"));
	});

	test("uses custom title", () => {
		const stats = [];
		const result = statsSidebar({ stats, title: "Custom Stats" });

		ok(result.includes("Custom Stats"));
	});
});
