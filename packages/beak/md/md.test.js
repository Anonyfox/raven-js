import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { code, md, ref, table } from "./md.js";

describe("md template literal", () => {
	it("handles static strings", () => {
		assert.equal(md`# Hello World`, "# Hello World\n");
		assert.equal(md`Simple text`, "Simple text");
	});

	it("interpolates values", () => {
		const title = "Test";
		assert.equal(md`# ${title}`, "# Test\n");
		assert.equal(md`Value is ${42}`, "Value is 42");
	});

	it("handles arrays in context", () => {
		const items = ["First", "Second"];
		const result = md`- ${items.join("\n- ")}`;
		assert.equal(result, "- First\n- Second\n");
	});

	it("normalizes whitespace", () => {
		const result = md`# Title


Too many newlines


Text`;
		assert(result.includes("Title"));
		assert(!result.includes("\n\n\n"));
	});

	it("caches templates", () => {
		const template = ["# ", ""];
		const first = md(template, "Test");
		const second = md(template, "Again");
		assert.equal(first, "# Test\n");
		assert.equal(second, "# Again\n");
	});

	it("handles boolean and null values", () => {
		assert.equal(md`${null}`, "");
		assert.equal(md`${false}`, "");
		assert.equal(md`${true}`, "true");
		assert.equal(md`${undefined}`, "");
	});

	it("detects list context", () => {
		const value = "Item";
		const result = md`- ${value}`;
		assert.equal(result, "- Item\n");
	});

	it("detects code context", () => {
		const value = "test";
		const result = md`\`\`\`${value}`;
		assert(result.includes("test"));
	});

	it("handles object values as definition lists", () => {
		const obj = { key: "value", number: 42 };
		const result = md`${obj}`;
		assert(result.includes("**key**: value"));
		assert(result.includes("**number**: 42"));
	});
});

describe("ref helper", () => {
	it("creates reference link object", () => {
		const link = ref("Documentation", "docs");
		assert.equal(link.type, "reference");
		assert.equal(link.text, "Documentation");
		assert.equal(link.ref, "docs");
	});

	it("integrates with md template", () => {
		const link = ref("Guide", "guide");
		const result = md`See ${link}`;
		assert.equal(result, "See [Guide][guide]");
	});
});

describe("code helper", () => {
	it("creates code block object", () => {
		const block = code('console.log("hello");', "javascript");
		assert.equal(block.type, "code");
		assert.equal(block.code, 'console.log("hello");');
		assert.equal(block.language, "javascript");
	});

	it("handles missing language", () => {
		const block = code("SELECT * FROM users");
		assert.equal(block.language, "");
	});

	it("integrates with md template", () => {
		const example = code("npm install", "bash");
		const result = md`${example}`;
		assert.equal(result, "```bash\nnpm install\n```\n");
	});
});

describe("table helper", () => {
	it("creates table object", () => {
		const tbl = table(["Name", "Status"], [["Test", "Pass"]]);
		assert.equal(tbl.type, "table");
		assert.deepEqual(tbl.headers, ["Name", "Status"]);
		assert.deepEqual(tbl.rows, [["Test", "Pass"]]);
	});

	it("integrates with md template", () => {
		const results = table(
			["Feature", "Status"],
			[
				["Parser", "Done"],
				["Tests", "Done"],
			],
		);
		const result = md`${results}`;
		assert(result.includes("| Feature | Status |"));
		assert(result.includes("| --- | --- |"));
		assert(result.includes("| Parser | Done |"));
	});

	it("handles empty table", () => {
		const empty = table([], []);
		const result = md`${empty}`;
		assert.equal(result, "|  |\n|  |\n");
	});
});

describe("array processing", () => {
	it("filters null and false values", () => {
		const values = ["keep", null, false, "also keep"];
		const result = md`${values}`;
		assert(result.includes("keep"));
		assert(result.includes("also keep"));
		assert(!result.includes("null"));
		assert(!result.includes("false"));
	});

	it("joins with context awareness", () => {
		const items = ["One", "Two"];
		const listResult = md`- ${items.map((i) => `Item ${i}`).join("\n- ")}`;
		assert(listResult.includes("- Item One\n- Item Two"));
	});
});

describe("whitespace normalization", () => {
	it("removes excessive blank lines", () => {
		const content = "Title\n\n\n\nText";
		const result = md`${content}`;
		assert(!result.includes("\n\n\n"));
	});

	it("cleans trailing whitespace", () => {
		const content = "Line with spaces   \nNext line";
		const result = md`${content}`;
		assert(!result.includes("   "));
	});

	it("adds newlines for structural elements", () => {
		const result = md`# Title`;
		assert.equal(result, "# Title\n");
	});

	it("keeps single line content simple", () => {
		const result = md`Simple text`;
		assert.equal(result, "Simple text");
	});
});
