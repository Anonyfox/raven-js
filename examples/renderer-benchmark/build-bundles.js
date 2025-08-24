#!/usr/bin/env node

/**
 * Bundle size measurement for template engines using esbuild
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

// Frameworks to benchmark (using complex templates)
const frameworks = {
	beak: {
		entry: "templates/complex/beak.js",
		external: ["@raven-js/beak"],
	},
	dot: {
		entry: "bundles/dot-entry.js",
		external: [],
	},
	ejs: {
		entry: "bundles/ejs-entry.js",
		external: [],
	},
	eta: {
		entry: "bundles/eta-entry.js",
		external: [],
	},
	handlebars: {
		entry: "bundles/handlebars-entry.js",
		external: [],
	},
	liquid: {
		entry: "bundles/liquid-entry.js",
		external: [],
	},
	mustache: {
		entry: "bundles/mustache-entry.js",
		external: [],
	},
	nunjucks: {
		entry: "bundles/nunjucks-entry.js",
		external: [],
	},
	pug: {
		entry: "bundles/pug-entry.js",
		external: [],
	},
};

// Create bundles directory
try {
	mkdirSync("bundles", { recursive: true });
} catch {
	// Directory might already exist
}

// Create bundle measurement results
const results = {};

async function measureBundle(name, config) {
	console.log(`📦 Bundling ${name}...`);

	try {
		// Regular bundle
		await build({
			entryPoints: [config.entry],
			bundle: true,
			format: "esm",
			platform: "node",
			target: "es2022",
			external: config.external,
			outfile: `bundles/${name}.bundle.js`,
			metafile: true,
			write: true,
		});

		// Minified bundle
		await build({
			entryPoints: [config.entry],
			bundle: true,
			format: "esm",
			platform: "node",
			target: "es2022",
			external: config.external,
			outfile: `bundles/${name}.bundle.min.js`,
			minify: true,
			metafile: true,
			write: true,
		});

		// Read files for size measurement
		const bundleCode = readFileSync(`bundles/${name}.bundle.js`);
		const minCode = readFileSync(`bundles/${name}.bundle.min.js`);

		// Create gzipped versions
		const bundleGz = gzipSync(bundleCode);
		const minGz = gzipSync(minCode);

		writeFileSync(`bundles/${name}.bundle.js.gz`, bundleGz);
		writeFileSync(`bundles/${name}.bundle.min.js.gz`, minGz);

		results[name] = {
			bundle: bundleCode.length,
			minified: minCode.length,
			gzipped: bundleGz.length,
			minGzipped: minGz.length,
		};

		console.log(
			`✅ ${name}: ${bundleCode.length}b → ${minCode.length}b → ${minGz.length}b (gzipped)`,
		);
	} catch (error) {
		console.error(`❌ Failed to bundle ${name}:`, error.message);
		results[name] = { error: error.message };
	}
}

function formatBytes(bytes) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function generateSizeTable() {
	console.log("\n📊 Bundle Size Results:\n");

	const tableRows = Object.entries(results)
		.filter(([, data]) => !data.error)
		.sort((a, b) => a[1].minGzipped - b[1].minGzipped)
		.map(([name, data], index) => {
			const minGzSize = data.minGzipped;
			const smallest = Math.min(
				...Object.values(results).map((r) => r.minGzipped || Infinity),
			);
			const ratio = minGzSize / smallest;

			return `| ${index + 1} | **${name}** | ${formatBytes(data.bundle)} | ${formatBytes(data.minified)} | ${formatBytes(data.minGzipped)} | ${ratio === 1 ? "baseline" : `${ratio.toFixed(2)}x larger`} |`;
		});

	const table = [
		"## Bundle Size Comparison",
		"",
		"Bundle sizes for complex templates (minified + gzipped for production deployment):",
		"",
		"| Rank | Engine | Bundle | Minified | Min+Gzip | vs Smallest |",
		"|------|--------|--------|----------|----------|-------------|",
		...tableRows,
	].join("\n");

	return table;
}

// Create entry point files for non-JS template engines
function createEntryPoints() {
	// Read template contents at build time
	const dotTemplate = readFileSync("./templates/complex/dot.dot", "utf8");
	const ejsTemplate = readFileSync("./templates/complex/ejs.ejs", "utf8");
	const etaTemplate = readFileSync("./templates/complex/eta.eta", "utf8");
	const handlebarsTemplate = readFileSync(
		"./templates/complex/handlebars.hbs",
		"utf8",
	);
	const liquidTemplate = readFileSync(
		"./templates/complex/liquid.liquid",
		"utf8",
	);
	const mustacheTemplate = readFileSync(
		"./templates/complex/mustache.mustache",
		"utf8",
	);
	const nunjucksTemplate = readFileSync(
		"./templates/complex/nunjucks.njk",
		"utf8",
	);
	const pugTemplate = readFileSync("./templates/complex/pug.pug", "utf8");

	// DOT template entry
	writeFileSync(
		"bundles/dot-entry.js",
		`
import doT from 'dot';
import { generateTemplateData } from '../data.js';

const template = ${JSON.stringify(dotTemplate)};
const compiled = doT.template(template);
const data = generateTemplateData();

// Export render function
export function render() {
  return compiled(data);
}

// Ensure it runs
render();
`,
	);

	// EJS template entry
	writeFileSync(
		"bundles/ejs-entry.js",
		`
import ejs from 'ejs';
import { generateTemplateData } from '../data.js';

const template = ${JSON.stringify(ejsTemplate)};
const data = generateTemplateData();

// Export render function
export function render() {
  return ejs.render(template, data);
}

// Ensure it runs
render();
`,
	);

	// Eta template entry
	writeFileSync(
		"bundles/eta-entry.js",
		`
import { Eta } from 'eta';
import { generateTemplateData } from '../data.js';

const eta = new Eta();
const template = ${JSON.stringify(etaTemplate)};
const compiled = eta.compile(template);
const data = generateTemplateData();

// Export render function
export function render() {
  return compiled(data, eta);
}

// Ensure it runs
render();
`,
	);

	// Handlebars template entry
	writeFileSync(
		"bundles/handlebars-entry.js",
		`
import Handlebars from 'handlebars';
import { generateTemplateData } from '../data.js';

const template = ${JSON.stringify(handlebarsTemplate)};
const compiled = Handlebars.compile(template);
const data = generateTemplateData();

// Export render function
export function render() {
  return compiled(data);
}

// Ensure it runs
render();
`,
	);

	// Liquid template entry
	writeFileSync(
		"bundles/liquid-entry.js",
		`
import { Liquid } from 'liquidjs';
import { generateTemplateData } from '../data.js';

const engine = new Liquid();
const template = ${JSON.stringify(liquidTemplate)};
const data = generateTemplateData();

// Export render function
export function render() {
  return engine.parseAndRenderSync(template, data);
}

// Ensure it runs
render();
`,
	);

	// Mustache template entry
	writeFileSync(
		"bundles/mustache-entry.js",
		`
import Mustache from 'mustache';
import { generateTemplateData } from '../data.js';

const template = ${JSON.stringify(mustacheTemplate)};
const data = generateTemplateData();

// Export render function
export function render() {
  return Mustache.render(template, data);
}

// Ensure it runs
render();
`,
	);

	// Nunjucks template entry
	writeFileSync(
		"bundles/nunjucks-entry.js",
		`
import nunjucks from 'nunjucks';
import { generateTemplateData } from '../data.js';

const template = ${JSON.stringify(nunjucksTemplate)};
const data = generateTemplateData();

// Export render function
export function render() {
  return nunjucks.renderString(template, data);
}

// Ensure it runs
render();
`,
	);

	// Pug template entry
	writeFileSync(
		"bundles/pug-entry.js",
		`
import pug from 'pug';
import { generateTemplateData } from '../data.js';

const template = ${JSON.stringify(pugTemplate)};
const compiled = pug.compile(template);
const data = generateTemplateData();

// Export render function
export function render() {
  return compiled(data);
}

// Ensure it runs
render();
`,
	);

	console.log("📝 Created entry point files for template engines");
}

// Main execution
async function main() {
	console.log("🚀 Starting bundle size measurement...\n");

	// Create entry point files for template engines
	createEntryPoints();

	// Bundle each framework
	for (const [name, config] of Object.entries(frameworks)) {
		await measureBundle(name, config);
	}

	// Generate size comparison table
	const sizeTable = generateSizeTable();
	console.log(sizeTable);

	// Write results to JSON for programmatic access
	writeFileSync("bundle-sizes.json", JSON.stringify(results, null, 2));
	writeFileSync("bundle-size-table.md", sizeTable);

	console.log("\n✅ Bundle analysis complete!");
	console.log("📄 Results saved to bundle-sizes.json and bundle-size-table.md");
}

main().catch(console.error);
