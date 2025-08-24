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

// Import data generators
import {
	generateBaselineData,
	generateComponentData,
	generateTemplateData,
} from "./data.js";

// Import baseline templates
import { renderBaselineString as beakBaselineRender } from "./templates/baseline/beak.js";
import { renderBaselineString as beak2BaselineRender } from "./templates/baseline/beak2.js";
import { renderBaselineString as beak2CompiledBaselineRender } from "./templates/baseline/beak2-compiled.js";
// Import complex templates (existing)
import { renderBlogPage as beakComplexRender } from "./templates/complex/beak.js";
import { renderBlogPage as beak2ComplexRender } from "./templates/complex/beak2.js";
import { renderBlogPage as beak2CompiledComplexRender } from "./templates/complex/beak2-compiled.js";
// Import component templates
import { renderProductList as beakComponentRender } from "./templates/component/beak.js";
import { renderProductList as beak2ComponentRender } from "./templates/component/beak2.js";
import { renderProductList as beak2CompiledComponentRender } from "./templates/component/beak2-compiled.js";

class BenchmarkRunner {
	constructor() {
		this.results = new Map();
		this.iterations = 1000; // Number of render iterations per engine
		this.warmupRuns = 10; // Warmup iterations

		// Generate data for all three test types
		this.baselineData = generateBaselineData();
		this.componentData = generateComponentData(20);
		this.complexData = generateTemplateData();

		this.setupEngines();
	}

	setupEngines() {
		// Setup Eta
		this.eta = new Eta({
			views: path.join(process.cwd(), "templates"),
			cache: false, // Disable caching for fair comparison
		});

		// Setup Handlebars with helpers (for complex templates)
		this.setupHandlebarsHelpers();

		// Setup Nunjucks
		this.nunjucksEnv = nunjucks.configure("templates", {
			autoescape: true,
			noCache: true,
		});
		this.setupNunjucksFilters();

		// Setup Liquid
		this.liquid = new Liquid({
			root: path.join(process.cwd(), "templates"),
			cache: false,
		});

		// Setup doT
		this.dotSettings = Object.assign({}, doT.templateSettings);
		this.dotSettings.strip = false;
	}

	setupHandlebarsHelpers() {
		// Basic helpers for component templates
		Handlebars.registerHelper("gt", (a, b) => a > b);
		Handlebars.registerHelper("gte", (a, b) => a >= b);
		Handlebars.registerHelper("lt", (a, b) => a < b);
		Handlebars.registerHelper("lte", (a, b) => a <= b);
		Handlebars.registerHelper("add", (a, b) => a + b);
		Handlebars.registerHelper("subtract", (a, b) => a - b);
		Handlebars.registerHelper("multiply", (a, b) => a * b);
		Handlebars.registerHelper("range", (n) =>
			Array.from({ length: n }, (_, i) => i),
		);
		Handlebars.registerHelper("objectEntries", (obj) =>
			Object.entries(obj).map(([key, value]) => ({ key, value })),
		);

		// Complex helpers for blog templates
		Handlebars.registerHelper("formatDate", (date) =>
			date.toLocaleDateString(),
		);
		Handlebars.registerHelper("formatNumber", (num) => num.toLocaleString());
		Handlebars.registerHelper("ifEquals", function (a, b, options) {
			return a === b ? options.fn(this) : options.inverse(this);
		});
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
	}

	setupNunjucksFilters() {
		this.nunjucksEnv.addFilter("number", (num) => num.toLocaleString());
		this.nunjucksEnv.addFilter("date", (date, format) => {
			if (format === "iso") {
				return new Date(date).toISOString();
			}
			return new Date(date).toLocaleDateString();
		});
		this.nunjucksEnv.addFilter("urlencode", (str) => encodeURIComponent(str));
	}

	loadTemplate(templatePath) {
		return fs.readFileSync(templatePath, "utf8");
	}

	prepareComplexData() {
		// Prepare data for engines that need special formatting (complex templates only)
		const baseData = { ...this.complexData };

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

	async measurePerformance(name, category, renderFn, warmup = true) {
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

		for (let i = 0; i < this.iterations; i++) {
			const start = performance.now();
			await renderFn();
			const end = performance.now();
			measurements.push(end - start);
		}

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
			category,
			iterations: this.iterations,
			totalTime: total,
			avgTime: avg,
			medianTime: median,
			minTime: min,
			maxTime: max,
			p95Time: p95,
			rendersPerSecond: 1000 / avg,
		};
	}

	// Baseline benchmarks
	async benchmarkBeakBaseline() {
		return this.measurePerformance("Beak (RavenJS)", "baseline", () => {
			return beakBaselineRender();
		});
	}

	async benchmarkBeak2Baseline() {
		return this.measurePerformance("Beak2 (HTML2)", "baseline", () => {
			return beak2BaselineRender();
		});
	}

	async benchmarkBeak2CompiledBaseline() {
		return this.measurePerformance("Beak2 Compiled", "baseline", () => {
			return beak2CompiledBaselineRender();
		});
	}

	async benchmarkEJSBaseline() {
		const template = this.loadTemplate("templates/baseline/ejs.ejs");
		return this.measurePerformance("EJS", "baseline", () => {
			return ejs.render(template, this.baselineData, { cache: false });
		});
	}

	async benchmarkEtaBaseline() {
		return this.measurePerformance("Eta", "baseline", () => {
			return this.eta.render("baseline/eta.eta", this.baselineData);
		});
	}

	async benchmarkHandlebarsBaseline() {
		const template = Handlebars.compile(
			this.loadTemplate("templates/baseline/handlebars.hbs"),
		);
		return this.measurePerformance("Handlebars", "baseline", () => {
			return template(this.baselineData);
		});
	}

	async benchmarkMustacheBaseline() {
		const template = this.loadTemplate("templates/baseline/mustache.mustache");
		return this.measurePerformance("Mustache", "baseline", () => {
			return Mustache.render(template, this.baselineData);
		});
	}

	async benchmarkNunjucksBaseline() {
		return this.measurePerformance("Nunjucks", "baseline", () => {
			return this.nunjucksEnv.render(
				"baseline/nunjucks.njk",
				this.baselineData,
			);
		});
	}

	async benchmarkPugBaseline() {
		const template = pug.compileFile("templates/baseline/pug.pug", {
			cache: false,
		});
		return this.measurePerformance("Pug", "baseline", () => {
			return template(this.baselineData);
		});
	}

	async benchmarkDoTBaseline() {
		const templateStr = this.loadTemplate("templates/baseline/dot.dot");
		const template = doT.template(templateStr, this.dotSettings);
		return this.measurePerformance("doT", "baseline", () => {
			return template(this.baselineData);
		});
	}

	async benchmarkLiquidBaseline() {
		return this.measurePerformance("Liquid", "baseline", () => {
			return this.liquid.renderFile(
				"baseline/liquid.liquid",
				this.baselineData,
			);
		});
	}

	// Component benchmarks
	async benchmarkBeakComponent() {
		const { standardData } = this.componentData;
		return this.measurePerformance("Beak (RavenJS)", "component", () => {
			return beakComponentRender(standardData);
		});
	}

	async benchmarkBeak2Component() {
		const { standardData } = this.componentData;
		return this.measurePerformance("Beak2 (HTML2)", "component", () => {
			return beak2ComponentRender(standardData);
		});
	}

	async benchmarkBeak2CompiledComponent() {
		const { standardData } = this.componentData;
		return this.measurePerformance("Beak2 Compiled", "component", () => {
			return beak2CompiledComponentRender(standardData);
		});
	}

	async benchmarkEJSComponent() {
		const template = this.loadTemplate("templates/component/ejs.ejs");
		const { standardData } = this.componentData;
		return this.measurePerformance("EJS", "component", () => {
			return ejs.render(template, standardData, { cache: false });
		});
	}

	async benchmarkEtaComponent() {
		const { standardData } = this.componentData;
		return this.measurePerformance("Eta", "component", () => {
			return this.eta.render("component/eta.eta", standardData);
		});
	}

	async benchmarkHandlebarsComponent() {
		const template = Handlebars.compile(
			this.loadTemplate("templates/component/handlebars.hbs"),
		);
		const { standardData } = this.componentData;
		return this.measurePerformance("Handlebars", "component", () => {
			return template(standardData);
		});
	}

	async benchmarkMustacheComponent() {
		const template = this.loadTemplate("templates/component/mustache.mustache");
		const { mustacheData } = this.componentData;
		return this.measurePerformance("Mustache", "component", () => {
			return Mustache.render(template, mustacheData);
		});
	}

	async benchmarkNunjucksComponent() {
		const { standardData } = this.componentData;
		return this.measurePerformance("Nunjucks", "component", () => {
			return this.nunjucksEnv.render("component/nunjucks.njk", standardData);
		});
	}

	async benchmarkPugComponent() {
		const template = pug.compileFile("templates/component/pug.pug", {
			cache: false,
		});
		const { standardData } = this.componentData;
		return this.measurePerformance("Pug", "component", () => {
			return template(standardData);
		});
	}

	async benchmarkDoTComponent() {
		const templateStr = this.loadTemplate("templates/component/dot.dot");
		const template = doT.template(templateStr, this.dotSettings);
		const { standardData } = this.componentData;
		return this.measurePerformance("doT", "component", () => {
			return template(standardData);
		});
	}

	async benchmarkLiquidComponent() {
		const { standardData } = this.componentData;
		return this.measurePerformance("Liquid", "component", () => {
			return this.liquid.renderFile("component/liquid.liquid", standardData);
		});
	}

	// Complex benchmarks
	async benchmarkBeakComplex() {
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Beak (RavenJS)", "complex", () => {
			return beakComplexRender(baseData);
		});
	}

	async benchmarkBeak2Complex() {
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Beak2 (HTML2)", "complex", () => {
			return beak2ComplexRender(baseData);
		});
	}

	async benchmarkBeak2CompiledComplex() {
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Beak2 Compiled", "complex", () => {
			return beak2CompiledComplexRender(baseData);
		});
	}

	async benchmarkEJSComplex() {
		const template = this.loadTemplate("templates/complex/ejs.ejs");
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("EJS", "complex", () => {
			return ejs.render(template, baseData, { cache: false });
		});
	}

	async benchmarkEtaComplex() {
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Eta", "complex", () => {
			return this.eta.render("complex/eta.eta", baseData);
		});
	}

	async benchmarkHandlebarsComplex() {
		const template = Handlebars.compile(
			this.loadTemplate("templates/complex/handlebars.hbs"),
		);
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Handlebars", "complex", () => {
			return template(baseData);
		});
	}

	async benchmarkMustacheComplex() {
		const template = this.loadTemplate("templates/complex/mustache.mustache");
		const { mustacheData } = this.prepareComplexData();
		return this.measurePerformance("Mustache", "complex", () => {
			return Mustache.render(template, mustacheData);
		});
	}

	async benchmarkNunjucksComplex() {
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Nunjucks", "complex", () => {
			return this.nunjucksEnv.render("complex/nunjucks.njk", baseData);
		});
	}

	async benchmarkPugComplex() {
		const template = pug.compileFile("templates/complex/pug.pug", {
			cache: false,
		});
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Pug", "complex", () => {
			return template(baseData);
		});
	}

	async benchmarkDoTComplex() {
		const templateStr = this.loadTemplate("templates/complex/dot.dot");
		const template = doT.template(templateStr, this.dotSettings);
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("doT", "complex", () => {
			return template(baseData);
		});
	}

	async benchmarkLiquidComplex() {
		const { baseData } = this.prepareComplexData();
		return this.measurePerformance("Liquid", "complex", () => {
			return this.liquid.renderFile("complex/liquid.liquid", baseData);
		});
	}

	async runAllBenchmarks() {
		console.log("🚀 Starting Three-Tiered Template Engine Benchmark...");
		console.log(
			`📊 Running ${this.iterations} iterations per engine/category with ${this.warmupRuns} warmup runs`,
		);
		console.log();

		const categories = [
			{
				name: "Baseline",
				description: "Static string rendering - measures pure engine overhead",
				dataSize: "No dynamic data",
				benchmarks: [
					() => this.benchmarkBeakBaseline(),
					() => this.benchmarkBeak2Baseline(),
					() => this.benchmarkBeak2CompiledBaseline(),
					() => this.benchmarkEJSBaseline(),
					() => this.benchmarkEtaBaseline(),
					() => this.benchmarkHandlebarsBaseline(),
					() => this.benchmarkMustacheBaseline(),
					() => this.benchmarkNunjucksBaseline(),
					() => this.benchmarkPugBaseline(),
					() => this.benchmarkDoTBaseline(),
					() => this.benchmarkLiquidBaseline(),
				],
			},
			{
				name: "Component",
				description:
					"Product list with loops, conditionals - typical component complexity",
				dataSize: `${this.componentData.standardData.products.length} products with attributes`,
				benchmarks: [
					() => this.benchmarkBeakComponent(),
					() => this.benchmarkBeak2Component(),
					() => this.benchmarkBeak2CompiledComponent(),
					() => this.benchmarkEJSComponent(),
					() => this.benchmarkEtaComponent(),
					() => this.benchmarkHandlebarsComponent(),
					() => this.benchmarkMustacheComponent(),
					() => this.benchmarkNunjucksComponent(),
					() => this.benchmarkPugComponent(),
					() => this.benchmarkDoTComponent(),
					() => this.benchmarkLiquidComponent(),
				],
			},
			{
				name: "Complex",
				description: "Full blog application - real-world complexity",
				dataSize: `${this.complexData.posts.length} blog posts with full metadata`,
				benchmarks: [
					() => this.benchmarkBeakComplex(),
					() => this.benchmarkBeak2Complex(),
					() => this.benchmarkBeak2CompiledComplex(),
					() => this.benchmarkEJSComplex(),
					() => this.benchmarkEtaComplex(),
					() => this.benchmarkHandlebarsComplex(),
					() => this.benchmarkMustacheComplex(),
					() => this.benchmarkNunjucksComplex(),
					() => this.benchmarkPugComplex(),
					() => this.benchmarkDoTComplex(),
					() => this.benchmarkLiquidComplex(),
				],
			},
		];

		for (const category of categories) {
			console.log(`\n📋 ${category.name} Benchmarks`);
			console.log(`   ${category.description}`);
			console.log(`   Data: ${category.dataSize}`);
			console.log();

			for (const benchmark of category.benchmarks) {
				try {
					const result = await benchmark();
					if (result) {
						this.results.set(`${result.name}_${result.category}`, result);
						console.log(
							`   ✅ ${result.name}: ${result.avgTime.toFixed(2)}ms avg, ${result.rendersPerSecond.toFixed(0)} renders/sec`,
						);
					}
				} catch (error) {
					console.error(
						`   ❌ ${benchmark.name || "Unknown"} failed:`,
						error.message,
					);
				}
			}
		}

		return this.results;
	}

	generateReport() {
		const categories = ["baseline", "component", "complex"];
		const categoryData = new Map();

		// Group results by category
		for (const category of categories) {
			const categoryResults = Array.from(this.results.values())
				.filter((result) => result.category === category)
				.sort((a, b) => a.avgTime - b.avgTime);
			categoryData.set(category, categoryResults);
		}

		let report = `# Three-Tiered Template Engine Benchmark Results\n\n`;
		report += `**Generated:** ${new Date().toISOString()}\n`;
		report += `**Test Environment:** Node.js ${process.version}\n`;
		report += `**Iterations:** ${this.iterations} renders per engine per category\n\n`;

		report += `## Benchmark Categories\n\n`;
		report += `This benchmark tests template engines across three complexity levels:\n\n`;
		report += `1. **Baseline** - Static string rendering to measure pure engine overhead\n`;
		report += `2. **Component** - Product list with loops, conditionals, and data processing\n`;
		report += `3. **Complex** - Full blog application with ${this.complexData.posts.length} posts and rich metadata\n\n`;

		// Generate tables for each category
		for (const category of categories) {
			const results = categoryData.get(category);
			if (results.length === 0) continue;

			const fastest = results[0];
			const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

			report += `## ${categoryName} Benchmark Results\n\n`;

			if (category === "baseline") {
				report += `Measures pure template engine overhead with static HTML content.\n`;
				report += `**Data complexity:** No dynamic data\n\n`;
			} else if (category === "component") {
				report += `Tests typical component rendering with loops, conditionals, and data processing.\n`;
				report += `**Data complexity:** ${this.componentData.standardData.products.length} products with categories, pricing, ratings\n\n`;
			} else {
				report += `Full application complexity with comprehensive data processing and transformations.\n`;
				report += `**Data complexity:** ${this.complexData.posts.length} blog posts with authors, categories, tags, pagination\n\n`;
			}

			report += `| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |\n`;
			report += `|------|--------|---------------|-------------|------------|\n`;

			results.forEach((result, index) => {
				const speedRatio = result.avgTime / fastest.avgTime;
				const speedText =
					index === 0 ? "baseline" : `${speedRatio.toFixed(2)}x slower`;

				report += `| ${index + 1} | **${result.name}** | ${result.avgTime.toFixed(2)} | ${Math.round(result.rendersPerSecond)} | ${speedText} |\n`;
			});

			report += `\n`;
		}

		// Cross-category analysis
		report += `## Performance Analysis\n\n`;

		report += `### Engine Scaling Patterns\n\n`;
		for (const category of categories) {
			const results = categoryData.get(category);
			if (results.length > 0) {
				const fastest = results[0];
				const slowest = results[results.length - 1];
				const categoryName =
					category.charAt(0).toUpperCase() + category.slice(1);

				report += `**${categoryName}:** ${fastest.name} leads at ${fastest.avgTime.toFixed(2)}ms, `;
				report += `${(slowest.avgTime / fastest.avgTime).toFixed(1)}x performance spread\n`;
			}
		}

		report += `\n### Why This Matters\n\n`;
		report += `- **Baseline** reveals engine startup costs and core overhead\n`;
		report += `- **Component** shows real-world single-component performance\n`;
		report += `- **Complex** demonstrates full application scaling behavior\n\n`;
		report += `Engines that maintain relative performance across categories handle complexity well.\n`;
		report += `Large performance drops from baseline to complex indicate poor algorithmic scaling.\n\n`;

		// Test environment
		report += `## Test Environment\n\n`;
		report += `- **Node.js Version:** ${process.version}\n`;
		report += `- **Platform:** ${process.platform} ${process.arch}\n`;
		report += `- **Caching:** Disabled for all engines to ensure fair comparison\n`;
		report += `- **Warmup:** ${this.warmupRuns} iterations before measurement\n`;
		report += `- **Measurement:** ${this.iterations} timed iterations per engine per category\n\n`;

		report += `---\n\n`;
		report += `*Benchmark generated with the RavenJS renderer-benchmark package*\n`;

		return report;
	}

	async run() {
		await this.runAllBenchmarks();
		const report = this.generateReport();

		fs.writeFileSync("BENCHMARK.md", report);
		console.log(
			"\n📊 Three-tiered benchmark complete! Results saved to BENCHMARK.md",
		);

		return this.results;
	}
}

// Run benchmark if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const runner = new BenchmarkRunner();
	await runner.run();
}
