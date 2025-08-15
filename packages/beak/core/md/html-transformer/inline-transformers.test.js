import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	transformInlineNode,
	transformInlineNodes,
} from "./inline-transformers.js";

describe("Inline Transformers", () => {
	it("should transform all inline node types", () => {
		// Text node
		const textNode = { type: "text", content: "Hello World" };
		assert.equal(transformInlineNode(textNode), "Hello World");

		// Bold node
		const boldNode = {
			type: "bold",
			content: [{ type: "text", content: "Bold Text" }],
		};
		assert.equal(transformInlineNode(boldNode), "<strong>Bold Text</strong>");

		// Italic node
		const italicNode = {
			type: "italic",
			content: [{ type: "text", content: "Italic Text" }],
		};
		assert.equal(transformInlineNode(italicNode), "<em>Italic Text</em>");

		// Inline code node
		const codeNode = { type: "code", content: "const x = 1;" };
		assert.equal(transformInlineNode(codeNode), "<code>const x = 1;</code>");

		// Link node
		const linkNode = {
			type: "link",
			url: "https://example.com",
			content: [{ type: "text", content: "Link Text" }],
		};
		assert.equal(
			transformInlineNode(linkNode),
			'<a href="https://example.com">Link Text</a>',
		);

		// Image node
		const imageNode = {
			type: "image",
			url: "https://example.com/image.jpg",
			alt: "Image description",
		};
		assert.equal(
			transformInlineNode(imageNode),
			'<img src="https://example.com/image.jpg" alt="Image description">',
		);
	});

	it("should handle edge cases and invalid inputs", () => {
		// Invalid nodes
		assert.equal(transformInlineNode(null), "");
		assert.equal(transformInlineNode(undefined), "");
		// @ts-expect-error - Testing invalid input
		assert.equal(transformInlineNode({}), "");
		assert.equal(transformInlineNode({ type: "unknown" }), "");

		// Missing content and properties
		const textNode = { type: "text" };
		assert.equal(transformInlineNode(textNode), "");

		const codeNode = { type: "code" };
		assert.equal(transformInlineNode(codeNode), "<code></code>");

		const linkNode = {
			type: "link",
			content: [{ type: "text", content: "Link" }],
		};
		assert.equal(transformInlineNode(linkNode), '<a href="#">Link</a>');

		const imageNode = { type: "image", url: "https://example.com/image.jpg" };
		assert.equal(
			transformInlineNode(imageNode),
			'<img src="https://example.com/image.jpg" alt="">',
		);

		// Empty content arrays
		const boldNode = { type: "bold", content: /** @type {any[]} */ ([]) };
		assert.equal(transformInlineNode(boldNode), "<strong></strong>");

		// Non-array nodes input
		assert.equal(transformInlineNodes(null), "");
		assert.equal(transformInlineNodes(undefined), "");
		// @ts-expect-error - Testing invalid input
		assert.equal(transformInlineNodes("not an array"), "");

		// Missing fallback values in helper functions
		const boldNodeNoContent = { type: "bold" };
		assert.equal(transformInlineNode(boldNodeNoContent), "<strong></strong>");

		const italicNodeNoContent = { type: "italic" };
		assert.equal(transformInlineNode(italicNodeNoContent), "<em></em>");

		const linkNodeNoContent = { type: "link", url: "https://example.com" };
		assert.equal(
			transformInlineNode(linkNodeNoContent),
			'<a href="https://example.com"></a>',
		);

		const linkNodeNoUrl = {
			type: "link",
			content: [{ type: "text", content: "Link" }],
		};
		assert.equal(transformInlineNode(linkNodeNoUrl), '<a href="#">Link</a>');

		const imageNodeNoAlt = {
			type: "image",
			url: "https://example.com/image.jpg",
		};
		assert.equal(
			transformInlineNode(imageNodeNoAlt),
			'<img src="https://example.com/image.jpg" alt="">',
		);

		const imageNodeNoUrl = { type: "image", alt: "Image description" };
		assert.equal(
			transformInlineNode(imageNodeNoUrl),
			'<img src="" alt="Image description">',
		);
	});
});
