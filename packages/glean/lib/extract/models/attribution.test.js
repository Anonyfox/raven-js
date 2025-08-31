/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for AttributionContext - 100% coverage validation
 *
 * Ravens test attribution intelligence with surgical precision.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	AttributionContext,
	createEntityAttribution,
	createModuleAttribution,
} from "./attribution.js";
import { JSDocAuthorTag } from "./jsdoc/author-tag.js";
import { JSDocSeeTag } from "./jsdoc/see-tag.js";

describe("AttributionContext construction and properties", () => {
	it("creates empty context with no attribution data", () => {
		const context = new AttributionContext([], [], null);

		assert.strictEqual(context.hasAttribution, false);
		assert.strictEqual(context.hasAuthors, false);
		assert.strictEqual(context.hasLinks, false);
		assert.strictEqual(context.hasPackageMeta, false);
		assert.strictEqual(context.primaryAuthor, null);
		assert.strictEqual(context.contributors.length, 0);
		assert.strictEqual(context.seeTags.length, 0);
	});

	it("creates context with single author tag", () => {
		const authorTag = new JSDocAuthorTag("John Doe <john@example.com>");
		const context = new AttributionContext([authorTag], [], null);

		assert.strictEqual(context.hasAttribution, true);
		assert.strictEqual(context.hasAuthors, true);
		assert.strictEqual(context.hasLinks, false);
		assert.strictEqual(context.hasPackageMeta, false);
		assert.strictEqual(context.primaryAuthor, authorTag);
		assert.strictEqual(context.contributors.length, 0);
	});

	it("creates context with multiple author tags", () => {
		const author1 = new JSDocAuthorTag("John Doe <john@example.com>");
		const author2 = new JSDocAuthorTag("Jane Smith <jane@example.com>");
		const context = new AttributionContext([author1, author2], [], null);

		assert.strictEqual(context.hasAttribution, true);
		assert.strictEqual(context.hasAuthors, true);
		assert.strictEqual(context.primaryAuthor, author1);
		assert.strictEqual(context.contributors.length, 1);
		assert.strictEqual(context.contributors[0], author2);
	});

	it("creates context with see tags only", () => {
		const seeTag = new JSDocSeeTag("https://example.com");
		const context = new AttributionContext([], [seeTag], null);

		assert.strictEqual(context.hasAttribution, true);
		assert.strictEqual(context.hasAuthors, false);
		assert.strictEqual(context.hasLinks, true);
		assert.strictEqual(context.seeTags.length, 1);
	});

	it("creates context with package metadata only", () => {
		const packageMeta = {
			homepage: "https://example.com",
			repository: { url: "https://github.com/example/repo" },
		};
		const context = new AttributionContext([], [], packageMeta);

		assert.strictEqual(context.hasAttribution, true);
		assert.strictEqual(context.hasAuthors, false);
		assert.strictEqual(context.hasLinks, false);
		assert.strictEqual(context.hasPackageMeta, true);
	});

	it("handles non-array inputs gracefully", () => {
		const context = new AttributionContext(null, undefined, null);

		assert.strictEqual(context.hasAttribution, false);
		assert.strictEqual(context.authorTags.length, 0);
		assert.strictEqual(context.seeTags.length, 0);
	});
});

describe("AttributionContext getPrimaryAuthor method", () => {
	it("returns null when no primary author", () => {
		const context = new AttributionContext([], [], null);
		const primary = context.getPrimaryAuthor();

		assert.strictEqual(primary, null);
	});

	it("returns parsed primary author with email", () => {
		const authorTag = new JSDocAuthorTag("John Doe <john@example.com>");
		const context = new AttributionContext([authorTag], [], null);
		const primary = context.getPrimaryAuthor();

		assert.strictEqual(primary.name, "John Doe");
		assert.strictEqual(primary.email, "john@example.com");
		assert.strictEqual(primary.hasEmail, true);
		assert.strictEqual(primary.authorInfo, "John Doe <john@example.com>");
	});

	it("returns parsed primary author without email", () => {
		const authorTag = new JSDocAuthorTag("Jane Smith");
		const context = new AttributionContext([authorTag], [], null);
		const primary = context.getPrimaryAuthor();

		assert.strictEqual(primary.name, "Jane Smith");
		assert.strictEqual(primary.email, "");
		assert.strictEqual(primary.hasEmail, false);
		assert.strictEqual(primary.authorInfo, "Jane Smith");
	});
});

describe("AttributionContext getContributors method", () => {
	it("returns empty array when no contributors", () => {
		const context = new AttributionContext([], [], null);
		const contributors = context.getContributors();

		assert.strictEqual(contributors.length, 0);
	});

	it("returns parsed contributors array", () => {
		const author1 = new JSDocAuthorTag("John Doe <john@example.com>");
		const author2 = new JSDocAuthorTag("Jane Smith");
		const author3 = new JSDocAuthorTag("Bob Wilson <bob@example.com>");
		const context = new AttributionContext(
			[author1, author2, author3],
			[],
			null,
		);

		const contributors = context.getContributors();

		assert.strictEqual(contributors.length, 2);
		assert.strictEqual(contributors[0].name, "Jane Smith");
		assert.strictEqual(contributors[0].hasEmail, false);
		assert.strictEqual(contributors[1].name, "Bob Wilson");
		assert.strictEqual(contributors[1].hasEmail, true);
	});
});

describe("AttributionContext getSeeLinks method", () => {
	it("returns empty groups when no see tags", () => {
		const context = new AttributionContext([], [], null);
		const links = context.getSeeLinks();

		assert.strictEqual(links.links.length, 0);
		assert.strictEqual(links.urls.length, 0);
		assert.strictEqual(links.symbols.length, 0);
		assert.strictEqual(links.modules.length, 0);
		assert.strictEqual(links.text.length, 0);
	});

	it("groups see tags by reference type", () => {
		const linkTag = new JSDocSeeTag("{@link https://example.com|Example}");
		const urlTag = new JSDocSeeTag("https://github.com/example/repo");
		const symbolTag = new JSDocSeeTag("SomeFunction");
		const moduleTag = new JSDocSeeTag("module:someModule");

		const context = new AttributionContext(
			[],
			[linkTag, urlTag, symbolTag, moduleTag],
			null,
		);
		const grouped = context.getSeeLinks();

		assert.strictEqual(grouped.links.length, 1);
		assert.strictEqual(grouped.links[0].reference, "https://example.com");
		assert.strictEqual(grouped.links[0].description, "Example");

		assert.strictEqual(grouped.urls.length, 1);
		assert.strictEqual(
			grouped.urls[0].reference,
			"https://github.com/example/repo",
		);

		assert.strictEqual(grouped.symbols.length, 1);
		assert.strictEqual(grouped.symbols[0].reference, "SomeFunction");

		assert.strictEqual(grouped.modules.length, 1);
		assert.strictEqual(grouped.modules[0].reference, "module:someModule");
	});
});

describe("AttributionContext getPackageMetadata method", () => {
	it("returns null when no package metadata", () => {
		const context = new AttributionContext([], [], null);
		const packageMeta = context.getPackageMetadata();

		assert.strictEqual(packageMeta, null);
	});

	it("returns parsed package metadata with boolean flags", () => {
		const packageMeta = {
			homepage: "https://example.com",
			repository: { url: "https://github.com/example/repo" },
			bugs: { url: "https://github.com/example/repo/issues" },
			funding: { url: "https://github.com/sponsors/example" },
		};
		const context = new AttributionContext([], [], packageMeta);
		const parsed = context.getPackageMetadata();

		assert.strictEqual(parsed.homepage, "https://example.com");
		assert.strictEqual(parsed.repository, "https://github.com/example/repo");
		assert.strictEqual(parsed.bugs, "https://github.com/example/repo/issues");
		assert.strictEqual(parsed.funding, "https://github.com/sponsors/example");
		assert.strictEqual(parsed.hasHomepage, true);
		assert.strictEqual(parsed.hasRepository, true);
		assert.strictEqual(parsed.hasBugs, true);
		assert.strictEqual(parsed.hasFunding, true);
		assert.strictEqual(parsed.hasAnyLink, true);
	});

	it("handles partial package metadata", () => {
		const packageMeta = { homepage: "https://example.com" };
		const context = new AttributionContext([], [], packageMeta);
		const parsed = context.getPackageMetadata();

		assert.strictEqual(parsed.hasHomepage, true);
		assert.strictEqual(parsed.hasRepository, false);
		assert.strictEqual(parsed.hasBugs, false);
		assert.strictEqual(parsed.hasFunding, false);
		assert.strictEqual(parsed.hasAnyLink, true);
	});

	it("handles empty package metadata", () => {
		const context = new AttributionContext([], [], {});
		const parsed = context.getPackageMetadata();

		assert.strictEqual(parsed.hasAnyLink, false);
	});
});

describe("createEntityAttribution function", () => {
	it("creates attribution from entity with JSDoc tags", () => {
		const mockEntity = {
			getJSDocTagsByType: (type) => {
				if (type === "author") {
					return [new JSDocAuthorTag("Test Author <test@example.com>")];
				}
				if (type === "see") {
					return [new JSDocSeeTag("https://example.com")];
				}
				return [];
			},
		};

		const packageMeta = { homepage: "https://package.example.com" };
		const context = createEntityAttribution(mockEntity, packageMeta);

		assert.strictEqual(context.hasAttribution, true);
		assert.strictEqual(context.hasAuthors, true);
		assert.strictEqual(context.hasLinks, true);
		assert.strictEqual(context.hasPackageMeta, true);
	});

	it("handles entity with no JSDoc tags", () => {
		const mockEntity = {
			getJSDocTagsByType: () => [],
		};

		const context = createEntityAttribution(mockEntity);

		assert.strictEqual(context.hasAttribution, false);
		assert.strictEqual(context.hasAuthors, false);
		assert.strictEqual(context.hasLinks, false);
	});
});

describe("createModuleAttribution function", () => {
	it("aggregates authors from multiple entities", () => {
		const mockEntity1 = {
			getJSDocTagsByType: (type) => {
				if (type === "author") {
					return [new JSDocAuthorTag("Author A <a@example.com>")];
				}
				return [];
			},
		};

		const mockEntity2 = {
			getJSDocTagsByType: (type) => {
				if (type === "author") {
					return [
						new JSDocAuthorTag("Author A <a@example.com>"),
						new JSDocAuthorTag("Author B <b@example.com>"),
					];
				}
				return [];
			},
		};

		const context = createModuleAttribution([mockEntity1, mockEntity2]);

		assert.strictEqual(context.hasAttribution, true);
		assert.strictEqual(context.hasAuthors, true);
		assert.strictEqual(context.authorTags.length, 2);
		// Author A should be first (2 contributions vs 1 for Author B)
		assert.strictEqual(
			context.primaryAuthor.authorInfo,
			"Author A <a@example.com>",
		);
	});

	it("handles empty entities array", () => {
		const context = createModuleAttribution([]);

		assert.strictEqual(context.hasAttribution, false);
		assert.strictEqual(context.hasAuthors, false);
	});

	it("collects all see tags from entities", () => {
		const mockEntity1 = {
			getJSDocTagsByType: (type) => {
				if (type === "see") {
					return [new JSDocSeeTag("https://example1.com")];
				}
				return [];
			},
		};

		const mockEntity2 = {
			getJSDocTagsByType: (type) => {
				if (type === "see") {
					return [new JSDocSeeTag("https://example2.com")];
				}
				return [];
			},
		};

		const context = createModuleAttribution([mockEntity1, mockEntity2]);

		assert.strictEqual(context.hasLinks, true);
		assert.strictEqual(context.seeTags.length, 2);
	});
});
