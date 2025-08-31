/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for base HTML template
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { baseTemplate } from "./base.js";

describe("baseTemplate", () => {
	const minimalOptions = {
		title: "Test Page",
		description: "Test description",
		packageName: "test-package",
		content: "<h1>Test Content</h1>",
	};

	test("generates valid HTML5 document", () => {
		const html = baseTemplate(minimalOptions);

		// Basic HTML structure
		assert(html.includes("<!DOCTYPE html>"), "Contains DOCTYPE");
		assert(html.includes('<html lang="en"'), "Contains html element with lang");
		assert(html.includes("<head>"), "Contains head element");
		assert(html.includes("<body>"), "Contains body element");
		assert(html.includes("</html>"), "Closes html element");
	});

	test("includes required meta tags", () => {
		const html = baseTemplate(minimalOptions);

		// Core meta tags
		assert(html.includes('<meta charset="UTF-8">'), "Contains charset meta");
		assert(html.includes('<meta name="viewport"'), "Contains viewport meta");
		assert(
			html.includes('<meta name="description" content="Test description">'),
			"Contains description meta",
		);
		assert(
			html.includes(
				'<meta name="generator" content="Glean Documentation Generator">',
			),
			"Contains generator meta",
		);

		// SEO meta tags
		assert(
			html.includes('<meta name="robots" content="index, follow">'),
			"Contains robots meta",
		);
	});

	test("includes Open Graph meta tags", () => {
		const html = baseTemplate(minimalOptions);

		assert(
			html.includes('<meta property="og:type" content="website">'),
			"Contains OG type",
		);
		assert(
			html.includes('<meta property="og:title" content="Test Page">'),
			"Contains OG title",
		);
		assert(
			html.includes(
				'<meta property="og:description" content="Test description">',
			),
			"Contains OG description",
		);
		assert(
			html.includes(
				'<meta property="og:site_name" content="test-package Documentation">',
			),
			"Contains OG site name",
		);
	});

	test("includes Twitter Card meta tags", () => {
		const html = baseTemplate(minimalOptions);

		assert(
			html.includes('<meta name="twitter:card" content="summary_large_image">'),
			"Contains Twitter card",
		);
		assert(
			html.includes('<meta name="twitter:title" content="Test Page">'),
			"Contains Twitter title",
		);
		assert(
			html.includes(
				'<meta name="twitter:description" content="Test description">',
			),
			"Contains Twitter description",
		);
	});

	test("constructs proper page title", () => {
		const html = baseTemplate(minimalOptions);
		assert(
			html.includes("<title>Test Page</title>"),
			"Contains constructed title",
		);

		// Without package name
		const htmlNoPackage = baseTemplate({
			...minimalOptions,
			packageName: "",
		});
		assert(
			htmlNoPackage.includes("<title>Test Page</title>"),
			"Title without package name",
		);
	});

	test("includes Bootstrap 5 assets", () => {
		const html = baseTemplate(minimalOptions);

		assert(
			html.includes('<link href="/bootstrap.min.css" rel="stylesheet">'),
			"Contains Bootstrap CSS",
		);
		assert(
			html.includes('<script src="/bootstrap.esm.js" type="module">'),
			"Contains Bootstrap JS",
		);
	});

	test("includes favicon reference", () => {
		const html = baseTemplate(minimalOptions);
		assert(
			html.includes(
				'<link rel="icon" type="image/x-icon" href="/favicon.ico">',
			),
			"Contains favicon link",
		);
	});

	test("includes main content", () => {
		const html = baseTemplate(minimalOptions);
		assert(html.includes("<h1>Test Content</h1>"), "Contains provided content");
	});

	test("includes navigation structure", () => {
		const html = baseTemplate(minimalOptions);

		// Main navigation
		assert(html.includes('<nav class="navbar'), "Contains navbar");
		assert(
			html.includes("test-package Documentation"),
			"Contains package name in brand",
		);
		assert(html.includes('href="/">Overview</a>'), "Contains Overview link");
		assert(
			html.includes('href="/modules/">Modules</a>'),
			"Contains Modules link",
		);
	});

	test("handles navigation state correctly", () => {
		const htmlWithNav = baseTemplate({
			...minimalOptions,
			navigation: { current: "modules" },
		});

		assert(
			htmlWithNav.includes("nav-link active"),
			"Marks active navigation item",
		);
		assert(
			htmlWithNav.includes('href="/modules/">Modules</a>'),
			"Contains modules link",
		);
	});

	test("includes sidebar when provided", () => {
		const htmlWithSidebar = baseTemplate({
			...minimalOptions,
			navigation: { sidebar: "<ul><li>Sidebar Item</li></ul>" },
		});

		assert(htmlWithSidebar.includes('sidebar">'), "Contains sidebar div");
		assert(
			htmlWithSidebar.includes("<li>Sidebar Item</li>"),
			"Contains sidebar content",
		);
		assert(
			htmlWithSidebar.includes("col-md-9 col-lg-10"),
			"Adjusts main content width",
		);
	});

	test("handles full-width layout without sidebar", () => {
		const html = baseTemplate(minimalOptions);

		assert(html.includes("col-12"), "Uses full width for content");
		assert(!html.includes('<div class="sidebar'), "No sidebar div in output");
	});

	test("includes footer with generation info", () => {
		const html = baseTemplate(minimalOptions);

		assert(html.includes("<footer"), "Contains footer");
		assert(html.includes("Generated"), "Contains generation info");
		assert(html.includes("Powered by Glean"), "Contains Glean reference");
	});

	test("includes custom CSS variables and styles", () => {
		const html = baseTemplate(minimalOptions);

		assert(html.includes(":root {"), "Contains CSS variables");
		assert(html.includes("--glean-primary"), "Contains primary color variable");
		assert(
			html.includes("--glean-secondary"),
			"Contains secondary color variable",
		);
		assert(html.includes(".navbar-brand"), "Contains navbar brand styles");
		assert(html.includes(".code-block"), "Contains code block styles");
	});

	test("includes interactive JavaScript features", () => {
		const html = baseTemplate(minimalOptions);

		assert(
			html.includes("Smooth scrolling for anchor links"),
			"Contains smooth scrolling",
		);
		assert(
			html.includes("Copy code block functionality"),
			"Contains copy functionality",
		);
		assert(
			html.includes("Search highlighting"),
			"Contains search highlighting",
		);
	});

	test("handles SEO options correctly", () => {
		const htmlWithSEO = baseTemplate({
			...minimalOptions,
			seo: {
				url: "https://example.com/test",
				image: "https://example.com/image.png",
			},
		});

		assert(
			htmlWithSEO.includes(
				'<link rel="canonical" href="https://example.com/test">',
			),
			"Contains canonical URL",
		);
		assert(
			htmlWithSEO.includes(
				'<meta property="og:url" content="https://example.com/test">',
			),
			"Contains OG URL",
		);
		assert(
			htmlWithSEO.includes(
				'<meta property="og:image" content="https://example.com/image.png">',
			),
			"Contains OG image",
		);
		assert(
			htmlWithSEO.includes(
				'<meta name="twitter:image" content="https://example.com/image.png">',
			),
			"Contains Twitter image",
		);
	});

	test("responsive design classes present", () => {
		const html = baseTemplate(minimalOptions);

		assert(html.includes("container-fluid"), "Contains responsive container");
		assert(html.includes("navbar-expand-lg"), "Contains responsive navbar");
		assert(
			html.includes("@media (max-width: 768px)"),
			"Contains mobile styles",
		);
	});

	test("accessibility features included", () => {
		const html = baseTemplate(minimalOptions);
		assert(
			html.includes("data-bs-toggle"),
			"Contains Bootstrap toggles for screen readers",
		);
	});
});
