/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for package footer component - 100% coverage validation
 *
 * Ravens test package metadata display intelligence with surgical precision.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AttributionContext } from "../../extract/models/attribution.js";
import { inlinePackageLinks, packageFooter } from "./package-footer.js";

describe("packageFooter component rendering", () => {
	it("returns empty string when no attribution context", () => {
		const result = packageFooter(null);
		assert.strictEqual(result, "");
	});

	it("returns empty string when attribution context has no package metadata", () => {
		const context = new AttributionContext([], [], null);
		const result = packageFooter(context);
		assert.strictEqual(result, "");
	});

	it("returns empty string when package metadata has no links", () => {
		const packageMeta = {};
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);
		assert.strictEqual(result, "");
	});

	it("renders homepage link with proper icon and external link attributes", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes('href="https://example.com"'));
		assert.ok(result.includes("Homepage"));
		assert.ok(result.includes("🏠"));
		assert.ok(result.includes('target="_blank"'));
		assert.ok(result.includes('rel="noopener noreferrer"'));
		assert.ok(result.includes("text-decoration-none"));
		assert.ok(result.includes("text-muted"));
	});

	it("renders repository link with proper icon", () => {
		const packageMeta = {
			repository: { url: "https://github.com/example/repo" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes('href="https://github.com/example/repo"'));
		assert.ok(result.includes("Repository"));
		assert.ok(result.includes("📁"));
	});

	it("renders bugs link with proper icon", () => {
		const packageMeta = {
			bugs: { url: "https://github.com/example/repo/issues" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes('href="https://github.com/example/repo/issues"'));
		assert.ok(result.includes("Issues"));
		assert.ok(result.includes("🐛"));
	});

	it("renders funding link with proper icon", () => {
		const packageMeta = {
			funding: { url: "https://github.com/sponsors/example" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes('href="https://github.com/sponsors/example"'));
		assert.ok(result.includes("Funding"));
		assert.ok(result.includes("💖"));
	});

	it("renders all package links together", () => {
		const packageMeta = {
			homepage: "https://example.com",
			repository: { url: "https://github.com/example/repo" },
			bugs: { url: "https://github.com/example/repo/issues" },
			funding: { url: "https://github.com/sponsors/example" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes("Homepage"));
		assert.ok(result.includes("Repository"));
		assert.ok(result.includes("Issues"));
		assert.ok(result.includes("Funding"));
		assert.ok(result.includes("🏠"));
		assert.ok(result.includes("📁"));
		assert.ok(result.includes("🐛"));
		assert.ok(result.includes("💖"));
	});

	it("uses normal styling when minimal=false", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context, false);

		assert.ok(result.includes("mt-4 pt-3 border-top"));
	});

	it("uses minimal styling when minimal=true", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context, true);

		assert.ok(result.includes("mt-3 pt-2"));
		assert.ok(!result.includes("border-top"));
	});

	it("filters out empty URLs", () => {
		const packageMeta = {
			homepage: "https://example.com",
			repository: { url: "" },
			bugs: { url: null },
			funding: {},
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes("Homepage"));
		assert.ok(!result.includes("Repository"));
		assert.ok(!result.includes("Issues"));
		assert.ok(!result.includes("Funding"));
	});

	it("includes proper Bootstrap classes", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const result = packageFooter(context);

		assert.ok(result.includes("small"));
		assert.ok(result.includes("text-muted"));
		assert.ok(result.includes("me-3"));
	});
});

describe("inlinePackageLinks component rendering", () => {
	it("returns empty string when no attribution context", () => {
		const result = inlinePackageLinks(null);
		assert.strictEqual(result, "");
	});

	it("returns empty string when no package metadata", () => {
		const context = new AttributionContext([], [], null);
		const result = inlinePackageLinks(context);
		assert.strictEqual(result, "");
	});

	it("renders homepage as badge link", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const result = inlinePackageLinks(context);

		assert.ok(result.includes('href="https://example.com"'));
		assert.ok(result.includes("badge bg-light text-dark"));
		assert.ok(result.includes("🏠"));
		assert.ok(result.includes("Home"));
	});

	it("renders repository as badge link", () => {
		const packageMeta = {
			repository: { url: "https://github.com/example/repo" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = inlinePackageLinks(context);

		assert.ok(result.includes("📁"));
		assert.ok(result.includes("Repo"));
	});

	it("renders issues as badge link", () => {
		const packageMeta = {
			bugs: { url: "https://github.com/example/repo/issues" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = inlinePackageLinks(context);

		assert.ok(result.includes("🐛"));
		assert.ok(result.includes("Issues"));
	});

	it("renders funding with danger badge", () => {
		const packageMeta = {
			funding: { url: "https://github.com/sponsors/example" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = inlinePackageLinks(context);

		assert.ok(result.includes("badge bg-danger text-white"));
		assert.ok(result.includes("💖"));
		assert.ok(result.includes("Fund"));
	});

	it("renders all inline links together", () => {
		const packageMeta = {
			homepage: "https://example.com",
			repository: { url: "https://github.com/example/repo" },
			bugs: { url: "https://github.com/example/repo/issues" },
			funding: { url: "https://github.com/sponsors/example" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const result = inlinePackageLinks(context);

		assert.ok(result.includes("Home"));
		assert.ok(result.includes("Repo"));
		assert.ok(result.includes("Issues"));
		assert.ok(result.includes("Fund"));
	});

	it("includes proper styling classes", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const result = inlinePackageLinks(context);

		assert.ok(result.includes("mt-2"));
		assert.ok(result.includes("text-decoration-none"));
		assert.ok(result.includes("me-1"));
		assert.ok(result.includes('target="_blank"'));
		assert.ok(result.includes('rel="noopener noreferrer"'));
	});
});
