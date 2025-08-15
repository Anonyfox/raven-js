import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { discord } from "./discord.js";

describe("discord", () => {
	it("should generate correct Discord meta tags with all parameters", () => {
		const config = {
			title: "Join Our Community",
			description: "Connect with like-minded developers",
			domain: "example.com",
			path: "/community",
			imageUrl: "/discord-banner.jpg",
			invite: "abc123",
		};
		const result = discord(config);

		assert(result.includes('content="Join Our Community"'));
		assert(result.includes('content="Connect with like-minded developers"'));
		assert(result.includes('content="https://example.com/community"'));
		assert(result.includes('content="https://example.com/discord-banner.jpg"'));
		assert(result.includes('content="abc123"'));
		assert(result.includes('name="discord:title"'));
		assert(result.includes('name="discord:description"'));
		assert(result.includes('name="discord:url"'));
		assert(result.includes('name="discord:image"'));
		assert(result.includes('name="discord:invite"'));
	});

	it("should generate correct Discord meta tags without optional parameters", () => {
		const config = {
			title: "Basic Page",
			description: "Basic description",
			domain: "example.com",
			path: "/basic",
		};
		const result = discord(config);

		assert(result.includes('content="Basic Page"'));
		assert(result.includes('content="Basic description"'));
		assert(result.includes('content="https://example.com/basic"'));
		assert(result.includes('name="discord:title"'));
		assert(result.includes('name="discord:description"'));
		assert(result.includes('name="discord:url"'));
		assert(!result.includes("discord:image"));
		assert(!result.includes("discord:invite"));
	});

	it("should handle absolute URLs correctly", () => {
		const config = {
			title: "Test Page",
			description: "Test description",
			domain: "example.com",
			path: "/test",
			imageUrl: "https://other.com/test-image.png",
		};
		const result = discord(config);

		assert(result.includes('content="https://other.com/test-image.png"'));
	});
});
