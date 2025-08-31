import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { processCSS } from "./process-css.js";

describe("core functionality", () => {
	it("should apply all CSS minification and normalization rules", () => {
		// Comprehensive whitespace normalization
		const whitespaceInput =
			"  .button  {  color :  white ;  background : #007bff  ; }  ";
		assert.equal(
			processCSS(whitespaceInput),
			".button{ color:white; background:#007bff; }",
		);

		// Space addition rules (semicolons and braces)
		const spacingInput =
			"color:white;background:#007bff;.container{max-width:1200px;}.text{font-size:16px;}";
		assert.equal(
			processCSS(spacingInput),
			"color:white; background:#007bff; .container{max-width:1200px; } .text{font-size:16px; }",
		);

		// Complex property value preservation
		const complexInput =
			"font-family: Arial, sans-serif; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);";
		assert.equal(
			processCSS(complexInput),
			"font-family:Arial, sans-serif; box-shadow:0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);",
		);

		// CSS functions and vendor prefixes
		const functionsInput =
			"width: calc(100% - 20px); background: url('image.jpg'); -webkit-transform: rotate(45deg); transform: rotate(45deg);";
		assert.equal(
			processCSS(functionsInput),
			"width:calc(100% - 20px); background:url('image.jpg'); -webkit-transform:rotate(45deg); transform:rotate(45deg);",
		);
	});

	it("should handle advanced CSS structures with proper formatting", () => {
		// Nested selectors and pseudo-classes
		const nestedInput = `
			.container { max-width: 1200px; margin: 0 auto; }
			.container .button:hover { color: white; background: #0056b3; }
			.button:active { background: #004085; }
		`;
		const nestedExpected =
			".container{ max-width:1200px; margin:0 auto; } .container .button:hover{ color:white; background:#0056b3; } .button:active{ background:#004085; }";
		assert.equal(processCSS(nestedInput), nestedExpected);

		// At-rules (media queries, keyframes)
		const atRulesInput = `
			@media (max-width: 768px) { .container { padding: 10px; } }
			@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
		`;
		const atRulesExpected =
			"@media (max-width:768px){ .container{ padding:10px; } } @keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }";
		assert.equal(processCSS(atRulesInput), atRulesExpected);

		// Complete real-world button component
		const componentInput = `
			.button {
				display: inline-block; padding: 10px 20px; font-size: 16px;
				color: white; background-color: #007bff; border: 1px solid #007bff;
				border-radius: 4px; cursor: pointer; transition: all 0.3s ease;
			}
		`;
		const result = processCSS(componentInput);
		assert.ok(result.includes("display:inline-block"));
		assert.ok(result.includes("padding:10px 20px"));
		assert.ok(result.includes("background-color:#007bff"));
		assert.ok(result.includes("transition:all 0.3s ease"));
	});
});

describe("edge cases and errors", () => {
	it("should handle empty and malformed CSS gracefully", () => {
		// Empty input fast path
		assert.equal(processCSS(""), "");
		assert.equal(processCSS("   \n\t  "), "");

		// Single characters and minimal input
		assert.equal(processCSS("a"), "a");
		assert.equal(processCSS("{}"), "{}");
		assert.equal(processCSS(";;;"), "; ; ;");
		assert.equal(processCSS(":::"), ":::");

		// Incomplete CSS structures
		assert.equal(
			processCSS(".button { color: white }"),
			".button{ color:white}",
		);
		assert.equal(
			processCSS("color: white; background: #007bff;"),
			"color:white; background:#007bff;",
		);

		// Special characters and quotes
		assert.equal(
			processCSS(
				"content: 'Hello\\'World'; font-family: \"Arial\", sans-serif;",
			),
			"content:'Hello\\'World'; font-family:\"Arial\", sans-serif;",
		);
		assert.equal(
			processCSS("[data-testid='button'] { color: white; }"),
			"[data-testid='button']{ color:white; }",
		);
	});

	it("should optimize performance edge cases efficiently", () => {
		// Pathological whitespace patterns
		const extremeSpaces = "color:        white;    background:    #007bff;";
		assert.equal(processCSS(extremeSpaces), "color:white; background:#007bff;");

		const extremeNewlines = "color:\n\n\nwhite;\n\n\nbackground:\n\n\n#007bff;";
		assert.equal(
			processCSS(extremeNewlines),
			"color:white; background:#007bff;",
		);

		const mixedWhitespace = "color:\twhite;\nbackground:\t#007bff;";
		assert.equal(
			processCSS(mixedWhitespace),
			"color:white; background:#007bff;",
		);

		// Large CSS processing
		const largeCSS =
			".button{color:white;background:#007bff;padding:10px;margin:5px;border:1px solid #ccc;border-radius:4px;}".repeat(
				50,
			);
		const largeResult = processCSS(largeCSS);
		assert.ok(largeResult.length > 0);
		assert.ok(largeResult.includes("color:white"));
		assert.ok(largeResult.includes("background:#007bff"));
		assert.ok(largeResult.split(".button{").length === 51); // Original + 50 repeats
	});
});

describe("integration scenarios", () => {
	it("should process complete CSS frameworks and component libraries", () => {
		// Multi-component CSS framework
		const frameworkCSS = `
			/* Base styles */
			.btn { padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
			.btn-primary { background: #007bff; color: white; }
			.btn-secondary { background: #6c757d; color: white; }

			/* Layout components */
			.container { max-width: 1200px; margin: 0 auto; padding: 0 15px; }
			.row { display: flex; flex-wrap: wrap; margin: 0 -15px; }
			.col { flex: 1; padding: 0 15px; }

			/* Responsive design */
			@media (max-width: 768px) {
				.container { padding: 0 10px; }
				.btn { padding: 8px 12px; }
			}
		`;

		const result = processCSS(frameworkCSS);

		// Verify all components are properly minified
		assert.ok(
			result.includes(
				".btn{ padding:10px 15px; border:none; border-radius:4px; cursor:pointer; }",
			),
		);
		assert.ok(
			result.includes(".btn-primary{ background:#007bff; color:white; }"),
		);
		assert.ok(
			result.includes(
				".container{ max-width:1200px; margin:0 auto; padding:0 15px; }",
			),
		);
		assert.ok(result.includes("@media (max-width:768px)"));
		assert.ok(result.includes("flex:1"));

		// Ensure proper spacing between rules
		assert.ok(result.includes("} .btn-"));
		assert.ok(result.includes("*/ .container{"));
		assert.ok(result.includes("*/ @media"));
	});

	it("should handle production-grade CSS with advanced patterns", () => {
		// CSS Grid, Flexbox, and animations
		const advancedCSS = `
			.grid-layout {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				grid-gap: 20px;
				align-items: start;
			}

			.animated-element {
				animation: slideIn 0.3s ease-out forwards;
				transform: translateX(-100%);
			}

			@keyframes slideIn {
				0% { transform: translateX(-100%); opacity: 0; }
				100% { transform: translateX(0); opacity: 1; }
			}

			.complex-selector[data-state="active"]:not(.disabled):hover::before {
				content: "→";
				position: absolute;
				left: -20px;
			}
		`;

		const result = processCSS(advancedCSS);

		// Grid properties
		assert.ok(result.includes("display:grid"));
		assert.ok(
			result.includes(
				"grid-template-columns:repeat(auto-fit, minmax(300px, 1fr))",
			),
		);
		assert.ok(result.includes("grid-gap:20px"));

		// Animation properties
		assert.ok(result.includes("animation:slideIn 0.3s ease-out forwards"));
		assert.ok(result.includes("transform:translateX(-100%)"));

		// Keyframes structure
		assert.ok(result.includes("@keyframes slideIn{"));
		assert.ok(result.includes("0%{ transform:translateX(-100%); opacity:0; }"));
		assert.ok(result.includes("100%{ transform:translateX(0); opacity:1; }"));

		// Complex selector preservation
		assert.ok(
			result.includes(
				'.complex-selector[data-state="active"]:not(.disabled):hover::before{',
			),
		);
		assert.ok(result.includes('content:"→"'));
		assert.ok(result.includes("left:-20px"));
	});
});
