import { html2 as html } from "@raven-js/beak/core/html2";
import { compile } from "@raven-js/beak/core/html2/compile";

// Component-like functions for better organization
const MetaHead = ({ site, title, description }) => html`
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>${title} - ${site.name}</title>
	<meta name="description" content="${description}" />
	<meta name="author" content="${site.author}" />
	<meta property="og:title" content="${title}" />
	<meta property="og:description" content="${description}" />
	<meta property="og:type" content="website" />
	<link rel="canonical" href="${site.url}" />
`;

const NavigationMenu = ({ navigation, currentPath = "/" }) => html`
	<nav class="main-nav" role="navigation" aria-label="Main navigation">
		<ul class="nav-list">
			${navigation.map(
				(item) => html`
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

const CategoryFilter = ({ categories, selectedCategory }) => html`
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
				(category) => html`
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

const PopularTags = ({ tags }) => html`
	<div class="popular-tags">
		<h3>Popular Tags</h3>
		<div class="tag-cloud">
			${tags.map(
				(tag) => html`
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

// Compiled version - surgically optimized
const AnalyticsDashboard = compile(
	({ analytics, totalPosts }) => html`
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
`,
);

const FeaturedPostsSection = ({ featuredPosts }) => html`
	${
		featuredPosts.length > 0
			? html`
				<section class="featured-posts" aria-labelledby="featured-heading">
					<h2 id="featured-heading">Featured Posts</h2>
					<div class="featured-grid">
						${featuredPosts.map(
							(post) => html`
								<article class="featured-post">
									<div class="featured-content">
										<div class="post-badge">Featured</div>
										<h3>
											<a href="/blog/${post.slug}" class="featured-title">
												${post.title}
											</a>
										</h3>
										<p class="featured-excerpt">${post.excerpt}</p>
										<div class="featured-meta">
											<span class="author">by ${post.author.name}</span>
											<span class="read-time">${post.readTime} min read</span>
											<span class="views">${post.views.toLocaleString()} views</span>
										</div>
									</div>
								</article>
							`,
						)}
					</div>
				</section>
		  `
			: ""
	}
`;

// Compiled version - most complex component
const PostCard = compile(({ post, compactView = false }) => {
	const publishedDate = new Date(post.publishedAt);
	const isRecent =
		Date.now() - publishedDate.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
	const readTimeCategory =
		post.readTime <= 3 ? "quick" : post.readTime <= 7 ? "medium" : "long";

	return html`
		<article
			class="post-card ${post.featured ? "featured" : ""} ${compactView ? "compact" : ""}"
			data-category="${post.category}"
			data-read-time="${readTimeCategory}"
		>
			<header class="post-header">
				<div class="post-badges">
					${post.featured ? html`<span class="badge featured">Featured</span>` : ""}
					${isRecent ? html`<span class="badge new">New</span>` : ""}
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
					? html`
						<div class="post-content">
							<p class="post-excerpt">${post.excerpt}</p>
							${
								post.content.length > 500
									? html`
										<details class="content-preview">
											<summary>Read more...</summary>
											<div class="full-content">
												${post.content
													.split("\\n\\n")
													.map((paragraph) => html`<p>${paragraph}</p>`)}
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
					(tag) => html`
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
});

// Compiled version - complex pagination logic
const PaginationControls = compile(
	({ currentPage, totalPages, hasNextPage, hasPrevPage }) => {
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

		return html`
		<nav class="pagination" role="navigation" aria-label="Pagination">
			<div class="pagination-info">
				<span>
					Page ${currentPage} of ${totalPages} (${totalPages * 10} total posts)
				</span>
			</div>
			<div class="pagination-controls">
				${
					hasPrevPage
						? html`
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
						: html`
							<span class="page-link disabled">« First</span>
							<span class="page-link disabled">‹ Previous</span>
					  `
				}

				${generatePageNumbers().map(
					(pageNum) => html`
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
						? html`
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
						: html`
							<span class="page-link disabled">Next ›</span>
							<span class="page-link disabled">Last »</span>
					  `
				}
			</div>
		</nav>
	`;
	},
);

const SearchAndFilters = ({ searchQuery, selectedCategory, sortBy }) => html`
	<div class="search-filters">
		<form class="search-form" role="search">
			<div class="search-input-group">
				<label for="search" class="sr-only">Search posts</label>
				<input
					type="search"
					id="search"
					name="q"
					placeholder="Search posts..."
					value="${searchQuery}"
					class="search-input"
				/>
				<button type="submit" class="search-btn">🔍 Search</button>
			</div>
		</form>
		<div class="filter-controls">
			<select name="category" class="filter-select" title="Filter by category">
				<option value="">All Categories</option>
				<option value="javascript" ${selectedCategory === "javascript" ? "selected" : ""}>
					JavaScript
				</option>
				<option value="performance" ${selectedCategory === "performance" ? "selected" : ""}>
					Performance
				</option>
			</select>
			<select name="sort" class="filter-select" title="Sort posts">
				<option value="publishedAt" ${sortBy === "publishedAt" ? "selected" : ""}>
					Latest First
				</option>
				<option value="views" ${sortBy === "views" ? "selected" : ""}>
					Most Popular
				</option>
				<option value="likes" ${sortBy === "likes" ? "selected" : ""}>
					Most Liked
				</option>
			</select>
		</div>
	</div>
`;

// Main render function - compiled for maximum optimization
export const renderBlogPage = compile(
	(data) => html`<!DOCTYPE html>
	<html lang="en" data-theme="${data.userPreferences.theme}">
		<head>
			${MetaHead({
				site: data.site,
				title: "Modern Web Development Blog",
				description: data.site.description,
			})}
			<link rel="stylesheet" href="/css/blog.css" />
			<script defer src="/js/blog-interactions.js"></script>
		</head>
		<body>
			<header class="site-header">
				<div class="header-content">
					<div class="site-branding">
						<h1 class="site-title">
							<a href="/">${data.site.name}</a>
						</h1>
						<p class="site-tagline">${data.site.description}</p>
					</div>
					${NavigationMenu({ navigation: data.site.navigation })}
					<div class="header-actions">
						<button class="theme-toggle" title="Toggle dark/light theme">
							🌓
						</button>
						<button class="view-toggle" title="Toggle compact view">
							📋
						</button>
					</div>
				</div>
			</header>

			<main class="main-content">
				<div class="content-wrapper">
					<div class="main-column">
						${SearchAndFilters({
							searchQuery: data.searchQuery,
							selectedCategory: data.selectedCategory,
							sortBy: data.sortBy,
						})}

						${FeaturedPostsSection({ featuredPosts: data.featuredPosts })}

						<section class="posts-section" aria-labelledby="posts-heading">
							<div class="section-header">
								<h2 id="posts-heading">
									${
										data.selectedCategory
											? `Posts in ${data.selectedCategory}`
											: "All Posts"
									}
								</h2>
								<div class="posts-count">
									${data.posts.length} posts found
								</div>
							</div>

							<div
								class="posts-grid ${data.userPreferences.compactView ? "compact" : ""}"
							>
								${
									data.posts.length > 0
										? data.posts.map((post) =>
												PostCard({
													post,
													compactView: data.userPreferences.compactView,
												}),
											)
										: html`
											<div class="no-posts">
												<h3>No posts found</h3>
												<p>
													Try adjusting your search or filter criteria to find
													more posts.
												</p>
												<a href="/blog" class="reset-filters">
													Reset filters
												</a>
											</div>
									  `
								}
							</div>
						</section>

						${
							data.posts.length > 0
								? PaginationControls({
										currentPage: data.currentPage,
										totalPages: data.totalPages,
										hasNextPage: data.hasNextPage,
										hasPrevPage: data.hasPrevPage,
									})
								: ""
						}
					</div>

					<aside class="sidebar">
						${AnalyticsDashboard({
							analytics: data.analytics,
							totalPosts: data.totalPosts,
						})}
						${CategoryFilter({
							categories: data.categories,
							selectedCategory: data.selectedCategory,
						})}
						${PopularTags({ tags: data.popularTags })}

						<div class="recent-activity">
							<h3>Recent Activity</h3>
							<ul class="activity-list">
								${data.recentActivity.map(
									(activity) => html`
										<li class="activity-item">
											<div class="activity-content">
												<span class="activity-type">${activity.type}</span>
												<a href="/blog/${activity.post.slug}" class="activity-link">
													${activity.post.title}
												</a>
												<time class="activity-time">
													${new Date(activity.timestamp).toLocaleDateString()}
												</time>
											</div>
										</li>
									`,
								)}
							</ul>
						</div>

						<div class="newsletter-signup">
							<h3>Stay Updated</h3>
							<p>Get notified about new posts and updates.</p>
							<form class="newsletter-form">
								<input
									type="email"
									placeholder="your@email.com"
									required
									class="newsletter-input"
								/>
								<button type="submit" class="newsletter-btn">
									Subscribe
								</button>
							</form>
						</div>
					</aside>
				</div>
			</main>

			<footer class="site-footer">
				<div class="footer-content">
					<div class="footer-info">
						<p>&copy; ${data.site.year} ${data.site.name}. All rights reserved.</p>
						<p>
							Built with modern web technologies for optimal performance and
							accessibility.
						</p>
					</div>
					<div class="social-links">
						<a
							href="https://twitter.com/${data.site.social.twitter}"
							class="social-link twitter"
							aria-label="Follow us on Twitter"
						>
							🐦 Twitter
						</a>
						<a
							href="https://github.com/${data.site.social.github}"
							class="social-link github"
							aria-label="View our GitHub repository"
						>
							🐙 GitHub
						</a>
						<a
							href="https://linkedin.com/${data.site.social.linkedin}"
							class="social-link linkedin"
							aria-label="Connect with us on LinkedIn"
						>
							💼 LinkedIn
						</a>
					</div>
					<div class="footer-nav">
						<a href="/privacy">Privacy Policy</a>
						<a href="/terms">Terms of Service</a>
						<a href="/contact">Contact</a>
						<a href="/rss.xml">RSS Feed</a>
					</div>
				</div>
			</footer>

			<script>
				// Progressive enhancement for interactivity
				document.addEventListener('DOMContentLoaded', function() {
					// Theme toggle functionality
					const themeToggle = document.querySelector('.theme-toggle');
					if (themeToggle) {
						themeToggle.addEventListener('click', () => {
							const html = document.documentElement;
							const currentTheme = html.getAttribute('data-theme');
							html.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
						});
					}
				});
			</script>
		</body>
	</html>`,
);
