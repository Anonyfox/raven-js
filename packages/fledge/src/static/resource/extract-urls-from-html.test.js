/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import {
	extractCssUrls,
	extractEmbedUrls,
	extractIframeUrls,
	extractImageUrls,
	extractLinkUrls,
	extractMediaUrls,
	extractMetaUrls,
	extractScriptUrls,
	extractStylesheetUrls,
	extractUrlsFromHtml,
	extractUrlsFromPattern,
	safeNormalizeUrl,
} from "./extract-urls-from-html.js";

describe("extract-urls-from-html", () => {
	const baseUrl = "https://example.com/app/";

	test("safeNormalizeUrl normalizes valid URLs", () => {
		const result = safeNormalizeUrl("/api/docs", baseUrl);
		assert(result instanceof URL);
		assert.strictEqual(result.href, "https://example.com/api/docs");
	});

	test("safeNormalizeUrl returns null for invalid URLs", () => {
		assert.strictEqual(safeNormalizeUrl("not-a-url", null), null);
		assert.strictEqual(
			safeNormalizeUrl("data:text/html,content", baseUrl),
			null,
		);
		assert.strictEqual(safeNormalizeUrl("javascript:alert(1)", baseUrl), null);
		assert.strictEqual(
			safeNormalizeUrl("mailto:test@example.com", baseUrl),
			null,
		);
		assert.strictEqual(safeNormalizeUrl("tel:+1234567890", baseUrl), null);
		assert.strictEqual(safeNormalizeUrl("#section", baseUrl), null);
	});

	test("extractUrlsFromPattern extracts URLs using regex", () => {
		const html = '<a href="/page1">Link</a><a href="/page2">Link</a>';
		const regex = /href\s*=\s*"([^"]*)"/gi;
		const result = extractUrlsFromPattern(html, regex, baseUrl);

		assert.strictEqual(result.size, 2);
		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/page1",
			"https://example.com/page2",
		]);
	});

	test("extractLinkUrls extracts anchor href attributes", () => {
		const html = `
			<a href="/page1">Link 1</a>
			<a href='https://external.com/page2'>Link 2</a>
			<a href=../relative>Link 3</a>
			<a>No href</a>
			<a href="">Empty href</a>
		`;

		const result = extractLinkUrls(html, baseUrl);
		assert.strictEqual(result.size, 3);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/page1",
			"https://example.com/relative",
			"https://external.com/page2",
		]);
	});

	test("extractImageUrls extracts image src attributes", () => {
		const html = `
			<img src="/image1.jpg" alt="Image 1">
			<img src='https://cdn.example.com/image2.png' alt="Image 2">
			<img src=../images/image3.gif>
			<img alt="No src">
		`;

		const result = extractImageUrls(html, baseUrl);
		assert.strictEqual(result.size, 3);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://cdn.example.com/image2.png",
			"https://example.com/image1.jpg",
			"https://example.com/images/image3.gif",
		]);
	});

	test("extractScriptUrls extracts script src attributes", () => {
		const html = `
			<script src="/js/app.js"></script>
			<script src='https://cdn.example.com/lib.js'></script>
			<script>console.log('inline');</script>
		`;

		const result = extractScriptUrls(html, baseUrl);
		assert.strictEqual(result.size, 2);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://cdn.example.com/lib.js",
			"https://example.com/js/app.js",
		]);
	});

	test("extractStylesheetUrls extracts link href attributes", () => {
		const html = `
			<link rel="stylesheet" href="/css/style.css">
			<link rel="icon" href='https://example.com/favicon.ico'>
			<link rel="preload" href="../fonts/font.woff2">
		`;

		const result = extractStylesheetUrls(html, baseUrl);
		assert.strictEqual(result.size, 3);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/css/style.css",
			"https://example.com/favicon.ico",
			"https://example.com/fonts/font.woff2",
		]);
	});

	test("extractIframeUrls extracts iframe src attributes", () => {
		const html = `
			<iframe src="/embed/video"></iframe>
			<iframe src='https://youtube.com/embed/123'></iframe>
		`;

		const result = extractIframeUrls(html, baseUrl);
		assert.strictEqual(result.size, 2);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/embed/video",
			"https://youtube.com/embed/123",
		]);
	});

	test("extractMediaUrls extracts media element URLs", () => {
		const html = `
			<video src="/video.mp4"></video>
			<audio src='https://cdn.example.com/audio.mp3'></audio>
			<video>
				<source src="/video.webm" type="video/webm">
				<source src="/video.mp4" type="video/mp4">
				<track src="/subtitles.vtt" kind="subtitles">
			</video>
		`;

		const result = extractMediaUrls(html, baseUrl);
		assert.strictEqual(result.size, 4);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://cdn.example.com/audio.mp3",
			"https://example.com/subtitles.vtt",
			"https://example.com/video.mp4",
			"https://example.com/video.webm",
		]);
	});

	test("extractEmbedUrls extracts embed and object URLs", () => {
		const html = `
			<embed src="/flash.swf" type="application/x-shockwave-flash">
			<object data='https://example.com/document.pdf' type="application/pdf">
		`;

		const result = extractEmbedUrls(html, baseUrl);
		assert.strictEqual(result.size, 2);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/document.pdf",
			"https://example.com/flash.swf",
		]);
	});

	test("extractCssUrls extracts URLs from style tags", () => {
		const html = `
			<style>
				.bg1 { background: url("/images/bg1.jpg"); }
				.bg2 { background: url('https://cdn.example.com/bg2.png'); }
				.bg3 { background: url(../images/bg3.gif); }
			</style>
		`;

		const result = extractCssUrls(html, baseUrl);
		assert.strictEqual(result.size, 3);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://cdn.example.com/bg2.png",
			"https://example.com/images/bg1.jpg",
			"https://example.com/images/bg3.gif",
		]);
	});

	test("extractCssUrls extracts URLs from inline styles", () => {
		const html = `
			<div style="background: url('/bg.jpg');"></div>
			<span style='background-image: url("https://example.com/icon.png");'></span>
		`;

		const result = extractCssUrls(html, baseUrl);
		assert.strictEqual(result.size, 2);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/bg.jpg",
			"https://example.com/icon.png",
		]);
	});

	test("extractMetaUrls extracts URLs from meta refresh tags", () => {
		const html = `
			<meta http-equiv="refresh" content="5;url=https://new.example.com/page">
			<meta http-equiv='refresh' content='0; url=/redirect'>
		`;

		const result = extractMetaUrls(html, baseUrl);
		assert.strictEqual(result.size, 2);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/redirect",
			"https://new.example.com/page",
		]);
	});

	test("extractUrlsFromHtml extracts all URL types", () => {
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<link rel="stylesheet" href="/css/style.css">
				<script src="/js/app.js"></script>
				<meta http-equiv="refresh" content="300;url=/refresh">
			</head>
			<body>
				<a href="/page1">Link</a>
				<img src="/image.jpg" alt="Image">
				<iframe src="/embed"></iframe>
				<style>.bg { background: url('/bg.jpg'); }</style>
				<div style="background: url('/inline-bg.png');"></div>
				<video src="/video.mp4"></video>
				<embed src="/flash.swf">
			</body>
			</html>
		`;

		const result = extractUrlsFromHtml(html, baseUrl);
		assert.strictEqual(result.size, 10);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/bg.jpg",
			"https://example.com/css/style.css",
			"https://example.com/embed",
			"https://example.com/flash.swf",
			"https://example.com/image.jpg",
			"https://example.com/inline-bg.png",
			"https://example.com/js/app.js",
			"https://example.com/page1",
			"https://example.com/refresh",
			"https://example.com/video.mp4",
		]);
	});

	test("handles malformed HTML gracefully", () => {
		const html = `
			<a href="/valid">Valid</a>
			<a href="">Empty</a>
			<a href="javascript:alert()">JS</a>
			<a href="data:text/plain,content">Data</a>
			<img src="not-a-url">
			<script src="/valid.js"></script>
		`;

		const result = extractUrlsFromHtml(html, baseUrl);
		assert.strictEqual(result.size, 3);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/app/not-a-url",
			"https://example.com/valid",
			"https://example.com/valid.js",
		]);
	});

	test("handles case insensitive attributes", () => {
		const html = `
			<A HREF="/page1">Link</A>
			<IMG SRC="/image.jpg">
			<SCRIPT SRC="/script.js"></SCRIPT>
		`;

		const result = extractUrlsFromHtml(html, baseUrl);
		assert.strictEqual(result.size, 3);

		const hrefs = Array.from(result)
			.map((url) => url.href)
			.sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/image.jpg",
			"https://example.com/page1",
			"https://example.com/script.js",
		]);
	});

	test("deduplicates identical URLs", () => {
		const html = `
			<a href="/page">Link 1</a>
			<a href="/page">Link 2</a>
			<img src="/page">
		`;

		const result = extractUrlsFromHtml(html, baseUrl);
		assert.strictEqual(result.size, 1);
		assert.strictEqual(Array.from(result)[0].href, "https://example.com/page");
	});

	test("handles empty HTML", () => {
		const result = extractUrlsFromHtml("", baseUrl);
		assert.strictEqual(result.size, 0);
	});

	test("handles HTML without URLs", () => {
		const html = "<p>Hello world</p><div>No links here</div>";
		const result = extractUrlsFromHtml(html, baseUrl);
		assert.strictEqual(result.size, 0);
	});
});
