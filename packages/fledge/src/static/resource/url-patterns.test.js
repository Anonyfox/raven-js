/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for URL pattern definitions and UrlPattern class.
 *
 * Validates pattern matching, URL extraction, and class functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	getDirectUrlPatterns,
	URL_PATTERNS,
	UrlPattern,
} from "./url-patterns.js";

describe("UrlPattern class", () => {
	it("creates pattern with regex, description, and capture groups", () => {
		const pattern = new UrlPattern(/test-(\w+)/gi, "Test pattern", [1]);

		strictEqual(pattern.getDescription(), "Test pattern");
		deepStrictEqual(pattern.getCaptureGroups(), [1]);
		strictEqual(pattern.getRegex().source, "test-(\\w+)");
		strictEqual(pattern.getRegex().flags, "gi");
	});

	it("extracts URL from match result", () => {
		const pattern = new UrlPattern(/href="([^"]*)"/gi, "Test href", [1]);

		const html = '<a href="/test">Link</a>';
		const match = pattern.exec(html);
		strictEqual(pattern.extractUrlFromMatch(match), "/test");
	});

	it("returns null for no match", () => {
		const pattern = new UrlPattern(/href="([^"]*)"/gi, "Test href", [1]);

		strictEqual(pattern.extractUrlFromMatch([]), null);
	});

	it("handles multiple capture groups", () => {
		const pattern = new UrlPattern(
			/(?:href="([^"]*)"|href='([^']*)')/gi,
			"Multi-quote href",
			[1, 2],
		);

		const match1 = pattern.exec('<a href="/test1">');
		strictEqual(pattern.extractUrlFromMatch(match1), "/test1");

		pattern.reset();
		const match2 = pattern.exec("<a href='/test2'>");
		strictEqual(pattern.extractUrlFromMatch(match2), "/test2");
	});

	it("tests pattern matching", () => {
		const pattern = URL_PATTERNS.LINKS;
		strictEqual(pattern.test('<a href="/test">Link</a>'), true);
		strictEqual(pattern.test("<p>No links here</p>"), false);
	});

	it("resets regex state properly", () => {
		const pattern = URL_PATTERNS.IMAGES;
		pattern.test('<img src="/test1.jpg">');
		pattern.reset();

		// Should find match from beginning after reset
		const match = pattern.exec('<img src="/test2.jpg">');
		strictEqual(pattern.extractUrlFromMatch(match), "/test2.jpg");
	});

	it("serializes to JSON", () => {
		const pattern = new UrlPattern(/test-(\w+)/gi, "Test pattern", [1]);

		const json = pattern.toJSON();
		strictEqual(json.regex, "test-(\\w+)");
		strictEqual(json.flags, "gi");
		strictEqual(json.description, "Test pattern");
		deepStrictEqual(json.captureGroups, [1]);
	});
});

describe("URL_PATTERNS", () => {
	it("contains all expected pattern instances", () => {
		const expectedPatterns = [
			"LINKS",
			"IMAGES",
			"SCRIPTS",
			"STYLESHEETS",
			"IFRAMES",
			"MEDIA_SRC",
			"SOURCE",
			"TRACK",
			"EMBED",
			"OBJECT",
			"CSS_URLS",
			"STYLE_TAGS",
			"INLINE_STYLES",
			"META_REFRESH",
			"META_REFRESH_URL",
		];

		for (const name of expectedPatterns) {
			strictEqual(
				URL_PATTERNS[name] instanceof UrlPattern,
				true,
				`${name} should be a UrlPattern instance`,
			);
		}
	});

	it("LINKS pattern matches anchor href attributes", () => {
		const pattern = URL_PATTERNS.LINKS;

		// Test various quote styles
		const tests = [
			'<a href="/test">Link</a>',
			"<a href='/test'>Link</a>",
			"<a href=/test>Link</a>",
			'<a class="nav" href="/test" id="link">Link</a>',
		];

		for (const html of tests) {
			pattern.reset();
			const match = pattern.exec(html);
			strictEqual(pattern.extractUrlFromMatch(match), "/test");
		}
	});

	it("IMAGES pattern matches img src attributes", () => {
		const pattern = URL_PATTERNS.IMAGES;
		pattern.reset(); // Reset regex state

		const html = '<img src="/logo.png" alt="Logo">';
		const match = pattern.exec(html);
		strictEqual(pattern.extractUrlFromMatch(match), "/logo.png");
	});

	it("CSS_URLS pattern matches CSS url() functions", () => {
		const pattern = URL_PATTERNS.CSS_URLS;

		const tests = [
			'background: url("/bg.jpg");',
			"background: url('/bg.jpg');",
			"background: url(/bg.jpg);",
		];

		for (const css of tests) {
			pattern.reset();
			const match = pattern.exec(css);
			strictEqual(pattern.extractUrlFromMatch(match), "/bg.jpg");
		}
	});

	it("STYLE_TAGS pattern extracts content", () => {
		const pattern = URL_PATTERNS.STYLE_TAGS;

		const html = "<style>.test { color: red; }</style>";
		const match = pattern.exec(html);
		strictEqual(
			pattern.extractUrlFromMatch(match).trim(),
			".test { color: red; }",
		);
	});

	it("META_REFRESH pattern matches refresh redirects", () => {
		const pattern = URL_PATTERNS.META_REFRESH;

		const html = '<meta http-equiv="refresh" content="5;url=/redirect">';
		const match = pattern.exec(html);
		strictEqual(pattern.extractUrlFromMatch(match), "5;url=/redirect");
	});
});

describe("Pattern helper functions", () => {
	it("getDirectUrlPatterns returns correct patterns", () => {
		const patterns = getDirectUrlPatterns();
		strictEqual(patterns.length, 10);

		// Should include main HTML element patterns
		strictEqual(patterns.includes(URL_PATTERNS.LINKS), true);
		strictEqual(patterns.includes(URL_PATTERNS.IMAGES), true);
		strictEqual(patterns.includes(URL_PATTERNS.SCRIPTS), true);

		// Should exclude CSS and meta patterns
		strictEqual(patterns.includes(URL_PATTERNS.CSS_URLS), false);
		strictEqual(patterns.includes(URL_PATTERNS.META_REFRESH), false);
	});
});

describe("Pattern regression tests", () => {
	it("handles complex HTML with mixed quotes", () => {
		const html = `
			<a href="/page1" class="nav">Link 1</a>
			<img src='/image.jpg' alt="Image">
			<script src=/app.js></script>
			<link href="/style.css" rel="stylesheet">
		`;

		// Test each pattern individually - reset before each use
		URL_PATTERNS.LINKS.reset();
		const linkMatch = URL_PATTERNS.LINKS.exec(html);
		strictEqual(URL_PATTERNS.LINKS.extractUrlFromMatch(linkMatch), "/page1");

		URL_PATTERNS.IMAGES.reset();
		const imgMatch = URL_PATTERNS.IMAGES.exec(html);
		strictEqual(
			URL_PATTERNS.IMAGES.extractUrlFromMatch(imgMatch),
			"/image.jpg",
		);

		URL_PATTERNS.SCRIPTS.reset();
		const scriptMatch = URL_PATTERNS.SCRIPTS.exec(html);
		strictEqual(
			URL_PATTERNS.SCRIPTS.extractUrlFromMatch(scriptMatch),
			"/app.js",
		);

		URL_PATTERNS.STYLESHEETS.reset();
		const linkStyleMatch = URL_PATTERNS.STYLESHEETS.exec(html);
		strictEqual(
			URL_PATTERNS.STYLESHEETS.extractUrlFromMatch(linkStyleMatch),
			"/style.css",
		);
	});
});
