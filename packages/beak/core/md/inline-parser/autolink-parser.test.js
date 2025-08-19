import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseAutolink } from "./autolink-parser.js";

describe("Autolink Parser", () => {
	it("should parse HTTP URLs", () => {
		const result = tryParseAutolink("http://example.com", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				url: "http://example.com",
				content: [{ type: NODE_TYPES.TEXT, content: "http://example.com" }],
			},
			start: 0,
			end: 18,
		});
	});

	it("should parse HTTPS URLs", () => {
		const result = tryParseAutolink("https://example.com", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				url: "https://example.com",
				content: [{ type: NODE_TYPES.TEXT, content: "https://example.com" }],
			},
			start: 0,
			end: 19,
		});
	});

	it("should parse URLs with paths", () => {
		const result = tryParseAutolink("https://example.com/path/to/resource", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				url: "https://example.com/path/to/resource",
				content: [
					{
						type: NODE_TYPES.TEXT,
						content: "https://example.com/path/to/resource",
					},
				],
			},
			start: 0,
			end: 36,
		});
	});

	it("should parse URLs with query parameters", () => {
		const result = tryParseAutolink(
			"https://example.com?param=value&other=test",
			0,
		);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				url: "https://example.com?param=value&other=test",
				content: [
					{
						type: NODE_TYPES.TEXT,
						content: "https://example.com?param=value&other=test",
					},
				],
			},
			start: 0,
			end: 42,
		});
	});

	it("should not parse non-URLs", () => {
		const result = tryParseAutolink("not a url", 0);
		assert.equal(result, null);
	});

	it("should not parse when URL is not at start position", () => {
		const result = tryParseAutolink("Visit https://example.com", 6);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				url: "https://example.com",
				content: [{ type: NODE_TYPES.TEXT, content: "https://example.com" }],
			},
			start: 6,
			end: 25,
		});
	});

	it("should not parse when protocol is missing", () => {
		const result = tryParseAutolink("example.com", 0);
		assert.equal(result, null);
	});

	it("should parse URLs in the middle of text", () => {
		const result = tryParseAutolink("text https://example.com more", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				url: "https://example.com",
				content: [{ type: NODE_TYPES.TEXT, content: "https://example.com" }],
			},
			start: 5,
			end: 24,
		});
	});
});
