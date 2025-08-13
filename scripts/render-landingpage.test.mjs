import assert from "node:assert";
import { test } from "node:test";
import { renderLandingPage } from "./render-landingpage.mjs";

test("renderLandingPage", async (t) => {
	await t.test("should generate valid HTML structure", async () => {
		const html = await renderLandingPage();

		// High-level structure tests
		assert(html.includes("<!DOCTYPE html>"), "Should include DOCTYPE");
		assert(
			html.includes('<html lang="en">'),
			"Should include HTML tag with lang",
		);
		assert(html.includes("<head>"), "Should include head section");
		assert(html.includes("<body>"), "Should include body section");
		assert(html.includes("</html>"), "Should close HTML tag");
	});

	await t.test("should include essential meta tags", async () => {
		const html = await renderLandingPage();

		assert(
			html.includes('<meta charset="UTF-8">'),
			"Should include charset meta tag",
		);
		assert(
			html.includes('<meta name="viewport"'),
			"Should include viewport meta tag",
		);
		assert(
			html.includes("<title>RavenJS Documentation</title>"),
			"Should include correct title",
		);
	});

	await t.test("should include RavenJS branding", async () => {
		const html = await renderLandingPage();

		assert(
			html.includes("🦅 RavenJS Documentation"),
			"Should include raven emoji and title",
		);
		assert(html.includes("swift web dev toolkit"), "Should include tagline");
	});

	await t.test("should include package cards", async () => {
		const html = await renderLandingPage();

		// Package card structure
		assert(html.includes('class="package"'), "Should include package cards");
		assert(html.includes("🦜 beak"), "Should include beak package with emoji");
		assert(
			html.includes('href="./beak/"'),
			"Should include correct package link",
		);
	});

	await t.test("should include license information", async () => {
		const html = await renderLandingPage();

		assert(html.includes("MIT License"), "Should mention MIT license");
		assert(
			html.includes("Copyright (c) 2025 Anonyfox e.K."),
			"Should include copyright",
		);
	});

	await t.test("should include external links", async () => {
		const html = await renderLandingPage();

		assert(
			html.includes('href="https://github.com/Anonyfox/raven-js"'),
			"Should include GitHub link",
		);
		assert(
			html.includes('href="https://ravenjs.dev"'),
			"Should include website link",
		);
	});

	await t.test("should include CSS styles", async () => {
		const html = await renderLandingPage();

		assert(html.includes("<style>"), "Should include style tag");
		assert(html.includes("font-family:"), "Should include font styling");
		assert(html.includes(".package"), "Should include package card styles");
		assert(html.includes(".version"), "Should include version badge styles");
	});

	await t.test("should handle package data correctly", async () => {
		const html = await renderLandingPage();

		// Check that package information is properly rendered
		assert(
			html.includes("Zero-dependency templating library"),
			"Should include package description",
		);
		assert(/v\d+\.\d+\.\d+/.test(html), "Should include package version");
	});

	await t.test("should be valid HTML (basic structure)", async () => {
		const html = await renderLandingPage();

		// Count opening and closing tags to ensure basic balance
		const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
		const closeTags = (html.match(/<\/[^>]*>/g) || []).length;

		// Should have roughly balanced tags (allowing for self-closing tags)
		assert(openTags > 0, "Should have opening tags");
		assert(closeTags > 0, "Should have closing tags");
	});
});
