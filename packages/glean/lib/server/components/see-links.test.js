/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for see links component - 100% coverage validation
 *
 * Ravens test reference link intelligence with surgical precision.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AttributionContext } from "../../extract/models/attribution.js";
import { seeAlsoLinks } from "./see-links.js";

describe("seeAlsoLinks component rendering", () => {
	it("returns empty string when no attribution context", () => {
		const result = seeAlsoLinks(null);
		assert.strictEqual(result, "");
	});

	it("returns empty string when attribution context has no links", () => {
		const context = new AttributionContext([], [], null);
		const result = seeAlsoLinks(context);
		assert.strictEqual(result, "");
	});

	it("renders link-type see tags with external link icon", () => {
		const seeTag = {
			referenceType: "link",
			reference: "https://example.com",
			description: "Example Site",
			url: "https://example.com",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("See also:"));
		assert.ok(result.includes('href="https://example.com"'));
		assert.ok(result.includes("Example Site"));
		assert.ok(result.includes('target="_blank"'));
		assert.ok(result.includes('rel="noopener noreferrer"'));
		assert.ok(result.includes("badge bg-primary"));
		assert.ok(result.includes("↗"));
	});

	it("renders url-type see tags with hostname as fallback", () => {
		const seeTag = {
			referenceType: "url",
			reference: "https://github.com/example/repo",
			description: "",
			url: "https://github.com/example/repo",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("See also:"));
		assert.ok(result.includes('href="https://github.com/example/repo"'));
		assert.ok(result.includes("github.com"));
		assert.ok(result.includes("badge bg-secondary"));
		assert.ok(result.includes("↗"));
	});

	it("renders symbol-type see tags with code styling", () => {
		const seeTag = {
			referenceType: "symbol",
			reference: "MyFunction",
			description: "",
			url: "",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("See also:"));
		assert.ok(result.includes("badge bg-light text-dark"));
		assert.ok(result.includes("<code>MyFunction</code>"));
		assert.ok(result.includes("Symbol reference"));
	});

	it("renders module-type see tags with info badge", () => {
		const seeTag = {
			referenceType: "module",
			reference: "module:myModule",
			description: "",
			url: "",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("See also:"));
		assert.ok(result.includes("badge bg-info text-dark"));
		assert.ok(result.includes("module:myModule"));
		assert.ok(result.includes("Module reference"));
	});

	it("renders text-type see tags with muted badge", () => {
		const seeTag = {
			referenceType: "text",
			reference: "Some reference text",
			description: "",
			url: "",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("See also:"));
		assert.ok(result.includes("badge bg-light text-muted"));
		assert.ok(result.includes("Some reference text"));
		assert.ok(result.includes("Text reference"));
	});

	it("renders multiple see tags of different types", () => {
		const linkTag = {
			referenceType: "link",
			reference: "https://example.com",
			description: "Example",
			url: "https://example.com",
		};
		const symbolTag = {
			referenceType: "symbol",
			reference: "MyFunction",
			description: "",
			url: "",
		};
		const moduleTag = {
			referenceType: "module",
			reference: "module:test",
			description: "",
			url: "",
		};

		const context = new AttributionContext(
			[],
			[linkTag, symbolTag, moduleTag],
			null,
		);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("See also:"));
		assert.ok(result.includes("badge bg-primary"));
		assert.ok(result.includes("badge bg-light text-dark"));
		assert.ok(result.includes("badge bg-info text-dark"));
		assert.ok(result.includes("Example"));
		assert.ok(result.includes("MyFunction"));
		assert.ok(result.includes("module:test"));
	});

	it("filters out see tags with no reference", () => {
		const validTag = {
			referenceType: "symbol",
			reference: "ValidFunction",
			description: "",
			url: "",
		};
		const invalidTag = {
			referenceType: "symbol",
			reference: "",
			description: "",
			url: "",
		};

		const context = new AttributionContext([], [validTag, invalidTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("ValidFunction"));
		assert.ok(!result.includes('badge bg-light text-dark me-1"></span>'));
	});

	it("uses compact styling when compact=true", () => {
		const seeTag = {
			referenceType: "symbol",
			reference: "TestFunction",
			description: "",
			url: "",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context, true);

		assert.ok(result.includes('class="mt-1"'));
		assert.ok(result.includes("text-muted small"));
	});

	it("uses normal styling when compact=false", () => {
		const seeTag = {
			referenceType: "symbol",
			reference: "TestFunction",
			description: "",
			url: "",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context, false);

		assert.ok(result.includes('class="mt-2"'));
		assert.ok(result.includes("text-muted"));
		assert.ok(!result.includes("text-muted small"));
	});

	it("returns empty when all see tags are empty", () => {
		const emptyTag1 = {
			referenceType: "symbol",
			reference: "",
			description: "",
			url: "",
		};
		const emptyTag2 = {
			referenceType: "url",
			reference: "",
			description: "",
			url: "",
		};

		const context = new AttributionContext([], [emptyTag1, emptyTag2], null);
		const result = seeAlsoLinks(context);

		assert.strictEqual(result, "");
	});

	it("handles URLs that might cause parsing errors gracefully", () => {
		const seeTag = {
			referenceType: "url",
			reference: "not-a-valid-url",
			description: "Custom Description",
			url: "not-a-valid-url",
		};
		const context = new AttributionContext([], [seeTag], null);
		const result = seeAlsoLinks(context);

		assert.ok(result.includes("Custom Description"));
		assert.ok(result.includes('href="not-a-valid-url"'));
	});
});
