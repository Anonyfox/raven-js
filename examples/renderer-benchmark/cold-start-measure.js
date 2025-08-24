#!/usr/bin/env node
/**
 * Cold start measurement for template engines
 * Measures time from fresh engine creation to first successful render
 */

import { performance } from "node:perf_hooks";
import { generateTemplateData } from "./data.js";

// Get engine name from command line argument
const engineName = process.argv[2];
if (!engineName) {
	console.error("Usage: node cold-start-measure.js <engine-name>");
	process.exit(1);
}

// Complex template data for realistic measurement
const complexData = generateTemplateData();

async function measureColdStart(engine) {
	const iterations = 10; // Multiple measurements for accuracy
	const times = [];

	for (let i = 0; i < iterations; i++) {
		// Force garbage collection if available to ensure clean slate
		if (global.gc) {
			global.gc();
		}

		const startTime = performance.now();

		try {
			let result;

			switch (engine) {
				case "beak":
					{
						// Fresh import to avoid module caching effects
						await import("@raven-js/beak");
						const { renderBlogPage } = await import(
							"./templates/complex/beak.js"
						);
						result = renderBlogPage(complexData);
					}
					break;

				case "beak2":
					{
						await import("@raven-js/beak/core/html2");
						const { renderBlogPage } = await import(
							"./templates/complex/beak2.js"
						);
						result = renderBlogPage(complexData);
					}
					break;

				case "beak2-compiled":
					{
						await import("@raven-js/beak/core/html2");
						const { renderBlogPage } = await import(
							"./templates/complex/beak2-compiled.js"
						);
						result = renderBlogPage(complexData);
					}
					break;

				case "dot":
					{
						const doT = (await import("dot")).default;
						const fs = await import("node:fs");
						const template = fs.readFileSync(
							"./templates/complex/dot.dot",
							"utf8",
						);
						const compiled = doT.template(template);
						result = compiled(complexData);
					}
					break;

				case "ejs":
					{
						const ejs = (await import("ejs")).default;
						const fs = await import("node:fs");
						const template = fs.readFileSync(
							"./templates/complex/ejs.ejs",
							"utf8",
						);
						result = ejs.render(template, complexData);
					}
					break;

				case "eta":
					{
						const { Eta } = await import("eta");
						const path = await import("node:path");
						const eta = new Eta({
							views: path.join(process.cwd(), "templates"),
							cache: false,
						});
						result = eta.render("complex/eta.eta", complexData);
					}
					break;

				case "handlebars":
					{
						const Handlebars = (await import("handlebars")).default;
						const fs = await import("node:fs");

						// Register required helpers
						Handlebars.registerHelper("gt", (a, b) => a > b);
						Handlebars.registerHelper("gte", (a, b) => a >= b);
						Handlebars.registerHelper("lt", (a, b) => a < b);
						Handlebars.registerHelper("lte", (a, b) => a <= b);
						Handlebars.registerHelper("add", (a, b) => a + b);
						Handlebars.registerHelper("subtract", (a, b) => a - b);
						Handlebars.registerHelper("multiply", (a, b) => a * b);
						Handlebars.registerHelper("formatDate", (date) =>
							date.toLocaleDateString(),
						);
						Handlebars.registerHelper("formatNumber", (num) =>
							num.toLocaleString(),
						);
						Handlebars.registerHelper("ifEquals", function (a, b, options) {
							return a === b ? options.fn(this) : options.inverse(this);
						});
						Handlebars.registerHelper("isRecent", (date) => {
							return (
								Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000
							);
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
						Handlebars.registerHelper("urlEncode", (str) =>
							encodeURIComponent(str),
						);
						Handlebars.registerHelper("split", (str, delimiter) =>
							str.split(delimiter),
						);
						Handlebars.registerHelper("formatShort", (num) =>
							Math.round(num / 1000),
						);
						Handlebars.registerHelper("tagSize", (count) =>
							Math.min(1.2 + count * 0.1, 2),
						);

						const template = fs.readFileSync(
							"./templates/complex/handlebars.hbs",
							"utf8",
						);
						const compiled = Handlebars.compile(template);
						result = compiled(complexData);
					}
					break;

				case "liquid":
					{
						const { Liquid } = await import("liquidjs");
						const fs = await import("node:fs");
						const engine = new Liquid();
						const template = fs.readFileSync(
							"./templates/complex/liquid.liquid",
							"utf8",
						);
						result = engine.parseAndRenderSync(template, complexData);
					}
					break;

				case "mustache":
					{
						const Mustache = (await import("mustache")).default;
						const fs = await import("node:fs");
						const template = fs.readFileSync(
							"./templates/complex/mustache.mustache",
							"utf8",
						);
						// Mustache needs pre-formatted data
						const mustacheData = {
							...complexData,
							posts: complexData.posts.map((post) => ({
								...post,
								hasCategories: post.categories && post.categories.length > 0,
								categoryList: post.categories
									? post.categories.map((cat) => ({ name: cat }))
									: [],
								hasAuthor: !!post.author,
								hasExcerpt: !!post.excerpt,
							})),
						};
						result = Mustache.render(template, mustacheData);
					}
					break;

				case "nunjucks":
					{
						const nunjucks = (await import("nunjucks")).default;
						const fs = await import("node:fs");

						// Create environment and add filters
						const env = new nunjucks.Environment();
						env.addFilter("number", (num) => num.toLocaleString());
						env.addFilter("date", (date, format) => {
							if (format === "iso") {
								return new Date(date).toISOString();
							}
							return new Date(date).toLocaleDateString();
						});
						env.addFilter("urlencode", (str) => encodeURIComponent(str));

						const template = fs.readFileSync(
							"./templates/complex/nunjucks.njk",
							"utf8",
						);
						result = env.renderString(template, complexData);
					}
					break;

				case "pug":
					{
						const pug = (await import("pug")).default;
						const fs = await import("node:fs");
						const template = fs.readFileSync(
							"./templates/complex/pug.pug",
							"utf8",
						);
						const compiled = pug.compile(template);
						result = compiled(complexData);
					}
					break;

				default:
					throw new Error(`Unknown engine: ${engine}`);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Verify we got a valid result
			if (!result || typeof result !== "string" || result.length < 100) {
				throw new Error(
					`Invalid result from ${engine}: ${typeof result}, length: ${result?.length}`,
				);
			}

			times.push(duration);
		} catch (error) {
			console.error(`Error measuring ${engine}:`, error.message);
			return null;
		}
	}

	// Calculate statistics
	times.sort((a, b) => a - b);
	const min = times[0];
	const max = times[times.length - 1];
	const median = times[Math.floor(times.length / 2)];
	const avg = times.reduce((sum, time) => sum + time, 0) / times.length;

	return {
		engine,
		iterations,
		times,
		min,
		max,
		median,
		avg,
	};
}

// Main execution
const result = await measureColdStart(engineName);

if (result) {
	// Output JSON for programmatic parsing
	console.log(JSON.stringify(result, null, 2));
} else {
	process.exit(1);
}
