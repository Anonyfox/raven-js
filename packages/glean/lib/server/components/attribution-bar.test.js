/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for attribution bar component - 100% coverage validation
 *
 * Ravens test attribution display intelligence with surgical precision.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AttributionContext } from "../../extract/models/attribution.js";
import { attributionBar } from "./attribution-bar.js";

describe("attributionBar component rendering", () => {
	it("returns empty string when no attribution context", () => {
		const result = attributionBar(null);
		assert.strictEqual(result, "");
	});

	it("returns empty string when attribution context has no authors", () => {
		const context = new AttributionContext([], [], null);
		const result = attributionBar(context);
		assert.strictEqual(result, "");
	});

	it("renders primary author without email", () => {
		const authorTag = {
			name: "John Doe",
			email: "",
			authorInfo: "John Doe",
			hasEmail: false,
		};
		const context = new AttributionContext([authorTag], [], null);
		const result = attributionBar(context);

		assert.ok(result.includes("By John Doe"));
		assert.ok(!result.includes("mailto:"));
		assert.ok(result.includes("text-muted"));
	});

	it("renders primary author with email as mailto link", () => {
		const authorTag = {
			name: "Jane Smith",
			email: "jane@example.com",
			authorInfo: "Jane Smith <jane@example.com>",
			hasEmail: true,
		};
		const context = new AttributionContext([authorTag], [], null);
		const result = attributionBar(context);

		assert.ok(result.includes("By"));
		assert.ok(result.includes("mailto:jane@example.com"));
		assert.ok(result.includes("Jane Smith"));
		assert.ok(result.includes("text-decoration-none"));
	});

	it("renders primary author and single contributor", () => {
		const primaryAuthor = {
			name: "John Doe",
			email: "john@example.com",
			authorInfo: "John Doe <john@example.com>",
			hasEmail: true,
		};
		const contributor = {
			name: "Jane Smith",
			email: "",
			authorInfo: "Jane Smith",
			hasEmail: false,
		};
		const context = new AttributionContext(
			[primaryAuthor, contributor],
			[],
			null,
		);
		const result = attributionBar(context);

		assert.ok(result.includes("By"));
		assert.ok(result.includes("mailto:john@example.com"));
		assert.ok(result.includes("John Doe"));
		assert.ok(result.includes("Contributors:"));
		assert.ok(result.includes("Jane Smith"));
		assert.ok(!result.includes("mailto:jane"));
	});

	it("renders multiple contributors with mixed email presence", () => {
		const primaryAuthor = {
			name: "John Doe",
			email: "",
			authorInfo: "John Doe",
			hasEmail: false,
		};
		const contributor1 = {
			name: "Jane Smith",
			email: "jane@example.com",
			authorInfo: "Jane Smith <jane@example.com>",
			hasEmail: true,
		};
		const contributor2 = {
			name: "Bob Wilson",
			email: "",
			authorInfo: "Bob Wilson",
			hasEmail: false,
		};
		const context = new AttributionContext(
			[primaryAuthor, contributor1, contributor2],
			[],
			null,
		);
		const result = attributionBar(context);

		assert.ok(result.includes("By John Doe"));
		assert.ok(result.includes("Contributors:"));
		assert.ok(result.includes("mailto:jane@example.com"));
		assert.ok(result.includes("Jane Smith"));
		assert.ok(result.includes("Bob Wilson"));
		assert.ok(!result.includes("mailto:bob"));
	});

	it("renders only primary author when no contributors", () => {
		const primaryAuthor = {
			name: "Solo Author",
			email: "solo@example.com",
			authorInfo: "Solo Author <solo@example.com>",
			hasEmail: true,
		};
		const context = new AttributionContext([primaryAuthor], [], null);
		const result = attributionBar(context);

		assert.ok(result.includes("By"));
		assert.ok(result.includes("mailto:solo@example.com"));
		assert.ok(result.includes("Solo Author"));
		assert.ok(!result.includes("Contributors:"));
	});

	it("filters out contributors with no name", () => {
		const primaryAuthor = {
			name: "John Doe",
			email: "",
			authorInfo: "John Doe",
			hasEmail: false,
		};
		const validContributor = {
			name: "Jane Smith",
			email: "",
			authorInfo: "Jane Smith",
			hasEmail: false,
		};
		const invalidContributor = {
			name: "",
			email: "invalid@example.com",
			authorInfo: "",
			hasEmail: true,
		};
		const context = new AttributionContext(
			[primaryAuthor, validContributor, invalidContributor],
			[],
			null,
		);
		const result = attributionBar(context);

		assert.ok(result.includes("By John Doe"));
		assert.ok(result.includes("Contributors:"));
		assert.ok(result.includes("Jane Smith"));
		assert.ok(!result.includes("invalid@example.com"));
		assert.ok(!result.includes("Contributors: ,"));
	});

	it("returns empty when primary author has no name", () => {
		const invalidAuthor = {
			name: "",
			email: "test@example.com",
			authorInfo: "",
			hasEmail: true,
		};
		const context = new AttributionContext([invalidAuthor], [], null);
		const result = attributionBar(context);

		assert.strictEqual(result, "");
	});

	it("includes proper Bootstrap classes", () => {
		const authorTag = {
			name: "Test Author",
			email: "test@example.com",
			authorInfo: "Test Author <test@example.com>",
			hasEmail: true,
		};
		const context = new AttributionContext([authorTag], [], null);
		const result = attributionBar(context);

		assert.ok(result.includes('class="mt-2"'));
		assert.ok(result.includes("text-muted"));
		assert.ok(result.includes("small"));
		assert.ok(result.includes("text-decoration-none"));
	});
});
