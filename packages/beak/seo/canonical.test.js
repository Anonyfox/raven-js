import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { canonical } from "./canonical.js";

describe("canonical", () => {
	it("generates basic canonical link", () => {
		const result = canonical({ domain: "example.com", path: "/page" });
		assert(result.includes('rel="canonical"'));
		assert(result.includes('href="https://example.com/page"'));
	});

	it("handles root path", () => {
		const result = canonical({ domain: "example.com", path: "/" });
		assert(result.includes('href="https://example.com/"'));
	});

	it("adds hreflang attribute when provided", () => {
		const result = canonical({
			domain: "example.com",
			path: "/page",
			hreflang: "en-US",
		});
		assert(result.includes('hreflang="en-US"'));
	});

	it("adds media attribute when provided", () => {
		const result = canonical({
			domain: "example.com",
			path: "/mobile",
			media: "screen and (max-width: 640px)",
		});
		assert(result.includes('media="screen and (max-width: 640px)"'));
	});

	it("includes both hreflang and media when both provided", () => {
		const result = canonical({
			domain: "example.com",
			path: "/page",
			hreflang: "en-US",
			media: "print",
		});
		assert(result.includes('hreflang="en-US"'));
		assert(result.includes('media="print"'));
	});

	it("handles path without leading slash", () => {
		const result = canonical({ domain: "example.com", path: "page" });
		assert(result.includes('href="https://example.com/page"'));
	});

	it("handles attributes with quotes", () => {
		const result = canonical({
			domain: "example.com",
			path: "/page",
			hreflang: "en-US",
		});
		assert(result.includes('hreflang="en-US"'));
	});
});
