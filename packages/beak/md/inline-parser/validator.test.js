import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { validateInlineNode } from "./validator.js";

describe("Inline Node Validator", () => {
	it("should validate text nodes", () => {
		assert.ok(validateInlineNode({ type: NODE_TYPES.TEXT, content: "text" }));
		assert.ok(!validateInlineNode({ type: NODE_TYPES.TEXT, content: 123 }));
	});

	it("should validate bold nodes", () => {
		assert.ok(
			validateInlineNode({
				type: NODE_TYPES.BOLD,
				content: [{ type: NODE_TYPES.TEXT, content: "text" }],
			}),
		);
		assert.ok(!validateInlineNode({ type: NODE_TYPES.BOLD, content: [] }));
	});

	it("should validate italic nodes", () => {
		assert.ok(
			validateInlineNode({
				type: NODE_TYPES.ITALIC,
				content: [{ type: NODE_TYPES.TEXT, content: "text" }],
			}),
		);
		assert.ok(!validateInlineNode({ type: NODE_TYPES.ITALIC, content: [] }));
	});

	it("should validate code nodes", () => {
		assert.ok(validateInlineNode({ type: NODE_TYPES.CODE, content: "code" }));
		assert.ok(!validateInlineNode({ type: NODE_TYPES.CODE, content: 123 }));
	});

	it("should validate link nodes", () => {
		assert.ok(
			validateInlineNode({
				type: NODE_TYPES.LINK,
				content: [{ type: NODE_TYPES.TEXT, content: "text" }],
				url: "https://example.com",
			}),
		);
		assert.ok(
			!validateInlineNode({
				type: NODE_TYPES.LINK,
				content: [],
				url: "https://example.com",
			}),
		);
		assert.ok(
			!validateInlineNode({
				type: NODE_TYPES.LINK,
				content: [{ type: NODE_TYPES.TEXT, content: "text" }],
				url: "",
			}),
		);
	});

	it("should validate image nodes", () => {
		assert.ok(
			validateInlineNode({
				type: NODE_TYPES.IMAGE,
				alt: "alt",
				url: "https://example.com",
			}),
		);
		assert.ok(
			!validateInlineNode({
				type: NODE_TYPES.IMAGE,
				alt: "alt",
				url: "",
			}),
		);
		assert.ok(
			validateInlineNode({
				type: NODE_TYPES.IMAGE,
				alt: "alt",
				url: "invalid-url",
			}),
		);
	});

	it("should reject invalid node types", () => {
		assert.ok(!validateInlineNode({ type: "invalid", content: "text" }));
		assert.ok(!validateInlineNode(null));
		assert.ok(!validateInlineNode(undefined));
	});

	it("should reject unknown node types", () => {
		assert.ok(!validateInlineNode({ type: "unknown", content: "text" }));
		assert.ok(!validateInlineNode({ type: "invalid", content: "text" }));
		assert.ok(!validateInlineNode({ type: "custom", content: "text" }));
	});

	it("should reject valid but non-inline node types", () => {
		assert.ok(!validateInlineNode({ type: "paragraph", content: "text" }));
		assert.ok(!validateInlineNode({ type: "heading", content: "text" }));
		assert.ok(!validateInlineNode({ type: "list", content: "text" }));
	});
});
