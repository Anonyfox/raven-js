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
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("parses common URL forms and structures", () => {
			// basic http URL
			deepStrictEqual(extractUrls("Visit http://example.com for more info"), [
				"http://example.com",
			]);
			// basic https URL
			deepStrictEqual(extractUrls("Secure site at https://example.com"), [
				"https://example.com",
			]);
			// multiple URLs in one text
			deepStrictEqual(
				extractUrls("Check https://example.com and http://test.org"),
				["https://example.com", "http://test.org"],
			);
			// port number
			deepStrictEqual(
				extractUrls("Development server at http://localhost:3000"),
				["http://localhost:3000"],
			);
			// path segment
			deepStrictEqual(
				extractUrls("API endpoint https://api.example.com/v1/users"),
				["https://api.example.com/v1/users"],
			);
			// query parameters
			deepStrictEqual(
				extractUrls("Search https://example.com/search?q=test&page=1"),
				["https://example.com/search?q=test&page=1"],
			);
			// fragment
			deepStrictEqual(
				extractUrls("Section https://example.com/docs#introduction"),
				["https://example.com/docs#introduction"],
			);
			// full complex URL
			deepStrictEqual(
				extractUrls(
					"Full URL https://api.example.com:8080/v1/data?format=json&limit=100#results",
				),
				["https://api.example.com:8080/v1/data?format=json&limit=100#results"],
			);
			// underscore in domain
			deepStrictEqual(extractUrls("Visit https://api_server.example.com"), [
				"https://api_server.example.com",
			]);
			// hyphen in domain
			deepStrictEqual(extractUrls("Check https://my-app.example.com"), [
				"https://my-app.example.com",
			]);
			// numeric domain with port
			deepStrictEqual(extractUrls("Server at https://192.168.1.1:8080"), [
				"https://192.168.1.1:8080",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles boundaries, protocol filtering, and empty inputs", () => {
			// punctuation around URLs
			deepStrictEqual(
				extractUrls("(See https://example.com) and check https://test.org!"),
				["https://example.com", "https://test.org"],
			);
			// sentence boundaries (regex retains trailing punctuation)
			deepStrictEqual(
				extractUrls(
					"Website: https://example.com. Another site https://test.org?",
				),
				["https://example.com.", "https://test.org?"],
			);
			// non-http/https protocols are ignored
			deepStrictEqual(
				extractUrls("Email mailto:test@example.com or ftp://files.example.com"),
				[],
			);
			// protocol matching is case-insensitive
			deepStrictEqual(
				extractUrls("Sites: HTTP://EXAMPLE.COM and HTTPS://TEST.ORG"),
				["HTTP://EXAMPLE.COM", "HTTPS://TEST.ORG"],
			);
			// no matches
			deepStrictEqual(extractUrls("This is just plain text with no URLs"), []);
			// empty input
			deepStrictEqual(extractUrls(""), []);
			// placeholder replacement with matches
			strictEqual(
				extractUrls(
					"Visit https://example.com and check https://test.org",
					true,
				),
				"Visit <URL> and check <URL>",
			);
			// placeholder replacement with no matches
			strictEqual(extractUrls("No URLs here", true), "No URLs here");
		});
	});

	describe("integration scenarios", () => {
		it("handles encoded chars and complex paths", () => {
			// underscores and hyphens in path
			deepStrictEqual(
				extractUrls(
					"Resource at https://example.com/path/with_underscores-and-hyphens.html",
				),
				["https://example.com/path/with_underscores-and-hyphens.html"],
			);
			// percent-encoded query values
			deepStrictEqual(
				extractUrls(
					"Search https://example.com/search?q=hello%20world&type=exact",
				),
				["https://example.com/search?q=hello%20world&type=exact"],
			);
		});
	});
});
