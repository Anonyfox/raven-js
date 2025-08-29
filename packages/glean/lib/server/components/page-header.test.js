/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for page header component
 *
 * Validates Bootstrap class usage and semantic markup generation.
 * Ensures 100% branch coverage for all component variations.
 */

import { ok } from "node:assert";
import { describe, test } from "node:test";
import { pageHeader } from "./page-header.js";

describe("pageHeader component", () => {
	test("generates minimal header with title only", () => {
		const result = pageHeader({ title: "Test Page" });

		ok(
			result.includes(
				'<h1 class="display-5 fw-bold text-primary mb-0">Test Page</h1>',
			),
		);
		ok(
			result.includes(
				'class="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4"',
			),
		);
	});

	test("generates header with breadcrumbs", () => {
		const breadcrumbs = [
			{ href: "/", text: "Home" },
			{ href: "/docs", text: "Docs" },
			{ text: "Current", active: true },
		];

		const result = pageHeader({ title: "Test", breadcrumbs });

		ok(result.includes('<nav aria-label="breadcrumb" class="mb-3">'));
		ok(result.includes('<ol class="breadcrumb">'));
		ok(result.includes('<a href="/" class="text-decoration-none">Home</a>'));
		ok(result.includes('class="breadcrumb-item active"'));
		ok(result.includes("Current"));
	});

	test("generates header with badges", () => {
		const badges = [
			{ text: "v1.0", variant: "primary" },
			{ text: "stable", variant: "success" },
		];

		const result = pageHeader({ title: "API", badges });

		ok(result.includes('<span class="badge bg-primary fs-6">v1.0</span>'));
		ok(result.includes('<span class="badge bg-success fs-6">stable</span>'));
	});

	test("generates header with subtitle and description", () => {
		const result = pageHeader({
			title: "Documentation",
			subtitle: "API Reference",
			description: "Complete API documentation",
		});

		ok(result.includes('<p class="lead text-muted mb-2">API Reference</p>'));
		ok(
			result.includes(
				'<div class="text-muted mb-0">Complete API documentation</div>',
			),
		);
	});

	test("handles empty breadcrumbs array", () => {
		const result = pageHeader({ title: "Test", breadcrumbs: [] });

		ok(!result.includes('<nav aria-label="breadcrumb"'));
		ok(
			result.includes(
				'<h1 class="display-5 fw-bold text-primary mb-0">Test</h1>',
			),
		);
	});

	test("handles undefined optional parameters", () => {
		const result = pageHeader({ title: "Test" });

		ok(result.includes("Test"));
		ok(!result.includes("undefined"));
		ok(!result.includes('<nav aria-label="breadcrumb"'));
	});

	test("preserves Bootstrap utility classes", () => {
		const result = pageHeader({ title: "Test" });

		// Verify key Bootstrap classes are present
		ok(result.includes("display-5"));
		ok(result.includes("fw-bold"));
		ok(result.includes("text-primary"));
		ok(result.includes("d-flex"));
		ok(result.includes("align-items-start"));
		ok(result.includes("justify-content-between"));
		ok(result.includes("flex-wrap"));
		ok(result.includes("gap-3"));
		ok(result.includes("mb-4"));
	});
});
