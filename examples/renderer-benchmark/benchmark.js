import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import doT from "dot";

// Import template engines
import ejs from "ejs";
import { Eta } from "eta";
import Handlebars from "handlebars";
import { Liquid } from "liquidjs";
import Mustache from "mustache";
import nunjucks from "nunjucks";
import pug from "pug";

import { generateTemplateData } from "./data.js";
import { renderBlogPage as beakRender } from "./templates/beak.js";
import { renderBlogPage as beak2Render } from "./templates/beak2.js";
import { renderBlogPage as beak2CompiledRender } from "./templates/beak2-compiled.js";

class BenchmarkRunner {
	constructor() {
		this.results = new Map();
		this.templateData = generateTemplateData();
		this.iterations = 1000; // Number of render iterations per engine
		this.warmupRuns = 10; // Warmup iterations

		this.setupEngines();
	}

	setupEngines() {
		// Setup Eta
		this.eta = new Eta({
			views: path.join(process.cwd(), "templates"),
			cache: false, // Disable caching for fair comparison
		});

		// Setup Handlebars with helpers
		Handlebars.registerHelper("formatDate", (date) =>
			date.toLocaleDateString(),
		);
		Handlebars.registerHelper("formatNumber", (num) => num.toLocaleString());
		Handlebars.registerHelper("add", (a, b) => a + b);
		Handlebars.registerHelper("subtract", (a, b) => a - b);
		Handlebars.registerHelper("multiply", (a, b) => a * b);
		Handlebars.registerHelper("ifEquals", function (a, b, options) {
			return a === b ? options.fn(this) : options.inverse(this);
		});
		Handlebars.registerHelper("gt", (a, b) => a > b);
		Handlebars.registerHelper("gte", (a, b) => a >= b);
		Handlebars.registerHelper("lt", (a, b) => a < b);
		Handlebars.registerHelper("lte", (a, b) => a <= b);
		Handlebars.registerHelper("isRecent", (date) => {
			return Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000;
		});
		Handlebars.registerHelper("initials", (name) => {
			return name
				.split(" ")
				.map((n) => n[0])
				.join("");
		});
		Handlebars.registerHelper("isoDate", (date) =>
			new Date(date).toISOString(),
		);
		Handlebars.registerHelper("urlEncode", (str) => encodeURIComponent(str));
		Handlebars.registerHelper("split", (str, delimiter) =>
			str.split(delimiter),
		);
		Handlebars.registerHelper("formatShort", (num) => Math.round(num / 1000));
		Handlebars.registerHelper("tagSize", (count) =>
			Math.min(1.2 + count * 0.1, 2),
		);
		Handlebars.registerHelper(
			"paginationPages",
			(currentPage, totalPages, options) => {
				const showPages = 5;
				let start = Math.max(1, currentPage - Math.floor(showPages / 2));
				const end = Math.min(totalPages, start + showPages - 1);
				if (end - start + 1 < showPages) {
					start = Math.max(1, end - showPages + 1);
				}
				let result = "";
				for (let i = start; i <= end; i++) {
					result += options.fn(i);
				}
				return result;
			},
		);

		// Setup Nunjucks
		this.nunjucksEnv = nunjucks.configure("templates", {
			autoescape: true,
			noCache: true,
		});
		this.nunjucksEnv.addFilter("number", (num) => num.toLocaleString());
		this.nunjucksEnv.addFilter("date", (date, format) => {
			if (format === "iso") {
				return new Date(date).toISOString();
			}
			return new Date(date).toLocaleDateString();
		});
		this.nunjucksEnv.addFilter("urlencode", (str) => encodeURIComponent(str));

		// Setup Liquid
		this.liquid = new Liquid({
			root: path.join(process.cwd(), "templates"),
			cache: false,
		});

		// Setup doT
		this.dotSettings = Object.assign({}, doT.templateSettings);
		this.dotSettings.strip = false;
	}

	loadTemplate(filename) {
		return fs.readFileSync(path.join("templates", filename), "utf8");
	}

	prepareData() {
		// Prepare data for engines that need special formatting
		const baseData = { ...this.templateData };

		// Generate pagination pages for complex logic
		const generatePaginationPages = (currentPage, totalPages) => {
			const pages = [];
			const showPages = 5;
			let start = Math.max(1, currentPage - Math.floor(showPages / 2));
			const end = Math.min(totalPages, start + showPages - 1);
			if (end - start + 1 < showPages) {
				start = Math.max(1, end - showPages + 1);
			}
			for (let i = start; i <= end; i++) {
				pages.push({
					pageNumber: i,
					isCurrentPage: i === currentPage,
				});
			}
			return pages;
		};

		// Mustache needs pre-formatted data (logic-less)
		const mustacheData = {
			...baseData,
			hasFeaturedPosts: baseData.featuredPosts.length > 0,
			hasPosts: baseData.posts.length > 0,
			postsCount: baseData.posts.length,
			totalPostsDisplay: baseData.totalPages * 10,
			totalPostsFormatted: baseData.totalPosts.toLocaleString(),
			noSelectedCategory: !baseData.selectedCategory,
			isSortByDate: baseData.sortBy === "publishedAt",
			isSortByViews: baseData.sortBy === "views",
			isSortByLikes: baseData.sortBy === "likes",
			isCompactView: baseData.userPreferences.compactView,
			prevPage: baseData.currentPage - 1,
			nextPage: baseData.currentPage + 1,
			paginationPages: generatePaginationPages(
				baseData.currentPage,
				baseData.totalPages,
			),
			categories: baseData.categories.map((cat) => ({
				name: cat,
				encodedCategory: encodeURIComponent(cat),
				isSelectedCategory: cat === baseData.selectedCategory,
			})),
			popularTags: baseData.popularTags.map((tag) => ({
				...tag,
				encodedName: encodeURIComponent(tag.name),
				fontSize: Math.min(1.2 + tag.count * 0.1, 2),
			})),
			analytics: {
				...baseData.analytics,
				totalViewsFormatted: baseData.analytics.totalViews.toLocaleString(),
				totalLikesFormatted: baseData.analytics.totalLikes.toLocaleString(),
			},
			recentActivity: baseData.recentActivity.map((activity) => ({
				...activity,
				timestampFormatted: new Date(activity.timestamp).toLocaleDateString(),
			})),
			posts: baseData.posts.map((post) => {
				const publishedDate = new Date(post.publishedAt);
				const isRecent =
					Date.now() - publishedDate.getTime() < 7 * 24 * 60 * 60 * 1000;
				const readTimeCategory =
					post.readTime <= 3 ? "quick" : post.readTime <= 7 ? "medium" : "long";

				return {
					...post,
					publishedAtFormatted: post.publishedAt.toLocaleDateString(),
					isoPublishedAt: publishedDate.toISOString(),
					viewsFormatted: post.views.toLocaleString(),
					likesFormatted: post.likes.toLocaleString(),
					commentsFormatted: post.comments.toLocaleString(),
					viewsShort:
						post.views > 1000
							? `${Math.round(post.views / 1000)}k`
							: post.views.toString(),
					likesShort:
						post.likes > 1000
							? `${Math.round(post.likes / 1000)}k`
							: post.likes.toString(),
					isRecentPost: isRecent,
					readTimeCategory: readTimeCategory,
					authorAvatarUrl: `https://via.placeholder.com/32x32?text=${post.author.name
						.split(" ")
						.map((n) => n[0])
						.join("")}`,
					showFullContent: !baseData.userPreferences.compactView,
					hasLongContent: post.content.length > 500,
					contentParagraphs: post.content.split("\\n\\n"),
					tags: post.tags.map((tag) => ({
						name: tag,
						encodedTag: encodeURIComponent(tag),
					})),
				};
			}),
		};

		return { baseData, mustacheData };
	}

	async measurePerformance(name, renderFn, warmup = true) {
		if (warmup) {
			// Warmup runs to stabilize JIT compilation
			for (let i = 0; i < this.warmupRuns; i++) {
				await renderFn();
			}
		}

		// Clear memory and force garbage collection if available
		if (global.gc) {
			global.gc();
		}

		const measurements = [];
		const startMemory = process.memoryUsage().heapUsed;

		for (let i = 0; i < this.iterations; i++) {
			const start = performance.now();
			await renderFn();
			const end = performance.now();
			measurements.push(end - start);
		}

		const endMemory = process.memoryUsage().heapUsed;
		const memoryDelta = endMemory - startMemory;

		// Calculate statistics
		const sorted = measurements.sort((a, b) => a - b);
		const total = sorted.reduce((sum, time) => sum + time, 0);
		const avg = total / sorted.length;
		const median = sorted[Math.floor(sorted.length / 2)];
		const p95 = sorted[Math.floor(sorted.length * 0.95)];
		const min = sorted[0];
		const max = sorted[sorted.length - 1];

		return {
			name,
			iterations: this.iterations,
			totalTime: total,
			avgTime: avg,
			medianTime: median,
			minTime: min,
			maxTime: max,
			p95Time: p95,
			memoryDelta,
			rendersPerSecond: 1000 / avg,
		};
	}

	async benchmarkBeak() {
		const { baseData } = this.prepareData();

		return this.measurePerformance("Beak (RavenJS)", () => {
			return beakRender(baseData);
		});
	}

	async benchmarkBeak2() {
		const { baseData } = this.prepareData();

		return this.measurePerformance("Beak2 (RavenJS HTML2)", () => {
			return beak2Render(baseData);
		});
	}

	async benchmarkBeak2Compiled() {
		const { baseData } = this.prepareData();

		return this.measurePerformance(
			"Beak2 Compiled (RavenJS HTML2 + Compile)",
			() => {
				return beak2CompiledRender(baseData);
			},
		);
	}

	async benchmarkEJS() {
		const template = this.loadTemplate("ejs.ejs");
		const { baseData } = this.prepareData();

		return this.measurePerformance("EJS", () => {
			return ejs.render(template, baseData, { cache: false });
		});
	}

	async benchmarkEta() {
		const { baseData } = this.prepareData();

		return this.measurePerformance("Eta", () => {
			return this.eta.render("eta.eta", baseData);
		});
	}

	async benchmarkHandlebars() {
		const template = Handlebars.compile(this.loadTemplate("handlebars.hbs"));
		const { baseData } = this.prepareData();

		return this.measurePerformance("Handlebars", () => {
			return template(baseData);
		});
	}

	async benchmarkMustache() {
		const template = this.loadTemplate("mustache.mustache");
		const { mustacheData } = this.prepareData();

		return this.measurePerformance("Mustache", () => {
			return Mustache.render(template, mustacheData);
		});
	}

	async benchmarkNunjucks() {
		const { baseData } = this.prepareData();

		return this.measurePerformance("Nunjucks", () => {
			return this.nunjucksEnv.render("nunjucks.njk", baseData);
		});
	}

	async benchmarkPug() {
		const template = pug.compileFile("templates/pug.pug", { cache: false });
		const { baseData } = this.prepareData();

		return this.measurePerformance("Pug", () => {
			return template(baseData);
		});
	}

	async benchmarkDoT() {
		const templateStr = this.loadTemplate("dot.dot");
		const template = doT.template(templateStr, this.dotSettings);
		const { baseData } = this.prepareData();

		return this.measurePerformance("doT", () => {
			return template(baseData);
		});
	}

	async benchmarkLiquid() {
		const { baseData } = this.prepareData();

		return this.measurePerformance("Liquid", () => {
			return this.liquid.renderFile("liquid.liquid", baseData);
		});
	}

	async runAllBenchmarks() {
		console.log("🚀 Starting Template Engine Benchmark...");
		console.log(
			`📊 Running ${this.iterations} iterations per engine with ${this.warmupRuns} warmup runs`,
		);
		console.log(
			`📝 Template complexity: ${this.templateData.posts.length} blog posts with rich metadata`,
		);
		console.log();

		const benchmarks = [
			() => this.benchmarkBeak(),
			() => this.benchmarkBeak2(),
			() => this.benchmarkBeak2Compiled(),
			() => this.benchmarkEJS(),
			() => this.benchmarkEta(),
			() => this.benchmarkHandlebars(),
			() => this.benchmarkMustache(),
			() => this.benchmarkNunjucks(),
			() => this.benchmarkPug(),
			() => this.benchmarkDoT(),
			() => this.benchmarkLiquid(),
		];

		for (const benchmark of benchmarks) {
			try {
				const result = await benchmark();
				if (result) {
					this.results.set(result.name, result);
					console.log(
						`✅ ${result.name}: ${result.avgTime.toFixed(2)}ms avg, ${result.rendersPerSecond.toFixed(0)} renders/sec`,
					);
				}
			} catch (error) {
				console.error(
					`❌ ${benchmark.name || "Unknown"} failed:`,
					error.message,
				);
			}
		}

		return this.results;
	}

	generateReport() {
		const sortedResults = Array.from(this.results.values()).sort(
			(a, b) => a.avgTime - b.avgTime,
		);

		const fastest = sortedResults[0];

		let report = `# Template Engine Benchmark Results\n\n`;
		report += `**Generated:** ${new Date().toISOString()}\n`;
		report += `**Test Environment:** Node.js ${process.version}\n`;
		report += `**Iterations:** ${this.iterations} renders per engine\n`;
		report += `**Sample Data:** ${this.templateData.posts.length} blog posts with full metadata\n\n`;

		// Performance ranking table
		report += `## Performance Ranking\n\n`;
		report += `| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |\n`;
		report += `|------|--------|---------------|-------------|------------|-------------|\n`;

		sortedResults.forEach((result, index) => {
			const speedRatio = result.avgTime / fastest.avgTime;
			const memoryKB = Math.round(result.memoryDelta / 1024);
			const speedText =
				index === 0 ? "baseline" : `${speedRatio.toFixed(2)}x slower`;

			report += `| ${index + 1} | **${result.name}** | ${result.avgTime.toFixed(2)} | ${Math.round(result.rendersPerSecond)} | ${speedText} | ${memoryKB} |\n`;
		});

		// Detailed statistics
		report += `\\n## Detailed Statistics\\n\\n`;
		report += `| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\\n`;
		report += `|--------|----------|-------------|----------|----------|------------|\\n`;

		sortedResults.forEach((result) => {
			report += `| **${result.name}** | ${result.minTime.toFixed(2)} | ${result.medianTime.toFixed(2)} | ${result.p95Time.toFixed(2)} | ${result.maxTime.toFixed(2)} | ${result.totalTime.toFixed(0)} |\\n`;
		});

		// Analysis
		report += `\\n## Analysis\\n\\n`;
		report += `### 🏆 Performance Leaders\\n\\n`;
		report += `1. **${sortedResults[0].name}** - Fastest overall with ${sortedResults[0].avgTime.toFixed(2)}ms average render time\\n`;
		report += `2. **${sortedResults[1].name}** - Close second at ${sortedResults[1].avgTime.toFixed(2)}ms (${(sortedResults[1].avgTime / sortedResults[0].avgTime).toFixed(2)}x slower)\\n`;
		report += `3. **${sortedResults[2].name}** - Third place at ${sortedResults[2].avgTime.toFixed(2)}ms\\n\\n`;

		const slowest = sortedResults[sortedResults.length - 1];
		report += `### 📈 Performance Spread\\n\\n`;
		report += `The fastest engine (${fastest.name}) is **${(slowest.avgTime / fastest.avgTime).toFixed(1)}x faster** than the slowest (${slowest.name}).\\n`;
		report += `Median performance difference: ${(sortedResults[Math.floor(sortedResults.length / 2)].avgTime / fastest.avgTime).toFixed(1)}x slower than fastest.\\n\\n`;

		// Memory usage analysis
		const memoryResults = sortedResults.sort(
			(a, b) => a.memoryDelta - b.memoryDelta,
		);
		report += `### 💾 Memory Efficiency\\n\\n`;
		report += `**Most memory efficient:** ${memoryResults[0].name} (${Math.round(memoryResults[0].memoryDelta / 1024)} KB)\\n`;
		report += `**Highest memory usage:** ${memoryResults[memoryResults.length - 1].name} (${Math.round(memoryResults[memoryResults.length - 1].memoryDelta / 1024)} KB)\\n\\n`;

		// Test environment
		report += `## Test Environment\\n\\n`;
		report += `- **Node.js Version:** ${process.version}\\n`;
		report += `- **Platform:** ${process.platform} ${process.arch}\\n`;
		report += `- **Template Complexity:** Blog listing with ${this.templateData.posts.length} posts\\n`;
		report += `- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\\n`;
		report += `- **Caching:** Disabled for all engines to ensure fair comparison\\n`;
		report += `- **Warmup:** ${this.warmupRuns} iterations before measurement\\n`;
		report += `- **Measurement:** ${this.iterations} timed iterations per engine\\n\\n`;

		report += `---\\n\\n`;
		report += `*Benchmark generated with the RavenJS renderer-benchmark package*\\n`;

		return report;
	}

	async run() {
		await this.runAllBenchmarks();
		const report = this.generateReport();

		fs.writeFileSync("BENCHMARK.md", report);
		console.log("\\n📊 Benchmark complete! Results saved to BENCHMARK.md");

		return this.results;
	}
}

// Run benchmark if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const runner = new BenchmarkRunner();
	await runner.run();
}
