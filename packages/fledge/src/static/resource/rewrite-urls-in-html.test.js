/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for HTML URL rewriting functionality.
 *
 * Validates URL detection, basePath application, and comprehensive HTML rewriting.
 */

import { match, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	applyBasePath,
	rewriteCssUrls,
	rewriteEmbedUrls,
	rewriteHtmlUrls,
	rewriteIframeUrls,
	rewriteImageUrls,
	rewriteLinkUrls,
	rewriteMediaUrls,
	rewriteMetaUrls,
	rewriteScriptUrls,
	rewriteStylesheetUrls,
	shouldRewriteUrl,
} from "./rewrite-urls-in-html.js";

const BASE_URL = "http://localhost:3000";

describe("shouldRewriteUrl", () => {
	it("returns true for internal relative URLs", () => {
		strictEqual(shouldRewriteUrl("/page", BASE_URL), true);
		strictEqual(shouldRewriteUrl("./page", BASE_URL), true);
		strictEqual(shouldRewriteUrl("../page", BASE_URL), true);
		strictEqual(shouldRewriteUrl("page.html", BASE_URL), true);
	});

	it("returns true for internal absolute URLs", () => {
		strictEqual(shouldRewriteUrl("http://localhost:3000/page", BASE_URL), true);
		strictEqual(
			shouldRewriteUrl("http://localhost:3000/deep/page", BASE_URL),
			true,
		);
	});

	it("returns false for external URLs", () => {
		strictEqual(shouldRewriteUrl("https://example.com/page", BASE_URL), false);
		strictEqual(shouldRewriteUrl("http://different.com/page", BASE_URL), false);
	});

	it("returns false for special schemes", () => {
		strictEqual(shouldRewriteUrl("mailto:test@example.com", BASE_URL), false);
		strictEqual(shouldRewriteUrl("javascript:alert('test')", BASE_URL), false);
		strictEqual(shouldRewriteUrl("data:text/plain,hello", BASE_URL), false);
		strictEqual(shouldRewriteUrl("tel:+1234567890", BASE_URL), false);
	});

	it("returns false for fragments and empty URLs", () => {
		strictEqual(shouldRewriteUrl("#section", BASE_URL), false);
		strictEqual(shouldRewriteUrl("#", BASE_URL), false);
		strictEqual(shouldRewriteUrl("", BASE_URL), false);
		strictEqual(shouldRewriteUrl("   ", BASE_URL), false);
	});

	it("returns false for malformed URLs", () => {
		strictEqual(shouldRewriteUrl("http://[invalid", BASE_URL), false);
		strictEqual(shouldRewriteUrl("http://", BASE_URL), false);
	});
});

describe("applyBasePath", () => {
	it("prepends basePath to absolute paths", () => {
		strictEqual(applyBasePath("/page", BASE_URL, "/app"), "/app/page");
		strictEqual(
			applyBasePath("/deep/page", BASE_URL, "/app"),
			"/app/deep/page",
		);
	});

	it("prepends basePath to relative paths", () => {
		strictEqual(applyBasePath("page.html", BASE_URL, "/app"), "/app/page.html");
		strictEqual(applyBasePath("./page", BASE_URL, "/app"), "/app/page");
	});

	it("handles basePath normalization", () => {
		strictEqual(applyBasePath("/page", BASE_URL, "app"), "/app/page");
		strictEqual(applyBasePath("/page", BASE_URL, "/app/"), "/app/page");
		strictEqual(applyBasePath("/page", BASE_URL, "app/"), "/app/page");
	});

	it("preserves query parameters and hash", () => {
		strictEqual(
			applyBasePath("/page?q=test", BASE_URL, "/app"),
			"/app/page?q=test",
		);
		strictEqual(
			applyBasePath("/page#section", BASE_URL, "/app"),
			"/app/page#section",
		);
		strictEqual(
			applyBasePath("/page?q=test#section", BASE_URL, "/app"),
			"/app/page?q=test#section",
		);
	});

	it("handles empty or root basePath", () => {
		strictEqual(applyBasePath("/page", BASE_URL, ""), "/page");
		strictEqual(applyBasePath("/page", BASE_URL, "/"), "/page");
	});

	it("returns original URL on error", () => {
		strictEqual(
			applyBasePath("http://[invalid", BASE_URL, "/app"),
			"http://[invalid",
		);
	});
});

describe("Individual rewriter functions", () => {
	it("rewriteLinkUrls rewrites anchor href attributes", () => {
		const html = '<a href="/page">Link</a>';
		const result = rewriteLinkUrls(html, BASE_URL, "/app");
		strictEqual(result, '<a href="/app/page">Link</a>');
	});

	it("rewriteImageUrls rewrites image src attributes", () => {
		const html = '<img src="/logo.png" alt="Logo">';
		const result = rewriteImageUrls(html, BASE_URL, "/app");
		strictEqual(result, '<img src="/app/logo.png" alt="Logo">');
	});

	it("rewriteScriptUrls rewrites script src attributes", () => {
		const html = '<script src="/app.js"></script>';
		const result = rewriteScriptUrls(html, BASE_URL, "/app");
		strictEqual(result, '<script src="/app/app.js"></script>');
	});

	it("rewriteStylesheetUrls rewrites link href attributes", () => {
		const html = '<link href="/style.css" rel="stylesheet">';
		const result = rewriteStylesheetUrls(html, BASE_URL, "/app");
		strictEqual(result, '<link href="/app/style.css" rel="stylesheet">');
	});

	it("rewriteIframeUrls rewrites iframe src attributes", () => {
		const html = '<iframe src="/embed"></iframe>';
		const result = rewriteIframeUrls(html, BASE_URL, "/app");
		strictEqual(result, '<iframe src="/app/embed"></iframe>');
	});

	it("rewriteMediaUrls rewrites media element URLs", () => {
		const html = `
			<video src="/movie.mp4"></video>
			<audio src="/sound.mp3"></audio>
			<source src="/video.webm">
			<track src="/captions.vtt">
		`;
		const result = rewriteMediaUrls(html, BASE_URL, "/app");
		match(result, /<video src="\/app\/movie\.mp4">/);
		match(result, /<audio src="\/app\/sound\.mp3">/);
		match(result, /<source src="\/app\/video\.webm">/);
		match(result, /<track src="\/app\/captions\.vtt">/);
	});

	it("rewriteEmbedUrls rewrites embed and object URLs", () => {
		const html = `
			<embed src="/flash.swf">
			<object data="/content.pdf"></object>
		`;
		const result = rewriteEmbedUrls(html, BASE_URL, "/app");
		match(result, /<embed src="\/app\/flash\.swf">/);
		match(result, /<object data="\/app\/content\.pdf">/);
	});

	it("leaves external URLs unchanged", () => {
		const html = '<a href="https://example.com">External</a>';
		const result = rewriteLinkUrls(html, BASE_URL, "/app");
		strictEqual(result, html); // Unchanged
	});

	it("handles mixed internal and external URLs", () => {
		const html = `
			<a href="/internal">Internal</a>
			<a href="https://example.com">External</a>
			<img src="/logo.png" alt="Logo">
			<img src="https://example.com/logo.png" alt="External Logo">
		`;
		const result = rewriteHtmlUrls(html, BASE_URL, "/app");
		match(result, /<a href="\/app\/internal">/);
		match(result, /<a href="https:\/\/example\.com">/);
		match(result, /<img src="\/app\/logo\.png"/);
		match(result, /<img src="https:\/\/example\.com\/logo\.png"/);
	});
});

describe("CSS URL rewriting", () => {
	it("rewrites URLs in style tags", () => {
		const html = `
			<style>
				.bg { background: url('/bg.jpg'); }
				.icon { background-image: url("/icon.png"); }
			</style>
		`;
		const result = rewriteCssUrls(html, BASE_URL, "/app");
		match(result, /url\('\/app\/bg\.jpg'\)/);
		match(result, /url\("\/app\/icon\.png"\)/);
	});

	it("rewrites URLs in inline style attributes", () => {
		const html =
			"<div style=\"background: url('/bg.jpg'); color: red;\">Content</div>";
		const result = rewriteCssUrls(html, BASE_URL, "/app");
		match(result, /url\('\/app\/bg\.jpg'\)/);
	});

	it("leaves external CSS URLs unchanged", () => {
		const html = `
			<style>
				.bg { background: url('https://example.com/bg.jpg'); }
			</style>
		`;
		const result = rewriteCssUrls(html, BASE_URL, "/app");
		match(result, /url\('https:\/\/example\.com\/bg\.jpg'\)/);
	});

	it("handles mixed CSS URL formats", () => {
		const html = `
			<style>
				.test1 { background: url("/bg1.jpg"); }
				.test2 { background: url('/bg2.jpg'); }
				.test3 { background: url(/bg3.jpg); }
			</style>
		`;
		const result = rewriteCssUrls(html, BASE_URL, "/app");
		match(result, /url\("\/app\/bg1\.jpg"\)/);
		match(result, /url\('\/app\/bg2\.jpg'\)/);
		match(result, /url\(\/app\/bg3\.jpg\)/);
	});
});

describe("Meta refresh rewriting", () => {
	it("rewrites URLs in meta refresh tags", () => {
		const html = '<meta http-equiv="refresh" content="5;url=/redirect">';
		const result = rewriteMetaUrls(html, BASE_URL, "/app");
		strictEqual(
			result,
			'<meta http-equiv="refresh" content="5;url=/app/redirect">',
		);
	});

	it("leaves external meta refresh URLs unchanged", () => {
		const html =
			'<meta http-equiv="refresh" content="5;url=https://example.com/redirect">';
		const result = rewriteMetaUrls(html, BASE_URL, "/app");
		strictEqual(result, html); // Unchanged
	});
});

describe("rewriteHtmlUrls comprehensive", () => {
	it("rewrites all URL types in complex HTML", () => {
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Test Page</title>
				<link rel="stylesheet" href="/styles.css">
				<style>
					body { background: url('/bg.jpg'); }
				</style>
				<meta http-equiv="refresh" content="300;url=/refresh">
			</head>
			<body>
				<a href="/page1">Page 1</a>
				<a href="https://example.com">External</a>
				<img src="/logo.png" alt="Logo">
				<script src="/app.js"></script>
				<iframe src="/embed" title="Embed"></iframe>
				<video src="/movie.mp4"></video>
				<div style="background: url('/inline-bg.jpg');">Styled</div>
			</body>
			</html>
		`;

		const result = rewriteHtmlUrls(html, BASE_URL, "/my-app");

		// Check all internal URLs are rewritten
		match(result, /<link rel="stylesheet" href="\/my-app\/styles\.css">/);
		match(result, /url\('\/my-app\/bg\.jpg'\)/);
		match(result, /content="300;url=\/my-app\/refresh"/);
		match(result, /<a href="\/my-app\/page1">/);
		match(result, /<img src="\/my-app\/logo\.png"/);
		match(result, /<script src="\/my-app\/app\.js">/);
		match(result, /<iframe src="\/my-app\/embed"/);
		match(result, /<video src="\/my-app\/movie\.mp4">/);
		match(result, /url\('\/my-app\/inline-bg\.jpg'\)/);

		// Check external URL is unchanged
		match(result, /<a href="https:\/\/example\.com">/);
	});

	it("handles empty basePath gracefully", () => {
		const html = '<a href="/page">Link</a>';
		const result = rewriteHtmlUrls(html, BASE_URL, "");
		strictEqual(result, html); // Unchanged
	});

	it("handles root basePath gracefully", () => {
		const html = '<a href="/page">Link</a>';
		const result = rewriteHtmlUrls(html, BASE_URL, "/");
		strictEqual(result, html); // Unchanged
	});

	it("handles various quote styles consistently", () => {
		const html = `
			<a href="/page1">Link 1</a>
			<a href='/page2'>Link 2</a>
			<a href=/page3>Link 3</a>
			<img src="/img1.png">
			<img src='/img2.png'>
			<img src=/img3.png>
		`;
		const result = rewriteHtmlUrls(html, BASE_URL, "/app");

		match(result, /<a href="\/app\/page1">/);
		match(result, /<a href='\/app\/page2'>/);
		match(result, /<a href=\/app\/page3>/);
		match(result, /<img src="\/app\/img1\.png">/);
		match(result, /<img src='\/app\/img2\.png'>/);
		match(result, /<img src=\/app\/img3\.png>/);
	});

	it("preserves HTML structure and non-URL content", () => {
		const html = `
			<div class="content">
				<h1>Title</h1>
				<p>Some text with <strong>formatting</strong>.</p>
				<a href="/link">Link</a>
				<span data-value="not-a-url">Data</span>
			</div>
		`;
		const result = rewriteHtmlUrls(html, BASE_URL, "/app");

		// Should preserve all structure
		match(result, /<div class="content">/);
		match(result, /<h1>Title<\/h1>/);
		match(result, /<strong>formatting<\/strong>/);
		match(result, /<span data-value="not-a-url">Data<\/span>/);

		// But rewrite the URL
		match(result, /<a href="\/app\/link">/);
	});
});
