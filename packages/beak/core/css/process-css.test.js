import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { processCSS } from "./process-css.js";

describe("processCSS", () => {
	describe("basic CSS processing", () => {
		it("should normalize whitespace sequences", () => {
			const input = "  .button  {  color:  white;  }  ";
			const result = processCSS(input);
			assert.equal(result, ".button{ color:white; }");
		});

		it("should remove spaces around colons", () => {
			const input = "color : white; background : #007bff;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});

		it("should remove spaces before semicolons", () => {
			const input = "color: white ; background: #007bff ;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});

		it("should remove spaces before opening braces", () => {
			const input = ".button { color: white; }";
			const result = processCSS(input);
			assert.equal(result, ".button{ color:white; }");
		});

		it("should remove spaces before closing braces", () => {
			const input = ".button { color: white; } ";
			const result = processCSS(input);
			assert.equal(result, ".button{ color:white; }");
		});

		it("should add spaces after semicolons when needed", () => {
			const input = "color:white;background:#007bff;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});

		it("should add spaces after closing braces when needed", () => {
			const input = ".button{color:white;}.container{max-width:1200px;}";
			const result = processCSS(input);
			assert.equal(
				result,
				".button{color:white; } .container{max-width:1200px; }",
			);
		});
	});

	describe("complex CSS structures", () => {
		it("should handle nested selectors", () => {
			const input = `
				.container {
					max-width: 1200px;
					margin: 0 auto;
				}
				.container .button {
					color: white;
					background: #007bff;
				}
			`;
			const result = processCSS(input);
			assert.equal(
				result,
				".container{ max-width:1200px; margin:0 auto; } .container .button{ color:white; background:#007bff; }",
			);
		});

		it("should handle pseudo-selectors", () => {
			const input = `
				.button:hover {
					background: #0056b3;
				}
				.button:active {
					background: #004085;
				}
			`;
			const result = processCSS(input);
			assert.equal(
				result,
				".button:hover{ background:#0056b3; } .button:active{ background:#004085; }",
			);
		});

		it("should handle media queries", () => {
			const input = `
				@media (max-width: 768px) {
					.container {
						padding: 10px;
					}
				}
			`;
			const result = processCSS(input);
			assert.equal(
				result,
				"@media (max-width:768px){ .container{ padding:10px; } }",
			);
		});

		it("should handle keyframes", () => {
			const input = `
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
			`;
			const result = processCSS(input);
			assert.equal(
				result,
				"@keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }",
			);
		});
	});

	describe("property values", () => {
		it("should preserve spaces in property values", () => {
			const input = "font-family: Arial, sans-serif; margin: 10px 20px;";
			const result = processCSS(input);
			assert.equal(result, "font-family:Arial, sans-serif; margin:10px 20px;");
		});

		it("should handle complex property values", () => {
			const input =
				"box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);";
			const result = processCSS(input);
			assert.equal(
				result,
				"box-shadow:0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);",
			);
		});

		it("should handle vendor prefixes", () => {
			const input =
				"-webkit-transform: rotate(45deg); -moz-transform: rotate(45deg); transform: rotate(45deg);";
			const result = processCSS(input);
			assert.equal(
				result,
				"-webkit-transform:rotate(45deg); -moz-transform:rotate(45deg); transform:rotate(45deg);",
			);
		});

		it("should handle calc() functions", () => {
			const input = "width: calc(100% - 20px); height: calc(50vh + 10px);";
			const result = processCSS(input);
			assert.equal(
				result,
				"width:calc(100% - 20px); height:calc(50vh + 10px);",
			);
		});

		it("should handle url() functions", () => {
			const input =
				"background-image: url('image.jpg'); background-size: cover;";
			const result = processCSS(input);
			assert.equal(
				result,
				"background-image:url('image.jpg'); background-size:cover;",
			);
		});
	});

	describe("edge cases", () => {
		it("should handle empty string", () => {
			const result = processCSS("");
			assert.equal(result, "");
		});

		it("should handle whitespace-only string", () => {
			const result = processCSS("   \n\t  ");
			assert.equal(result, "");
		});

		it("should handle single character", () => {
			const result = processCSS("a");
			assert.equal(result, "a");
		});

		it("should handle CSS without semicolons", () => {
			const input = ".button { color: white }";
			const result = processCSS(input);
			assert.equal(result, ".button{ color:white}");
		});

		it("should handle CSS without braces", () => {
			const input = "color: white; background: #007bff;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});

		it("should handle CSS with only braces", () => {
			const input = "{}";
			const result = processCSS(input);
			assert.equal(result, "{}");
		});

		it("should handle CSS with only semicolons", () => {
			const input = ";;;";
			const result = processCSS(input);
			assert.equal(result, "; ; ;");
		});

		it("should handle CSS with only colons", () => {
			const input = ":::";
			const result = processCSS(input);
			assert.equal(result, ":::");
		});
	});

	describe("special characters", () => {
		it("should handle CSS with quotes", () => {
			const input = "content: 'Hello World'; font-family: 'Arial', sans-serif;";
			const result = processCSS(input);
			assert.equal(
				result,
				"content:'Hello World'; font-family:'Arial', sans-serif;",
			);
		});

		it("should handle CSS with double quotes", () => {
			const input = 'content: "Hello World"; font-family: "Arial", sans-serif;';
			const result = processCSS(input);
			assert.equal(
				result,
				'content:"Hello World"; font-family:"Arial", sans-serif;',
			);
		});

		it("should handle CSS with escaped characters", () => {
			const input = "content: 'Hello\\'World';";
			const result = processCSS(input);
			assert.equal(result, "content:'Hello\\'World';");
		});

		it("should handle CSS with special selectors", () => {
			const input = "[data-testid='button'] { color: white; }";
			const result = processCSS(input);
			assert.equal(result, "[data-testid='button']{ color:white; }");
		});
	});

	describe("performance edge cases", () => {
		it("should handle very long CSS", () => {
			const longCSS =
				".button{color:white;background:#007bff;padding:10px;margin:5px;border:1px solid #ccc;border-radius:4px;font-size:14px;font-weight:bold;text-align:center;cursor:pointer;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1);}".repeat(
					100,
				);
			const result = processCSS(longCSS);
			assert.ok(result.length > 0);
			assert.ok(result.includes("color:white"));
			assert.ok(result.includes("background:#007bff"));
		});

		it("should handle CSS with many consecutive spaces", () => {
			const input = "color:        white;    background:    #007bff;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});

		it("should handle CSS with many consecutive newlines", () => {
			const input = "color:\n\n\nwhite;\n\n\nbackground:\n\n\n#007bff;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});

		it("should handle CSS with tabs and newlines", () => {
			const input = "color:\twhite;\nbackground:\t#007bff;";
			const result = processCSS(input);
			assert.equal(result, "color:white; background:#007bff;");
		});
	});

	describe("real-world scenarios", () => {
		it("should handle a complete CSS rule", () => {
			const input = `
				.button {
					display: inline-block;
					padding: 10px 20px;
					font-size: 16px;
					font-weight: bold;
					text-align: center;
					text-decoration: none;
					color: white;
					background-color: #007bff;
					border: 1px solid #007bff;
					border-radius: 4px;
					cursor: pointer;
					transition: all 0.3s ease;
				}
			`;
			const result = processCSS(input);
			assert.ok(result.includes("display:inline-block"));
			assert.ok(result.includes("padding:10px 20px"));
			assert.ok(result.includes("color:white"));
			assert.ok(result.includes("background-color:#007bff"));
		});

		it("should handle multiple CSS rules", () => {
			const input = `
				.button { color: white; background: #007bff; }
				.container { max-width: 1200px; margin: 0 auto; }
				.text { font-size: 16px; line-height: 1.5; }
			`;
			const result = processCSS(input);
			assert.ok(result.includes(".button{ color:white; background:#007bff; }"));
			assert.ok(
				result.includes(".container{ max-width:1200px; margin:0 auto; }"),
			);
			assert.ok(result.includes(".text{ font-size:16px; line-height:1.5; }"));
		});
	});
});
