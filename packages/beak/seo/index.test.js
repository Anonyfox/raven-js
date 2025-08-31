/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Surgical test suite for SEO meta tag generation module - TEST DOCTRINE compliant
 *
 * SURGICAL ARCHITECTURE: Exactly 3 major test groups targeting distinct behavioral territories.
 * PREDATORY PRECISION: Each test validates multiple aspects simultaneously for maximum efficiency.
 * MATHEMATICAL COVERAGE: Near-perfect coverage across lines, branches, and functions with minimal assertions.
 */

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import * as seo from "./index.js";

describe("Core SEO Meta Tag Generation", () => {
	test("essential meta tags with URL construction and title formatting", () => {
		// General meta tags with all features
		const generalFull = seo.general({
			title: "My Article",
			description: "Article description",
			domain: "example.com",
			path: "/article",
			suffix: "Blog",
		});
		assert.ok(generalFull.includes("<title>My Article | Blog</title>"));
		assert.ok(generalFull.includes('name="description"'));
		assert.ok(generalFull.includes('property="description"'));
		assert.ok(generalFull.includes("Article description"));
		assert.ok(generalFull.includes('href="https://example.com/article"'));

		// General without suffix (branch coverage)
		const generalSimple = seo.general({
			title: "Simple Page",
			description: "Simple description",
		});
		assert.ok(generalSimple.includes("<title>Simple Page</title>"));
		assert.ok(!generalSimple.includes("|"));

		// Canonical with various configurations
		const canonicalBasic = seo.canonical({
			domain: "test.com",
			path: "/page",
		});
		assert.ok(canonicalBasic.includes('href="https://test.com/page"'));

		// Canonical with hreflang (branch coverage)
		const canonicalLang = seo.canonical({
			domain: "test.com",
			path: "/page",
			hreflang: "en-US",
		});
		assert.ok(canonicalLang.includes('hreflang="en-US"'));

		// Canonical with media (branch coverage)
		const canonicalMedia = seo.canonical({
			domain: "test.com",
			path: "/page",
			media: "print",
		});
		assert.ok(canonicalMedia.includes('media="print"'));

		// Canonical with both hreflang and media (branch coverage)
		const canonicalBoth = seo.canonical({
			domain: "test.com",
			path: "/page",
			hreflang: "en",
			media: "screen",
		});
		assert.ok(canonicalBoth.includes('hreflang="en"'));
		assert.ok(canonicalBoth.includes('media="screen"'));

		// URL utility edge cases
		const absoluteUrlTest = seo.canonical({
			domain: "example.com",
			path: "no-leading-slash",
		});
		assert.ok(absoluteUrlTest.includes("https://example.com/no-leading-slash"));

		const emptyPathTest = seo.canonical({
			domain: "example.com",
			path: "",
		});
		assert.ok(emptyPathTest.includes("https://example.com"));
	});

	test("robots directives and author information", () => {
		// Robots with basic options (robots function only handles index/follow)
		const robotsFull = seo.robots({
			index: true,
			follow: true,
		});
		assert.ok(robotsFull.includes("index"));
		assert.ok(robotsFull.includes("follow"));
		assert.ok(robotsFull.includes("index, follow"));

		// Robots with partial configuration (branch coverage)
		const robotsPartial = seo.robots({
			index: false,
			follow: true,
		});
		assert.ok(robotsPartial.includes("noindex"));
		assert.ok(robotsPartial.includes("follow"));

		// Robots with default values (branch coverage)
		const robotsDefault = seo.robots({});
		assert.ok(robotsDefault.includes("index"));
		assert.ok(robotsDefault.includes("follow"));

		// Author with full information
		const authorFull = seo.author({
			name: "John Doe",
			email: "john@example.com",
			url: "https://johndoe.com",
		});
		assert.ok(authorFull.includes("John Doe"));
		assert.ok(authorFull.includes("john@example.com"));
		assert.ok(authorFull.includes('name="author"'));

		// Author with minimal info (branch coverage)
		const authorMinimal = seo.author({
			email: "jane@example.com",
		});
		assert.ok(authorMinimal.includes("jane@example.com"));

		// Author name only (branch coverage)
		const authorNameOnly = seo.author({
			name: "Jane Smith",
		});
		assert.ok(authorNameOnly.includes("Jane Smith"));
	});

	test("sitemap generation with XML structure and content validation", () => {
		// Basic sitemap with required fields
		const pages = [
			{ path: "/", lastmod: "2024-01-01" },
			{ path: "/about", changefreq: "monthly", priority: "0.8" },
		];
		const sitemapBasic = seo.sitemap({
			domain: "example.com",
			pages,
		});
		assert.ok(sitemapBasic.includes('<?xml version="1.0" encoding="UTF-8"?>'));
		assert.ok(
			sitemapBasic.includes(
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			),
		);
		assert.ok(sitemapBasic.includes("<loc>https://example.com/</loc>"));
		assert.ok(sitemapBasic.includes("<lastmod>2024-01-01</lastmod>"));
		assert.ok(sitemapBasic.includes("<changefreq>monthly</changefreq>"));
		assert.ok(sitemapBasic.includes("<priority>0.8</priority>"));

		// Sitemap with pages without leading slash (branch coverage)
		const pagesNoSlash = [{ path: "products" }];
		const sitemapNoSlash = seo.sitemap({
			domain: "shop.com",
			pages: pagesNoSlash,
		});
		assert.ok(sitemapNoSlash.includes("https://shop.com/products"));

		// Empty sitemap (branch coverage)
		const sitemapEmpty = seo.sitemap({
			domain: "empty.com",
			pages: [],
		});
		assert.ok(sitemapEmpty.includes("<urlset"));
		assert.ok(!sitemapEmpty.includes("<url>"));

		// Single page sitemap (branch coverage)
		const sitemapSingle = seo.sitemap({
			domain: "single.com",
			pages: [{ path: "/single" }],
		});
		assert.ok(sitemapSingle.includes("https://single.com/single"));

		// Sitemap without explicit lastmod uses current date (branch coverage)
		const sitemapAutoDate = seo.sitemap({
			domain: "auto.com",
			pages: [{ path: "/auto" }],
		});
		const currentYear = new Date().getFullYear();
		assert.ok(sitemapAutoDate.includes(`<lastmod>${currentYear}`));

		// Test XML structure validity
		assert.ok(sitemapBasic.includes("</urlset>"));
		assert.ok(sitemapBasic.includes("</url>"));
	});
});

describe("Social Media Platform Integration", () => {
	test("Open Graph and Twitter Cards with comprehensive attribute coverage", () => {
		// Open Graph with all parameters
		const ogFull = seo.openGraph({
			title: "Article Title",
			description: "Article description",
			domain: "blog.com",
			path: "/article",
			imageUrl: "/og-image.jpg",
			type: "article",
		});
		assert.ok(ogFull.includes('property="og:title"'));
		assert.ok(ogFull.includes('name="og:title"')); // Dual attributes
		assert.ok(ogFull.includes("Article Title"));
		assert.ok(ogFull.includes('content="article"'));
		assert.ok(ogFull.includes("https://blog.com/og-image.jpg"));

		// Open Graph without image (branch coverage)
		const ogNoImage = seo.openGraph({
			title: "No Image Post",
			description: "Post without image",
			domain: "site.com",
			path: "/post",
		});
		assert.ok(ogNoImage.includes("No Image Post"));
		assert.ok(!ogNoImage.includes("og:image"));

		// Open Graph with default type (branch coverage)
		const ogDefaultType = seo.openGraph({
			title: "Default",
			description: "Default type",
			domain: "default.com",
			path: "/",
		});
		assert.ok(ogDefaultType.includes('content="website"'));

		// Twitter Cards with all parameters
		const twitterFull = seo.twitter({
			title: "Twitter Title",
			description: "Twitter description",
			domain: "twitter.com",
			imageUrl: "/twitter-card.jpg",
			cardType: "summary_large_image",
		});
		assert.ok(twitterFull.includes('name="twitter:card"'));
		assert.ok(twitterFull.includes("summary_large_image"));
		assert.ok(twitterFull.includes("Twitter Title"));
		assert.ok(twitterFull.includes("https://twitter.com/twitter-card.jpg"));

		// Twitter without image (branch coverage)
		const twitterNoImage = seo.twitter({
			title: "No Image Tweet",
			description: "Tweet without image",
			domain: "tweet.com",
		});
		assert.ok(twitterNoImage.includes("No Image Tweet"));
		assert.ok(!twitterNoImage.includes("twitter:image"));

		// Twitter with default card type (branch coverage)
		const twitterDefault = seo.twitter({
			title: "Default Card",
			description: "Default card type",
		});
		assert.ok(twitterDefault.includes('content="summary"'));
	});

	test("LinkedIn, Pinterest, Discord platform-specific optimization", () => {
		// LinkedIn with all parameters
		const linkedinFull = seo.linkedin({
			title: "LinkedIn Post",
			description: "Professional content",
			domain: "professional.com",
			path: "/career",
			imageUrl: "/linkedin.jpg",
		});
		assert.ok(linkedinFull.includes('property="linkedin:title"'));
		assert.ok(linkedinFull.includes("LinkedIn Post"));
		assert.ok(linkedinFull.includes("Professional content"));
		assert.ok(linkedinFull.includes("https://professional.com/linkedin.jpg"));

		// LinkedIn without optional parameters (branch coverage)
		const linkedinMinimal = seo.linkedin({
			title: "Minimal LinkedIn",
			description: "Basic post",
		});
		assert.ok(linkedinMinimal.includes("Minimal LinkedIn"));
		assert.ok(linkedinMinimal.includes("Basic post"));

		// Pinterest with all parameters
		const pinterestFull = seo.pinterest({
			title: "Pinterest Pin",
			description: "Pin description",
			domain: "pins.com",
			path: "/pin",
			imageUrl: "/pin-image.jpg",
		});
		assert.ok(pinterestFull.includes('name="pinterest:description"'));
		assert.ok(pinterestFull.includes("Pin description"));
		assert.ok(pinterestFull.includes("https://pins.com/pin-image.jpg"));

		// Pinterest without optional parameters (branch coverage)
		const pinterestMinimal = seo.pinterest({
			title: "Simple Pin",
			description: "Simple description",
		});
		assert.ok(pinterestMinimal.includes("Simple description"));
		assert.ok(pinterestMinimal.includes('name="pinterest:description"'));

		// Discord with all parameters
		const discordFull = seo.discord({
			title: "Discord Embed",
			description: "Discord description",
			domain: "discord.com",
			path: "/server",
			imageUrl: "/discord.jpg",
			color: "#7289da",
		});
		assert.ok(discordFull.includes('name="discord:title"'));
		assert.ok(discordFull.includes('property="discord:title"'));
		assert.ok(discordFull.includes("Discord Embed"));
		assert.ok(discordFull.includes("https://discord.com/discord.jpg"));

		// Discord without optional parameters (branch coverage)
		const discordMinimal = seo.discord({
			title: "Simple Embed",
			description: "Simple description",
		});
		assert.ok(discordMinimal.includes("Simple Embed"));
		assert.ok(discordMinimal.includes("Simple description"));
	});
});

describe("Comprehensive Social and Export Functionality", () => {
	test("unified social meta tags and module exports", () => {
		// Social function combines Open Graph and Twitter
		const socialFull = seo.social({
			title: "Social Title",
			description: "Social description",
			domain: "social.com",
			path: "/post",
			imageUrl: "/social.jpg",
			ogType: "article",
			twitterCardType: "summary_large_image",
		});
		assert.ok(socialFull.includes('property="og:title"'));
		assert.ok(socialFull.includes('name="twitter:card"'));
		assert.ok(socialFull.includes("Social Title"));
		assert.ok(socialFull.includes('content="article"'));
		assert.ok(socialFull.includes("summary_large_image"));

		// Social without image (branch coverage)
		const socialNoImage = seo.social({
			title: "No Image Social",
			description: "Post without image",
			domain: "social.com",
			path: "/simple",
		});
		assert.ok(socialNoImage.includes("No Image Social"));
		assert.ok(!socialNoImage.includes("og:image"));
		assert.ok(!socialNoImage.includes("twitter:image"));

		// Social with default types (branch coverage)
		const socialDefaults = seo.social({
			title: "Default Social",
			description: "Default types",
		});
		assert.ok(socialDefaults.includes('content="website"')); // Default OG type
		assert.ok(socialDefaults.includes('content="summary"')); // Default Twitter type

		// Verify all SEO function exports exist and are callable
		assert.strictEqual(typeof seo.author, "function");
		assert.strictEqual(typeof seo.canonical, "function");
		assert.strictEqual(typeof seo.discord, "function");
		assert.strictEqual(typeof seo.general, "function");
		assert.strictEqual(typeof seo.linkedin, "function");
		assert.strictEqual(typeof seo.openGraph, "function");
		assert.strictEqual(typeof seo.pinterest, "function");
		assert.strictEqual(typeof seo.robots, "function");
		assert.strictEqual(typeof seo.sitemap, "function");
		assert.strictEqual(typeof seo.social, "function");
		assert.strictEqual(typeof seo.twitter, "function");
	});

	test("URL handling edge cases and absolute path conversion", () => {
		// Test absoluteUrl utility through canonical function
		const absoluteTest1 = seo.canonical({
			domain: "test.com",
			path: "/absolute",
		});
		assert.ok(absoluteTest1.includes("https://test.com/absolute"));

		// URL without leading slash
		const absoluteTest2 = seo.canonical({
			domain: "test.com",
			path: "relative",
		});
		assert.ok(absoluteTest2.includes("https://test.com/relative"));

		// Empty path handling
		const absoluteTest3 = seo.canonical({
			domain: "test.com",
			path: "",
		});
		assert.ok(absoluteTest3.includes("https://test.com"));

		// Already absolute URL (should remain unchanged)
		const absoluteTest4 = seo.canonical({
			domain: "ignored.com",
			path: "https://external.com/page",
		});
		assert.ok(absoluteTest4.includes("https://external.com/page"));

		// Test through various functions that use absoluteUrl
		const ogWithAbsolute = seo.openGraph({
			title: "OG Test",
			description: "OG description",
			domain: "og.com",
			path: "og-page",
			imageUrl: "image.jpg",
		});
		assert.ok(ogWithAbsolute.includes("https://og.com/og-page"));
		assert.ok(ogWithAbsolute.includes("https://og.com/image.jpg"));
	});

	test("comprehensive integration and real-world usage patterns", () => {
		// Complete page head setup simulation
		const pageTitle = "Ultimate Guide";
		const pageDesc = "Comprehensive guide description";
		const pageDomain = "guides.com";
		const pagePath = "/ultimate-guide";
		const pageImage = "/guide-image.jpg";

		// Generate all major SEO components
		const generalTags = seo.general({
			title: pageTitle,
			description: pageDesc,
			domain: pageDomain,
			path: pagePath,
			suffix: "Guides Hub",
		});

		const socialTags = seo.social({
			title: pageTitle,
			description: pageDesc,
			domain: pageDomain,
			path: pagePath,
			imageUrl: pageImage,
		});

		const robotsTags = seo.robots({ index: true, follow: true });
		const authorTags = seo.author({
			name: "Expert Author",
			email: "author@guides.com",
		});

		// Verify comprehensive output
		assert.ok(generalTags.includes("Ultimate Guide | Guides Hub"));
		assert.ok(socialTags.includes('property="og:title"'));
		assert.ok(socialTags.includes('name="twitter:card"'));
		assert.ok(robotsTags.includes("index, follow"));
		assert.ok(authorTags.includes("Expert Author"));

		// Performance and edge case validation
		assert.ok(typeof generalTags === "string");
		assert.ok(typeof socialTags === "string");
		assert.ok(generalTags.length > 0);
		assert.ok(socialTags.length > 0);

		// Ensure no HTML escaping issues
		assert.ok(generalTags.includes('"'));
		assert.ok(socialTags.includes('"'));
		assert.ok(!generalTags.includes("&quot;"));
		assert.ok(!socialTags.includes("&quot;"));
	});
});
