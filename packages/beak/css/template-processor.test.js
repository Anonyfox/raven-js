import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { flattenValue, processCSSTemplate } from "./template-processor.js";

describe("core functionality", () => {
	it("should flatten all value types with CSS-specific conversions", () => {
		// Primitive type handling
		assert.equal(flattenValue(null), "");
		assert.equal(flattenValue(undefined), "");
		assert.equal(flattenValue("hello"), "hello");
		assert.equal(flattenValue(42), "42");
		assert.equal(flattenValue(0), "0"); // Preserve zero
		assert.equal(flattenValue(true), "true");
		assert.equal(flattenValue(false), ""); // CSS conditional behavior
		assert.equal(flattenValue(""), "");

		// Object to CSS conversion with camelCase→kebab-case
		assert.equal(flattenValue({ key: "value" }), "key:value;");
		assert.equal(
			flattenValue({ backgroundColor: "#007bff", fontSize: "16px" }),
			"background-color:#007bff; font-size:16px;",
		);
		assert.equal(
			flattenValue({
				WebkitTransform: "scale(1.02)",
				MozTransform: "rotate(45deg)",
			}),
			"-webkit-transform:scale(1.02); -moz-transform:rotate(45deg);",
		);
		assert.equal(flattenValue({}), "");

		// Object filtering null/undefined values
		assert.equal(
			flattenValue({
				color: "red",
				background: null,
				fontSize: undefined,
				content: "",
			}),
			"color:red; content:;",
		);

		// Nested objects
		assert.equal(
			flattenValue({
				padding: "10px",
				border: { width: "1px", style: "solid" },
				margin: "5px",
			}),
			"padding:10px; border:width:1px; style:solid; margin:5px;",
		);

		// Functions convert to string
		const func = () => "test";
		assert.equal(flattenValue(func), '() => "test"');
	});

	it("should process arrays with intelligent flattening and sparse array handling", () => {
		// Basic array flattening
		assert.equal(flattenValue([]), "");
		assert.equal(flattenValue(["hello"]), "hello");
		assert.equal(flattenValue(["hello", "world"]), "hello world");
		assert.equal(flattenValue(["string", 42, true]), "string 42 true");

		// Null/undefined filtering in arrays
		assert.equal(flattenValue([null, null, null]), "");
		assert.equal(flattenValue([undefined, undefined, undefined]), "");
		assert.equal(
			flattenValue(["hello", null, undefined, "world", false]),
			"hello world",
		);
		assert.equal(
			flattenValue([null, "keep", undefined, "this", false]),
			"keep this",
		);

		// Sparse array handling (holes in indices)
		const sparse = [];
		sparse[0] = "first";
		sparse[2] = "third"; // Index 1 is missing
		assert.equal(flattenValue(sparse), "first third");

		const sparseWithHoles = [];
		sparseWithHoles[1] = "second";
		sparseWithHoles[2] = "third"; // Index 0 is missing
		assert.equal(flattenValue(sparseWithHoles), "second third");

		// Nested array flattening
		assert.equal(flattenValue([["hello", "world"]]), "hello world");
		assert.equal(flattenValue([[[["deepest"]]]]), "deepest");
		assert.equal(
			flattenValue([["hello"], "world", ["test"]]),
			"hello world test",
		);
		assert.equal(
			flattenValue([["hello", null], "world", [null, "test"]]),
			"hello world test",
		);

		// Mixed types in arrays
		assert.equal(
			flattenValue(["string", 42, true, { obj: "value" }]),
			"string 42 true obj:value;",
		);
		assert.equal(
			flattenValue([
				{
					boxShadow: [
						"0 2px 4px rgba(0,0,0,0.1)",
						"0 4px 8px rgba(0,0,0,0.15)",
					],
				},
			]),
			"box-shadow:0 2px 4px rgba(0,0,0,0.1) 0 4px 8px rgba(0,0,0,0.15);",
		);

		// Array constructor edge cases
		const arrayWithLength = new Array(3); // Length but no elements
		assert.equal(flattenValue(arrayWithLength), "");
		const arrayWithSomeElements = new Array(5);
		arrayWithSomeElements[2] = "middle";
		assert.equal(flattenValue(arrayWithSomeElements), "middle");
	});

	it("should process CSS templates with advanced interpolation patterns", () => {
		// Basic template processing
		assert.equal(processCSSTemplate``, "");
		assert.equal(processCSSTemplate`color: red;`, "color: red;");

		const color = "blue";
		assert.equal(processCSSTemplate`color: ${color};`, "color: blue;");

		const color2 = "red",
			size = "16px";
		assert.equal(
			processCSSTemplate`color: ${color2}; font-size: ${size};`,
			"color: red; font-size: 16px;",
		);

		// Interpolation at boundaries
		assert.equal(processCSSTemplate`${color}`, "blue");
		assert.equal(processCSSTemplate`color: ${color}`, "color: blue");
		assert.equal(processCSSTemplate`${color}: value;`, "blue: value;");

		// Array value processing
		const colors = ["red", "blue", "green"];
		assert.equal(
			processCSSTemplate`colors: ${colors};`,
			"colors: red blue green;",
		);
		assert.equal(processCSSTemplate`list: ${[]};`, "list: ;");

		const singleElement = ["red"];
		assert.equal(processCSSTemplate`color: ${singleElement};`, "color: red;");

		// Nested array handling
		const nestedArray = [
			["red", "blue"],
			["green", "yellow"],
		];
		assert.equal(
			processCSSTemplate`colors: ${nestedArray};`,
			"colors: red blue green yellow;",
		);
	});
});

describe("edge cases and errors", () => {
	it("should handle circular references and extreme input scenarios", () => {
		// Circular reference prevention (should throw)
		const circular = [];
		circular[0] = circular;
		assert.throws(() => flattenValue(circular), RangeError);

		const selfRef = [];
		selfRef[0] = selfRef;
		assert.throws(() => flattenValue(selfRef), RangeError);

		// Large data structures
		const largeArray = Array(1000).fill("item");
		assert.equal(flattenValue(largeArray), largeArray.join(" "));

		const longString = "a".repeat(1000);
		assert.equal(flattenValue([longString, "short"]), `${longString} short`);

		// Complex null/undefined patterns in templates
		assert.equal(
			processCSSTemplate`color: ${null}; background: red;`,
			"color: ; background: red;",
		);
		assert.equal(
			processCSSTemplate`color: ${undefined}; background: blue;`,
			"color: ; background: blue;",
		);
		assert.equal(
			processCSSTemplate`color: ${null}; background: ${undefined}; border: solid;`,
			"color: ; background: ; border: solid;",
		);
		assert.equal(
			processCSSTemplate`${null}color: red; background: ${undefined}`,
			"color: red; background: ",
		);

		// Complex array edge cases
		const falsy = [0, false, "", null, undefined];
		assert.equal(processCSSTemplate`falsy: ${falsy};`, "falsy: 0;");

		const allFalsy = [null, undefined, false, ""];
		assert.equal(processCSSTemplate`allFalsy: ${allFalsy};`, "allFalsy: ;");

		const onlyNulls = [null, undefined, null, undefined];
		assert.equal(processCSSTemplate`onlyNulls: ${onlyNulls};`, "onlyNulls: ;");

		// Whitespace edge cases for empty values
		const result = processCSSTemplate`
			.test {
				color: ${null};
				background: ${undefined};
				margin: 10px;
			}
		`;
		assert.ok(result.includes("color: ;"));
		assert.ok(result.includes("background: ;"));
		assert.ok(result.includes("margin: 10px;"));
	});

	it("should optimize performance paths and handle type coercion edge cases", () => {
		// Zero value handling (important CSS behavior)
		assert.equal(processCSSTemplate`opacity: ${0};`, "opacity: 0;");
		assert.equal(processCSSTemplate`display: ${false};`, "display: ;");
		assert.equal(processCSSTemplate`content: "${""}";`, 'content: "";');

		// Numbers and mathematical expressions
		assert.equal(
			processCSSTemplate`width: ${100}px; height: ${200}px;`,
			"width: 100px; height: 200px;",
		);

		// Boolean handling
		assert.equal(
			processCSSTemplate`enabled: ${true}; disabled: ${false};`,
			"enabled: true; disabled: ;",
		);

		// Object conversion
		const theme = { primary: "#007bff" };
		assert.equal(
			processCSSTemplate`theme: ${theme};`,
			"theme: primary:#007bff;;",
		);

		// Function handling
		const func = () => "dynamic";
		assert.equal(
			processCSSTemplate`value: ${func};`,
			'value: () => "dynamic";',
		);

		// Performance edge cases
		const veryLongString = "x".repeat(5000);
		assert.equal(
			processCSSTemplate`content: "${veryLongString}";`,
			`content: "${veryLongString}";`,
		);

		const manyValues = Array(100).fill("value");
		assert.equal(
			processCSSTemplate`${manyValues.join("; ")};`,
			`${manyValues.join("; ")};`,
		);

		// Very deep nesting
		let deepArray = ["deepest"];
		for (let i = 0; i < 100; i++) {
			deepArray = [deepArray];
		}
		assert.equal(processCSSTemplate`depth: ${deepArray};`, "depth: deepest;");
	});
});

describe("integration scenarios", () => {
	it("should support advanced CSS generation patterns", () => {
		// CSS custom properties and complex interpolation
		const varName = "--primary-color";
		const varValue = "#007bff";
		const customPropsResult = processCSSTemplate`
			:root {
				${varName}: ${varValue};
			}
		`;
		assert.equal(
			customPropsResult,
			`
			:root {
				--primary-color: #007bff;
			}
		`,
		);

		// CSS functions with interpolation
		const width = "100%",
			padding = "20px";
		const calcResult = processCSSTemplate`
			.container {
				width: calc(${width} - ${padding});
			}
		`;
		assert.equal(
			calcResult,
			`
			.container {
				width: calc(100% - 20px);
			}
		`,
		);

		// Complex selectors and modern CSS features
		const pseudoClass = "hover",
			color = "red";
		const pseudoResult = processCSSTemplate`
			.button:${pseudoClass} {
				color: ${color};
			}
		`;
		assert.equal(
			pseudoResult,
			`
			.button:hover {
				color: red;
			}
		`,
		);

		// CSS Grid and Flexbox patterns
		const columns = "repeat(3, 1fr)",
			gap = "20px";
		const gridResult = processCSSTemplate`
			.grid-container {
				display: grid;
				grid-template-columns: ${columns};
				gap: ${gap};
			}
		`;
		assert.equal(
			gridResult,
			`
			.grid-container {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: 20px;
			}
		`,
		);
	});

	it("should enable dynamic theming and component composition", () => {
		// Theme-based generation with complex objects
		const theme = {
			colors: { primary: "#007bff", secondary: "#6c757d" },
			spacing: ["10px", "20px", "30px"],
		};

		const themeResult = processCSSTemplate`
			.btn-primary { background-color: ${theme.colors.primary}; }
			.btn-secondary { background-color: ${theme.colors.secondary}; }
			.spacing { margin: ${theme.spacing}; }
		`;

		assert.equal(
			themeResult,
			`
			.btn-primary { background-color: #007bff; }
			.btn-secondary { background-color: #6c757d; }
			.spacing { margin: 10px 20px 30px; }
		`,
		);

		// Conditional CSS generation
		const isDark = true;
		const conditionalResult = processCSSTemplate`
			body {
				background: ${isDark ? "#333" : "#fff"};
				color: ${isDark ? "#fff" : "#333"};
			}
		`;
		assert.equal(
			conditionalResult,
			`
			body {
				background: #333;
				color: #fff;
			}
		`,
		);

		// Component-like patterns with object spreading
		const baseStyles = { padding: "10px", margin: "5px" };
		const themeStyles = { backgroundColor: "#007bff", color: "white" };
		const componentResult = processCSSTemplate`
			.component {
				${baseStyles}
				${themeStyles}
				border: 1px solid #ccc;
			}
		`;
		assert.equal(
			componentResult,
			`
			.component {
				padding:10px; margin:5px;
				background-color:#007bff; color:white;
				border: 1px solid #ccc;
			}
		`,
		);
	});

	it("should handle complex real-world CSS generation scenarios", () => {
		// Responsive design patterns with breakpoints
		const breakpoints = { mobile: "480px", tablet: "768px", desktop: "1024px" };
		const responsiveResult = processCSSTemplate`
			.container { padding: 10px; }
			@media (min-width: ${breakpoints.mobile}) { .container { padding: 15px; } }
			@media (min-width: ${breakpoints.tablet}) { .container { padding: 20px; } }
			@media (min-width: ${breakpoints.desktop}) { .container { padding: 30px; } }
		`;

		assert.ok(responsiveResult.includes("@media (min-width: 480px)"));
		assert.ok(responsiveResult.includes("@media (min-width: 768px)"));
		assert.ok(responsiveResult.includes("@media (min-width: 1024px)"));

		// Animation and keyframe generation
		const duration = "2s",
			timing = "ease-in-out";
		const animationResult = processCSSTemplate`
			.animated {
				animation: fadeIn ${duration} ${timing} infinite;
			}
		`;
		assert.equal(
			animationResult,
			`
			.animated {
				animation: fadeIn 2s ease-in-out infinite;
			}
		`,
		);

		// CSS-in-JS style patterns with object destructuring
		const styles = {
			container: { display: "flex", flexDirection: "column", gap: "20px" },
			header: { fontSize: "24px", fontWeight: "bold" },
		};
		const cssInJsResult = processCSSTemplate`
			.container {
				display: ${styles.container.display};
				flex-direction: ${styles.container.flexDirection};
				gap: ${styles.container.gap};
			}
			.header {
				font-size: ${styles.header.fontSize};
				font-weight: ${styles.header.fontWeight};
			}
		`;

		assert.ok(cssInJsResult.includes("display: flex"));
		assert.ok(cssInJsResult.includes("flex-direction: column"));
		assert.ok(cssInJsResult.includes("font-size: 24px"));
		assert.ok(cssInJsResult.includes("font-weight: bold"));
	});
});
