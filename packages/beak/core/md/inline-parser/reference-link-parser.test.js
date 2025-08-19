/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseReferenceLink } from "./reference-link-parser.js";

describe("Reference Link Parser", () => {
	const references = {
		link1: { url: "https://example.com", title: "Example Site" },
		github: { url: "https://github.com", title: undefined },
		google: { url: "https://google.com", title: "Search Engine" },
	};

	describe("Regular link syntax", () => {
		it("should parse regular links without references", () => {
			const result = tryParseReferenceLink(
				"Check [this link](https://test.com)",
				6,
			);

			assert.ok(result);
			assert.equal(result.node.type, NODE_TYPES.LINK);
			assert.equal(result.node.url, "https://test.com");
			assert.deepEqual(result.node.content, [
				{ type: NODE_TYPES.TEXT, content: "this link" },
			]);
			assert.equal(result.start, 6);
			assert.equal(result.end, 35);
		});

		it("should prioritize regular syntax over reference syntax", () => {
			const result = tryParseReferenceLink(
				"Check [link1](https://direct.com)",
				6,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.url, "https://direct.com"); // Direct URL, not reference
		});
	});

	describe("Reference link syntax", () => {
		it("should parse reference link [text][ref]", () => {
			const result = tryParseReferenceLink(
				"Check [Example Site][link1]",
				6,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.type, NODE_TYPES.LINK);
			assert.equal(result.node.url, "https://example.com");
			assert.equal(result.node.title, "Example Site");
			assert.deepEqual(result.node.content, [
				{ type: NODE_TYPES.TEXT, content: "Example Site" },
			]);
			assert.equal(result.start, 6);
			assert.equal(result.end, 27);
		});

		it("should parse collapsed reference link [text][]", () => {
			const result = tryParseReferenceLink("Check [link1][]", 6, references);

			assert.ok(result);
			assert.equal(result.node.url, "https://example.com");
			assert.equal(result.node.title, "Example Site");
			assert.deepEqual(result.node.content, [
				{ type: NODE_TYPES.TEXT, content: "link1" },
			]);
			assert.equal(result.end, 15);
		});

		it("should parse shorthand reference link [ref]", () => {
			const result = tryParseReferenceLink("Check [github]", 6, references);

			assert.ok(result);
			assert.equal(result.node.url, "https://github.com");
			assert.equal(result.node.title, undefined);
			assert.deepEqual(result.node.content, [
				{ type: NODE_TYPES.TEXT, content: "github" },
			]);
			assert.equal(result.end, 14);
		});

		it("should handle case-insensitive reference matching", () => {
			const result = tryParseReferenceLink("Check [LINK1][]", 6, references);

			assert.ok(result);
			assert.equal(result.node.url, "https://example.com");
		});

		it("should return null for unknown reference", () => {
			const result = tryParseReferenceLink(
				"Check [unknown][ref]",
				6,
				references,
			);
			assert.equal(result, null);
		});

		it("should return null for unknown shorthand reference", () => {
			const result = tryParseReferenceLink("Check [unknown]", 6, references);
			assert.equal(result, null);
		});

		it("should handle references without title", () => {
			const result = tryParseReferenceLink(
				"Check [GitHub][github]",
				6,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.url, "https://github.com");
			assert.equal(result.node.title, undefined);
		});

		it("should parse nested inline elements in link text", () => {
			const result = tryParseReferenceLink(
				"Check [**bold** text][link1]",
				6,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.content.length, 2);
			assert.equal(result.node.content[0].type, NODE_TYPES.BOLD);
			assert.equal(result.node.content[1].type, NODE_TYPES.TEXT);
		});
	});

	describe("Edge cases", () => {
		it("should return null for malformed reference syntax", () => {
			const tests = [
				"[text][", // Unclosed reference
				"[text][ref", // Unclosed reference
				"[][]", // Empty text
				"[text][ ]", // Reference with only space
			];

			for (const test of tests) {
				const result = tryParseReferenceLink(test, 0, references);
				assert.equal(result, null, `Should reject: ${test}`);
			}
		});

		it("should return null when starting not at bracket", () => {
			const result = tryParseReferenceLink("text[link1][]", 0, references);
			assert.equal(result, null);
		});

		it("should work with empty references object", () => {
			const result = tryParseReferenceLink("[link](url)", 0, {});

			assert.ok(result);
			assert.equal(result.node.url, "url");
		});

		it("should handle reference at end of string", () => {
			const result = tryParseReferenceLink("Check [github]", 6, references);

			assert.ok(result);
			assert.equal(result.end, 14);
		});

		it("should handle multiple reference formats in sequence", () => {
			const text = "Links: [direct](url) [ref][link1] [github]";

			// Test direct link
			let result = tryParseReferenceLink(text, 7, references);
			assert.ok(result);
			assert.equal(result.node.url, "url");

			// Test reference link
			result = tryParseReferenceLink(text, 21, references);
			assert.ok(result);
			assert.equal(result.node.url, "https://example.com");

			// Test shorthand reference
			result = tryParseReferenceLink(text, 34, references);
			assert.ok(result);
			assert.equal(result.node.url, "https://github.com");
		});
	});
});
