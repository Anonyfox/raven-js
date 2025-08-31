/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import { normalizeUrl } from "./normalize-url.js";

describe("normalizeUrl", () => {
	test("handles complete URL strings", () => {
		const url = normalizeUrl("https://Example.Com/Path?b=2&a=1#section");

		assert.strictEqual(url.protocol, "https:");
		assert.strictEqual(url.hostname, "example.com");
		assert.strictEqual(url.pathname, "/Path");
		assert.strictEqual(url.search, "");
		assert.strictEqual(url.hash, "");
	});

	test("handles URL objects", () => {
		const original = new URL("https://Example.Com/Path#section");
		const url = normalizeUrl(original);

		assert.strictEqual(url.hostname, "example.com");
		assert.strictEqual(url.hash, "");
	});

	test("adds http protocol when missing", () => {
		const url = normalizeUrl("example.com/path");

		assert.strictEqual(url.protocol, "http:");
		assert.strictEqual(url.hostname, "example.com");
		assert.strictEqual(url.pathname, "/path");
	});

	test("resolves relative URLs with base URL", () => {
		const url = normalizeUrl("/api/docs", "https://example.com/app/");

		assert.strictEqual(url.protocol, "https:");
		assert.strictEqual(url.hostname, "example.com");
		assert.strictEqual(url.pathname, "/api/docs");
	});

	test("resolves relative URLs with base URL object", () => {
		const base = new URL("https://example.com/app/");
		const url = normalizeUrl("../contact", base);

		assert.strictEqual(url.pathname, "/contact");
	});

	test("strips hash fragments", () => {
		const url = normalizeUrl("https://example.com/page#intro");
		assert.strictEqual(url.hash, "");
	});

	test("normalizes domain casing", () => {
		const url = normalizeUrl("https://EXAMPLE.COM/API");
		assert.strictEqual(url.hostname, "example.com");
		assert.strictEqual(url.pathname, "/API"); // Path casing preserved
	});

	test("strips default ports", () => {
		const httpUrl = normalizeUrl("http://example.com:80/path");
		const httpsUrl = normalizeUrl("https://example.com:443/path");

		assert.strictEqual(httpUrl.port, "");
		assert.strictEqual(httpsUrl.port, "");
		assert.strictEqual(httpUrl.href, "http://example.com/path");
		assert.strictEqual(httpsUrl.href, "https://example.com/path");
	});

	test("preserves non-default ports", () => {
		const url = normalizeUrl("https://example.com:8443/path");
		assert.strictEqual(url.port, "8443");
	});

	test("strips query parameters", () => {
		const url = normalizeUrl("https://example.com/path?z=3&a=1&m=2");
		assert.strictEqual(url.search, "");
		assert.strictEqual(url.href, "https://example.com/path");
	});

	test("normalizes pathname double slashes", () => {
		const url = normalizeUrl("https://example.com//api///docs");
		assert.strictEqual(url.pathname, "/api/docs");
	});

	test("handles empty query parameters", () => {
		const url = normalizeUrl("https://example.com/path?");
		assert.strictEqual(url.search, "");
	});

	test("throws for invalid URLs", () => {
		assert.throws(() => normalizeUrl("not-a-url"), /Invalid URL: not-a-url/);

		assert.throws(
			() => normalizeUrl("://invalid"),
			/Invalid URL: :\/\/invalid/,
		);
	});

	test("throws for URLs without domain", () => {
		assert.throws(
			() => normalizeUrl("/path/only"),
			/Invalid URL: \/path\/only/,
		);

		assert.throws(
			() => normalizeUrl("file:///local/path"),
			/URL must have domain: file:\/\/\/local\/path/,
		);
	});

	test("throws for relative URLs without base", () => {
		assert.throws(
			() => normalizeUrl("./relative/path"),
			/Invalid URL: \.\/relative\/path/,
		);

		assert.throws(
			() => normalizeUrl("../parent/path"),
			/Invalid URL: \.\.\/parent\/path/,
		);
	});

	test("handles complex normalization", () => {
		const url = normalizeUrl(
			"HTTP://EXAMPLE.COM:80//api///docs?z=3&a=1#section",
		);

		assert.strictEqual(url.protocol, "http:");
		assert.strictEqual(url.hostname, "example.com");
		assert.strictEqual(url.port, "");
		assert.strictEqual(url.pathname, "/api/docs");
		assert.strictEqual(url.search, "");
		assert.strictEqual(url.hash, "");
		assert.strictEqual(url.href, "http://example.com/api/docs");
	});
});
