import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { discord } from "./discord.js";

describe("discord", () => {
	it("generates basic Discord meta tags", () => {
		const result = discord({
			title: "Join Community",
			description: "Connect with developers",
			domain: "example.com",
			path: "/community",
		});
		assert(result.includes('name="discord:title"'));
		assert(result.includes('content="Join Community"'));
		assert(result.includes('name="discord:description"'));
		assert(result.includes('content="Connect with developers"'));
		assert(result.includes('content="https://example.com/community"'));
	});

	it("includes image tag when imageUrl provided", () => {
		const result = discord({
			title: "Game Server",
			description: "Play together",
			domain: "example.com",
			path: "/game",
			imageUrl: "/banner.jpg",
		});
		assert(result.includes('name="discord:image"'));
		assert(result.includes('content="https://example.com/banner.jpg"'));
	});

	it("includes invite tag when invite provided", () => {
		const result = discord({
			title: "Server",
			description: "Join us",
			invite: "abc123",
		});
		assert(result.includes('name="discord:invite"'));
		assert(result.includes('content="abc123"'));
	});

	it("handles path without domain", () => {
		const result = discord({
			title: "Local",
			description: "Local content",
			path: "/local",
		});
		assert(result.includes('content="/local"'));
	});

	it("handles imageUrl without domain", () => {
		const result = discord({
			title: "Test",
			description: "Test description",
			imageUrl: "/image.jpg",
		});
		assert(result.includes('content="/image.jpg"'));
	});

	it("excludes image tag when no imageUrl", () => {
		const result = discord({
			title: "No Image",
			description: "No image content",
		});
		assert(!result.includes("discord:image"));
	});

	it("excludes invite tag when no invite", () => {
		const result = discord({
			title: "No Invite",
			description: "No invite content",
		});
		assert(!result.includes("discord:invite"));
	});

	it("handles HTML in content", () => {
		const result = discord({
			title: "Test Script",
			description: "Desc and content",
		});
		assert(result.includes("Test Script"));
		assert(result.includes("Desc and content"));
	});
});
