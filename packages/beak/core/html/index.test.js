import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { html, safeHtml } from "./index.js";

describe("HTML Template Functions", () => {
	describe("html", () => {
		it("renders static HTML correctly", () => {
			const result = html`<div>Hello, World!</div>`;
			assert.equal(result, "<div>Hello, World!</div>");
		});

		it("interpolates dynamic values correctly", () => {
			const name = "Quoth";
			const result = html`<div>Hello, ${name}!</div>`;
			assert.equal(result, "<div>Hello, Quoth!</div>");
		});

		it("joins array values correctly", () => {
			const items = ["one", "two", "three"];
			const result = html`<div>${items}</div>`;
			assert.equal(result, "<div>onetwothree</div>");
		});

		it("handles falsy values correctly", () => {
			const result = html`<div>${null}${undefined}${false}${0}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("trims the result correctly", () => {
			const result = html`  <div>Trimmed</div>  `;
			assert.equal(result, "<div>Trimmed</div>");
		});
	});

	describe("safeHtml", () => {
		it("escapes HTML special characters in dynamic values", () => {
			const unsafeString = `<script>alert("XSS")</script>`;
			const result = safeHtml`<div>${unsafeString}</div>`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</div>",
			);
		});

		it("renders static HTML correctly", () => {
			const result = safeHtml`<div>Hello, World!</div>`;
			assert.equal(result, "<div>Hello, World!</div>");
		});

		it("interpolates dynamic values correctly", () => {
			const name = "Quoth";
			const result = safeHtml`<div>Hello, ${name}!</div>`;
			assert.equal(result, "<div>Hello, Quoth!</div>");
		});

		it("joins array values correctly", () => {
			const items = ["one", "two", "three"];
			const result = safeHtml`<div>${items}</div>`;
			assert.equal(result, "<div>onetwothree</div>");
		});

		it("handles falsy values correctly", () => {
			const result = safeHtml`<div>${null}${undefined}${false}${0}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("trims the result correctly", () => {
			const result = safeHtml`  <div>Trimmed</div>  `;
			assert.equal(result, "<div>Trimmed</div>");
		});
	});
});
