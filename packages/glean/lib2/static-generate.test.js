/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generateStaticSite } from "./static-generate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("generateStaticSite creates complete static documentation", async () => {
	// Use beak package as test target (known good package structure)
	const beakPath = path.resolve(__dirname, "../../beak");
	const outputPath = path.join(__dirname, "test-output");

	// Clean up any existing test output
	await fs.promises.rm(outputPath, { recursive: true, force: true });

	// Generate static site
	const stats = await generateStaticSite(beakPath, outputPath, {
		domain: "test.example.com",
	});

	// Verify statistics
	assert(stats.totalFiles > 0, "Should generate at least one file");
	assert(stats.totalBytes > 0, "Should generate non-empty content");
	assert(
		typeof stats.generatedAt === "string",
		"Should include generation timestamp",
	);

	// Verify directory structure exists
	const outputExists = await fs.promises
		.access(outputPath)
		.then(() => true)
		.catch(() => false);
	assert(outputExists, "Output directory should exist");

	// Verify root index.html exists
	const rootIndexPath = path.join(outputPath, "index.html");
	const rootIndexExists = await fs.promises
		.access(rootIndexPath)
		.then(() => true)
		.catch(() => false);
	assert(rootIndexExists, "Root index.html should exist");

	// Verify root index.html contains HTML content
	const rootContent = await fs.promises.readFile(rootIndexPath, "utf8");
	assert(
		rootContent.includes("<!DOCTYPE html>"),
		"Root index should contain HTML",
	);
	assert(
		rootContent.includes("beak"),
		"Root index should contain package name",
	);

	// Verify modules directory exists
	const modulesIndexPath = path.join(outputPath, "modules", "index.html");
	const modulesIndexExists = await fs.promises
		.access(modulesIndexPath)
		.then(() => true)
		.catch(() => false);
	assert(modulesIndexExists, "Modules index.html should exist");

	// Verify modules index contains HTML
	const modulesContent = await fs.promises.readFile(modulesIndexPath, "utf8");
	assert(
		modulesContent.includes("<!DOCTYPE html>"),
		"Modules index should contain HTML",
	);

	// Verify sitemap.xml exists
	const sitemapPath = path.join(outputPath, "sitemap.xml");
	const sitemapExists = await fs.promises
		.access(sitemapPath)
		.then(() => true)
		.catch(() => false);
	assert(sitemapExists, "sitemap.xml should exist");

	// Verify sitemap contains XML
	const sitemapContent = await fs.promises.readFile(sitemapPath, "utf8");
	assert(sitemapContent.includes("<?xml"), "Sitemap should contain XML");
	assert(
		sitemapContent.includes("test.example.com"),
		"Sitemap should use provided domain",
	);

	// Verify static assets are copied
	const faviconPath = path.join(outputPath, "favicon.ico");
	const faviconExists = await fs.promises
		.access(faviconPath)
		.then(() => true)
		.catch(() => false);
	assert(faviconExists, "Static assets like favicon.ico should be copied");

	// Clean up test output
	await fs.promises.rm(outputPath, { recursive: true, force: true });
});

test("generateStaticSite handles missing static assets gracefully", async () => {
	const beakPath = path.resolve(__dirname, "../../beak");
	const outputPath = path.join(__dirname, "test-output-no-assets");

	// Clean up any existing test output
	await fs.promises.rm(outputPath, { recursive: true, force: true });

	// Generate static site (this should work even if assets fail)
	const stats = await generateStaticSite(beakPath, outputPath);

	// Should still generate HTML files successfully
	assert(stats.totalFiles > 0, "Should generate files even without assets");

	// Verify root index.html exists
	const rootIndexPath = path.join(outputPath, "index.html");
	const rootIndexExists = await fs.promises
		.access(rootIndexPath)
		.then(() => true)
		.catch(() => false);
	assert(rootIndexExists, "Should still generate HTML files");

	// Clean up test output
	await fs.promises.rm(outputPath, { recursive: true, force: true });
});

test("generateStaticSite validates input parameters", async () => {
	const outputPath = path.join(__dirname, "test-invalid");

	// Test missing packagePath
	await assert.rejects(
		() => generateStaticSite("", outputPath),
		/packagePath is required/,
		"Should reject empty packagePath",
	);

	// Test missing outputPath
	await assert.rejects(
		() => generateStaticSite("/some/path", ""),
		/outputPath is required/,
		"Should reject empty outputPath",
	);

	// Test invalid packagePath type
	await assert.rejects(
		() => generateStaticSite(null, outputPath),
		/packagePath is required/,
		"Should reject null packagePath",
	);
});
