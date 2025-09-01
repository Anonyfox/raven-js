/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for URL extraction functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { extractUrls } from "./extract-urls.js";

describe("extractUrls", () => {
	it("extracts basic HTTP URLs", () => {
		const text = "Visit http://example.com for more info";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["http://example.com"]);
	});

	it("extracts basic HTTPS URLs", () => {
		const text = "Secure site at https://example.com";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://example.com"]);
	});

	it("extracts multiple URLs from text", () => {
		const text = "Check https://example.com and http://test.org";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://example.com", "http://test.org"]);
	});

	it("extracts URLs with ports", () => {
		const text = "Development server at http://localhost:3000";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["http://localhost:3000"]);
	});

	it("extracts URLs with paths", () => {
		const text = "API endpoint https://api.example.com/v1/users";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://api.example.com/v1/users"]);
	});

	it("extracts URLs with query parameters", () => {
		const text = "Search https://example.com/search?q=test&page=1";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://example.com/search?q=test&page=1"]);
	});

	it("extracts URLs with fragments", () => {
		const text = "Section https://example.com/docs#introduction";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://example.com/docs#introduction"]);
	});

	it("extracts complex URLs with all components", () => {
		const text =
			"Full URL https://api.example.com:8080/v1/data?format=json&limit=100#results";
		const urls = extractUrls(text);
		deepStrictEqual(urls, [
			"https://api.example.com:8080/v1/data?format=json&limit=100#results",
		]);
	});

	it("handles URLs with underscores in domains", () => {
		const text = "Visit https://api_server.example.com";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://api_server.example.com"]);
	});

	it("handles URLs with hyphens in domains", () => {
		const text = "Check https://my-app.example.com";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://my-app.example.com"]);
	});

	it("extracts URLs with numeric domains", () => {
		const text = "Server at https://192.168.1.1:8080";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://192.168.1.1:8080"]);
	});

	it("handles URLs surrounded by punctuation", () => {
		const text = "(See https://example.com) and check https://test.org!";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["https://example.com", "https://test.org"]);
	});

	it("handles URLs at sentence boundaries", () => {
		const text = "Website: https://example.com. Another site https://test.org?";
		const urls = extractUrls(text);
		// Our regex includes trailing punctuation in URLs
		deepStrictEqual(urls, ["https://example.com.", "https://test.org?"]);
	});

	it("ignores non-HTTP/HTTPS protocols", () => {
		const text = "Email mailto:test@example.com or ftp://files.example.com";
		const urls = extractUrls(text);
		deepStrictEqual(urls, []);
	});

	it("handles case-insensitive protocol matching", () => {
		const text = "Sites: HTTP://EXAMPLE.COM and HTTPS://TEST.ORG";
		const urls = extractUrls(text);
		deepStrictEqual(urls, ["HTTP://EXAMPLE.COM", "HTTPS://TEST.ORG"]);
	});

	it("returns empty array for text without URLs", () => {
		const text = "This is just plain text with no URLs";
		const urls = extractUrls(text);
		deepStrictEqual(urls, []);
	});

	it("handles empty string", () => {
		const urls = extractUrls("");
		deepStrictEqual(urls, []);
	});

	it("replaces URLs with placeholders when requested", () => {
		const text = "Visit https://example.com and check https://test.org";
		const result = extractUrls(text, true);
		strictEqual(result, "Visit <URL> and check <URL>");
	});

	it("handles placeholder replacement with no URLs", () => {
		const text = "No URLs here";
		const result = extractUrls(text, true);
		strictEqual(result, text);
	});

	it("handles URLs with special characters in paths", () => {
		const text =
			"Resource at https://example.com/path/with_underscores-and-hyphens.html";
		const urls = extractUrls(text);
		deepStrictEqual(urls, [
			"https://example.com/path/with_underscores-and-hyphens.html",
		]);
	});

	it("handles URLs with encoded characters in query strings", () => {
		const text = "Search https://example.com/search?q=hello%20world&type=exact";
		const urls = extractUrls(text);
		deepStrictEqual(urls, [
			"https://example.com/search?q=hello%20world&type=exact",
		]);
	});
});
