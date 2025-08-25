import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { validateBlockNode } from "./validator.js";

describe("Block Node Validator", () => {
	// Valid nodes
	it("should validate valid nodes", () => {
		// Paragraph
		const paragraph = {
			type: NODE_TYPES.PARAGRAPH,
			content: [{ type: NODE_TYPES.TEXT, content: "text" }],
		};
		assert.ok(validateBlockNode(paragraph));

		// Blockquote
		const blockquote = {
			type: NODE_TYPES.BLOCKQUOTE,
			content: [{ type: NODE_TYPES.TEXT, content: "text" }],
		};
		assert.ok(validateBlockNode(blockquote));

		// Heading
		const heading = {
			type: NODE_TYPES.HEADING,
			level: 1,
			content: [{ type: NODE_TYPES.TEXT, content: "text" }],
		};
		assert.ok(validateBlockNode(heading));

		// List
		const list = {
			type: NODE_TYPES.LIST,
			ordered: true,
			items: [
				{
					type: NODE_TYPES.LIST_ITEM,
					content: [{ type: NODE_TYPES.TEXT, content: "text" }],
				},
			],
		};
		assert.ok(validateBlockNode(list));

		// List Item
		const listItem = {
			type: NODE_TYPES.LIST_ITEM,
			content: [{ type: NODE_TYPES.TEXT, content: "text" }],
		};
		assert.ok(validateBlockNode(listItem));

		// Code Block
		const codeBlock = {
			type: NODE_TYPES.CODE_BLOCK,
			language: "js",
			content: "const x = 1;",
		};
		assert.ok(validateBlockNode(codeBlock));

		// Horizontal Rule
		const horizontalRule = { type: NODE_TYPES.HORIZONTAL_RULE };
		assert.ok(validateBlockNode(horizontalRule));
	});

	// Invalid nodes - various edge cases
	it("should reject invalid nodes", () => {
		// Null/undefined/not object
		assert.ok(!validateBlockNode(null));
		assert.ok(!validateBlockNode(undefined));
		// @ts-expect-error - Testing invalid input
		assert.ok(!validateBlockNode("string"));
		// @ts-expect-error - Testing invalid input
		assert.ok(!validateBlockNode(123));
		// @ts-expect-error - Testing invalid input
		assert.ok(!validateBlockNode(true));

		// Invalid node type
		const node = { type: "unknown" };
		assert.ok(!validateBlockNode(node));

		// Node type not in VALIDATION_RULES
		const textNode = { type: NODE_TYPES.TEXT };
		assert.ok(!validateBlockNode(textNode));

		// Missing properties
		const paragraphNoContent = { type: NODE_TYPES.PARAGRAPH };
		assert.ok(!validateBlockNode(paragraphNoContent));

		const headingNoLevel = {
			type: NODE_TYPES.HEADING,
			content: [{ type: NODE_TYPES.TEXT, content: "text" }],
		};
		assert.ok(!validateBlockNode(headingNoLevel));

		const listNoOrdered = {
			type: NODE_TYPES.LIST,
			items: [
				{
					type: NODE_TYPES.LIST_ITEM,
					content: [{ type: NODE_TYPES.TEXT, content: "text" }],
				},
			],
		};
		assert.ok(!validateBlockNode(listNoOrdered));

		const codeBlockNoLanguage = {
			type: NODE_TYPES.CODE_BLOCK,
			content: "const x = 1;",
		};
		assert.ok(!validateBlockNode(codeBlockNoLanguage));

		// Wrong property types
		const paragraphWrongContent = {
			type: NODE_TYPES.PARAGRAPH,
			content: "not an array",
		};
		assert.ok(!validateBlockNode(paragraphWrongContent));

		const headingInvalidLevel = {
			type: NODE_TYPES.HEADING,
			level: 7,
			content: [{ type: NODE_TYPES.TEXT, content: "text" }],
		};
		assert.ok(!validateBlockNode(headingInvalidLevel));

		const listWrongOrdered = {
			type: NODE_TYPES.LIST,
			ordered: "not boolean",
			items: [
				{
					type: NODE_TYPES.LIST_ITEM,
					content: [{ type: NODE_TYPES.TEXT, content: "text" }],
				},
			],
		};
		// @ts-expect-error - Testing invalid input
		assert.ok(!validateBlockNode(listWrongOrdered));

		const codeBlockWrongLanguage = {
			type: NODE_TYPES.CODE_BLOCK,
			language: 123,
			content: "const x = 1;",
		};
		// @ts-expect-error - Testing invalid input
		assert.ok(!validateBlockNode(codeBlockWrongLanguage));

		// Empty arrays
		const paragraphEmptyContent = {
			type: NODE_TYPES.PARAGRAPH,
			content: /** @type {any[]} */ ([]),
		};
		assert.ok(!validateBlockNode(paragraphEmptyContent));

		const listEmptyItems = {
			type: NODE_TYPES.LIST,
			ordered: true,
			items: /** @type {any[]} */ ([]),
		};
		assert.ok(!validateBlockNode(listEmptyItems));
	});
});
