import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { css, style } from "./index.js";

const _a = css`
				.button {
					color: white;
					background: #007bff;
					padding: 10px 15px;
				}
			`;
const _b = css`
			.button {
				color: white;
				background: #007bff;
				padding: 10px 15px;
			}
		`;

describe("css function", () => {
	it("should format basic CSS correctly", () => {
		const result = css`
				.button {
					color: white;
					background: #007bff;
					padding: 10px 15px;
				}
			`;
		assert.equal(
			result,
			".button{ color:white; background:#007bff; padding:10px 15px; }",
		);
	});

	it("should handle dynamic values", () => {
		const color = "white";
		const background = "#007bff";
		const result = css`
				.button {
					color: ${color};
					background: ${background};
					padding: 10px 15px;
				}
			`;
		assert.equal(
			result,
			".button{ color:white; background:#007bff; padding:10px 15px; }",
		);
	});

	it("should handle multiple rules", () => {
		const result = css`
				.button { color: white; }
				.container { max-width: 1200px; }
			`;
		assert.equal(
			result,
			".button{ color:white; } .container{ max-width:1200px; }",
		);
	});

	it("should handle empty input", () => {
		const result = css``;
		assert.equal(result, "");
	});

	it("should handle single property", () => {
		const result = css`color: white;`;
		assert.equal(result, "color:white;");
	});

	it("should preserve spaces in property values", () => {
		const result = css`font-family: Arial, sans-serif;`;
		assert.equal(result, "font-family:Arial, sans-serif;");
	});

	it("should handle complex property values", () => {
		const result = css`
				box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);
			`;
		assert.equal(
			result,
			"box-shadow:0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);",
		);
	});

	it("should handle vendor prefixes", () => {
		const result = css`
				-webkit-transform: rotate(45deg);
				-moz-transform: rotate(45deg);
				transform: rotate(45deg);
			`;
		assert.equal(
			result,
			"-webkit-transform:rotate(45deg); -moz-transform:rotate(45deg); transform:rotate(45deg);",
		);
	});
});

describe("style function", () => {
	it("should wrap CSS in style tags", () => {
		const result = style`
				.button {
					color: white;
					background: #007bff;
				}
			`;
		assert.equal(
			result,
			"<style>.button{ color:white; background:#007bff; }</style>",
		);
	});

	it("should handle empty input", () => {
		const result = style``;
		assert.equal(result, "<style></style>");
	});

	it("should handle multiple rules", () => {
		const result = style`
				.button { color: white; }
				.container { max-width: 1200px; }
			`;
		assert.equal(
			result,
			"<style>.button{ color:white; } .container{ max-width:1200px; }</style>",
		);
	});
});
