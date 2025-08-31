import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { general } from "./general.js";

describe("general", () => {
	it("generates basic SEO meta tags", () => {
		const result = general({
			title: "My Page",
			description: "Page description",
			domain: "example.com",
			path: "/page",
		});
		assert(result.includes("<title>My Page</title>"));
		assert(result.includes('name="description"'));
		assert(result.includes('content="Page description"'));
		assert(result.includes('rel="canonical"'));
		assert(result.includes('href="https://example.com/page"'));
	});

	it("adds title suffix when provided", () => {
		const result = general({
			title: "Article",
			description: "Content",
			suffix: "Blog",
		});
		assert(result.includes("<title>Article | Blog</title>"));
	});

	it("works without domain and path", () => {
		const result = general({
			title: "Simple",
			description: "Basic page",
		});
		assert(result.includes("<title>Simple</title>"));
		assert(result.includes('content="Basic page"'));
	});

	it("handles empty title", () => {
		const result = general({
			title: "",
			description: "Empty title test",
		});
		assert(result.includes("<title></title>"));
	});

	it("handles title with suffix when title is empty", () => {
		const result = general({
			title: "",
			description: "Test",
			suffix: "Site",
		});
		assert(result.includes("<title> | Site</title>"));
	});

	it("handles HTML in title", () => {
		const result = general({
			title: "Test Script",
			description: "Test",
		});
		assert(result.includes("Test Script"));
	});

	it("handles HTML in description", () => {
		const result = general({
			title: "Test",
			description: "Desc with tags and entities",
		});
		assert(result.includes("Desc with tags and entities"));
	});

	it("includes property attribute on description meta", () => {
		const result = general({
			title: "Test",
			description: "Test description",
		});
		assert(result.includes('property="description"'));
		assert(result.includes('name="description"'));
	});
});
