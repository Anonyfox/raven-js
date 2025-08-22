/**
 * Deterministic sample data generator for template benchmarks.
 * Creates consistent, nontrivial blog post data to prevent caching optimizations.
 */

// Deterministic seeded random number generator for consistent results
function createSeededRandom(seed = 12345) {
	let s = seed;
	return () => {
		s = Math.sin(s) * 10000;
		return s - Math.floor(s);
	};
}

const random = createSeededRandom();

// Sample content pools for variety
const titles = [
	"Understanding Modern Web Development",
	"The Future of JavaScript Frameworks",
	"Building Scalable Applications",
	"Performance Optimization Techniques",
	"Security Best Practices for Developers",
	"Database Design Patterns",
	"Microservices Architecture Deep Dive",
	"Frontend Development Trends",
	"API Design and Implementation",
	"DevOps and Continuous Integration",
	"Machine Learning for Web Developers",
	"Mobile-First Development Strategies",
	"Cloud Computing Fundamentals",
	"Data Visualization Techniques",
	"User Experience Design Principles",
];

const authors = [
	{
		name: "Alex Johnson",
		email: "alex@example.com",
		bio: "Senior full-stack developer",
	},
	{
		name: "Sarah Chen",
		email: "sarah@example.com",
		bio: "Frontend specialist and UX advocate",
	},
	{
		name: "Marcus Rodriguez",
		email: "marcus@example.com",
		bio: "Backend architect and performance expert",
	},
	{
		name: "Emma Thompson",
		email: "emma@example.com",
		bio: "DevOps engineer and cloud specialist",
	},
	{
		name: "David Kim",
		email: "david@example.com",
		bio: "Data scientist and ML engineer",
	},
];

const categories = [
	"Web Development",
	"JavaScript",
	"Performance",
	"Security",
	"Architecture",
	"Frontend",
	"Backend",
	"DevOps",
	"Database",
	"Machine Learning",
];

const tags = [
	"javascript",
	"react",
	"nodejs",
	"performance",
	"security",
	"api",
	"database",
	"microservices",
	"cloud",
	"aws",
	"docker",
	"kubernetes",
	"mongodb",
	"postgresql",
	"redis",
	"graphql",
	"rest",
	"testing",
	"ci/cd",
	"monitoring",
];

const contentBlocks = [
	"In today's rapidly evolving digital landscape, developers face unprecedented challenges in building robust, scalable applications.",
	"The emergence of new technologies and frameworks has fundamentally changed how we approach software development.",
	"Performance optimization remains a critical concern for modern applications, especially as user expectations continue to rise.",
	"Security vulnerabilities can have devastating consequences, making defensive programming practices essential for any production system.",
	"Microservices architecture offers compelling benefits but also introduces new complexities in system design and operation.",
	"Database performance tuning requires a deep understanding of query optimization and indexing strategies.",
	"Cloud-native applications demand different architectural patterns compared to traditional on-premises deployments.",
	"Continuous integration and deployment pipelines have become indispensable tools for maintaining code quality and release velocity.",
	"User experience design significantly impacts application success, requiring close collaboration between developers and designers.",
	"Machine learning integration presents exciting opportunities but also requires careful consideration of data privacy and model bias.",
];

function generateRandomContent() {
	const numParagraphs = Math.floor(random() * 4) + 2; // 2-5 paragraphs
	const paragraphs = [];

	for (let i = 0; i < numParagraphs; i++) {
		const sentences = Math.floor(random() * 3) + 2; // 2-4 sentences per paragraph
		const paragraph = [];

		for (let j = 0; j < sentences; j++) {
			paragraph.push(
				contentBlocks[Math.floor(random() * contentBlocks.length)],
			);
		}

		paragraphs.push(paragraph.join(" "));
	}

	return paragraphs.join("\\n\\n");
}

function generateRandomTags() {
	const numTags = Math.floor(random() * 5) + 2; // 2-6 tags
	const shuffled = [...tags].sort(() => random() - 0.5);
	return shuffled.slice(0, numTags);
}

function generateRandomDate() {
	const start = new Date(2023, 0, 1);
	const end = new Date(2024, 11, 31);
	const randomTime =
		start.getTime() + random() * (end.getTime() - start.getTime());
	return new Date(randomTime);
}

/**
 * Generate deterministic blog post data for benchmarking
 * @param {number} count - Number of posts to generate
 * @returns {Array} Array of blog post objects
 */
export function generateBlogPosts(count = 100) {
	const posts = [];

	for (let i = 0; i < count; i++) {
		const author = authors[Math.floor(random() * authors.length)];
		const category = categories[Math.floor(random() * categories.length)];
		const title = titles[Math.floor(random() * titles.length)];
		const readTime = Math.floor(random() * 10) + 3; // 3-12 minutes
		const views = Math.floor(random() * 10000) + 100;
		const likes = Math.floor(random() * views * 0.1);
		const comments = Math.floor(random() * likes * 0.2);

		posts.push({
			id: i + 1,
			title: `${title} ${i > 0 ? `(Part ${i + 1})` : ""}`,
			slug:
				title.toLowerCase().replace(/\s+/g, "-") +
				(i > 0 ? `-part-${i + 1}` : ""),
			content: generateRandomContent(),
			excerpt: contentBlocks[Math.floor(random() * contentBlocks.length)],
			author: author,
			category: category,
			tags: generateRandomTags(),
			publishedAt: generateRandomDate(),
			updatedAt: generateRandomDate(),
			readTime: readTime,
			views: views,
			likes: likes,
			comments: comments,
			featured: random() > 0.8, // 20% chance of being featured
			status: random() > 0.1 ? "published" : "draft", // 90% published
			seoTitle: `${title} - Complete Guide`,
			seoDescription: `Learn about ${title.toLowerCase()} with practical examples and best practices.`,
			ogImage: `https://example.com/images/blog/${i + 1}.jpg`,
		});
	}

	return posts;
}

/**
 * Generate site metadata for templates
 */
export function generateSiteData() {
	return {
		name: "DevBlog",
		description: "A comprehensive blog about modern web development",
		url: "https://devblog.example.com",
		author: "DevBlog Team",
		year: new Date().getFullYear(),
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
	};
}

/**
 * Generate complete template data combining posts and site info
 */
export function generateTemplateData() {
	const posts = generateBlogPosts(100);
	const publishedPosts = posts.filter((post) => post.status === "published");
	const featuredPosts = publishedPosts.filter((post) => post.featured);

	return {
		site: generateSiteData(),
		posts: publishedPosts,
		featuredPosts: featuredPosts.slice(0, 3),
		totalPosts: publishedPosts.length,
		categories: [...new Set(publishedPosts.map((post) => post.category))],
		popularTags: getPopularTags(publishedPosts),
		currentPage: 1,
		totalPages: Math.ceil(publishedPosts.length / 10),
		hasNextPage: true,
		hasPrevPage: false,
		searchQuery: "",
		selectedCategory: "",
		sortBy: "publishedAt",
		userPreferences: {
			theme: "light",
			showExcerpts: true,
			postsPerPage: 10,
			compactView: false,
		},
		analytics: {
			totalViews: publishedPosts.reduce((sum, post) => sum + post.views, 0),
			totalLikes: publishedPosts.reduce((sum, post) => sum + post.likes, 0),
			avgReadTime: Math.round(
				publishedPosts.reduce((sum, post) => sum + post.readTime, 0) /
					publishedPosts.length,
			),
		},
		recentActivity: generateRecentActivity(publishedPosts.slice(0, 5)),
	};
}

function getPopularTags(posts) {
	const tagCounts = {};
	posts.forEach((post) => {
		post.tags.forEach((tag) => {
			tagCounts[tag] = (tagCounts[tag] || 0) + 1;
		});
	});

	return Object.entries(tagCounts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10)
		.map(([tag, count]) => ({ name: tag, count }));
}

function generateRecentActivity(posts) {
	return posts.map((post) => ({
		type: "published",
		post: post,
		timestamp: post.publishedAt,
		description: `New post "${post.title}" published`,
	}));
}
