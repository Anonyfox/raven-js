/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Template inlining tests - validate correctness, edge cases, and complex integration scenarios
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { inline } from "./inline.js";

// Mock html2 function for testing
function html2(strings, ...values) {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += (values[i] == null ? "" : String(values[i])) + strings[i + 1];
	}
	return result;
}

// Test data generator similar to benchmark data
function generateTestData() {
	return {
		site: {
			name: "DevBlog",
			description: "A comprehensive blog about modern web development",
			url: "https://devblog.example.com",
			author: "DevBlog Team",
			year: 2024,
			navigation: [
				{ name: "Home", url: "/" },
				{ name: "Blog", url: "/blog" },
				{ name: "About", url: "/about" },
				{ name: "Contact", url: "/contact" },
			],
			social: {
				twitter: "@devblog",
				github: "devblog/blog",
				linkedin: "company/devblog",
			},
		},
		posts: [
			{
				id: 1,
				title: "Understanding Modern Web Development",
				slug: "understanding-modern-web-development",
				content:
					"In today's rapidly evolving digital landscape, developers face unprecedented challenges in building robust, scalable applications.\n\nThe emergence of new technologies and frameworks has fundamentally changed how we approach software development.",
				excerpt:
					"In today's rapidly evolving digital landscape, developers face unprecedented challenges in building robust, scalable applications.",
				author: {
					name: "Alex Johnson",
					email: "alex@example.com",
					bio: "Senior full-stack developer",
				},
				category: "Web Development",
				tags: ["javascript", "react", "nodejs", "performance", "api"],
				publishedAt: "2024-01-15T10:00:00Z",
				readTime: 8,
				views: 2847,
				likes: 142,
				comments: 23,
				featured: true,
			},
			{
				id: 2,
				title: "The Future of JavaScript Frameworks",
				slug: "future-of-javascript-frameworks",
				content:
					"Performance optimization remains a critical concern for modern applications, especially as user expectations continue to rise.",
				excerpt:
					"Performance optimization remains a critical concern for modern applications.",
				author: {
					name: "Sarah Chen",
					email: "sarah@example.com",
					bio: "Frontend specialist and UX advocate",
				},
				category: "JavaScript",
				tags: ["javascript", "frameworks", "performance", "testing"],
				publishedAt: "2024-01-10T14:30:00Z",
				readTime: 12,
				views: 1932,
				likes: 89,
				comments: 17,
				featured: false,
			},
		],
		featuredPosts: [
			{
				id: 1,
				title: "Understanding Modern Web Development",
				slug: "understanding-modern-web-development",
				excerpt:
					"In today's rapidly evolving digital landscape, developers face unprecedented challenges in building robust, scalable applications.",
				author: { name: "Alex Johnson", bio: "Senior full-stack developer" },
				readTime: 8,
				views: 2847,
			},
		],
		totalPosts: 2,
		categories: ["Web Development", "JavaScript"],
		popularTags: [
			{ name: "javascript", count: 2 },
			{ name: "performance", count: 2 },
			{ name: "react", count: 1 },
			{ name: "nodejs", count: 1 },
		],
		currentPage: 1,
		totalPages: 1,
		hasNextPage: false,
		hasPrevPage: false,
		searchQuery: "",
		selectedCategory: "",
		sortBy: "publishedAt",
		userPreferences: {
			theme: "light",
			compactView: false,
		},
		analytics: {
			totalViews: 4779,
			totalLikes: 231,
			avgReadTime: 10,
		},
		recentActivity: [
			{
				type: "published",
				post: {
					title: "Understanding Modern Web Development",
					slug: "understanding-modern-web-development",
				},
				timestamp: "2024-01-15T10:00:00Z",
			},
		],
	};
}

// Fallback detection infrastructure
let fallbackWarnings = [];

// Hook console.warn to detect fallbacks
const originalWarn = console.warn;
console.warn = (...args) => {
	fallbackWarnings.push(args.join(" "));
	originalWarn(...args);
};

function resetFallbackDetection() {
	fallbackWarnings = [];
}

function assertNoFallbacks(testName) {
	const inliningFailures = fallbackWarnings.filter(
		(msg) =>
			msg.includes("Template inlining failed") ||
			msg.includes("using original function"),
	);

	assert.strictEqual(
		inliningFailures.length,
		0,
		`${testName} triggered ${inliningFailures.length} fallback(s): ${inliningFailures.join("; ")}`,
	);
}

describe("inline - Basic Template Literal Inlining", () => {
	it("should return original function when no tagged templates found", () => {
		resetFallbackDetection();
		const original = (data) => {
			return data.title;
		};

		const optimized = inline(original);
		assert.strictEqual(typeof optimized, "function");

		const result = optimized({ title: "Test" });
		assert.strictEqual(result, "Test");
		assertNoFallbacks("no tagged templates");
	});

	it("should inline simple static template", () => {
		resetFallbackDetection();
		const original = () => {
			const header = html2`<h1>Hello World</h1>`;
			return header;
		};

		const optimized = inline(original);
		const result = optimized();

		// Should produce same result as original
		const expected = original();
		assert.strictEqual(result, expected);
		assert.strictEqual(result, "<h1>Hello World</h1>");
		assertNoFallbacks("simple static template");
	});

	it("should inline template with simple interpolation", () => {
		resetFallbackDetection();
		const original = (data) => {
			const greeting = html2`<h1>Hello ${data.name}!</h1>`;
			return greeting;
		};

		const optimized = inline(original);
		const testData = { name: "Alice" };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assert.strictEqual(result, "<h1>Hello Alice!</h1>");
		assertNoFallbacks("simple interpolation");
	});

	it("should inline multiple nested templates", () => {
		resetFallbackDetection();
		const original = (data) => {
			const header = html2`<h1>${data.title}</h1>`;
			const content = html2`<div>${data.content}</div>`;
			return html2`<article>${header}${content}</article>`;
		};

		const optimized = inline(original);
		const testData = {
			title: "Test Article",
			content: "Some content here",
		};

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assertNoFallbacks("multiple nested templates");
	});

	it("should handle templates with complex expressions", () => {
		resetFallbackDetection();
		const original = (data) => {
			return html2`<div class="${data.active ? "active" : "inactive"}">${data.count > 0 ? data.count : "none"}</div>`;
		};

		const optimized = inline(original);
		const testData = { active: true, count: 5 };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assertNoFallbacks("complex expressions");
	});

	it("should not break on backticks in strings", () => {
		resetFallbackDetection();
		const original = () => {
			const message = "This is a `test` string";
			return html2`<div>${message}</div>`;
		};

		const optimized = inline(original);
		const result = optimized();
		const expected = original();

		assert.strictEqual(result, expected);
		assertNoFallbacks("backticks in strings");
	});

	it("should handle escaped characters in templates", () => {
		resetFallbackDetection();
		const original = (data) => {
			return html2`<div>Price: \$${data.price}</div>`;
		};

		const optimized = inline(original);
		const testData = { price: "19.99" };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assertNoFallbacks("escaped characters");
	});

	it("should handle nested braces in expressions", () => {
		resetFallbackDetection();
		const original = (data) => {
			return html2`<ul>${data.items.map((item) => html2`<li>${item.name}</li>`)}</ul>`;
		};

		const optimized = inline(original);
		const testData = {
			items: [{ name: "Item 1" }, { name: "Item 2" }],
		};

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assertNoFallbacks("nested braces");
	});

	it("should preserve function parameters correctly", () => {
		resetFallbackDetection();
		const original = ({ title, description }) => {
			return html2`<div title="${title}">${description}</div>`;
		};

		const optimized = inline(original);
		const result = optimized({ title: "Test", description: "Content" });
		const expected = original({ title: "Test", description: "Content" });

		assert.strictEqual(result, expected);
		assertNoFallbacks("parameter preservation");
	});

	it("should work with arrow functions", () => {
		resetFallbackDetection();
		const original = (data) => html2`<span>${data.value}</span>`;

		const optimized = inline(original);
		const testData = { value: "test" };

		const result = optimized(testData);
		const expected = original(testData);

		assert.strictEqual(result, expected);
		assertNoFallbacks("arrow functions");
	});

	it("should handle empty templates", () => {
		resetFallbackDetection();
		const original = () => {
			const empty = html2``;
			return html2`<div>${empty}</div>`;
		};

		const optimized = inline(original);
		const result = optimized();
		const expected = original();

		assert.strictEqual(result, expected);
		assertNoFallbacks("empty templates");
	});
});

describe("inline - Complex Integration Tests from Benchmark", () => {
	it("should inline complex PostCard component without fallbacks", () => {
		resetFallbackDetection();

		// Extracted from beak2-compiled.js benchmark - PostCard component
		const PostCard = ({ post, compactView = false }) => {
			const publishedDate = new Date(post.publishedAt);
			const isRecent =
				Date.now() - publishedDate.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
			const readTimeCategory =
				post.readTime <= 3 ? "quick" : post.readTime <= 7 ? "medium" : "long";

			return html2`
				<article
					class="post-card ${post.featured ? "featured" : ""} ${compactView ? "compact" : ""}"
					data-category="${post.category}"
					data-read-time="${readTimeCategory}"
				>
					<header class="post-header">
						<div class="post-badges">
							${post.featured ? html2`<span class="badge featured">Featured</span>` : ""}
							${isRecent ? html2`<span class="badge new">New</span>` : ""}
							<span class="badge category">${post.category}</span>
						</div>
						<h3 class="post-title">
							<a href="/blog/${post.slug}" class="post-link">
								${post.title}
							</a>
						</h3>
						<div class="post-meta">
							<div class="author-info">
								<img
									src="https://via.placeholder.com/32x32?text=${post.author.name
										.split(" ")
										.map((n) => n[0])
										.join("")}"
									alt="${post.author.name}"
									class="author-avatar"
									width="32"
									height="32"
								/>
								<div class="author-details">
									<span class="author-name">${post.author.name}</span>
									<span class="author-bio">${post.author.bio}</span>
								</div>
							</div>
							<div class="post-timing">
								<time
									datetime="${publishedDate.toISOString()}"
									class="publish-date"
									title="Published on ${publishedDate.toLocaleDateString()}"
								>
									${publishedDate.toLocaleDateString()}
								</time>
								<span class="read-time" title="Estimated reading time">
									📖 ${post.readTime} min read
								</span>
							</div>
						</div>
					</header>

					${
						!compactView
							? html2`
								<div class="post-content">
									<p class="post-excerpt">${post.excerpt}</p>
									${
										post.content.length > 500
											? html2`
												<details class="content-preview">
													<summary>Read more...</summary>
													<div class="full-content">
														${post.content
															.split("\\n\\n")
															.map((paragraph) => html2`<p>${paragraph}</p>`)}
													</div>
												</details>
										  `
											: ""
									}
								</div>
						  `
							: ""
					}

					<div class="post-tags">
						${post.tags.map(
							(tag) => html2`
								<a href="/blog/tag/${encodeURIComponent(tag)}" class="tag">
									#${tag}
								</a>
							`,
						)}
					</div>

					<footer class="post-stats">
						<div class="engagement-stats">
							<span class="stat views" title="${post.views.toLocaleString()} views">
								👁️ ${post.views > 1000 ? `${Math.round(post.views / 1000)}k` : post.views}
							</span>
							<span class="stat likes" title="${post.likes.toLocaleString()} likes">
								❤️ ${post.likes > 1000 ? `${Math.round(post.likes / 1000)}k` : post.likes}
							</span>
							<span
								class="stat comments"
								title="${post.comments.toLocaleString()} comments"
							>
								💬 ${post.comments}
							</span>
						</div>
						<div class="post-actions">
							<button class="action-btn bookmark" title="Bookmark this post">
								🔖 Save
							</button>
							<button class="action-btn share" title="Share this post">
								🔗 Share
							</button>
						</div>
					</footer>
				</article>
			`;
		};

		const optimizedPostCard = inline(PostCard);
		const testData = generateTestData();
		const testPost = testData.posts[0];

		const result = optimizedPostCard({ post: testPost, compactView: false });
		const expected = PostCard({ post: testPost, compactView: false });

		assert.strictEqual(result, expected);
		assert.ok(result.includes(testPost.title), "Should contain post title");
		assert.ok(
			result.includes(testPost.author.name),
			"Should contain author name",
		);
		assert.ok(
			result.includes('class="post-card featured'),
			"Should mark featured posts",
		);

		assertNoFallbacks("complex PostCard component");
	});

	it("should inline complex PaginationControls component without fallbacks", () => {
		resetFallbackDetection();

		// Extracted from beak2-compiled.js benchmark - PaginationControls component
		const PaginationControls = ({
			currentPage,
			totalPages,
			hasNextPage,
			hasPrevPage,
		}) => {
			const generatePageNumbers = () => {
				const pages = [];
				const showPages = 5;
				let start = Math.max(1, currentPage - Math.floor(showPages / 2));
				const end = Math.min(totalPages, start + showPages - 1);

				if (end - start + 1 < showPages) {
					start = Math.max(1, end - showPages + 1);
				}

				for (let i = start; i <= end; i++) {
					pages.push(i);
				}
				return pages;
			};

			return html2`
			<nav class="pagination" role="navigation" aria-label="Pagination">
				<div class="pagination-info">
					<span>
						Page ${currentPage} of ${totalPages} (${totalPages * 10} total posts)
					</span>
				</div>
				<div class="pagination-controls">
					${
						hasPrevPage
							? html2`
								<a
									href="/blog?page=1"
									class="page-link first"
									aria-label="Go to first page"
								>
									« First
								</a>
								<a
									href="/blog?page=${currentPage - 1}"
									class="page-link prev"
									aria-label="Go to previous page"
								>
									‹ Previous
								</a>
						  `
							: html2`
								<span class="page-link disabled">« First</span>
								<span class="page-link disabled">‹ Previous</span>
						  `
					}

					${generatePageNumbers().map(
						(pageNum) => html2`
							<a
								href="/blog?page=${pageNum}"
								class="page-link ${pageNum === currentPage ? "current" : ""}"
								${pageNum === currentPage ? 'aria-current="page"' : ""}
							>
								${pageNum}
							</a>
						`,
					)}

					${
						hasNextPage
							? html2`
								<a
									href="/blog?page=${currentPage + 1}"
									class="page-link next"
									aria-label="Go to next page"
								>
									Next ›
								</a>
								<a
									href="/blog?page=${totalPages}"
									class="page-link last"
									aria-label="Go to last page"
								>
									Last »
								</a>
						  `
							: html2`
								<span class="page-link disabled">Next ›</span>
								<span class="page-link disabled">Last »</span>
						  `
					}
				</div>
			</nav>
		`;
		};

		const optimizedPaginationControls = inline(PaginationControls);
		const paginationData = {
			currentPage: 2,
			totalPages: 5,
			hasNextPage: true,
			hasPrevPage: true,
		};

		const result = optimizedPaginationControls(paginationData);
		const expected = PaginationControls(paginationData);

		assert.strictEqual(result, expected);
		assert.ok(result.includes("Page 2 of 5"), "Should show current page info");
		assert.ok(
			result.includes('href="/blog?page=1"'),
			"Should have first page link",
		);
		assert.ok(
			result.includes('href="/blog?page=3"'),
			"Should have next page link",
		);

		assertNoFallbacks("complex PaginationControls component");
	});

	it("should inline AnalyticsDashboard component without fallbacks", () => {
		resetFallbackDetection();

		// Extracted from beak2-compiled.js benchmark - AnalyticsDashboard component
		const AnalyticsDashboard = ({ analytics, totalPosts }) => html2`
			<div class="analytics-dashboard">
				<h3>Blog Statistics</h3>
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-number">${totalPosts.toLocaleString()}</span>
						<span class="stat-label">Total Posts</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">${analytics.totalViews.toLocaleString()}</span>
						<span class="stat-label">Total Views</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">${analytics.totalLikes.toLocaleString()}</span>
						<span class="stat-label">Total Likes</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">${analytics.avgReadTime} min</span>
						<span class="stat-label">Avg Read Time</span>
					</div>
				</div>
			</div>
		`;

		const optimizedAnalyticsDashboard = inline(AnalyticsDashboard);
		const testData = generateTestData();
		const analyticsData = {
			analytics: testData.analytics,
			totalPosts: testData.totalPosts,
		};

		const result = optimizedAnalyticsDashboard(analyticsData);
		const expected = AnalyticsDashboard(analyticsData);

		assert.strictEqual(result, expected);
		assert.ok(result.includes("Blog Statistics"), "Should contain heading");
		assert.ok(result.includes("4,779"), "Should format view counts");
		assert.ok(result.includes("231"), "Should show like counts");

		assertNoFallbacks("AnalyticsDashboard component");
	});

	it("should inline NavigationMenu component with array operations without fallbacks", () => {
		resetFallbackDetection();

		// Extracted from beak2-compiled.js benchmark - NavigationMenu component
		const NavigationMenu = ({ navigation, currentPath = "/" }) => html2`
			<nav class="main-nav" role="navigation" aria-label="Main navigation">
				<ul class="nav-list">
					${navigation.map(
						(item) => html2`
							<li class="nav-item">
								<a
									href="${item.url}"
									class="nav-link ${currentPath === item.url ? "active" : ""}"
									${currentPath === item.url ? 'aria-current="page"' : ""}
								>
									${item.name}
								</a>
							</li>
						`,
					)}
				</ul>
			</nav>
		`;

		const optimizedNavigationMenu = inline(NavigationMenu);
		const testData = generateTestData();
		const navData = {
			navigation: testData.site.navigation,
			currentPath: "/blog",
		};

		const result = optimizedNavigationMenu(navData);
		const expected = NavigationMenu(navData);

		assert.strictEqual(result, expected);
		assert.ok(
			result.includes('class="nav-link active"'),
			"Should mark active nav item",
		);
		assert.ok(result.includes("Home"), "Should contain nav items");
		assert.ok(result.includes("About"), "Should contain all nav items");

		assertNoFallbacks("NavigationMenu with array operations");
	});

	it("should inline CategoryFilter component with complex conditionals without fallbacks", () => {
		resetFallbackDetection();

		// Extracted from beak2-compiled.js benchmark - CategoryFilter component
		const CategoryFilter = ({ categories, selectedCategory }) => html2`
			<div class="category-filter">
				<h3>Filter by Category</h3>
				<ul class="category-list">
					<li>
						<a
							href="/blog"
							class="category-link ${selectedCategory === "" ? "active" : ""}"
						>
							All Posts
						</a>
					</li>
					${categories.map(
						(category) => html2`
							<li>
								<a
									href="/blog?category=${encodeURIComponent(category)}"
									class="category-link ${selectedCategory === category ? "active" : ""}"
								>
									${category}
								</a>
							</li>
						`,
					)}
				</ul>
			</div>
		`;

		const optimizedCategoryFilter = inline(CategoryFilter);
		const testData = generateTestData();
		const categoryData = {
			categories: testData.categories,
			selectedCategory: "JavaScript",
		};

		const result = optimizedCategoryFilter(categoryData);
		const expected = CategoryFilter(categoryData);

		assert.strictEqual(result, expected);
		assert.ok(result.includes("Filter by Category"), "Should contain heading");
		assert.ok(result.includes("All Posts"), "Should have All Posts option");
		assert.ok(
			result.includes("Web%20Development"),
			"Should URL encode categories",
		);
		assert.ok(
			result.includes('class="category-link active"'),
			"Should mark selected category",
		);

		assertNoFallbacks("CategoryFilter with complex conditionals");
	});

	it("should inline PopularTags component with dynamic styling without fallbacks", () => {
		resetFallbackDetection();

		// Extracted from beak2-compiled.js benchmark - PopularTags component
		const PopularTags = ({ tags }) => html2`
			<div class="popular-tags">
				<h3>Popular Tags</h3>
				<div class="tag-cloud">
					${tags.map(
						(tag) => html2`
							<a
								href="/blog/tag/${encodeURIComponent(tag.name)}"
								class="tag-link"
								style="font-size: ${Math.min(1.2 + tag.count * 0.1, 2)}rem"
								title="${tag.count} posts"
							>
								#${tag.name}
								<span class="tag-count">(${tag.count})</span>
							</a>
						`,
					)}
				</div>
			</div>
		`;

		const optimizedPopularTags = inline(PopularTags);
		const testData = generateTestData();
		const tagsData = {
			tags: testData.popularTags,
		};

		const result = optimizedPopularTags(tagsData);
		const expected = PopularTags(tagsData);

		assert.strictEqual(result, expected);
		assert.ok(result.includes("Popular Tags"), "Should contain heading");
		assert.ok(result.includes("#javascript"), "Should show tag names");
		assert.ok(
			result.includes("font-size: 1.4rem"),
			"Should apply dynamic styling",
		);
		assert.ok(result.includes("(2)"), "Should show tag counts");

		assertNoFallbacks("PopularTags with dynamic styling");
	});
});

describe("inline - Edge Cases and Performance Characteristics", () => {
	it("should handle deeply nested template structures without fallbacks", () => {
		resetFallbackDetection();

		const deeplyNested = (data) => {
			return html2`
				<div class="level1">
					${data.items.map(
						(item) => html2`
						<div class="level2-${item.id}">
							<h2>${item.title}</h2>
							${item.sections.map(
								(section) => html2`
								<section class="level3">
									<h3>${section.name}</h3>
									${section.items.map(
										(subItem) => html2`
										<div class="level4">
											<span class="${subItem.active ? "active" : "inactive"}">${subItem.text}</span>
											${subItem.meta ? html2`<small>${subItem.meta}</small>` : ""}
										</div>
									`,
									)}
								</section>
							`,
							)}
						</div>
					`,
					)}
				</div>
			`;
		};

		const optimized = inline(deeplyNested);
		const complexData = {
			items: [
				{
					id: 1,
					title: "First Item",
					sections: [
						{
							name: "Section A",
							items: [
								{ active: true, text: "Active item", meta: "metadata" },
								{ active: false, text: "Inactive item", meta: null },
							],
						},
					],
				},
			],
		};

		const result = optimized(complexData);
		const expected = deeplyNested(complexData);

		assert.strictEqual(result, expected);
		assert.ok(result.includes("level1"), "Should contain outer container");
		assert.ok(result.includes("level2-1"), "Should include dynamic class");
		assert.ok(result.includes("First Item"), "Should render content");
		assert.ok(result.includes('class="active"'), "Should handle conditionals");

		assertNoFallbacks("deeply nested structures");
	});

	it("should handle functions with multiple return statements without fallbacks", () => {
		resetFallbackDetection();

		const multipleReturns = (data) => {
			if (data.type === "error") {
				return html2`<div class="error">${data.message}</div>`;
			}

			if (data.type === "warning") {
				return html2`<div class="warning">${data.message}</div>`;
			}

			return html2`<div class="info">${data.message}</div>`;
		};

		const optimized = inline(multipleReturns);

		// Test all paths
		const errorResult = optimized({ type: "error", message: "Error occurred" });
		const warningResult = optimized({
			type: "warning",
			message: "Warning message",
		});
		const infoResult = optimized({ type: "info", message: "Info message" });

		const expectedError = multipleReturns({
			type: "error",
			message: "Error occurred",
		});
		const expectedWarning = multipleReturns({
			type: "warning",
			message: "Warning message",
		});
		const expectedInfo = multipleReturns({
			type: "info",
			message: "Info message",
		});

		assert.strictEqual(errorResult, expectedError);
		assert.strictEqual(warningResult, expectedWarning);
		assert.strictEqual(infoResult, expectedInfo);

		assert.ok(
			errorResult.includes('class="error"'),
			"Should handle error case",
		);
		assert.ok(
			warningResult.includes('class="warning"'),
			"Should handle warning case",
		);
		assert.ok(infoResult.includes('class="info"'), "Should handle info case");

		assertNoFallbacks("multiple return statements");
	});

	it("should handle functions without templates gracefully", () => {
		resetFallbackDetection();

		// Function without any tagged templates - should return unchanged
		const noTemplatesFunction = (data) => {
			// This function has no templates, so inline should return original
			return `<div>${data.value}</div>`;
		};

		const optimized = inline(noTemplatesFunction);

		// Should return original function unchanged (no optimization possible)
		assert.strictEqual(optimized, noTemplatesFunction);

		// Should not have triggered any fallback warnings (no parsing failures)
		assert.strictEqual(
			fallbackWarnings.length,
			0,
			"Should not have triggered fallback warnings for functions without templates",
		);
	});

	it("should perform better than original functions - performance characteristic test", () => {
		resetFallbackDetection();

		const testTemplate = (data) => {
			return html2`
				<div class="container">
					${data.items.map(
						(item) => html2`
						<div class="item ${item.active ? "active" : ""}">
							<h3>${item.title}</h3>
							<p>${item.description}</p>
							${item.tags.map((tag) => html2`<span class="tag">#${tag}</span>`)}
						</div>
					`,
					)}
				</div>
			`;
		};

		const optimized = inline(testTemplate);

		// Generate test data
		const perfData = {
			items: Array.from({ length: 10 }, (_, i) => ({
				active: i % 2 === 0,
				title: `Item ${i}`,
				description: `Description for item ${i}`,
				tags: [`tag${i}`, `category${i % 3}`],
			})),
		};

		// Time original execution
		const startOriginal = performance.now();
		for (let i = 0; i < 100; i++) {
			testTemplate(perfData);
		}
		const originalTime = performance.now() - startOriginal;

		// Time optimized execution
		const startOptimized = performance.now();
		for (let i = 0; i < 100; i++) {
			optimized(perfData);
		}
		const optimizedTime = performance.now() - startOptimized;

		// Verify correctness first
		const originalResult = testTemplate(perfData);
		const optimizedResult = optimized(perfData);
		assert.strictEqual(optimizedResult, originalResult);

		// Performance should be at least as good (or better)
		// Allow some variance due to timing inconsistencies
		const speedupRatio = originalTime / optimizedTime;

		console.log(
			`Performance test: Original ${originalTime.toFixed(2)}ms, Optimized ${optimizedTime.toFixed(2)}ms, Speedup: ${speedupRatio.toFixed(2)}x`,
		);

		// Optimized version should not be significantly slower
		// (allowing for some measurement variance)
		assert.ok(
			speedupRatio >= 0.8,
			`Optimized version should not be significantly slower. Speedup ratio: ${speedupRatio.toFixed(2)}x`,
		);

		assertNoFallbacks("performance test template");
	});
});
