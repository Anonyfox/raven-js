/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dataset tests - surgical precision with 100% branch coverage
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Dataset, dataset } from "./dataset.js";

describe("Dataset", () => {
	describe("core functionality", () => {
		it("constructs with configurable key/URL functions and provides query operations", () => {
			// Empty dataset with defaults
			const empty = new Dataset();
			assert.equal(empty.length, 0);
			assert.equal(typeof empty.keyFn, "function");
			assert.equal(typeof empty.urlFn, "function");
			assert.equal(empty.isEmpty(), true);
			assert.equal(empty.first(), undefined);
			assert.equal(empty.last(), undefined);
			assert.deepEqual(empty.urls(), []);
			assert.deepEqual(empty.pluck("any"), []);

			// Dataset with default key detection (id, slug, key fallbacks)
			const posts = new Dataset([
				{ id: 1, title: "First" },
				{ slug: "second", title: "Second" },
				{ key: "third", title: "Third" },
			]);
			assert.equal(posts.length, 3);
			assert.equal(posts.keyFn(posts[0]), "1"); // id converted to string
			assert.equal(posts.keyFn(posts[1]), "second"); // slug used
			assert.equal(posts.keyFn(posts[2]), "third"); // key used
			assert.deepEqual(posts.urls(), ["/1", "/second", "/third"]);

			// Custom key and URL functions
			const products = new Dataset(
				[
					{ category: "tech", item: "laptop", name: "MacBook" },
					{ category: "books", item: "novel", name: "1984" },
				],
				{
					keyFn: (p) => `${p.category}/${p.item}`,
					urlFn: (p) => `/shop/${p.category}/${p.item}`,
				},
			);
			assert.equal(products.get("tech/laptop").name, "MacBook");
			assert.equal(products.get("nonexistent"), undefined);
			assert.deepEqual(products.urls(), [
				"/shop/tech/laptop",
				"/shop/books/novel",
			]);

			// Array inheritance and Symbol.species behavior
			assert.equal(posts.length, 3);
			assert.deepEqual(
				posts.map((p) => p.title),
				["First", "Second", "Third"],
			); // Returns plain array
			assert.deepEqual(
				posts.filter((p) => p.id === 1),
				[{ id: 1, title: "First" }],
			); // Returns plain array
			assert.equal(posts.find((p) => p.id === 1).title, "First");

			// Array destructuring and iteration
			const [first, second] = posts;
			assert.equal(first.id, 1);
			assert.equal(second.slug, "second");

			const titles = [];
			for (const post of posts) {
				titles.push(post.title);
			}
			assert.deepEqual(titles, ["First", "Second", "Third"]);

			// Utility methods
			assert.equal(posts.first().id, 1);
			assert.equal(posts.last().key, "third");
			assert.equal(posts.isEmpty(), false);
			assert.deepEqual(posts.pluck("title").sort(), [
				"First",
				"Second",
				"Third",
			]);
		});

		it("provides match/sort/paginate operations with method chaining", () => {
			const items = [
				{ category: "tech", name: "Laptop", price: 1000, active: true },
				{ category: "tech", name: "Phone", price: 500, active: false },
				{ category: "books", name: "Novel", price: 20, active: true },
				{ category: "tech", name: "Tablet", price: 300, active: true },
				{ category: "books", name: "Guide", price: 15, active: null },
			];
			const ds = new Dataset(items);

			// Single property matching
			const tech = ds.match({ category: "tech" });
			assert.equal(tech.length, 3);
			assert.ok(tech instanceof Dataset);
			assert.equal(tech.keyFn, ds.keyFn); // Functions preserved

			// Multiple property matching
			const activeTech = ds.match({ category: "tech", active: true });
			assert.equal(activeTech.length, 2);

			// Falsy value matching (including null, false, 0)
			const inactive = ds.match({ active: false });
			assert.equal(inactive.length, 1);
			assert.equal(inactive[0].name, "Phone");

			const nullActive = ds.match({ active: null });
			assert.equal(nullActive.length, 1);
			assert.equal(nullActive[0].name, "Guide");

			// Empty match results
			const nonexistent = ds.match({ category: "nonexistent" });
			assert.equal(nonexistent.length, 0);
			assert.ok(nonexistent instanceof Dataset);

			// Sorting by field name
			const byName = ds.sortBy("name");
			assert.equal(byName[0].name, "Guide");
			assert.equal(byName[4].name, "Tablet");
			assert.ok(byName instanceof Dataset);
			assert.equal(byName.keyFn, ds.keyFn); // Functions preserved

			// Sorting by custom function
			const byPriceDesc = ds.sortBy((a, b) => b.price - a.price);
			assert.equal(byPriceDesc[0].price, 1000);
			assert.equal(byPriceDesc[4].price, 15);

			// Sorting with equal values (tests return 0 branch)
			const equalItems = new Dataset([
				{ name: "Alice", score: 100 },
				{ name: "Bob", score: 100 },
				{ name: "Charlie", score: 100 },
			]);
			const sortedEqual = equalItems.sortBy("score");
			assert.equal(sortedEqual.length, 3);
			assert.equal(sortedEqual[0].name, "Alice"); // Order preserved

			// Sorting with Date objects
			const dateItems = new Dataset([
				{ date: new Date("2024-01-02") },
				{ date: new Date("2024-01-01") },
				{ date: new Date("2024-01-03") },
			]);
			const sortedDates = dateItems.sortBy("date");
			assert.equal(sortedDates[0].date.getDate(), 1);
			assert.equal(sortedDates[2].date.getDate(), 3);

			// Pagination
			const page1 = ds.paginate(1, 2);
			assert.equal(page1.length, 2);
			assert.equal(page1[0].name, "Laptop");
			assert.ok(page1 instanceof Dataset);
			assert.equal(page1.keyFn, ds.keyFn); // Functions preserved

			const page2 = ds.paginate(2, 2);
			assert.equal(page2.length, 2);
			assert.equal(page2[0].name, "Novel");

			// Last page with fewer items
			const lastPage = ds.paginate(3, 2);
			assert.equal(lastPage.length, 1);
			assert.equal(lastPage[0].name, "Guide");

			// Page beyond range
			const beyondRange = ds.paginate(10, 2);
			assert.equal(beyondRange.length, 0);
			assert.ok(beyondRange instanceof Dataset);

			// Method chaining
			const chainResult = ds
				.match({ category: "tech" })
				.sortBy((a, b) => b.price - a.price)
				.paginate(1, 2);
			assert.equal(chainResult.length, 2);
			assert.equal(chainResult[0].name, "Laptop");
			assert.equal(chainResult[1].name, "Phone");
			assert.ok(chainResult instanceof Dataset);

			// Original dataset unchanged
			assert.equal(ds.length, 5);
			assert.equal(ds[0].name, "Laptop");
		});

		it("supports reconfiguration with using() and factory function", () => {
			const posts = new Dataset([{ slug: "post-1", date: "2024-01-01" }]);

			// Reconfigure key function
			const byDate = posts.using({
				keyFn: (item) => item.date,
			});
			assert.equal(byDate.get("2024-01-01").slug, "post-1");
			assert.notEqual(byDate.keyFn, posts.keyFn);
			assert.equal(byDate.urlFn, posts.urlFn); // URL function preserved

			// Reconfigure URL function
			const withArchiveUrls = posts.using({
				urlFn: (item) => `/archive/${item.date}/${item.slug}`,
			});
			assert.deepEqual(withArchiveUrls.urls(), ["/archive/2024-01-01/post-1"]);
			assert.equal(withArchiveUrls.keyFn, posts.keyFn); // Key function preserved

			// Reconfigure both functions
			const customBoth = posts.using({
				keyFn: (item) => `custom-${item.slug}`,
				urlFn: (item) => `/new/${item.slug}`,
			});
			assert.equal(customBoth.get("custom-post-1").slug, "post-1");
			assert.deepEqual(customBoth.urls(), ["/new/post-1"]);

			// Original dataset unchanged
			assert.equal(posts.get("post-1").slug, "post-1");
			assert.deepEqual(posts.urls(), ["/post-1"]);

			// Factory function
			const factoryDs = dataset([{ id: 1, name: "test" }]);
			assert.ok(factoryDs instanceof Dataset);
			assert.equal(factoryDs.length, 1);

			// Factory with options
			const factoryWithOptions = dataset(
				[{ category: "tech", item: "laptop" }],
				{
					keyFn: (item) => `${item.category}/${item.item}`,
				},
			);
			assert.equal(factoryWithOptions.get("tech/laptop").item, "laptop");

			// Pluck with unique values and undefined handling
			const mixedItems = new Dataset([
				{ category: "tech" },
				{ category: "books" },
				{ category: "tech" }, // duplicate
				{ category: undefined },
				{ category: "books" }, // duplicate
			]);
			const categories = mixedItems.pluck("category");
			assert.equal(categories.length, 3); // unique values only
			assert.ok(categories.includes("tech"));
			assert.ok(categories.includes("books"));
			assert.ok(categories.includes(undefined));
		});
	});

	describe("edge cases and errors", () => {
		it("handles boundary conditions and error states", () => {
			// No key function provided and no default key properties
			const noKeyItems = [{ title: "No Key" }];
			const noKeyDs = new Dataset(noKeyItems);
			assert.throws(
				() => noKeyDs.keyFn(noKeyItems[0]),
				/No key function provided and item has no id, slug, or key property/,
			);

			// Non-array constructor input (tests else branch)
			const singleItem = new Dataset("single-item");
			assert.equal(singleItem.length, 1);
			assert.equal(singleItem[0], "single-item");

			// Numeric keys converted to strings
			const numericKeys = new Dataset([{ id: 123, name: "Test" }]);
			assert.equal(numericKeys.get("123").name, "Test");

			// Null/undefined items (defensive behavior)
			const nullDs = new Dataset();
			nullDs.push(null);
			assert.throws(() => nullDs.keyFn(null));

			// Items with null/undefined properties in match
			const nullProps = new Dataset([
				{ name: "Test", category: null },
				{ name: "Test2", category: "tech" },
			]);
			const nullMatches = nullProps.match({ category: null });
			assert.equal(nullMatches.length, 1);
			assert.equal(nullMatches[0].name, "Test");

			// Empty array handling in all operations
			const empty = new Dataset([]);
			assert.equal(empty.length, 0);
			assert.equal(empty.get("anything"), undefined);
			assert.deepEqual(empty.urls(), []);
			assert.equal(empty.match({ any: "thing" }).length, 0);
			assert.equal(empty.first(), undefined);
			assert.equal(empty.last(), undefined);
			assert.equal(empty.isEmpty(), true);
			assert.deepEqual(empty.pluck("field"), []);

			// Large dataset pagination edge cases
			const large = new Dataset(
				Array.from({ length: 25 }, (_, i) => ({ id: i + 1 })),
			);

			// Default pagination (page 1, size 10)
			const defaultPage = large.paginate();
			assert.equal(defaultPage.length, 10);
			assert.equal(defaultPage[0].id, 1);
			assert.equal(defaultPage[9].id, 10);

			// Custom page size
			const customSize = large.paginate(2, 5);
			assert.equal(customSize.length, 5);
			assert.equal(customSize[0].id, 6);
			assert.equal(customSize[4].id, 10);

			// Last page with fewer items
			const partialLast = new Dataset(
				Array.from({ length: 23 }, (_, i) => ({ id: i + 1 })),
			);
			const lastPartial = partialLast.paginate(3, 10);
			assert.equal(lastPartial.length, 3);
			assert.equal(lastPartial[0].id, 21);
			assert.equal(lastPartial[2].id, 23);
		});
	});

	describe("integration scenarios", () => {
		it("demonstrates real-world usage patterns with type safety", () => {
			// Blog posts with slug-based routing
			const blogPosts = new Dataset(
				[
					{
						slug: "getting-started",
						title: "Getting Started",
						tags: ["tutorial", "intro"],
						publishDate: new Date("2024-01-15"),
					},
					{
						slug: "advanced-patterns",
						title: "Advanced Patterns",
						tags: ["advanced", "patterns"],
						publishDate: new Date("2024-01-20"),
					},
					{
						slug: "performance-tips",
						title: "Performance Tips",
						tags: ["performance", "optimization"],
						publishDate: new Date("2024-01-25"),
					},
				],
				{
					keyFn: (post) => post.slug,
					urlFn: (post) => `/blog/${post.slug}`,
				},
			);

			// Single post retrieval
			const post = blogPosts.get("getting-started");
			assert.equal(post.title, "Getting Started");

			// Date-based filtering with sorting
			const recentPosts = blogPosts
				.filter((post) => post.publishDate >= new Date("2024-01-20"))
				.sort((a, b) => b.publishDate - a.publishDate);
			assert.equal(recentPosts.length, 2); // advanced-patterns and performance-tips

			// URL generation for static site building
			const allUrls = blogPosts.urls();
			assert.deepEqual(allUrls, [
				"/blog/getting-started",
				"/blog/advanced-patterns",
				"/blog/performance-tips",
			]);

			// E-commerce products with composite keys
			const products = new Dataset(
				[
					{
						category: "electronics",
						item: "laptop",
						name: "MacBook Pro",
						price: 2000,
					},
					{
						category: "electronics",
						item: "phone",
						name: "iPhone",
						price: 1000,
					},
					{ category: "books", item: "novel", name: "1984", price: 15 },
					{ category: "books", item: "guide", name: "JS Guide", price: 30 },
				],
				{
					keyFn: (p) => `${p.category}/${p.item}`,
					urlFn: (p) => `/shop/${p.category}/${p.item}`,
				},
			);

			// Category filtering and price sorting
			const electronics = products
				.match({ category: "electronics" })
				.sortBy((a, b) => b.price - a.price);
			assert.equal(electronics.length, 2);
			assert.equal(electronics[0].name, "MacBook Pro");

			// Composite key retrieval
			const laptop = products.get("electronics/laptop");
			assert.equal(laptop.name, "MacBook Pro");

			// Multi-configuration for different URL schemes
			const seoUrls = products.using({
				urlFn: (p) => `/products/${p.name.toLowerCase().replace(/\s+/g, "-")}`,
			});
			const seoUrlList = seoUrls.urls();
			assert.ok(seoUrlList.includes("/products/macbook-pro"));

			// Archive URLs by date
			const archiveUrls = blogPosts.using({
				keyFn: (p) => p.publishDate.toISOString().split("T")[0],
				urlFn: (p) => `/archive/${p.publishDate.getFullYear()}/${p.slug}`,
			});
			const datePost = archiveUrls.get("2024-01-15");
			assert.equal(datePost.slug, "getting-started");

			// Tag extraction for navigation
			const allTags = blogPosts.pluck("tags").flat();
			const uniqueTags = [...new Set(allTags)];
			assert.ok(uniqueTags.includes("tutorial"));
			assert.ok(uniqueTags.includes("performance"));

			// Price range analysis
			const prices = products.pluck("price");
			const maxPrice = Math.max(...prices);
			const minPrice = Math.min(...prices);
			assert.equal(maxPrice, 2000);
			assert.equal(minPrice, 15);

			// Pagination for large collections
			const paginatedProducts = products.sortBy("price").paginate(1, 2);
			assert.equal(paginatedProducts.length, 2);
			assert.equal(paginatedProducts[0].price, 15); // Cheapest first
		});
	});
});
