/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { collectReferences, parseReferences } from "./reference-parser.js";

describe("Reference Parser", () => {
	describe("parseReferences", () => {
		it("should parse simple reference definition", () => {
			const lines = ["[link1]: https://example.com"];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: undefined },
			});
			assert.equal(result.start, 0);
			assert.equal(result.end, 1);
		});

		it("should parse reference with title", () => {
			const lines = ['[link1]: https://example.com "Example Site"'];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: "Example Site" },
			});
		});

		it("should parse reference with single quote title", () => {
			const lines = ["[link1]: https://example.com 'Example Site'"];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: "Example Site" },
			});
		});

		it("should parse reference with angle bracket URL", () => {
			const lines = ["[link1]: <https://example.com>"];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: undefined },
			});
		});

		it("should parse reference with angle bracket URL and title", () => {
			const lines = ['[link1]: <https://example.com> "Example Site"'];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: "Example Site" },
			});
		});

		it("should parse multiple consecutive references", () => {
			const lines = [
				"[link1]: https://example.com",
				"[link2]: https://github.com",
				'[link3]: https://google.com "Google"',
			];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: undefined },
				link2: { url: "https://github.com", title: undefined },
				link3: { url: "https://google.com", title: "Google" },
			});
			assert.equal(result.end, 3);
		});

		it("should handle references with empty lines", () => {
			const lines = [
				"[link1]: https://example.com",
				"",
				"[link2]: https://github.com",
				"Not a reference",
			];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: undefined },
				link2: { url: "https://github.com", title: undefined },
			});
			assert.equal(result.end, 3); // Stops before "Not a reference"
		});

		it("should stop at non-reference line", () => {
			const lines = [
				"[link1]: https://example.com",
				"This is a paragraph",
				"[link2]: https://github.com",
			];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: undefined },
			});
			assert.equal(result.end, 1);
		});

		it("should return null for non-reference content", () => {
			const lines = ["This is just a paragraph"];
			const result = parseReferences(lines, 0);

			assert.equal(result, null);
		});

		it("should handle case-insensitive reference IDs", () => {
			const lines = ["[LINK1]: https://example.com"];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				link1: { url: "https://example.com", title: undefined },
			});
		});

		it("should handle references with spaces in ID", () => {
			const lines = ["[my link]: https://example.com"];
			const result = parseReferences(lines, 0);

			assert.ok(result);
			assert.deepEqual(result.references, {
				"my link": { url: "https://example.com", title: undefined },
			});
		});

		it("should reject malformed references", () => {
			const lines = [
				"[link1] https://example.com", // Missing colon
				"link1: https://example.com", // Missing brackets
				"[]: https://example.com", // Empty ID
				"[link1]:", // Missing URL
			];

			for (let i = 0; i < lines.length; i++) {
				const result = parseReferences([lines[i]], 0);
				assert.equal(result, null, `Should reject: ${lines[i]}`);
			}
		});
	});

	describe("collectReferences", () => {
		it("should collect all references from document", () => {
			const lines = [
				"# Heading",
				"",
				"[link1]: https://example.com",
				"[link2]: https://github.com",
				"",
				"Some paragraph",
				"",
				'[link3]: https://google.com "Google"',
				"",
				"More content",
			];

			const references = collectReferences(lines);
			assert.deepEqual(references, {
				link1: { url: "https://example.com", title: undefined },
				link2: { url: "https://github.com", title: undefined },
				link3: { url: "https://google.com", title: "Google" },
			});
		});

		it("should handle empty document", () => {
			const references = collectReferences([]);
			assert.deepEqual(references, {});
		});

		it("should handle document with no references", () => {
			const lines = [
				"# Heading",
				"Just some regular content",
				"No references here",
			];

			const references = collectReferences(lines);
			assert.deepEqual(references, {});
		});

		it("should handle later definitions overriding earlier ones", () => {
			const lines = [
				"[link]: https://example.com",
				"Some content",
				"[link]: https://github.com",
			];

			const references = collectReferences(lines);
			assert.deepEqual(references, {
				link: { url: "https://github.com", title: undefined },
			});
		});
	});
});
