/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for code-to-AST parser module
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { parseCodeIntoAst, reconstructFromAst } from "./parse-code-into-ast.js";

describe("parseCodeIntoAst", () => {
	describe("basic functionality", () => {
		it("should handle code with no tagged templates", () => {
			const code = "const x = 42;\nreturn x * 2;";
			const ast = parseCodeIntoAst("html", code);

			assert.deepStrictEqual(ast, {
				type: "functionBody",
				parts: [{ type: "code", content: code }],
			});
		});

		it("should parse simple tagged template", () => {
			const code = "return html`<div>Hello World</div>`;";
			const ast = parseCodeIntoAst("html", code);

			assert.strictEqual(ast.type, "functionBody");
			assert.strictEqual(ast.parts.length, 3);
			assert.strictEqual(ast.parts[0].type, "code");
			assert.strictEqual(ast.parts[0].content, "return ");
			assert.strictEqual(ast.parts[1].type, "taggedTemplate");
			assert.strictEqual(ast.parts[1].functionName, "html");
			assert.deepStrictEqual(ast.parts[1].strings, ["<div>Hello World</div>"]);
			assert.deepStrictEqual(ast.parts[1].expressions, []);
			assert.strictEqual(ast.parts[2].type, "code");
			assert.strictEqual(ast.parts[2].content, ";");
		});

		it("should parse tagged template with single expression", () => {
			const code = `return html\`<div>\${name}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts[1];
			assert.strictEqual(template.type, "taggedTemplate");
			assert.deepStrictEqual(template.strings, ["<div>", "</div>"]);
			assert.strictEqual(template.expressions.length, 1);
			assert.strictEqual(template.expressions[0].content, "name");
		});

		it("should parse tagged template with multiple expressions", () => {
			const code = `return html\`<div class="\${cls}">\${content}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts[1];
			assert.deepStrictEqual(template.strings, [
				'<div class="',
				'">',
				"</div>",
			]);
			assert.strictEqual(template.expressions.length, 2);
			assert.strictEqual(template.expressions[0].content, "cls");
			assert.strictEqual(template.expressions[1].content, "content");
		});
	});

	describe("complex expressions", () => {
		it("should handle nested objects in expressions", () => {
			const code = `html\`<div>\${{ a: 1, b: { c: 2 } }}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts[0];
			assert.strictEqual(
				template.expressions[0].content,
				"{ a: 1, b: { c: 2 } }",
			);
		});

		it("should handle function calls in expressions", () => {
			const code = `html\`<div>\${getData(user.id)}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts[0];
			assert.strictEqual(template.expressions[0].content, "getData(user.id)");
		});

		it("should handle arrow functions in expressions", () => {
			const code = `html\`<ul>\${items.map((item) => html\`<li>\${item}</li>\`)}</ul>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts[0];
			const expression = template.expressions[0];
			assert.ok(expression.content.includes("items.map"));

			// Should recursively parse nested tagged template
			const nestedTemplate = expression.ast.parts.find(
				(p) => p.type === "taggedTemplate",
			);
			assert.ok(nestedTemplate);
			assert.strictEqual(nestedTemplate.functionName, "html");
		});
	});

	describe("multiple tagged templates", () => {
		it("should handle multiple templates in sequence", () => {
			const code =
				"const a = html`<div>A</div>`; const b = html`<span>B</span>`;";
			const ast = parseCodeIntoAst("html", code);

			const templates = ast.parts.filter((p) => p.type === "taggedTemplate");
			assert.strictEqual(templates.length, 2);
			assert.deepStrictEqual(templates[0].strings, ["<div>A</div>"]);
			assert.deepStrictEqual(templates[1].strings, ["<span>B</span>"]);
		});

		it("should handle templates with different function names", () => {
			const code =
				"html`<div>HTML</div>` + css`color: red;` + html`<span>More</span>`;";
			const ast = parseCodeIntoAst("html", code);

			const templates = ast.parts.filter((p) => p.type === "taggedTemplate");
			assert.strictEqual(templates.length, 2); // Only html templates
			assert.deepStrictEqual(templates[0].strings, ["<div>HTML</div>"]);
			assert.deepStrictEqual(templates[1].strings, ["<span>More</span>"]);
		});
	});

	describe("edge cases", () => {
		it("should handle backticks in string literals", () => {
			const code = `const str = "This has \`backticks\` in it"; return html\`<div>\${str}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const templates = ast.parts.filter((p) => p.type === "taggedTemplate");
			// Should find template even when string has backticks
			assert.ok(templates.length >= 1, "Should find at least one template");
			if (templates.length > 0) {
				assert.strictEqual(templates[0].expressions[0].content, "str");
			}
		});

		it("should handle escaped characters in template literals", () => {
			const code = `html\`<div>\\\`escaped backtick\\\` and \\\${escaped expression}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts.find((p) => p.type === "taggedTemplate");
			assert.ok(template);
			assert.strictEqual(
				template.strings[0],
				"<div>\\`escaped backtick\\` and \\$" + "{escaped expression}</div>",
			);
		});

		it("should handle template literals with no expressions", () => {
			const code = "html`<div>Static content only</div>`;";
			const ast = parseCodeIntoAst("html", code);

			const template = ast.parts[0];
			assert.deepStrictEqual(template.strings, [
				"<div>Static content only</div>",
			]);
			assert.deepStrictEqual(template.expressions, []);
		});

		it("should handle malformed tagged template gracefully", () => {
			const code = "html`<div>unclosed template";
			const ast = parseCodeIntoAst("html", code);

			// Should treat as regular code when parsing fails
			// May have 1 or more parts depending on how parser handles malformed input
			assert.ok(ast.parts.length >= 1);
			const codeContent = ast.parts.map((p) => p.content || "").join("");
			assert.ok(codeContent.includes("html`<div>unclosed template"));
		});

		it("should handle invalid input gracefully", () => {
			assert.deepStrictEqual(parseCodeIntoAst(null, "code"), {
				type: "functionBody",
				parts: [{ type: "code", content: "code" }],
			});

			assert.deepStrictEqual(parseCodeIntoAst("html", null), {
				type: "functionBody",
				parts: [{ type: "code", content: "" }],
			});
		});
	});

	describe("nested tagged templates", () => {
		it("should recursively parse nested templates in expressions", () => {
			const code = `html\`<div>\${condition ? html\`<span>True</span>\` : html\`<span>False</span>\`}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			const outerTemplate = ast.parts[0];
			const expression = outerTemplate.expressions[0];

			// The expression AST should contain nested tagged templates
			const nestedTemplates = expression.ast.parts.filter(
				(p) => p.type === "taggedTemplate",
			);
			assert.strictEqual(nestedTemplates.length, 2);
			assert.deepStrictEqual(nestedTemplates[0].strings, ["<span>True</span>"]);
			assert.deepStrictEqual(nestedTemplates[1].strings, [
				"<span>False</span>",
			]);
		});

		it("should handle deeply nested templates", () => {
			const code = `html\`<div>\${html\`<p>\${html\`<b>Deep</b>\`}</p>\`}</div>\`;`;
			const ast = parseCodeIntoAst("html", code);

			// Should recursively parse all levels
			const outerTemplate = ast.parts[0];
			const level1Expression = outerTemplate.expressions[0];
			const level1Template = level1Expression.ast.parts[0];
			const level2Expression = level1Template.expressions[0];
			const level2Template = level2Expression.ast.parts[0];

			assert.strictEqual(level2Template.type, "taggedTemplate");
			assert.deepStrictEqual(level2Template.strings, ["<b>Deep</b>"]);
		});
	});
});

describe("reconstructFromAst", () => {
	describe("basic reconstruction", () => {
		it("should reconstruct simple code", () => {
			const original = "const x = 42;\nreturn x;";
			const ast = parseCodeIntoAst("html", original);
			const reconstructed = reconstructFromAst(ast);

			assert.strictEqual(reconstructed, original);
		});

		it("should reconstruct tagged template", () => {
			const original = "html`<div>Hello</div>`;";
			const ast = parseCodeIntoAst("html", original);
			const reconstructed = reconstructFromAst(ast);

			assert.strictEqual(reconstructed, original);
		});

		it("should reconstruct tagged template with expressions", () => {
			const original = `html\`<div class="\${cls}">\${content}</div>\`;`;
			const ast = parseCodeIntoAst("html", original);
			const reconstructed = reconstructFromAst(ast);

			assert.strictEqual(reconstructed, original);
		});
	});

	describe("edge case reconstruction", () => {
		it("should handle invalid AST gracefully", () => {
			assert.strictEqual(reconstructFromAst(null), "");
			assert.strictEqual(reconstructFromAst({}), "");
			assert.strictEqual(reconstructFromAst({ type: "invalid" }), "");
		});

		it("should reconstruct escaped characters", () => {
			const original = `html\`<div>\\\`backtick\\\` \\\${expression}</div>\`;`;
			const ast = parseCodeIntoAst("html", original);
			const reconstructed = reconstructFromAst(ast);

			assert.strictEqual(reconstructed, original);
		});
	});
});

describe("roundtrip integration tests", () => {
	const testCases = [
		// Simple cases
		'return "hello world";',
		"const x = html`<div>Simple</div>`;",
		`html\`<p>\${name}</p>\`;`,
		`html\`<div class="\${cls}">\${content}</div>\`;`,

		// Complex cases
		`const result = html\`<ul>\${items.map((item) => html\`<li>\${item.name}</li>\`)}</ul>\`;`,
		"if (condition) { return html`<div>True</div>`; } else { return html`<div>False</div>`; }",
		`html\`<div>\${x > 0 ? html\`<span>Positive</span>\` : html\`<span>Negative</span>\`}</div>\`;`,

		// Edge cases
		`const str = "This has \`backticks\` in it"; html\`<div>\${str}</div>\`;`,
		`html\`<div>\\\`escaped\\\` and \\\${escaped}</div>\`;`,
		"html`<div>No expressions</div>`;",
		"const a = html`<p>A</p>`; const b = html`<span>B</span>`;",

		// Realistic template function
		`const items = data.map((item) => {\\n\\treturn html\`<li class="\${item.active ? 'active' : ''}">\\n\\t\\t<h3>\${item.title}</h3>\\n\\t\\t<p>\${item.description}</p>\\n\\t\\t\${item.children ? html\`<ul>\${item.children.map(child => html\`<li>\${child.name}</li>\`)}</ul>\` : ''}\\n\\t</li>\`;\\n});\\nreturn html\`<ul class="item-list">\${items}</ul>\`;`,
	];

	testCases.forEach((testCase, index) => {
		it(`should perfectly roundtrip test case ${index + 1}`, () => {
			const ast = parseCodeIntoAst("html", testCase);
			const reconstructed = reconstructFromAst(ast);

			assert.strictEqual(
				reconstructed,
				testCase,
				`Roundtrip failed for: ${testCase.slice(0, 50)}...`,
			);
		});
	});

	it("should handle complex realistic component", () => {
		const original = `const header = html\`<header>\${props.title}</header>\`;\\nconst nested = html\`<div>\${html\`<span>nested</span>\`}</div>\`;\\nreturn header + nested;`;

		const ast = parseCodeIntoAst("html", original);
		const reconstructed = reconstructFromAst(ast);

		assert.strictEqual(reconstructed, original);

		// Verify AST structure makes sense
		const templates = ast.parts.filter((p) => p.type === "taggedTemplate");
		assert.ok(templates.length >= 2, "Should parse at least 2 templates");

		// Verify nested parsing worked
		const hasNestedTemplates = templates.some((template) =>
			template.expressions.some((expr) =>
				expr.ast.parts.some((part) => part.type === "taggedTemplate"),
			),
		);
		assert.ok(hasNestedTemplates, "Should have nested templates");
	});
});
