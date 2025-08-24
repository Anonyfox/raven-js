#!/usr/bin/env node
/**
 * Cold start benchmark runner for all template engines
 * Measures startup overhead from fresh engine creation to first render
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

// Template engines to benchmark
const engines = [
	"beak",
	"dot",
	"ejs",
	"eta",
	"handlebars",
	"liquid",
	"mustache",
	"nunjucks",
	"pug",
];

// Known warm render times (from main benchmark) to calculate overhead
const warmRenderTimes = {
	beak: 0.75,
	dot: 0.12,
	ejs: 1.94,
	eta: 0.21,
	handlebars: 1.29,
	liquid: 3.84,
	mustache: 0.65,
	nunjucks: 2.6,
	pug: 0.18,
};

async function runColdStartMeasurement(engine) {
	return new Promise((resolve, reject) => {
		console.log(`🧊 Measuring cold start for ${engine}...`);

		// Run in isolated Node.js process for true cold start
		const child = spawn(
			"node",
			["--expose-gc", "cold-start-measure.js", engine],
			{
				stdio: ["pipe", "pipe", "pipe"],
				cwd: process.cwd(),
			},
		);

		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		child.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		// Set timeout to prevent hanging
		const timeout = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error(`Timeout measuring ${engine}`));
		}, 30000); // 30 second timeout

		child.on("close", (code) => {
			clearTimeout(timeout);

			if (code === 0) {
				try {
					const result = JSON.parse(stdout.trim());

					// Calculate startup overhead by subtracting known warm time
					const warmTime = warmRenderTimes[engine] || 0;
					const startupOverhead = Math.max(0, result.avg - warmTime);

					resolve({
						...result,
						warmTime,
						startupOverhead,
					});
				} catch (error) {
					reject(
						new Error(`Failed to parse result for ${engine}: ${error.message}`),
					);
				}
			} else {
				reject(new Error(`Process failed for ${engine}: ${stderr}`));
			}
		});

		child.on("error", (error) => {
			clearTimeout(timeout);
			reject(
				new Error(`Failed to start process for ${engine}: ${error.message}`),
			);
		});
	});
}

function formatMs(ms) {
	if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
	if (ms < 10) return `${ms.toFixed(2)}ms`;
	if (ms < 100) return `${ms.toFixed(1)}ms`;
	return `${ms.toFixed(0)}ms`;
}

function generateColdStartTable(results) {
	console.log("\n🧊 Cold Start Results:\n");

	// Sort by startup overhead (ascending)
	const sortedResults = results
		.filter((r) => r.success)
		.sort((a, b) => a.data.startupOverhead - b.data.startupOverhead);

	const fastest = sortedResults[0]?.data.startupOverhead || 1;

	const tableRows = sortedResults.map((result, index) => {
		const data = result.data;
		const ratio = data.startupOverhead / fastest;
		const ratioText = ratio === 1 ? "baseline" : `${ratio.toFixed(2)}x slower`;

		return `| ${index + 1} | **${data.engine}** | ${formatMs(data.avg)} | ${formatMs(data.warmTime)} | ${formatMs(data.startupOverhead)} | ${ratioText} |`;
	});

	const table = [
		"## Cold Start Performance",
		"",
		"Startup overhead from fresh engine creation to first render completion:",
		"",
		"| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |",
		"|------|--------|------------|-----------|------------------|------------|",
		...tableRows,
		"",
		"### Cold Start Analysis",
		"",
		"- **Cold Start**: Total time from fresh engine instantiation to first render",
		"- **Warm Time**: Known warm render time from performance benchmark",
		"- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)",
		"",
		"Lower startup overhead indicates faster serverless cold starts and development builds.",
	].join("\n");

	return table;
}

async function main() {
	console.log("🚀 Starting cold start benchmark...\n");

	const results = [];

	// Run measurements for each engine
	for (const engine of engines) {
		try {
			const result = await runColdStartMeasurement(engine);
			results.push({ engine, success: true, data: result });
			console.log(
				`✅ ${engine}: ${formatMs(result.avg)} (${formatMs(result.startupOverhead)} overhead)`,
			);
		} catch (error) {
			console.error(`❌ ${engine}: ${error.message}`);
			results.push({ engine, success: false, error: error.message });
		}
	}

	// Generate results table
	const coldStartTable = generateColdStartTable(results);
	console.log(coldStartTable);

	// Save results
	writeFileSync("cold-start-results.json", JSON.stringify(results, null, 2));
	writeFileSync("cold-start-table.md", coldStartTable);

	console.log("\n✅ Cold start benchmark complete!");
	console.log(
		"📄 Results saved to cold-start-results.json and cold-start-table.md",
	);

	// Return results for integration
	return { results, table: coldStartTable };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error);
}

export { main as runColdStartBenchmark };
