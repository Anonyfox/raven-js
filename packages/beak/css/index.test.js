import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { css, style } from "./index.js";

describe("core functionality", () => {
	it("should process CSS templates with minification and dynamic interpolation", () => {
		// Static CSS formatting
		const basicResult = css`.button { color: white; background: #007bff; padding: 10px 15px; }`;
		assert.equal(
			basicResult,
			".button{ color:white; background:#007bff; padding:10px 15px; }",
		);

		// Dynamic value interpolation
		const color = "red",
			bg = "#333";
		const dynamicResult = css`.item { color: ${color}; background: ${bg}; }`;
		assert.equal(dynamicResult, ".item{ color:red; background:#333; }");

		// Multiple rules and complex values
		const complexResult = css`
			.btn { font-family: Arial, sans-serif; }
			.box { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1); }
			.transform { -webkit-transform: rotate(45deg); transform: rotate(45deg); }
		`;
		assert.equal(
			complexResult,
			".btn{ font-family:Arial, sans-serif; } .box{ box-shadow:0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1); } .transform{ -webkit-transform:rotate(45deg); transform:rotate(45deg); }",
		);

		// Single property
		const singleResult = css`color: white;`;
		assert.equal(singleResult, "color:white;");
	});

	it("should handle style wrapper with identical CSS processing", () => {
		// Basic style wrapping
		const basicStyle = style`.button { color: white; background: #007bff; }`;
		assert.equal(
			basicStyle,
			"<style>.button{ color:white; background:#007bff; }</style>",
		);

		// Multiple rules in style tags
		const multiStyle = style`.btn { color: white; } .container { max-width: 1200px; }`;
		assert.equal(
			multiStyle,
			"<style>.btn{ color:white; } .container{ max-width:1200px; }</style>",
		);
	});

	it("should process complex value types and object-to-CSS conversion", () => {
		// Array flattening
		const arrayResult = css`.theme { margin: ${[10, 20, 30]}px; color: ${["red", "bold"]}; }`;
		assert.equal(arrayResult, ".theme{ margin:10 20 30px; color:red bold; }");

		// Object to CSS properties (camelCase → kebab-case)
		const objResult = css`.component { ${{ backgroundColor: "#007bff", fontSize: "16px", borderRadius: "4px" }} }`;
		assert.equal(
			objResult,
			".component{ background-color:#007bff; font-size:16px; border-radius:4px; }",
		);

		// Nested arrays and objects
		const nestedResult = css`.complex { padding: ${[10, { marginLeft: "5px" }]}; }`;
		assert.equal(nestedResult, ".complex{ padding:10 margin-left:5px; ; }");
	});
});

describe("edge cases and errors", () => {
	it("should handle empty inputs and edge values gracefully", () => {
		// Empty templates
		assert.equal(css``, "");
		assert.equal(style``, "<style></style>");

		// Null and undefined filtering
		const nullResult = css`.test { color: ${null}; background: ${undefined}; margin: ${0}; }`;
		assert.equal(nullResult, ".test{ color:; background:; margin:0; }");

		// False values (conditional styling)
		const falseResult = css`.conditional { display: ${false && "block"}; opacity: ${0}; }`;
		assert.equal(falseResult, ".conditional{ display:; opacity:0; }");

		// Empty arrays and objects
		assert.equal(
			css`.empty { list: ${[]}; props: ${{}}; }`,
			".empty{ list:; props:; }",
		);
	});

	it("should handle sparse arrays and complex nested structures", () => {
		// Sparse arrays (holes in indices)
		const sparse = [];
		sparse[0] = "first";
		sparse[2] = "third";
		const sparseResult = css`.sparse { values: ${sparse}; }`;
		assert.equal(sparseResult, ".sparse{ values:first third; }");

		// Deeply nested arrays
		const deepResult = css`.deep { nested: ${[[[["deepest"]]]]}; }`;
		assert.equal(deepResult, ".deep{ nested:deepest; }");

		// Mixed null/undefined in arrays
		const mixedResult = css`.mixed { items: ${[null, "keep", undefined, "this", false]}; }`;
		assert.equal(mixedResult, ".mixed{ items:keep this; }");
	});

	it("should prevent circular references and handle extreme cases", () => {
		// Very long values
		const longString = "a".repeat(1000);
		const longResult = css`.long { content: "${longString}"; }`;
		assert.equal(longResult, `.long{ content:"${longString}"; }`);

		// Circular reference protection (should throw)
		const circular = [];
		circular[0] = circular;
		assert.throws(() => css`.circular { data: ${circular}; }`, RangeError);

		// Large arrays
		const largeArray = Array(100).fill("item");
		const largeResult = css`.large { list: ${largeArray}; }`;
		assert.equal(largeResult, `.large{ list:${largeArray.join(" ")}; }`);
	});
});

describe("integration scenarios", () => {
	it("should support advanced CSS patterns and real-world usage", () => {
		// CSS custom properties
		const customProps = css`:root { --primary: ${"#007bff"}; --spacing: ${[10, 20]}px; }`;
		assert.equal(customProps, ":root{ --primary:#007bff; --spacing:10 20px; }");

		// Media queries with interpolation
		const breakpoint = "768px";
		const mediaResult = css`
			.responsive { padding: 10px; }
			@media (max-width: ${breakpoint}) { .responsive { padding: 5px; } }
		`;
		assert.equal(
			mediaResult,
			".responsive{ padding:10px; } @media (max-width:768px){ .responsive{ padding:5px; } }",
		);

		// Keyframes and animations
		const animResult = css`
			@keyframes fade { from { opacity: ${0}; } to { opacity: ${1}; } }
			.animated { animation: fade ${"2s"} ease-in-out; }
		`;
		assert.equal(
			animResult,
			"@keyframes fade{ from{ opacity:0; } to{ opacity:1; } } .animated{ animation:fade 2s ease-in-out; }",
		);
	});

	it("should enable dynamic theming and component composition", () => {
		// Theme-based generation
		const theme = {
			primary: "#007bff",
			secondary: "#6c757d",
			spacing: [10, 15, 20],
		};
		const themeResult = css`
			.btn-primary { background: ${theme.primary}; padding: ${theme.spacing}px; }
			.btn-secondary { background: ${theme.secondary}; }
		`;
		assert.equal(
			themeResult,
			".btn-primary{ background:#007bff; padding:10 15 20px; } .btn-secondary{ background:#6c757d; }",
		);

		// Conditional styling patterns
		const isDark = true;
		const conditionalResult = css`
			body {
				background: ${isDark ? "#333" : "#fff"};
				${isDark && { color: "#fff", borderColor: "#555" }}
			}
		`;
		assert.equal(
			conditionalResult,
			"body{ background:#333; color:#fff; border-color:#555; }",
		);
	});

	it("should maintain performance with complex CSS generation", () => {
		// Component-like patterns
		const components = {
			button: { padding: "10px 20px", borderRadius: "4px" },
			card: { boxShadow: "0 2px 4px rgba(0,0,0,0.1)", background: "#fff" },
		};
		const componentResult = css`
			.button { ${components.button} cursor: pointer; }
			.card { ${components.card} border: 1px solid #ddd; }
		`;
		assert.equal(
			componentResult,
			".button{ padding:10px 20px; border-radius:4px; cursor:pointer; } .card{ box-shadow:0 2px 4px rgba(0,0,0,0.1); background:#fff; border:1px solid #ddd; }",
		);

		// Grid and flexbox patterns
		const layoutResult = css`
			.grid {
				display: grid;
				grid-template-columns: ${["repeat(3, 1fr)"]};
				gap: ${[20, 10]}px;
			}
			.flex {
				display: flex;
				justify-content: ${"center"};
				align-items: ${"stretch"};
			}
		`;
		assert.equal(
			layoutResult,
			".grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:20 10px; } .flex{ display:flex; justify-content:center; align-items:stretch; }",
		);
	});
});
