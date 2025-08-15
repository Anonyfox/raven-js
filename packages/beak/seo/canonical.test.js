import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { canonical } from "./canonical.js";

describe("canonical", () => {
	it("should generate correct canonical meta tags with basic parameters", () => {
		const config = {
			domain: "example.com",
			path: "/my-page",
		};
		const result = canonical(config);

		assert(result.includes('href="https://example.com/my-page"'));
		assert(result.includes('rel="canonical"'));
		assert(!result.includes("hreflang"));
		assert(!result.includes("media"));
	});

	it("should generate correct canonical meta tags with hreflang", () => {
		const config = {
			domain: "example.com",
			path: "/my-page",
			hreflang: "en-US",
		};
		const result = canonical(config);

		assert(result.includes('href="https://example.com/my-page"'));
		assert(result.includes('hreflang="en-US"'));
		assert(result.includes('rel="canonical"'));
	});

	it("should generate correct canonical meta tags with media", () => {
		const config = {
			domain: "example.com",
			path: "/my-page",
			media: "only screen and (max-width: 640px)",
		};
		const result = canonical(config);

		assert(result.includes('href="https://example.com/my-page"'));
		assert(result.includes('media="only screen and (max-width: 640px)"'));
		assert(result.includes('rel="canonical"'));
	});

	it("should generate correct canonical meta tags with both hreflang and media", () => {
		const config = {
			domain: "example.com",
			path: "/my-page",
			hreflang: "es-ES",
			media: "only screen and (max-width: 768px)",
		};
		const result = canonical(config);

		assert(result.includes('href="https://example.com/my-page"'));
		assert(result.includes('hreflang="es-ES"'));
		assert(result.includes('media="only screen and (max-width: 768px)"'));
		assert(result.includes('rel="canonical"'));
	});

	it("should handle absolute URLs correctly", () => {
		const config = {
			domain: "example.com",
			path: "https://other.com/my-page",
		};
		const result = canonical(config);

		assert(result.includes('href="https://other.com/my-page"'));
	});

	it("should handle URLs without leading slash", () => {
		const config = {
			domain: "example.com",
			path: "my-page",
		};
		const result = canonical(config);

		assert(result.includes('href="https://example.com/my-page"'));
	});

	it("should handle empty path", () => {
		const config = {
			domain: "example.com",
			path: "",
		};
		const result = canonical(config);

		assert(result.includes('href="https://example.com"'));
	});
});
