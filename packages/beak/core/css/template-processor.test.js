import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { flattenValue, processCSSTemplate } from "./template-processor.js";

describe("flattenValue", () => {
	describe("null and undefined handling", () => {
		it("should return empty string for null", () => {
			const result = flattenValue(null);
			assert.equal(result, "");
		});

		it("should return empty string for undefined", () => {
			const result = flattenValue(undefined);
			assert.equal(result, "");
		});
	});

	describe("non-array values", () => {
		it("should convert strings to string", () => {
			const result = flattenValue("hello");
			assert.equal(result, "hello");
		});

		it("should convert numbers to string", () => {
			const result = flattenValue(42);
			assert.equal(result, "42");
		});

		it("should convert booleans to string", () => {
			const result = flattenValue(true);
			assert.equal(result, "true");
		});

		it("should convert objects to CSS key-value pairs", () => {
			const result = flattenValue({ key: "value" });
			assert.equal(result, "key:value;");
		});

		it("should convert functions to string", () => {
			const func = () => "test";
			const result = flattenValue(func);
			assert.equal(result, '() => "test"');
		});

		it("should convert zero to string", () => {
			const result = flattenValue(0);
			assert.equal(result, "0");
		});

		it("should convert false to empty string (for CSS conditionals)", () => {
			const result = flattenValue(false);
			assert.equal(result, "");
		});

		it("should convert empty string to string", () => {
			const result = flattenValue("");
			assert.equal(result, "");
		});
	});

	describe("array handling", () => {
		it("should handle empty arrays", () => {
			const result = flattenValue([]);
			assert.equal(result, "");
		});

		it("should handle arrays with single element", () => {
			const result = flattenValue(["hello"]);
			assert.equal(result, "hello");
		});

		it("should handle arrays with multiple elements", () => {
			const result = flattenValue(["hello", "world"]);
			assert.equal(result, "hello world");
		});

		it("should handle arrays with null elements", () => {
			const result = flattenValue(["hello", null, "world"]);
			assert.equal(result, "hello world");
		});

		it("should handle arrays with undefined elements", () => {
			const result = flattenValue(["hello", undefined, "world"]);
			assert.equal(result, "hello world");
		});

		it("should handle arrays with only null elements", () => {
			const result = flattenValue([null, null, null]);
			assert.equal(result, "");
		});

		it("should handle arrays with only undefined elements", () => {
			const result = flattenValue([undefined, undefined, undefined]);
			assert.equal(result, "");
		});

		it("should handle arrays with mixed null and valid elements", () => {
			const result = flattenValue([null, "hello", undefined, "world", null]);
			assert.equal(result, "hello world");
		});
	});

	describe("sparse array handling", () => {
		it("should handle sparse arrays with holes", () => {
			const sparse = [];
			sparse[0] = "first";
			sparse[2] = "third";
			const result = flattenValue(sparse);
			assert.equal(result, "first third");
		});

		it("should handle sparse arrays with hole at beginning", () => {
			const sparse = [];
			sparse[1] = "second";
			sparse[2] = "third";
			const result = flattenValue(sparse);
			assert.equal(result, "second third");
		});

		it("should handle sparse arrays with hole at end", () => {
			const sparse = [];
			sparse[0] = "first";
			sparse[1] = "second";
			const result = flattenValue(sparse);
			assert.equal(result, "first second");
		});

		it("should handle arrays created with Array constructor", () => {
			const arrayWithLength = new Array(3);
			const result = flattenValue(arrayWithLength);
			assert.equal(result, "");
		});

		it("should handle arrays with length but no elements", () => {
			const arrayWithLength = new Array(5);
			arrayWithLength[2] = "middle";
			const result = flattenValue(arrayWithLength);
			assert.equal(result, "middle");
		});
	});

	describe("nested array handling", () => {
		it("should handle nested arrays", () => {
			const result = flattenValue([["hello", "world"]]);
			assert.equal(result, "hello world");
		});

		it("should handle deeply nested arrays", () => {
			const result = flattenValue([[[["deepest"]]]]);
			assert.equal(result, "deepest");
		});

		it("should handle mixed nested arrays", () => {
			const result = flattenValue([["hello"], "world", ["test"]]);
			assert.equal(result, "hello world test");
		});

		it("should handle nested arrays with null elements", () => {
			const result = flattenValue([["hello", null], "world", [null, "test"]]);
			assert.equal(result, "hello world test");
		});

		it("should handle nested sparse arrays", () => {
			const nestedSparse = [];
			nestedSparse[0] = [];
			nestedSparse[0][1] = "second";
			nestedSparse[2] = "third";
			const result = flattenValue(nestedSparse);
			assert.equal(result, "second third");
		});
	});

	describe("mixed type handling", () => {
		it("should handle arrays with mixed types", () => {
			const result = flattenValue(["string", 42, true, { obj: "value" }]);
			assert.equal(result, "string 42 true obj:value;");
		});

		it("should handle arrays with functions", () => {
			const func = () => "test";
			const result = flattenValue(["hello", func, "world"]);
			assert.equal(result, 'hello () => "test" world');
		});

		it("should handle arrays with nested mixed types", () => {
			const result = flattenValue([["string", 42], true, [null, "world"]]);
			assert.equal(result, "string 42 true world");
		});
	});

	describe("object decomposition", () => {
		it("should convert camelCase to kebab-case", () => {
			const result = flattenValue({
				backgroundColor: "#007bff",
				fontSize: "16px",
			});
			assert.equal(result, "background-color:#007bff; font-size:16px;");
		});

		it("should handle vendor prefixes", () => {
			const result = flattenValue({
				WebkitTransform: "scale(1.02)",
				MozTransform: "rotate(45deg)",
			});
			assert.equal(
				result,
				"-webkit-transform:scale(1.02); -moz-transform:rotate(45deg);",
			);
		});

		it("should handle nested objects", () => {
			const result = flattenValue({
				padding: "10px",
				border: { width: "1px", style: "solid" },
				margin: "5px",
			});
			assert.equal(
				result,
				"padding:10px; border:width:1px; style:solid; margin:5px;",
			);
		});

		it("should handle objects with arrays", () => {
			const result = flattenValue({
				boxShadow: ["0 2px 4px rgba(0,0,0,0.1)", "0 4px 8px rgba(0,0,0,0.15)"],
				fontFamily: ["Arial", "sans-serif"],
			});
			assert.equal(
				result,
				"box-shadow:0 2px 4px rgba(0,0,0,0.1) 0 4px 8px rgba(0,0,0,0.15); font-family:Arial sans-serif;",
			);
		});

		it("should filter null and undefined values in objects", () => {
			const result = flattenValue({
				color: "red",
				background: null,
				fontSize: undefined,
				margin: "10px",
			});
			assert.equal(result, "color:red; margin:10px;");
		});

		it("should handle empty objects", () => {
			const result = flattenValue({});
			assert.equal(result, "");
		});

		it("should handle objects with empty string values", () => {
			const result = flattenValue({ content: "", display: "block" });
			assert.equal(result, "content:; display:block;");
		});
	});

	describe("edge cases", () => {
		it("should handle very large arrays", () => {
			const largeArray = Array(1000).fill("item");
			const result = flattenValue(largeArray);
			assert.equal(result, largeArray.join(" "));
		});

		it("should handle arrays with very long strings", () => {
			const longString = "a".repeat(1000);
			const result = flattenValue([longString, "short"]);
			assert.equal(result, `${longString} short`);
		});

		it("should handle arrays with circular references (should not crash)", () => {
			/** @type {Array<*>} */
			const circular = [];
			circular[0] = circular;
			// This will cause infinite recursion, so we expect it to throw
			assert.throws(() => flattenValue(circular), RangeError);
		});

		it("should handle arrays with self-referencing elements", () => {
			/** @type {Array<*>} */
			const selfRef = [];
			selfRef[0] = selfRef;
			// This will cause infinite recursion, so we expect it to throw
			assert.throws(() => flattenValue(selfRef), RangeError);
		});
	});
});

describe("processCSSTemplate", () => {
	describe("basic template processing", () => {
		it("should handle empty template", () => {
			const result = processCSSTemplate``;
			assert.equal(result, "");
		});

		it("should handle template with no values", () => {
			const result = processCSSTemplate`color: red;`;
			assert.equal(result, "color: red;");
		});

		it("should handle single value interpolation", () => {
			const color = "blue";
			const result = processCSSTemplate`color: ${color};`;
			assert.equal(result, "color: blue;");
		});

		it("should handle multiple value interpolation", () => {
			const color = "red";
			const size = "16px";
			const result = processCSSTemplate`color: ${color}; font-size: ${size};`;
			assert.equal(result, "color: red; font-size: 16px;");
		});

		it("should handle value at the beginning", () => {
			const color = "green";
			const result = processCSSTemplate`${color}: value;`;
			assert.equal(result, "green: value;");
		});

		it("should handle value at the end", () => {
			const color = "purple";
			const result = processCSSTemplate`color: ${color}`;
			assert.equal(result, "color: purple");
		});

		it("should handle template with null values (branch coverage)", () => {
			const result = processCSSTemplate`color: ${null}; background: red;`;
			assert.equal(result, "color: ; background: red;");
		});

		it("should handle template with undefined values (branch coverage)", () => {
			const result = processCSSTemplate`color: ${undefined}; background: blue;`;
			assert.equal(result, "color: ; background: blue;");
		});

		it("should handle template with mixed null and valid values (branch coverage)", () => {
			const color = "red";
			const result = processCSSTemplate`color: ${null}; background: ${color};`;
			assert.equal(result, "color: ; background: red;");
		});
	});

	describe("array value handling", () => {
		it("should join array values with spaces", () => {
			const colors = ["red", "blue", "green"];
			const result = processCSSTemplate`colors: ${colors};`;
			assert.equal(result, "colors: red blue green;");
		});

		it("should handle empty array", () => {
			/** @type {Array<*>} */
			const emptyArray = [];
			const result = processCSSTemplate`list: ${emptyArray};`;
			assert.equal(result, "list: ;");
		});

		it("should handle array with single element", () => {
			const singleElement = ["red"];
			const result = processCSSTemplate`color: ${singleElement};`;
			assert.equal(result, "color: red;");
		});

		it("should handle mixed arrays and strings", () => {
			const colors = ["red", "blue"];
			const size = "16px";
			const result = processCSSTemplate`colors: ${colors}; size: ${size};`;
			assert.equal(result, "colors: red blue; size: 16px;");
		});

		it("should handle nested arrays", () => {
			const nestedArray = [
				["red", "blue"],
				["green", "yellow"],
			];
			const result = processCSSTemplate`colors: ${nestedArray};`;
			assert.equal(result, "colors: red blue green yellow;");
		});
	});

	describe("null and undefined handling", () => {
		it("should skip null values", () => {
			const result = processCSSTemplate`color: ${null}; background: red;`;
			assert.equal(result, "color: ; background: red;");
		});

		it("should skip undefined values", () => {
			const result = processCSSTemplate`color: ${undefined}; background: blue;`;
			assert.equal(result, "color: ; background: blue;");
		});

		it("should handle multiple null/undefined values", () => {
			const result = processCSSTemplate`color: ${null}; background: ${undefined}; border: solid;`;
			assert.equal(result, "color: ; background: ; border: solid;");
		});

		it("should handle null/undefined at boundaries", () => {
			const result = processCSSTemplate`${null}color: red; background: ${undefined}`;
			assert.equal(result, "color: red; background: ");
		});
	});

	describe("complex CSS structures", () => {
		it("should handle CSS rules with multiple properties", () => {
			const primaryColor = "#007bff";
			const padding = "10px 15px";
			const result = processCSSTemplate`
				.button {
					background-color: ${primaryColor};
					padding: ${padding};
					color: white;
				}
			`;
			assert.equal(
				result,
				`
				.button {
					background-color: #007bff;
					padding: 10px 15px;
					color: white;
				}
			`,
			);
		});

		it("should handle multiple CSS rules", () => {
			const primaryColor = "#007bff";
			const secondaryColor = "#6c757d";
			const result = processCSSTemplate`
				.button-primary { background-color: ${primaryColor}; }
				.button-secondary { background-color: ${secondaryColor}; }
			`;
			assert.equal(
				result,
				`
				.button-primary { background-color: #007bff; }
				.button-secondary { background-color: #6c757d; }
			`,
			);
		});

		it("should handle media queries", () => {
			const breakpoint = "768px";
			const padding = "5px";
			const result = processCSSTemplate`
				@media (max-width: ${breakpoint}) {
					.container { padding: ${padding}; }
				}
			`;
			assert.equal(
				result,
				`
				@media (max-width: 768px) {
					.container { padding: 5px; }
				}
			`,
			);
		});

		it("should handle keyframes", () => {
			const animationName = "fadeIn";
			const opacity = "0";
			const result = processCSSTemplate`
				@keyframes ${animationName} {
					from { opacity: ${opacity}; }
					to { opacity: 1; }
				}
			`;
			assert.equal(
				result,
				`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`,
			);
		});
	});

	describe("edge cases", () => {
		it("should handle zero as a valid value", () => {
			const result = processCSSTemplate`opacity: ${0};`;
			assert.equal(result, "opacity: 0;");
		});

		it("should handle false as empty (for conditionals)", () => {
			const result = processCSSTemplate`display: ${false};`;
			assert.equal(result, "display: ;");
		});

		it("should handle empty string as a valid value", () => {
			const result = processCSSTemplate`content: "${""}";`;
			assert.equal(result, 'content: "";');
		});

		it("should handle numbers", () => {
			const result = processCSSTemplate`width: ${100}px; height: ${200}px;`;
			assert.equal(result, "width: 100px; height: 200px;");
		});

		it("should handle booleans", () => {
			const result = processCSSTemplate`enabled: ${true}; disabled: ${false};`;
			assert.equal(result, "enabled: true; disabled: ;");
		});

		it("should handle objects (converted to CSS key-value pairs)", () => {
			const theme = { primary: "#007bff" };
			const result = processCSSTemplate`theme: ${theme};`;
			assert.equal(result, "theme: primary:#007bff;;");
		});

		it("should handle functions (converted to string)", () => {
			const func = () => "dynamic";
			const result = processCSSTemplate`value: ${func};`;
			assert.equal(result, 'value: () => "dynamic";');
		});
	});

	describe("advanced array scenarios", () => {
		it("should handle sparse arrays", () => {
			const sparse = [1];
			sparse[3] = 4;
			const result = processCSSTemplate`values: ${sparse};`;
			assert.equal(result, "values: 1 4;");
		});

		it("should handle arrays with mixed types", () => {
			const mixed = ["red", 16, true, null, undefined, ["nested"]];
			const result = processCSSTemplate`mixed: ${mixed};`;
			assert.equal(result, "mixed: red 16 true nested;");
		});

		it("should handle deeply nested arrays", () => {
			const deep = [[[[["deepest"]]]]];
			const result = processCSSTemplate`depth: ${deep};`;
			assert.equal(result, "depth: deepest;");
		});

		it("should handle arrays with objects and functions", () => {
			const complex = [{ prop: "value" }, () => "func", "string"];
			const result = processCSSTemplate`complex: ${complex};`;
			assert.equal(result, 'complex: prop:value; () => "func" string;');
		});

		it("should handle arrays with falsy values", () => {
			const falsy = [0, false, "", null, undefined];
			const result = processCSSTemplate`falsy: ${falsy};`;
			assert.equal(result, "falsy: 0  ;");
		});

		it("should handle arrays with only falsy values", () => {
			const allFalsy = [null, undefined, false, ""];
			const result = processCSSTemplate`allFalsy: ${allFalsy};`;
			assert.equal(result, "allFalsy:  ;");
		});

		it("should handle arrays with missing indices (sparse array edge case)", () => {
			const sparse = [];
			sparse[5] = "value";
			// This should test the branch where i is NOT in the array
			const result = processCSSTemplate`sparse: ${sparse};`;
			assert.equal(result, "sparse: value;");
		});

		it("should handle arrays with null/undefined items (branch coverage)", () => {
			const withNulls = ["first", null, "third", undefined, "fifth"];
			const result = processCSSTemplate`withNulls: ${withNulls};`;
			assert.equal(result, "withNulls: first third fifth;");
		});

		it("should handle empty sparse arrays", () => {
			const emptySparse = new Array(5); // Creates array with length 5 but no elements
			const result = processCSSTemplate`emptySparse: ${emptySparse};`;
			assert.equal(result, "emptySparse: ;");
		});

		it("should handle arrays with only null/undefined items", () => {
			/** @type {Array<*>} */
			const onlyNulls = [null, undefined, null, undefined];
			const result = processCSSTemplate`onlyNulls: ${onlyNulls};`;
			assert.equal(result, "onlyNulls: ;");
		});

		it("should handle arrays created with Array constructor (branch coverage)", () => {
			// This creates an array with length 3 but no actual elements
			const arrayWithLength = new Array(3);
			const result = processCSSTemplate`arrayWithLength: ${arrayWithLength};`;
			assert.equal(result, "arrayWithLength: ;");
		});

		it("should handle arrays with holes at specific indices (branch coverage)", () => {
			const arrayWithHoles = [];
			arrayWithHoles[0] = "first";
			arrayWithHoles[2] = "third";
			// Index 1 is missing (hole)
			const result = processCSSTemplate`arrayWithHoles: ${arrayWithHoles};`;
			assert.equal(result, "arrayWithHoles: first third;");
		});

		it("should handle arrays with hole at index 0 (branch coverage)", () => {
			const arrayWithHoleAtZero = [];
			arrayWithHoleAtZero[1] = "second";
			arrayWithHoleAtZero[2] = "third";
			// Index 0 is missing (hole)
			const result = processCSSTemplate`arrayWithHoleAtZero: ${arrayWithHoleAtZero};`;
			assert.equal(result, "arrayWithHoleAtZero: second third;");
		});
	});

	describe("CSS-specific scenarios", () => {
		it("should handle CSS custom properties (variables)", () => {
			const varName = "--primary-color";
			const varValue = "#007bff";
			const result = processCSSTemplate`
				:root {
					${varName}: ${varValue};
				}
			`;
			assert.equal(
				result,
				`
				:root {
					--primary-color: #007bff;
				}
			`,
			);
		});

		it("should handle CSS calc() functions", () => {
			const width = "100%";
			const padding = "20px";
			const result = processCSSTemplate`
				.container {
					width: calc(${width} - ${padding});
				}
			`;
			assert.equal(
				result,
				`
				.container {
					width: calc(100% - 20px);
				}
			`,
			);
		});

		it("should handle CSS url() functions", () => {
			const imagePath = "/images/logo.png";
			const result = processCSSTemplate`
				.logo {
					background-image: url(${imagePath});
				}
			`;
			assert.equal(
				result,
				`
				.logo {
					background-image: url(/images/logo.png);
				}
			`,
			);
		});

		it("should handle CSS pseudo-selectors", () => {
			const pseudoClass = "hover";
			const color = "red";
			const result = processCSSTemplate`
				.button:${pseudoClass} {
					color: ${color};
				}
			`;
			assert.equal(
				result,
				`
				.button:hover {
					color: red;
				}
			`,
			);
		});

		it("should handle CSS attribute selectors", () => {
			const attr = "data-theme";
			const value = "dark";
			const result = processCSSTemplate`
				[${attr}="${value}"] {
					background: black;
				}
			`;
			assert.equal(
				result,
				`
				[data-theme="dark"] {
					background: black;
				}
			`,
			);
		});

		it("should handle CSS nth-child selectors", () => {
			const n = 3;
			const result = processCSSTemplate`
				.item:nth-child(${n}) {
					color: blue;
				}
			`;
			assert.equal(
				result,
				`
				.item:nth-child(3) {
					color: blue;
				}
			`,
			);
		});

		it("should handle CSS transforms", () => {
			const rotate = "45deg";
			const scale = 1.5;
			const result = processCSSTemplate`
				.rotated {
					transform: rotate(${rotate}) scale(${scale});
				}
			`;
			assert.equal(
				result,
				`
				.rotated {
					transform: rotate(45deg) scale(1.5);
				}
			`,
			);
		});

		it("should handle CSS gradients", () => {
			const color1 = "#ff0000";
			const color2 = "#00ff00";
			const result = processCSSTemplate`
				.gradient {
					background: linear-gradient(to right, ${color1}, ${color2});
				}
			`;
			assert.equal(
				result,
				`
				.gradient {
					background: linear-gradient(to right, #ff0000, #00ff00);
				}
			`,
			);
		});

		it("should handle CSS animations", () => {
			const duration = "2s";
			const timing = "ease-in-out";
			const result = processCSSTemplate`
				.animated {
					animation: fadeIn ${duration} ${timing} infinite;
				}
			`;
			assert.equal(
				result,
				`
				.animated {
					animation: fadeIn 2s ease-in-out infinite;
				}
			`,
			);
		});

		it("should handle CSS flexbox properties", () => {
			const direction = "column";
			const justify = "center";
			const align = "stretch";
			const result = processCSSTemplate`
				.flex-container {
					display: flex;
					flex-direction: ${direction};
					justify-content: ${justify};
					align-items: ${align};
				}
			`;
			assert.equal(
				result,
				`
				.flex-container {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: stretch;
				}
			`,
			);
		});

		it("should handle CSS grid properties", () => {
			const columns = "repeat(3, 1fr)";
			const gap = "20px";
			const result = processCSSTemplate`
				.grid-container {
					display: grid;
					grid-template-columns: ${columns};
					gap: ${gap};
				}
			`;
			assert.equal(
				result,
				`
				.grid-container {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 20px;
				}
			`,
			);
		});
	});

	describe("advanced template scenarios", () => {
		it("should handle template with only values (no static parts)", () => {
			const value1 = "color: red;";
			const value2 = "background: blue;";
			const result = processCSSTemplate`${value1}${value2}`;
			assert.equal(result, "color: red;background: blue;");
		});

		it("should handle template with alternating values and static parts", () => {
			const prop1 = "color";
			const prop2 = "background";
			const result = processCSSTemplate`${prop1}: red; ${prop2}: blue;`;
			assert.equal(result, "color: red; background: blue;");
		});

		it("should handle template with values at every position", () => {
			const selector = ".button";
			const property = "background-color";
			const value = "#007bff";
			const result = processCSSTemplate`${selector} { ${property}: ${value}; }`;
			assert.equal(result, ".button { background-color: #007bff; }");
		});

		it("should handle template with complex nested interpolation", () => {
			const theme = {
				colors: {
					primary: "#007bff",
					secondary: "#6c757d",
				},
			};
			const result = processCSSTemplate`
				.button {
					background: ${theme.colors.primary};
					border: 1px solid ${theme.colors.secondary};
				}
			`;
			assert.equal(
				result,
				`
				.button {
					background: #007bff;
					border: 1px solid #6c757d;
				}
			`,
			);
		});

		it("should handle template with function calls in interpolation", () => {
			/** @param {string} type */
			const getColor = (type) => (type === "primary" ? "#007bff" : "#6c757d");
			const result = processCSSTemplate`
				.primary { color: ${getColor("primary")}; }
				.secondary { color: ${getColor("secondary")}; }
			`;
			assert.equal(
				result,
				`
				.primary { color: #007bff; }
				.secondary { color: #6c757d; }
			`,
			);
		});

		it("should handle template with conditional expressions", () => {
			const isDark = true;
			const result = processCSSTemplate`
				body {
					background: ${isDark ? "#333" : "#fff"};
					color: ${isDark ? "#fff" : "#333"};
				}
			`;
			assert.equal(
				result,
				`
				body {
					background: #333;
					color: #fff;
				}
			`,
			);
		});

		it("should handle template with mathematical expressions", () => {
			const baseSize = 16;
			const result = processCSSTemplate`
				.text-small { font-size: ${baseSize * 0.75}px; }
				.text-large { font-size: ${baseSize * 1.5}px; }
			`;
			assert.equal(
				result,
				`
				.text-small { font-size: 12px; }
				.text-large { font-size: 24px; }
			`,
			);
		});

		it("should handle template with array methods", () => {
			const colors = ["red", "green", "blue"];
			const result = processCSSTemplate`
				.gradient {
					background: linear-gradient(${colors.join(", ")});
				}
			`;
			assert.equal(
				result,
				`
				.gradient {
					background: linear-gradient(red, green, blue);
				}
			`,
			);
		});
	});

	describe("performance edge cases", () => {
		it("should handle very long strings", () => {
			const longString = "a".repeat(1000);
			const result = processCSSTemplate`content: "${longString}";`;
			assert.equal(result, `content: "${longString}";`);
		});

		it("should handle many values", () => {
			const values = Array(100).fill("value");
			const result = processCSSTemplate`${values.join("; ")};`;
			assert.equal(result, `${values.join("; ")};`);
		});

		it("should handle large arrays", () => {
			const largeArray = Array(100).fill("item");
			const result = processCSSTemplate`list: ${largeArray};`;
			assert.equal(result, `list: ${largeArray.join(" ")};`);
		});

		it("should handle very deep nested arrays", () => {
			/** @type {any} */
			let deepArray = ["deepest"];
			for (let i = 0; i < 100; i++) {
				deepArray = [deepArray];
			}
			const result = processCSSTemplate`depth: ${deepArray};`;
			assert.equal(result, "depth: deepest;");
		});

		it("should handle mixed large arrays and strings", () => {
			const largeArray = Array(50).fill("item");
			const longString = "x".repeat(500);
			const result = processCSSTemplate`array: ${largeArray}; string: "${longString}";`;
			assert.equal(
				result,
				`array: ${largeArray.join(" ")}; string: "${longString}";`,
			);
		});
	});

	describe("real-world scenarios", () => {
		it("should handle dynamic theme generation", () => {
			const theme = {
				primary: "#007bff",
				secondary: "#6c757d",
				success: "#28a745",
				spacing: ["10px", "20px", "30px"],
			};

			const result = processCSSTemplate`
				.btn-primary { background-color: ${theme.primary}; }
				.btn-secondary { background-color: ${theme.secondary}; }
				.btn-success { background-color: ${theme.success}; }
				.spacing { margin: ${theme.spacing}; }
			`;

			assert.equal(
				result,
				`
				.btn-primary { background-color: #007bff; }
				.btn-secondary { background-color: #6c757d; }
				.btn-success { background-color: #28a745; }
				.spacing { margin: 10px 20px 30px; }
			`,
			);
		});

		it("should handle conditional CSS generation", () => {
			const isDarkMode = true;
			const darkColor = "#333";
			const lightColor = "#fff";
			const currentColor = isDarkMode ? darkColor : lightColor;

			const result = processCSSTemplate`
				body {
					background-color: ${currentColor};
					color: ${isDarkMode ? "#fff" : "#333"};
				}
			`;

			assert.equal(
				result,
				`
				body {
					background-color: #333;
					color: #fff;
				}
			`,
			);
		});

		it("should handle responsive design patterns", () => {
			const breakpoints = {
				mobile: "480px",
				tablet: "768px",
				desktop: "1024px",
			};
			const result = processCSSTemplate`
				.container {
					padding: 10px;
				}
				@media (min-width: ${breakpoints.mobile}) {
					.container { padding: 15px; }
				}
				@media (min-width: ${breakpoints.tablet}) {
					.container { padding: 20px; }
				}
				@media (min-width: ${breakpoints.desktop}) {
					.container { padding: 30px; }
				}
			`;
			assert.equal(
				result,
				`
				.container {
					padding: 10px;
				}
				@media (min-width: 480px) {
					.container { padding: 15px; }
				}
				@media (min-width: 768px) {
					.container { padding: 20px; }
				}
				@media (min-width: 1024px) {
					.container { padding: 30px; }
				}
			`,
			);
		});

		it("should handle component-based CSS patterns", () => {
			const component = {
				name: "Button",
				variants: ["primary", "secondary", "danger"],
				/** @type {Object.<string, string>} */
				colors: {
					primary: "#007bff",
					secondary: "#6c757d",
					danger: "#dc3545",
				},
			};
			const result = processCSSTemplate`
				.${component.name.toLowerCase()} {
					padding: 10px 20px;
					border: none;
					border-radius: 4px;
					cursor: pointer;
				}
				${component.variants
					.map(
						(variant) =>
							`.${component.name.toLowerCase()}-${variant} {
						background-color: ${component.colors[variant]};
						color: white;
					}`,
					)
					.join("\n")}
			`;
			// The actual output has some indentation quirks due to template literal behavior
			// This is expected behavior for template literals with array joins
			assert.ok(result.includes(".button {"));
			assert.ok(result.includes(".button-primary {"));
			assert.ok(result.includes(".button-secondary {"));
			assert.ok(result.includes(".button-danger {"));
			assert.ok(result.includes("background-color: #007bff"));
			assert.ok(result.includes("background-color: #6c757d"));
			assert.ok(result.includes("background-color: #dc3545"));
		});

		it("should handle CSS-in-JS style patterns", () => {
			const styles = {
				container: {
					display: "flex",
					flexDirection: "column",
					gap: "20px",
				},
				header: {
					fontSize: "24px",
					fontWeight: "bold",
				},
			};
			const result = processCSSTemplate`
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
			assert.equal(
				result,
				`
				.container {
					display: flex;
					flex-direction: column;
					gap: 20px;
				}
				.header {
					font-size: 24px;
					font-weight: bold;
				}
			`,
			);
		});

		it("should handle React-style conditional styling with objects", () => {
			const isActive = true;
			const isPrimary = false;
			const result = processCSSTemplate`
				.button {
					${isActive && { backgroundColor: "#007bff", color: "white" }}
					${isPrimary && { fontWeight: "bold", fontSize: "18px" }}
					padding: 10px 20px;
				}
			`;
			assert.equal(
				result,
				`
				.button {
					background-color:#007bff; color:white;

					padding: 10px 20px;
				}
			`,
			);
		});

		it("should handle object spread pattern in templates", () => {
			const baseStyles = { padding: "10px", margin: "5px" };
			const themeStyles = { backgroundColor: "#007bff", color: "white" };
			const result = processCSSTemplate`
				.component {
					${baseStyles}
					${themeStyles}
					border: 1px solid #ccc;
				}
			`;
			assert.equal(
				result,
				`
				.component {
					padding:10px; margin:5px;
					background-color:#007bff; color:white;
					border: 1px solid #ccc;
				}
			`,
			);
		});
	});
});
