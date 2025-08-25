import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { js, script, scriptAsync, scriptDefer } from "./index.js";

describe("Template Tag Functions", () => {
	describe("js", () => {
		it("should return an empty string for empty input", () => {
			assert.equal(js``, "");
		});

		it("should return the static parts of the template", () => {
			assert.equal(js`static content`, "static content");
		});

		it("should interpolate valid values", () => {
			assert.equal(js`value: ${42}`, "value: 42");
			assert.equal(js`value: ${"test"}`, "value: test");
		});

		it("should join array values", () => {
			assert.equal(js`array: ${[1, 2, 3]}`, "array: 123");
		});

		it("should ignore invalid values", () => {
			assert.equal(js`value: ${null}`, "value:");
			assert.equal(js`value: ${undefined}`, "value:");
			assert.equal(js`value: ${false}`, "value:");
		});

		it("should handle mixed valid and invalid values", () => {
			assert.equal(js`values: ${42}, ${null}, ${"test"}`, "values: 42, , test");
		});

		it("should trim the result", () => {
			assert.equal(js`  value: ${42}  `, "value: 42");
		});
	});

	describe("script", () => {
		it("should wrap content in script tags", () => {
			assert.equal(
				script`console.log('test');`,
				"<script type=\"text/javascript\">console.log('test');</script>",
			);
		});

		it("should handle empty content", () => {
			assert.equal(script``, '<script type="text/javascript"></script>');
		});

		it("should interpolate values inside script tags", () => {
			assert.equal(
				script`console.log(${42});`,
				'<script type="text/javascript">console.log(42);</script>',
			);
		});
	});

	describe("scriptDefer", () => {
		it("should wrap content in deferred script tags", () => {
			assert.equal(
				scriptDefer`console.log('test');`,
				"<script type=\"text/javascript\" defer>console.log('test');</script>",
			);
		});

		it("should handle empty content", () => {
			assert.equal(
				scriptDefer``,
				'<script type="text/javascript" defer></script>',
			);
		});

		it("should interpolate values inside deferred script tags", () => {
			assert.equal(
				scriptDefer`console.log(${42});`,
				'<script type="text/javascript" defer>console.log(42);</script>',
			);
		});
	});

	describe("scriptAsync", () => {
		it("should wrap content in async script tags", () => {
			assert.equal(
				scriptAsync`console.log('test');`,
				"<script type=\"text/javascript\" async>console.log('test');</script>",
			);
		});

		it("should handle empty content", () => {
			assert.equal(
				scriptAsync``,
				'<script type="text/javascript" async></script>',
			);
		});

		it("should interpolate values inside async script tags", () => {
			assert.equal(
				scriptAsync`console.log(${42});`,
				'<script type="text/javascript" async>console.log(42);</script>',
			);
		});
	});
});
