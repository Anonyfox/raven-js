/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for AST-to-optimized-code transformer
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { parseCodeIntoAst } from "./parse-code-into-ast.js";
import { transformAstToFastCode } from "./transform-ast-to-fast-code.js";

describe("transformAstToFastCode", () => {
	describe("basic functionality", () => {
		it("should handle empty or invalid AST", () => {
			assert.strictEqual(transformAstToFastCode(null), "");
			assert.strictEqual(transformAstToFastCode({}), "");
			assert.strictEqual(transformAstToFastCode({ type: "invalid" }), "");
		});

		it("should preserve plain code without templates", () => {
			const ast = parseCodeIntoAst("html", "const x = 42;\nreturn x * 2;");
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, "const x = 42;\nreturn x * 2;");
		});

		it("should transform static template literal", () => {
			const ast = parseCodeIntoAst(
				"html",
				`return html\`<div>Hello World</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, 'return "<div>Hello World</div>";');
		});

		it("should transform template with single expression", () => {
			const ast = parseCodeIntoAst(
				"html",
				`return html\`<div>\${name}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, 'return "<div>" + name + "</div>";');
		});

		it("should transform template with multiple expressions", () => {
			const ast = parseCodeIntoAst(
				"html",
				`return html\`<div class="\${cls}">\${content}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(
				result,
				'return "<div class=\\"" + cls + "\\">" + content + "</div>";',
			);
		});
	});

	describe("complex expressions", () => {
		it("should handle object expressions", () => {
			const ast = parseCodeIntoAst(
				"html",
				`html\`<div>\${{ a: 1, b: 2 }}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, '"<div>" + { a: 1, b: 2 } + "</div>";');
		});

		it("should handle function call expressions", () => {
			const ast = parseCodeIntoAst(
				"html",
				`html\`<div>\${getData(user.id)}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, '"<div>" + getData(user.id) + "</div>";');
		});

		it("should handle nested tagged templates", () => {
			const ast = parseCodeIntoAst(
				"html",
				`html\`<div>\${html\`<span>nested</span>\`}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			// Should recursively transform the nested template
			assert.strictEqual(result, '"<div>" + "<span>nested</span>" + "</div>";');
		});
	});

	describe("multiple templates", () => {
		it("should handle multiple templates in sequence", () => {
			const ast = parseCodeIntoAst(
				"html",
				"const a = html`<div>A</div>`; const b = html`<span>B</span>`;",
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(
				result,
				'const a = "<div>A</div>"; const b = "<span>B</span>";',
			);
		});

		it("should preserve mixed code and templates", () => {
			const ast = parseCodeIntoAst(
				"html",
				"if (condition) { return html`<div>True</div>`; } else { return html`<div>False</div>`; }",
			);
			const result = transformAstToFastCode(ast);

			assert.strictEqual(
				result,
				'if (condition) { return "<div>True</div>"; } else { return "<div>False</div>"; }',
			);
		});
	});

	describe("edge cases", () => {
		it("should handle empty template", () => {
			const ast = {
				type: "functionBody",
				parts: [
					{
						type: "taggedTemplate",
						functionName: "html",
						strings: [""],
						expressions: [],
					},
				],
			};
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, '""');
		});

		it("should handle template with empty strings", () => {
			const ast = {
				type: "functionBody",
				parts: [
					{
						type: "taggedTemplate",
						functionName: "html",
						strings: ["", "", ""],
						expressions: [{ content: "a" }, { content: "b" }],
					},
				],
			};
			const result = transformAstToFastCode(ast);

			assert.strictEqual(result, "processValue(a) + processValue(b)");
		});

		it("should handle escaped characters in strings", () => {
			const ast = parseCodeIntoAst(
				"html",
				`html\`<div>\\\`escaped\\\` and \\\${escaped}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			// Should properly escape the characters in the JSON string
			assert.ok(result.includes("\\\\`escaped\\\\`"));
			assert.ok(result.includes("\\\\" + "$" + "{escaped}"));
		});
	});

	describe("deeply nested scenarios", () => {
		it("should handle deeply nested templates", () => {
			const ast = parseCodeIntoAst(
				"html",
				`html\`<div>\${html\`<p>\${html\`<b>Deep</b>\`}</p>\`}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			// Should recursively transform all levels
			assert.ok(result.includes('"<div>"'));
			assert.ok(result.includes('"<p>"'));
			assert.ok(result.includes('"<b>Deep</b>"'));
			assert.ok(result.includes('"</p>"'));
			assert.ok(result.includes('"</div>"'));
		});

		it("should handle complex expressions with nested templates", () => {
			const ast = parseCodeIntoAst(
				"html",
				`html\`<div>\${condition ? html\`<span>True</span>\` : html\`<span>False</span>\`}</div>\`;`,
			);
			const result = transformAstToFastCode(ast);

			// Should transform nested conditional templates
			assert.ok(result.includes('"<div>"'));
			assert.ok(result.includes("condition ?"));
			assert.ok(result.includes('"<span>True</span>"'));
			assert.ok(result.includes('"<span>False</span>"'));
		});
	});
});

describe("execution integration tests", () => {
	/**
	 * Naively reconstructs template literals from AST for comparison
	 */
	function naiveReconstruct(ast) {
		return ast.parts
			.map((part) => {
				if (part.type === "code") {
					return part.content || "";
				}
				if (part.type === "taggedTemplate") {
					const { functionName, strings, expressions } = part;
					let result = (functionName || "") + "`";
					const safeStrings = strings || [];
					const safeExpressions = expressions || [];
					for (let i = 0; i < safeStrings.length; i++) {
						result += safeStrings[i];
						if (i < safeExpressions.length) {
							const expr = safeExpressions[i];
							if (expr?.ast?.parts) {
								// Recursively reconstruct nested AST
								result += "${" + naiveReconstruct(expr.ast) + "}";
							} else {
								result += "${" + (expr?.content || "") + "}";
							}
						}
					}
					result += "`";
					return result;
				}
				return "";
			})
			.join("");
	}

	/**
	 * Executes code with given context and returns result
	 */
	function executeCode(code, context = {}) {
		const contextKeys = Object.keys(context);
		const contextValues = Object.values(context);
		const func = new Function(...contextKeys, `return (${code})`);
		return func(...contextValues);
	}

	it("should produce identical results for simple template", () => {
		const originalCode = `(name, age) => html\`<div>Hello \${name}, you are \${age} years old!</div>\``;
		const ast = parseCodeIntoAst("html", originalCode);

		// Naive reconstruction (original template literal)
		const naiveCode = naiveReconstruct(ast);

		// Optimized transformation
		const optimizedCode = transformAstToFastCode(ast);

		// Test data
		const testData = { name: "Alice", age: 30 };

		// Mock html function for testing
		const html = (strings, ...values) => {
			let result = "";
			for (let i = 0; i < strings.length; i++) {
				result += strings[i];
				if (i < values.length) {
					result += values[i];
				}
			}
			return result;
		};

		// Execute both versions
		const naiveResult = executeCode(naiveCode, { html })(
			testData.name,
			testData.age,
		);
		const optimizedResult = executeCode(optimizedCode)(
			testData.name,
			testData.age,
		);

		assert.strictEqual(optimizedResult, naiveResult);
		assert.strictEqual(
			naiveResult,
			"<div>Hello Alice, you are 30 years old!</div>",
		);
	});

	it("should produce identical results for nested templates", () => {
		const originalCode = `(items) => html\`<ul>\${items.map(item => html\`<li>\${item.name}: \${item.value}</li>\`)}</ul>\``;
		const ast = parseCodeIntoAst("html", originalCode);

		const naiveCode = naiveReconstruct(ast);
		const optimizedCode = transformAstToFastCode(ast);

		// Test data
		const testData = [
			{ name: "Item 1", value: "Value A" },
			{ name: "Item 2", value: "Value B" },
		];

		// Mock html function
		const html = (strings, ...values) => {
			let result = "";
			for (let i = 0; i < strings.length; i++) {
				result += strings[i];
				if (i < values.length) {
					result += values[i];
				}
			}
			return result;
		};

		// Execute both versions
		const naiveResult = executeCode(naiveCode, { html })(testData);
		const optimizedResult = executeCode(optimizedCode, { html })(testData);

		assert.strictEqual(optimizedResult, naiveResult);
		assert.ok(naiveResult.includes("<ul>"));
		assert.ok(naiveResult.includes("<li>Item 1: Value A</li>"));
		assert.ok(naiveResult.includes("<li>Item 2: Value B</li>"));
	});

	it("should produce identical results for conditional templates", () => {
		const originalCode = `(user) => html\`<div class="user">
			<h1>\${user.name}</h1>
			\${user.isAdmin ? html\`<span class="admin-badge">Admin</span>\` : html\`<span class="user-badge">User</span>\`}
			<p>Email: \${user.email}</p>
		</div>\``;
		const ast = parseCodeIntoAst("html", originalCode);

		const naiveCode = naiveReconstruct(ast);
		const optimizedCode = transformAstToFastCode(ast);

		// Test data - admin user
		const adminUser = { name: "John", isAdmin: true, email: "john@admin.com" };

		// Mock html function
		const html = (strings, ...values) => {
			let result = "";
			for (let i = 0; i < strings.length; i++) {
				result += strings[i];
				if (i < values.length) {
					result += values[i];
				}
			}
			return result;
		};

		// Execute both versions
		const naiveResult = executeCode(naiveCode, { html })(adminUser);
		const optimizedResult = executeCode(optimizedCode, { html })(adminUser);

		assert.strictEqual(optimizedResult, naiveResult);
		assert.ok(naiveResult.includes("John"));
		assert.ok(naiveResult.includes("admin-badge"));
		assert.ok(naiveResult.includes("john@admin.com"));

		// Test with regular user
		const regularUser = {
			name: "Jane",
			isAdmin: false,
			email: "jane@user.com",
		};
		const naiveResult2 = executeCode(naiveCode, { html })(regularUser);
		const optimizedResult2 = executeCode(optimizedCode, { html })(regularUser);

		assert.strictEqual(optimizedResult2, naiveResult2);
		assert.ok(naiveResult2.includes("Jane"));
		assert.ok(naiveResult2.includes("user-badge"));
		assert.ok(naiveResult2.includes("jane@user.com"));
	});

	it("should produce identical results for complex nested structure", () => {
		const originalCode = `(data) => {
			const header = html\`<header><h1>\${data.title}</h1></header>\`;
			const content = html\`<main>
				\${data.sections.map(section => html\`
					<section>
						<h2>\${section.title}</h2>
						<div class="content">\${section.body}</div>
						\${section.items ? html\`
							<ul>
								\${section.items.map(item => html\`<li>\${item}</li>\`)}
							</ul>
						\` : ''}
					</section>
				\`)}
			</main>\`;
			return html\`<!DOCTYPE html>
			<html>
				<head><title>\${data.title}</title></head>
				<body>
					\${header}
					\${content}
				</body>
			</html>\`;
		}`;

		const ast = parseCodeIntoAst("html", originalCode);
		const naiveCode = naiveReconstruct(ast);
		const optimizedCode = transformAstToFastCode(ast);

		// Complex test data
		const testData = {
			title: "My Website",
			sections: [
				{
					title: "Section 1",
					body: "This is section 1 content",
					items: ["Item A", "Item B"],
				},
				{
					title: "Section 2",
					body: "This is section 2 content",
					items: null,
				},
			],
		};

		// Mock html function
		const html = (strings, ...values) => {
			let result = "";
			for (let i = 0; i < strings.length; i++) {
				result += strings[i];
				if (i < values.length) {
					result += values[i];
				}
			}
			return result;
		};

		// Execute both versions
		const naiveResult = executeCode(naiveCode, { html })(testData);
		const optimizedResult = executeCode(optimizedCode, { html })(testData);

		assert.strictEqual(optimizedResult, naiveResult);
		assert.ok(naiveResult.includes("<!DOCTYPE html>"));
		assert.ok(naiveResult.includes("<title>My Website</title>"));
		assert.ok(naiveResult.includes("<h2>Section 1</h2>"));
		assert.ok(naiveResult.includes("<li>Item A</li>"));
		assert.ok(naiveResult.includes("<li>Item B</li>"));
		assert.ok(naiveResult.includes("This is section 2 content"));
	});

	it("should handle performance comparison", () => {
		const originalCode = `(data) => html\`<div>\${data.map(item => html\`<span>\${item}</span>\`)}</div>\``;
		const ast = parseCodeIntoAst("html", originalCode);

		const naiveCode = naiveReconstruct(ast);
		const optimizedCode = transformAstToFastCode(ast);

		// Large test dataset for performance comparison
		const largeData = Array.from({ length: 100 }, (_, i) => `Item ${i}`);

		const html = (strings, ...values) => {
			let result = "";
			for (let i = 0; i < strings.length; i++) {
				result += strings[i];
				if (i < values.length) {
					result += values[i];
				}
			}
			return result;
		};

		// Warm up and execute both versions
		const naiveFunc = executeCode(naiveCode, { html });
		const optimizedFunc = executeCode(optimizedCode, { html });

		const naiveResult = naiveFunc(largeData);
		const optimizedResult = optimizedFunc(largeData);

		// Results should be identical
		assert.strictEqual(optimizedResult, naiveResult);
		assert.ok(naiveResult.includes("<div>"));
		assert.ok(naiveResult.includes("<span>Item 0</span>"));
		assert.ok(naiveResult.includes("<span>Item 99</span>"));
		assert.strictEqual(naiveResult.match(/<span>/g)?.length, 100);
	});
});

describe("integration with parseCodeIntoAst", () => {
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
		"html`<div>No expressions</div>`;",
		"const a = html`<p>A</p>`; const b = html`<span>B</span>`;",
	];

	testCases.forEach((testCase, index) => {
		it(`should transform test case ${index + 1} correctly`, () => {
			const ast = parseCodeIntoAst("html", testCase);
			const result = transformAstToFastCode(ast);

			// Basic validation - result should be a string
			assert.strictEqual(typeof result, "string");
			assert.ok(result.length > 0);

			// Should not contain template literals anymore
			if (testCase.includes("html`")) {
				assert.ok(
					!result.includes("html`"),
					"Should not contain template literals",
				);
			}

			// Should preserve non-template code
			if (!testCase.includes("html`")) {
				assert.strictEqual(
					result,
					testCase,
					"Should preserve code without templates",
				);
			}
		});
	});

	it("should handle realistic complex component", () => {
		const original = `const header = html\`<header>\${props.title}</header>\`;\\nconst nested = html\`<div>\${html\`<span>nested</span>\`}</div>\`;\\nreturn header + nested;`;
		const ast = parseCodeIntoAst("html", original);
		const result = transformAstToFastCode(ast);

		// Should transform all templates to concatenation
		assert.ok(
			!result.includes("html`"),
			"Should not contain template literals",
		);
		assert.ok(result.includes(" + "), "Should contain concatenation");
		assert.ok(result.includes('"<header>"'), "Should have header tag");
		assert.ok(result.includes('"<div>"'), "Should have div tag");
		assert.ok(
			result.includes('"<span>nested</span>"'),
			"Should have nested span",
		);
	});
});
