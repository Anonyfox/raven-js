import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { transformBlockNode } from "./block-transformers.js";

describe("Block Transformers", () => {
	it("should transform all block node types", () => {
		// Paragraph
		const paragraph = {
			type: "paragraph",
			content: [{ type: "text", content: "Paragraph text" }],
		};
		assert.equal(transformBlockNode(paragraph), "<p>Paragraph text</p>");

		// Heading
		const heading = {
			type: "heading",
			level: 2,
			content: [{ type: "text", content: "Heading text" }],
		};
		assert.equal(transformBlockNode(heading), "<h2>Heading text</h2>");

		// Unordered list
		const unorderedList = {
			type: "list",
			ordered: false,
			items: [
				{ type: "listItem", content: [{ type: "text", content: "Item 1" }] },
				{ type: "listItem", content: [{ type: "text", content: "Item 2" }] },
			],
		};
		assert.equal(
			transformBlockNode(unorderedList),
			"<ul><li>Item 1</li><li>Item 2</li></ul>",
		);

		// Ordered list
		const orderedList = {
			type: "list",
			ordered: true,
			items: [
				{ type: "listItem", content: [{ type: "text", content: "Item 1" }] },
			],
		};
		assert.equal(transformBlockNode(orderedList), "<ol><li>Item 1</li></ol>");

		// List item
		const listItem = {
			type: "listItem",
			content: [{ type: "text", content: "List item text" }],
		};
		assert.equal(transformBlockNode(listItem), "<li>List item text</li>");

		// Blockquote
		const blockquote = {
			type: "blockquote",
			content: [{ type: "text", content: "Quote text" }],
		};
		assert.equal(
			transformBlockNode(blockquote),
			"<blockquote><p>Quote text</p></blockquote>",
		);

		// Code block with language
		const codeBlock = {
			type: "codeBlock",
			language: "javascript",
			content: "const x = 1;",
		};
		assert.equal(
			transformBlockNode(codeBlock),
			'<pre><code class="language-javascript">const x = 1;</code></pre>',
		);

		// Code block without language
		const codeBlockNoLang = {
			type: "codeBlock",
			content: "const x = 1;",
		};
		assert.equal(
			transformBlockNode(codeBlockNoLang),
			"<pre><code>const x = 1;</code></pre>",
		);

		// Horizontal rule
		const horizontalRule = { type: "horizontalRule" };
		assert.equal(transformBlockNode(horizontalRule), "<hr>");

		// HTML block
		const htmlBlock = {
			type: "htmlBlock",
			html: "<div>Raw HTML</div>",
		};
		assert.equal(transformBlockNode(htmlBlock), "<div>Raw HTML</div>");

		// Table
		const table = {
			type: "table",
			rows: [
				{
					type: "tableRow",
					cells: [
						{
							type: "tableCell",
							content: [{ type: "text", content: "Header 1" }],
						},
						{
							type: "tableCell",
							content: [{ type: "text", content: "Header 2" }],
						},
					],
				},
				{
					type: "tableRow",
					cells: [
						{
							type: "tableCell",
							content: [{ type: "text", content: "Data 1" }],
						},
						{
							type: "tableCell",
							content: [{ type: "text", content: "Data 2" }],
						},
					],
				},
			],
		};
		assert.equal(
			transformBlockNode(table),
			"<table><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Data 1</td><td>Data 2</td></tr></tbody></table>",
		);

		// Table row
		const tableRow = {
			type: "tableRow",
			cells: [
				{ type: "tableCell", content: [{ type: "text", content: "Cell 1" }] },
				{ type: "tableCell", content: [{ type: "text", content: "Cell 2" }] },
			],
		};
		assert.equal(
			transformBlockNode(tableRow),
			"<tr><td>Cell 1</td><td>Cell 2</td></tr>",
		);

		// Table cell
		const tableCell = {
			type: "tableCell",
			content: [{ type: "text", content: "Cell content" }],
		};
		assert.equal(transformBlockNode(tableCell), "<td>Cell content</td>");
	});

	it("should handle edge cases and invalid inputs", () => {
		// Invalid nodes
		assert.equal(transformBlockNode(null), "");
		assert.equal(transformBlockNode(undefined), "");
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode({}), "");
		assert.equal(transformBlockNode({ type: "unknown" }), "");

		// Missing properties
		const node = { type: "paragraph" };
		assert.equal(transformBlockNode(node), "<p></p>");

		const headingNode = { type: "heading" };
		assert.equal(transformBlockNode(headingNode), "<h1></h1>");

		const listNode = { type: "list" };
		assert.equal(transformBlockNode(listNode), "<ul></ul>");

		// Non-array content
		const paragraphNode = { type: "paragraph", content: "string content" };
		assert.equal(transformBlockNode(paragraphNode), "<p></p>");

		const headingNode2 = { type: "heading", content: 123 };
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode(headingNode2), "<h1></h1>");

		const listItemNode = {
			type: "listItem",
			content: /** @type {any} */ (null),
		};
		assert.equal(transformBlockNode(listItemNode), "<li></li>");

		const blockquoteNode = {
			type: "blockquote",
			content: /** @type {any} */ (undefined),
		};
		assert.equal(
			transformBlockNode(blockquoteNode),
			"<blockquote><p></p></blockquote>",
		);

		// Code block with non-string content
		const codeBlockNode = { type: "codeBlock", content: 123 };
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode(codeBlockNode), "<pre><code></code></pre>");

		// Task list items
		const checkedTask = {
			type: "listItem",
			content: [{ type: "text", content: "Completed task" }],
			checked: true,
		};
		assert.equal(
			transformBlockNode(checkedTask),
			'<li><input type="checkbox" checked disabled> Completed task</li>',
		);

		const uncheckedTask = {
			type: "listItem",
			content: [{ type: "text", content: "Incomplete task" }],
			checked: false,
		};
		assert.equal(
			transformBlockNode(uncheckedTask),
			'<li><input type="checkbox" disabled> Incomplete task</li>',
		);

		// HTML block with non-string html
		const invalidHtmlBlock = { type: "htmlBlock", html: 123 };
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode(invalidHtmlBlock), "");

		// Table with no rows - should still render table tag
		const emptyTable = { type: "table", rows: [] };
		assert.equal(transformBlockNode(emptyTable), "<table></table>");

		// Table with non-array rows
		const invalidTable = { type: "table", rows: "not an array" };
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode(invalidTable), "");

		// Table with only header (no data rows)
		const headerOnlyTable = {
			type: "table",
			rows: [
				{
					type: "tableRow",
					cells: [
						{
							type: "tableCell",
							content: [{ type: "text", content: "Header" }],
						},
					],
				},
			],
		};
		assert.equal(
			transformBlockNode(headerOnlyTable),
			"<table><thead><tr><th>Header</th></tr></thead></table>",
		);

		// Table row with no cells - should still render row tag
		const emptyCellsRow = { type: "tableRow", cells: [] };
		assert.equal(transformBlockNode(emptyCellsRow), "<tr></tr>");

		// Table row with non-array cells
		const invalidCellsRow = { type: "tableRow", cells: "not an array" };
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode(invalidCellsRow), "");

		// Table cell with non-array content
		const invalidCellContent = { type: "tableCell", content: "string content" };
		// @ts-expect-error - Testing invalid input
		assert.equal(transformBlockNode(invalidCellContent), "<td></td>");
	});
});
