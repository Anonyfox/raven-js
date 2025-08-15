import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { robots } from "./robots.js";

describe("robots", () => {
	it("should generate correct robots meta tags with default values", () => {
		const result = robots({});

		assert(result.includes('content="index, follow"'));
		assert(result.includes('name="robots"'));
		assert(!result.includes('name="googlebot"'));
		assert(!result.includes('name="googlebot-news"'));
		assert(!result.includes('name="max-snippet:-1"'));
		assert(!result.includes('name="max-image-preview:large"'));
		assert(!result.includes('name="max-video-preview:-1"'));
	});

	it("should generate correct robots meta tags with custom values", () => {
		const config = {
			index: false,
			follow: false,
		};
		const result = robots(config);

		assert(result.includes('content="noindex, nofollow"'));
		assert(result.includes('name="robots"'));
	});

	it("should handle partial configuration", () => {
		const config = {
			index: false,
			follow: true,
		};
		const result = robots(config);

		assert(result.includes('content="noindex, follow"'));
		assert(result.includes('name="robots"'));
	});

	it("should handle boolean values correctly", () => {
		const config = {
			index: true,
			follow: false,
		};
		const result = robots(config);

		assert(result.includes('content="index, nofollow"'));
		assert(result.includes('name="robots"'));
	});
});
