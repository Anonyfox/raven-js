import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { robots } from "./robots.js";

describe("robots", () => {
	it("generates default robots meta tag", () => {
		const result = robots({});
		assert(result.includes('name="robots"'));
		assert(result.includes('content="index, follow"'));
	});

	it("handles index true, follow true", () => {
		const result = robots({ index: true, follow: true });
		assert(result.includes('content="index, follow"'));
	});

	it("handles index false, follow false", () => {
		const result = robots({ index: false, follow: false });
		assert(result.includes('content="noindex, nofollow"'));
	});

	it("handles index true, follow false", () => {
		const result = robots({ index: true, follow: false });
		assert(result.includes('content="index, nofollow"'));
	});

	it("handles index false, follow true", () => {
		const result = robots({ index: false, follow: true });
		assert(result.includes('content="noindex, follow"'));
	});

	it("handles only index parameter", () => {
		const result = robots({ index: false });
		assert(result.includes('content="noindex, follow"'));
	});

	it("handles only follow parameter", () => {
		const result = robots({ follow: false });
		assert(result.includes('content="index, nofollow"'));
	});

	it("treats truthy values as true", () => {
		const result = robots({ index: "yes", follow: 1 });
		assert(result.includes('content="index, follow"'));
	});

	it("treats falsy values as false", () => {
		const result = robots({ index: "", follow: 0 });
		assert(result.includes('content="noindex, nofollow"'));
	});

	it("handles null and undefined differently", () => {
		const result = robots({ index: null, follow: undefined });
		assert(result.includes('content="noindex, follow"'));
	});

	it("creates single meta tag", () => {
		const result = robots({ index: true, follow: true });
		const metaCount = (result.match(/<meta/g) || []).length;
		assert.equal(metaCount, 1);
	});

	it("formats content correctly", () => {
		const result = robots({ index: true, follow: false });
		assert(result.includes('"index, nofollow"'));
		assert(!result.includes('"index,nofollow"')); // No extra spaces
		assert(!result.includes('"index , nofollow"')); // No extra spaces
	});
});
