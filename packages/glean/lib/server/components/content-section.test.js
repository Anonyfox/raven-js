/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for content section components
 *
 * Validates Bootstrap content organization and responsive behavior.
 * Ensures 100% branch coverage for content layout variations.
 */

import { ok } from "node:assert";
import { describe, test } from "node:test";
import {
	cardGrid,
	codeBlock,
	contentSection,
	gettingStarted,
	tableSection,
} from "./content-section.js";

describe("contentSection component", () => {
	test("generates section with title", () => {
		const result = contentSection({
			title: "API Reference",
			icon: "📚",
			content: "<p>Content here</p>",
		});

		ok(result.includes('class="card mb-4"'));
		ok(result.includes('class="card-header bg-white border-bottom"'));
		ok(result.includes('<h3 class="h5 mb-0">📚 API Reference</h3>'));
		ok(result.includes("<p>Content here</p>"));
	});

	test("generates section without title", () => {
		const result = contentSection({
			content: "<div>Simple content</div>",
		});

		ok(result.includes("<div>Simple content</div>"));
		ok(!result.includes("card-header"));
	});

	test("removes padding when noPadding is true", () => {
		const result = contentSection({
			content: "<table>Table content</table>",
			noPadding: true,
		});

		ok(result.includes('class="card-body p-0"'));
	});

	test("uses custom header variant", () => {
		const result = contentSection({
			title: "Important",
			content: "Test",
			headerVariant: "primary",
		});

		ok(result.includes("bg-primary"));
	});
});

describe("codeBlock component", () => {
	test("generates basic code block", () => {
		const result = codeBlock({
			code: "console.log('hello');",
		});

		ok(result.includes('class="position-relative"'));
		ok(result.includes('<pre class="bg-light border rounded p-3 mb-0">'));
		ok(
			result.includes(
				"<code class=\"language-javascript\">console.log('hello');</code>",
			),
		);
		ok(result.includes("📋"));
	});

	test("includes title when provided", () => {
		const result = codeBlock({
			code: "const x = 1;",
			title: "Example Code",
		});

		ok(result.includes('<h6 class="fw-bold mb-3">Example Code</h6>'));
	});

	test("uses custom language", () => {
		const result = codeBlock({
			code: "SELECT * FROM users;",
			language: "sql",
		});

		ok(result.includes('class="language-sql"'));
	});

	test("disables copy button when showCopy is false", () => {
		const result = codeBlock({
			code: "test",
			showCopy: false,
		});

		ok(!result.includes("📋"));
		ok(!result.includes("copyToClipboard"));
	});

	test("escapes backticks in code", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: testing template literal escaping
		const codeWithBackticks = "const template = `hello ${name}`;";
		const result = codeBlock({
			code: codeWithBackticks,
		});

		// Should escape backticks for the onclick handler
		ok(result.includes("\\`"));
	});
});

describe("tableSection component", () => {
	test("generates basic table", () => {
		const headers = ["Name", "Type", "Description"];
		const rows = [
			["id", "string", "Unique identifier"],
			["name", "string", "Display name"],
		];

		const result = tableSection({ headers, rows });

		ok(result.includes('class="table-responsive"'));
		ok(result.includes('class="table table-striped mb-0"'));
		ok(result.includes('<thead class="table-light">'));
		ok(result.includes("<th>Name</th>"));
		ok(result.includes("<td>id</td>"));
	});

	test("disables stripes when striped is false", () => {
		const result = tableSection({
			headers: ["Col1"],
			rows: [["Data1"]],
			striped: false,
		});

		ok(result.includes('class="table  mb-0"'));
		ok(!result.includes("table-striped"));
	});

	test("disables responsive wrapper when responsive is false", () => {
		const result = tableSection({
			headers: ["Col1"],
			rows: [["Data1"]],
			responsive: false,
		});

		ok(!result.includes("table-responsive"));
		ok(result.includes('<table class="table table-striped mb-0">'));
	});
});

describe("cardGrid component", () => {
	test("generates responsive grid", () => {
		const items = [
			"<div>Card 1</div>",
			"<div>Card 2</div>",
			"<div>Card 3</div>",
		];

		const result = cardGrid({ items });

		ok(result.includes('class="row g-4"'));
		ok(result.includes('class="col-md-6 col-lg-4 col-xl-3"'));
		ok(result.includes("<div>Card 1</div>"));
		ok(result.includes("<div>Card 2</div>"));
	});

	test("uses custom column size", () => {
		const items = ["<div>Item</div>"];

		const result = cardGrid({ items, columns: 6 });

		ok(result.includes("col-lg-6"));
	});

	test("uses custom gap", () => {
		const items = ["<div>Item</div>"];

		const result = cardGrid({ items, gap: "g-2" });

		ok(result.includes('class="row g-2"'));
	});

	test("limits XL columns to maximum of 3", () => {
		const items = ["<div>Item</div>"];

		const result = cardGrid({ items, columns: 2 });

		ok(result.includes("col-xl-2"));

		const result2 = cardGrid({ items, columns: 1 });

		ok(result2.includes("col-xl-1"));
	});
});

describe("gettingStarted component", () => {
	test("generates getting started section", () => {
		const result = gettingStarted({
			packageName: "@test/package",
		});

		ok(result.includes('class="card border-primary"'));
		ok(result.includes('class="card-header bg-primary text-white"'));
		ok(result.includes('<h4 class="mb-0">🚀 Getting Started</h4>'));
		ok(result.includes("npm install @test/package"));
		ok(result.includes("import { ... } from '@test/package';"));
	});

	test("includes action buttons when provided", () => {
		const actions = [
			{ href: "/docs", text: "📋 Documentation" },
			{ href: "/modules/", text: "🗂️ Modules", variant: "secondary" },
		];

		const result = gettingStarted({
			packageName: "test-pkg",
			actions,
		});

		ok(result.includes("Quick Navigation"));
		ok(
			result.includes(
				'<a href="/docs" class="btn btn-outline-primary btn-sm">📋 Documentation</a>',
			),
		);
		ok(
			result.includes(
				'<a href="/modules/" class="btn btn-secondary btn-sm">🗂️ Modules</a>',
			),
		);
	});

	test("works without actions", () => {
		const result = gettingStarted({
			packageName: "simple-pkg",
		});

		ok(result.includes("simple-pkg"));
		ok(!result.includes("Quick Navigation"));
	});

	test("handles empty actions array", () => {
		const result = gettingStarted({
			packageName: "empty-actions",
			actions: [],
		});

		ok(result.includes("empty-actions"));
		ok(!result.includes("Quick Navigation"));
	});
});
