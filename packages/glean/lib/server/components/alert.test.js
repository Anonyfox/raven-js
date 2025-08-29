/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for alert components
 *
 * Validates Bootstrap alert patterns and accessibility.
 * Ensures 100% branch coverage for alert variations.
 */

import { ok } from "node:assert";
import { describe, test } from "node:test";
import { alert, deprecationAlert, emptyState } from "./alert.js";

describe("alert component", () => {
	test("generates basic alert", () => {
		const result = alert({
			variant: "info",
			message: "This is an info message",
		});

		ok(result.includes('class="alert alert-info  d-flex align-items-center"'));
		ok(result.includes('role="alert"'));
		ok(result.includes("This is an info message"));
		ok(result.includes('class="flex-grow-1"'));
	});

	test("includes icon when provided", () => {
		const result = alert({
			variant: "warning",
			icon: "⚠️",
			message: "Warning message",
		});

		ok(result.includes('<span class="fs-4 me-2">⚠️</span>'));
	});

	test("includes title when provided", () => {
		const result = alert({
			variant: "success",
			title: "Success!",
			message: "Operation completed",
		});

		ok(result.includes('<h6 class="alert-heading mb-1">Success!</h6>'));
	});

	test("generates dismissible alert", () => {
		const result = alert({
			variant: "danger",
			message: "Error occurred",
			dismissible: true,
		});

		ok(result.includes("alert-dismissible"));
		ok(
			result.includes(
				'<button type="button" class="btn-close" data-bs-dismiss="alert"',
			),
		);
		ok(result.includes('aria-label="Close"'));
	});

	test("handles all Bootstrap alert variants", () => {
		const variants = [
			"primary",
			"secondary",
			"success",
			"danger",
			"warning",
			"info",
			"light",
			"dark",
		];

		variants.forEach((variant) => {
			const result = alert({ variant, message: "test" });
			ok(result.includes(`alert-${variant}`));
		});
	});
});

describe("deprecationAlert component", () => {
	test("generates deprecation warning", () => {
		const result = deprecationAlert({
			reason: "Use newFunction() instead",
		});

		ok(result.includes("alert-warning"));
		ok(result.includes("⚠️"));
		ok(result.includes("Deprecated API"));
		ok(result.includes("Use newFunction() instead"));
	});

	test("includes version information when provided", () => {
		const result = deprecationAlert({
			reason: "Function removed",
			since: "v2.0.0",
		});

		ok(result.includes("Since version v2.0.0"));
		ok(result.includes("text-muted"));
	});

	test("works without version", () => {
		const result = deprecationAlert({
			reason: "No longer supported",
		});

		ok(result.includes("No longer supported"));
		ok(!result.includes("Since version"));
	});
});

describe("emptyState component", () => {
	test("generates basic empty state", () => {
		const result = emptyState({
			icon: "📭",
			title: "No Data",
			message: "Nothing to show here",
		});

		ok(result.includes('class="text-center py-5"'));
		ok(result.includes('class="display-1 mb-3"'));
		ok(result.includes("📭"));
		ok(result.includes('<h3 class="text-muted mb-3">No Data</h3>'));
		ok(result.includes('<p class="text-muted mb-4">Nothing to show here</p>'));
	});

	test("includes action buttons when provided", () => {
		const actions = [
			{ href: "/create", text: "Create New" },
			{ href: "/import", text: "Import Data", variant: "secondary" },
		];

		const result = emptyState({
			icon: "📂",
			title: "Empty",
			message: "No items",
			actions,
		});

		ok(
			result.includes('class="d-flex gap-2 justify-content-center flex-wrap"'),
		);
		ok(
			result.includes(
				'<a href="/create" class="btn btn-outline-primary">Create New</a>',
			),
		);
		ok(
			result.includes(
				'<a href="/import" class="btn btn-secondary">Import Data</a>',
			),
		);
	});

	test("works without actions", () => {
		const result = emptyState({
			icon: "🔍",
			title: "Not Found",
			message: "No results",
		});

		ok(result.includes("Not Found"));
		ok(!result.includes("d-flex gap-2"));
		ok(!result.includes("btn"));
	});

	test("handles empty actions array", () => {
		const result = emptyState({
			icon: "⭐",
			title: "Empty",
			message: "Test",
			actions: [],
		});

		ok(result.includes("Empty"));
		ok(!result.includes("btn"));
	});
});
