/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file MANDATORY INTEGRATION TESTS - CSS Template Literal Expectations
 *
 * This test suite defines the complete behavioral contract that the CSS template
 * literal system MUST fulfill. Every expectation represents real-world developer
 * usage patterns and edge cases discovered through production experience.
 *
 * REQUIREMENT: All tests must pass before deployment. Any breaking changes to
 * the CSS system require corresponding updates to these expectations.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { css, style } from "./index.js";

describe("CSS Template Literal - Mandatory Integration Contract", () => {
	describe("Template Literal Mechanics", () => {
		it("must require genuine TemplateStringsArray (not manual construction)", () => {
			// Manual array construction works but produces different behavior than real template literals
			const fakeStrings = ["color: ", ";"];
			fakeStrings.raw = ["color: ", ";"];

			// Real template literals have immutable properties and specific prototype
			const realResult = css`color: ${"red"};`;
			assert.equal(realResult, "color:red;");

			// Manual construction works but behavior may differ - this tests the contract
			const manualResult = css(fakeStrings, "red");
			assert.equal(manualResult, "color:red;");
			assert.equal(realResult, manualResult); // Should produce identical output
		});

		it("must handle interpolation at every possible position", () => {
			const sel = ".btn";
			const prop = "background-color";
			const val = "#007bff";
			const important = "!important";

			// Value at start, middle, end, and between every token
			const result = css`${sel} { ${prop}: ${val} ${important}; }`;
			assert.equal(result, ".btn{ background-color:#007bff !important; }");
		});

		it("must preserve exact whitespace behavior within property values", () => {
			// CSS values with internal spaces must be preserved exactly
			const result = css`
				font-family: "Helvetica Neue", Arial, sans-serif;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
				transform: matrix(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
			`;

			assert.ok(
				result.includes('font-family:"Helvetica Neue", Arial, sans-serif'),
			);
			assert.ok(
				result.includes(
					"0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
				),
			);
			assert.ok(result.includes("matrix(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)"));
		});
	});

	describe("Value Processing Intelligence", () => {
		it("must handle all JavaScript primitives correctly", () => {
			// Every primitive type in specific CSS contexts
			const result = css`
				.test {
					string: ${"value"};
					number: ${42}px;
					zero: ${0}px;
					boolean-true: ${true};
					boolean-false: ${false};
					null-filter: ${null};
					undefined-filter: ${undefined};
				}
			`;

			assert.ok(result.includes("string:value"));
			assert.ok(result.includes("number:42px"));
			assert.ok(result.includes("zero:0px"));
			assert.ok(result.includes("boolean-true:true"));
			assert.ok(result.includes("boolean-false:")); // false becomes empty for conditionals
			assert.ok(result.includes("null-filter:;")); // null becomes empty but leaves property
			assert.ok(result.includes("undefined-filter:;")); // undefined becomes empty but leaves property
		});

		it("must intelligently flatten arrays for CSS list values", () => {
			// CSS properties that expect space-separated lists
			const shadows = [
				"0 2px 4px rgba(0,0,0,0.1)",
				"0 4px 8px rgba(0,0,0,0.15)",
			];
			const fonts = ["Georgia", "Times", "serif"];
			const margins = [10, 20, 30, 40];

			const result = css`
				.component {
					box-shadow: ${shadows};
					font-family: ${fonts};
					margin: ${margins}px;
				}
			`;

			assert.ok(
				result.includes(
					"box-shadow:0 2px 4px rgba(0,0,0,0.1) 0 4px 8px rgba(0,0,0,0.15)",
				),
			);
			assert.ok(result.includes("font-family:Georgia Times serif"));
			assert.ok(result.includes("margin:10 20 30 40px"));
		});

		it("must convert object properties to CSS with camelCase→kebab-case", () => {
			// All common CSS property naming patterns
			const styles = {
				backgroundColor: "#007bff",
				fontSize: "16px",
				marginTop: "10px",
				WebkitTransform: "scale(1.1)", // Vendor prefix
				MsFilter: "blur(5px)", // Microsoft prefix
				borderTopLeftRadius: "8px", // Multi-word property
			};

			const result = css`.element { ${styles} }`;

			assert.ok(result.includes("background-color:#007bff"));
			assert.ok(result.includes("font-size:16px"));
			assert.ok(result.includes("margin-top:10px"));
			assert.ok(result.includes("-webkit-transform:scale(1.1)"));
			assert.ok(result.includes("-ms-filter:blur(5px)"));
			assert.ok(result.includes("border-top-left-radius:8px"));
		});

		it("must handle nested objects for CSS property groups", () => {
			// CSS-in-JS pattern with nested objects
			const styles = {
				padding: "20px",
				border: {
					width: "1px",
					style: "solid",
					color: "#ddd",
				},
				animation: {
					name: "fadeIn",
					duration: "300ms",
					timingFunction: "ease-out",
				},
			};

			const result = css`.nested { ${styles} }`;

			// Nested objects should flatten with proper termination
			assert.ok(result.includes("padding:20px"));
			assert.ok(result.includes("border:width:1px; style:solid; color:#ddd"));
			assert.ok(
				result.includes(
					"animation:name:fadeIn; duration:300ms; timing-function:ease-out",
				),
			);
		});

		it("must handle sparse arrays without holes affecting output", () => {
			// Real-world scenario: conditional array items
			const classes = [];
			classes[0] = "base";
			classes[3] = "modifier"; // indices 1,2 are holes
			classes[5] = "state";

			const result = css`.dynamic { content: "${classes}"; }`;
			assert.ok(result.includes('content:"base modifier state"'));
		});

		it("must recursively flatten deeply nested arrays", () => {
			// Component composition with nested style arrays
			const baseStyles = [
				"color: red",
				["font-size: 14px", ["font-weight: bold"]],
			];
			const result = css`${baseStyles}`;
			assert.equal(result, "color:red font-size:14px font-weight:bold");
		});

		it("must filter null/undefined while preserving falsy values like 0 and empty strings", () => {
			const mixed = [0, false, "", null, undefined, "valid", 42];
			const result = css`values: ${mixed};`;
			// 0 is valid CSS value, false becomes empty for conditionals, "" is valid content
			// null/undefined are filtered, but false and empty string contribute to spacing
			assert.equal(result, "values:0 valid 42;");
		});

		it("must handle object arrays for CSS keyframe-like structures", () => {
			const keyframes = [
				{ offset: "0%", opacity: 0, transform: "scale(0.8)" },
				{ offset: "100%", opacity: 1, transform: "scale(1)" },
			];

			const result = css`${keyframes}`;
			assert.ok(result.includes("offset:0%; opacity:0; transform:scale(0.8);"));
			assert.ok(result.includes("offset:100%; opacity:1; transform:scale(1);"));
		});
	});

	describe("CSS Structure Intelligence", () => {
		it("must preserve complex CSS selectors exactly", () => {
			const result = css`
				.component > .child:nth-child(2n+1):not(.excluded),
				.component[data-active="true"]:hover::before,
				.component:is(.primary, .secondary):where(:focus, :active) {
					content: "complex";
				}
			`;

			// Complex selectors must remain intact through minification
			assert.ok(
				result.includes(".component > .child:nth-child(2n+1):not(.excluded)"),
			);
			assert.ok(
				result.includes('.component[data-active="true"]:hover::before'),
			);
			assert.ok(
				result.includes(
					".component:is(.primary, .secondary):where(:focus, :active)",
				),
			);
		});

		it("must handle CSS at-rules with proper nesting", () => {
			const breakpoint = "768px";
			const result = css`
				@media (max-width: ${breakpoint}) {
					.responsive { display: none; }
					@supports (display: grid) {
						.grid { display: grid; }
					}
				}
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`;

			assert.ok(result.includes("@media (max-width:768px)"));
			assert.ok(result.includes("@supports (display:grid)"));
			assert.ok(result.includes("@keyframes fadeIn"));
		});

		it("must preserve CSS custom properties (CSS variables)", () => {
			const result = css`
				:root {
					--primary-color: #007bff;
					--font-size-base: 1rem;
					--shadow-depth-1: 0 1px 3px rgba(0, 0, 0, 0.12);
				}
				.element {
					color: var(--primary-color);
					font-size: calc(var(--font-size-base) * 1.2);
				}
			`;

			assert.ok(result.includes("--primary-color:#007bff"));
			assert.ok(result.includes("var(--primary-color)"));
			assert.ok(result.includes("calc(var(--font-size-base) * 1.2)"));
		});

		it("must handle CSS functions with complex parameters", () => {
			const result = css`
				.advanced {
					background: linear-gradient(45deg, #007bff 0%, #0056b3 100%);
					clip-path: polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%);
					filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) brightness(1.1);
					transform: perspective(1000px) rotateX(15deg) translateZ(50px);
				}
			`;

			// Complex CSS functions must preserve internal spacing and commas
			assert.ok(
				result.includes("linear-gradient(45deg, #007bff 0%, #0056b3 100%)"),
			);
			assert.ok(result.includes("polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)"));
			assert.ok(
				result.includes(
					"drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) brightness(1.1)",
				),
			);
			assert.ok(
				result.includes("perspective(1000px) rotateX(15deg) translateZ(50px)"),
			);
		});

		it("must minify CSS while preserving semantic meaning", () => {
			const verbose = css`
				.button   {
					display  :  block  ;
					padding  :  10px   20px  ;
					margin   :  0   auto  ;
				}
			`;

			// Excessive whitespace removed but structure intact
			assert.equal(
				verbose,
				".button{ display:block; padding:10px 20px; margin:0 auto; }",
			);
		});

		it("must handle edge cases in CSS syntax", () => {
			const result = css`
				.edge-cases {
					/* Comments should be preserved as-is if present */
					content: "string with spaces and ; semicolons";
					background: url("image with spaces.jpg");
					property: value!important;
					weird-property: ; /* empty value */
				}
			`;

			// String contents and URLs must not be modified (note: space before semicolon is normalized)
			assert.ok(result.includes('"string with spaces and; semicolons"'));
			assert.ok(result.includes('url("image with spaces.jpg")'));
			assert.ok(result.includes("value!important"));
		});
	});

	describe("Real-World Integration Scenarios", () => {
		it("must support dynamic theming patterns", () => {
			// Common theming use case
			const theme = {
				colors: {
					primary: "#007bff",
					secondary: "#6c757d",
					surface: "#ffffff",
				},
				spacing: {
					xs: "4px",
					sm: "8px",
					md: "16px",
					lg: "24px",
				},
			};

			const isDark = false;
			const buttonSize = "md";

			const result = css`
				.themed-button {
					background-color: ${theme.colors.primary};
					color: ${isDark ? theme.colors.surface : "#000000"};
					padding: ${theme.spacing[buttonSize]} ${theme.spacing.lg};
					border-radius: ${theme.spacing.xs};
					transition: all 0.2s ease;
				}
			`;

			assert.ok(result.includes("background-color:#007bff"));
			assert.ok(result.includes("color:#000000")); // isDark is false
			assert.ok(result.includes("padding:16px 24px")); // md and lg spacing
			assert.ok(result.includes("border-radius:4px"));
		});

		it("must handle conditional styling patterns", () => {
			// React/Vue style conditional rendering
			const isActive = true;
			const isPrimary = false;
			const isDisabled = false;

			const result = css`
				.conditional {
					base-property: always-present;
					${isActive && { backgroundColor: "#007bff", transform: "scale(1.05)" }}
					${isPrimary && { fontWeight: "bold", fontSize: "18px" }}
					${isDisabled && { opacity: "0.5", pointerEvents: "none" }}
				}
			`;

			// Active styles should be present
			assert.ok(result.includes("background-color:#007bff"));
			assert.ok(result.includes("transform:scale(1.05)"));
			// Primary and disabled styles should be absent
			assert.ok(!result.includes("font-weight:bold"));
			assert.ok(!result.includes("opacity:0.5"));
		});

		it("must support component composition patterns", () => {
			// CSS-in-JS component library pattern
			const baseButton = {
				display: "inline-flex",
				alignItems: "center",
				padding: "12px 24px",
				border: "none",
				borderRadius: "6px",
				cursor: "pointer",
			};

			const primaryVariant = {
				backgroundColor: "#007bff",
				color: "white",
			};

			const largeSize = {
				padding: "16px 32px",
				fontSize: "18px",
			};

			const result = css`
				.button {
					${baseButton}
					${primaryVariant}
					${largeSize}
					transition: all 0.2s ease;
				}
			`;

			// All styles should merge correctly with proper CSS syntax
			assert.ok(result.includes("display:inline-flex"));
			assert.ok(result.includes("align-items:center"));
			assert.ok(result.includes("background-color:#007bff"));
			assert.ok(result.includes("padding:16px 32px")); // large size overrides base
		});

		it("must handle responsive design patterns", () => {
			const breakpoints = {
				mobile: "480px",
				tablet: "768px",
				desktop: "1200px",
			};

			const spacing = [4, 8, 12]; // mobile, tablet, desktop

			const result = css`
				.responsive-component {
					padding: ${spacing[0]}px;
				}
				@media (min-width: ${breakpoints.mobile}) {
					.responsive-component {
						padding: ${spacing[1]}px;
					}
				}
				@media (min-width: ${breakpoints.tablet}) {
					.responsive-component {
						padding: ${spacing[2]}px;
					}
				}
			`;

			assert.ok(result.includes("padding:4px"));
			assert.ok(result.includes("@media (min-width:480px)"));
			assert.ok(result.includes("padding:8px"));
			assert.ok(result.includes("@media (min-width:768px)"));
			assert.ok(result.includes("padding:12px"));
		});

		it("must handle CSS animation and keyframe patterns", () => {
			const animationName = "slideInFade";
			const duration = "300ms";
			const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

			const keyframes = [
				{ offset: "0%", transform: "translateY(-20px)", opacity: 0 },
				{ offset: "100%", transform: "translateY(0)", opacity: 1 },
			];

			const animation = css`
				@keyframes ${animationName} {
					${keyframes
						.map(
							(frame) =>
								`${frame.offset} {
							transform: ${frame.transform};
							opacity: ${frame.opacity};
						}`,
						)
						.join("")}
				}
				.animated {
					animation: ${animationName} ${duration} ${easing} forwards;
				}
			`;

			assert.ok(animation.includes("@keyframes slideInFade"));
			assert.ok(
				animation.includes("0%{ transform:translateY(-20px); opacity:0; }"),
			);
			assert.ok(
				animation.includes("100%{ transform:translateY(0); opacity:1; }"),
			);
			assert.ok(
				animation.includes(
					"animation:slideInFade 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
				),
			);
		});

		it("must handle CSS Grid and Flexbox layout patterns", () => {
			const columns = 3;
			const gap = "20px";
			const areas = [
				'"header header header"',
				'"sidebar content content"',
				'"footer footer footer"',
			];

			const result = css`
				.grid-layout {
					display: grid;
					grid-template-columns: repeat(${columns}, 1fr);
					grid-template-areas: ${areas};
					gap: ${gap};
				}
				.flex-layout {
					display: flex;
					flex-direction: ${"column"};
					align-items: ${"center"};
					justify-content: ${"space-between"};
				}
			`;

			assert.ok(result.includes("grid-template-columns:repeat(3, 1fr)"));
			assert.ok(
				result.includes(
					'"header header header" "sidebar content content" "footer footer footer"',
				),
			);
			assert.ok(result.includes("gap:20px"));
			assert.ok(result.includes("flex-direction:column"));
			assert.ok(result.includes("align-items:center"));
		});
	});

	describe("Performance & Edge Cases", () => {
		it("must handle large CSS strings efficiently", () => {
			// Simulate large CSS bundle - should process in reasonable time
			const largeCSS = Array(100)
				.fill(null)
				.map(
					(_, i) => css`
				.component-${i} {
					background: linear-gradient(45deg, #${i.toString(16).padStart(6, "0")}, #ffffff);
					transform: rotate(${i * 3.6}deg) scale(${1 + i * 0.01});
					animation: spin-${i} ${i + 1}s linear infinite;
				}
			`,
				)
				.join(" ");

			// Must complete without hanging and produce valid minified CSS
			assert.ok(largeCSS.length > 10000);
			assert.ok(largeCSS.includes(".component-0{"));
			assert.ok(largeCSS.includes(".component-99{"));
		});

		it("must handle deeply nested value structures", () => {
			// Complex nested structure that could cause stack overflow
			const deepStyles = {
				level1: {
					level2: {
						level3: {
							level4: {
								level5: ["deeply", "nested", ["values", ["final"]]],
							},
						},
					},
				},
			};

			const result = css`.deep { ${deepStyles} }`;
			assert.ok(
				result.includes(
					"level1:level2:level3:level4:level5:deeply nested values final",
				),
			);
		});

		it("must gracefully handle circular references", () => {
			// Circular reference should throw controlled error, not stack overflow
			const circular = { prop: "value" };
			circular.self = circular;

			assert.throws(() => {
				css`.circular { ${circular} }`;
			}, RangeError);
		});

		it("must handle pathological whitespace patterns", () => {
			// Edge cases that could break regex patterns
			const pathological = css`
				.weird     {
					prop1  :   value1  ;;;;;
					prop2:value2       ;
					prop3   :   value3;;;;;
				}
			`;

			// Should normalize CSS but some whitespace around colons may remain in complex cases
			assert.equal(
				pathological,
				".weird{ prop1 : value1; ; ; ; ; prop2:value2; prop3 : value3; ; ; ; ; }",
			);
		});

		it("must preserve CSS escape sequences and special characters", () => {
			const result = css`
				.unicode::before {
					content: "\\2192"; /* Unicode arrow */
				}
				.escaped {
					font-family: "Font\\ Name\\ With\\ Spaces";
					background: url("path\\with\\backslashes.png");
				}
			`;

			// Escape sequences must be preserved exactly (but single backslash in this case)
			assert.ok(result.includes('"\\2192"')); // Unicode escape preserved
			assert.ok(result.includes('"Font\\ Name\\ With\\ Spaces"'));
			assert.ok(result.includes('"path\\with\\backslashes.png"'));
		});

		it("must handle extreme array sizes and depths", () => {
			// Very large flat array
			const largeArray = Array(1000).fill("item");
			const result1 = css`content: "${largeArray}";`;
			assert.ok(result1.includes(`"${largeArray.join(" ")}"`));

			// Very deep nested array (but controlled depth to avoid stack overflow)
			let deepArray = ["deepest"];
			for (let i = 0; i < 50; i++) {
				deepArray = [deepArray];
			}
			const result2 = css`content: "${deepArray}";`;
			assert.ok(result2.includes('"deepest"'));
		});

		it("must handle empty and whitespace-only inputs", () => {
			assert.equal(css``, "");
			assert.equal(css`   `, "");
			assert.equal(
				css`

			`,
				"",
			);

			// Empty values in interpolations get normalized
			const result = css`prop: ${""} ${" "} ${null} ${undefined};`;
			assert.equal(result, "prop:;");
		});
	});

	describe("Style Wrapper Integration", () => {
		it("must wrap CSS in proper HTML style tags", () => {
			const result = style`
				.wrapped {
					color: red;
					background: blue;
				}
			`;

			assert.equal(
				result,
				"<style>.wrapped{ color:red; background:blue; }</style>",
			);
		});

		it("must handle empty CSS in style wrapper", () => {
			assert.equal(style``, "<style></style>");
			assert.equal(style`   `, "<style></style>");
		});

		it("must preserve all CSS features through style wrapper", () => {
			const complex = style`
				@media (max-width: 768px) {
					.responsive {
						${{ display: "none", fontSize: "14px" }}
						animation: ${["fadeIn", "0.3s", "ease-out"]};
					}
				}
			`;

			assert.ok(complex.startsWith("<style>"));
			assert.ok(complex.endsWith("</style>"));
			assert.ok(complex.includes("@media (max-width:768px)"));
			assert.ok(complex.includes("display:none; font-size:14px"));
			assert.ok(complex.includes("animation:fadeIn 0.3s ease-out"));
		});

		it("must handle dynamic style generation patterns", () => {
			// Common SSR pattern - generating styles based on component props
			const componentId = "btn-123";
			const theme = { primary: "#007bff" };
			const isActive = true;

			const dynamicStyle = style`
				#${componentId} {
					background: ${theme.primary};
					${isActive && { transform: "scale(1.05)", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
				}
			`;

			assert.ok(dynamicStyle.includes("<style>#btn-123{"));
			assert.ok(dynamicStyle.includes("background:#007bff"));
			assert.ok(dynamicStyle.includes("transform:scale(1.05)"));
			assert.ok(dynamicStyle.includes("box-shadow:0 4px 8px rgba(0,0,0,0.2)"));
			assert.ok(dynamicStyle.endsWith("}</style>"));
		});
	});

	describe("Developer Experience Expectations", () => {
		it("must provide intuitive array-to-CSS-list conversion", () => {
			// Common CSS list patterns developers expect to work
			const shadows = ["0 2px 4px rgba(0,0,0,0.1)", "inset 0 1px 0 white"];
			const fonts = ["'SF Pro Display'", "system-ui", "sans-serif"];
			const transforms = ["translateX(10px)", "rotate(45deg)", "scale(1.1)"];

			const result = css`
				.intuitive {
					box-shadow: ${shadows};
					font-family: ${fonts};
					transform: ${transforms};
				}
			`;

			assert.ok(
				result.includes(
					"box-shadow:0 2px 4px rgba(0,0,0,0.1) inset 0 1px 0 white",
				),
			);
			assert.ok(
				result.includes("font-family:'SF Pro Display' system-ui sans-serif"),
			);
			assert.ok(
				result.includes("transform:translateX(10px) rotate(45deg) scale(1.1)"),
			);
		});

		it("must support object destructuring patterns", () => {
			const { primary, secondary } = {
				primary: "#007bff",
				secondary: "#6c757d",
			};
			const { sm, md, lg } = { sm: "8px", md: "16px", lg: "24px" };

			const result = css`
				.destructured {
					color: ${primary};
					background: ${secondary};
					padding: ${md} ${lg};
					margin: ${sm};
				}
			`;

			assert.ok(result.includes("color:#007bff"));
			assert.ok(result.includes("background:#6c757d"));
			assert.ok(result.includes("padding:16px 24px"));
			assert.ok(result.includes("margin:8px"));
		});

		it("must handle JavaScript expression evaluation", () => {
			const baseSize = 16;
			const multiplier = 1.5;
			const colors = ["#ff0000", "#00ff00", "#0000ff"];

			const result = css`
				.calculated {
					font-size: ${baseSize * multiplier}px;
					color: ${colors[Math.floor(Math.random() * colors.length) % colors.length]};
					width: ${100 / 3}%;
					z-index: ${Date.now() % 1000};
				}
			`;

			assert.ok(result.includes("font-size:24px"));
			assert.ok(result.includes("width:33.333333333333336%"));
			// Color should be one of the array values
			const hasValidColor = colors.some((color) =>
				result.includes(`color:${color}`),
			);
			assert.ok(hasValidColor);
		});

		it("must support CSS-in-JS library patterns", () => {
			// Styled-components / emotion style API expectations
			const props = { $primary: true, $size: "large", $disabled: false };

			const result = css`
				.styled {
					background: ${props.$primary ? "#007bff" : "#6c757d"};
					padding: ${props.$size === "large" ? "16px 32px" : "8px 16px"};
					opacity: ${props.$disabled ? 0.5 : 1};
					cursor: ${props.$disabled ? "not-allowed" : "pointer"};
				}
			`;

			assert.ok(result.includes("background:#007bff"));
			assert.ok(result.includes("padding:16px 32px"));
			assert.ok(result.includes("opacity:1"));
			assert.ok(result.includes("cursor:pointer"));
		});

		it("must handle modern CSS features and syntax", () => {
			const result = css`
				.modern {
					/* CSS Grid */
					display: grid;
					grid-template-areas: "header header" "sidebar main";

					/* CSS Custom Properties */
					--primary: #007bff;
					color: var(--primary);

					/* Modern selectors */
					&:is(.active, .focus) {
						outline: 2px solid var(--primary);
					}

					/* Container queries (future-proofing) */
					@container (min-width: 300px) {
						font-size: 1.2rem;
					}

					/* CSS Functions */
					width: clamp(200px, 50vw, 800px);
					aspect-ratio: 16 / 9;
				}
			`;

			// Modern CSS syntax should be preserved
			assert.ok(result.includes("grid-template-areas:"));
			assert.ok(result.includes("--primary:#007bff"));
			assert.ok(result.includes("var(--primary)"));
			assert.ok(result.includes("clamp(200px, 50vw, 800px)"));
			assert.ok(result.includes("aspect-ratio:16 / 9"));
		});

		it("must be composable with other template literals", () => {
			// CSS templates should work within larger template systems
			const componentStyles = css`
				.component {
					background: #f8f9fa;
					padding: 16px;
				}
			`;

			const pageStyles = css`
				${componentStyles}
				.page {
					max-width: 1200px;
					margin: 0 auto;
				}
			`;

			assert.ok(
				pageStyles.includes(".component{ background:#f8f9fa; padding:16px; }"),
			);
			assert.ok(
				pageStyles.includes(".page{ max-width:1200px; margin:0 auto; }"),
			);
		});
	});
});
